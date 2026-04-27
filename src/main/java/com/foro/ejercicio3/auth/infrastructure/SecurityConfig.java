package com.foro.ejercicio3.auth.infrastructure;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authRequest ->
                        authRequest
                                // 1. ACCESO PÚBLICO
                                .requestMatchers("/api/auth/**").permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/blog/**").permitAll() // Leer el blog es público
                                .requestMatchers("/", "/index.html", "/*.html", "/css/**", "/js/**", "/favicon.ico").permitAll()

                                // Rutas específicas de usuario logueado
                                .requestMatchers("/api/users/profile").authenticated()
                                .requestMatchers("/api/users/favorites/**").authenticated()

                                // Permiso para que el moderador y admin puedan REPORTAR
                                .requestMatchers(HttpMethod.POST, "/api/users/*/report").hasAnyAuthority("ROLE_SUPERADMIN", "ROLE_MODERATOR")

                                // 2. CONTROL TOTAL SUPERADMIN
                                .requestMatchers("/api/users/**").hasAuthority("ROLE_SUPERADMIN")
                                .requestMatchers(HttpMethod.POST, "/api/rooms/*/assign-moderator/**").hasAuthority("ROLE_SUPERADMIN")
                                .requestMatchers(HttpMethod.POST, "/api/rooms").hasAuthority("ROLE_SUPERADMIN")
                                .requestMatchers("/api/warnings/all").hasAuthority("ROLE_SUPERADMIN")
                                .requestMatchers(HttpMethod.POST, "/api/blog").hasAuthority("ROLE_SUPERADMIN") // Escribir en blog
                                .requestMatchers(HttpMethod.DELETE, "/api/blog/**").hasAuthority("ROLE_SUPERADMIN") // Borrar en blog

                                // 3. CONTROL MODERADORES Y SUPERADMIN
                                .requestMatchers(HttpMethod.POST, "/api/rooms/*/ban/**").hasAnyAuthority("ROLE_SUPERADMIN", "ROLE_MODERATOR")
                                .requestMatchers(HttpMethod.DELETE, "/api/posts/**").hasAnyAuthority("ROLE_SUPERADMIN", "ROLE_MODERATOR")
                                .requestMatchers(HttpMethod.PATCH, "/api/posts/*/moderate").hasAnyAuthority("ROLE_SUPERADMIN", "ROLE_MODERATOR")
                                .requestMatchers("/api/posts/room/*/pending").hasAnyAuthority("ROLE_SUPERADMIN", "ROLE_MODERATOR")
                                .requestMatchers(HttpMethod.POST, "/api/warnings/send").hasAnyAuthority("ROLE_SUPERADMIN", "ROLE_MODERATOR")
                                .requestMatchers("/api/warnings/my-sent").hasAnyAuthority("ROLE_SUPERADMIN", "ROLE_MODERATOR")

                                // 4. ACCESO USUARIOS AUTENTICADOS (PARTICIPANTES)
                                .requestMatchers(HttpMethod.GET, "/api/rooms/**").authenticated()
                                .requestMatchers(HttpMethod.POST, "/api/posts").authenticated()
                                .requestMatchers("/api/warnings/my-received").authenticated()
                                .requestMatchers("/api/posts/my-history").authenticated()
                                .requestMatchers("/api/notifications/**").authenticated()

                                .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}