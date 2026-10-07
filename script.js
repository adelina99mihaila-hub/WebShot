
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

let activeFilter = "all";

const formulario = document.getElementById("search-box");
const inputUrl = document.getElementById("url-input");
const tabla = document.getElementById("results-body");
const mensajeVacio = document.getElementById("empty-message");
const total = document.getElementById("total-count");
const totalAbajo = document.getElementById("bottom-total-count");
const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".filter-button");
const selectAll = document.getElementById("select-all");
const bottomSelectedCount = document.getElementById("bottom-selected-count");
const processButton = document.getElementById("process-button");


formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const texto = inputUrl.value.trim();
    if (texto === "") return;

    let dominio = "";
    let ruta = "";
    let parametros = "";
    let cantidad = 0;
    let estado = "OK";

    // Analizamos la URL
    try {
        const url = new URL(texto);
        dominio = url.hostname;
        ruta = url.pathname;
        parametros = url.search === "" ? "-" : url.search;
        cantidad = Array.from(url.searchParams).length;
    } catch (e) {
        estado = "Error";
    }

    const fila = document.createElement("tr");
    fila.dataset.estado = estado.toLowerCase();
    fila.innerHTML = `
        <td><input type="checkbox"></td>
        <td>${texto}</td>
        <td>${dominio}</td>
        <td>${ruta}</td>
        <td>${parametros}</td>
        <td>${cantidad}</td>
        <td>${estado}</td>
    `;

    tabla.appendChild(fila);

    const checkboxFila = fila.querySelector('input[type="checkbox"]');
    checkboxFila.addEventListener("change", actualizarContadores);

    inputUrl.value = "";
    actualizarContadores();
    aplicarFiltros();
    mostrarPagina("pagina-1");
});

function aplicarFiltros() {
    const textoBuscado = searchInput.value.trim().toLowerCase();
    const filas = tabla.querySelectorAll("tr");

    filas.forEach(function (fila) {
        const textoFila = fila.textContent.trim().toLowerCase();
        const coincideBusqueda = textoFila.includes(textoBuscado);
        const coincideFiltro = activeFilter === "all" || fila.dataset.estado === activeFilter;

        fila.hidden = !(coincideBusqueda && coincideFiltro);
    });
}
searchInput.addEventListener("input", aplicarFiltros);

filterButtons.forEach(function (boton) {
    boton.addEventListener("click", function () {
        filterButtons.forEach(function (b) {
            b.classList.remove("active");
        });
        boton.classList.add("active");

        activeFilter = boton.dataset.filter;
        aplicarFiltros();
    });
});

function actualizarContadores() {
    const checkboxesFilas = tabla.querySelectorAll("input[type='checkbox']");
    const totalFilas = checkboxesFilas.length;

    const marcados = Array.from(checkboxesFilas).filter(function (c) {
        return c.checked;
    });
    const totalMarcados = marcados.length;

    total.textContent = totalFilas;
    totalAbajo.textContent = totalFilas;
    bottomSelectedCount.textContent = totalMarcados;

    processButton.disabled = totalMarcados === 0;
    mensajeVacio.hidden = totalFilas > 0;
}

selectAll.addEventListener("change", function () {
    const checkboxesFilas = tabla.querySelectorAll("input[type='checkbox']");
    checkboxesFilas.forEach(function (c) {
        c.checked = selectAll.checked;
    });
    actualizarContadores();
});

processButton.addEventListener("click", function () {
    mostrarPagina("pag2");
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


