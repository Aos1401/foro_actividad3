document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = "login.html"; return; }

    try {
        const userRes = await fetch('/api/users/profile', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (userRes.ok) {
            const user = await userRes.json();
            document.getElementById('profUser').textContent = user.username;
            document.getElementById('profEmail').textContent = user.email;

            let roleDisplay = "Participante";
            if (user.role === 'ROLE_MODERATOR') roleDisplay = "🛡️ Moderador";
            if (user.role === 'ROLE_SUPERADMIN') roleDisplay = "👑 Superadmin";
            document.getElementById('profRole').textContent = roleDisplay;

            // 1. Notificaciones y Actividad base
            loadHistory(token);
            loadNotifications(token);

            // 2. SECCIÓN DE BANEOS (Oculta para el Superadmin)
            if (user.role !== 'ROLE_SUPERADMIN') {
                createSection("🚫 Mis Restricciones de Acceso", "bansList", "#343a40");
                loadMyBans(token);
            }

            // 3. SECCIÓN DE AVISOS RECIBIDOS (Para todos)
            createSection("⚠️ Mis Avisos Recibidos", "receivedWarningsList", "#dc3545");
            loadWarnings('/api/warnings/my-received', "receivedWarningsList", token, "RECIBIDO");

            // 4. Secciones especiales según ROL
            if (user.role === 'ROLE_MODERATOR') {
                createSection("📤 Avisos Enviados por Mí", "sentWarningsList", "#dc3545");
                loadWarnings('/api/warnings/my-sent', "sentWarningsList", token, "ENVIADO");
            }

            if (user.role === 'ROLE_SUPERADMIN') {
                createSection("📋 Registro Global de Avisos (CC)", "globalWarningsList", "#dc3545");
                loadWarnings('/api/warnings/all', "globalWarningsList", token, "GLOBAL");
            }

            // ==========================================
            // CONTADOR SEMANAL DE PREGUNTAS (SÓLO PARTICIPANTES)
            // ==========================================
            if (user.role === 'ROLE_PARTICIPANT') {
                const historyRes = await fetch('/api/posts/my-history', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const history = await historyRes.json();

                // Filtrar los de los últimos 7 días
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const recentPosts = history.filter(p => new Date(p.createdAt) > sevenDaysAgo).length;

                // Salvavidas visual por si la BD manda un 0
                const limit = user.weeklyQuestionLimit > 0 ? user.weeklyQuestionLimit : 5;

                const percentage = Math.min((recentPosts / limit) * 100, 100);
                const barColor = percentage >= 100 ? '#dc3545' : '#007bff';

                const counterDiv = document.createElement('div');
                counterDiv.style.cssText = "margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center; border: 1px solid #ddd;";
                counterDiv.innerHTML = `
                    <div style="font-size: 0.9rem; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Contador Semanal de Preguntas</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: ${barColor};">${recentPosts} / ${limit}</div>
                    <div style="width: 100%; background: #e9ecef; height: 12px; border-radius: 6px; margin-top: 10px; overflow: hidden;">
                        <div style="width: ${percentage}%; background: ${barColor}; height: 100%; transition: width 0.5s ease-in-out;"></div>
                    </div>
                    ${percentage >= 100 ? '<div style="color: #dc3545; font-size: 0.8rem; margin-top: 5px; font-weight: bold;">Has alcanzado tu límite. Debes esperar a la próxima semana.</div>' : ''}
                `;

                const profileCard = document.querySelector('.profile-card');
                profileCard.parentNode.insertBefore(counterDiv, profileCard.nextSibling);
            }

        } else {
            localStorage.clear();
            window.location.href = "login.html";
        }
    } catch (error) {
        console.error("Error en perfil:", error);
    }
});

function createSection(title, listId, color) {
    const section = document.createElement('div');
    section.className = 'admin-panel';
    section.style.marginBottom = '30px';
    section.style.borderTop = `5px solid ${color}`;
    section.innerHTML = `
        <h2 style="color: ${color};">${title}</h2>
        <div id="${listId}">Cargando información...</div>
    `;
    const container = document.querySelector('.container');
    const historySection = document.querySelector('.admin-panel:last-child');
    container.insertBefore(section, historySection);
}

