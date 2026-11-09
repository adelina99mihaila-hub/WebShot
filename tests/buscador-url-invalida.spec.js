import { test, expect } from '@playwright/test';

test.describe('URLs inválidas', () => {

    //Test para un protocolo FTP------------------------------------------------------------------------------------------------------
    test('Rechazar una URL con protocolo no permitido', async ({ page }) => {

        await page.goto('http://localhost:3000');

        const formulario = page.locator('#search-box');

        //Escuchamos la alerta
        page.once('dialog', async dialog => {
            expect(dialog.message()).toBe('Solo se permiten URLs con http o https');
            await dialog.accept();
        });


        //Introducimos la URL FTP
        await formulario.getByRole('textbox', { name: 'Buscar URL' }).fill('ftp://ejemplo.com');

        //Esperamos la respuesta del servidor
        const respuestaCrawl = page.waitForResponse(response =>
            response.url().includes('/api/crawl') &&
            response.request().method() === 'POST'
        );

        //Pulsamos Analizar
        await formulario.getByRole('button').click();

        //Recogemos la respuesta del servidor
        const respuesta = await respuestaCrawl;

        expect(respuesta.status()).toBe(400);

        const datos = await respuesta.json();

        expect(datos.error).toBe('Solo se permiten URLs con http o https');

    });

    //----------------------------------------------------------------------------------------------------------------------------

    //Test para una entrada vacia-------------------------------------------------------------------------------------------------
    test('Comprobar una entrada vacia', async ({ page }) => {

        await page.goto('http://localhost:3000');

        const formulario = page.locator('#search-box');
        const loader = page.getByRole('status');
        const peticiones = [];

        page.on('request', request => {
            peticiones.push(request.url());
        });

        //Comprobamos que el loader no esta visible
        await expect(loader).toBeHidden();

        //Introducimos la url
        await formulario.getByRole('textbox', { name: 'Buscar URL' }).fill(' ');

        //Pulsamos el boton de Analizando
        await formulario.getByRole('button').click();

        //Damos un margen para observar posibles peticiones
        await page.waitForTimeout(1000);

        const busqueda = peticiones.some(url => url.includes('/api/crawl'))

        expect(busqueda).toBe(false);

        //Comprobamos que el loader sigue oculto
        await expect(loader).toBeHidden();

    });


});

