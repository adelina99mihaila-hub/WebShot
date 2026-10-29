//AJUSTES DEL FORMULARIO

// Mostrar el valor del rango de profundidad de rastreo
const crawlDepth = document.getElementById("crawl-depth");
// Valor actual de la profundidad de rastreo
const depthValue = document.getElementById("depth-value");
//Variable para el id
let crawlIdActual = sessionStorage.getItem("crawlIdActual");

// Actualizar el valor mostrado cuando se cambie el rango
crawlDepth.addEventListener("input", function () {
    depthValue.textContent = this.value;
});

//Limite de URLs a procesar
const urlLimit = document.getElementById("url-limit");

urlLimit.addEventListener("input", function () {
    if (this.value < 1) {
        this.value = 1;
    }

    if (this.value > 100) {
        this.value = 100;
    }
});

// Dominios permitidos (elimina espacios en blanco al escribir)

const allowedDomains = document.getElementById("allowed-domains");
allowedDomains.addEventListener("input", function () {
    allowedDomains.value = allowedDomains.value.replace(/\s+/g, '');
});

// Checkbox para respetar robots.txt
const respetarRobots = document.getElementById("respect-robots");

//Activación del loader al analizar la página
const estadoBusqueda = document.getElementById("estadoCarga");

//NAVEGACIÓN ENTRE PÁGINAS
//Función para mostrar la página correspondiente y ocultar las demás
function mostrarPagina(idPagina, guardarHistorial = true) {
    document.querySelectorAll(".pagina").forEach(function (pagina) {
        pagina.hidden = pagina.id !== idPagina;
    });
    window.scrollTo(0, 0);

    sessionStorage.setItem("paginaActual", idPagina);

    if (guardarHistorial) {
        history.pushState({ pagina: idPagina }, "", "#" + idPagina);
    }
}

// Escuchar el evento popstate para manejar la navegación hacia atrás y hacia adelante
window.addEventListener("popstate", function (e) {
    const destino = (e.state && e.state.pagina) || "inicio";
    mostrarPagina(destino, false);
});

//======  PÁGINA 1  ========
//Gestion de URLs y filtros


let urls = [];
let activeFilter = "all";

//Elementos de la página de inicio
const formulario = document.getElementById("search-box");
const inputUrl = document.getElementById("url-input");
const paginaInicio = document.getElementById("inicio");

//Elementos para el historico
const listaHistorico = document.getElementById("lista-historico");
const CLAVE_HISTORIAL = "webshot-historial"; //Clave para el historial
const MAX_HISTORIAL = 10; //Maximo de busquedas para el historial
let historialActivoKey = sessionStorage.getItem("historialActivoKey"); //Clave en la sesion
let seleccionHistoriaPendiente = null;

//Función para normalizar una url como clave de búsqueda
function claveBusqueda(urlTexto) {

    const textoConProtocolo = /^https?:\/\//i.test(urlTexto)
        ? urlTexto
        : "https://" + urlTexto;

    //Covertimos el texto a objeto
    const url = new URL(textoConProtocolo);

    //Eliminamos el fragmento que aparece después de #.
    //Por ejemplo, https://ejemplo.com/pagina#contacto
    //se convierte en https://ejemplo.com/pagina.
    url.hash = "";

    //Devolvemos la url normalizada
    return url.href;
}

//Función para leer el historial guardado
function leerHistorial() {

    try {

        //Recuperamos el historial
        const historial = JSON.parse(localStorage.getItem(CLAVE_HISTORIAL) || "[]");

        //Comprobamos que sea un array
        if (!Array.isArray(historial)) {

            return [];
        }

        //Filtramos y conservamos las entradas con la estructura esperada
        return historial.filter(function (entrada) {

            // Comprobamos que:
            // 1. La entrada exista.
            // 2. Su propiedad clave sea un texto.
            // 3. Su propiedad url sea un texto.
            // 4. Exista la propiedad opciones.
            // 5. La propiedad seleccionadas sea un array.
            return entrada &&
                typeof entrada.clave === "string" &&
                typeof entrada.url === "string" &&
                entrada.opciones &&
                Array.isArray(entrada.seleccionadas);
        });
    } catch (error) {
        console.error("No se pudo leer el historial:", error);
        return [];
    }
}

//Función para guardar el hstorial
function guardarHistorial(historial) {

    try {
        //Convertimos el array en Json y lo gradamos con la clave
        localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial));
        return true;

    } catch (error) {
        console.error("No se pudo guardar el historial:", error);
        return false;
    }
}

//Función para el tiempodel historial
function tiempoRelativo(fecha) {

    //Se calcula los minutos desde la fecha de la búsqueda
    const minutos = Math.max(0, Math.floor((Date.now() - fecha) / 60000));

    if (minutos < 1) return "ahora"; //Si ha pasado menos de un minuto aparece "ahora"
    if (minutos < 60) return `hace ${minutos} min`; //Menos de una hora salen los minutos

    //Si ha pasado mas de una hora se muestran las horas sin minutos (se redondea hacia abajo)
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;

    //Lo mismo para los días, redondeamos hacia abajo
    const dias = Math.floor(horas / 24);


    if (dias < 30) return `hace ${dias} días`;

    //Para mas de 30 dias se muestra la fecha
    return new Date(fecha).toLocaleDateString("es");
}

