package com.cafedebarrio.cafedebarrio.controller;


import com.cafedebarrio.cafedebarrio.service.OrderService;
import com.cafedebarrio.cafedebarrio.dto.ApiDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import java.util.UUID;
@RestController @RequestMapping("/api/pedidos") @RequiredArgsConstructor
public class OrderController {
    private final OrderService orders;
    @PostMapping public ResponseEntity<OrderView> create(@Valid @RequestBody OrderInput input,
        @RequestHeader("Idempotency-Key") UUID key) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orders.create(input,key.toString()));
    }
}
