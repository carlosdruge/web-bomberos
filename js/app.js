// js/app.js

// 1. Importamos la base de datos segura y los métodos oficiales de Firebase
import { db } from "./firebase-config.js";
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 2. Referencias a los elementos visuales del HTML
const inputNit = document.getElementById("input-nit");
const btnBuscar = document.getElementById("btn-buscar");
const txtCargando = document.getElementById("txt-cargando");
const contenedorResultado = document.getElementById("resultado-certificado");
const contenedorNoticias = document.getElementById("contenedor-noticias");

// ==========================================
// MÓDULO 1: BUSCADOR DE CERTIFICADOS SEGURO
// ==========================================
async function buscarCertificado() {
    const nit = inputNit.value.trim();
    
    if (!nit) {
        alert("Por favor, ingrese un número de NIT o identificación válido.");
        return;
    }

    // Mostramos indicador de carga y limpiamos respuestas anteriores
    txtCargando.classList.remove("hidden");
    contenedorResultado.classList.add("hidden");
    contenedorResultado.innerHTML = "";

    try {
        // Hacemos una consulta directa al documento con el ID igual al NIT
        const docRef = doc(db, "certificados", nit);
        const docSnap = await getDoc(docRef);

        // Ocultamos el spinner de carga y mostramos el contenedor
        txtCargando.classList.add("hidden");
        contenedorResultado.classList.remove("hidden");

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Validamos las fechas para determinar la vigencia
            const fechaVencimiento = new Date(data.vencimiento);
            const hoy = new Date();
            const esVigente = fechaVencimiento >= hoy;

            if (esVigente) {
                // Estado: VIGENTE (Verde institucional)
                contenedorResultado.innerHTML = `
                    <div class="border-2 border-green-500 bg-green-50 rounded-xl p-6 text-center space-y-4">
                        <div class="text-green-600 text-4xl"><i class="fa-solid fa-circle-check"></i></div>
                        <h3 class="text-xl font-bold text-green-900">CERTIFICADO AUTÉNTICO Y VIGENTE</h3>
                        <div class="text-sm text-slate-700 text-left space-y-2 bg-white p-4 rounded-lg border border-green-100">
                            <p><strong>Establecimiento:</strong> ${escaparHTML(data.nombre)}</p>
                            <p><strong>NIT / ID:</strong> ${escaparHTML(nit)}</p>
                            <p><strong>Expedición:</strong> ${data.expedicion}</p>
                            <p><strong>Vencimiento:</strong> ${data.vencimiento}</p>
                        </div>
                        <p class="text-xs text-slate-500">Este establecimiento cumple con las normas de seguridad humana y protección contra incendios.</p>
                    </div>
                `;
            } else {
                // Estado: VENCIDO (Alerta en amarillo/naranja)
                contenedorResultado.innerHTML = `
                    <div class="border-2 border-amber-400 bg-amber-50 rounded-xl p-5 text-center space-y-3">
                        <div class="text-amber-500 text-4xl"><i class="fa-solid fa-triangle-exclamation"></i></div>
                        <h3 class="text-lg font-black text-amber-900 uppercase">Certificado Vencido</h3>
                        <p class="text-sm text-amber-800">El documento expiró el <strong>${data.vencimiento}</strong>. Requiere renovación inmediata.</p>
                        <button onclick="abrirModalSolicitud()" class="mt-2 bg-amber-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-amber-600 transition text-sm">
                            <i class="fa-solid fa-calendar-check mr-1"></i> Solicitar Renovación
                        </button>
                    </div>
                `;
            }
        } else {
            // Estado: NO EXISTE (Rojo)
            contenedorResultado.innerHTML = `
                <div class="border-2 border-red-200 bg-red-50 rounded-xl p-5 text-center space-y-3">
                    <div class="text-red-500 text-4xl"><i class="fa-solid fa-circle-xmark"></i></div>
                    <h3 class="text-lg font-black text-slate-900 uppercase">Establecimiento No Registrado</h3>
                    <p class="text-sm text-slate-600">No hay registros vigentes para el NIT <strong>${nit}</strong>.</p>
                    <button onclick="abrirModalSolicitud()" class="mt-2 bg-red-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm">
                        <i class="fa-solid fa-calendar-check mr-1"></i> Solicitar Inspección Inicial
                    </button>
                </div>
            `;
        }

    } catch (error) {
        console.error("Error de conexión segura:", error);
        txtCargando.classList.add("hidden");
        alert("Ocurrió un error al conectar con el servidor seguro. Verifique su conexión.");
    }
}

