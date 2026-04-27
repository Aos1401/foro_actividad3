document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) { window.location.href = "login.html"; return; }
    if (!roomId) { window.location.href = "home.html"; return; }

    fetch(`/api/rooms/${roomId}/check-access`, {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => res.json())
    .then(hasAccess => {
        if (!hasAccess) {
            Swal.fire({
                icon: 'error',
                title: 'Acceso Denegado',
                text: 'Has sido expulsado de esta sala temática por moderación.',
                allowOutsideClick: false,
                confirmButtonText: 'Volver al Inicio',
                confirmButtonColor: '#343a40'
            }).then(() => { window.location.href = 'home.html'; });
        } else {
            loadRoomDetails(roomId);
            loadPosts(roomId);
        }
    });

    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const content = document.getElementById('postContent').value;
            const messageEl = document.getElementById('postMessage');

            fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ content: content, roomId: parseInt(roomId), parentId: null }) // Es una PREGUNTA nueva
            })
            .then(async response => {
                const text = await response.text();
                if (response.ok) {
                    messageEl.textContent = text;
                    messageEl.className = "message success";
                    document.getElementById('postContent').value = '';
                    loadPosts(roomId);
                } else {
                    messageEl.textContent = "Error: " + text;
                    messageEl.className = "message error";
                }
            });
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.clear();
            window.location.href = "login.html";
        };
    }
});

function highlightMentions(text) {
    if (!text) return "";
    return text.replace(/@([a-zA-Z0-9_]+)/g, '<span style="color: #0056b3; font-weight: bold; background-color: #e6f2ff; padding: 2px 5px; border-radius: 4px;">@$1</span>');
}