//Función para mostrar el historial
function mostrarHistorial() {

    //Primero borramos los elementos anteriores para actualizar
    listaHistorico.replaceChildren();

    //leemos el historial guardado
    const historial = leerHistorial();

    //Comprobamos si hay alguna búsqueda guuardada
    if (historial.length === 0) {

        const vacio = document.createElement("p");
        vacio.textContent = "Tus búsquedas anteriores aparecerán aquí.";
        listaHistorico.appendChild(vacio);
        return;

    }

    //Para cada entrada creamos un botón con los datos
    historial.forEach(function (entrada) {

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "historico__elemento";

        const datos = document.createElement("span");
        datos.className = "historico__datos";

        //dominio de la url 
        const dominio = new URL(entrada.url).hostname.replace(/^www\./i, "");

        const nombre = document.createElement("strong");
        nombre.textContent = dominio;

        //mostramos tambien la url completa
        const url = document.createElement("span");
        url.className = "historico__url";
        url.textContent = entrada.url;

        //mostramos la fecha
        const fecha = document.createElement("span");
        fecha.className = "historico__fecha";
        fecha.textContent = tiempoRelativo(entrada.fecha);

        //Añadimos los datos al contenedor
        datos.append(nombre, url);
        //Se puede recuperar la búsqueda al pulsar el botón
        boton.append(datos, fecha);

        //Al pulsar el boton se ejecuta la función que ejecuta una nueva búsqueda
        boton.addEventListener("click", function () {
            inputUrl.value = entrada.url;
            crawlDepth.value = entrada.opciones.maxDepth;
            depthValue.textContent = entrada.opciones.maxDepth;
            urlLimit.value = entrada.opciones.maxUrls;
            allowedDomains.value = entrada.opciones.allowedDomains;
            respetarRobots.checked = entrada.opciones.respectRobots;
            seleccionHistoriaPendiente = entrada.seleccionadas;
            formulario.requestSubmit();
        });

        //Añadimos el botón al contenedor
        listaHistorico.appendChild(boton);
    });


}
mostrarHistorial();


//Elementos de la tabla de resultados
const paginaResultados = document.getElementById("pagina-1");
const tabla = document.getElementById("results-body");
const mensajeVacio = document.getElementById("empty-message");

//Elementos de total de urls
const total = document.getElementById("total-count");
const totalAbajo = document.getElementById("bottom-total-count");

//Elementos de búsqueda y filtrado
const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".filter-button");
const selectAll = document.getElementById("select-all");
const bottomSelectedCount = document.getElementById("bottom-selected-count");
const processButton = document.getElementById("process-button");

