import test from 'node:test';
import assert from 'node:assert/strict';

import { WhatsappBotClient } from '../src/channels/whatsapp/whatsapp-runtime.mjs';

function fakeSocket() {
  const calls = [];
  let nextId = 0;
  return {
    calls,
    async sendMessage(jid, content, options = {}) {
      const key = {
        remoteJid: jid,
        fromMe: true,
        id: options.messageId ?? `server-${++nextId}`,
      };
      calls.push({ jid, content, options, key });
      return { key };
    },
    async sendPresenceUpdate() {},
    async readMessages() {},
  };
}

test('WhatsApp stream creates one message and edits that message', async () => {
  const socket = fakeSocket();
  const client = new WhatsappBotClient(socket, {
    reserve() {},
    remember() {},
  });

  const stream = await client.openStream(
    { jid: '447352125716@s.whatsapp.net', quoted: { key: { id: 'inbound' } } },
    { updateIntervalMs: 5 },
  );

  assert.equal(socket.calls.length, 1);
  assert.equal(socket.calls[0].content.text, 'Processing…');
  assert.deepEqual(socket.calls[0].options.quoted, { key: { id: 'inbound' } });

  stream.update('partial answer');
  await new Promise((resolve) => setTimeout(resolve, 15));

  assert.equal(socket.calls.length, 2);
  assert.equal(socket.calls[1].content.text, 'partial answer');
  assert.deepEqual(socket.calls[1].content.edit, socket.calls[0].key);

  await stream.finish('final answer');

  assert.equal(socket.calls.length, 3);
  assert.equal(socket.calls[2].content.text, 'final answer');
  assert.deepEqual(socket.calls[2].content.edit, socket.calls[0].key);
});

test('WhatsApp stream preserves native mention tokens while editing', async () => {
  const socket = fakeSocket();
  const client = new WhatsappBotClient(socket, {
    reserve() {},
    remember() {},
  });
  const stream = await client.openStream(
    {
      jid: '447352125716@g.us',
      senderId: '447352125716@s.whatsapp.net',
    },
    { updateIntervalMs: 1 },
  );

  stream.update('hello @@sender');
  await new Promise((resolve) => setTimeout(resolve, 10));
  await stream.finish('hello @@sender');

  assert.equal(socket.calls.at(-1).content.text, 'hello @447352125716');
  assert.deepEqual(socket.calls.at(-1).content.mentions, ['447352125716@s.whatsapp.net']);
});

test('WhatsApp stream preserves mentions in overflow messages', async () => {
  const socket = fakeSocket();
  const client = new WhatsappBotClient(socket, {
    reserve() {},
    remember() {},
  });
  const stream = await client.openStream({
    jid: '447352125716@g.us',
    senderId: '447352125716@s.whatsapp.net',
  });
  const answer = `${'a'.repeat(4_000)} hello @@sender`;

  await stream.finish(answer);

  const overflow = socket.calls.at(-1).content;
  assert.equal(overflow.text, 'hello @447352125716');
  assert.deepEqual(overflow.mentions, ['447352125716@s.whatsapp.net']);
});
