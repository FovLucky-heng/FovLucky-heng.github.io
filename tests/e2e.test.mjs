/* =========================================================
   端到端检查：真 Chrome 打开 dist/ 的每一页，验证渲染与交互
   用法：node tests/e2e.test.mjs
   ========================================================= */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "../scripts/dev.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const PORT = 8199;
const CDP_PORT = 9334;
const BASE = `http://127.0.0.1:${PORT}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0;
const failures = [];
function check(name, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`PASS  ${name}`);
  } else {
    failures.push(`${name}${detail ? "  → " + detail : ""}`);
    console.log(`FAIL  ${name}${detail ? "  → " + detail : ""}`);
  }
}

/* ---------- 找浏览器 ---------- */
function findBrowser() {
  const candidates = {
    win32: [
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      "C:/Program Files/Microsoft/Edge/Application/msedge.exe"
    ],
    darwin: [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
    ],
    linux: ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"]
  };
  const list = [process.env.CHROME_PATH, ...(candidates[process.platform] || [])].filter(Boolean);
  return list.find((p) => existsSync(p));
}

const browser = findBrowser();
if (!browser) {
  console.log("SKIP  没有找到 Chrome/Edge，跳过浏览器测试");
  process.exit(0);
}

/* ---------- 启动服务与浏览器 ---------- */
const server = await startServer(join(ROOT, "dist"), PORT);
const profile = mkdtempSync(join(tmpdir(), "l5-e2e-"));
const chrome = spawn(
  browser,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    "about:blank"
  ],
  { stdio: "ignore" }
);

async function cleanup() {
  try {
    chrome.kill();
    if (process.platform === "win32") {
      spawn("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" });
    }
  } catch {}
  await sleep(150);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
  server?.close?.();
}

/* ---------- 连上 CDP ---------- */
async function target() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch {}
    await sleep(250);
  }
  throw new Error("连不上浏览器调试端口");
}

const tgt = await target();
const ws = new WebSocket(tgt.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let msgId = 0;
const pending = new Map();
const errors = [];
let current = "boot";

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    return;
  }
  if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params.exceptionDetails;
    errors.push(`[${current}] ${d.text} ${d.exception?.description || ""}`.trim());
  }
  if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
    errors.push(`[${current}] ${msg.params.entry.text}`);
  }
};

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(`${r.exceptionDetails.text} :: ${expression}`);
  return r.result.value;
}

async function goto(path) {
  current = path;
  await send("Page.navigate", { url: BASE + path });
  await sleep(650);
}

await send("Page.enable");
/* headless 默认上报 prefers-reduced-motion: reduce，这里显式切到 no-preference，
   否则动画分支会被跳过（reduce 下的表现另有无障碍用例单独验证） */
await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "no-preference" }]
});
await send("Runtime.enable");
await send("Log.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false
});

/* ================= 首页 ================= */
await goto("/index.html");
check("首页 5 个线路站点", (await evaluate(`document.querySelectorAll('.route__stop').length`)) === 5);
check("首页 20 张文章卡（预渲染）", (await evaluate(`document.querySelectorAll('#latestGrid .article-card').length`)) === 20);
check("首页 5 个工具卡", (await evaluate(`document.querySelectorAll('.tool-card').length`)) === 5);
check("首页 5 件小事", (await evaluate(`document.querySelectorAll('#dailyList [data-daily]').length`)) === 5);
check("首页内容不依赖 JS（已在 HTML 中）", (await evaluate(`document.querySelector('#latestGrid').children.length > 0`)));

// 打卡
await evaluate(`document.querySelector('[data-daily="eat"]').click()`);
await sleep(150);
check("打卡按钮状态更新", (await evaluate(`document.querySelector('[data-daily="eat"]').getAttribute('aria-pressed')`)) === "true");
check("进度文案 1/5", (await evaluate(`document.querySelector('#dailyProgress').textContent`)).includes("1/5"));
check("打卡写入 localStorage", (await evaluate(`localStorage.getItem('l5.daily')`)).includes("eat"));

// 筛选
await evaluate(`document.querySelector('[data-filter="mind"]').click()`);
await sleep(200);
check("筛选「不蕉绿」只剩 4 张", (await evaluate(`document.querySelectorAll('#latestGrid .article-card:not([hidden])').length`)) === 4);
check("筛选后卡片可见（不是透明）", (await evaluate(`getComputedStyle(document.querySelector('#latestGrid .article-card:not([hidden])')).opacity`)) === "1");
await evaluate(`document.querySelector('[data-filter="all"]').click()`);
await sleep(150);
check("筛选「全部」回到默认 8 张", (await evaluate(`document.querySelectorAll('#latestGrid .article-card:not([hidden])').length`)) === 8);

// 展开 / 收起
await evaluate(`document.querySelector('#latestMore').click()`);
await sleep(220);
check("查看全部展开到 20 篇", (await evaluate(`document.querySelectorAll('#latestGrid .article-card:not([hidden])').length`)) === 20);
check("按钮切换为收起", (await evaluate(`document.querySelector('#latestMore').textContent`)).includes("收起"));
await evaluate(`document.querySelector('#latestMore').click()`);
await sleep(180);
check("收起后回到 8 篇", (await evaluate(`document.querySelectorAll('#latestGrid .article-card:not([hidden])').length`)) === 8);

/* ================= 五个栏目页 ================= */
const channels = [
  ["eat", "健康吃"],
  ["wear", "随心穿"],
  ["mind", "不蕉绿"],
  ["move", "开心练"],
  ["money", "智慧投"]
];
for (const [id, name] of channels) {
  await goto(`/${id}.html`);
  const title = await evaluate(`document.querySelector('.channel-hero__title').textContent`);
  const arts = await evaluate(`document.querySelectorAll('#channelArticles .article-card').length`);
  const tags = await evaluate(`document.querySelectorAll('#channelTags [data-tag]').length`);
  const tools = await evaluate(`document.querySelectorAll('.tool-card').length`);
  check(`${name} 页渲染完整`, !!title && arts === 4 && tags === 6 && tools === 3, `arts=${arts} tags=${tags} tools=${tools}`);

  await evaluate(`document.querySelectorAll('#channelTags [data-tag]')[2].click()`);
  await sleep(150);
  const visible = await evaluate(`document.querySelectorAll('#channelArticles .article-card:not([hidden])').length`);
  check(`${name} 分类筛选生效`, visible >= 1 && visible <= 4, `visible=${visible}`);

  if (id === "wear") {
    await evaluate(`document.querySelector('[data-action]').click()`);
    await sleep(120);
    check("栏目小行动可打卡", (await evaluate(`document.querySelector('[data-action]').getAttribute('aria-pressed')`)) === "true");
  }
}

/* ================= 文章页 ================= */
await goto("/article/mind-1min.html");
check("文章标题正确", (await evaluate(`document.querySelector('.article-head__title').textContent`)).includes("焦虑的时候"));
check("文章正文已预渲染", (await evaluate(`document.querySelectorAll('.article-body h2').length`)) >= 3);
check("相关文章 3 篇", (await evaluate(`document.querySelectorAll('.article-card').length`)) === 3);
check("JSON-LD 存在", (await evaluate(`!!document.querySelector('script[type="application/ld+json"]')`)));

await evaluate(`document.querySelector('[data-fav]').click()`);
await sleep(150);
check("收藏按钮状态", (await evaluate(`document.querySelector('[data-fav]').getAttribute('aria-pressed')`)) === "true");
check("收藏写入 localStorage", (await evaluate(`localStorage.getItem('l5.favs')`)).includes("mind-1min"));

/* ================= 工具库 ================= */
await goto("/tools.html?tool=recipe");
check("工具库 15 个入口", (await evaluate(`document.querySelectorAll('[data-tool]').length`)) === 15);
check("食谱 7 天", (await evaluate(`document.querySelectorAll('#recipeGrid .day-card').length`)) === 7);
await evaluate(`document.querySelectorAll('[data-reroll]')[0].click()`);
await sleep(120);
check("换一组可用", (await evaluate(`document.querySelectorAll('#recipeGrid .day-card').length`)) === 7);

await goto("/tools.html?tool=budget");
await evaluate(`const i=document.querySelector('#bIncome'); i.value=20000; i.dispatchEvent(new Event('input'))`);
await sleep(150);
check("预算按收入重算", (await evaluate(`document.querySelector('#bOut').textContent`)).includes("10,000"));

await goto("/tools.html?tool=breath");
await evaluate(`document.querySelector('#bGo').click()`);
await sleep(1100);
check("呼吸练习启动", (await evaluate(`document.querySelector('#bLabel').textContent`)).includes("吸气"));
await evaluate(`document.querySelector('#bReset').click()`);
await sleep(120);
check("呼吸练习重置", (await evaluate(`document.querySelector('#bTime').textContent`)) === "03:00");

await goto("/tools.html?tool=ledger");
await evaluate(`
  document.querySelector('#lgAmt').value = 32.5;
  document.querySelector('#lgNote').value = '午饭';
  document.querySelector('#lgAdd').click();
