# Precios compartidos con Google Sheets

Con esto los precios se guardan en una hoja de Google: si alguien cambia un precio en cualquier
dispositivo, lo ven todos. Se hace una sola vez y lleva unos 10 minutos.

## 1. Crear la hoja y pegar el script

1. Entra en [sheets.new](https://sheets.new) con la cuenta de Google que será dueña de los precios.
   Ponle de nombre, por ejemplo, **Precios Generador**.
2. Menú **Extensiones → Apps Script**.
3. Borra lo que aparece en el editor y pega **todo** el contenido de `precios.gs`.
4. Guarda (icono del disquete).

## 2. Cargar la lista de precios

1. En la barra de arriba del editor, elige la función **`inicializar`** y pulsa **Ejecutar**.
2. Google pedirá permisos la primera vez: **Revisar permisos** → elige tu cuenta →
   **Configuración avanzada → Ir a (nombre del proyecto)** → **Permitir**.
   (El aviso sale porque el script es tuyo y no está publicado en la tienda de Google; es normal.)
3. Vuelve a la hoja: aparece la pestaña **Precios** con todos los productos.
   Las filas sin precio (Retatrutide 40 mg, NAD+ 1000 mg, Vilon, Vesugen, Cartalax) quedan vacías para completarlas.

## 3. Elegir el PIN

1. En el editor de Apps Script: icono de engranaje **Configuración del proyecto**.
2. Abajo, en **Propiedades del script → Agregar propiedad**:
   - Propiedad: `PIN`
   - Valor: el PIN que usarán para editar precios. **Usa al menos 6 caracteres mezclando letras y números**
     (la dirección del script es pública; un PIN corto se puede adivinar probando).
3. **Guardar propiedades del script**.

## 4. Publicar el script

1. Botón **Implementar → Nueva implementación**.
2. En el engranaje de "Seleccionar tipo", elige **Aplicación web**.
3. Configura:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
4. **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).

## 5. Pasarme la URL

Envíame esa URL y la pongo en `protocolos/js/config.js`. A partir de ahí:

- La herramienta lee los precios de la hoja cada vez que se abre (y al volver a la pestaña).
- Al editar un precio en la pestaña **Precios**, pide el PIN la primera vez en cada dispositivo.
- También se pueden editar precios directamente en la hoja (columna "Precio lista").

## Si algún día cambias el script

Hay que volver a publicarlo: **Implementar → Gestionar implementaciones → editar (lápiz) →
Versión: Nueva versión → Implementar**. Así la URL no cambia.
