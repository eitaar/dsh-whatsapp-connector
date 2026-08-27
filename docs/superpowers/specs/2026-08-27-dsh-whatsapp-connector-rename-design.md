# dsh-whatsapp-connector Full Rename Design

## Goal

Turn the WhatsApp-only fork into a genuinely distinct DSH plugin named `dsh-whatsapp-connector`, rather than a repository fork that still identifies itself as `dsh-im`.

## Scope

- Rename the active npm package, CLI, Cordis/plugin identity, client loader identity, settings-section identity, bundle/style identifiers, verifier messages, and user-facing documentation to `dsh-whatsapp-connector`.
- Keep the repository at `eitaar/dsh-whatsapp-connector`.
- Keep the existing WhatsApp streaming behavior, shared Harness/session infrastructure, native mentions, overflow delivery, and 5,000 ms edit interval unchanged.
- Use a new integration namespace at `~/.dsh/integrations/dsh-whatsapp-connector/`.
- Detect the legacy `~/.dsh/integrations/dsh-whatsapp/` namespace and provide migration guidance without overwriting, deleting, or modifying it.
- Do not modify the currently installed plugin under `/home/ubuntu/.dsh` during implementation.
- Preserve upstream MIT attribution for the project’s `@xmanrui/dsh-im` origin in `LICENSE`, `NOTICE.md`, and applicable third-party notices; that historical attribution is not an active plugin identity.

## Active Identity Contract

The following values become the new active identity:

| Surface | New value |
|---|---|
| Package name | `dsh-whatsapp-connector` |
| CLI command | `dsh-whatsapp-connector` |
| Cordis patch id/name | `dsh-whatsapp-connector` |
| Client loader id | `dsh-whatsapp-connector` |
| Settings section id | `dsh-whatsapp-connector` |
| Integration data root | `~/.dsh/integrations/dsh-whatsapp-connector/` |
| Default GitHub source | `github:eitaar/dsh-whatsapp-connector` |

Active runtime code must not register `@xmanrui/dsh-im` or `xmanrui-dsh-im`. The old name may appear only in explicit historical attribution or migration guidance.

DSH host API packages under `@deepseek-ai/dsh-*` are host-provided dependencies and are not part of this plugin rename.

## Components and Data Flow

1. `package.json` publishes `dsh-whatsapp-connector`, exposes the `dsh-whatsapp-connector` binary, and retains the existing GitHub repository metadata.
2. `bin/dsh-whatsapp-connector.mjs` installs/uninstalls the new plugin identity and points its default source at `github:eitaar/dsh-whatsapp-connector`.
3. `cordis.patch.yml` activates exactly `dsh-whatsapp-connector`.
4. `plugin-src/client/build.mjs`, `plugin-src/client/index.js`, client styles, and generated `lib/client.js` use the new loader/settings/style identity.
5. `plugin-src/host/index.mjs`, host logging, artifact labels, and generated `lib/index.js` use the new runtime identity while retaining the WhatsApp-only channel registration.
6. `plugin-src/host/channels/whatsapp/production.mjs` defaults to the new integration root and keeps the existing per-bot auth/state layout beneath it.
7. On installation, legacy-root detection reports that old `dsh-im`/`dsh-whatsapp` data exists and explains how to configure the new plugin. It never copies, deletes, or rewrites legacy data automatically.
8. The old installed plugin remains independent; the new plugin is a separate DSH registration and should use a separately configured WhatsApp account unless the operator intentionally migrates/stops the old one.

## Migration and Error Handling

- Missing new configuration behaves as a fresh installation and requests normal WhatsApp setup/QR linking.
- Legacy data is detected by path existence only; detection must not read or expose credentials in logs.
- The installer prints a concise migration warning and exits successfully when appropriate; it does not silently claim that old configuration is active.
- Invalid new plugin configuration continues to use existing validation and error codes, with `dsh-whatsapp-connector` in user-facing messages.
- No compatibility alias is registered under the old active Cordis ID, preventing duplicate or ambiguous DSH registration.

## Testing and Verification

- Add failing tests before implementation for package/bin/Cordis/loader/settings/storage identity and for absence of old active registration markers.
- Add failing tests for legacy-root detection and non-destructive migration guidance using isolated temporary directories.
- Rebuild both Host and Client bundles and assert generated artifacts contain the new identity and only WhatsApp registration.
- Run the full test suite, package verifier, and `npm pack --dry-run`.
- Verify the tarball contains the new binary/package identity, bundled license files, no runtime/auth state, and no `node_modules`.
- Run `git diff --check` and review all remaining `dsh-im` references, allowing only explicit historical attribution or migration guidance.

## Rollout

- Implement and test on the existing `refactor/whatsapp-only` branch, then update its GitHub PR.
- Do not install or enable the renamed plugin in `/home/ubuntu/.dsh` automatically.
- After review/merge, installation uses:

```bash
npx -y github:eitaar/dsh-whatsapp-connector install
```

- Existing `dsh-im` installations are left intact until the operator explicitly chooses whether to keep, disable, or remove them.
