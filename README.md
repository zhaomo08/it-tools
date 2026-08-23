<picture>
    <source srcset="./.github/logo-dark.png" media="(prefers-color-scheme: light)">
    <source srcset="./.github/logo-white.png" media="(prefers-color-scheme: dark)">
    <img src="./.github/logo-dark.png" alt="IT-Tools logo">
</picture>

<p align="center">
  为开发者和 IT 从业者准备的在线工具集，新增 AI 工具套件。<br/>
  A curated collection of handy online tools for developers and IT professionals — with an added AI toolset.
</p>

<p align="center">
  <a href="https://github.com/zhaomo08/it-tools/actions/workflows/ci.yml">
    <img src="https://github.com/zhaomo08/it-tools/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
  <a href="https://github.com/zhaomo08/it-tools/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-GPL--3.0-blue" alt="License: GPL-3.0" />
  </a>
</p>

---

## 关于本项目 / About

本仓库 fork 自 [CorentinTh/it-tools](https://github.com/CorentinTh/it-tools)，在保留原版全部工具的基础上做了两件事：

1. 新增一套专为 AI / LLM 工作流设计的工具（13 个，按工作流分为三个子分类）；
2. 从上游未合并的社区 PR 中挑选并移植高价值工具（上游 `main` 自 2024-09 起未再合入任何新工具）。

工具总数 **108 个**，全部纯前端运行。

This repository is a fork of [CorentinTh/it-tools](https://github.com/CorentinTh/it-tools). All original tools are preserved, plus a **13-tool AI toolset** for LLM workflows and a set of tools ported from unmerged upstream community PRs. **108 tools** in total, all client-side.

### AI 工具套件 / AI Toolset

每个 AI 工具页顶部都带「用法说明」——一句话说明它解决什么、三步操作、以及一条实际会踩的坑。

Every AI tool ships an inline usage note: what it solves, three steps, and one real-world gotcha.

#### AI · 成本与容量 / Cost & Capacity

| 工具 | 说明 |
|------|------|
| **LLM Token & Cost Calculator** | 本地估算 Prompt Token 数、缓存节省与调用成本 |
| **KV Cache Calculator** | 估算 Transformer KV Cache 显存占用与前缀缓存收益 |
| **LLM Context Planner** | 按组件规划上下文窗口（系统提示、RAG、历史、输出预留） |
| **RAG Text Chunker** | 按语义边界切块（支持重叠窗口），导出可直接嵌入的 JSONL |

#### AI · Prompt 工程 / Prompt Engineering

| 工具 | 说明 |
|------|------|
| **Prompt Variable Extractor** | 从模板中提取双花括号占位符并生成 JSON 样例 |
| **Prompt Template Renderer** | 用 JSON 变量渲染 Prompt 模板，高亮未解析占位符 |
| **JSONL Chat Builder** | 多行 Prompt 一键转为聊天补全 API 的 JSONL 批量请求 |
| **JSON Output Key Checker** | 校验模型 JSON 输出是否满足必填字段 |

#### AI · 接口与调试 / API & Debugging

| 工具 | 说明 |
|------|------|
| **LLM API Tester** | 校验 OpenAI 兼容接口的 base_url / api_key / model，并生成等价 curl |
| **LLM Stream Parser** | 把 OpenAI / Anthropic / Gemini 的 SSE 流还原成文本、工具参数与用量 |
| **Chat Message Converter** | OpenAI / Anthropic / Gemini 请求体互转，自动识别源格式 |
| **Tool Schema Converter** | function calling 工具定义三家互转，标出 Gemini 丢弃的 Schema 关键字 |
| **Structured Output Builder** | JSON 样例/Schema → 三家结构化输出配置，自动补齐 OpenAI strict 要求 |

### 从上游 PR 移植的工具 / Ported from Upstream PRs

上游有 300+ 个开放 PR 长期未合并，其中不少是完成度很高的工具。以下来自
[PR #1811](https://github.com/CorentinTh/it-tools/pull/1811)（作者 [@stevenlee87](https://github.com/stevenlee87)）：

| 工具 | 说明 |
|------|------|
| **cURL to Code** | cURL 命令转 Python / JS / Node / Go / PHP / Java / C# / Rust 代码 |
| **JSON to TypeScript/Go** | 从 JSON 样本生成 TypeScript 接口或 Go 结构体 |
| **HTML to Markdown** | HTML 转 Markdown |
| **CSS/JS Prettify & Minify** | CSS / JavaScript 格式化与压缩 |
| **Byte Unit Converter** | SI（1000）与 IEC（1024）字节单位互转 |
| **Date Calculator** | 推算几天前/后的日期，或计算两个日期相差天数 |
| **DNS Query** | 查询任意域名的 A / AAAA / CNAME / MX / TXT / NS / SOA 记录 |
| **SSL Certificate Parser** | 解析 PEM 证书，查看有效期、SAN、颁发者、公钥算法 |

移植时只取工具本体与必需的少量改动，丢弃了 PR 中夹带的 Cloudflare Worker 部署配置、
Service Worker 补丁和误提交的调试文件。

> **隐私提示**：`DNS Query` 是全站唯一会发起外部请求的工具（Cloudflare DoH 与 rdap.org）。
> 其余 107 个工具全部在浏览器本地运行。
>
> **Privacy**: `DNS Query` is the only tool that makes an outbound request. Everything else runs locally.

### 跟踪上游新工具 / Tracking Upstream Tools

```sh
node scripts/track-upstream-tools.mjs              # 列出上游 PR 里本仓库还没有的工具
node scripts/track-upstream-tools.mjs --self-check # 自检
```

脚本读取上游每个 PR 的实际改动文件（而非猜标题）来识别新增工具目录，与本地工具做差集。
结果按 `updatedAt` 增量缓存，首次约 3 分钟，之后约 5 秒。需要 [`gh`](https://cli.github.com/) CLI。

## 本地运行 / Local Development

```sh
# 安装依赖
pnpm install

# 开发模式（热重载）
pnpm dev

# 构建生产版本
pnpm build

# 运行单元测试
pnpm test

# Lint 检查
pnpm lint
```

## 创建新工具 / Create a New Tool

```sh
pnpm run script:create:tool my-tool-name
```

脚本会在 `src/tools/` 下生成模板文件并自动在 `src/tools/index.ts` 中添加导入。将其加入对应分类并开发即可。

The script generates boilerplate under `src/tools/` and adds the import to `src/tools/index.ts`. Add it to the correct category and start building.

## Self Host

```sh
# Docker Hub
docker run -d --name it-tools --restart unless-stopped -p 8080:80 corentinth/it-tools:latest

# GitHub Packages
docker run -d --name it-tools --restart unless-stopped -p 8080:80 ghcr.io/corentinth/it-tools:latest
```

## 推荐 IDE 配置 / IDE Setup

[VSCode](https://code.visualstudio.com/) + 以下扩展：

- [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)（禁用 Vetur）
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [i18n Ally](https://marketplace.visualstudio.com/items?itemName=lokalise.i18n-ally)

```json
{
  "editor.formatOnSave": false,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "i18n-ally.localesPaths": ["locales", "src/tools/*/locales"],
  "i18n-ally.keystyle": "nested"
}
```

## Credits

- 原项目由 [Corentin Thomasset](https://corentin.tech) 创建，遵循 GPL-3.0 协议开源。
- Original project created by [Corentin Thomasset](https://corentin.tech), licensed under GPL-3.0.
- AI 工具套件由本 fork 新增。/ AI toolset added in this fork.
- 部分工具移植自上游社区 PR，版权归原 PR 作者所有，同为 GPL-3.0。
  Some tools are ported from upstream community PRs and remain copyright of their original authors under GPL-3.0.
- 持续部署由 [Vercel](https://vercel.com) 提供。/ Continuously deployed via [Vercel](https://vercel.com).

## License

This project is under the [GNU GPLv3](LICENSE).
