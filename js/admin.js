// js/admin.js

// 1. Importaciones del núcleo de autenticación y base de datos
import { db, auth } from "./firebase-config.js";
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    addDoc, 
    collection 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 2. Referencias de los contenedores visuales
const seccionLogin = document.getElementById("seccion-login");
const seccionPanel = document.getElementById("seccion-panel");

// Elementos de Login
const loginCorreo = document.getElementById("login-correo");
const loginContrasena = document.getElementById("login-contrasena");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btn-logout");

// Elementos de Certificados
const certNit = document.getElementById("cert-nit");
const certNombre = document.getElementById("cert-nombre");
const certExpedicion = document.getElementById("cert-expedicion");
const certvencimiento = document.getElementById("cert-vencimiento");
const btnGuardarCert = document.getElementById("btn-guardar-cert");
const resultadoQrLink = document.getElementById("resultado-qr-link");

// Elementos de Noticias
const notTitulo = document.getElementById("not-titulo");
const notImagen = document.getElementById("not-imagen");
const notContenido = document.getElementById("not-contenido");
const notEmbed = document.getElementById("admin-noticia-embed"); // Referencia al nuevo campo iframe
const btnGuardarNoticia = document.getElementById("btn-guardar-noticia");


// ==========================================
// MONITOR DE ESTADO DE SESIÓN (GUARDIÁN DE SEGURIDAD)
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        seccionLogin.classList.add("hidden");
        seccionPanel.classList.remove("hidden");
    } else {
        seccionLogin.classList.remove("hidden");
        seccionPanel.classList.add("hidden");
        resultadoQrLink.classList.add("hidden");
    }
});


// ==========================================
// FLUJO: INICIAR Y CERRAR SESIÓN
// ==========================================
if(btnLogin) {
    btnLogin.addEventListener("click", async () => {
        const correo = loginCorreo.value.trim();
        const contrasena = loginContrasena.value.trim();

        if(!correo || !contrasena) {
            alert("Por favor rellene todos los campos de acceso.");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, correo, contrasena);
            alert("Acceso seguro autorizado.");
        } catch (error) {
            console.error("Fallo de autenticación:", error);
            alert("Credenciales inválidas. Acceso denegado.");
        }
    });
}

if(btnLogout) {
    btnLogout.addEventListener("click", async () => {
        try {
            await signOut(auth);
            alert("Sesión cerrada de forma segura.");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    });
}


// ==========================================
// OPERACIÓN 1: GESTIÓN DE CERTIFICADOS (PASO A PASO)
// ==========================================

// ESCUCHADOR DE ENTRADA EN EL NIT: Genera el link automáticamente
certNit.addEventListener("input", () => {
    const nit = certNit.value.trim();
    
    if (nit.length > 2) {
        const enlaceVerificacion = `${window.location.origin}/verificar.html?nit=${nit}`;
        
        resultadoQrLink.innerHTML = `
            <p class="font-bold text-amber-400 mb-1"><i class="fa-solid fa-qrcode mr-1"></i> Enlace generado para el código QR:</p>
            <input type="text" id="url-copiar" readonly value="${enlaceVerificacion}" class="w-full p-2 bg-slate-950 rounded border border-amber-900 text-amber-300 font-mono text-xs cursor-pointer" title="Haz clic para copiar">
            <p class="text-[10px] text-slate-400 mt-1">⚠️ <strong>Paso 1:</strong> Copia este enlace para crear tu QR físico. Al terminar tu documento, presiona el botón verde de abajo para registrarlo en el sistema.</p>
        `;
        resultadoQrLink.classList.remove("hidden");

        document.getElementById("url-copiar").addEventListener("click", function() {
            this.select();
            document.execCommand("copy");
            alert("¡Enlace copiado al portapapeles! Ya puedes generar tu código QR.");
        });
    } else {
        resultadoQrLink.classList.add("hidden");
    }
});

// BOTÓN FINAL: Guardar los datos en Firebase
btnGuardarCert.addEventListener("click", async () => {
    const nit = certNit.value.trim();
    const nombre = certNombre.value.trim();
    const expedicion = certExpedicion.value;
    const vencimiento = certvencimiento.value;

    if (!nit || !nombre || !expedicion || !vencimiento) {
        alert("Todos los campos del certificado son obligatorios para poder registrarlo.");
        return;
    }

    try {
        await setDoc(doc(db, "certificados", nit), {
            nombre: nombre,
            expedicion: expedicion,
            vencimiento: vencimiento
        });

        alert("¡Registro Exitoso! El certificado ha sido activado en la base de datos segura.");
        
        certNit.value = "";
        certNombre.value = "";
        certExpedicion.value = "";
        certvencimiento.value = "";
        resultadoQrLink.classList.add("hidden");

    } catch (error) {
        console.error("Error al guardar certificado:", error);
        alert("No se pudo guardar el certificado. Verifique sus permisos de administrador.");
    }
});


// ==========================================
// OPERACIÓN 2: PUBLICAR COMUNICADO EN FIRESTORE
// ==========================================
btnGuardarNoticia.addEventListener("click", async () => {
    const titulo = notTitulo.value.trim();
    const imagen = notImagen.value.trim();
    const contenido = notContenido.value.trim();
    const embed = notEmbed.value.trim(); // Captura el código iframe

    if(!titulo || !contenido) {
        alert("El título y el contenido son obligatorios para publicar un comunicado.");
        return;
    }

    const hoy = new Date();
    const fechaFormateada = hoy.toISOString().split('T')[0];

    try {
        await addDoc(collection(db, "noticias"), {
            titulo: titulo,
            imagen: imagen || null,
            contenido: contenido,
            embed: embed || null, // Guarda el código en Firebase
            fecha: fechaFormateada
        });

        alert("Comunicado oficial publicado con éxito en el portal.");
        
        notTitulo.value = "";
        notImagen.value = "";
        notContenido.value = "";
        notEmbed.value = ""; // Limpia el campo después de publicar

    } catch (error) {
        console.error("Error al publicar la noticia:", error);
        alert("No tiene permisos para publicar comunicados en este servidor.");
    }
});