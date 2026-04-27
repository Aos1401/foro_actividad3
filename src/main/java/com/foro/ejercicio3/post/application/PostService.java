package com.foro.ejercicio3.post.application;

import com.foro.ejercicio3.notification.domain.Notification;
import com.foro.ejercicio3.notification.infrastructure.NotificationRepository;
import com.foro.ejercicio3.post.domain.Post;
import com.foro.ejercicio3.post.domain.PostRequest;
import com.foro.ejercicio3.post.infrastructure.PostRepository;
import com.foro.ejercicio3.room.domain.Room;
import com.foro.ejercicio3.room.infrastructure.RoomRepository;
import com.foro.ejercicio3.user.domain.Role;
import com.foro.ejercicio3.user.domain.User;
import com.foro.ejercicio3.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public String createPost(PostRequest request) {
        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> new RuntimeException("La sala no existe"));

        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User author = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("El usuario no existe"));

        if (author.getRole() == Role.ROLE_PARTICIPANT) {
            int limit = author.getWeeklyQuestionLimit();
            if (limit <= 0) limit = 5;

            LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
            long postsInLastWeek = postRepository.countByAuthorIdAndCreatedAtAfter(author.getId(), sevenDaysAgo);

            if (postsInLastWeek >= limit) {
                throw new RuntimeException("Límite semanal alcanzado: Solo puedes publicar " + limit + " mensajes cada 7 días.");
            }
        }

        // ==========================================
        // NUEVO: LÓGICA DE PREGUNTAS Y RESPUESTAS
        // ==========================================
        Post parent = null;
        if (request.parentId() != null) {
            parent = postRepository.findById(request.parentId())
                    .orElseThrow(() -> new RuntimeException("El mensaje original no existe"));

            // REGLA DEL PROFESOR: "NO podrá responder a otro comentario"
            if (parent.getParentPost() != null) {
                throw new RuntimeException("Solo se permite un nivel de respuestas. No puedes responder a otro comentario.");
            }
        }

        boolean isApproved = !room.isModerated()
                || author.getRole() == Role.ROLE_SUPERADMIN
                || author.getRole() == Role.ROLE_MODERATOR;

        Post post = Post.builder()
                .content(request.content())
                .createdAt(LocalDateTime.now())
                .room(room)
                .author(author)
                .isApproved(isApproved)
                .parentPost(parent) // Vinculamos la respuesta a su pregunta
                .build();

        postRepository.save(post);

        // ESCÁNER DE MENCIONES
        Pattern pattern = Pattern.compile("@([a-zA-Z0-9_]+)");
        Matcher matcher = pattern.matcher(request.content());

        while (matcher.find()) {
            String mentionedUsername = matcher.group(1);
            userRepository.findByUsernameIgnoreCase(mentionedUsername).ifPresent(mentionedUser -> {
                Notification notification = Notification.builder()
                        .recipient(mentionedUser)
                        .message("<strong>" + author.getUsername() + "</strong> te ha mencionado: <em>\"" + request.content() + "\"</em>")
                        .relatedRoomId(room.getId())
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notification);
            });
        }

        return isApproved ? "Mensaje publicado con éxito" : "Mensaje enviado. Pendiente de aprobación por moderación.";
    }

    public List<Post> getApprovedPostsByRoom(Long roomId) {
        return postRepository.findByRoomIdOrderByCreatedAtAsc(roomId).stream()
                .filter(Post::isApproved)
                .collect(Collectors.toList());
    }

    public List<Post> getPendingPostsByRoom(Long roomId) {
        return postRepository.findByRoomIdAndIsApprovedFalseOrderByCreatedAtAsc(roomId);
    }

    public String moderatePost(Long postId, boolean approve) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("El mensaje no existe"));

        if (approve) {
            post.setApproved(true);
            postRepository.save(post);
            return "Mensaje aprobado.";
        } else {
            postRepository.delete(post);
            return "Mensaje eliminado.";
        }
    }

    public String deletePost(Long postId) {
        postRepository.deleteById(postId);
        return "Mensaje eliminado.";
    }

    public List<Post> getMyHistory() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User author = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("El usuario no existe"));

        return postRepository.findByAuthorIdOrderByCreatedAtDesc(author.getId());
    }
}