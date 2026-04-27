package com.foro.ejercicio3.room.infrastructure;

import com.foro.ejercicio3.room.domain.Ban;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BanRepository extends JpaRepository<Ban, Long> {
    Optional<Ban> findByUserIdAndRoomId(Long userId, Long roomId);

    // NUEVO: Buscar baneos activos (permanentes o que no hayan caducado aún)
    @Query("SELECT b FROM Ban b WHERE b.user.id = :userId AND (b.permanent = true OR b.expiryDate > :now)")
    List<Ban> findActiveBansByUser(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}