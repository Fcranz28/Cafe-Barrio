package com.cafedebarrio.cafedebarrio.entity;


import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
@Entity @Table(name="products") @Getter @Setter @NoArgsConstructor
public class Product {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, length=120) private String name;
    @Column(nullable=false, length=1500) private String description;
    @Column(nullable=false, precision=12, scale=2) private BigDecimal price;
    @Column(nullable=false) private Integer stock;
    @Column(name="image_url", length=1000) private String imageUrl;
    @Column(nullable=false) private boolean active=true;
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="category_id", nullable=false) private Category category;
}
