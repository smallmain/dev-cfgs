<!-- <p align="center">
<img src="" style="width:100px;" />
</p> -->

<h1 align="center">
SmallMain's Development Scaffolding
</h1>

<p align="center">
SmallMain 使用的开发脚手架。
</p>

<!-- <br>
<p align="center">
<a href="https://unocss.dev/">Documentation</a> |
<a href="https://unocss.dev/play/">Playground</a>
</p>
<br> -->

<br>
<p align="center">
<a href="./README.md">English</a> |
<span>简体中文</span>
</p>

## 概览

<table>
  <tr>
    <th>技术</th><th>组件</th><th>最后更新</th>
  </tr>
  <tr>
    <td rowspan="3">-</td>
  </tr>
  <tr>
    <td><a href="#cli">CLI</a></td><td>2026.06.15</td>
  </tr>
  <tr>
    <td><a href="#editor-config">Editor Config</a></td><td>EditorConfig Specification v0.17.2; 2026.06.15</td>
  </tr>
  <tr>
    <td rowspan="6">Web</td>
  </tr>
  <tr>
    <td><a href="#web">VS Code Config</a></td><td>VS Code v1.124.2; 2026.06.15</td>
  </tr>
  <tr>
    <td><a href="#ts-config">TS Config</a></td><td>2025.06.15</td>
  </tr>
  <tr>
    <td><a href="#oxlint-config">Oxlint Config</a></td><td>2025.06.15</td>
  </tr>
  <tr>
    <td><a href="#oxfmt-config">Oxfmt Config</a></td><td>2025.06.15</td>
  </tr>
  <tr>
    <td><a href="#stylelint-config">Stylelint Config</a></td><td>2025.06.15</td>
  </tr>
</table>

## CLI

安装：

```bash
npm i -D @smallmains/dev
```

### create

```bash
npx sm create
```

`create` 会在当前工作目录生成文件，不会清空目录，但会覆盖同名文件。

### lint

预留命令，暂未实现。

## Editor Config

| 路径                           | 说明       |
| ------------------------------ | ---------- |
| `configs/common/.editorconfig` | 通用配置。 |

## TS Config

安装：

```bash
npm i -D @smallmains/dev
```

示例：

`tsconfig.json`

```jsonc
{
  "extends": "@smallmains/dev/ts/base.json",
  "include": ["src"],
}
```

| 路径                              | 说明                                           |
| --------------------------------- | ---------------------------------------------- |
| `@smallmains/dev/ts/base.json`    | 基础配置。                                     |
| `@smallmains/dev/ts/generic.json` | 非平台相关、使用 NodeNext 模块规范的通用配置。 |
| `@smallmains/dev/ts/cocos3.json`  | Cocos Creator v3.x 项目配置。                  |
| `@smallmains/dev/ts/nodejs.json`  | Node.js 项目配置。                             |

## VS Code Config

### Web

由 `sm create` 根据选择的技术栈和组件动态生成 `.vscode` 目录。基础配置推荐 EditorConfig 与 OXC；选择 `css` 组件时额外推荐 Stylelint 并生成 `stylelint.validate`。

## Oxlint Config

安装：

```bash
npm i -D @smallmains/dev
```

示例：

`oxlint.config.ts`

```ts
import { defineConfig } from "oxlint";
import generic, { vitest } from "@smallmains/dev/oxlint/generic.js";

export default defineConfig({
  extends: [generic, vitest],
});
```

所有配置均通过 `@smallmains/dev/oxlint/generic.js` 导出：

- `default`: 通用配置。
- `vitest`: 适用于使用 Vitest 的项目的配置。
- `react`: 适用于使用 React 的项目的配置。
- `nodejs`: 适用于使用 Node.js 的项目的配置。
- `security`: 适用于注重安全性的项目的配置。

## Oxfmt Config

安装：

```bash
npm i -D @smallmains/dev
```

示例：

`oxfmt.config.ts`

```ts
import generic from "@smallmains/dev/oxfmt/generic.js";

export default generic;
```

| 路径                               | 说明       |
| ---------------------------------- | ---------- |
| `@smallmains/dev/oxfmt/generic.js` | 通用配置。 |

## Stylelint Config

安装：

```bash
npm i -D @smallmains/dev
```

示例：

`stylelint.config.ts`

```ts
{
  "extends": "@smallmains/dev/stylelint/generic.js",
}
```

| 路径                                       | 说明                       |
| ------------------------------------------ | -------------------------- |
| `@smallmains/dev/stylelint/generic.js`     | 通用配置。                 |
| `@smallmains/dev/stylelint/css-modules.js` | 使用 CSS Modules 的配置。  |
| `@smallmains/dev/stylelint/tailwind.js`    | 使用 Tailwind CSS 的配置。 |

## 贡献

- 执行 `pnpm run dev` 从源码运行 CLI。
- 执行 `pnpm run dev:prod` 构建并从产物运行 CLI。
- 执行 `pnpm run build` 构建项目。
- 执行 `pnpm run publish` 构建并推送新版本。
  - `--version <version>`：指定版本号（例如 `patch`、`minor`、`major` 或具体版本号）。

## 许可证

[MIT @ SmallMain](./LICENSE)
