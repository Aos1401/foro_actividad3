package com.foro.ejercicio3.post.domain;

public record PostRequest(
        String content,
        Long roomId,
        Long parentId // NUEVO: Si viene vacío es Pregunta, si tiene número es Respuesta
) {}