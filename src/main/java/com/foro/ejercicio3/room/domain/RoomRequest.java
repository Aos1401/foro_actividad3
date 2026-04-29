package com.foro.ejercicio3.room.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RoomRequest(
        String name,
        String description,

        // Al usar Boolean (con mayúscula), si Java se hace un lío y lee null, no explota.
        @JsonProperty("isModerated")
        Boolean isModerated
) {
    // NUEVO: Método salvavidas. Si llega null, lo convierte en false automáticamente.
    public boolean obtenerBooleanoSeguro() {
        return isModerated != null ? isModerated : false;
    }
}