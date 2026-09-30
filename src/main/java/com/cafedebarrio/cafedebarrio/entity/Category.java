package com.cafedebarrio.cafedebarrio.entity;


import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="categories") @Getter @Setter @NoArgsConstructor
public class Category {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, unique=true, length=80) private String name;
}