//Analiza la URL enviada por el usuario y la añade a la tabla de resultados
//La función async nos permite esperarla respuesta del servidor
formulario.addEventListener("submit", async function (evento) {

    evento.preventDefault();

    //Leemos la url y le quitamos los espacios
    const texto = inputUrl.value.trim();

    //Si el texto está vacío, no hacemos nada
    if (texto === "") return;

    const seleccionSolicitada = seleccionHistoriaPendiente;
    seleccionHistoriaPendiente = null;
    //Visibiliza el loader
    estadoBusqueda.hidden = false;

    try {
        //Enviamos la URL al servidor con una petición POST a la ruta /api/crawl
        const response = await fetch("/api/crawl", {
            method: "POST",
            headers: {
                //Indicamos que el contenido que enviamos es JSON
                "Content-Type": "application/json"
            },

            //Convertimos el objeto con la URL en un string JSON para enviarlo al servidor
            //enviamos url, profundidad máxima, límite de urls, dominios permitidos y si se respeta robots.txt
            body: JSON.stringify({
                url: texto,
                maxDepth: Number(crawlDepth.value),
                maxUrls: Number(urlLimit.value),
                allowedDomains: allowedDomains.value.trim(),
                respectRobots: respetarRobots.checked
            })
        });

        //Convertimos la respuesta del servidor en un objeto JSON   
        const resultado = await response.json();

        //Si el servidor devuelve un error, mostramos un mensaje de alerta y salimos de la función
        if (!response.ok) {

            alert(resultado.error || "Error al analizar la URL");
            return;
        }

        //Comprueba que la respuesta incluya una lista de páginas
        if (!Array.isArray(resultado.pages)) {
            throw new Error("Respuesta inesperada del servidor");
        }
        //Comprobación del id del rastreo
        if (typeof resultado.crawlId !== "string" || resultado.crawlId === "") {
            throw new Error("La respuesta no incluye un identificador de rastreo válido");
        }
        //Guardamos el identificador en una variable
        crawlIdActual = resultado.crawlId;
        //Guardamos el identificador 
        sessionStorage.setItem("crawlIdActual", crawlIdActual);

        //normalizamos la url
        const urlGuardada = claveBusqueda(texto);
        //recuperamos el historial
        const historial = leerHistorial();

        //Objeto con la información de la búsqueda actual
        const entradaActual = {
            clave: urlGuardada,
            url: urlGuardada,
            nombre: new URL(urlGuardada).hostname,
            fecha: Date.now(),
            opciones: {
                maxDepth: Number(crawlDepth.value),
                maxUrls: Number(urlLimit.value),
                allowedDomains: allowedDomains.value.trim(),
                respectRobots: respetarRobots.checked
            },
            //guardamos las paginas seleccionadas, usamos un array vacio por defecto
            seleccionadas: seleccionSolicitada || []
        };
        //Array con el historial actualizado
        const historialActualizado = [
            //La búsqueda actual va en primera posición
            entradaActual,
            //filtramos que no tengan la misma clave que la actual
            ...historial.filter(function (entrada) {
                return entrada.clave !== urlGuardada;
            })
        ].slice(0, MAX_HISTORIAL); //respetamos el limite de 10 búsquedas

        //guardamos la clave de la búsqueda actual
        historialActivoKey = urlGuardada;
        //la guardamos en sessionstorage
        sessionStorage.setItem("historialActivoKey", historialActivoKey);

        //Comprobamos que se guarde correctamente o lanzamos error
        if (!guardarHistorial(historialActualizado)) {
            alert("El rastreo terminó, pero no se pudo guardar en el historial.");
        }

        //mostramos el historial
        mostrarHistorial();
        //Elimina las filas de resultados anteriores y desmarcamos el checkbox de "Seleccionar todo"
        tabla.replaceChildren();
        selectAll.checked = false;

        //Recorre cada página devuelta por el servidor y crea una fila en la tabla de resultados
        resultado.pages.forEach(function (pagina) {

            const fila = document.createElement("tr");

            //Si la página no tiene un estado, se le asigna "error" por defecto
            const estado = String(pagina.status || "error");

            //Nombre para la Ruta   /NUEVO
            const ruta = new URL(pagina.url).pathname;

            fila.dataset.estado = estado.toLowerCase();
            fila.dataset.url = pagina.url;

            const celdaSeleccion = document.createElement("td");
            const checkbox = document.createElement("input");

            checkbox.type = "checkbox";
            //Si la búsqueda es del historial se marcan las paginas que estuvieran seleccionadas
            checkbox.checked = entradaActual.seleccionadas.includes(pagina.url);
            celdaSeleccion.appendChild(checkbox);
            fila.appendChild(celdaSeleccion);

            //Añade las celdas con los datos de la página a la fila
            [pagina.title, ruta, pagina.depth, estado].forEach(function (valor) {
                const celda = document.createElement("td");
                celda.textContent = valor ?? " ";
                fila.appendChild(celda);
            });

            //Actualiza los contadores al cambiar la selección
            checkbox.addEventListener("change", actualizarContadores);

            tabla.appendChild(fila);
        });

        inputUrl.value = "";

        actualizarContadores();
        aplicarFiltros();
        mostrarPagina("pagina-1");

    } catch (e) {

        alert("Error al analizar la URL: " + e.message);

    } finally { //Vuelve a ocultar el loader
        estadoBusqueda.hidden = true;
    }

});

// Función para aplicar filtros de búsqueda y estado a las filas de la tabla
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

//Botones de filtro: "Todos", "OK" y "Error"
filterButtons.forEach(function (boton) {
    boton.addEventListener("click", function () {
        filterButtons.forEach(function (b) {
            b.classList.remove("active", "boton-principal");
            b.classList.add("boton-claro");
        });
        boton.classList.add("active", "boton-principal");
        boton.classList.remove("boton-claro");

        activeFilter = boton.dataset.filter;
        aplicarFiltros();
    });
});

//Actualiza los contadores de filas totales
function actualizarContadores() {
    const checkboxesFilas = tabla.querySelectorAll("input[type='checkbox']");
    const totalFilas = checkboxesFilas.length;

    //Array para las filas marcadas
    const marcados = Array.from(checkboxesFilas).filter(function (c) {
        return c.checked;
    });
    const totalMarcados = marcados.length;

    //Actualiza los contadores en la interfaz
    total.textContent = totalFilas;
    totalAbajo.textContent = totalFilas;
    bottomSelectedCount.textContent = totalMarcados;

    //Deshabilita el botón de procesar según si hay filas marcadas
    processButton.disabled = totalMarcados === 0;

    mensajeVacio.hidden = totalFilas > 0;

    // Guarda el estado de los checkboxes en sessionStorage para restaurarlo después de recargar la página
    checkboxesFilas.forEach(c => c.toggleAttribute('checked', c.checked));
    sessionStorage.setItem("filasTabla", tabla.innerHTML);

    //En caso de que haya una clave de historial
    if (historialActivoKey) {
        //leemos el historial
        const historial = leerHistorial();
        //buscamos la entrada que corresponda
        const entrada = historial.find(function (item) {
            return item.clave === historialActivoKey;
        });
        //Si encontramos la entrada actualizamos las páginas deleccionadas
        if (entrada) {

            entrada.seleccionadas = Array.from(
                tabla.querySelectorAll("tr")
            )
                //Filtramos las casillas que estan marcadas
                .filter(function (fila) {
                    const checkbox = fila.querySelector("input[type='checkbox']");
                    return checkbox && checkbox.checked;
                })
                .map(function (fila) {
                    return fila.dataset.url;
                });

            guardarHistorial(historial);
        }
    }
}