`);
await sleep(180);
check("记账计入本月合计", (await evaluate(`document.querySelector('#lgTotal').textContent`)) === "¥32.5");

await goto("/tools.html?tool=challenge");
await evaluate(`document.querySelector('[data-day="0"]').click()`);
await sleep(150);
check("7 天挑战可打卡", (await evaluate(`document.querySelector('#chCount').textContent`)).includes("1 / 7"));

await goto("/tools.html?tool=mood");
await evaluate(`
  document.querySelectorAll('#tmRow [data-mood]')[1].click();
  document.querySelector('#tmScene').value = '开会后';
  document.querySelector('#tmSave').click();
`);
await sleep(180);
check("情绪记录保存", (await evaluate(`document.querySelector('#tmList').textContent`)).includes("开会后"));

/* ================= 打卡页 ================= */
await goto("/checkin.html");
check("打卡页 7 天日历", (await evaluate(`document.querySelectorAll('.week__day').length`)) === 7);
check("打卡页 5 件小事", (await evaluate(`document.querySelectorAll('#dailyList [data-daily]').length`)) === 5);
check("打卡状态跨页延续", (await evaluate(`document.querySelectorAll('#dailyList [aria-pressed="true"]').length`)) === 2);
await evaluate(`document.querySelectorAll('[data-mood]')[2].click()`);
await sleep(150);
check("心情写入 localStorage", (await evaluate(`localStorage.getItem('l5.moods')`)).includes("rainy"));
check("连续打卡天数 ≥ 1", (await evaluate(`document.querySelector('.streak b').textContent`)).trim() === "1");

// 勾选后 7 天格子与统计即时同步
await evaluate(`document.querySelectorAll('#dailyList [data-daily]')[2].click()`);
await sleep(220);
const pressed = await evaluate(`document.querySelectorAll('#dailyList [aria-pressed="true"]').length`);
const dot = (await evaluate(`document.querySelector('.week__day.is-today .week__dot').textContent`)).trim();
check("7 天格子随打卡即时同步", dot === String(pressed), `dot=${dot} pressed=${pressed}`);

/* ================= 我的 ================= */
await goto("/me.html");
check("我的：收藏数 1", (await evaluate(`document.querySelectorAll('.stat-bar__num')[2].dataset.count`)) === "1");
check("我的：收藏卡渲染", (await evaluate(`document.querySelectorAll('#favGrid .article-card').length`)) === 1);
check("我的：心情记录出现", (await evaluate(`document.querySelector('main').textContent`)).includes("心情天气"));

/* ================= 关于 / 404 ================= */
await goto("/about.html");
const about = await evaluate(`document.querySelector('main').textContent`);
check("声明：心理", about.includes("不构成医疗诊断"));
check("声明：理财", about.includes("不构成投资建议"));
check("声明：隐私", about.includes("localStorage"));

current = "/no-such-page.html"; // 这一步故意访问不存在的地址，404 不计为错误
await send("Page.navigate", { url: BASE + "/no-such-page.html" });
await sleep(500);
check("未知路径返回 404 页面", (await evaluate(`document.body.textContent`)).includes("这一站还没开通"));

/* ================= 移动端 ================= */
await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true
});
await goto("/index.html");
const cw = await evaluate(`document.documentElement.clientWidth`);
const sw = await evaluate(`document.documentElement.scrollWidth`);
check("390px 无横向溢出", sw <= cw + 1, `client=${cw} scroll=${sw}`);
check("390px 显示底部导航", (await evaluate(`getComputedStyle(document.querySelector('.tabbar')).display`)) === "flex");
check("390px 隐藏顶部链接", (await evaluate(`getComputedStyle(document.querySelector('.nav__links')).display`)) === "none");

/* ================= 无 JS 兜底 ================= */
await send("Emulation.setScriptExecutionDisabled", { value: true });
await goto("/index.html");
const noJs = await evaluate(`document.body.textContent`);
check("无 JS 时首页仍有内容", noJs.includes("今天想从哪一站上车") && noJs.includes("健康吃"));
check("无 JS 时文章卡仍在", (await evaluate(`document.querySelectorAll('#latestGrid .article-card').length`)) === 20);
await goto("/article/eat-10min.html");
check("无 JS 时文章正文可读", (await evaluate(`document.querySelector('main').textContent`)).includes("快手菜的关键不是"));
await goto("/index.html");
check("无 JS 时内容真实可见（不是只有 DOM）", (await evaluate(`
  Array.from(document.querySelectorAll(".reveal")).every((el) => Number(getComputedStyle(el).opacity) > 0.95)
