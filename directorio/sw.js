// Directorio Digital de Emergencias
// Cuerpo de Bomberos Voluntarios de Cubarral

// Copyright © 2026 Carlos Ruge
// Todos los derechos reservados.

const CACHE_NAME = "directorio-emergencias-v2.5";

const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.png",
  "./preview.jpg",
  "./herocubarral.jpg",
  "./logobomberos.png",
  "./logopolicia.png",
  "./logohospital.png",
  "./logodefensacivil.png",
  "./logobiter7.png",
  "./logollanogas.png",
  "./logoemsa.png",
  "./icon-192.png",
  "./icon-512.png",
  "./qr-directorio.png",
  "./app.js"
];


self.addEventListener("install", event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("Guardando archivos locales críticos para uso offline...");
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error("Fallo al instalar el caché. Revisa que ninguna imagen dé error 404:", error);
      })
  );
});


self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("Borrando versión de caché antigua:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); 
});


self.addEventListener("fetch", event => {

  if (event.request.method !== "GET" || !event.request.url.startsWith("http")) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
       
        if (cachedResponse) {
          return cachedResponse;
        }

      
        return fetch(event.request)
          .then(networkResponse => {
            
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            return networkResponse;
          })
          .catch(() => {
            
            if (event.request.mode === "navigate") {
             
              return caches.match("./index.html");
            }
          });
      })
  );
});