//Listener para el checkbox "Seleccionar todo"
selectAll.addEventListener("change", function () {
    const checkboxesFilas = tabla.querySelectorAll("input[type='checkbox']");
    checkboxesFilas.forEach(function (c) {
        c.checked = selectAll.checked;
    });
    actualizarContadores();
});

//Boton para procesar las URLs seleccionadas y pasar a la siguiente página
processButton.addEventListener("click", function () {
    mostrarPagina("pag2");
});


//======  PÁGINA 2  ========
//Gestión de puntos de scroll y tamaños de viewport

// Función para crear un nuevo punto de scroll
function crearPunto(valor) {
    const punto = document.createElement("span");
    punto.className = "puntos__item";
    punto.innerHTML = "<input type='number' value='" + valor + "'><span>%</span><button class='puntos__quitar'>×</button>";

    //Botón para quitar el punto de scroll, solo si hay más de uno
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

// Puntos de scroll por defecto
const puntosPorDefecto = [0, 40, 80];

//Crea los puntos de scroll por defecto 
puntosPorDefecto.forEach(function (valor) {
    const nuevaPastilla = crearPunto(valor);
    contenedorPuntosScroll.insertBefore(nuevaPastilla, btnAnadirPunto);
});
//Añade el punto de scroll al hacer click en el botón "Añadir punto"
btnAnadirPunto.addEventListener("click", function () {
    const nuevaPastilla = crearPunto(100);
    contenedorPuntosScroll.insertBefore(nuevaPastilla, btnAnadirPunto);
});

//Valida que al menos un tamaño de viewport esté seleccionado
const casillasViewport = document.querySelectorAll('input[name="viewport"]');

//Comprobar si hay alguna casilla marcada al cambiar el estado de una casilla
//en caso de que no haya ninguna marcada, se vuelve a marcar la casilla que se acaba de desmarcar
casillasViewport.forEach(function (casilla) {
    casilla.addEventListener("change", function () {
        const hayAlgunaMarcada = Array.from(casillasViewport).some(function (casilla) {
            return casilla.checked;
        });
        if (!hayAlgunaMarcada) {
            casilla.checked = true;
        }
    });
});

//======  PÁGINA 3  ========
//Bloque aislado con una función autoejecutable para evitar conflictos de variables con otras páginas

(() => {

    //Objeto para almacenar los datos de cada página (URL)
    let datos = Object.create(null);

    let paginaActual = '';

    //configuración inicial de puntos y tamaños de viewport
    let inicial = { puntos: [0, 40, 80], tamanos: ['desktop'] };
    let tipo = 'viewport';

    //Anchos de los tamaños de viewport
    const anchos = { desktop: '1440', tablet: '768', movil: '390' };

    //Función para clonar la configuración inicial
    function clonarInicial() { return { puntos: inicial.puntos.slice(), tamanos: inicial.tamanos.slice() }; }

    //Función para calcular la cantidad de capturas según la configuración de la página
    //Si el tipo es 'completa', se cuenta como 1 captura por tamaño; si es 'viewport', se cuenta como puntos * tamaños
    function cantidad(pagina) { return (tipo === 'completa' ? 1 : pagina.puntos.length) * pagina.tamanos.length; }
    //Intentar recuperar la configuración guardada en sessionStorage
    try {
        const guardado = JSON.parse(sessionStorage.getItem('webshot-configuracion-pag3'));
        if (guardado && guardado.datos && guardado.inicial && guardado.tipo) {
            datos = Object.assign(Object.create(null), guardado.datos);
            paginaActual = guardado.paginaActual;
            inicial = guardado.inicial;
            tipo = guardado.tipo;
        }
    } catch (error) { sessionStorage.removeItem('webshot-configuracion-pag3'); }

    //Elementos de la página 3
    let mapa = document.getElementById('pag3-mapa');
    let marcadores = document.getElementById('pag3-marcadores');
    let imagenVistaPrevia = document.getElementById('pag3-imagen');
    let textoVistaPrevia = document.querySelector('#pag3 .texto-vista');
    const vistasPrevias = new Map();
    let solicitudVistaPrevia = 0;
    let vistaPreviaActual = null;
    let lista = document.getElementById('pag3-puntos');
    let copiar = document.getElementById('pag3-copiar');
    let mensaje = document.getElementById('pag3-mensaje');
    let casillas = document.querySelectorAll('#pag3 input[type="checkbox"]');

    //Función para comprobar si la configuración de la página es igual a la configuración inicial
    function esInicial(pagina) {
        return pagina.puntos.join(',') === inicial.puntos.join(',') && pagina.tamanos.join(',') === inicial.tamanos.join(',');
    }

    async function cargarVistaPrevia(url) {

        //incrementamos el numero de solicitud al llamar a la función para distinguir solicitudes nuevas
        const solicitud = ++solicitudVistaPrevia;
        //Comprobamos si la vista previa esta guardada
        const guardada = vistasPrevias.get(url);

        //si ya existia la reutilizamos
        if (guardada) {
            vistaPreviaActual = guardada;
            imagenVistaPrevia.src = guardada.imagen;
            imagenVistaPrevia.hidden = false;
            textoVistaPrevia.textContent = 'Vista previa';
            return;
        }
        //Si no habia cista guardada mostramos mensaje mientras carga
        imagenVistaPrevia.hidden = true;
        vistaPreviaActual = null;
        textoVistaPrevia.textContent = 'Cargando vista previa...';

        try {
            //Petición para la captura de la vista previa
            const respuesta = await fetch('/api/vista-previa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ crawlId: crawlIdActual, url })
            });

            if (!respuesta.ok) {
                const error = await respuesta.json();
                throw new Error(error.error || 'No se pudo cargar la vista previa.');
            }
            //leemos la altura y lo pasamos a numero
            const alturaDocumento = Number(respuesta.headers.get('X-Preview-Document-Height'));
            //lo mismo con la altura del navegador
            const alturaViewport = Number(respuesta.headers.get('X-Preview-Viewport-Height'));

            //Comprobamos que ambos sean numeros validos
            if (
                !Number.isFinite(alturaDocumento) || alturaDocumento <= 0 ||
                !Number.isFinite(alturaViewport) || alturaViewport <= 0
            ) {
                throw new Error('El servidor no devolvió dimensiones válidas para la vista previa.');
            }

            //Blob permite trabajar con los datos binarios de la imagen
            const blob = await respuesta.blob();

            //si se ha hecho otra petición abandonamos
            if (solicitud !== solicitudVistaPrevia) {
                return;
            }

            //Url temporal para mostrar el blob como una imagen
            const imagen = URL.createObjectURL(blob);

            //Si la cache tiene mas de 20 vistas se borra la mas antigua
            if (vistasPrevias.size >= 20) {
                const [urlAntigua, vistaAntigua] = vistasPrevias.entries().next().value;
                URL.revokeObjectURL(vistaAntigua.imagen);
                vistasPrevias.delete(urlAntigua);
            }
            //Objeto con los datos para la vista
            const vista = {
                imagen,
                alturaDocumento, //altura de la captura
                alturaViewport  //altura del area visible del navegador
            };

            //guardamos la vista en la cache con su url 
            vistasPrevias.set(url, vista);
            vistaPreviaActual = vista; //vista activa
            imagenVistaPrevia.src = imagen;
            imagenVistaPrevia.hidden = false;
            textoVistaPrevia.textContent = 'Vista previa';
            actualizarPosicionesMarcadores();//recalculamos la posicion de las vistas

        } catch (error) {
            console.error('Error al cargar la vista previa:', error);
            //Solo se muestra el mensaje si sigue siendo la solicitud mas reciente
            if (solicitud === solicitudVistaPrevia) {
                textoVistaPrevia.textContent = error.message;
            }
        }
    }

    //Esta función recibe el porcentaje de desplazamiento del marcador
    function posicionMarcador(punto) {

        //si no hay vista previa no calculamos
        if (!vistaPreviaActual) return 0;

        const alturaDocumento = vistaPreviaActual.alturaDocumento;
        const alturaViewport = vistaPreviaActual.alturaViewport;
        //Maximo desplazamiento posible, si el documento es es mas alto que la pantalla es la diferencia entre ambos
        const maximoScroll = Math.max(0, alturaDocumento - alturaViewport);
        //Calculamos la posición con respecto al desplazamiento
        //Si el punto es 50 obtenemos el 50% del desplazamiento maximo
        const posicionScroll = maximoScroll * punto / 100;
        //Convertimos la posición de desplazamiento en un porcentaje respecto a la altura
        //devolvemos ese porcentaje para los marcadores
        return posicionScroll / alturaDocumento * 100;
    }

    //Función que actualiza la posición de los marcadores
    function actualizarPosicionesMarcadores() {

        //Obtenemos los elementos de los marcadores
        Array.from(marcadores.children).forEach(linea => {
            //Convertimos a número el atributo del porcentaje de desplazamiento
            const punto = Number(linea.dataset.punto);
            //Calculamos la posición vertical del marcador
            //la propiedad top establece su posición vertical
            linea.style.top = posicionMarcador(punto) + '%';
        });
    }

    // Refresca la pantalla después de cambiar los datos.
    function mostrar() {

        if (!datos[paginaActual]) return;

        let pagina = datos[paginaActual];

        pagina.puntos.sort(function (a, b) { return a - b; });

        document.getElementById('pag3-nombre').textContent = paginaActual;
        cargarVistaPrevia(paginaActual);
        document.getElementById('pag3-estado').textContent = esInicial(pagina) ? 'Por defecto' : 'Personalizada';
        lista.replaceChildren();
        marcadores.replaceChildren();

        //Crear la lista de puntos y los marcadores en el mapa
        pagina.puntos.forEach(function (punto, posicion) {

            let fila = document.createElement('li');
            let numero = document.createElement('input');

            numero.type = 'number'; numero.min = 0; numero.max = 100; numero.value = punto;
            numero.setAttribute('aria-label', 'Porcentaje del punto ' + (posicion + 1));
            numero.onchange = function () {
                if (numero.value !== '') cambiar(posicion, Number(numero.value));
                mostrar();
            };
            // Botón para eliminar el punto de scroll, solo si hay más de uno
            let quitar = document.createElement('button');
            quitar.classList.add("boton-claro");
            quitar.textContent = 'Eliminar';
            quitar.onclick = function () {
                if (pagina.puntos.length === 1) { mensaje.textContent = 'Conserva al menos un punto.'; return; }
                pagina.puntos.splice(posicion, 1); mostrar();
            };
            fila.append(numero, ' %', quitar); lista.append(fila);

            //Crear el marcador en el mapa
            let linea = document.createElement('div');
            linea.className = 'linea';
            linea.dataset.punto = punto;
            linea.style.top = posicionMarcador(punto) + '%';

            let boton = document.createElement('button');
            boton.classList.add("boton-principal");
            boton.textContent = punto + '%';
            boton.setAttribute('aria-label', 'Punto ' + punto + ' %. Usa las flechas para moverlo');
            boton.onclick = function (evento) { evento.stopPropagation(); };

            let arrastrando = false;
            let nuevo = punto;
            boton.onpointerdown = function (evento) {

                if (!vistaPreviaActual || imagenVistaPrevia.hidden || evento.button !== 0) return;
                arrastrando = true;
                boton.setPointerCapture(evento.pointerId);
            };
            //Actualia el marcador mientras se arrastra
            boton.onpointermove = function (evento) {
                if (!arrastrando) return;
                const valorNuevo = porcentaje(evento.clientY);
                if (valorNuevo === null) return;

                nuevo = valorNuevo;
                linea.dataset.punto = nuevo;
                linea.style.top = posicionMarcador(nuevo) + '%';
                boton.textContent = nuevo + '%';
            };

            //Al soltar el marcador, se guarda la nueva posición
            boton.onpointerup = function () {
                if (!arrastrando) return;
                arrastrando = false; cambiar(posicion, nuevo);
                setTimeout(mostrar, 0);
            };
            boton.onpointercancel = function () { arrastrando = false; mostrar(); };

            //Permite mover el marcador con las flechas del teclado
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
        actualizarPosicionesMarcadores();

        //Actualizar las casillas de tamaños de viewport según la configuración de la página
        casillas.forEach(function (casilla) { casilla.checked = pagina.tamanos.includes(casilla.value); });

        //Actualizar el resumen de la página
        document.getElementById('pag3-resumen').textContent = (tipo === 'completa' ? '1 página completa × ' : pagina.puntos.length + ' puntos × ') + pagina.tamanos.length + ' tamaños = ' + cantidad(pagina) + ' capturas';

        //Actualizar el menú y la lista de páginas
        let menu = document.getElementById('pag3-paginas'); menu.replaceChildren();
        copiar.replaceChildren(new Option('Selecciona una página…', ''));
        let total = 0;

        for (let nombre in datos) {

            total += cantidad(datos[nombre]);
            let boton = document.createElement('button');
            const ruta = new URL(nombre).pathname;
            const textoRuta = document.createElement('span');
            textoRuta.className = 'ruta-pagina';
            textoRuta.textContent = ruta;

            const estadoPagina = document.createElement('span');
            estadoPagina.className = 'estado-pagina';
            estadoPagina.textContent = esInicial(datos[nombre]) ? 'Por defecto' : 'Personalizada';

            boton.append(textoRuta, estadoPagina);
            boton.classList.add("boton-claro");

            if (nombre === paginaActual) {
                boton.setAttribute('aria-current', 'page');
            }
            boton.onclick = function () { paginaActual = nombre; mensaje.textContent = ''; mostrar(); };
            menu.append(boton);

            if (nombre !== paginaActual) copiar.add(new Option(nombre, nombre));
        }

        document.getElementById('pag3-total').textContent = total + ' capturas en total';
        sessionStorage.setItem('webshot-configuracion-pag3', JSON.stringify({ datos, paginaActual, inicial, tipo }));
    }

    function porcentaje(posicionY) {
        if (!vistaPreviaActual || imagenVistaPrevia.hidden) return null;

        const rectangulo = imagenVistaPrevia.getBoundingClientRect();
        if (rectangulo.height <= 0) return null;

        const posicionEnImagen = Math.max(
            0,
            Math.min(rectangulo.height, posicionY - rectangulo.top)
        );
        const alturaDocumento = vistaPreviaActual.alturaDocumento;
        const maximoScroll = Math.max(
            0,
            alturaDocumento - vistaPreviaActual.alturaViewport
        );

        if (maximoScroll === 0) return 0;

        const posicionDocumento = posicionEnImagen / rectangulo.height * alturaDocumento;

        return Math.max(
            0,
            Math.min(100, Math.round(posicionDocumento / maximoScroll * 100))
        );
    }

    //Función para cambiar el valor de un punto de scroll
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

    //Función para añadir un nuevo punto de scroll
    function anadir(valor) {

        if (!Number.isInteger(valor) || valor < 0 || valor > 100) return;

        if (datos[paginaActual].puntos.includes(valor)) { mensaje.textContent = 'Ese punto ya existe.'; return; }
        datos[paginaActual].puntos.push(valor); mensaje.textContent = ''; mostrar();

    }
    mapa.onclick = function (evento) {
        if (evento.target.closest('button')) return;

        const valor = porcentaje(evento.clientY);
        if (valor !== null) anadir(valor);
    };

    //Formulario para añadir un punto manualmente
    document.getElementById('pag3-anadir').onsubmit = function (evento) {
        evento.preventDefault();
        let campo = document.getElementById('pag3-nuevo');
        if (campo.value !== '') anadir(Number(campo.value));
    };

    //Guarda los viewports de la pagina actual al cambiar el estado de las casillas
    casillas.forEach(function (casilla) {

        casilla.onchange = function () {
            let elegidos = [];
            casillas.forEach(function (opcion) { if (opcion.checked) elegidos.push(opcion.value); });
            if (elegidos.length) { datos[paginaActual].tamanos = elegidos; mensaje.textContent = ''; }
            else mensaje.textContent = 'Selecciona al menos un tamaño.';
            mostrar();
        };
    });

    //Botón para restaurar la configuración inicial de la página actual
    document.getElementById('pag3-restaurar').onclick = function () {

        datos[paginaActual] = clonarInicial();
        mensaje.textContent = ''; mostrar();
    };

    //Botón para copiar la configuración de otra página a la página actual
    copiar.onchange = function () {

        if (!copiar.value) return;
        datos[paginaActual].puntos = datos[copiar.value].puntos.slice();
        datos[paginaActual].tamanos = datos[copiar.value].tamanos.slice();
        mensaje.textContent = 'Configuración copiada.'; mostrar();
    };

    //Navegación entre páginas
    document.getElementById('btn-volver').addEventListener('click', () => mostrarPagina('pagina-1'));
    document.getElementById('pag3-volver').addEventListener('click', () => mostrarPagina('pag2'));

    //Botón para continuar a la página 3, validando que las URLs seleccionadas tengan estado OK y que los puntos de scroll sean válidos
    document.getElementById('btn-continuar').addEventListener('click', async () => {

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
        if (!crawlIdActual) {
            alert('No hay un rastreo válido. Vuelve a analizar la web.');
            return;
        }

        try {
            //Enviamos la petición al servidor
            const respuesta = await fetch('/api/seleccion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    crawlId: crawlIdActual, //id de rastreo
                    urls: filas.map(fila => fila.dataset.url)
                })
            });
            //Convertimos la respuesta de json a js
            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                alert(resultado.error || 'No se pudo registrar la selección.');
                return;
            }
        } catch (error) {
            console.error('Error al registrar la selección:', error);
            alert('No se pudo conectar con el servidor para registrar la selección.');
            return;
        }

        const tamanos = Object.keys(anchos).filter(nombre => Array.from(casillasViewport).some(casilla => casilla.value === anchos[nombre] && casilla.checked));
        const nuevosIniciales = { puntos: puntos.sort((a, b) => a - b), tamanos };
        const nuevoTipo = document.querySelector('#pag2 input[name="tipo"]:checked').value;
        const cambiaron = JSON.stringify(nuevosIniciales) !== JSON.stringify(inicial) || tipo !== nuevoTipo;
        inicial = nuevosIniciales; tipo = nuevoTipo;

        const anteriores = datos; datos = Object.create(null);
        filas.forEach(fila => {
            const url = fila.dataset.url;
            datos[url] = !cambiaron && anteriores[url] ? anteriores[url] : clonarInicial();
        });

        if (!datos[paginaActual]) paginaActual = Object.keys(datos)[0];
        mensaje.textContent = tipo === 'completa' ? 'Página completa: se cuenta una captura por tamaño; los puntos de scroll solo se aplican al modo viewport.' : '';
        mostrar(); mostrarPagina('pag3');

    });

    //Al cargar la página, se restauran los datos guardados en sessionStorage
    contenedorPuntosScroll.querySelectorAll('.puntos__item').forEach(punto => punto.remove());
    inicial.puntos.forEach(valor => contenedorPuntosScroll.insertBefore(crearPunto(valor), btnAnadirPunto));
    casillasViewport.forEach(casilla => { casilla.checked = inicial.tamanos.some(nombre => anchos[nombre] === casilla.value); });
    document.querySelectorAll('#pag2 input[name="tipo"]').forEach(casilla => { casilla.checked = casilla.value === tipo; });
    mostrar();
    if (sessionStorage.getItem('paginaActual') === 'pag3' && !datos[paginaActual]) sessionStorage.setItem('paginaActual', 'pag2');

})(); //Fin del bloque aislado de la página 3


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

