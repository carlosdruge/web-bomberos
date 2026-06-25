// Directorio Digital de Emergencias
// Cuerpo de Bomberos Voluntarios de Cubarral

// Copyright © 2026 Carlos Ruge
// Todos los derechos reservados.

    // LOADER

    window.addEventListener("load", () => {

      const loader =
        document.getElementById("loader");

      setTimeout(() => {

        loader.classList.add("loader-hide");

      }, 1300);

    });

    // BUSCADOR

    const searchInput =
      document.getElementById("searchInput");

    searchInput.addEventListener("keyup", function(){

      const filter =
        searchInput.value.toLowerCase();

      const cards =
        document.querySelectorAll(".card");

      cards.forEach(card => {

        const text =
          card.innerText.toLowerCase();

        card.style.display =
          text.includes(filter)
          ? "flex"
          : "none";

      });

    });

    // TOAST

    function showToast(message){

      const toast =
        document.getElementById("toast");

      const toastText =
        document.getElementById("toastText");

      toastText.innerText =
        message;

      toast.classList.add("show");

      setTimeout(() => {

        toast.classList.remove("show");

      }, 2500);

    }

    // COPIAR NUMERO

    function copyNumber(number){

      navigator.clipboard.writeText(number);

      showToast(
        "Número copiado: " + number
      );

    }


    // ============================
// PWA / INSTALAR APP
// ============================

const installBtn =
  document.getElementById("installBtn");

let deferredPrompt = null;

function isAppInstalled() {

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );

}

function isIOS() {

  return /iphone|ipad|ipod/i.test(
    navigator.userAgent
  );

}

// Mostrar botón si NO está instalada

if (!isAppInstalled()) {

  installBtn.style.display = "flex";

} else {

  installBtn.style.display = "none";

}

// REGISTRAR SERVICE WORKER

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker
      .register("./sw.js")

      .then(() => {

        console.log(
          "Service Worker registrado"
        );

      })

      .catch(error => {

        console.log(
          "Error Service Worker:",
          error
        );

      });

  });

}

// Android

window.addEventListener(
  "beforeinstallprompt",
  (e) => {

    e.preventDefault();

    deferredPrompt = e;

  }
);

// Cuando se instala

window.addEventListener(
  "appinstalled",
  () => {

    installBtn.style.display = "none";

    deferredPrompt = null;

  }
);

// Botón instalar

installBtn.addEventListener(
  "click",
  async () => {

    if (isAppInstalled()) {

      installBtn.style.display = "none";

      return;

    }

    if (deferredPrompt) {

      deferredPrompt.prompt();

      const { outcome } =
        await deferredPrompt.userChoice;

      if (outcome === "accepted") {

        showToast(
          "Directorio instalado correctamente"
        );

      }

      deferredPrompt = null;

      return;

    }

    if (isIOS()) {

      alert(
`Para instalar el Directorio de Emergencias:

1. Pulse Compartir en Safari.

2. Seleccione "Añadir a pantalla de inicio".

3. Pulse "Añadir".

La aplicación quedará instalada y podrá utilizarse sin conexión.`
      );

      return;

    }

    showToast(
      "La instalación no está disponible en este navegador."
    );

  }
);

    const DIRECTORY_URL =
"https://bomberoscubarral.github.io/directoriodigitaldeemergenciascubarralmeta/";

function openShareModal(){

  document
    .getElementById(
      "shareModal"
    )
    .classList.add(
      "active"
    );

}

function closeShareModal(){

  document
    .getElementById(
      "shareModal"
    )
    .classList.remove(
      "active"
    );

}

async function shareDirectory(){

  if(navigator.share){

    try{

      await navigator.share({

        title:
        "Directorio Digital de Emergencias",

        text:
        "Directorio Digital de Emergencias de Cubarral Meta",

        url:
        DIRECTORY_URL

      });

    }catch(error){}

  }else{

    copyDirectoryLink();

  }

}

function copyDirectoryLink(){

  navigator.clipboard.writeText(
    DIRECTORY_URL
  );

  showToast(
    "Enlace copiado correctamente"
  );

}
    window.addEventListener(
  "load",
  () => {

    document
      .getElementById(
        "shareModal"
      )
      .onclick = function(e){

        if(
          e.target === this
        ){

          closeShareModal();

        }

      };

  }
);
    
    // ACTUALIZAR AUTOMATICAMENTE

    navigator.serviceWorker?.addEventListener(
      "controllerchange",
      () => {

        window.location.reload();

      }
    );
