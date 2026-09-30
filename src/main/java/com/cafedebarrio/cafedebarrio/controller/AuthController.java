package com.cafedebarrio.cafedebarrio.controller;


import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import java.util.Map;
@RestController @RequestMapping("/api/auth")
public class AuthController {
    @GetMapping("/csrf") public Map<String,String> csrf(CsrfToken token) { return Map.of("token",token.getToken()); }
    @GetMapping("/me") public Map<String,String> me(Authentication auth) { return Map.of("username",auth.getName()); }
}
