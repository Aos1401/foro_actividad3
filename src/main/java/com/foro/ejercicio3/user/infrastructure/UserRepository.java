package com.foro.ejercicio3.user.infrastructure;

import com.foro.ejercicio3.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // NUEVO: Ignora mayúsculas/minúsculas al buscar el nombre
    Optional<User> findByUsernameIgnoreCase(String username);

    // NUEVO: Ignora mayúsculas/minúsculas al comprobar si existe
    boolean existsByUsernameIgnoreCase(String username);
}