function loadRoomDetails(id) {
    fetch('/api/rooms', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
    .then(res => res.json())
    .then(rooms => {
        const room = rooms.find(r => r.id == id);
        if (room) {
            document.getElementById('roomTitle').textContent = room.name;
            document.getElementById('roomInfo').innerHTML = `<p>${room.description}</p>`;
        }
    });
}

async function loadPosts(roomId) {
    const list = document.getElementById('postsList');
    const token = localStorage.getItem('token');
    const myRole = localStorage.getItem('role');
    const myUsername = localStorage.getItem('username');

    const roomsRes = await fetch('/api/rooms', { headers: { 'Authorization': 'Bearer ' + token } });
    const rooms = await roomsRes.json();
    const currentRoom = rooms.find(r => r.id == roomId);

    const isOwner = myRole === 'ROLE_SUPERADMIN' ||
                    (currentRoom.moderators && currentRoom.moderators.some(m => m.username === myUsername));

    const modSection = document.getElementById('moderationSection');
    if (isOwner && modSection) {
        modSection.style.display = 'block';
        loadPendingPosts(roomId);
    } else if (modSection) {
        modSection.style.display = 'none';
    }

    const postsRes = await fetch(`/api/posts/room/${roomId}`, { headers: { 'Authorization': 'Bearer ' + token } });
    const posts = await postsRes.json();

    list.innerHTML = '';
    if (posts.length === 0) {
        list.innerHTML = '<p class="no-posts" style="color: #888;">Sé el primero en formular una pregunta.</p>';
        return;
    }

    // ==========================================
    // SISTEMA DE RENDERIZADO DE HILOS
    // ==========================================

    // 1. Separar Preguntas Principales (sin padre)
    const mainQuestions = posts.filter(p => !p.parentPost);

    mainQuestions.forEach(question => {
        // Crear caja de la Pregunta Principal
        const qItem = createPostHTML(question, isOwner, myUsername, roomId, true);
        list.appendChild(qItem);

        // 2. Buscar si esta pregunta tiene Respuestas (su padre es esta pregunta)
        const replies = posts.filter(p => p.parentPost && p.parentPost.id === question.id);

        replies.forEach(reply => {
            // Crear caja de la Respuesta (con estilo anidado)
            const rItem = createPostHTML(reply, isOwner, myUsername, roomId, false);
            list.appendChild(rItem);
        });
    });
}

// Función auxiliar para dibujar un post (Pregunta o Respuesta)
function createPostHTML(post, isOwner, myUsername, roomId, isMainQuestion) {
    const item = document.createElement('div');
    item.className = 'post-item';

    // Si es una respuesta, la tabulamos hacia la derecha y le cambiamos el color
    if (!isMainQuestion) {
        item.style.marginLeft = "40px";
        item.style.borderLeft = "4px solid #007bff";
        item.style.backgroundColor = "#f8f9fa";
    }

    item.style.position = 'relative';

    let modButtons = '';
    if (isOwner && post.author.username !== myUsername) {
        const safeContent = post.content.replace(/`/g, '\\`').replace(/\n/g, ' ');
        modButtons = `
            <div style="position: absolute; right: 25px; top: 25px; display: flex; gap: 8px;">
                <button onclick="openWarningModal(${post.author.id}, '${post.author.username}', \`${safeContent}\` )" style="background: #ffc107; color: black; border: none; padding: 6px 10px; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold;">⚠️ Avisar</button>
                <button onclick="handleBan(${post.author.id}, '${post.author.username}', ${roomId})" style="background: #6c757d; color: white; border: none; padding: 6px 10px; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold;">🚫 Banear</button>
                <button onclick="reportUserGlobal(${post.author.id}, '${post.author.username}')" style="background: #343a40; color: white; border: none; padding: 6px 10px; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold;">🚨 Reportar</button>
                <button onclick="deletePublishedPost(${post.id}, ${roomId})" style="background: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold;">🗑️ Borrar</button>
            </div>
        `;
    }

    // Botón de Responder: SOLO aparece en Preguntas Principales (Cumple el requisito del profesor)
    let replyButton = '';
    if (isMainQuestion) {
        replyButton = `<button onclick="sendReply(${post.id}, '${post.author.username}', ${roomId})" style="margin-top:10px; background: transparent; color: #007bff; border: 1px solid #007bff; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">💬 Responder</button>`;
    }

    const badge = isMainQuestion ? '❓ PREGUNTA' : '↪️ RESPUESTA';
    const formattedContent = highlightMentions(post.content);

    item.innerHTML = `
        <span class="post-header" style="color: #666; font-size: 12px; display: block; margin-bottom: 5px;">${badge}</span>
        <span class="post-header">Por: <strong>${post.author.username}</strong> - ${new Date(post.createdAt).toLocaleString()}</span>
        <div class="post-content" style="padding-right: 250px;">${formattedContent}</div>
        ${replyButton}
        ${modButtons}
    `;
    return item;
}

// NUEVO: Ventana interactiva para escribir una respuesta
async function sendReply(parentId, authorName, roomId) {
    const { value: text } = await Swal.fire({
        title: `Responder a ${authorName}`,
        input: 'textarea',
        inputPlaceholder: 'Escribe tu respuesta aquí...',
        showCancelButton: true,
        confirmButtonColor: '#007bff',
        confirmButtonText: 'Publicar Respuesta',
        cancelButtonText: 'Cancelar'
    });

    if (text) {
        fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ content: text, roomId: parseInt(roomId), parentId: parentId })
        }).then(async res => {
            const msg = await res.text();
            if(res.ok) {
                Swal.fire({ icon: 'success', title: '¡Publicado!', text: msg, timer: 2000, showConfirmButton: false });
                loadPosts(roomId);
            } else {
                Swal.fire('Error', msg, 'error');
            }
        });
    }
}

async function handleBan(userId, username, roomId) {
    const { value: banType } = await Swal.fire({
        title: `🚫 Expulsar a ${username}`,
        text: "¿Qué tipo de restricción quieres aplicar para esta sala?",
        input: 'select',
        inputOptions: {
            'temporal': 'Temporal (30 días)',
            'permanente': 'Permanente'
        },
        inputPlaceholder: 'Selecciona una opción',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonText: 'Cancelar'
    });

    if (banType) {
        const isPermanent = banType === 'permanente';
        fetch(`/api/rooms/${roomId}/ban/${userId}?permanent=${isPermanent}`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        }).then(res => {
            if(res.ok) {
                Swal.fire('¡Usuario Expulsado!', `El acceso de ${username} ha sido restringido.`, 'success');
                loadPosts(roomId);
            }
        });
    }
}

