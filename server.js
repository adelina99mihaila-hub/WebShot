const express = require("express"); // require dice: tráeme esta librería. coge la librería Express de node_modules, y la guarda dentro de la constante express
const path = require("path"); // path viene incluido en Node. Sirve para construir rutas de carpetas que funcionen en cualquier sistema.
const fs = require("fs"); // fs (file system) viene incluido en Node. Sirve para crear carpetas y trabajar con archivos.
const { hacerCaptura, VIEWPORTS } = require("./capturas"); //NUEVO Conecta este archivo con capturas.js (importa la función y los tamaños válidos)

const app = express(); // Crea el servidor. A partir de aquí, app es tu servidor

app.use(express.json()); // Permite que el servidor entienda datos JSON enviados desde el navegador

app.use(express.static(path.join(__dirname, "public"))); // NUEVO Sirve archivos estáticos de la carpeta public (html, css, js del front)

// Carpeta donde se guardarán las capturas NUEVO
const CARPETA_CAPTURAS = path.join(__dirname, "capturas");
fs.mkdirSync(CARPETA_CAPTURAS, { recursive: true }); // Crea la carpeta si no existe
app.use("/capturas", express.static(CARPETA_CAPTURAS)); // Hace pública la carpeta capturas en la ruta /capturas

// Ruta principal: hace una captura de pantalla con el tamaño indicado
// Espera body JSON: { url: "...", tamano: "desktop" | "tablet" | "movil" }
app.post("/api/captura", async (req, res) => {
    let { url, tamano } = req.body ?? {};

    // Validación básica de URL
    if (typeof url !== "string" || url.trim() === "") {
        return res.status(400).json({ error: "URL inválida" });
    }

    url = url.trim(); // Elimina espacios al principio y final

    // Si trae protocolo distinto de http/https (ej: ftp://), lo bloqueamos
    if (/^[a-z][a-z\d+.-]*:\/\//i.test(url) && !/^https?:\/\//i.test(url)) {
        return res.status(400).json({
            error: "Solo se permiten URLs con http o https"
        });
    }

    // Si no trae protocolo, añadimos https://
    if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
    }

    // Verifica que la URL final sea válida
    try {
        new URL(url);
    } catch (error) {
        return res.status(400).json({ error: "URL inválida" });
    }

    // Valida tamaño contra los tamaños exportados en capturas.js 
    if (!VIEWPORTS[tamano]) {
        return res.status(400).json({
            error: `Tamaño no válido. Usa: ${Object.keys(VIEWPORTS).join(", ")}`
        });
    }

    // Nombre único para no sobrescribir imágenes anteriores
    const nombreArchivo = `captura-${Date.now()}-${tamano}.png`;
    const rutaArchivo = path.join(CARPETA_CAPTURAS, nombreArchivo);

    try {
        // Llama a la función del otro archivo (capturas.js)
        await hacerCaptura(url, tamano, rutaArchivo);

        // Devuelve la ruta pública de la imagen para mostrarla en el front
        return res.json({
            ok: true,
            imagen: `/capturas/${nombreArchivo}`,
            tamano,
            url
        });
    } catch (error) {
        console.error("Error al hacer la captura:", error);
        return res.status(500).json({
            error: "No se pudo hacer la captura."
        });
    }
});

app.listen(3000, () => {
    console.log("WebShot funcionando en http://localhost:3000");
}); // Enciende el servidor y lo deja escuchando en el puerto 3000
// Importante: app.listen suele ir al final, cuando ya configuraste todo.