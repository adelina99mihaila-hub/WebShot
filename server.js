const express = require("express");
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const { hacerCaptura, VIEWPORTS } = require("./capturas");
const robotsParser = require("robots-parser");
const archiver = require("archiver");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Carpeta donde se guardarán las capturas
const CARPETA_CAPTURAS = path.join(__dirname, "capturas");
fs.mkdirSync(CARPETA_CAPTURAS, { recursive: true });
app.use("/capturas", express.static(CARPETA_CAPTURAS));

// ---------- Helper para ZIP/PDF ----------
function nombresValidos(lista) {
    if (!Array.isArray(lista) || lista.length === 0 || lista.length > 200) return [];
    return lista
        .filter(function (a) { return typeof a === "string"; })
        .map(function (a) { return path.basename(a); })
        .filter(function (n) {
            return /^captura-[\w-]+\.png$/.test(n) && fs.existsSync(path.join(CARPETA_CAPTURAS, n));
        });
}

// ---------- Captura individual ----------
app.post("/api/captura", async (req, res) => {
    let { url, tamano } = req.body ?? {};

    if (typeof url !== "string" || url.trim() === "") {
        return res.status(400).json({ error: "URL inválida" });
    }

    url = url.trim();

    if (/^[a-z][a-z\d+.-]*:\/\//i.test(url) && !/^https?:\/\//i.test(url)) {
        return res.status(400).json({ error: "Solo se permiten URLs con http o https" });
    }

    if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
    }

    try {
        new URL(url);
    } catch {
        return res.status(400).json({ error: "URL inválida" });
    }

    if (!VIEWPORTS[tamano]) {
        return res.status(400).json({
            error: `Tamaño no válido. Usa: ${Object.keys(VIEWPORTS).join(", ")}`
        });
    }

    const nombreArchivo = `captura-${Date.now()}-${tamano}.png`;
    const rutaArchivo = path.join(CARPETA_CAPTURAS, nombreArchivo);

    try {
        await hacerCaptura(url, tamano, rutaArchivo);
        return res.json({
            ok: true,
            imagen: `/capturas/${nombreArchivo}`,
            tamano,
            url
        });
    } catch (error) {
        console.error("Error al hacer la captura:", error);
        return res.status(500).json({ error: "No se pudo hacer la captura." });
    }
});

