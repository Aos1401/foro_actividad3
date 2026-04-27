package com.foro.ejercicio3.auth.application;

import com.foro.ejercicio3.auth.domain.AuthResponse;
import com.foro.ejercicio3.auth.domain.LoginRequest;
import com.foro.ejercicio3.auth.domain.RegisterRequest;
import com.foro.ejercicio3.user.domain.Role;
import com.foro.ejercicio3.user.domain.User;
import com.foro.ejercicio3.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("El email ya está registrado.");
        }

        // APLICAMOS LA NUEVA REGLA: Comprobar ignorando mayúsculas
        if (userRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new IllegalArgumentException("El nombre de usuario ya está en uso. Por favor, elige otro.");
        }

        Role assignedRole = (userRepository.count() == 0) ? Role.ROLE_SUPERADMIN : Role.ROLE_PARTICIPANT;

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(assignedRole)
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getUsername(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Credenciales inválidas");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getUsername(), user.getRole().name());
    }
}