
    const crawlDepth = document.getElementById("crawl-depth");
    const depthValue = document.getElementById("depth-value");

    crawlDepth.addEventListener("input", function () {
        depthValue.textContent = this.value;
    });


    const urlLimit = document.getElementById("url-limit");

    urlLimit.addEventListener("input", function () {
        if (this.value < 1) {
            this.value = 1;
        }

        if (this.value > 100) {
            this.value = 100;
        }
    });

    const allowedDomains = document.getElementById("allowed-domains");
    allowedDomains.addEventListener("input", function () {
        allowedDomains.value = allowedDomains.value.replace(/\s+/g, '');
    });
    
function mostrarPagina(idPagina){
    document.querySelectorAll(".pagina").forEach(function (pagina){
        pagina.hidden = pagina.id !== idPagina;
    });
    window.scrollTo(0,0);
}

//======  PÁGINA1  ========

// Array donde se guardan todas las URLs que el usuario va introduciendo.
let urls = [];

// Filtro de estado activo en la tabla (todas / ok / error).
let activeFilter = "all";

// 1. Cogemos los elementos del HTML
const formulario = document.getElementById("search-form");
const inputUrl = document.getElementById("url-input");
const paginaInicio = document.getElementById("inicio");
const paginaResultados = document.getElementById("pagina-1");
const tabla = document.getElementById("results-body");
const mensajeVacio = document.getElementById("empty-message");
const total = document.getElementById("total-count");
const totalAbajo = document.getElementById("bottom-total-count");

// 2. Cuando se envía el formulario (botón Analizar)...
formulario.addEventListener("submit", function (evento) {

// 3. Evitamos que la página se recargue
evento.preventDefault();
mostrarPagina("pagina-1"); //AQUÍ HE AÑADIDO EL MOSTRAR PÁGINA para que se muestre el contenido, sin esta línea no se mostraba nada.
});

// 2. Cuando se pulsa una tecla, se hace lo que se pulsa
inputUrl.addEventListener("keydown", function (evento) {

    
    //el evento "keydown" ocurre con cada letra que el usuario teclea, no solo al pulsar Enter. Si alguien empieza a escribir https://ejemplo.com, este código se ejecuta una vez por cada letra ("h", "ht", "htt"...), y como new URL("h") falla, se añadiría una fila con estado "Error" por cada letra escrita,
    //Solución: comprobar que la tecla pulsada es, en concreto, Enter, con un if:
    if (evento.key !== "Enter") return;
    
    // 3. Texto sin espacios
    const texto = inputUrl.value.trim();
// 4. Si está vacío, no hacemos nada
    if (texto === "") {return; }


    // 5. Variables
    let dominio = "";
    let ruta = "";
    let parametros = "";
    let cantidad = 0;
    let estado = "OK";

    // 6. Analizamos la URL
    try {
        const url = new URL(texto);
        dominio = url.hostname;
        ruta = url.pathname;
        parametros = url.search === "" ? "-" : url.search;
        // cantidad = Array.from(url.search).length;
        //cantidad no cuenta parámetros, cuenta letras. url.search es el texto completo de la query, por ejemplo "?a=1&b=2". Array.from(...) sobre un texto separa cada carácter, así que .length te da cuántas letras/símbolos tiene esa cadena, no cuántos parámetros hay.
        //Si querías contar parámetros (¿a y b, es decir 2?), es:

        cantidad = url.searchParams.size;

    } 
    
    // 7. Si no se analiza o no puede analizarse, se marca como error
    catch (Error) {
        estado = "Error";
    }

    // 8. Se crea una nueva fila en la tabla
    const fila = document.createElement("tr");
    fila.innerHTML = `
        <td><input type="checkbox"></td>
        <td>${texto}</td>
        <td>${dominio}</td>
        <td>${ruta}</td>
        <td>${parametros}</td>
        <td>${cantidad}</td>
        <td>${estado}</td>
    `;

    // 9. La añadimos a la tabla
    tabla.appendChild(fila);

    // 10. Limpiamos el input
    inputUrl.value = "";
});


//======  PÁGINA2  ========

function crearPunto(valor) {
    const punto = document.createElement("span");
    punto.className = "puntos__item";
    punto.innerHTML = "<input type='number' value='" + valor + "'><span>%</span><button class='puntos__quitar'>×</button>";
    
    const botonQuitar = punto.querySelector(".puntos__quitar");
    botonQuitar.addEventListener("click", function () {
        const cuantasHayAhora = contenedorPuntosScroll.querySelectorAll(".puntos__item").length;
        if (cuantasHayAhora > 1) {
            punto.remove();
        }

    })
    return punto;
}
const contenedorPuntosScroll = document.getElementById("puntos");
const btnAnadirPunto = document.getElementById("btn-anadir-punto");
const puntosPorDefecto =[0, 40, 80];

puntosPorDefecto.forEach(function (valor){
    const nuevaPastilla = crearPunto(valor);
    contenedorPuntosScroll.insertBefore(nuevaPastilla, btnAnadirPunto);
});
btnAnadirPunto.addEventListener("click", function () {
    const nuevaPastilla = crearPunto(100);
    contenedorPuntosScroll.insertBefore(nuevaPastilla, btnAnadirPunto);
});
const casillasViewport = document.querySelectorAll('input[name="viewport"]');
casillasViewport.forEach(function (casilla) {
    casilla.addEventListener("change", function (){
        const hayAlgunaMarcada = Array.from(casillasViewport).some(function (casilla){
    return casilla.checked;
});
    if (!hayAlgunaMarcada) {
        casilla.checked = true;
    }
    });
});


const webshot = "prueba";
