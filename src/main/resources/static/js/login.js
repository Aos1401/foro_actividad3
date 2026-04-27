document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageEl = document.getElementById('loginMessage');

    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(async response => {
        if (response.ok) {
            // Leemos el paquete JSON que nos envía el servidor
            const data = await response.json();

            // Guardamos la llave mágica y los datos en la memoria del navegador
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('role', data.role);

            // Mostramos un mensaje súper sencillo y amigable
            messageEl.textContent = "¡Inicio de sesión exitoso, " + data.username + "!";
            messageEl.className = 'message success';

            // Redirigimos a la página principal
            setTimeout(() => {
                window.location.href = "home.html";
            }, 1000);
        } else {
            messageEl.textContent = "Error: Credenciales inválidas";
            messageEl.className = 'message error';
        }
    })
    .catch(error => {
        messageEl.textContent = "Error de conexión al servidor.";
        messageEl.className = 'message error';
    });
});