async function loadMyBans(token) {
    const list = document.getElementById('bansList');
    try {
        const res = await fetch('/api/rooms/my-bans', { headers: { 'Authorization': 'Bearer ' + token } });
        const bans = await res.json();
        list.innerHTML = '';
        if (bans.length === 0) {
            list.innerHTML = '<p style="color: green; font-weight: bold;">✅ No tienes restricciones activas en ninguna sala.</p>';
            return;
        }
        bans.forEach(ban => {
            const item = document.createElement('div');
            item.className = 'post-history-item';
            item.style.borderLeft = "4px solid #343a40";
            item.style.backgroundColor = "#f8f9fa";
            item.style.padding = "15px";
            item.style.marginBottom = "10px";
            const tiempo = ban.permanent ? '<span style="color:red; font-weight:bold;">PERMANENTE</span>' : `Expira el: ${new Date(ban.expiryDate).toLocaleString()}`;
            item.innerHTML = `
                <div style="font-weight: bold;">Sala: ${ban.room.name}</div>
                <div style="font-size: 13px; margin-top: 5px;">Estado: ${tiempo}</div>
            `;
            list.appendChild(item);
        });
    } catch (e) { list.innerHTML = '<p>Error al cargar baneos.</p>'; }
}

async function loadWarnings(endpoint, listId, token, type) {
    const list = document.getElementById(listId);
    try {
        const res = await fetch(endpoint, { headers: { 'Authorization': 'Bearer ' + token } });
        const warnings = await res.json();
        list.innerHTML = warnings.length === 0 ? '<p style="color:#888;">Sin registros.</p>' : '';
        warnings.forEach(w => {
            const item = document.createElement('div');
            item.className = 'post-history-item';
            item.style.borderLeft = "4px solid #dc3545";
            item.style.padding = "15px";
            item.style.backgroundColor = type === "RECIBIDO" ? "#fff5f5" : "#fff";
            item.style.marginBottom = "10px";
            let header = `📅 ${new Date(w.createdAt).toLocaleString()}`;
            if (type === "GLOBAL") header += ` | Mod: <b>${w.moderator.username}</b> ➔ <b>${w.recipient.username}</b>`;
            if (type === "ENVIADO") header += ` | Para: <b>${w.recipient.username}</b>`;
            if (type === "RECIBIDO") header += ` | De: <b>${w.moderator.username}</b>`;
            item.innerHTML = `
                <div style="font-size: 11px; color: #888;">${header}</div>
                <div style="font-weight: bold; color: #dc3545; margin: 3px 0;">Motivo: ${w.reason}</div>
                <div style="background: #eee; padding: 8px; border-radius: 4px; font-size: 12px; margin-bottom: 5px;">"${w.originalContent || 'N/A'}"</div>
                <div style="font-style: italic; font-size: 13px;">Msg: "${w.message}"</div>
            `;
            list.appendChild(item);
        });
    } catch (e) { list.innerHTML = '<p>Error.</p>'; }
}

async function loadNotifications(token) {
    const notifList = document.getElementById('notificationsList');
    try {
        const res = await fetch('/api/notifications', { headers: { 'Authorization': 'Bearer ' + token } });
        const notifications = await res.json();
        notifList.innerHTML = notifications.length === 0 ? '<p style="color:#888;">Sin notificaciones.</p>' : '';
        notifications.forEach(notif => {
            const item = document.createElement('div');
            item.className = 'post-history-item';
            item.style.backgroundColor = '#f0f8ff';

            // CORRECCIÓN: Solo pintamos el botón si la notificación tiene una sala asignada.
            let linkHTML = '';
            if (notif.relatedRoomId) {
                linkHTML = `<a href="room.html?id=${notif.relatedRoomId}" style="font-size: 12px; font-weight: bold; color:#007bff; text-decoration:none;">Ir a la sala ➡️</a>`;
            }

            item.innerHTML = `
                <div style="font-size: 11px; color: #888;">⏰ ${new Date(notif.createdAt).toLocaleString()}</div>
                <div style="margin: 5px 0;">${notif.message}</div>
                ${linkHTML}
            `;
            notifList.appendChild(item);
        });
    } catch (e) { notifList.innerHTML = '<p>Error.</p>'; }
}

async function loadHistory(token) {
    const historyList = document.getElementById('historyList');
    try {
        const res = await fetch('/api/posts/my-history', { headers: { 'Authorization': 'Bearer ' + token } });
        const posts = await res.json();
        historyList.innerHTML = posts.length === 0 ? '<p style="color:#888;">Sin mensajes.</p>' : '';
        posts.forEach(post => {
            const item = document.createElement('div');
            item.className = 'post-history-item';
            const badge = post.approved ? '<span style="color:green">[✅]</span>' : '<span style="color:orange">[⏳]</span>';
            item.innerHTML = `
                <div style="font-size: 11px; color: #888;">📅 ${new Date(post.createdAt).toLocaleString()} en <b>${post.room.name}</b> ${badge}</div>
                <div style="padding: 10px; background: #f9f9f9; border-radius: 4px; margin-top:5px; border-left: 3px solid #ccc;">"${post.content}"</div>
            `;
            historyList.appendChild(item);
        });
    } catch (e) { historyList.innerHTML = '<p>Error.</p>'; }
}