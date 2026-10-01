package com.cafedebarrio.cafedebarrio.service;


import com.cafedebarrio.cafedebarrio.dto.ApiDtos.*;
import com.cafedebarrio.cafedebarrio.entity.*;
import com.cafedebarrio.cafedebarrio.repository.*;
import com.cafedebarrio.cafedebarrio.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class ProductService {
    private final ProductRepository products;
    private final CategoryRepository categories;
    public PageView<ProductView> list(Long category, Boolean available, Boolean active, int page, int size) {
        Specification<Product> spec=(root,q,cb) -> {
            var predicates=new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if(category!=null) predicates.add(cb.equal(root.get("category").get("id"), category));
            if(active!=null) predicates.add(cb.equal(root.get("active"), active));
            if(available!=null) predicates.add(available ? cb.greaterThan(root.get("stock"),0) : cb.equal(root.get("stock"),0));
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        var result=products.findAll(spec, PageRequest.of(page,size,Sort.by("id")));
        return new PageView<>(result.getContent().stream().map(ProductView::of).toList(),page,size,result.getTotalElements(),result.getTotalPages());
    }
    public ProductView get(Long id, boolean admin) {
        Product p=products.findById(id).orElseThrow(() -> ApiException.missing("Producto"));
        if(!admin && !p.isActive()) throw ApiException.missing("Producto");
        return ProductView.of(p);
    }
    public ProductView getPublic(java.util.UUID reference) {
        return ProductView.of(products.findByPublicIdAndActiveTrue(reference.toString())
            .orElseThrow(() -> ApiException.missing("Producto")));
    }
    @Transactional
    public ProductView save(Long id, ProductInput input) {
        Product p=id==null ? new Product() : products.findLocked(id).orElseThrow(() -> ApiException.missing("Producto"));
        p.setName(input.name().trim()); p.setDescription(input.description().trim());
        p.setPrice(input.price()); p.setStock(input.stock()); p.setImageUrl(input.imageUrl()); p.setActive(input.active());
        p.setCategory(categories.findById(input.categoryId()).orElseThrow(() -> ApiException.missing("Categoría")));
        return ProductView.of(products.save(p));
    }
    @Transactional
    public ProductView active(Long id, boolean active) {
        var p=products.findLocked(id).orElseThrow(() -> ApiException.missing("Producto")); p.setActive(active); return ProductView.of(p);
    }
}
