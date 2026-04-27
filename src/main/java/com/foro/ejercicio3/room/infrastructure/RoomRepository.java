package com.foro.ejercicio3.room.infrastructure;

import com.foro.ejercicio3.room.domain.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByName(String name);
    boolean existsByName(String name);
}