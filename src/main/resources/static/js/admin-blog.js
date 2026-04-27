document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');

    // Protección de ruta en JS
    if (localStorage.getItem('role') !== 'ROLE_SUPERADMIN') {
        window.location.href = "home.html";
        return;
    }

    let myEditor;

    // =======================================================
    // NUEVO: TRADUCTOR DE IMÁGENES A TEXTO (BASE64)
    // =======================================================
    class MyBase64UploadAdapter {
        constructor(loader) {
            this.loader = loader;
        }
        upload() {
            return this.loader.file
                .then(file => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        resolve({ default: reader.result }); // Devuelve la imagen como texto
                    };
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                }));
        }
        abort() {}
    }

    function MyCustomUploadAdapterPlugin(editor) {
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
            return new MyBase64UploadAdapter(loader);
        };
    }
    // =======================================================

    // Inicializar CKEditor con nuestro nuevo plugin
    ClassicEditor
        .create(document.querySelector('#editor'), {
            extraPlugins: [ MyCustomUploadAdapterPlugin ] // Conectamos el traductor
        })
        .then(editor => { myEditor = editor; })
        .catch(error => { console.error(error); });

    // Lógica del botón de publicar
    document.getElementById('publishBtn').addEventListener('click', () => {
        const title = document.getElementById('postTitle').value;
        const content = myEditor.getData();

        if(!title || !content) {
            Swal.fire('Atención', 'El título y el contenido son obligatorios.', 'warning');
            return;
        }

        fetch('/api/blog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ title: title, content: content })
        })
        .then(response => {
            if(response.ok) {
                Swal.fire('¡Éxito!', 'Artículo publicado en el blog.', 'success').then(() => {
                    window.location.href = "blog.html";
                });
            } else {
                Swal.fire('Error', 'No se pudo publicar el artículo. Si la imagen es muy grande, revisa la base de datos.', 'error');
            }
        })
        .catch(error => {
            console.error("Error al publicar:", error);
            Swal.fire('Error', 'Fallo de conexión.', 'error');
        });
    });
});