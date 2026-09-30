package com.cafedebarrio.cafedebarrio.controller;


import com.cafedebarrio.cafedebarrio.service.*;
import com.cafedebarrio.cafedebarrio.dto.ApiDtos.*;
import com.cafedebarrio.cafedebarrio.entity.OrderStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
@RestController @RequestMapping("/api/admin") @RequiredArgsConstructor
public class AdminController {
    private final ProductService products;
    private final OrderService orders;
    @GetMapping("/productos") public PageView<ProductView> products(
        @RequestParam(required=false) Long categoria, @RequestParam(required=false) Boolean activo,
        @RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {
        return products.list(categoria,null,activo,page,size);
    }
    @GetMapping("/productos/{id}") public ProductView product(@PathVariable Long id) { return products.get(id,true); }
    @PostMapping("/productos") @ResponseStatus(HttpStatus.CREATED)
    public ProductView create(@Valid @RequestBody ProductInput input) { return products.save(null,input); }
    @PutMapping("/productos/{id}") public ProductView update(@PathVariable Long id,@Valid @RequestBody ProductInput input) { return products.save(id,input); }
    @PatchMapping("/productos/{id}/activo") public ProductView active(@PathVariable Long id,@Valid @RequestBody ActiveInput input) { return products.active(id,input.active()); }
    @GetMapping("/pedidos") public PageView<OrderView> orders(
        @RequestParam(required=false) OrderStatus estado,@RequestParam(defaultValue="0") @Min(0) int page,
        @RequestParam(defaultValue="20") @Min(1) @Max(100) int size) { return orders.list(estado,page,size); }
    @GetMapping("/pedidos/{id}") public OrderView order(@PathVariable Long id) { return orders.get(id); }
    @PatchMapping("/pedidos/{id}/estado") public OrderView status(@PathVariable Long id,@Valid @RequestBody StatusInput input) { return orders.status(id,input.status()); }
}
