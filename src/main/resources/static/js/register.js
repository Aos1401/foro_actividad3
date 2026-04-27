document.addEventListener("DOMContentLoaded", () => {
    // Buscamos el formulario en el HTML
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Cogemos los valores que el usuario ha escrito
            // (Nota: asegúrate de que estos IDs coinciden con los <input> de tu HTML)
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            // El sitio donde vamos a poner el mensaje rojo de error o verde de éxito
            const messageEl = document.getElementById('registerMessage');

            fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            })
            .then(async response => {
                if (response.ok) {
                    // Si todo va bien, leemos la llave y entramos
                    const data = await response.json();

                    localStorage.setItem('token', data.token);
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('role', data.role);

                    messageEl.textContent = "¡Cuenta creada con éxito! Entrando al foro...";
                    messageEl.style.color = "green"; // Lo pintamos de verde

                    setTimeout(() => {
                        window.location.href = "home.html";
                    }, 1000);
                } else {
                    // AQUI ATRAPAMOS EL ERROR DEL SERVIDOR
                    const errorText = await response.text();

                    // Sustituimos el texto vacío por la explicación real del backend
                    messageEl.textContent = errorText;
                    messageEl.style.color = "red"; // Lo pintamos de rojo
                }
            })
            .catch(error => {
                messageEl.textContent = "Error de conexión al servidor.";
                messageEl.style.color = "red";
            });
        });
    }
});