// ==========================================
// MÓDULO 2: AUTOMATIZACIÓN DE WHATSAPP
// =========================================
function enviarSolicitudWhatsApp(nit, establecimiento, direccion = "No especificada") {
    const numeroBomberos = "573027270281"; 
    const mensaje = `Saludos Bomberos Cubarral. Deseo agendar una inspección técnica de seguridad.\n\n` +
                    `• *Establecimiento:* ${establecimiento}\n` +
                    `• *NIT/ID:* ${nit}\n` +
                    `• *Dirección:* ${direccion}\n\n` +
                    `Quedo atento a la asignación de la fecha de visita.`;
    
    const urlUrl = `https://wa.me/${numeroBomberos}?text=${encodeURIComponent(mensaje)}`;
    window.open(urlUrl, "_blank");
}

// ==========================================
// MÓDULO 3: CARGA DINÁMICA DE NOTICIAS
// ==========================================
async function cargarNoticias() {
    try {
        const q = query(collection(db, "noticias"), orderBy("fecha", "desc"));
        const querySnapshot = await getDocs(q);
        
        contenedorNoticias.innerHTML = "";

        if (querySnapshot.empty) {
            contenedorNoticias.innerHTML = `<p class="text-sm text-slate-400 col-span-full text-center py-6">No hay comunicados oficiales publicados en este momento.</p>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const noticia = doc.data();
            
            const tarjeta = document.createElement("div");
            tarjeta.className = "bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col hover:shadow-lg transition duration-200";
            
            // LÓGICA DE MULTIMEDIA: ¿Es un código de Facebook/Instagram o es una foto normal?
            let multimediaHTML = '';
            if (noticia.embed && noticia.embed.includes("<iframe")) {
                // Si hay un código incrustado, lo renderizamos
                multimediaHTML = `
                    <div class="w-full flex justify-center bg-slate-50 border-b border-slate-100 overflow-hidden" style="min-height: 250px;">
                        ${noticia.embed}
                    </div>
                `;
            } else {
                // Si no hay código, mostramos la imagen normal
                multimediaHTML = `
                    <img src="${noticia.imagen || 'https://images.unsplash.com/photo-1599733589046-10c005739ef9?w=500'}" 
                         alt="Comunicado" class="w-full h-48 object-cover">
                `;
            }

            // Construimos la tarjeta uniendo la multimedia con el texto
            tarjeta.innerHTML = `
                ${multimediaHTML}
                <div class="p-5 flex-grow flex flex-col justify-between space-y-3">
                    <div>
                        <span class="text-xs text-red-600 font-semibold uppercase tracking-wider block">${noticia.fecha}</span>
                        <h3 class="text-lg font-bold text-slate-900 mt-1 leading-tight">${escaparHTML(noticia.titulo)}</h3>
                        <p class="text-slate-600 text-sm mt-2 line-clamp-3">${escaparHTML(noticia.contenido)}</p>
                    </div>
                </div>
            `;
            contenedorNoticias.appendChild(tarjeta);
        });
        
    } catch (error) {
        console.error("Error cargando noticias:", error);
        contenedorNoticias.innerHTML = `<p class="text-sm text-red-500 col-span-full text-center py-6">Error al cargar los comunicados oficiales.</p>`;
    }
}

// ==========================================
// MÓDULO 4: SANITIZACIÓN ANTIVULNERABILIDADES (XSS)
// ==========================================
function escaparHTML(cadena) {
    if (!cadena) return "";
    return cadena
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Escuchadores de eventos globales
btnBuscar.addEventListener("click", buscarCertificado);
inputNit.addEventListener("keypress", (e) => { if (e.key === "Enter") buscarCertificado(); });

// Inicialización automática de la web al cargar
document.addEventListener("DOMContentLoaded", cargarNoticias);

// ==========================================
// MÓDULO 5: EXPERIENCIA DE USUARIO (UX) Y MENÚS
// ==========================================

// 1. Desvanecimiento controlado del Splash Screen
window.addEventListener("load", () => {
    const splash = document.getElementById("splash-screen");
    if (splash) {
        // Le aplicamos una transición suave de opacidad
        splash.style.opacity = "0";
        setTimeout(() => {
            splash.classList.add("hidden");
        }, 500); // Se elimina por completo tras medio segundo de animación
    }
});

// 2. Control del Menú Desplegable Móvil
const btnMenuMovil = document.getElementById("btn-menu-movil");
const menuMovil = document.getElementById("menu-movil");

if (btnMenuMovil && menuMovil) {
    btnMenuMovil.addEventListener("click", () => {
        // Conmutamos la clase 'hidden' para mostrar u ocultar el menú móvil
        menuMovil.classList.toggle("hidden");
    });

    // Opcional: Cerrar el menú automáticamente al hacer clic en cualquier opción
    menuMovil.querySelectorAll("a").forEach(enlace => {
        enlace.addEventListener("click", () => {
            menuMovil.classList.add("hidden");
        });
    });
}