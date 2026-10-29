const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

// Tamaños de ventana para cada viewport
const VIEWPORTS = {
    desktop: { width: 1440, height: 900 },
    tablet: { width: 768, height: 1024 },
    movil: { width: 390, height: 844 },
};

// Hace una captura de una URL con un tamaño y la guarda en rutaArchivo
//async function hacerCaptura(url, tamano, rutaArchivo)
// Una función es un bloque de código con nombre que se puede usar muchas veces. Entre paréntesis van sus parámetros, los datos que necesita para trabajar:

// url: qué web capturar.
// tamano: "desktop", "tablet" o "movil".
// rutaArchivo: dónde guardar la imagen.

// Lleva async porque dentro usa await (Playwright tarda)
async function hacerCaptura(url, tamano, rutaArchivo) {
    if (!VIEWPORTS[tamano]) {
        throw new Error("Tamaño no válido: " + tamano);
    }
            //throw new Error(...) dice que: 
// Si el tamaño no existe, la función lanza un error y se para. No decide qué responder al usuario: eso se hace con express,Pablo recibirá el error en su catch de server.js. esta función solo avisa de que algo ha fallado.
    const navegador = await chromium.launch();
    try {
        const pagina = await navegador.newPage({ viewport: VIEWPORTS[tamano] });
        await pagina.goto(url, { waitUntil: "load", timeout: 30000 });
        await pagina.screenshot({ path: rutaArchivo });
    } finally {
        await navegador.close();
    }
}
//.launch abre Chrome; .newPage abre una pestaña con el tamaño; .goto carga la web; .screenshot hace la foto y .close cierra Chrome.
//try { } finally { } sin catch
// Igual que antes, pero sin catch. Si algo falla (la web no carga, por ejemplo), el error sube hacia quien llamó a la función, es decir, hacia Pablo. El finally garantiza que Chrome se cierra siempre, aunque haya error.


// Hace scroll hasta un porcentaje de la página (0 = arriba, 100 = abajo del todo)
async function irAPunto(pagina, porcentaje) {
    await pagina.evaluate((p) => {
        const maximo = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, Math.max(0, maximo) * p / 100);
    }, porcentaje);
    await pagina.waitForTimeout(500);
}
// pagina.evaluate(...) ejecuta código dentro de la web, no en Node. Por eso ahí existen document y window, y el porcentaje se le pasa como segundo argumento.
// maximo es el alto total de la página menos el alto de la ventana: lo máximo que se puede bajar.
// waitForTimeout(500) espera medio segundo para que carguen las imágenes que aparecen al hacer scroll.

