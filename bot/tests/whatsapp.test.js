import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mensajesDeAviso, firmaValida, crearCanalWhatsapp } from '../src/canales/whatsapp.js';
import { crearEnrutador } from '../src/canales/index.js';

const aviso = (mensajes, contactos = []) => ({
  object: 'whatsapp_business_account',
  entry: [{ changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', contacts: contactos, messages: mensajes } }] }],
});

test('lee los mensajes de un aviso de Meta y descarta los estados', () => {
  const recibidos = mensajesDeAviso(aviso(
    [
      { from: '50761234567', id: 'wamid.A', type: 'text', text: { body: ' Hola ' } },
      { from: '50761234567', id: 'wamid.B', type: 'image', image: { caption: 'mi receta' } },
      { from: '50769999999', id: 'wamid.C', type: 'text', text: { body: 'Sí' }, context: { id: 'wamid.X' } },
    ],
    [{ wa_id: '50761234567', profile: { name: 'Ana Pérez' } }],
  ));
  assert.deepEqual(recibidos[0], {
    chatId: 'wa_50761234567', nombre: 'Ana Pérez', usuario: '+50761234567', texto: 'Hola', esTexto: true, respuestaA: undefined, idMensaje: 'wamid.A',
  });
  assert.equal(recibidos[1].esTexto, false);
  assert.equal(recibidos[1].texto, 'mi receta');
  assert.equal(recibidos[2].respuestaA, 'wamid.X');
  assert.deepEqual(mensajesDeAviso({ entry: [{ changes: [{ value: { statuses: [{ status: 'read' }] } }] }] }), []);
});

test('la firma de Meta se comprueba con el secreto de la aplicación', async () => {
  const cuerpo = JSON.stringify(aviso([]));
  const firma = `sha256=${createHmac('sha256', 'secreto').update(cuerpo).digest('hex')}`;
  assert.equal(await firmaValida(cuerpo, firma, 'secreto'), true);
  assert.equal(await firmaValida(cuerpo, firma, 'otro'), false);
  assert.equal(await firmaValida(`${cuerpo} `, firma, 'secreto'), false);
  assert.equal(await firmaValida(cuerpo, null, 'secreto'), false);
});

test('envía por la API de Meta y el enrutador elige el canal por el prefijo', async () => {
  const llamadas = [];
  const fetchFn = async (url, opciones) => {
    llamadas.push({ url, cuerpo: JSON.parse(opciones.body), auth: opciones.headers.Authorization });
    return { ok: true, json: async () => ({ messages: [{ id: `wamid.${llamadas.length}` }] }) };
  };
  const whatsapp = crearCanalWhatsapp({ token: 'TOK', numeroId: '123', fetchFn });
  const telegram = { prefijo: 'tg', enviar: async () => 'tg-1' };
  const canal = crearEnrutador([telegram, whatsapp]);

  assert.equal(await canal.enviar('wa_50761234567', 'Hola', { responderA: 'wamid.X' }), 'wamid.1');
  assert.equal(llamadas[0].url, 'https://graph.facebook.com/v23.0/123/messages');
  assert.equal(llamadas[0].auth, 'Bearer TOK');
  assert.deepEqual(llamadas[0].cuerpo, {
    messaging_product: 'whatsapp', to: '50761234567', type: 'text', text: { body: 'Hola' }, context: { message_id: 'wamid.X' },
  });
  assert.equal(await canal.enviar('tg_5', 'Hola'), 'tg-1');

  await canal.escribiendo('wa_50761234567', 'wamid.A');
  assert.deepEqual(llamadas.at(-1).cuerpo, { messaging_product: 'whatsapp', status: 'read', message_id: 'wamid.A', typing_indicator: { type: 'text' } });
});

test('un error de Meta se informa con su mensaje', async () => {
  const fetchFn = async () => ({ ok: false, status: 400, json: async () => ({ error: { message: 'Re-engagement message' } }) });
  const whatsapp = crearCanalWhatsapp({ token: 'T', numeroId: '1', fetchFn });
  await assert.rejects(whatsapp.enviar('wa_1', 'Hola'), /Re-engagement message/);
});
