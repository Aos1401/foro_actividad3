document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Configuración de visibilidad según el rol
    if (role === 'ROLE_SUPERADMIN' || role === 'ROLE_MODERATOR') {
        const createSection = document.getElementById('createRoomSection');
        if (createSection) createSection.style.display = 'block';

        if (role === 'ROLE_SUPERADMIN') {
            const adminBtn = document.getElementById('adminPanelBtn');
            if (adminBtn) adminBtn.style.display = 'inline-block';

            const adminPanel = document.getElementById('adminPanel');
            if (adminPanel) adminPanel.style.display = 'block';

            loadModeratorManagement();
        }
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = "login.html";
    });

    const createForm = document.getElementById('createRoomForm');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateRoom);
    }

    await loadDashboard();
});

async function loadDashboard() {
    const token = localStorage.getItem('token');
    try {
        // Cargar perfil para ver favoritos
        const userRes = await fetch('/api/users/profile', { headers: { 'Authorization': 'Bearer ' + token } });
        if (!userRes.ok) {
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }
        const user = await userRes.json();
        const favoriteIds = user.favoriteRooms ? user.favoriteRooms.map(r => r.id) : [];

        // Cargar salas
        const roomsRes = await fetch('/api/rooms', { headers: { 'Authorization': 'Bearer ' + token } });
        const rooms = await roomsRes.json();

        const favContainer = document.getElementById('favoritesContainer');
        const roomsContainer = document.getElementById('roomsContainer');
        const favTitle = document.getElementById('favoritesTitle');

        favContainer.innerHTML = '';
        roomsContainer.innerHTML = '';

        let hasFavorites = false;

        rooms.forEach(room => {
            const isFav = favoriteIds.includes(room.id);
            const card = document.createElement('div');
            card.className = 'room-card';

            let modBadge = room.moderated ? '<span style="background:#ffc107; color:black; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold;">🛡️ Moderada</span>' : '';
            let star = isFav ? '⭐' : '☆';

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#343a40;">${room.name}</h3>
                    <span onclick="toggleFavorite(${room.id})" style="cursor:pointer; font-size:24px; color:#ffc107;" title="Marcar/Desmarcar Favorito">${star}</span>
                </div>
                <p style="color:#666; font-size:14px; margin-top:10px;">${room.description}</p>
                <div style="margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
                    ${modBadge}
                    <button onclick="window.location.href='room.html?id=${room.id}'" style="background:#007bff; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; font-weight:bold;">Entrar ➡️</button>
                </div>
            `;

            if (isFav) {
                favContainer.appendChild(card);
                hasFavorites = true;
            } else {
                roomsContainer.appendChild(card);
            }
        });

        if (hasFavorites) {
            favTitle.style.display = 'block';
            favContainer.style.display = 'grid';
        } else {
            favTitle.style.display = 'none';
            favContainer.style.display = 'none';
        }

        if (rooms.length === 0 || (!hasFavorites && rooms.length === 0)) {
            roomsContainer.innerHTML = '<p style="color:#888;">No hay salas disponibles en este momento.</p>';
        }

    } catch (error) {
        document.getElementById('roomsContainer').innerHTML = '<p style="color:red; font-weight:bold;">Error al cargar las salas. Revisa tu conexión.</p>';
    }
}

async function handleCreateRoom(e) {
    e.preventDefault();
    const name = document.getElementById('newRoomName').value;
    const desc = document.getElementById('newRoomDesc').value;
    const isModerated = document.getElementById('newRoomModerated').checked;

    const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ name: name, description: desc, isModerated: isModerated })
    });

    if (res.ok) {
        Swal.fire('Éxito', 'Sala creada correctamente', 'success');
        document.getElementById('createRoomForm').reset();
        loadDashboard();
    } else {
        const text = await res.text();
        Swal.fire('Error', text, 'error');
    }
}

async function toggleFavorite(roomId) {
    const res = await fetch(`/api/users/favorites/${roomId}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    if (res.ok) {
        loadDashboard(); // Recargar para mover la sala arriba o abajo inmediatamente
    }
}

async function loadModeratorManagement() {
    const token = localStorage.getItem('token');
    try {
        const usersRes = await fetch('/api/users', { headers: { 'Authorization': 'Bearer ' + token } });
        const users = await usersRes.json();
        const moderators = users.filter(u => u.role === 'ROLE_MODERATOR');

        const roomsRes = await fetch('/api/rooms', { headers: { 'Authorization': 'Bearer ' + token } });
        const rooms = await roomsRes.json();

        const list = document.getElementById('moderatorsList');
        list.innerHTML = '';

        if (moderators.length === 0) {
            list.innerHTML = '<p style="font-size:14px; color:#888;">No hay moderadores registrados. Asígnalos desde el Panel de Usuarios.</p>';
            return;
        }

        moderators.forEach(mod => {
            const item = document.createElement('div');
            item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #eee; background: white; margin-bottom: 5px; border-radius: 4px;";

            // Salas que ya modera
            const modRooms = rooms.filter(r => r.moderators && r.moderators.some(m => m.id === mod.id));
            const roomNames = modRooms.length > 0 ? modRooms.map(r => r.name).join(', ') : 'Ninguna';

            let options = '<option value="">Seleccionar sala...</option>';
            rooms.forEach(r => {
                options += `<option value="${r.id}">${r.name}</option>`;
            });

            item.innerHTML = `
                <div>
                    <strong style="display:block; font-size: 16px;">${mod.username}</strong>
                    <span style="font-size:12px; color:#666;">Salas asignadas (${modRooms.length}/2): <b>${roomNames}</b></span>
                </div>
                <div style="display:flex; gap:10px;">
                    <select id="modSelect_${mod.id}" style="padding:6px; border-radius:4px; border:1px solid #ccc;">${options}</select>
                    <button onclick="assignModerator(${mod.id})" style="background:#28a745; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Asignar</button>
                </div>
            `;
            list.appendChild(item);
        });

    } catch (e) {
        console.error("Error cargando gestión de moderadores", e);
    }
}

async function assignModerator(userId) {
    const select = document.getElementById(`modSelect_${userId}`);
    const roomId = select.value;
    if (!roomId) {
        Swal.fire('Aviso', 'Selecciona una sala primero', 'warning');
        return;
    }

    const res = await fetch(`/api/rooms/${roomId}/assign-moderator/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });

    if (res.ok) {
        Swal.fire('Asignado', 'Moderador asignado a la sala con éxito.', 'success');
        loadModeratorManagement(); // Refrescar la lista de salas asignadas
    } else {
        const text = await res.text();
        Swal.fire('Error', text, 'error');
    }
}