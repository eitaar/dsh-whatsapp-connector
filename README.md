# DSH WhatsApp Connector

这是一个基于 [`@xmanrui/dsh-im`](https://github.com/xmanrui/dsh-im) 的 MIT 衍生项目，由 `eitaar` 维护，为 DeepSeek Harness 接入 WhatsApp Web，并在生成回答时以 **5,000 毫秒**间隔编辑同一条消息显示流式进度。上游署名和第三方许可保留在 [`LICENSE`](LICENSE)、[`NOTICE.md`](NOTICE.md) 与 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。

<p align="center">
  <img src="assets/logo-dsh-whatsapp-connector-connecting-readme-3x2.png" alt="连接 DeepSeek Harness" width="420" height="280">
  <img src="assets/logo-plugin-phone.png" alt="dsh-whatsapp-connector 手机标志" width="280" height="280">
</p>

## WhatsApp 接入

使用手机 WhatsApp 扫描二维码关联设备。连接器通过 Baileys 使用 WhatsApp Web，支持已读回执和“正在输入”状态，并在 Harness 生成回答时每 **5,000 毫秒**编辑一次进度消息。默认访问策略为**仅自己**，只接受已绑定账号的自聊；**指定联系人**模式额外接受电话号码白名单中的私聊；**开放响应**模式接受私聊及允许的群聊、提及和回复。未授权消息会被静默忽略。

机器人支持 Harness 会话、工作区、Agent Preset、模型和推理等级、批量输入、交互式问题、审批、文件回传，以及 `/help`、`/new`、`/status`、`/version`、`/models`、`/model`、`/reasoning`、`/preset`、`/stop`、`/steer`、`/batch`、`/send`、`/cancel`、`/compact`、`/workspace`、`/workspacelist`、`/sessionlist` 和 `/session` 等命令。机器人消息默认使用中文；设置 `language: en` 或 `DSH_WHATSAPP_CONNECTOR_LANGUAGE=en` 后使用英文，包括流式状态 `Processing…`。

## 安装

安装已发布的稳定版本，或直接从 GitHub 安装插件：

```sh
npx -y github:eitaar/dsh-whatsapp-connector install
```

从 checkout 安装：

```sh
node bin/dsh-whatsapp-connector.mjs install --source .
```

插件、CLI 和包身份均为 `dsh-whatsapp-connector`，运行时存储根目录为 `~/.dsh/integrations/dsh-whatsapp-connector/`。请单独配置新的连接器；如果检测到现有 `~/.dsh/integrations/dsh-whatsapp/`，请自行选择保留、停用或移除旧安装。这里只会提示迁移：不会自动复制、删除或覆盖其中任何内容。历史上游包 [`@xmanrui/dsh-im`](https://github.com/xmanrui/dsh-im) 仅用于来源归属；不要将其作为本连接器的安装目标。

重启 `dsh web`、刷新浏览器，然后打开「设置 → WhatsApp Connector」并扫描 WhatsApp 二维码。升级会保留已有凭据、工作区、Agent Preset 和 Session 绑定。Secret 与关联设备状态只保存在本机受保护的凭据/运行时存储中，状态和机器人列表接口不会返回它们。

## 本地开发

```sh
npm install
npm run check
node bin/dsh-whatsapp-connector.mjs install --source .
```

`npm run check` 会运行测试、构建 Host 与 Client 产物，并校验发布包。包身份为 `dsh-whatsapp-connector`，Cordis patch 使用 `dsh-whatsapp-connector` 集成身份。

## 许可证

本独立项目采用 MIT License 发布，且不代表 Meta 或 WhatsApp。请参阅 [`LICENSE`](LICENSE)、[`NOTICE.md`](NOTICE.md) 和 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) 中保留的署名与依赖许可证信息。