`)));
check("无 JS 时工具卡可见", (await evaluate(`
  Array.from(document.querySelectorAll(".tool-card")).every((el) => Number(getComputedStyle(el).opacity) > 0.95)
`)));
await send("Emulation.setScriptExecutionDisabled", { value: false });


/* ================= 新增：线路图 / 工具抽屉 / 计数 / 进度条 ================= */
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await goto("/index.html");
check("线路图有连线和站点", (await evaluate(`document.querySelectorAll('.route__stop').length`)) === 5 &&
  (await evaluate(`getComputedStyle(document.querySelector('.route'), '::before').transform !== 'none'`)));
await sleep(1000); // 站点圆点有错峰延迟（--i × 90ms），等动画结束再断言
check("线路图站点进入后可见", (await evaluate(`Array.from(document.querySelectorAll('.route__dot')).every(d => Number(getComputedStyle(d).opacity) > 0.9)`)));
check("编号眉标存在", (await evaluate(`document.querySelectorAll('.eyebrow__num').length`)) === 4);
check("工具区是横滑轨道", (await evaluate(`!!document.querySelector('.tool-rail')`)));
check("阅读进度条已注入", (await evaluate(`!!document.querySelector('.scroll-progress')`)));

/* 我的：计数从 0 滚到目标 */
await goto("/me.html");
check("统计条三格", (await evaluate(`document.querySelectorAll('.stat-bar__num').length`)) === 3);
await sleep(1200);
check("计数动画落到目标值", (await evaluate(`
  (() => {
    const els = Array.from(document.querySelectorAll('.stat-bar__num'));
    return els.every((el) => el.textContent === el.dataset.count);
  })()