//Recuperar la página actual de sessionStorage o usar "inicio" como valor predeterminado
const paginaGuardada = sessionStorage.getItem("paginaActual") || "inicio";
mostrarPagina(paginaGuardada, false);
history.replaceState({ pagina: paginaGuardada }, "", "#" + paginaGuardada);

//======  PAGINA 4   ======//
//Tarjetas de resultados, filtros y exportación

const listaResultados = document.getElementById("pag4-lista");
const archivos = document.getElementById("pag4");
const resumen = document.getElementById("pag4-resumen");
const filtro = document.getElementById("pag4-filtro");

//Botones de descarga y exportación
const descargarZip = document.getElementById("pag4-zip");
const botonExportar = document.getElementById("pag4-pdf");

//Botones de navegación
const botonAtras = document.getElementById("pag4-volver");

const botonGenerar = document.getElementById("pag3-generar");


const nombresTamano = { desktop: "Desktop", tablet: "Tablet", movil: "Móvil" };

//Función para leer la configuración guardada en la pagina 3 desde sessionStorage y devolverla como un objeto
function leerConfigPag3() {

    const guardado = sessionStorage.getItem("webshot-configuracion-pag3");
    if (!guardado) {
        return null;
    }
    return JSON.parse(guardado);
}

//Función para crear una tarjeta de resultado para una URL dada, con la configuración de puntos y tamaños de viewport
function crearTarjetaResultado(url, config, tipo) {

    let etiquetas;

    if (tipo === "completa") {
        etiquetas = ["Completa"];
    }
    else { etiquetas = config.puntos.map(function (p) { return p + "%"; }); }

    let miniaturas = "";

    //Generar las miniaturas para cada combinación de tamaño y etiqueta
    config.tamanos.forEach(function (tamano) {
        etiquetas.forEach(function (etiqueta) {
            miniaturas += `
                <figure class="pag4__miniatura">
                    <span class="pag4__etiqueta">${etiqueta}</span>
                    <button type="button" class="pag4__descarga boton-claro">⬇</button>
                    <figcaption>${nombresTamano[tamano]}</figcaption>
                </figure>`;
        });
    });

    const cantidad = etiquetas.length * config.tamanos.length;

    //Crear el elemento de tarjeta con la información de la URL, cantidad de capturas y miniaturas
    const tarjeta = document.createElement("article");
    tarjeta.className = "pag4__tarjeta";
    tarjeta.dataset.url = url.toLowerCase();
    tarjeta.innerHTML = `
        <div class="pag4__tarjeta-cabecera">
            <div class="pag4__info">
                <strong class="pag4__url"></strong>
            </div>
            <span class="pag4__contador">${cantidad} capturas</span>
        </div>
        <div class="pag4__miniaturas">${miniaturas}</div>`;

    tarjeta.querySelector(".pag4__url").textContent = url;

    return { tarjeta: tarjeta, cantidad: cantidad };
}