async function openWarningModal(userId, username, originalContent) {
    const { value: formValues } = await Swal.fire({
        title: `⚠️ Enviar aviso a ${username}`,
        html:
            '<label style="display:block; text-align:left; margin-bottom:5px; font-weight:bold;">Motivo:</label>' +
            '<select id="swal-input1" class="swal2-select" style="margin-top:0; width:90%; font-size:14px;">' +
                '<option value="Mala conducta">Mala conducta</option>' +
                '<option value="Solo se permiten español e inglés">Solo se permiten español e inglés</option>' +
                '<option value="Contenido inapropiado u offtopics">Contenido inapropiado / Fuera de temática</option>' +
            '</select>' +
            '<label style="display:block; text-align:left; margin-bottom:5px; margin-top:15px; font-weight:bold;">Mensaje al usuario:</label>' +
            '<textarea id="swal-input2" class="swal2-textarea" placeholder="Escribe el mensaje privado..." style="width:90%; height: 80px;"></textarea>',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Enviar Aviso',
        confirmButtonColor: '#ffc107',
        preConfirm: () => {
            const reason = document.getElementById('swal-input1').value;
            const message = document.getElementById('swal-input2').value;
            if (!message) {
                Swal.showValidationMessage('El campo del mensaje es obligatorio');
            }
            return { reason, message };
        }
    });

    if (formValues) {
        fetch(`/api/warnings/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                userId: userId,
                reason: formValues.reason,
                message: formValues.message,
                originalContent: originalContent
            })
        })
        .then(response => {
            if (response.ok) {
                Swal.fire({ icon: 'success', title: 'Aviso enviado y registrado en copia al Superadmin', timer: 2000, showConfirmButton: false });
            }
        });
    }
}

async function reportUserGlobal(userId, username) {
    const { value: text } = await Swal.fire({
        title: `🚨 Reportar a ${username}`,
        input: 'textarea',
        inputLabel: 'Motivo de la petición al Superadmin',
        inputPlaceholder: 'Explica por qué este usuario debe ser dado de baja definitiva del foro...',
        showCancelButton: true,
        confirmButtonColor: '#343a40',
        confirmButtonText: 'Enviar Petición de Baja',
        cancelButtonText: 'Cancelar'
    });

    if (text) {
        fetch(`/api/users/${userId}/report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ reason: text })
        }).then(res => {
            if(res.ok) {
                Swal.fire('Petición Enviada', 'Los Superadmins han sido notificados con tu motivo.', 'success');
            }
        });
    }
}

function deletePublishedPost(postId, roomId) {
    Swal.fire({
        title: '¿Borrar mensaje?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sí, borrar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/api/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            })
            .then(response => {
                if(response.ok) loadPosts(roomId);
            });
        }
    });
}

function loadPendingPosts(roomId) {
    const list = document.getElementById('pendingPostsList');
    fetch(`/api/posts/room/${roomId}/pending`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
    .then(res => res.json())
    .then(posts => {
        list.innerHTML = '';
        if (posts.length === 0) {
            list.innerHTML = '<p style="color: #856404; font-size: 14px;">No hay mensajes pendientes.</p>';
            return;
        }
        posts.forEach(post => {
            const item = document.createElement('div');
            item.className = 'post-item';
            const formattedContent = highlightMentions(post.content);
            item.innerHTML = `
                <span class="post-header">De: <strong>${post.author.username}</strong></span>
                <div class="post-content" style="margin-bottom: 10px;">${formattedContent}</div>
                <div>
                    <button onclick="moderatePost(${post.id}, true, ${roomId})" style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px; font-weight:bold;">Aprobar</button>
                    <button onclick="moderatePost(${post.id}, false, ${roomId})" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight:bold;">Rechazar</button>
                </div>
            `;
            list.appendChild(item);
        });
    });
}

function moderatePost(postId, approve, roomId) {
    fetch(`/api/posts/${postId}/moderate?approve=${approve}`, {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    })
    .then(response => {
        if(response.ok) {
            loadPendingPosts(roomId);
            loadPosts(roomId);
        }
    });
}