package com.foro.ejercicio3.room.domain;

public record RoomRequest(
        String name,
        String description,
        boolean moderated // Asegúrate de que se llame 'moderated'
) {}