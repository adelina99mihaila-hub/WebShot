import { test, expect } from '@playwright/test';

test('Medición del buscador', async ({ page }) => {

    test.setTimeout(600000);

    const URL_PRUEBA = 'www.cofre.io';
    const REPETICIONES = 10;
    const PROFUNDIDAD = 1;

    const tiempos = [];

    let urlsEsperadas = null;
    let hayVariaciones = false;

    for (let i = 1; i <= REPETICIONES; i++) {

        //Abre la app y localiza los elementos
        await page.goto('http://localhost:3000');


        const formulario = page.locator('#search-box');
        const pagina1 = page.locator('#pagina-1');

        await page.getByText('⌄').click();
        await page.getByRole('slider', { name: 'Profundidad de crawl ·' }).fill(String(PROFUNDIDAD));
        //Introducimos la url
        await formulario.getByRole('textbox', { name: 'Buscar URL' }).fill('www.cofre.io');

        //Esperamos la respuesta del servidor
        const respuestaCrawl = page.waitForResponse(response =>
            response.url().includes('/api/crawl') &&
            response.request().method() === 'POST'
        );

        const inicio = Date.now();

        //Pulsamos el boton de Analizando
        await formulario.getByRole('button').click();

        //Recogemos la respuesta del servidor
        const respuesta = await respuestaCrawl;
        expect(respuesta.status()).toBe(200);

        //Comprobamos los datos
        const datos = await respuesta.json();

        const urlsEncontradas = datos.pages.length;

        if (urlsEsperadas === null) {
            urlsEsperadas = urlsEncontradas;
        }

        if (urlsEncontradas !== urlsEsperadas) {

            hayVariaciones = true;

            console.warn(
                `Variación detectada en ejecución ${i}: `
                + `${urlsEncontradas} URLs`
            );
        }

        await expect(pagina1).toBeVisible({ timeout: 60000 });

        const fin = Date.now();

        const tiempoBusqueda = ((fin - inicio) / 1000).toFixed(2);

        tiempos.push(Number(tiempoBusqueda));

        console.log(`Ejecución ${i}: ${tiempoBusqueda} s`);

        //Se vuelve a inicio
        await page.getByRole('button', { name: 'Inicio' }).click();

        await expect(formulario).toBeVisible();


    }

    const minimo = Math.min(...tiempos);
    const maximo = Math.max(...tiempos);

    const media = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;

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

        
    console.log(`URLs encontradas: ${urlsEsperadas}`);

    if (hayVariaciones) {

        console.log(`Hay variaciones en las URLs encontradas`);
    }

    console.log('\n========== RESULTADOS ==========');

    console.log('URL:', URL_PRUEBA);

    console.log('Profundidad: ', PROFUNDIDAD);

    console.log('Repeticiones:', REPETICIONES);

    console.log('Mínimo:', minimo, 's');

    console.log('Máximo:', maximo, 's');

    console.log(
        'Media:',
        media.toFixed(2),
        's'
    );

    console.log('Mediana:', mediana.toFixed(2), 's');

    console.log('Desviación típica:', desviacionTipica.toFixed(2), 's');

    console.log('Rango:', rango.toFixed(2), 's');

    console.log('Coeficiente de variación:', coeficienteVariacion.toFixed(2), '%');

    console.log('===============================');




});