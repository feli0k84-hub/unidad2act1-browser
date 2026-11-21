// El prefijo incluye el modo display de esta versión (browser, minimal-ui, standalone, fullscreen).
// Así, si las 4 versiones están en el mismo dominio, ninguna borra el caché de las otras.
const PREFIJO = "BalonOro-browser-";
const CACHE_NAME = PREFIJO + "v2";
const RUNTIME_CACHE = PREFIJO + "runtime-v2";

// Recursos que estarán disponibles sin conexión a internet
// (si falta alguno, la instalación del service worker falla)
const APP_SHELL = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",
  "./css/estilos.css",
  "./js/app.js",
  "./img/logo.jpg",
  "./img/icons/icon-192.png",
  "./img/icons/icon-512.png",
  "./lib/fontawesome/css/all.min.css",
  "./lib/fontawesome/webfonts/fa-brands-400.woff2",
  "./lib/fontawesome/webfonts/fa-regular-400.woff2",
  "./lib/fontawesome/webfonts/fa-solid-900.woff2",
  "./lib/fontawesome/webfonts/fa-v4compatibility.woff2"
];

// Fotos de los candidatos: se guardan si existen, pero si falta alguna no rompe la instalación
const IMAGENES = [
  "./img/mbappe.jpg",
  "./img/yamal.jpg",
  "./img/kane.jpg",
  "./img/dembele.jpg",
  "./img/olise.jpg",
  "./img/rodri.jpg"
];

// Install - Guardamos el appshell en cache storage
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        await cache.addAll(APP_SHELL);
        await Promise.allSettled(IMAGENES.map((ruta) => cache.add(ruta)));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate - Eliminamos versiones antiguas de ESTA versión de la app
self.addEventListener("activate", (evento) => {
  const cachesPermitidos = [CACHE_NAME, RUNTIME_CACHE];
  evento.waitUntil(
    caches.keys()
      .then((nombres) =>
        Promise.all(
          nombres
            .filter((nombre) => nombre.startsWith(PREFIJO) && !cachesPermitidos.includes(nombre))
            .map((nombre) => caches.delete(nombre))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch - Network first con respaldo offline, y stale-while-revalidate para externos
self.addEventListener("fetch", (evento) => {
  const solicitud = evento.request;
  if (solicitud.method !== "GET") {
    return;
  }

  const url = new URL(solicitud.url);

  // Elementos HTML y navegación
  if (solicitud.mode === "navigate") {
    evento.respondWith(
      fetch(solicitud)
        .then((respuestaRed) => {
          const copia = respuestaRed.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(solicitud, copia));
          return respuestaRed;
        })
        .catch(async () => {
          return (
            (await caches.match(solicitud)) ||
            (await caches.match("./index.html")) ||
            (await caches.match("./offline.html"))
          );
        })
    );
    return;
  }

  // Recursos del mismo origen: cache first
  if (url.origin === self.location.origin) {
    evento.respondWith(
      caches.match(solicitud).then((respuestaCache) => {
        if (respuestaCache) {
          return respuestaCache;
        }
        return fetch(solicitud).then((respuestaRed) => {
          if (!respuestaRed || respuestaRed.status !== 200) {
            return respuestaRed;
          }
          const copia = respuestaRed.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(solicitud, copia));
          return respuestaRed;
        });
      })
    );
    return;
  }

  // Recursos adicionales
  evento.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const respuestaCache = await cache.match(solicitud);
      const actualizacion = fetch(solicitud)
        .then((respuestaRed) => {
          if (respuestaRed && (respuestaRed.ok || respuestaRed.type === "opaque")) {
            cache.put(solicitud, respuestaRed.clone());
          }
          return respuestaRed;
        })
        .catch(() => respuestaCache);

      return respuestaCache || actualizacion;
    })
  );
});
