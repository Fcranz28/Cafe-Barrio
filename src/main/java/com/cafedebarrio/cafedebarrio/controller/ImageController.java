package com.cafedebarrio.cafedebarrio.controller;

import com.cafedebarrio.cafedebarrio.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/imagenes")
@RequiredArgsConstructor
public class ImageController {
    private final CloudinaryService images;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public CloudinaryService.ImageView upload(@RequestParam("file") MultipartFile file) {
        return images.upload(file);
    }
}
