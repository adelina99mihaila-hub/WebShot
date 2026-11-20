import { test, expect } from '@playwright/test';

import fs from 'node:fs';
import path from 'node:path';

test('@benchmark Medición de las capturas', async ({ page }) => {

    test.setTimeout(200000);
    //Abre la app y localiza los elementos
    await page.goto('http://localhost:3000/#inicio');

    const URL_PRUEBA = 'www.cofre.io';
    const REPETICIONES = 5;

    const tiempos = [];
    const tiempoMedioBusqueda = [];

    let capturasRealizadas = null;
    let erroresEncontrados = null;
    let hayVariaciones = false;

    for (let i = 1; i <= REPETICIONES; i++) {

        const formulario = page.locator('#search-box');
        const pagina1 = page.locator('#pagina-1');
        const pagina2 = page.locator('#pag2');
        const pagina3 = page.locator('#pag3');
        const pagina4 = page.locator('#pag4');
        const paginaCarga = page.locator('#pantalla-generando');

        //Introducimos la url
        await formulario.getByRole('textbox', { name: 'Buscar URL' }).fill('www.cofre.io');

        //Pulsamos el boton de Analizando
        await formulario.getByRole('button').click();

        //Pasamos a la pagina 1 (tabla de resultados)
        await expect(pagina1).toBeVisible({ timeout: 60000 });

        //-------------------------------------------SELECTOR DE URL----------------------------------------------------------------------

        //Seleccionamos un resultado para probar las capturas
        await page.getByRole('checkbox', { name: 'Seleccionar https://www.cofre.io/', exact: true }).check();

        //Procesamos la url seleccionada
        await page.getByRole('button', { name: 'Procesar URLs seleccionadas' }).click();

        //Aparece la página 2 (configuración global)
        await expect(pagina2).toBeVisible({ timeout: 60000 });


        //-------------------------------------------COFIGURACIÓN POR DEFECTO-------------------------------------------------------------

        //Dejamos la configuración por defecto y avanzamos
        await page.getByRole('button', { name: 'Continuar' }).click();

        //Página 3 (configuracion por página)
        await expect(pagina3).toBeVisible({ timeout: 60000 });


        //-------------------------------------------GENERAR CAPTURAS-------------------------------------------------------------------------

        //Esperamos la respuesta del servidor
        const respuestaGeneracion = page.waitForResponse(response =>
            response.url().includes('/api/generar') &&
            response.request().method() === 'POST'
        );

        const inicio = Date.now();

        //Generamos las capturas con la configuración por defecto
        await page.getByRole('button', { name: 'Generar capturas' }).click();

        //Aparece la página de carga de generación de capturas
        await expect(paginaCarga).toBeVisible();

        const respuesta = await respuestaGeneracion;
        const datos = await respuesta.json();

        //Pasado el tiempo se generan las capturas y se pasa a la página 4 (resultados)
        await expect(pagina4).toBeVisible({ timeout: 160000 });

        const fin = Date.now();

        const paginas = datos.paginas;

        let capturasTotales = 0;

        let errores = 0;

        paginas.forEach((pagina) => {

            (pagina.capturas).forEach((captura) => {

                if (captura.error) {
                    errores++;
                } else {
                    capturasTotales++;
                }

            });

        });
        if (capturasRealizadas === null) {
            capturasRealizadas = capturasTotales;
        }
        if (erroresEncontrados === null) {
            erroresEncontrados = errores;
        }
        if (capturasRealizadas !== capturasTotales || erroresEncontrados !== errores) {

            hayVariaciones = true;

            console.warn(
                `Variación detectada en ejecución ${i}: `
                + `${capturasTotales} capturas y ${errores} errores`
            );
        }

        const tiempoCapturas = ((fin - inicio) / 1000);

        tiempos.push(tiempoCapturas);

        const tiempoMedio = tiempoCapturas / capturasTotales;

        console.log(`Ejecución ${i}: ${tiempoCapturas.toFixed(2)} s 
        Tiempo medio: ${tiempoMedio.toFixed(2)}`);

        //Se vuelve a inicio
        await page.getByRole('button', { name: 'Inicio' }).click();

        await expect(formulario).toBeVisible();

    }

    const minimo = Math.min(...tiempos);
    const maximo = Math.max(...tiempos);

    const media = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;

    const mediaCapturas = media / capturasRealizadas;

    const ordenados = [...tiempos].sort((a, b) => a - b);

    const mitad = Math.floor(ordenados.length / 2);

    const mediana = ordenados.length % 2 === 0
        ? (ordenados[mitad - 1] + ordenados[mitad]) / 2
        : ordenados[mitad];

    const varianza = tiempos.reduce((a, b) =>
        a + Math.pow(b - media, 2), 0) / tiempos.length;

    const desviacionTipica = Math.sqrt(varianza);

    const rango = maximo - minimo;

    const coeficienteVariacion = media > 0
        ? (desviacionTipica / media) * 100
        : 0;

    //-------------------------------------------------------------------------------------------------
    const resultados = {
        fecha: new Date().toISOString(),
        url: URL_PRUEBA,
        repeticiones: REPETICIONES,
        capturas: capturasRealizadas,
        errores: erroresEncontrados,
        variaciones: hayVariaciones,
        tiempos,
        estadisticas: {
            minimo,
            maximo,
            media: Number(media.toFixed(2)),
            mediaCapturas: Number(mediaCapturas.toFixed(2)),
            mediana: Number(mediana.toFixed(2)),
            desviacionTipica: Number(desviacionTipica.toFixed(2)),
            rango: Number(rango.toFixed(2)),
            coeficienteVariacion: Number(coeficienteVariacion.toFixed(2))
        }

    };

    const rutaArchivo = path.join(
        process.cwd(),
        'tests',
        'benchmarks',
        'resultados-capturas.json'
    );

    fs.mkdirSync(path.dirname(rutaArchivo), { recursive: true });

    let historico = { ejecuciones: [] };

    if (fs.existsSync(rutaArchivo)) {

        historico = JSON.parse(fs.readFileSync(rutaArchivo, 'utf-8'));

        if (!Array.isArray(historico.ejecuciones)) {
            throw new Error('El formato del histórico no es válido.');
        }
    }

    const siguienteId = historico.ejecuciones.reduce(
        (maximo, ejecucion) => Math.max(maximo, ejecucion.id || 0),
        0
    ) + 1;

    historico.ejecuciones.push({
        id: siguienteId,
        ...resultados
    });

    const archivoTemporal = `${rutaArchivo}.tmp`;

    fs.writeFileSync(
        archivoTemporal,
        JSON.stringify(historico, null, 2),
        'utf-8'
    );

    fs.renameSync(archivoTemporal, rutaArchivo);



    console.log('\n========== RESULTADOS ==========');

    console.log('URL:', URL_PRUEBA);

    console.log('Repeticiones:', REPETICIONES);

    if (hayVariaciones) {

        console.log(`Hay variaciones en el número de capturas`);
    } else {
        console.log('Capturas realizadas:', capturasRealizadas);

        console.log('Errores:', erroresEncontrados);
    }

    console.log('Mínimo:', minimo.toFixed(2), 's');

    console.log('Máximo:', maximo.toFixed(2), 's');

    console.log(
        'Media:',
        media.toFixed(2),
        's'
    );

    console.log(
        'Media por captura:',
        mediaCapturas.toFixed(2),
        's'
    );

    console.log('Mediana:', mediana.toFixed(2), 's');

    console.log('Desviación típica:', desviacionTipica.toFixed(2), 's');

    console.log('Rango:', rango.toFixed(2), 's');

    console.log('Coeficiente de variación:', coeficienteVariacion.toFixed(2), '%');

    console.log('===============================');


});
