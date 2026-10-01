package com.cafedebarrio.cafedebarrio.config;


import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.*;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpMethod;
@Configuration
public class SecurityConfig {
    @Bean PasswordEncoder passwords() { return new BCryptPasswordEncoder(); }
    @Bean UserDetailsService users(@Value("${app.admin.username}") String username,
        @Value("${app.admin.password}") String password,PasswordEncoder encoder) {
        if(password==null || password.length()<12) throw new IllegalStateException("Configura ADMIN_PASSWORD con al menos 12 caracteres, o usa el perfil demo solo en local");
        return new InMemoryUserDetailsManager(User.withUsername(username).password(encoder.encode(password)).roles("ADMIN").build());
    }
    @Bean SecurityFilterChain security(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()));
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/csrf", "/api/auth/login").permitAll()
            .requestMatchers(HttpMethod.GET,"/api/productos", "/api/productos/*", "/api/productos/referencia/*", "/api/categorias").permitAll()
            .requestMatchers(HttpMethod.POST,"/api/pedidos").permitAll()
            .requestMatchers("/api/admin/**", "/api/auth/me", "/api/auth/logout").hasRole("ADMIN")
            .anyRequest().denyAll());
        http.formLogin(login -> login.loginProcessingUrl("/api/auth/login")
            .successHandler((req,res,auth) -> { res.setContentType("application/json"); res.getWriter().write("{\"message\":\"Sesión iniciada\"}"); })
            .failureHandler((req,res,ex) -> { res.setStatus(401); res.setContentType("application/json"); res.getWriter().write("{\"message\":\"Credenciales incorrectas\"}"); }));
        http.logout(logout -> logout.logoutUrl("/api/auth/logout").deleteCookies("JSESSIONID")
            .logoutSuccessHandler((req,res,auth) -> res.setStatus(204)));
        http.exceptionHandling(errors -> errors
            .authenticationEntryPoint((req,res,ex) -> { res.setStatus(401); res.setContentType("application/json"); res.getWriter().write("{\"message\":\"Inicia sesión para continuar\"}"); })
            .accessDeniedHandler((req,res,ex) -> { res.setStatus(403); res.setContentType("application/json"); res.getWriter().write("{\"message\":\"Acceso denegado o sesión de formulario vencida\"}"); }));
        return http.build();
    }
}
