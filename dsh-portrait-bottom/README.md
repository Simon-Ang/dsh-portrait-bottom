# dsh-portrait-bottom

**DeepSeek Harness 竖屏适配插件** —— 一键把右侧栏变成底部全宽面板，让 DSH 在竖屏显示器上舒展使用。

> 适用场景：16:10 显示器竖放（如 1600×2560）时，DSH 的「左会话栏 + 聊天区 + 右侧栏」三栏横向布局会把聊天区挤到只剩三四百像素。本插件提供手动开关，把右侧栏整体挪到窗口下方：**上 = 完整会话栏 + 聊天区，下 = 原右侧栏内容（全宽、默认 40% 高、可拖拽）**。

<!-- 建议在此放一张开启前 / 开启后的对比截图： -->
<!-- ![对比](docs/before-after.png) -->

## 功能特性

- **手动开关，默认关闭**：界面右侧边缘中部有圆形 ⇕ 按钮，或快捷键 `Ctrl+Alt+P`；不做任何自动检测，横竖屏都由你说了算
- **底部面板**：原右侧栏内容（文件 / 终端 / 浏览器 / 文档预览等全部 tab）全宽显示在窗口下方，默认占高度 40%
- **可拖拽调高**：面板上缘中央有把手，上下拖拽调节高度（140px ～ 75% 窗高），松手后持久保存
- **左侧会话栏完整保留**：不折叠、不隐藏
- **右栏功能零损失**：tab 切换、`Ctrl+Alt+B` 开关面板、分栏、浮窗等原有能力全部照常，只是换了个位置
- **关闭即零残留**：所有样式以 `html[data-dsh-portrait-bottom]` 为前缀，开关关闭后界面与原版完全一致

## 兼容性

- DeepSeek Harness ≥ 0.2.1-rc.3（在 0.2.1-rc.3 桌面版 desktop profile 实测通过）
- 需要 Chromium `:has()` 支持（Electron 桌面版与主流现代浏览器均已支持）
- 未来 DSH 若重构布局，插件最坏的失败方式是**不生效**（自动回到原布局），不会破坏界面

## 安装

### 方式一：一键脚本（推荐）

```bash
git clone https://github.com/<你的用户名>/dsh-portrait-bottom.git
cd dsh-portrait-bottom
node scripts/install.mjs                     # 自动检测 desktop / web profile
# 或显式指定：node scripts/install.mjs --profile desktop
```

然后**完全退出并重新打开 DeepSeek Harness**（插件在启动时扫描加载）。

- 自定义 DSH 安装目录：设置 `DSH_HOME` 环境变量后运行脚本
- 需要 Node.js ≥ 18（仅安装时使用，插件本身不依赖 Node）

### 方式二：手动安装

1. 把仓库中的 `lib/`、`package.json`、`README.md`、`LICENSE` 复制到：
   `~/.dsh/profiles/<profile>/node_modules/@local/dsh-portrait-bottom/`
2. 把 example/cordis.patch.yml 里的三行追加到该 profile 的 `cordis.patch.yml` 末尾；
3. 完全重启 DeepSeek Harness。

> 说明：包名保留 `@local/` 前缀是因为 DSH 的 loader 按此名从 profile 的 node_modules 解析，与社区插件 dsh-project-file-explorer 的分发方式一致。

## 使用

| 操作 | 方式 |
| --- | --- |
| 开 / 关底部布局 | 右侧边缘中部 ⇕ 圆钮，或 `Ctrl+Alt+P` |
| 调节面板高度 | 拖拽面板上缘中央的把手 |
| 开关右栏内容本身 | 照旧用 DSH 原生 `Ctrl+Alt+B` |

开关状态与面板高度都持久化保存，重启后自动恢复。

## 卸载

```bash
node scripts/install.mjs --uninstall        # 删除插件文件并注销注册行
```

或手动：删除 `node_modules/@local/dsh-portrait-bottom/` 目录，移除 `cordis.patch.yml` 中 id 为 `portrait-bottom` 的 insert 块，重启 DSH。

## 工作原理（为什么安全）

- 走 DSH **官方用户插件机制**（cordis loader patch + 客户端插件），零修改 `app.asar` 与任何 DSH 自带文件，升级 DSH 不受影响；
- 全部布局效果 = 一段带开关前缀的 CSS + 少量 DOM 定位脚本：把主框架 grid 从「三列」改为「上下两行」，右栏列落到第二行；
- 选择器只用 DSH 的**稳定标记**（`[data-rightbar-col]`、`[data-sidebar-right-panel]`、`[data-shell-bottom]` 等），不依赖随版本变化的构建哈希类名；
- 通过 CSS 变量桥接（`--dsh-pb-*`）传递尺寸，不与 React 的内联样式互相覆盖。

## 已知限制

- 若你在**原版布局**下把右侧栏拖得极宽（1600px 宽窗口上约 >900px），DSH 自身会判定放不下而不挂载右栏内容。此时先关闭底部模式，用 `Ctrl+Alt+B` 重开右栏（恢复默认宽），再开启底部模式即可；
- 右侧栏的「全屏」模式在底部布局下等效于铺满整个底部面板；
- 仅影响浏览器界面布局，不改变任何宿主（后端）行为。

## English

A DeepSeek Harness client plugin that docks the right sidebar as a full-width bottom panel — ideal for portrait monitors (e.g. 1600×2560). Manually toggled via an edge button or `Ctrl+Alt+P`; the panel defaults to 40% height and is drag-resizable. The left session sidebar stays intact; every right-panel feature (tabs, splits, floats, `Ctrl+Alt+B`) keeps working. Zero impact when off: all styles are scoped under a single HTML attribute, and no DSH file is ever modified (official user-plugin mechanism only).

## 许可证

[MIT](LICENSE)