//Función para mostrar los resultados en la página 4, generando tarjetas
function mostrarResultados() {

    listaResultados.innerHTML = "";

    const config = leerConfigPag3();
    if (!config) {
        resumen.textContent = "0 capturas · 0 páginas";
        return;
    }

    let totalCapturas = 0;
    const direcciones = Object.keys(config.datos);

    direcciones.forEach(function (url) {

        const resultado = crearTarjetaResultado(url, config.datos[url], config.tipo);
        listaResultados.appendChild(resultado.tarjeta);
        totalCapturas += resultado.cantidad;

    });

    resumen.textContent = totalCapturas + " capturas · " + direcciones.length + " páginas";
}

//Botón para generar los resultados y pasar a la página 4
botonGenerar.addEventListener("click", function () {

    mostrarResultados();
    mostrarPagina("pag4");
});

//Filtro paralas tarjetas de resultados según la URL
filtro.addEventListener("input", function () {

    const texto = filtro.value.trim().toLowerCase();

    listaResultados.querySelectorAll(".pag4__tarjeta").forEach(function (tarjeta) {
        tarjeta.hidden = !tarjeta.dataset.url.includes(texto);
    });
});


//Botón para volver a la página 3
botonAtras.addEventListener("click", function () {
    mostrarPagina("pag3");
});

//Al cargar la página, se muestran los resultados si ya hay una configuración guardada
mostrarResultados();

// Pide una captura al servidor y devuelve la ruta de la imagen
//En concreto, esa función pedirCaptura(url, tamano) hace esto:
//Envía al backend (/api/captura) la URL y el tamaño.
//El backend ejecuta hacerCaptura(...) con Playwright.
//Guarda el .png en la carpeta capturas.
//Devuelve una ruta como "/capturas/captura-123.png".
//La función te la devuelve para que tú luego la pongas en un <img> o en tu lista de resultados.

async function pedirCaptura(url, tamano) {
    const respuesta = await fetch("/api/captura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url, tamano: tamano })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || "Error al hacer la captura");
    }

    return datos.imagen; // por ejemplo "/capturas/captura-123-desktop.png"
}