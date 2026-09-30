package com.cafedebarrio.cafedebarrio.service;


import com.cafedebarrio.cafedebarrio.dto.ApiDtos.*;
import com.cafedebarrio.cafedebarrio.entity.*;
import com.cafedebarrio.cafedebarrio.repository.*;
import com.cafedebarrio.cafedebarrio.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;
@Service @RequiredArgsConstructor
public class CheckoutService {
    private final ProductRepository products;
    private final OrderRepository orders;
    @Transactional
    public OrderView create(OrderInput input, String key, String hash) {
        var existing=orders.findByRequestKey(key);
        if(existing.isPresent()) return replay(existing.get(),hash);
        Map<Long,Integer> quantities=new TreeMap<>();
        for(var i:input.items()) {
            int total=quantities.merge(i.productId(),i.quantity(),Integer::sum);
            if(total>999) throw ApiException.conflict("La cantidad máxima por producto es 999");
        }
        var locked=new ArrayList<Product>();
        // Always lock in id order to prevent deadlocks between competing checkouts.
        for(Long id:quantities.keySet()) locked.add(products.findLocked(id).orElseThrow(() -> ApiException.missing("Producto")));
        existing=orders.findByRequestKey(key);
        if(existing.isPresent()) return replay(existing.get(),hash);
        var order=new PurchaseOrder();
        order.setRequestKey(key); order.setRequestHash(hash);
        order.setCustomerName(input.customerName().trim()); order.setPhone(input.phone().trim()); order.setAddress(input.address().trim());
        BigDecimal total=BigDecimal.ZERO;
        for(var product:locked) {
            int qty=quantities.get(product.getId());
            if(!product.isActive()) throw ApiException.conflict(product.getName()+" ya no está disponible");
            if(product.getStock()<qty) throw ApiException.conflict("Stock insuficiente para "+product.getName()+". Disponible: "+product.getStock());
            var item=new OrderItem(); item.setProduct(product); item.setProductName(product.getName());
            item.setQuantity(qty); item.setUnitPrice(product.getPrice());
            item.setSubtotal(product.getPrice().multiply(BigDecimal.valueOf(qty)));
            order.addItem(item); total=total.add(item.getSubtotal()); product.setStock(product.getStock()-qty);
        }
        if(total.compareTo(new BigDecimal("9999999999.99"))>0)
            throw ApiException.conflict("El importe del pedido supera el máximo permitido");
        order.setTotal(total);
        return OrderView.of(orders.saveAndFlush(order));
    }
    public static OrderView replay(PurchaseOrder order, String hash) {
        if(!order.getRequestHash().equals(hash)) throw ApiException.conflict("Esta solicitud ya se utilizó para otro pedido");
        return OrderView.of(order);
    }
}
