#!/usr/bin/env node
/**
 * install.mjs —— 一键安装 / 卸载 dsh-portrait-bottom 到本机 DeepSeek Harness。
 *
 * 用法：
 *   node scripts/install.mjs                     安装（自动在 desktop / web profile 中挑选）
 *   node scripts/install.mjs --profile desktop   安装到指定 profile
 *   node scripts/install.mjs --uninstall         卸载（删除插件目录并注销注册行）
 *
 * 说明：
 *   - 数据根目录优先读环境变量 DSH_HOME，否则默认 ~/.dsh
 *   - 安装后需完全退出并重新打开 DeepSeek Harness 生效
 */
import { cpSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

const ROW_ID = "portrait-bottom";
const ROW_NAME = "@local/dsh-portrait-bottom";
const BLOCK_CORE = "- insert:\n    - id: " + ROW_ID + "\n      name: '" + ROW_NAME + "'";

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i !== -1 ? (args[i + 1] ?? null) : null; };
const uninstall = args.includes("--uninstall");

const dshHome = (process.env.DSH_HOME && process.env.DSH_HOME.trim()) || join(homedir(), ".dsh");
const profilesRoot = join(dshHome, "profiles");

let profileName = flag("--profile");
if (!profileName) {
  for (const candidate of ["desktop", "web"]) {
    if (existsSync(join(profilesRoot, candidate, "cordis.patch.yml"))) { profileName = candidate; break; }
  }
}
if (!profileName) {
  console.error("[dsh-portrait-bottom] 未找到可用的 profile（尝试过 " + profilesRoot + " 下的 desktop 与 web）。请用 --profile <name> 指定。");
  process.exit(1);
}
const profileDir = join(profilesRoot, profileName);
const patchYmlPath = join(profileDir, "cordis.patch.yml");
const localRoot = join(profileDir, "node_modules", "@local");
const targetDir = join(localRoot, "dsh-portrait-bottom");

function readPatch() {
  try { return readFileSync(patchYmlPath, "utf8"); } catch { return ""; }
}

function registerRow() {
  const text = readPatch();
  if (text.includes(ROW_ID)) { console.log("  注册行已存在，跳过"); return; }
  const next = text.replace(/\r\n/g, "\n");
  const separator = next.length === 0 || next.endsWith("\n\n") ? "" : (next.endsWith("\n") ? "\n" : "\n\n");
  writeFileSync(patchYmlPath, next + separator + BLOCK_CORE + "\n", "utf8");
  console.log("  已在 cordis.patch.yml 注册：" + patchYmlPath);
}

function unregisterRow() {
  const text = readPatch();
  if (!text.includes(ROW_ID)) { console.log("  注册行不存在，跳过"); return; }
  const next = text.replace(/\r\n/g, "\n")
    .split(BLOCK_CORE + "\n").join("")
    .split(BLOCK_CORE).join("")
    .replace(/\n{3,}/g, "\n\n");
  writeFileSync(patchYmlPath, next, "utf8");
  console.log("  已从 cordis.patch.yml 注销注册行");
}

if (uninstall) {
  console.log("[dsh-portrait-bottom] 卸载（profile: " + profileName + "）");
  unregisterRow();
  if (existsSync(targetDir)) { rmSync(targetDir, { recursive: true, force: true }); console.log("  已删除插件目录：" + targetDir); }
  else console.log("  插件目录不存在，跳过");
  console.log("请完全重启 DeepSeek Harness 完成卸载。");
  process.exit(0);
}

console.log("[dsh-portrait-bottom] 安装（profile: " + profileName + "）");
if (!existsSync(join(ROOT, "lib", "client.js"))) {
  console.error("[dsh-portrait-bottom] 仓库不完整：找不到 lib/client.js");
  process.exit(1);
}
mkdirSync(targetDir, { recursive: true });
for (const entry of ["lib", "package.json", "README.md", "LICENSE", "CHANGELOG.md"]) {
  const src = join(ROOT, entry);
  if (!existsSync(src)) continue;
  cpSync(src, join(targetDir, entry), { recursive: true, force: true });
}
console.log("  已复制插件文件到：" + targetDir);
registerRow();
console.log("安装完成。请完全退出并重新打开 DeepSeek Harness，然后按 Ctrl+Alt+P 或点击界面右缘的 ⇕ 按钮开启底部布局。");