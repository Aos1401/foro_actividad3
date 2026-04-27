package com.foro.ejercicio3.auth.domain;

public record AuthResponse(
        String token,
        String username,
        String role
) {}