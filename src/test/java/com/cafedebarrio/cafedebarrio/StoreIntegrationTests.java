package com.cafedebarrio.cafedebarrio;

import com.cafedebarrio.cafedebarrio.dto.ApiDtos.*;
import com.cafedebarrio.cafedebarrio.entity.OrderStatus;
import com.cafedebarrio.cafedebarrio.exception.ApiException;
import com.cafedebarrio.cafedebarrio.repository.*;
import com.cafedebarrio.cafedebarrio.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class StoreIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired OrderService service;
    @Autowired ProductService products;
    @Autowired JdbcTemplate jdbc;
    @Autowired OrderRepository orders;
    Long productId;

    @BeforeEach void reset() {
        jdbc.update("DELETE FROM order_items");
        jdbc.update("DELETE FROM purchase_orders");
        jdbc.update("UPDATE products SET stock=10, active=TRUE");
        productId=jdbc.queryForObject("SELECT MIN(id) FROM products",Long.class);
    }
    OrderInput input(int quantity) { return new OrderInput("Ana Pérez","987654321","Av. Principal 123",List.of(new ItemInput(productId,quantity))); }
    String key() { return UUID.randomUUID().toString(); }

    @Test void publicCatalogAndFilters() throws Exception {
        mvc.perform(get("/api/productos")).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].category.name").value("Café"));
        jdbc.update("UPDATE products SET active=FALSE WHERE id=?",productId);
        mvc.perform(get("/api/productos/"+productId)).andExpect(status().isNotFound());
        mvc.perform(get("/api/productos").param("page","-1")).andExpect(status().isBadRequest());
    }
    @Test void publicReferenceIsStableUniqueAndHidesInactiveProducts() throws Exception {
        var product = products.get(productId, true);
        assertThat(UUID.fromString(product.publicId()).version()).isEqualTo(4);
        assertThat(jdbc.queryForObject("SELECT COUNT(*)-COUNT(DISTINCT public_id) FROM products", Integer.class)).isZero();
        mvc.perform(get("/api/productos/referencia/" + product.publicId()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(productId));
        var edited = products.save(productId, new ProductInput(product.name(), product.description(), product.price(),
            product.stock(), product.imageUrl(), product.category().id(), product.active()));
        assertThat(edited.publicId()).isEqualTo(product.publicId());
        mvc.perform(get("/api/productos/referencia/" + UUID.randomUUID())).andExpect(status().isNotFound());
        mvc.perform(get("/api/productos/referencia/invalid")).andExpect(status().isBadRequest());
        products.active(productId, false);
        mvc.perform(get("/api/productos/referencia/" + product.publicId())).andExpect(status().isNotFound());
        mvc.perform(get("/api/admin/productos/" + productId)).andExpect(status().isUnauthorized());
    }
    @Test void imageUploadRequiresAdminCsrfAndValidImage() throws Exception {
        var file = new org.springframework.mock.web.MockMultipartFile("file", "fake.png", "image/png", "not an image".getBytes());
        mvc.perform(multipart("/api/admin/imagenes").file(file).with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(multipart("/api/admin/imagenes").file(file).with(user("admin").roles("ADMIN"))).andExpect(status().isForbidden());
        mvc.perform(multipart("/api/admin/imagenes").file(file).with(user("visitor").roles("USER")).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(multipart("/api/admin/imagenes").file(file).with(user("admin").roles("ADMIN")).with(csrf()))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("La imagen debe ser JPEG, PNG o WebP"));
    }
    @Test void orderUsesDatabasePricesAndSnapshot() {
        var order=service.create(input(2),key());
        assertThat(order.total()).isEqualByComparingTo("56.00");
        assertThat(jdbc.queryForObject("SELECT stock FROM products WHERE id=?",Integer.class,productId)).isEqualTo(8);
        jdbc.update("UPDATE products SET price=99, name='Nuevo nombre' WHERE id=?",productId);
        assertThat(service.get(order.id()).items().get(0).unitPrice()).isEqualByComparingTo("28.00");
        assertThat(service.get(order.id()).items().get(0).productName()).isEqualTo("Café de origen · Cusco");
        jdbc.update("UPDATE products SET price=28, name='Café de origen · Cusco' WHERE id=?",productId);
    }
    @Test void insufficientStockRollsBackEveryProduct() {
        Long other=jdbc.queryForObject("SELECT MAX(id) FROM products",Long.class);
        jdbc.update("UPDATE products SET stock=0 WHERE id=?",other);
        var request=new OrderInput("Ana","987654321","Dirección",List.of(new ItemInput(productId,2),new ItemInput(other,1)));
        assertThatThrownBy(()->service.create(request,key())).isInstanceOf(ApiException.class).hasMessageContaining("Stock insuficiente");
        assertThat(jdbc.queryForObject("SELECT stock FROM products WHERE id=?",Integer.class,productId)).isEqualTo(10);
        assertThat(orders.count()).isZero();
    }
    @Test void repeatedRequestDoesNotDoubleDiscount() {
        String key=key();var first=service.create(input(2),key);var replay=service.create(input(2),key);
        assertThat(replay.id()).isEqualTo(first.id());assertThat(orders.count()).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT stock FROM products WHERE id=?",Integer.class,productId)).isEqualTo(8);
        assertThatThrownBy(()->service.create(input(3),key)).isInstanceOf(ApiException.class);
    }
    @Test void duplicateItemsAreAggregatedBeforeCheckingStock() {
        var request=new OrderInput("Ana","987654321","Dirección",List.of(new ItemInput(productId,6),new ItemInput(productId,6)));
        assertThatThrownBy(()->service.create(request,key())).isInstanceOf(ApiException.class);
        assertThat(orders.count()).isZero();
    }
    @Test void inactiveProductCannotBeOrdered() {
        jdbc.update("UPDATE products SET active=FALSE WHERE id=?",productId);
        assertThatThrownBy(()->service.create(input(1),key())).isInstanceOf(ApiException.class);
    }
    @Test void competingPurchasesCannotOversell() throws Exception {
        jdbc.update("UPDATE products SET stock=1 WHERE id=?",productId);
        ExecutorService pool=Executors.newFixedThreadPool(2);
        var start=new CountDownLatch(1);
        Callable<Boolean> buy=()->{start.await();try{service.create(input(1),key());return true;}catch(ApiException ex){return false;}};
        try { var a=pool.submit(buy);var b=pool.submit(buy);start.countDown();assertThat(List.of(a.get(10,TimeUnit.SECONDS),b.get(10,TimeUnit.SECONDS))).containsExactlyInAnyOrder(true,false); }
        finally { pool.shutdownNow(); }
        assertThat(orders.count()).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT stock FROM products WHERE id=?",Integer.class,productId)).isZero();
    }
    @Test void statusesAdvanceWithoutDiscountingAgain() {
        var order=service.create(input(1),key());
        assertThatThrownBy(()->service.status(order.id(),OrderStatus.ENTREGADO)).isInstanceOf(ApiException.class);
        service.status(order.id(),OrderStatus.EN_PREPARACION);service.status(order.id(),OrderStatus.ENTREGADO);
        assertThatThrownBy(()->service.status(order.id(),OrderStatus.PENDIENTE)).isInstanceOf(ApiException.class);
        assertThat(jdbc.queryForObject("SELECT stock FROM products WHERE id=?",Integer.class,productId)).isEqualTo(9);
    }
    @Test void checkoutValidatesBodyAndRequiresCsrf() throws Exception {
        mvc.perform(post("/api/pedidos").header("Idempotency-Key",key()).contentType("application/json").content("{}"))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/pedidos").with(csrf()).header("Idempotency-Key",key()).contentType("application/json").content("{}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.customerName").exists());
        String body="""
            {"customerName":"Ana", "phone":"987654321", "address":"Calle 123", "items":[{"productId":%d,"quantity":1}]}
            """.formatted(productId);
        mvc.perform(post("/api/pedidos").with(csrf()).header("Idempotency-Key",key()).contentType("application/json").content(body))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.total").value(28.0));
    }
    @Test void anonymousAndNonAdminCannotReadCustomerData() throws Exception {
        mvc.perform(get("/api/admin/pedidos")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/pedidos").with(user("visitor").roles("USER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/productos").with(user("admin").roles("ADMIN"))).andExpect(status().isOk());
    }
    @Test void adminLoginSessionAndLogout() throws Exception {
        var result=mvc.perform(post("/api/auth/login").with(csrf()).param("username","admin").param("password","test-only-password-2026"))
            .andExpect(status().isOk()).andReturn();
        var session=(MockHttpSession)result.getRequest().getSession(false);
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.username").value("admin"));
        mvc.perform(post("/api/auth/logout").session(session).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(post("/api/auth/login").with(csrf()).param("username","admin").param("password","wrong"))
            .andExpect(status().isUnauthorized());
    }
    @Test void adminCreatesAndDeactivatesProduct() throws Exception {
        Long category=jdbc.queryForObject("SELECT MIN(id) FROM categories",Long.class);
        var p=products.save(null,new ProductInput("Prueba","Descripción",new BigDecimal("10.50"),5,"",category,true));
        mvc.perform(get("/api/productos/"+p.id())).andExpect(status().isOk());
        products.active(p.id(),false);
        mvc.perform(get("/api/productos/"+p.id())).andExpect(status().isNotFound());
        jdbc.update("DELETE FROM products WHERE id=?",p.id());
    }
    @Test void partialMutationsAndMalformedPhoneAreRejected() throws Exception {
        mvc.perform(patch("/api/admin/productos/"+productId+"/activo").with(user("admin").roles("ADMIN"))
            .with(csrf()).contentType("application/json").content("{}"))
            .andExpect(status().isBadRequest());
        String body="""
            {"customerName":"Ana", "phone":"1      ", "address":"Calle 123", "items":[{"productId":%d,"quantity":1}]}
            """.formatted(productId);
        mvc.perform(post("/api/pedidos").with(csrf()).header("Idempotency-Key",key()).contentType("application/json").content(body))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.phone").exists());
    }
}
