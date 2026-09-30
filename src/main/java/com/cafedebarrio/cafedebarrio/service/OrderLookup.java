package com.cafedebarrio.cafedebarrio.service;


import com.cafedebarrio.cafedebarrio.repository.OrderRepository;
import com.cafedebarrio.cafedebarrio.dto.ApiDtos.OrderView;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
@Service @RequiredArgsConstructor
public class OrderLookup {
    private final OrderRepository orders;
    @Transactional(readOnly=true)
    public Optional<OrderView> replay(String key,String hash) { return orders.findByRequestKey(key).map(o -> CheckoutService.replay(o,hash)); }
}
