# Third-party notices

This project is the independent `dsh-whatsapp-connector` DeepSeek Harness integration and an MIT-licensed derivative of historical upstream [`@xmanrui/dsh-im`](https://github.com/xmanrui/dsh-im). The upstream source attribution and preserved MIT license text remain in [`LICENSE`](LICENSE); the active package, CLI, and plugin identity is `dsh-whatsapp-connector`. It does not bundle OpenClaw and is not endorsed by Meta or WhatsApp.

## Retained packages

The exact upstream license texts for retained bundled components are shipped in [`licenses/`](licenses/), alongside this notice. Filenames identify the package and SPDX license.

The retained direct packages are:

- [`@whiskeysockets/baileys` 7.0.0-rc14](https://github.com/WhiskeySockets/Baileys) — MIT License; copyright (c) 2025 Rajeh Taher/WhiskeySockets.
- [`qrcode` 1.5.4](https://github.com/soldair/node-qrcode) — MIT License; its installed `license` file is retained by the package distribution.
- [`esbuild` 0.25.9](https://github.com/evanw/esbuild) — MIT License; its installed `LICENSE.md` is retained by the package distribution.
- [`react` 18.3.1](https://github.com/facebook/react), [`react-dom` 18.3.1, and `react-test-renderer` 18.3.1](https://github.com/facebook/react) — MIT License; copyright (c) Facebook, Inc. and its affiliates.

Baileys retains these relevant transitive packages in `package-lock.json`: [`libsignal` 6.0.0](https://github.com/signalapp/libsignal) — GPL-3.0, copyright (C) 2007 Free Software Foundation, Inc.; [`protobufjs` 7.6.5](https://github.com/protobufjs/protobuf.js) and its `@protobufjs/*` support packages — BSD 3-Clause License, including copyright (c) 2016 Daniel Wirtz; and [`sharp` 0.35.4](https://github.com/lovell/sharp) — Apache-2.0. Sharp's retained platform packages (`@img/sharp-*` 0.35.4) include the bundled libvips variants (`@img/sharp-libvips-*` 1.3.3), licensed LGPL-3.0-or-later, as recorded in the lockfile. The lockfile's platform-specific optional variants are covered by these same package/license notices.

The WhatsApp channel uses Baileys for WhatsApp Web linked-device QR login and messaging. This is an unofficial WhatsApp Web integration; users should use a dedicated bot number and understand that WhatsApp protocol changes can require connector updates.

The WhatsApp mark uses path data published by [`Simple Icons`](https://github.com/simple-icons/simple-icons) under the CC0 1.0 Universal license. Product names and logos remain trademarks of their respective owners.

## MIT License

Copyright (c) 2025 Rajeh Taher/WhiskeySockets.

Copyright (c) Facebook, Inc. and its affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## protobufjs BSD 3-Clause License

Copyright (c) 2016, Daniel Wirtz. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

- Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
- Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
- Neither the name of its author nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## GPL-3.0 and LGPL-3.0-or-later

The retained `libsignal` package is GPL-3.0. The retained `sharp` package is Apache-2.0 and its bundled `@img/sharp-libvips-*` platform packages contain libvips under LGPL-3.0-or-later. The complete license texts shipped by these packages are available in the corresponding installed package `LICENSE` files and their package metadata/lockfile records.

## Apache License 2.0

Sharp and its retained `@img/sharp-*` native platform packages are distributed under the Apache License 2.0. The license text is available in the installed `sharp/LICENSE` file and package metadata.

## CC0 1.0 Universal

The Simple Icons path data is dedicated to the public domain under CC0 1.0 Universal. To the extent possible under law, the contributors have waived all copyright and related rights.
