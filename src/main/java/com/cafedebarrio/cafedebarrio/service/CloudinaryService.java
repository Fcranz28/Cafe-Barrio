package com.cafedebarrio.cafedebarrio.service;

import com.cafedebarrio.cafedebarrio.exception.ApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Map;
import java.util.UUID;

@Service
public class CloudinaryService {
    public record ImageView(String imageUrl, String publicId) {}
    private static final int MAX_BYTES = 5 * 1024 * 1024;
    private final RestClient client;
    private final String cloud;

    @Autowired
    public CloudinaryService(@Value("${app.cloudinary.url}") String configuration) {
        this(configuration, builder());
    }

    CloudinaryService(String configuration, RestClient.Builder builder) {
        if (configuration.isBlank()) { client = null; cloud = null; return; }
        try {
            URI uri = URI.create(configuration);
            String[] credentials = uri.getUserInfo().split(":", 2);
            if (!"cloudinary".equals(uri.getScheme()) || !uri.getHost().matches("[a-z0-9_-]+") ||
                credentials.length != 2 || credentials[0].isBlank() || credentials[1].isBlank()) throw new IllegalArgumentException();
            cloud = uri.getHost();
            client = builder.baseUrl("https://api.cloudinary.com/v1_1/" + cloud)
                .defaultHeaders(headers -> headers.setBasicAuth(decode(credentials[0]), decode(credentials[1])))
                .build();
        } catch (RuntimeException ex) {
            // Never include the supplied URL or the original exception: they contain credentials.
            throw new IllegalStateException("CLOUDINARY_URL tiene un formato inválido");
        }
    }

    private static String decode(String value) { return URLDecoder.decode(value, StandardCharsets.UTF_8); }
    private static RestClient.Builder builder() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        return RestClient.builder().requestFactory(factory);
    }

    public ImageView upload(MultipartFile file) {
        if (file.isEmpty() || file.getSize() > MAX_BYTES)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selecciona una imagen de hasta 5 MB");
        byte[] bytes;
        try { bytes = file.getBytes(); }
        catch (IOException ex) { throw new ApiException(HttpStatus.BAD_REQUEST, "No se pudo leer la imagen"); }
        String extension = extension(bytes);
        if (extension == null) throw new ApiException(HttpStatus.BAD_REQUEST, "La imagen debe ser JPEG, PNG o WebP");
        if (client == null) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "El servicio de imágenes no está configurado");
        String id = "cafe-barrio/productos/" + UUID.randomUUID();
        var body = new LinkedMultiValueMap<String, Object>();
        body.add("file", new ByteArrayResource(bytes) {
            @Override public String getFilename() { return "image." + extension; }
        });
        body.add("public_id", id);
        body.add("overwrite", "false");
        try {
            Map<?, ?> result = client.post().uri("/image/upload").contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body).retrieve().body(Map.class);
            if (result == null || !(result.get("secure_url") instanceof String url) ||
                !url.startsWith("https://res.cloudinary.com/" + cloud + "/") ||
                !(result.get("public_id") instanceof String publicId)) throw new RestClientException("Invalid response");
            return new ImageView(url, publicId);
        } catch (RestClientException ex) {
            // Upstream response and credentials must not leak to clients/logs.
            throw new ApiException(HttpStatus.BAD_GATEWAY, "No se pudo subir la imagen. Revisa la conexión y los permisos de Cloudinary");
        }
    }

    private static String extension(byte[] bytes) {
        if (bytes.length < 12) return null;
        if ((bytes[0] & 255) == 255 && (bytes[1] & 255) == 216 && (bytes[2] & 255) == 255) return "jpg";
        if (Arrays.equals(Arrays.copyOf(bytes, 8), new byte[]{(byte)137,80,78,71,13,10,26,10})) return "png";
        if (new String(bytes, 0, 4, StandardCharsets.US_ASCII).equals("RIFF") &&
            new String(bytes, 8, 4, StandardCharsets.US_ASCII).equals("WEBP")) return "webp";
        return null;
    }
}
