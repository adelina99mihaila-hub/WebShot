import { test, expect } from '@playwright/test';



test('@benchmark Medición de las capturas', async ({ page }) => {

    test.setTimeout(200000);
    //Abre la app y localiza los elementos
    await page.goto('http://localhost:3000/#inicio');

    const URL_PRUEBA = 'www.cofre.io';
    const REPETICIONES = 5;

    const tiempos = [];
    const tiempoMedioBusqueda = [];

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


        const tiempoCapturas = ((fin - inicio) / 1000);

        tiempos.push(tiempoCapturas);

        const tiempoMedio = (tiempoCapturas / capturasTotales);

        tiempoMedioBusqueda.push(tiempoMedio);

    }
    //-------------------------------------------------------------------------------------------------
    console.log('\n========== RESULTADOS ==========');

    console.log('URL:', URL_PRUEBA);

    console.log('Total de capturas:', capturasTotales);

    console.log('Errores:', errores);

    console.log('Tiempo total: ', tiempoCapturas.toFixed(2));

    console.log('Tiempo medio: ', tiempoMedio.toFixed(2));

    console.log('===============================');


});
