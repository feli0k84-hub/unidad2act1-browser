const botonesCandidato = document.querySelectorAll('.btn-candidato');
const modales = document.querySelectorAll('.modal');
const botonesCerrar = document.querySelectorAll('.cerrar-modal');
const botonesAceptar = document.querySelectorAll('.aceptar-modal');
const selectVoto = document.getElementById('selectVoto');
const btnVotar = document.getElementById('btnVotar');
const mensajeVoto = document.getElementById('mensajeVoto');
const year = document.getElementById('year');

// Función para cerrar todos los modales
function cerrarTodos() {
    modales.forEach(function (modal) {
        modal.classList.remove('activo');
    });
}

// 1. Evento de clic: cada botón abre el modal de su candidato
botonesCandidato.forEach(function (boton) {
    boton.addEventListener('click', function () {
        const modal = document.getElementById(boton.dataset.modal);
        modal.classList.add('activo');
    });
});

// 2. Botones de cerrar (la X y el botón "Cerrar")
botonesCerrar.forEach(function (boton) {
    boton.addEventListener('click', cerrarTodos);
});

botonesAceptar.forEach(function (boton) {
    boton.addEventListener('click', cerrarTodos);
});

// 3. Evento utilizando el objeto "evento": clic fuera del contenido
modales.forEach(function (modal) {
    modal.addEventListener('click', function (evento) {
        if (evento.target === modal) {
            cerrarTodos();
        }
    });
});

// 4. Evento de teclado en todo el documento
document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape') {
        cerrarTodos();
    }
});

// 5. Interacción con el usuario: votar por un candidato
btnVotar.addEventListener('click', function () {
    if (selectVoto.value === '') {
        mensajeVoto.innerHTML = '<i class="fas fa-circle-exclamation"></i> Selecciona un candidato antes de votar.';
    } else {
        mensajeVoto.innerHTML = '<i class="fas fa-circle-check"></i> Gracias por tu voto por ' + selectVoto.value + '.';
    }
});

// 6. Lógica de la fecha
const fechaActual = new Date();
year.textContent = '© ' + fechaActual.getFullYear() + ' Balón de Oro 2026';

/* ==========================================================
   PWA
   ========================================================== */

// Registro del service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker
            .register('./service-worker.js')
            .then(function (registro) {
                console.log('Service worker registrado correctamente.', registro.scope);
            })
            .catch(function (error) {
                console.error('Error al registrar el service worker.', error);
            });
    });
} else {
    console.warn('Este navegador no admite service worker');
}

// Instalación de la PWA
const btnInstalar = document.getElementById('btnInstalar');
const estadoInstalacion = document.getElementById('estadoInstalacion');
let eventoInstalacion = null;

window.addEventListener('beforeinstallprompt', function (evento) {
    evento.preventDefault();
    eventoInstalacion = evento;

    if (btnInstalar) {
        btnInstalar.hidden = false;
    }
});

if (btnInstalar) {
    btnInstalar.addEventListener('click', async function () {
        if (!eventoInstalacion) {
            if (estadoInstalacion) {
                estadoInstalacion.textContent = 'La instalación se gestiona desde las opciones del navegador.';
            }
            return;
        }
        eventoInstalacion.prompt();

        const resultado = await eventoInstalacion.userChoice;
        if (estadoInstalacion) {
            estadoInstalacion.textContent = resultado.outcome === 'accepted'
                ? 'Instalación aceptada'
                : 'Instalación cancelada';
        }
        eventoInstalacion = null;
        btnInstalar.hidden = true;
    });
}

window.addEventListener('appinstalled', function () {
    if (estadoInstalacion) {
        estadoInstalacion.textContent = 'Balón de Oro 2026 fue instalada correctamente';
    }
    if (btnInstalar) {
        btnInstalar.hidden = true;
    }
    eventoInstalacion = null;
});

// Si ya se abrió como app instalada, no tiene sentido mostrar el botón
if (window.matchMedia('(display-mode: standalone)').matches && btnInstalar) {
    btnInstalar.hidden = true;
}

// Versión "browser": Chrome solo dispara beforeinstallprompt con display
// fullscreen, standalone o minimal-ui. Con "browser" el evento no llega,
// así que mostramos el botón y explicamos la instalación manual (acceso directo).
window.addEventListener('load', function () {
    setTimeout(function () {
        if (!eventoInstalacion && btnInstalar) {
            btnInstalar.hidden = false;
        }
    }, 1500);
});

if (btnInstalar) {
    btnInstalar.addEventListener('click', function () {
        if (eventoInstalacion || !estadoInstalacion) {
            return;
        }
        const esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        estadoInstalacion.textContent = esMovil
            ? 'Abre el menú del navegador (⋮ o Compartir) y elige "Agregar a la pantalla principal".'
            : 'Abre el menú del navegador (⋮) y elige "Guardar y compartir" > "Crear acceso directo".';
    });
}
