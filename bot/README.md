# Bot de atención

Primera entrevista con los clientes: se presenta como asistente virtual, entiende qué buscan, recomienda
productos del catálogo, da precios de kit y entrega, y pasa a una persona ("su asesor personal") a quien quiere
comprar, tiene una condición de salud, pregunta dosis o pide hablar con alguien. Nunca da dosis.

## Arrancar en local (pruebas)

```bash
cd bot
cp .env.ejemplo .env   # y completar las claves
npm start              # node src/local.js
npm test
```

Requiere Node 22 o superior. No tiene dependencias externas.

## En la nube (Cloudflare Workers, plan gratuito)

Una sola vez: cuenta en Cloudflare y `npx wrangler login`. Después:

```bash
npm run nube:publicar   # sube el código; muestra la URL → ponerla en NUBE_URL del .env
npm run nube:secretos   # sube TELEGRAM_TOKEN, GEMINI_API_KEY, CLAVE_ADMIN y WEBHOOK_SECRETO
npm run nube:importar   # (opcional) copia admins, horario y conversaciones del modo local
npm run nube:webhook    # Telegram empieza a entregar los mensajes a la nube
```

Para probar la versión de la nube en este equipo: `npm run nube:local`.
**Ojo:** `npm start` (modo local) desactiva el webhook; al terminar, `npm run nube:webhook`.

Los chats llevan el canal en su id (`tg_…`, más adelante `wa_…`), así que Telegram y WhatsApp
funcionan a la vez con el mismo bot.

## Admins

En el chat del bot: `/admin CLAVE` (la `CLAVE_ADMIN` del `.env`). Los admins:

- reciben un aviso cuando el bot pasa un cliente a una persona;
- **responden a ese aviso** (o a los mensajes reenviados del cliente) para escribirle al cliente;
- `/reactivar_ID` devuelve el cliente al bot · `/clientes` lista los últimos · `/horario` ver o cambiar el horario · `/ayuda`.

Si un admin escribe sin responder a un aviso, habla con el bot como un cliente (sirve para probar).
Cualquiera puede escribir `/reiniciar` para empezar su conversación de cero.

## Piezas (pensadas para migrar cambiando configuración)

| Pieza | Archivo | Pruebas | Producción |
|---|---|---|---|
| Cerebro (reglas, flujo, derivación) | `src/nucleo.js`, `src/prompt.js` | igual | igual |
| Conocimiento | `src/conocimiento.js`, `conocimiento/preguntas-frecuentes.md` | catálogo + precios de la hoja | igual |
| IA | `src/ia/` (`IA_PROVEEDOR`, `IA_MODELO`) | Gemini gratuito | Claude Haiku 5.5 (adaptador por agregar) |
| Canal | `src/canales/` (`CANAL`) | Telegram | WhatsApp (adaptador por agregar) |
| Almacén | `src/almacen.js` | archivo `datos/estado.json` | almacén en la nube |
| Arranque | `src/local.js` | este equipo | webhook en la nube |

`.env` y `datos/` no se suben al repositorio: tienen claves y conversaciones de clientes.
