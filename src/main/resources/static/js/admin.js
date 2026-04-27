document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'ROLE_SUPERADMIN') {
        window.location.href = "home.html";
        return;
    }
    loadUsers();
});

function loadUsers() {
    fetch('/api/users', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(res => res.json())
    .then(users => {
        const list = document.getElementById('usersList');
        if (!list) return;
        list.innerHTML = '';

        // Filtramos para no mostrarnos a nosotros mismos ni a los ya eliminados
        const usersToManage = users.filter(user =>
            user.role !== 'ROLE_SUPERADMIN' &&
            !user.username.startsWith("Usuario_Eliminado")
        );

        if (usersToManage.length === 0) {
            list.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay usuarios activos para gestionar.</td></tr>';
            return;
        }

        usersToManage.forEach(user => {
            const row = document.createElement('tr');
            let roleDisplay = user.role === 'ROLE_MODERATOR'
                ? '<span style="color: green; font-weight: bold;">🛡️ Moderador</span>'
                : '<span style="color: gray;">👤 Participante</span>';

            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${roleDisplay}</td>
                <td>
                    <button class="btn-role btn-admin" onclick="changeRole(${user.id}, 'ROLE_MODERATOR')" style="background:#28a745; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Hacer Mod</button>
                    <button class="btn-role btn-user" onclick="changeRole(${user.id}, 'ROLE_PARTICIPANT')" style="background:#6c757d; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Hacer User</button>
                    <button class="btn-role" onclick="deleteUserAccount(${user.id}, '${user.username}')" style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-left:10px;">💀 Dar de Baja</button>
                </td>
            `;
            list.appendChild(row);
        });
    })
    .catch(error => console.error("Error al cargar usuarios:", error));
}

function changeRole(userId, newRole) {
    fetch(`/api/users/${userId}/role?role=${newRole}`, {
        method: 'PATCH',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => {
        if(response.ok) {
            Swal.fire('Actualizado', 'El rol ha sido cambiado.', 'success');
            loadUsers();
        } else {
            Swal.fire('Error', 'No se pudo cambiar el rol.', 'error');
        }
    });
}

function deleteUserAccount(userId, username) {
    Swal.fire({
        title: `¿Dar de baja a ${username}?`,
        text: "La cuenta será desactivada permanentemente. El usuario no podrá volver a entrar.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, dar de baja',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            })
            .then(response => {
                if(response.ok) {
                    Swal.fire('¡Ejecutado!', 'El usuario ha sido expulsado del sistema.', 'success');
                    loadUsers();
                } else {
                    Swal.fire('Error', 'No se pudo completar la baja.', 'error');
                }
            });
        }
    });
}