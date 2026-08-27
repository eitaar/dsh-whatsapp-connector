# DSH WhatsApp Connector

An MIT-licensed derivative of [`@xmanrui/dsh-im`](https://github.com/xmanrui/dsh-im), maintained by `eitaar`. This connector brings WhatsApp Web messaging to DeepSeek Harness with native message editing for five-second streaming progress updates. Upstream attribution and third-party notices remain in [`LICENSE`](LICENSE), [`NOTICE.md`](NOTICE.md), and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

<p align="center">
  <img src="assets/logo-dsh-whatsapp-connector-connecting-readme-3x2.png" alt="Connecting DeepSeek Harness" width="420" height="280">
  <img src="assets/logo-plugin-phone.png" alt="dsh-whatsapp-connector phone logo" width="280" height="280">
</p>

## WhatsApp

Link a device by scanning the QR code with mobile WhatsApp. The connector uses WhatsApp Web through Baileys, shows read receipts and typing state, and edits one progress message every **5,000 ms** while Harness generates the answer. The default access policy is **Only me** (the linked account's self-chat). **Selected contacts** accepts allowlisted direct-message phone numbers, and **Open responses** accepts direct messages plus permitted group messages, mentions, and replies. Rejected messages are ignored silently.

The bot also supports Harness sessions, workspaces, Agent Presets, model and reasoning controls, batch input, interactive questions, approvals, file return, and the standard `/help`, `/new`, `/status`, `/version`, `/models`, `/model`, `/reasoning`, `/preset`, `/stop`, `/steer`, `/batch`, `/send`, `/cancel`, `/compact`, `/workspace`, `/workspacelist`, `/sessionlist`, and `/session` commands. Bot messages are Chinese by default; set `language: en` or `DSH_WHATSAPP_CONNECTOR_LANGUAGE=en` for English, including the `Processing…` streaming status.

## Installation

Install the published package or the latest GitHub snapshot:

```sh
npx -y github:eitaar/dsh-whatsapp-connector install
```

From a checkout:

```sh
node bin/dsh-whatsapp-connector.mjs install --source .
```

The package, CLI, and plugin identity is `dsh-whatsapp-connector`; its runtime storage root is `~/.dsh/integrations/dsh-whatsapp-connector/`. Configure the new connector separately. If an existing `~/.dsh/integrations/dsh-whatsapp/` directory is detected, choose whether to keep, disable, or remove the old installation. The connector only reports it for migration: it never copies, deletes, or overwrites that directory automatically. The historical upstream package [`@xmanrui/dsh-im`](https://github.com/xmanrui/dsh-im) is retained for attribution only and is not an install target for this connector.

Restart `dsh web`, refresh the browser, then open **Settings → IM Bot** and scan the WhatsApp QR code. Existing credentials, workspaces, Agent Presets, and Session bindings are preserved during upgrades. Secrets and linked-device state stay in the local protected credential/runtime stores and are never returned by status or bot-list responses.

## Local development

```sh
npm install
npm run check
node bin/dsh-whatsapp-connector.mjs install --source .
```

`npm run check` runs the tests, builds the Host and Client artifacts, and verifies the publishable package. The package identity is `dsh-whatsapp-connector`; its Cordis patch uses the `dsh-whatsapp-connector` integration identity.

## Licensing

This independent project is released under the MIT License and is not endorsed by Meta or WhatsApp. See [`LICENSE`](LICENSE), [`NOTICE.md`](NOTICE.md), and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for retained attribution and dependency licenses.
