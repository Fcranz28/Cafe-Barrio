package com.cafedebarrio.cafedebarrio.service;

import com.cafedebarrio.cafedebarrio.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class CloudinaryServiceTests {
    private static final byte[] PNG = new byte[]{(byte)137,80,78,71,13,10,26,10,0,0,0,0};
    private static final String CONFIG = "cloudinary://test-key:test-secret@demo";

    @Test void uploadReturnsOnlyPublicReferences() {
        var builder = RestClient.builder();
        var server = MockRestServiceServer.bindTo(builder).build();
        var service = new CloudinaryService(CONFIG, builder);
        server.expect(requestTo("https://api.cloudinary.com/v1_1/demo/image/upload"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(header("Authorization", "Basic dGVzdC1rZXk6dGVzdC1zZWNyZXQ="))
            .andRespond(withSuccess("{\"secure_url\":\"https://res.cloudinary.com/demo/image/upload/test.png\",\"public_id\":\"test\"}", MediaType.APPLICATION_JSON));
        var result = service.upload(new MockMultipartFile("file", "test.png", "image/png", PNG));
        assertThat(result.imageUrl()).isEqualTo("https://res.cloudinary.com/demo/image/upload/test.png");
        assertThat(result.publicId()).isEqualTo("test");
        server.verify();
    }

    @Test void rejectsSpoofedAndOversizedFilesBeforeCallingCloudinary() {
        var service = new CloudinaryService("");
        assertThatThrownBy(() -> service.upload(new MockMultipartFile("file", "fake.png", "image/png", "<script>bad</script>".getBytes())))
            .isInstanceOf(ApiException.class).hasMessageContaining("JPEG, PNG o WebP");
        assertThatThrownBy(() -> service.upload(new MockMultipartFile("file", new byte[5 * 1024 * 1024 + 1])))
            .isInstanceOf(ApiException.class).hasMessageContaining("5 MB");
        assertThatThrownBy(() -> service.upload(new MockMultipartFile("file", PNG)))
            .isInstanceOf(ApiException.class).hasMessageContaining("no está configurado");
    }

    @Test void hidesUpstreamErrorsAndSecrets() {
        var builder = RestClient.builder();
        var server = MockRestServiceServer.bindTo(builder).build();
        var service = new CloudinaryService(CONFIG, builder);
        server.expect(requestTo("https://api.cloudinary.com/v1_1/demo/image/upload"))
            .andRespond(withForbiddenRequest().body("private upstream error test-secret"));
        assertThatThrownBy(() -> service.upload(new MockMultipartFile("file", PNG)))
            .isInstanceOf(ApiException.class).hasMessageContaining("permisos").hasMessageNotContaining("test-secret");
        server.verify();
        assertThatThrownBy(() -> new CloudinaryService("invalid-private-secret"))
            .isInstanceOf(IllegalStateException.class).hasMessageNotContaining("private-secret");
    }
}
