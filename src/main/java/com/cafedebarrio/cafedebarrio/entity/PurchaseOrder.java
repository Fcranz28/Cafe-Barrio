package com.cafedebarrio.cafedebarrio.entity;


import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
@Entity @Table(name="purchase_orders") @Getter @Setter @NoArgsConstructor
public class PurchaseOrder {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="customer_name", nullable=false, length=120) private String customerName;
    @Column(nullable=false, length=20) private String phone;
    @Column(nullable=false, length=300) private String address;
    @Column(name="created_at", nullable=false, updatable=false) private Instant createdAt=Instant.now();
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30) private OrderStatus status=OrderStatus.PENDIENTE;
    @Column(nullable=false, precision=12, scale=2) private BigDecimal total;
    @Column(name="request_key", nullable=false, unique=true, length=36) private String requestKey;
    @Column(name="request_hash", nullable=false, length=64) private String requestHash;
    @OneToMany(mappedBy="order", cascade=CascadeType.ALL)
    @OrderBy("id ASC") private List<OrderItem> items=new ArrayList<>();
    public void addItem(OrderItem item) { items.add(item); item.setOrder(this); }
}