`)));

/* 工具库：抽屉（手机） */
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await goto("/tools.html");
check("手机工具库为紧凑行", (await evaluate(`document.querySelectorAll('.tool-row').length`)) === 15);
await evaluate(`document.querySelector('[data-tool="recipe"]').click()`);
await sleep(500);
check("手机点工具弹出抽屉", (await evaluate(`document.querySelector('#toolPanelWrap').classList.contains('is-open')`)));
check("抽屉固定在视口内", (await evaluate(`
  (() => { const w = document.querySelector('#toolPanelWrap');
    return getComputedStyle(w).position === "fixed" && w.getBoundingClientRect().height > 300; })()
`)));
check("抽屉打开时锁滚动", (await evaluate(`document.body.style.overflow`)) === "hidden");
check("抽屉内工具渲染", (await evaluate(`document.querySelectorAll('#recipeGrid .day-card').length`)) === 7);
await evaluate(`document.querySelector('#toolClose').click()`);
await sleep(300);
check("关闭后恢复滚动", (await evaluate(`document.body.style.overflow`)) === "" &&
  (await evaluate(`document.querySelector('#toolPanelWrap').innerHTML.trim().length`)) === 0);

/* 手机端 .wrap 内边距没有被 .section 覆盖（回归防线） */
await goto("/me.html");
check("我的页有横向内边距", (await evaluate(`
  (() => { const el = document.querySelector('#meRoot > div');
    return parseFloat(getComputedStyle(el).paddingLeft) >= 20; })()
`)));
await goto("/tools.html");
check("工具页有横向内边距", (await evaluate(`
  (() => { const el = document.querySelector('.wrap');
    return parseFloat(getComputedStyle(el).paddingLeft) >= 20; })()
`)));

/* 还原桌面尺寸，供后续用例 */
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
/* ================= 无障碍：减少动效模式下内容仍完整 ================= */
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await goto("/index.html");
check("减少动效：首页内容可见", (await evaluate(`document.querySelectorAll('.route__stop').length`)) === 5 &&
  (await evaluate(`Array.from(document.querySelectorAll('.route__dot')).every(d => Number(getComputedStyle(d).opacity) > 0.9)`)));
check("减少动效：不注入进度条", (await evaluate(`!document.querySelector('.scroll-progress')`)));
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
/* ================= 汇总 ================= */
const uniqueErrors = [...new Set(errors)].filter((e) => !e.includes("no-such-page"));
check("运行时零错误", uniqueErrors.length === 0, uniqueErrors.slice(0, 3).join(" | "));

console.log(`\n端到端检查：通过 ${pass}，失败 ${failures.length}，运行时错误 ${uniqueErrors.length}`);
if (uniqueErrors.length) uniqueErrors.slice(0, 8).forEach((e) => console.log("  ! " + e));

await cleanup();
process.exit(failures.length || uniqueErrors.length ? 1 : 0);
