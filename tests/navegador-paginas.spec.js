import { test, expect } from '@playwright/test';

test.describe('Navegación y reinicio del flujo', () => {

    //Test para la navegacion 1-2-3-4------------------------------------------------------------------------------------------------------
    test('Navegación entre páginas con el navbar', async ({ page }) => {

        //Abre la app y localiza los elementos
        await page.goto('http://localhost:3000');

        const formulario = page.locator('#search-box');
        const pagina1 = page.locator('#pagina-1');
        const pagina2 = page.locator('#pag2');
        const pagina3 = page.locator('#pag3');
        const pagina4 = page.locator('#pag4');
        const historial = page.locator('#lista-historico');

        //Introducimos la url
        await formulario.getByRole('textbox', { name: 'Buscar URL' }).fill('www.cofre.io');

        //Pulsamos el boton de Analizando
        await formulario.getByRole('button').click();

        await expect(pagina1).toBeVisible({ timeout: 60000 });

        await page.getByRole('checkbox', { name: 'Seleccionar https://www.cofre.io/', exact: true }).check();

        await page.getByRole('button', { name: 'Config global' }).click();

        //Aparece la página 2 (configuración global)
        await expect(pagina2).toBeVisible({ timeout: 60000 });

        await page.getByRole('button', { name: 'Config por página' }).click();

        //Página 3 (configuracion por página)
        await expect(pagina3).toBeVisible({ timeout: 60000 });

        await page.getByRole('button', { name: 'Resultados' }).click();

        //Pasado el tiempo se generan las capturas y se pasa a la página 4 (resultados)
        await expect(pagina4).toBeVisible({ timeout: 60000 });

        //Se vuelve a inicio
        await page.getByRole('button', { name: 'Inicio' }).click();

    });

    test('Genera capturas con la configuración predeterminada', async ({ page }) => {

        //Abre la app y localiza los elementos
        await page.goto('http://localhost:3000');

        const formulario = page.locator('#search-box');
        const pagina1 = page.locator('#pagina-1');
        const pagina4 = page.locator('#pag4');

        //Introducimos la url
        await formulario.getByRole('textbox', { name: 'Buscar URL' }).fill('www.cofre.io');

        //Pulsamos el boton de Analizando
        await formulario.getByRole('button').click();

        await expect(pagina1).toBeVisible({ timeout: 60000 });

        await page.getByRole('checkbox', { name: 'Seleccionar https://www.cofre.io/', exact: true }).check();

        await page.getByRole('button', { name: 'Resultados' }).click();

        //Pasado el tiempo se generan las capturas y se pasa a la página 4 (resultados)
        await expect(pagina4).toBeVisible({ timeout: 60000 });
    });

    test('Restaura la aplicación al volver a inicio', async ({ page }) => {

         test.setTimeout(600000);
        //Abre la app y localiza los elementos
        await page.goto('http://localhost:3000');

        const formulario = page.locator('#search-box');
        const pagina1 = page.locator('#pagina-1');
        const pagina2 = page.locator('#pag2');
        const pagina3 = page.locator('#pag3');
        const pagina4 = page.locator('#pag4');
        const elementosHistorico = page.locator('#lista-historico button');

        //Introducimos la url
        await formulario.getByRole('textbox', { name: 'Buscar URL' }).fill('www.cofre.io');

        //Pulsamos el boton de Analizando
        await formulario.getByRole('button').click();

        await expect(pagina1).toBeVisible({ timeout: 60000 });

        await page.getByRole('checkbox', { name: 'Seleccionar https://www.cofre.io/', exact: true }).check();

        await page.getByRole('button', { name: 'Config global' }).click();

        //Aparece la página 2 (configuración global)
        await expect(pagina2).toBeVisible({ timeout: 60000 });

        //Editamos un poco la configuración
        await page.getByText('Móvil 390px').click();
        await page.getByRole('checkbox', { name: 'Móvil 390px' }).check();
        await page.getByRole('button', { name: '+ Añadir punto' }).click();

        await page.getByRole('button', { name: 'Config por página' }).click();

        //Página 3 (configuracion por página)
        await expect(pagina3).toBeVisible({ timeout: 60000 });

        //Editamos la configuración por página
        await page.getByRole('spinbutton', { name: 'Nuevo punto (%)' }).click();
        await page.getByRole('spinbutton', { name: 'Nuevo punto (%)' }).fill('80');
        await page.getByRole('button', { name: 'Añadir punto' }).click();
        await page.getByRole('button', { name: 'Resultados' }).click();

        //Pasado el tiempo se generan las capturas y se pasa a la página 4 (resultados)
        await expect(pagina4).toBeVisible({ timeout: 60000 });

        //Se vuelve a inicio
        await page.getByRole('button', { name: 'Inicio' }).click();

        //Los valores se han reiniciado
        const estadoSesion = await page.evaluate(() => ({
            crawlId: sessionStorage.getItem('crawlIdActual'),
            configuracion: sessionStorage.getItem('webshot-configuracion-pag3'),
            resultado: sessionStorage.getItem('webshot-resultado'),
            pagina: sessionStorage.getItem('paginaActual')
        }));

        expect(estadoSesion).toEqual({
            crawlId: null,
            configuracion: null,
            resultado: null,
            pagina: 'inicio'
        });

        // Historial conservado
        await expect(elementosHistorico).toHaveCount(1);


    });



});
