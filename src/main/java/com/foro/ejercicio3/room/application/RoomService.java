package com.foro.ejercicio3.room.application;

import com.foro.ejercicio3.room.domain.Room;
import com.foro.ejercicio3.room.domain.RoomRequest;
import com.foro.ejercicio3.room.infrastructure.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;

    public String createRoom(RoomRequest request) {
        if (roomRepository.existsByName(request.name())) {
            throw new RuntimeException("Ya existe una sala con este nombre");
        }

        Room room = Room.builder()
                .name(request.name())
                .description(request.description())
                // Aquí llamamos al salvavidas: nunca será null
                .moderated(request.obtenerBooleanoSeguro())
                .build();

        roomRepository.save(room);
        return "Sala temática creada con éxito";
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }
}