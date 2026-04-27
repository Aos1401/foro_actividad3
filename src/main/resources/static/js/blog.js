document.addEventListener("DOMContentLoaded", () => {
    const role = localStorage.getItem('role');
    const isAdmin = role === 'ROLE_SUPERADMIN';

    // Mostrar botón de redactar solo si es SUPERADMIN
    if (isAdmin) {
        document.getElementById('adminBtn').style.display = 'inline-block';
    }

    loadBlogPosts();
});

function loadBlogPosts() {
    const role = localStorage.getItem('role');
    const isAdmin = role === 'ROLE_SUPERADMIN';

    fetch('/api/blog')
        .then(res => res.json())
        .then(posts => {
            const list = document.getElementById('blogList');
            list.innerHTML = '';

            if (posts.length === 0) {
                list.innerHTML = '<p class="empty-blog-msg">Aún no hay artículos publicados.</p>';
                return;
            }

            posts.forEach(post => {
                const item = document.createElement('div');
                item.className = 'blog-post-card';

                // Si es admin, preparamos el botón de borrar flotando a la derecha
                let deleteBtn = '';
                if (isAdmin) {
                    deleteBtn = `<button onclick="deleteBlogPost(${post.id})" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; float: right; font-weight: bold;">🗑️ Borrar</button>`;
                }

                item.innerHTML = `
                    ${deleteBtn}
                    <h2 class="blog-post-title">${post.title}</h2>
                    <p class="blog-post-meta">Publicado por <strong>${post.author.username}</strong> el ${new Date(post.createdAt).toLocaleString()}</p>
                    <div class="blog-post-content" style="clear: both;">
                        ${post.content}
                    </div>
                `;
                list.appendChild(item);
            });
        })
        .catch(err => {
            console.error("Error al cargar el blog:", err);
            document.getElementById('blogList').innerHTML = '<p class="error-blog-msg">Error al conectar con el servidor.</p>';
        });
}

// NUEVO: Función para ejecutar el borrado con confirmación
window.deleteBlogPost = function(postId) {
    Swal.fire({
        title: '¿Borrar artículo?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sí, borrar definitivamente',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/api/blog/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            })
            .then(response => {
                if(response.ok) {
                    Swal.fire('Borrado', 'El artículo ha sido eliminado.', 'success');
                    loadBlogPosts(); // Recargamos la lista
                } else {
                    Swal.fire('Error', 'No se pudo eliminar el artículo.', 'error');
                }
            });
        }
    });
}