# 生活五号线

把生活，调回喜欢的频道。一个轻量的生活方式成长网站：**健康吃 · 随心穿 · 不蕉绿 · 开心练 · 智慧投**。

[![Deploy](https://github.com/FovLucky-heng/life-line-5/actions/workflows/deploy.yml/badge.svg)](https://github.com/FovLucky-heng/life-line-5/actions/workflows/deploy.yml)

**线上：<https://fovlucky-heng.github.io/life-line-5/>**

静态站点，零运行时依赖、零框架。源码在 `src/`，构建产物在 `dist/`，构建脚本只用 Node 内置模块。

---

## 快速开始

```powershell
npm run dev      # 构建 + 起本地服务 + 监听 src 变化，默认 http://127.0.0.1:8123/
npm run build    # 只构建，产出 dist/
npm test         # 构建检查 + 真浏览器端到端检查
```

不需要 `npm install` —— 没有任何第三方依赖（`package.json` 里的 scripts 全部是 `node xxx.mjs`）。

部署：把 `dist/` 整个目录上传到任意静态托管（GitHub Pages / Vercel / Netlify / 对象存储 / Nginx）即可，无构建钩子要求。

**线上地址：<https://fovlucky-heng.github.io/life-line-5/>**

站内链接是**相对路径**（`assets/…`、`../assets/…`），所以放在域名根、子路径、甚至本地任意目录都能跑，不需要改代码。唯一例外是 `404.html`——GitHub Pages 会用它响应任意深度的地址，因此那一个页面用站点根路径，前缀来自 `scripts/site.config.mjs` 的 `base`。

### GitHub Pages 自动部署

推送到 `main` 就会触发 `.github/workflows/deploy.yml`：构建 → 自检 → 发布。首次启用只需在仓库 `Settings → Pages → Source` 选 **GitHub Actions**（本仓库已用 CLI 配好）。

换域名 / 改仓库名时，同步改 `scripts/site.config.mjs` 的 `url` 和 `base`（`base` 只影响 404 页），然后重新构建。

> ⚠️ 站点使用**根路径链接**（`/assets/…`、`/article/…`），所以要通过 HTTP 服务从域名根目录访问，不能用 `file://` 直接双击打开。`npm run dev` 已经处理好了。

---

## 目录结构

```text
.
├─ src/                         ← 源码（唯一需要手工编辑的地方）
│  ├─ partials/                 页面外壳：head / nav / footer / tabbar / shell
│  ├─ pages/                    各页面的 <main> 内容模板（含 {{占位符}}）
│  ├─ data/
│  │  ├─ site.js                品牌、每日五件小事、心情天气
│  │  ├─ channels.js            五个栏目的元信息 + 栏目工具目录
│  │  └─ articles/<id>.js       每个栏目的文章（正文块结构）
│  ├─ styles/                   tokens / base / layout / components / pages / utilities
│  ├─ scripts/
│  │  ├─ core/                  命名空间、存储、日期、DOM、目录、收藏、打卡、心情、动画
│  │  ├─ ui/                    导航高亮、卡片模板、每日打卡组件
│  │  ├─ pages/                 每个页面的增强脚本（home / channel / article / checkin / me）
│  │  ├─ tools/                 工具注册表 + 每个栏目一个工具模块
│  │  └─ main.js                启动分发
│  └─ assets/favicon.svg
├─ scripts/
│  ├─ build.mjs                 src → dist（≈400 行）
│  ├─ dev.mjs                   静态服务 + 监听重建（可复用给测试）
│  ├─ site.config.mjs           站点域名等，影响 canonical / sitemap
│  └─ lib/render.mjs            构建期 HTML 片段渲染
├─ tests/
│  ├─ build.test.mjs            产物完整性 / 内部链接 / SEO / 模块依赖
│  └─ e2e.test.mjs              真 Chrome 跑交互、移动端、无 JS 兜底
└─ dist/                        构建产物（生成物，不要手改）
```

---

## 为什么要加一层构建

重构前是 11 个手写 HTML + 3 个巨型 JS/CSS 文件。具体问题和解法：

| 问题 | 现在 |
| --- | --- |
| 导航 / 页脚 / 底部栏在 11 个文件里各写一遍（改一处要改 11 处） | 只在 `src/partials/` 写一次，构建时注入 |
| 20 篇文章靠 `?a=slug` + JS 渲染，SEO 抓不到、无 JS 看不到 | 每篇预渲染成 `/article/<slug>.html`，正文直接在 HTML 里 |
| 每页 title / description 手写，容易漏和重 | 由数据生成，`tests` 校验不重复、不缺失 |
| `app.js`（657 行）什么都管，`tools.js`（925 行）15 个工具挤在一起 | 拆成 core / ui / pages / tools 共 26 个模块，按页拆 bundle |
| 一个 1439 行的 `style.css` | 按 `@layer` 分成 6 层，构建时合并成一个文件（仍是单请求） |
| 内容、配置、模板混在 `data.js` | `data/` 下按职责拆开，加文章只改一个文件 |
| 没有回归测试 | 21 项构建检查 + 56 项浏览器检查 |

构建产物依旧**没有任何运行时框架**：浏览器拿到的还是纯 HTML + CSS + 少量 vanilla JS。

---

## 改东西的时候去哪

| 想改什么 | 改哪里 |
| --- | --- |
| 加 / 改一篇文章 | `src/data/articles/<栏目>.js`，存成 `{ slug, title, tag, excerpt, minutes, blocks: [...] }` |
| 加一个栏目 | `src/data/channels.js`（颜色、主张、工具）→ 加 `src/data/articles/<新id>.js` → 构建自动出页面 |
| 改导航 / 页脚 / 底部栏 | `src/partials/nav.html`、`footer.html`、`tabbar.html` |
| 改首页某个区块 | `src/pages/home.html`（结构）+ `src/pages/../scripts/pages/home.js`（交互） |
| 改配色 / 圆角 / 字体 | `src/styles/tokens.css` |
| 改组件样式 | `src/styles/components.css`（卡片、按钮、清单…） |
| 加一个工具 | `src/data/channels.js` 里登记目录 → `src/scripts/tools/<栏目>.js` 里加 `L5.tools.register({ id: { channel, name, desc, render } })` |
| 改站点域名（canonical / sitemap） | `scripts/site.config.mjs` |
| 改文章正文的渲染规则 | `scripts/lib/render.mjs` 的 `articleBody()` |

加完记得 `npm run build`（`npm run dev` 会自动重建）。

---

## 内容模型

```js
{
  slug: "mind-1min",            // 决定 URL：/article/mind-1min.html
  title: "焦虑的时候，先做这 1 分钟",
  tag: "呼吸练习",               // 对应栏目 tags 里的分类
  excerpt: "……",                // 列表卡片 + meta description
  minutes: 4,
  blocks: [                      // 结构化正文，渲染成 h2 / p / ul / 提示块
    { t: "p",  c: "段落" },
    { t: "h2", c: "小标题" },
    { t: "ul", c: ["条目", "条目"] },
    { t: "tip", c: "小提示" },
    { t: "quote", c: "引用" }
  ]
}
```

---

## 脚本如何组织

浏览器里只有一个全局命名空间 `window.L5`：

```text
core/namespace.js   建立 L5 与 L5.pages / L5.tools 注册表
core/*.js           分别 Object.assign 挂上 store、ymd、esc、favs、isDone…
ui/*.js             组件级逻辑（导航高亮、卡片模板、每日打卡）
pages/*.js          L5.pages.home = run 这样的页面入口
tools/*.js          L5.tools.register({ recipe: {...}, ... })
main.js             按 body[data-page] 调 L5.pages[page]
```

模块之间只通过 `const { xxx } = L5;` 取依赖，构建时按固定顺序拼接成一个 `core.js`，页面各自再加载自己的 bundle。

`tests/build.test.mjs` 里有一项专门检查"模块用到了却没解构的 API"，防止这类低级运行时崩溃。

---

## 产物

一次构建（约 200ms）：

```text
31 个页面（首页 1 + 栏目 5 + 文章 20 + 工具 / 打卡 / 我的 / 关于 / 404）
9 个 JS bundle：data / core / home / channel / article / tools / checkin / me / main
1 个 CSS（6 个 @layer 合并）
sitemap.xml · robots.txt · favicon
```

按页拆 bundle：首页不会加载 38KB 的工具库，工具库也不会加载打卡逻辑。文章页的正文是静态 HTML，JS 只负责收藏按钮。

---

## 测试

```powershell
npm test
```

**`tests/build.test.mjs`（21 项）**：页面齐全、无残留 `{{占位符}}`、每页 title/description/canonical、标题不重复、**所有内部链接可达**、bundle 非空、CSS 分层、sitemap 覆盖 30 个 URL、文章 JSON-LD、外壳只存在一份、模块依赖自洽。

**`tests/e2e.test.mjs`（56 项）**：起服务 + 真 Chrome，跑

- 首页 / 5 个栏目 / 文章 / 工具 15 个入口的渲染与筛选、打卡、收藏、记账、预算、呼吸、挑战、心情的交互与 localStorage 持久化
- 390px 移动端无横向溢出、底部导航切换
- **禁用 JS 后内容仍可见**（预渲染的意义）
- 运行时零 console 错误

没有 Chrome 时 e2e 会打印 `SKIP` 并跳过，方便在无浏览器环境跑构建检查。

---

## 数据与隐私

打卡、收藏、心情、记账、预算、清单勾选全部存在浏览器 `localStorage`（键前缀 `l5.`）。没有后端、没有账号、不收集信息。「我的」页面可一键清除。

---

## 内容与合规

站内已内置四类声明（`src/pages/about.html`）：心理（非诊断、给求助路径）、理财（非投资建议、反诈指引）、饮食、运动。栏目页与文章页底部会自动带出对应短声明。

---

## 相较 v1 的变化

- 手写 11 个页面 → 模板 + 构建，外壳只维护一份
- 20 篇文章从 JS 渲染 → 预渲染静态页（SEO、无 JS、首屏更快）
- 3 个巨型文件 → 26 个按职责划分的模块
- 单文件 CSS → 6 个 `@layer` 源文件
- 新增 `sitemap.xml`、`robots.txt`、文章 JSON-LD、404 页面、跳转链接（无障碍）
- 新增 77 项自动检查

## 浏览器支持

Chrome / Edge / Safari / Firefox 近两年版本。用到 `color-mix()`、`backdrop-filter`、`@layer`、IntersectionObserver；`color-mix()` 不支持时背景会退化为透明，不会报错。
