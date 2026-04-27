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

        // CORRECCIÓN FINAL:
        // 1. Para el Record usamos: request.moderated()
        // 2. Para el Builder de Room usamos: .moderated(...)
        Room room = Room.builder()
                .name(request.name())
                .description(request.description())
                .moderated(request.moderated())
                .build();

        roomRepository.save(room);
        return "Sala temática creada con éxito";
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }
}