package com.foro.ejercicio3.auth.domain;

public record RegisterRequest(
        String username,
        String email,
        String password
) {}