//NUEVO
// Hace las fotos de una URL en una pestaña que YA está abierta.
// No abre ni cierra Chrome: eso lo hace quien la llama.
async function fotografiar(
    pagina,
    { url, tamano, tipo, puntos, carpeta, nombreBase },
) {
    await pagina.goto(url, { waitUntil: "load", timeout: 30000 });
    const resultados = [];
  //pagina.goto(url, ...): goto significa “ir a”. Le dice a la pestaña que cargue esa dirección, como escribirla en la barra del navegador.
  //{ waitUntil: "load", ... }: “espera hasta que la página haya cargado del todo, imágenes incluidas”, para que la foto no salga a medias.
  //timeout: 30000: tiempo máximo en milisegundos (30 000 ms = 30 segundos). Si tarda más, se rinde y lanza un error.
  //await delante: “no pases a la siguiente línea hasta que la web haya cargado”.

if (tipo === "completa") {
    const archivo = `${nombreBase}_${tamano}_completa.png`; // la const archivo = ;  construye el nombre del archivo. Con comillas invertidas puedes meter variables dentro del texto con ${...}. Si nombreBase es cofre.io y tamano es desktop, el resultado es cofre.io_desktop_completa.png. usamos _ para separar las partes y sea más fácil de leer
    await pagina.screenshot({
        path: path.join(carpeta, archivo),
        fullPage: true,
    }); //Hace la foto. Le pasamos un objeto con opciones: 1.path: dónde guardar la imagen. path.join(carpeta, archivo) une la carpeta y el nombre en una ruta correcta: capturas\cofre.io_desktop_completa.png. Usamos path.join en vez de juntar texto con + porque pone bien la barra, sea Windows (\) u otro sistema (/). 2.fullPage: true: “página completa”. En vez de fotografiar solo lo que cabe en la ventana, hace una imagen larga de toda la web.
    resultados.push({ tamano, etiqueta: "Completa", archivo }); //push significa “empujar”: añade un elemento al final de la lista. Añadimos un objeto que describe la foto hecha: 1.tamano es una forma corta de escribir "tamano: tamano" (cuando la propiedad y la variable se llaman igual, basta con escribirlo una vez). 2.etiqueta: "Completa" es el texto que saldrá sobre la miniatura en la página 4. y 3.archivo es el nombre del archivo, otra vez en forma corta.
} else {
    for (const punto of puntos) {
        await irAPunto(pagina, punto);
        const archivo = `${nombreBase}_${tamano}_${punto}.png`;
        await pagina.screenshot({ path: path.join(carpeta, archivo) });
        resultados.push({ tamano, etiqueta: punto + "%", archivo });
    }
}
  // el "for" es un bucle que se lee: para cada "punto" de la lista "puntos", haz lo de dentro”.
  // el "await irAPunto(pagina, punto);"": llama a la función de antes para bajar hasta ese porcentaje.
  //const archivo = ...: igual que antes, pero el final del nombre es el número del punto. Por ejemplo, cofre.io_movil_50.png.
  // await pagina.screenshot({ path: ... });: hace la foto, esta vez sin fullPage, así que fotografía solo lo que se ve en la ventana en ese momento.
  //resultados.push({ ..., etiqueta: punto + "%", ... }): punto + "%" une el número y el símbolo, y da "50%".
    return resultados;
}

// Intenta hacer las fotos. Si falla, lo vuelve a intentar UNA vez más con una pestaña nueva.
async function fotografiarConReintento(navegador, opciones) {
    for (let intento = 1; intento <= 2; intento++) {
        const pagina = await navegador.newPage({ viewport: VIEWPORTS[opciones.tamano] });
        try {
            return await fotografiar(pagina, opciones);
        } catch (error) {
            if (intento === 2) {
                throw error;
            }
            console.warn("Fallo en el intento 1, reintentando:", opciones.url, opciones.tamano);
        } finally {
            await pagina.close();
        }
    }
}//Recibe dos cosas:
// navegador :// el Chrome ya abierto por //generarTodo. Esta función no abre Chrome; solo abre y cierra pestañas.
// opciones: //el objeto con url, tamano, tipo, //puntos, carpeta y nombreBase. Esta vez no lo desestructuramos con llaves, porque casi no usamos sus datos aquí: solo se lo pasamos tal cual a fotografiar. Cuando necesitamos un dato concreto, lo leemos con un punto: opciones.tamano, opciones.url.

