package com.cafedebarrio.cafedebarrio.service;


import com.cafedebarrio.cafedebarrio.dto.ApiDtos.*;
import com.cafedebarrio.cafedebarrio.entity.*;
import com.cafedebarrio.cafedebarrio.repository.OrderRepository;
import com.cafedebarrio.cafedebarrio.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.springframework.dao.DataIntegrityViolationException;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
@Service @RequiredArgsConstructor
public class OrderService {
    private final CheckoutService checkout;
    private final OrderRepository orders;
    private final OrderLookup lookup;
    public OrderView create(OrderInput input, String key) {
        String hash=fingerprint(input);
        try { return checkout.create(input,key,hash); }
        catch(DataIntegrityViolationException ex) {
            // The failed transaction has rolled back before consulting a competing request.
            return lookup.replay(key,hash).orElseThrow(() -> ex);
        }
    }
    private String fingerprint(OrderInput input) {
        var fields=List.of(input.customerName().trim(),input.phone().trim(),input.address().trim());
        var canonical=new StringBuilder();
        fields.forEach(s -> canonical.append(s.length()).append(':').append(s));
        var quantities=new TreeMap<Long,Integer>();
        input.items().forEach(i -> quantities.merge(i.productId(),i.quantity(),Integer::sum));
        quantities.forEach((id,qty) -> canonical.append('|').append(id).append(':').append(qty));
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(canonical.toString().getBytes(StandardCharsets.UTF_8))); }
        catch(NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }
    @Transactional(readOnly=true)
    public PageView<OrderView> list(OrderStatus status,int page,int size) {
        var pageable=PageRequest.of(page,size,Sort.by(Sort.Direction.DESC,"createdAt","id"));
        var result=status==null ? orders.findAll(pageable) : orders.findByStatus(status,pageable);
        return new PageView<>(result.getContent().stream().map(OrderView::of).toList(),page,size,result.getTotalElements(),result.getTotalPages());
    }
    @Transactional(readOnly=true)
    public OrderView get(Long id) { return OrderView.of(orders.findById(id).orElseThrow(() -> ApiException.missing("Pedido"))); }
    @Transactional
    public OrderView status(Long id,OrderStatus status) {
        var order=orders.findLocked(id).orElseThrow(() -> ApiException.missing("Pedido"));
        if(status!=order.getStatus() && status.ordinal()!=order.getStatus().ordinal()+1)
            throw ApiException.conflict("El pedido solo puede avanzar al siguiente estado");
        order.setStatus(status); return OrderView.of(order);
    }
}
