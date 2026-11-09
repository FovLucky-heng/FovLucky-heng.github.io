import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIST = "D:/enjoylife/dist";
const files = [];
(function walk(dir, prefix = "") {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(join(dir, e.name), prefix + e.name + "/");
    else if (e.name.endsWith(".html")) files.push(prefix + e.name);
  }
})(DIST);

const abs = [];
for (const f of files) {
  const html = readFileSync(join(DIST, f), "utf8");
  const hits = html.match(/(?:href|src)="\/[^"]*"/g) || [];
  if (hits.length) abs.push([f, hits.length, hits.slice(0, 3)]);
}

console.log("绝对站内链接：");
if (!abs.length) console.log("  无");
for (const [f, n, sample] of abs) console.log(`  ${f.padEnd(30)} ${n} 处  ${sample.join(" ")}`);

const sample = (f) => {
  const html = readFileSync(join(DIST, f), "utf8");
  const links = (html.match(/(?:href|src)="[^"]+"/g) || []).slice(0, 5);
  console.log(`\n${f}:\n  ${links.join("\n  ")}`);
};
sample("index.html");
sample("article/mind-1min.html");
sample("404.html");
