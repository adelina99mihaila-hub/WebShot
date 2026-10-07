
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


let urls = [];
let activeFilter = "all";

const formulario = document.getElementById("search-box");
const inputUrl = document.getElementById("url-input");
const paginaInicio = document.getElementById("inicio");
const paginaResultados = document.getElementById("pagina-1");
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
mostrarPagina("pagina-1"); 
});
    
    const texto = inputUrl.value.trim();
    if (texto === "") return;


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
        cantidad = url.searchParams.size;
    } 
    catch (e) {
        estado = "Error";
    }


    const fila = document.createElement("tr") 
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

//BLOQUE PAGINA 3 

// let datos = {
//   'Inicio': { puntos: [0, 40, 80], tamanos: ['desktop'] },
//   'Productos': { puntos: [0, 40, 80], tamanos: ['desktop'] }
// };
// let paginaActual = 'Inicio';
// let mapa = document.getElementById('mapa');
// let marcadores = document.getElementById('marcadores');
// let lista = document.getElementById('puntos');
// let copiar = document.getElementById('copiar');
// let mensaje = document.getElementById('mensaje');
// let casillas = document.querySelectorAll('input[type="checkbox"]');

// function esInicial(pagina) {
//   return pagina.puntos.join(',') === '0,40,80' && pagina.tamanos.join(',') === 'desktop';
// }

// // Refresca la pantalla después de cambiar los datos.
// function mostrar() {
//   let pagina = datos[paginaActual];
//   pagina.puntos.sort(function (a, b) { return a - b; });
//   document.getElementById('nombre').textContent = paginaActual;
//   document.getElementById('estado').textContent = esInicial(pagina) ? 'Por defecto' : 'Personalizada';
//   lista.replaceChildren();
//   marcadores.replaceChildren();
//   pagina.puntos.forEach(function (punto, posicion) {
//     let fila = document.createElement('li');
//     let numero = document.createElement('input');
//     numero.type = 'number'; numero.min = 0; numero.max = 100; numero.value = punto;
//     numero.setAttribute('aria-label', 'Porcentaje del punto ' + (posicion + 1));
//     numero.onchange = function () {
//       if (numero.value !== '') cambiar(posicion, Number(numero.value));
//       mostrar();
//     };
//     let quitar = document.createElement('button');
//     quitar.textContent = 'Eliminar';
//     quitar.onclick = function () {
//       if (pagina.puntos.length === 1) { mensaje.textContent = 'Conserva al menos un punto.'; return; }
//       pagina.puntos.splice(posicion, 1); mostrar();
//     };
//     fila.append(numero, ' %', quitar); lista.append(fila);

