
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
    
function mostrarPagina(idPagina, guardarHistorial = true){
    document.querySelectorAll(".pagina").forEach(function (pagina){
        pagina.hidden = pagina.id !== idPagina;
    });
    window.scrollTo(0,0);

    sessionStorage.setItem("paginaActual", idPagina);

    if (guardarHistorial) {
        history.pushState({ pagina: idPagina }, "", "#" + idPagina);
    }
}

window.addEventListener("popstate", function (e) {
    const destino = (e.state && e.state.pagina) || "inicio";
    mostrarPagina(destino, false);
});

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
    const texto = inputUrl.value.trim();
    if (texto === "") return;

    let dominio = "";
    let ruta = "";
    let parametros = "";
    let cantidad = 0;
    let estado = "OK";

    try {
        const url = new URL(texto);
        dominio = url.hostname;
        ruta = url.pathname;
        parametros = url.search === "" ? "-" : url.search;
        cantidad = url.searchParams.size;
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

    // innerHTML solo conserva el atributo, no el estado actual de la casilla.
    checkboxesFilas.forEach(c => c.toggleAttribute('checked', c.checked));
    sessionStorage.setItem("filasTabla", tabla.innerHTML);
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


// PÁGINA 3: estado aislado y conexión con las páginas anteriores.
(() => {
let datos = Object.create(null);
let paginaActual = '';
let inicial = { puntos: [0, 40, 80], tamanos: ['desktop'] };
let tipo = 'viewport';
const anchos = { desktop: '1440', tablet: '768', movil: '390' };
function clonarInicial() { return { puntos: inicial.puntos.slice(), tamanos: inicial.tamanos.slice() }; }
function cantidad(pagina) { return (tipo === 'completa' ? 1 : pagina.puntos.length) * pagina.tamanos.length; }
try {
  const guardado = JSON.parse(sessionStorage.getItem('webshot-configuracion-pag3'));
  if (guardado && guardado.datos && guardado.inicial && guardado.tipo) {
    datos = Object.assign(Object.create(null), guardado.datos);
    paginaActual = guardado.paginaActual;
    inicial = guardado.inicial;
    tipo = guardado.tipo;
  }
} catch (error) { sessionStorage.removeItem('webshot-configuracion-pag3'); }
let mapa = document.getElementById('pag3-mapa');
let marcadores = document.getElementById('pag3-marcadores');
let lista = document.getElementById('pag3-puntos');
let copiar = document.getElementById('pag3-copiar');
let mensaje = document.getElementById('pag3-mensaje');
let casillas = document.querySelectorAll('#pag3 input[type="checkbox"]');

function esInicial(pagina) {
  return pagina.puntos.join(',') === inicial.puntos.join(',') && pagina.tamanos.join(',') === inicial.tamanos.join(',');
}

// Refresca la pantalla después de cambiar los datos.
function mostrar() {
  if (!datos[paginaActual]) return;
  let pagina = datos[paginaActual];
  pagina.puntos.sort(function (a, b) { return a - b; });
  document.getElementById('pag3-nombre').textContent = paginaActual;
  document.getElementById('pag3-estado').textContent = esInicial(pagina) ? 'Por defecto' : 'Personalizada';
  lista.replaceChildren();
  marcadores.replaceChildren();
  pagina.puntos.forEach(function (punto, posicion) {
    let fila = document.createElement('li');
    let numero = document.createElement('input');
    numero.type = 'number'; numero.min = 0; numero.max = 100; numero.value = punto;
    numero.setAttribute('aria-label', 'Porcentaje del punto ' + (posicion + 1));
    numero.onchange = function () {
      if (numero.value !== '') cambiar(posicion, Number(numero.value));
      mostrar();
    };
    let quitar = document.createElement('button');
    quitar.textContent = 'Eliminar';
    quitar.onclick = function () {
      if (pagina.puntos.length === 1) { mensaje.textContent = 'Conserva al menos un punto.'; return; }
      pagina.puntos.splice(posicion, 1); mostrar();
    };
    fila.append(numero, ' %', quitar); lista.append(fila);

    let linea = document.createElement('div');
    linea.className = 'linea'; linea.style.top = punto + '%';
    let boton = document.createElement('button');
    boton.textContent = punto + '%';
    boton.setAttribute('aria-label', 'Punto ' + punto + ' %. Usa las flechas para moverlo');
    boton.onclick = function (evento) { evento.stopPropagation(); };
    let arrastrando = false;
    let nuevo = punto;
    boton.onpointerdown = function (evento) {
      if (evento.button !== 0) return;
      arrastrando = true; boton.setPointerCapture(evento.pointerId);
    };
    boton.onpointermove = function (evento) {
      if (!arrastrando) return;
      nuevo = porcentaje(evento.clientY);
      linea.style.top = nuevo + '%'; boton.textContent = nuevo + '%';
    };
    boton.onpointerup = function () {
      if (!arrastrando) return;
      arrastrando = false; cambiar(posicion, nuevo);
      setTimeout(mostrar, 0);
    };
    boton.onpointercancel = function () { arrastrando = false; mostrar(); };
    boton.onkeydown = function (evento) {
      if (evento.key !== 'ArrowUp' && evento.key !== 'ArrowDown') return;
      evento.preventDefault();
      let valor = punto + (evento.key === 'ArrowUp' ? -1 : 1);
      if (cambiar(posicion, valor)) {
        mostrar();
        marcadores.children[pagina.puntos.indexOf(valor)].querySelector('button').focus();
      }
    };
    linea.append(boton); marcadores.append(linea);
  });
  casillas.forEach(function (casilla) { casilla.checked = pagina.tamanos.includes(casilla.value); });
  document.getElementById('pag3-resumen').textContent = (tipo === 'completa' ? '1 página completa × ' : pagina.puntos.length + ' puntos × ') + pagina.tamanos.length + ' tamaños = ' + cantidad(pagina) + ' capturas';
  let menu = document.getElementById('pag3-paginas'); menu.replaceChildren();
  copiar.replaceChildren(new Option('Selecciona una página…', ''));
  let total = 0;
  for (let nombre in datos) {
    total += cantidad(datos[nombre]);
    let boton = document.createElement('button');
    boton.textContent = nombre + (esInicial(datos[nombre]) ? ' · Por defecto' : ' · Personalizada');
    if (nombre === paginaActual) boton.setAttribute('aria-current', 'page');
    boton.onclick = function () { paginaActual = nombre; mensaje.textContent = ''; mostrar(); };
    menu.append(boton);
    if (nombre !== paginaActual) copiar.add(new Option(nombre, nombre));
  }
  document.getElementById('pag3-total').textContent = total + ' capturas en total';
  sessionStorage.setItem('webshot-configuracion-pag3', JSON.stringify({ datos, paginaActual, inicial, tipo }));
}

function porcentaje(posicionY) {
  let rectangulo = mapa.getBoundingClientRect();
  let numero = Math.round((posicionY - rectangulo.top) / rectangulo.height * 100);
  return Math.max(0, Math.min(100, numero));
}
function cambiar(posicion, valor) {
  let puntos = datos[paginaActual].puntos;
  if (!Number.isInteger(valor) || valor < 0 || valor > 100) {
    mensaje.textContent = 'Escribe un entero entre 0 y 100.'; return false;
  }
  if (puntos.includes(valor) && puntos[posicion] !== valor) {
    mensaje.textContent = 'Ese punto ya existe.'; return false;
  }
  puntos[posicion] = valor; mensaje.textContent = ''; return true;
}
function anadir(valor) {
  if (!Number.isInteger(valor) || valor < 0 || valor > 100) return;
  if (datos[paginaActual].puntos.includes(valor)) { mensaje.textContent = 'Ese punto ya existe.'; return; }
  datos[paginaActual].puntos.push(valor); mensaje.textContent = ''; mostrar();
}
mapa.onclick = function (evento) { if (!evento.target.closest('button')) anadir(porcentaje(evento.clientY)); };
document.getElementById('pag3-anadir').onsubmit = function (evento) {
  evento.preventDefault();
  let campo = document.getElementById('pag3-nuevo');
  if (campo.value !== '') anadir(Number(campo.value));
};
casillas.forEach(function (casilla) {
  casilla.onchange = function () {
    let elegidos = [];
    casillas.forEach(function (opcion) { if (opcion.checked) elegidos.push(opcion.value); });
    if (elegidos.length) { datos[paginaActual].tamanos = elegidos; mensaje.textContent = ''; }
    else mensaje.textContent = 'Selecciona al menos un tamaño.';
    mostrar();
  };
});
document.getElementById('pag3-restaurar').onclick = function () {
  datos[paginaActual] = clonarInicial();
  mensaje.textContent = ''; mostrar();
};
copiar.onchange = function () {
  if (!copiar.value) return;
  datos[paginaActual].puntos = datos[copiar.value].puntos.slice();
  datos[paginaActual].tamanos = datos[copiar.value].tamanos.slice();
  mensaje.textContent = 'Configuración copiada.'; mostrar();
};

document.getElementById('btn-volver').addEventListener('click', () => mostrarPagina('pagina-1'));
document.getElementById('pag3-volver').addEventListener('click', () => mostrarPagina('pag2'));
document.getElementById('btn-continuar').addEventListener('click', () => {
  const filas = Array.from(tabla.querySelectorAll('tr')).filter(fila => fila.querySelector('input[type="checkbox"]').checked);
  if (!filas.length) { mostrarPagina('pagina-1'); return; }
  if (filas.some(fila => fila.dataset.estado !== 'ok')) {
    alert('Selecciona únicamente URLs con estado OK para continuar.'); return;
  }
  const campos = Array.from(contenedorPuntosScroll.querySelectorAll('input'));
  const puntos = campos.map(campo => Number(campo.value));
  if (campos.some(campo => campo.value === '') || puntos.some(punto => !Number.isInteger(punto) || punto < 0 || punto > 100) || new Set(puntos).size !== puntos.length) {
    alert('Los puntos deben ser enteros distintos entre 0 y 100.'); return;
  }
  const tamanos = Object.keys(anchos).filter(nombre => Array.from(casillasViewport).some(casilla => casilla.value === anchos[nombre] && casilla.checked));
  const nuevosIniciales = { puntos: puntos.sort((a,b) => a-b), tamanos };
  const nuevoTipo = document.querySelector('#pag2 input[name="tipo"]:checked').value;
  const cambiaron = JSON.stringify(nuevosIniciales) !== JSON.stringify(inicial) || tipo !== nuevoTipo;
  inicial = nuevosIniciales; tipo = nuevoTipo;
  const anteriores = datos; datos = Object.create(null);
  filas.forEach(fila => {
    const url = fila.cells[1].textContent.trim();
    datos[url] = !cambiaron && anteriores[url] ? anteriores[url] : clonarInicial();
  });
  if (!datos[paginaActual]) paginaActual = Object.keys(datos)[0];
  mensaje.textContent = tipo === 'completa' ? 'Página completa: se cuenta una captura por tamaño; los puntos de scroll solo se aplican al modo viewport.' : '';
  mostrar(); mostrarPagina('pag3');
});
contenedorPuntosScroll.querySelectorAll('.puntos__item').forEach(punto => punto.remove());
inicial.puntos.forEach(valor => contenedorPuntosScroll.insertBefore(crearPunto(valor), btnAnadirPunto));
casillasViewport.forEach(casilla => { casilla.checked = inicial.tamanos.some(nombre => anchos[nombre] === casilla.value); });
document.querySelectorAll('#pag2 input[name="tipo"]').forEach(casilla => { casilla.checked = casilla.value === tipo; });
mostrar();
if (sessionStorage.getItem('paginaActual') === 'pag3' && !datos[paginaActual]) sessionStorage.setItem('paginaActual', 'pag2');
})();

// ===== RESTAURAR ESTADO AL RECARGAR =====
const filasGuardadas = sessionStorage.getItem("filasTabla");
if (filasGuardadas) {
    tabla.innerHTML = filasGuardadas;

    // Reasignar listeners a checkboxes restaurados
    tabla.querySelectorAll("input[type='checkbox']").forEach(function (c) {
        c.addEventListener("change", actualizarContadores);
    });

    actualizarContadores();
}

const paginaGuardada = sessionStorage.getItem("paginaActual") || "inicio";
mostrarPagina(paginaGuardada, false);
history.replaceState({ pagina: paginaGuardada }, "", "#" + paginaGuardada);