// ---------- ZIP ----------
app.post("/api/zip", (req, res) => {
    const nombres = nombresValidos(req.body?.archivos);
    if (nombres.length === 0) {
        return res.status(400).json({ error: "No hay capturas válidas para comprimir." });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="capturas.zip"');

    const zip = archiver("zip");

    zip.on("error", function (error) {
        console.error("Error al crear el ZIP:", error);
        if (!res.headersSent) {
            res.status(500).end();
        } else {
            res.end();
        }
    });

    zip.pipe(res);

    nombres.forEach(function (n) {
        zip.file(path.join(CARPETA_CAPTURAS, n), { name: n });
    });

    zip.finalize();
});

// ---------- PDF ----------
app.post("/api/pdf", async (req, res) => {
    const nombres = nombresValidos(req.body?.archivos);
    if (nombres.length === 0) {
        return res.status(400).json({ error: "No hay capturas válidas para exportar." });
    }

    const imagenes = nombres.map(function (n) {
        const base64 = fs.readFileSync(path.join(CARPETA_CAPTURAS, n)).toString("base64");
        return `<img src="data:image/png;base64,${base64}" style="width:100%;display:block;page-break-after:always;">`;
    }).join("");

    let navegador;
    try {
        navegador = await chromium.launch();
        const pagina = await navegador.newPage();
        await pagina.setContent(`<html><body style="margin:0">${imagenes}</body></html>`);
        const pdf = await pagina.pdf({ format: "A4", printBackground: true });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="capturas.pdf"');
        return res.send(pdf);
    } catch (error) {
        console.error("Error al crear el PDF:", error);
        return res.status(500).json({ error: "No se pudo crear el PDF." });
    } finally {
        if (navegador) await navegador.close();
    }
});

// ---------- Crawl ----------
app.post("/api/crawl", async (req, res) => {
    let urlTexto = req.body?.url;

    if (typeof urlTexto !== "string" || urlTexto.trim() === "") {
        return res.status(400).json({ error: "URL inválida" });
    }

    urlTexto = urlTexto.trim();

    if (/^[a-z][a-z\d+.-]*:\/\//i.test(urlTexto) && !/^https?:\/\//i.test(urlTexto)) {
        return res.status(400).json({ error: "Solo se permiten URLs con http o https" });
    }

    if (!/^https?:\/\//i.test(urlTexto)) {
        urlTexto = "https://" + urlTexto;
    }

    let urlPrueba;
    try {
        urlPrueba = new URL(urlTexto);
    } catch {
        return res.status(400).json({ error: "URL inválida" });
    }

    const opciones = req.body ?? {};
    const { maxDepth, maxUrls, allowedDomains, respectRobots } = opciones;

    if (!Number.isInteger(maxDepth) || maxDepth < 0 || maxDepth > 5) {
        return res.status(400).json({ error: "Profundidad máxima inválida. Debe ser un número entero entre 0 y 5." });
    }

    if (!Number.isInteger(maxUrls) || maxUrls < 1 || maxUrls > 100) {
        return res.status(400).json({ error: "Límite de URLs inválido. Debe ser un número entero entre 1 y 100." });
    }

    if (typeof allowedDomains !== "string") {
        return res.status(400).json({ error: "El dominio debe ser una cadena de texto." });
    }

    if (typeof respectRobots !== "boolean") {
        return res.status(400).json({ error: "La opción de respetar robots.txt debe ser true o false." });
    }

    const cacheRobots = new Map();

    async function puedeRastrear(url) {
        if (!respectRobots) return true;

        const direccion = new URL(url);
        const origen = direccion.origin;

        if (!cacheRobots.has(origen)) {
            const urlRobots = `${origen}/robots.txt`;
            try {
                const respuesta = await fetch(urlRobots, { signal: AbortSignal.timeout(5000) });

                if (respuesta.status === 404) {
                    cacheRobots.set(origen, robotsParser(urlRobots, ""));
                } else if (!respuesta.ok) {
                    console.warn(`No se pudo leer ${urlRobots}: HTTP ${respuesta.status}`);
                    cacheRobots.set(origen, null);
                } else {
                    const contenido = await respuesta.text();
                    cacheRobots.set(origen, robotsParser(urlRobots, contenido));
                }
            } catch (error) {
                console.error(`Error al consultar ${urlRobots}: `, error);
                cacheRobots.set(origen, null);
            }
        }

        const reglas = cacheRobots.get(origen);
        return reglas !== null && reglas.isAllowed(url, "*") === true;
    }

    const hostPermitido = allowedDomains.trim();

    if (hostPermitido !== "") {
        if (/[\/:?#@\s]/.test(hostPermitido)) {
            return res.status(400).json({ error: "El dominio contiene caracteres inválidos." });
        }

        try {
            const urlPermitido = new URL("https://" + hostPermitido);
            if (urlPermitido.hostname !== hostPermitido.toLowerCase()) {
                return res.status(400).json({ error: "El dominio permitido no es válido." });
            }
        } catch {
            return res.status(400).json({ error: "El dominio permitido no es una URL válida." });
        }
    }

    const hostPermitidos = new Set([urlPrueba.hostname.toLowerCase()]);
    if (hostPermitido !== "") hostPermitidos.add(hostPermitido.toLowerCase());

    let navegador;
    try {
        navegador = await chromium.launch({ headless: true });
        const page = await navegador.newPage();

        await page.route("**/*", async route => {
            const solicitud = route.request();

            if (!solicitud.isNavigationRequest() || solicitud.frame() !== page.mainFrame()) {
                await route.continue();
                return;
            }

            let destino;
            try {
                destino = new URL(solicitud.url());
            } catch {
                await route.abort();
                return;
            }

            const protocolo = destino.protocol === "http:" || destino.protocol === "https:";
            if (!protocolo) {
                await route.abort();
                return;
            }

            await route.continue();
        });

        const paginas = [];
        const cola = [];

        const urlPrincipal = new URL(urlPrueba.href);
        urlPrincipal.hash = "";
        const urlPrincipalNormalizada = urlPrincipal.href;

        cola.push({ url: urlPrincipalNormalizada, depth: 0 });
        const urlVistas = new Set([urlPrincipalNormalizada]);

        while (cola.length > 0 && paginas.length < maxUrls) {
            const paginaActual = cola.shift();

            if (!(await puedeRastrear(paginaActual.url))) continue;

            try {
                const respuesta = await page.goto(paginaActual.url, {
                    waitUntil: "domcontentloaded",
                    timeout: 30000
                });

                const titulo = await page.title();
                const urlFinal = page.url();

                paginas.push({
                    title: titulo || "Sin titulo",
                    url: urlFinal,
                    depth: paginaActual.depth,
                    status: respuesta && respuesta.ok() ? "ok" : "error"
                });

                const urlFinalNormalizada = new URL(urlFinal);
                urlFinalNormalizada.hash = "";
                urlVistas.add(urlFinalNormalizada.href);

                if (paginaActual.depth >= maxDepth) continue;

                const enlacesEncontrados = await page.locator("a[href]").evaluateAll(enlaces =>
                    enlaces.map(enlace => ({
                        texto: (enlace.textContent || "").trim(),
                        url: enlace.href
                    }))
                );

                for (const enlace of enlacesEncontrados) {
                    if (paginas.length + cola.length >= maxUrls) break;

                    let urlEnlace;
                    try {
                        urlEnlace = new URL(enlace.url);
                    } catch {
                        continue;
                    }

                    if (
                        (urlEnlace.protocol !== "http:" && urlEnlace.protocol !== "https:") ||
                        !hostPermitidos.has(urlEnlace.hostname.toLowerCase())
                    ) continue;

                    urlEnlace.hash = "";
                    const urlNormalizada = urlEnlace.href;

                    if (urlVistas.has(urlNormalizada)) continue;
                    if (!(await puedeRastrear(urlNormalizada))) continue;

                    urlVistas.add(urlNormalizada);
                    cola.push({ url: urlNormalizada, depth: paginaActual.depth + 1 });
                }
            } catch (error) {
                console.error("Error al visitar la página:", paginaActual.url, error);
                paginas.push({
                    title: "Sin titulo",
                    url: paginaActual.url,
                    depth: paginaActual.depth,
                    status: "error"
                });
            }
        }

        return res.json({ pages: paginas });

    } catch (error) {
        console.error("Error al procesar la URL:", error);
        return res.status(500).json({ error: "Error interno del servidor al procesar la URL." });
    } finally {
        if (navegador) await navegador.close();
    }
});

app.listen(3000, () => {
    console.log("WebShot funcionando en http://localhost:3000");
});