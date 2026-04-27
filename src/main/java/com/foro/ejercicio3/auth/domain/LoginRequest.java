package com.foro.ejercicio3.auth.domain;

public record LoginRequest(
        String email,
        String password
) {}