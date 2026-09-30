package com.cafedebarrio.cafedebarrio.dto;


import com.cafedebarrio.cafedebarrio.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
public final class ApiDtos {
    private ApiDtos() {}
    public record CategoryView(Long id, String name) {}
    public record ProductInput(
        @NotBlank @Size(max=120) String name,
        @NotBlank @Size(max=1500) String description,
        @NotNull @DecimalMin("0.01") @DecimalMax("9999999999.99") @Digits(integer=10,fraction=2) BigDecimal price,
        @NotNull @Min(0) @Max(1000000) Integer stock,
        @Size(max=1000) @Pattern(regexp="^(https://[^\\s]+|/images/[a-zA-Z0-9._-]+|)$", message="Usa una URL HTTPS o una imagen local") String imageUrl,
        @NotNull @Positive Long categoryId, boolean active) {}
    public record ProductView(Long id, String name, String description, BigDecimal price,
        Integer stock, String imageUrl, boolean active, CategoryView category) {
        public static ProductView of(Product p) {
            return new ProductView(p.getId(), p.getName(), p.getDescription(), p.getPrice(), p.getStock(),
                p.getImageUrl(), p.isActive(), new CategoryView(p.getCategory().getId(), p.getCategory().getName()));
        }
    }
    public record ItemInput(@NotNull @Positive Long productId, @NotNull @Min(1) @Max(999) Integer quantity) {}
    public record OrderInput(
        @NotBlank @Size(max=120) String customerName,
        @NotBlank @Size(max=20) @Pattern(regexp="^(?=(?:[^0-9]*[0-9]){7,15}[^0-9]*$)\\+?[0-9][0-9 ()-]{6,19}$", message="Ingresa un celular válido") String phone,
        @NotBlank @Size(max=300) String address,
        @NotEmpty @Size(max=50) List<@Valid ItemInput> items) {}
    public record ItemView(Long productId, String productName, Integer quantity, BigDecimal unitPrice, BigDecimal subtotal) {}
    public record OrderView(Long id, String customerName, String phone, String address, Instant createdAt,
        OrderStatus status, BigDecimal total, List<ItemView> items) {
        public static OrderView of(PurchaseOrder o) {
            return new OrderView(o.getId(), o.getCustomerName(), o.getPhone(), o.getAddress(), o.getCreatedAt(),
                o.getStatus(), o.getTotal(), o.getItems().stream().map(i -> new ItemView(i.getProduct().getId(),
                    i.getProductName(), i.getQuantity(), i.getUnitPrice(), i.getSubtotal())).toList());
        }
    }
    public record StatusInput(@NotNull OrderStatus status) {}
    public record ActiveInput(@NotNull Boolean active) {}
    public record PageView<T>(List<T> content, int page, int size, long totalElements, int totalPages) {}
}
