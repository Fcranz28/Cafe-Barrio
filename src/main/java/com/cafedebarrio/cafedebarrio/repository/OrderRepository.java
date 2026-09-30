package com.cafedebarrio.cafedebarrio.repository;


import com.cafedebarrio.cafedebarrio.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
public interface OrderRepository extends JpaRepository<PurchaseOrder, Long> {
    Optional<PurchaseOrder> findByRequestKey(String key);
    Page<PurchaseOrder> findByStatus(OrderStatus status, Pageable pageable);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from PurchaseOrder o where o.id=:id")
    Optional<PurchaseOrder> findLocked(@Param("id") Long id);
}