//     let linea = document.createElement('div');
//     linea.className = 'linea'; linea.style.top = punto + '%';
//     let boton = document.createElement('button');
//     boton.textContent = punto + '%';
//     boton.setAttribute('aria-label', 'Punto ' + punto + ' %. Usa las flechas para moverlo');
//     boton.onclick = function (evento) { evento.stopPropagation(); };
//     let arrastrando = false;
//     let nuevo = punto;
//     boton.onpointerdown = function (evento) {
//       if (evento.button !== 0) return;
//       arrastrando = true; boton.setPointerCapture(evento.pointerId);
//     };
//     boton.onpointermove = function (evento) {
//       if (!arrastrando) return;
//       nuevo = porcentaje(evento.clientY);
//       linea.style.top = nuevo + '%'; boton.textContent = nuevo + '%';
//     };
//     boton.onpointerup = function () {
//       if (!arrastrando) return;
//       arrastrando = false; cambiar(posicion, nuevo);
//       setTimeout(mostrar, 0);
//     };
//     boton.onpointercancel = function () { arrastrando = false; mostrar(); };
//     boton.onkeydown = function (evento) {
//       if (evento.key !== 'ArrowUp' && evento.key !== 'ArrowDown') return;
//       evento.preventDefault();
//       let valor = punto + (evento.key === 'ArrowUp' ? -1 : 1);
//       if (cambiar(posicion, valor)) {
//         mostrar();
//         marcadores.children[pagina.puntos.indexOf(valor)].querySelector('button').focus();
//       }
//     };
//     linea.append(boton); marcadores.append(linea);
//   });
//   casillas.forEach(function (casilla) { casilla.checked = pagina.tamanos.includes(casilla.value); });
//   document.getElementById('resumen').textContent = pagina.puntos.length + ' puntos × ' + pagina.tamanos.length + ' tamaños = ' + pagina.puntos.length * pagina.tamanos.length + ' capturas';
//   let menu = document.getElementById('paginas'); menu.replaceChildren();
//   copiar.replaceChildren(new Option('Selecciona una página…', ''));
//   let total = 0;
//   for (let nombre in datos) {
//     total += datos[nombre].puntos.length * datos[nombre].tamanos.length;
//     let boton = document.createElement('button');
//     boton.textContent = nombre + (esInicial(datos[nombre]) ? ' · Por defecto' : ' · Personalizada');
//     if (nombre === paginaActual) boton.setAttribute('aria-current', 'page');
//     boton.onclick = function () { paginaActual = nombre; mensaje.textContent = ''; mostrar(); };
//     menu.append(boton);
//     if (nombre !== paginaActual) copiar.add(new Option(nombre, nombre));
//   }
//   document.getElementById('total').textContent = total + ' capturas en total';
// }

// function porcentaje(posicionY) {
//   let rectangulo = mapa.getBoundingClientRect();
//   let numero = Math.round((posicionY - rectangulo.top) / rectangulo.height * 100);
//   return Math.max(0, Math.min(100, numero));
// }
// function cambiar(posicion, valor) {
//   let puntos = datos[paginaActual].puntos;
//   if (!Number.isInteger(valor) || valor < 0 || valor > 100) {
//     mensaje.textContent = 'Escribe un entero entre 0 y 100.'; return false;
//   }
//   if (puntos.includes(valor) && puntos[posicion] !== valor) {
//     mensaje.textContent = 'Ese punto ya existe.'; return false;
//   }
//   puntos[posicion] = valor; mensaje.textContent = ''; return true;
// }
// function anadir(valor) {
//   if (!Number.isInteger(valor) || valor < 0 || valor > 100) return;
//   if (datos[paginaActual].puntos.includes(valor)) { mensaje.textContent = 'Ese punto ya existe.'; return; }
//   datos[paginaActual].puntos.push(valor); mensaje.textContent = ''; mostrar();
// }
// mapa.onclick = function (evento) { if (!evento.target.closest('button')) anadir(porcentaje(evento.clientY)); };
// document.getElementById('anadir').onsubmit = function (evento) {
//   evento.preventDefault();
//   let campo = document.getElementById('nuevo');
//   if (campo.value !== '') anadir(Number(campo.value));
// };
// casillas.forEach(function (casilla) {
//   casilla.onchange = function () {
//     let elegidos = [];
//     casillas.forEach(function (opcion) { if (opcion.checked) elegidos.push(opcion.value); });
//     if (elegidos.length) { datos[paginaActual].tamanos = elegidos; mensaje.textContent = ''; }
//     else mensaje.textContent = 'Selecciona al menos un tamaño.';
//     mostrar();
//   };
// });
// document.getElementById('restaurar').onclick = function () {
//   datos[paginaActual] = { puntos: [0, 40, 80], tamanos: ['desktop'] };
//   mensaje.textContent = ''; mostrar();
// };
// copiar.onchange = function () {
//   if (!copiar.value) return;
//   datos[paginaActual].puntos = datos[copiar.value].puntos.slice();
//   datos[paginaActual].tamanos = datos[copiar.value].tamanos.slice();
//   mensaje.textContent = 'Configuración copiada.'; mostrar();
// };
// mostrar();

