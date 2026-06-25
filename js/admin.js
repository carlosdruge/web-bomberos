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

// NUEVOS Elementos para el QR
const btnGenerarQr = document.getElementById("btn-generar-qr");
const contenedorQrVisual = document.getElementById("contenedor-qr-visual");
const codigoQr = document.getElementById("codigo-qr");
const resultadoQrLink = document.getElementById("resultado-qr-link"); // Se mantiene por si acaso

// Elementos de Noticias
const notTitulo = document.getElementById("not-titulo");
const notImagen = document.getElementById("not-imagen");
const notContenido = document.getElementById("not-contenido");
const notEmbed = document.getElementById("admin-noticia-embed"); 
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
        if(contenedorQrVisual) contenedorQrVisual.classList.add("hidden");
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
// OPERACIÓN 1: GESTIÓN DE CERTIFICADOS Y QR
// ==========================================

// PASO 1: CREAR EL CÓDIGO QR VISUAL
if(btnGenerarQr) {
    btnGenerarQr.addEventListener("click", () => {
        const nit = certNit.value.trim();
        
        if (!nit) {
            alert("⚠️ Primero debes escribir el NIT para poder generar el código QR.");
            return;
        }

        // 1. Limpiamos cualquier QR que se haya generado antes
        codigoQr.innerHTML = "";
        
        // REEMPLAZO INTELIGENTE: Obtiene la ruta base actual (funciona en Local y GitHub Pages)
        const rutaBase = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
        const enlaceVerificacion = `${rutaBase}/verificar.html?nit=${nit}`;
        
        // 2. Generamos la imagen del QR usando la librería
        new QRCode(codigoQr, {
            text: enlaceVerificacion,
            width: 150,
            height: 150,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        // 3. Mostramos el cuadro en pantalla para que lo puedan copiar
        contenedorQrVisual.classList.remove("hidden");
        contenedorQrVisual.classList.add("flex");
    });
}

// PASO 2: GUARDAR LOS DATOS EN FIREBASE
btnGuardarCert.addEventListener("click", async () => {
    const nit = certNit.value.trim();
    const nombre = certNombre.value.trim();
    const expedicion = certExpedicion.value;
    const vencimiento = certvencimiento.value;

    if (!nit || !nombre || !expedicion || !vencimiento) {
        alert("Todos los campos del certificado son obligatorios para poder registrarlo.");
        return;
    }

    // Cambiamos el texto del botón temporalmente
    const textoOriginal = btnGuardarCert.innerHTML;
    btnGuardarCert.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Guardando...';
    btnGuardarCert.disabled = true;

    try {
        await setDoc(doc(db, "certificados", nit), {
            nombre: nombre,
            expedicion: expedicion,
            vencimiento: vencimiento
        });

        alert("¡Registro Exitoso! El certificado ha sido activado en la base de datos.");
        
        // Limpiamos todo el formulario para el siguiente registro
        certNit.value = "";
        certNombre.value = "";
        certExpedicion.value = "";
        certvencimiento.value = "";
        
        // Ocultamos el QR
        contenedorQrVisual.classList.add("hidden");
        contenedorQrVisual.classList.remove("flex");
        codigoQr.innerHTML = "";

    } catch (error) {
        console.error("Error al guardar certificado:", error);
        alert("No se pudo guardar el certificado. Verifique sus permisos de administrador.");
    } finally {
        // Restauramos el botón
        btnGuardarCert.innerHTML = textoOriginal;
        btnGuardarCert.disabled = false;
    }
});


// ==========================================
// OPERACIÓN 2: PUBLICAR COMUNICADO EN FIRESTORE
// ==========================================
btnGuardarNoticia.addEventListener("click", async () => {
    const titulo = notTitulo.value.trim();
    const imagen = notImagen.value.trim();
    const contenido = notContenido.value.trim();
    const embed = notEmbed.value.trim(); 

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
            embed: embed || null, 
            fecha: fechaFormateada
        });

        alert("Comunicado oficial publicado con éxito en el portal.");
        
        notTitulo.value = "";
        notImagen.value = "";
        notContenido.value = "";
        notEmbed.value = ""; 

    } catch (error) {
        console.error("Error al publicar la noticia:", error);
        alert("No tiene permisos para publicar comunicados en este servidor.");
    }
});