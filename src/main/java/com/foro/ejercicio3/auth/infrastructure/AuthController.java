package com.foro.ejercicio3.auth.infrastructure;

import com.foro.ejercicio3.auth.application.AuthService;
import com.foro.ejercicio3.auth.domain.AuthResponse;
import com.foro.ejercicio3.auth.domain.LoginRequest;
import com.foro.ejercicio3.auth.domain.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // NUEVO: El "Paracaídas" para los errores.
    // Convierte el fallo en un texto que el frontend puede leer fácilmente.
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadCredentials(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}