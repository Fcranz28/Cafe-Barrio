package com.cafedebarrio.cafedebarrio.controller;


import com.cafedebarrio.cafedebarrio.service.ProductService;
import com.cafedebarrio.cafedebarrio.repository.CategoryRepository;
import com.cafedebarrio.cafedebarrio.dto.ApiDtos.*;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api") @RequiredArgsConstructor
public class CatalogController {
    private final ProductService products;
    private final CategoryRepository categories;
    @GetMapping("/categorias") public List<CategoryView> categories() {
        return categories.findAll(org.springframework.data.domain.Sort.by("id")).stream().map(c -> new CategoryView(c.getId(),c.getName())).toList();
    }
    @GetMapping("/productos") public PageView<ProductView> list(
        @RequestParam(required=false) Long categoria, @RequestParam(required=false) Boolean disponible,
        @RequestParam(defaultValue="0") @Min(0) int page, @RequestParam(defaultValue="12") @Min(1) @Max(100) int size) {
        return products.list(categoria,disponible,true,page,size);
    }
    @GetMapping("/productos/{id}") public ProductView get(@PathVariable Long id) { return products.get(id,false); }
}