// NUEVOO Convierte una URL en un texto válido para usarlo como nombre de archivo
function nombreSeguro(url) {
    return url
        .replace(/^https?:\/\//, "")//http:// o https:// al principio (^ = “al principio”, s? = “con o sin s”) se borra. ("" = nada), porque no aporta.
        .replace(/[^a-z0-9]+/gi, "_")//Cualquier grupo de caracteres que no sea letra ni número se cambia por _. Las letras g e i del final significan “todas las veces” y “da igual mayúscula o minúscula”.
        .replace(/^_+|_+$/g, "")//Guiones bajos al principio o al final se borran.
        .slice(0, 60);//Se queda con los primeros 60 caracteres. Hay URLs larguísimas y Windows tiene un límite de longitud de ruta.
}//Coge el texto de la URL y le aplica una cadena de transformaciones, una debajo de otra. Cada línea recibe el resultado de la anterior. Lo escribimos en varias líneas solo para que se lea mejor. “reemplaza”. Busca algo en el texto y lo cambia por otra cosa. Lo que se busca va entre barras /.../

// Hace TODAS las capturas de una URL con un tamaño:
// - tipo "viewport": una captura por cada punto de scroll
// - tipo "completa": una sola captura larga de toda la página
async function generarCapturas({ url, tamano, tipo = "viewport", puntos = [0], carpeta, nombreBase }) {
    if (!VIEWPORTS[tamano]) {
        throw new Error("Tamaño no válido: " + tamano);
    }
    if (tipo !== "viewport" && tipo !== "completa") {
        throw new Error("Tipo de captura no válido: " + tipo);
    }

    fs.mkdirSync(carpeta, { recursive: true });

    const navegador = await chromium.launch();
    
//Los dos "if" comprueban los datos antes de abrir Chrome. Si algo está mal, throw new Error(...) lanza un error y se para. Es mejor fallar pronto que abrir Chrome para nada.
//"fs.mkdirSync" crea la carpeta si no existe.
//"chromium.launch()"" abre Chrome. Lo guardamos en navegador para poder cerrarlo después.
        try {
        const pagina = await navegador.newPage({ viewport: VIEWPORTS[tamano] });//abre una pestaña nueva con el tamaño elegido.
        return await fotografiar(pagina, { url, tamano, tipo, puntos, carpeta, nombreBase });//le pasa la pestaña y los datos a fotografiar, espera a que termine y devuelve su lista de resultados.
    } finally {
        await navegador.close();
    } //} finally {: lo de dentro del finally se ejecuta siempre: si todo ha ido bien y también si ha habido un error."await navegador.close();" " cierra Chrome, para que nunca se quede abierto gastando memoria
}

// NUEVO Hace TODAS las capturas de la configuración de la página 3, abriendo Chrome UNA sola vez.
// datos = { "https://...": { puntos: [0, 40], tamanos: ["desktop", "movil"] }, ... }
async function generarTodo({ tipo, datos, carpeta }) {
        if (tipo !== "viewport" && tipo !== "completa") {
        throw new Error("Tipo de captura no válido: " + tipo);
    }

    fs.mkdirSync(carpeta, { recursive: true });

    const navegador = await chromium.launch();
    const resultados = [];
        try {
        for (const [url, ajustes] of Object.entries(datos)) {
            const capturas = [];
            const nombreBase = nombreSeguro(url);
                        for (const tamano of ajustes.tamanos) {
                if (!VIEWPORTS[tamano]) {
                    capturas.push({ tamano, error: "Tamaño no válido" });
                    continue;
                }//Un bucle dentro de otro bucle. Por cada URL, recorre sus tamaños. Si la URL tiene ["desktop", "movil"], esto se repite dos veces. "if (!VIEWPORTS[tamano])"" si el tamaño no existe en tu tabla… Esta vez no lanzamos un error, porque pararía todo. Lo apuntamos en la lista y seguimos. "continue" : “salta a la siguiente vuelta del bucle”. Deja este tamaño y pasa al siguiente sin ejecutar lo de abajo.
                                        try {
                    const fotos = await fotografiarConReintento(navegador, {
                        url,
                        tamano,
                        tipo,
                        puntos: ajustes.puntos,
                        carpeta,
                        nombreBase,
                    });
                    capturas.push(...fotos);
                } catch (error) {
                    console.error("No se pudo capturar", url, tamano, error.message);
                    capturas.push({ tamano, error: "No se pudo capturar la página" });
                } 
            }   
                        resultados.push({ url, capturas });
        }
    } finally {
        await navegador.close();
    }

    return resultados;
}

module.exports = { hacerCaptura, generarCapturas, generarTodo, VIEWPORTS };
//Es la línea clave para trabajar en equipo. Significa: “esto es lo que este archivo ofrece a otros archivos”. Sin ella, Pablo no podría usar la función desde server.js. También exporta VIEWPORTS por si Pablo necesita comprobar qué tamaños existen.
