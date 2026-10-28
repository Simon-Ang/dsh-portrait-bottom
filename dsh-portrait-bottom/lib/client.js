window.__ModuleLoader__.load({
	id: "@local/dsh-portrait-bottom",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let jsxRuntime = require("react/jsx-runtime");

		// ---------- constants & persisted state ----------
		const MODE_ATTR = "data-dsh-portrait-bottom";
		const LS_ON = "@local/dsh-portrait-bottom/on";
		const LS_H = "@local/dsh-portrait-bottom/height";
		const DEFAULT_RATIO = 0.4;
		const MIN_H = 140;
		const MAX_RATIO = 0.75;
		const HANDLE_ID = "dsh-pb-handle";

		function lsGet(key) {
			try { return window.localStorage.getItem(key); } catch (e) { return null; }
		}
		function lsSet(key, value) {
			try { window.localStorage.setItem(key, String(value)); } catch (e) { /* 私有模式等场景忽略 */ }
		}
		let on = lsGet(LS_ON) === "1";
		const listeners = new Set();
		function notify() { for (const l of [...listeners]) { try { l(); } catch (e) { /* 订阅方异常不影响主流程 */ } } }
		function subscribe(l) { listeners.add(l); return () => listeners.delete(l); }
		function isOn() { return on; }

		// ---------- styles ----------
		// 全部规则都以 html[data-dsh-portrait-bottom] 为前缀：开关关闭时整段 CSS 失效，
		// 界面与 DSH 原版完全一致。选择器只用稳定标记（data-* 属性），不依赖构建哈希类名。
		const CSS = [
			"/* ===== @local/dsh-portrait-bottom：竖屏底部布局 ===== */",
			"/* 1) 主框架：改为三行 —— 上=中列（聊天区），下=右栏内容，末行=原 shell 底行 */",
			"html[data-dsh-portrait-bottom] :has(> [data-rightbar-col]) { grid-template-rows: minmax(0, 1fr) minmax(0, var(--dsh-pb-h, 40%)) auto !important; }",
			"html[data-dsh-portrait-bottom] :has(> [data-rightbar-col])[data-rightbar-collapsed] { grid-template-rows: minmax(0, 1fr) minmax(0, 0px) auto !important; }",
			"/* 2) 列宽：左列按 JS 提供的实际宽度，中列吃满，第三列收零（右栏改到下方，不再占右侧） */",
			"html[data-dsh-portrait-bottom] :has(> [data-rightbar-col]) { grid-template-columns: var(--dsh-pb-cols, 300px minmax(0, 1fr) 0px) !important; }",
			"/* 3) 三个区块落位：左侧会话栏跨全部行；中列在上；右栏列在下 */",
			"html[data-dsh-portrait-bottom] [data-dsh-pb-sidebar] { grid-column: 1 !important; grid-row: 1 / 4 !important; }",
			"html[data-dsh-portrait-bottom] [data-dsh-pb-center] { grid-column: 2 !important; grid-row: 1 !important; min-height: 0; }",
			"html[data-dsh-portrait-bottom] [data-rightbar-col] { grid-column: 2 !important; grid-row: 2 !important; min-height: 0; }",
			"/* 4) 右栏面板：原为锚定右缘、定宽、绝对定位的竖条 → 改为底部面板内的普通流，撑满右栏列 */",
			"html[data-dsh-portrait-bottom] [data-sidebar-right-panel] { position: static !important; inset: auto !important; width: 100% !important; height: 100% !important; --dsh-sidebar-width: var(--dsh-pb-panel-w, 100vw) !important; }",
			"/* 5) 隐藏原生竖向调宽把手（底部模式改用插件自己的横向调高把手） */",
			"html[data-dsh-portrait-bottom] :has(> [data-rightbar-col]) > [class*=_handle] { display: none !important; }",
			"/* 6) 插件的横向调高把手 */",
			"#" + HANDLE_ID + " { position: fixed; z-index: 46; height: 9px; cursor: row-resize; touch-action: none; display: none; }",
			"html[data-dsh-portrait-bottom] #" + HANDLE_ID + ".live { display: block; }",
			"#" + HANDLE_ID + "::after { content: ''; position: absolute; left: 50%; top: 3px; width: 44px; height: 3px; border-radius: 2px; transform: translateX(-50%); background: var(--dsw-alias-label-tertiary, #8a8f98); opacity: 0; transition: opacity 0.15s ease; }",
			"#" + HANDLE_ID + ":hover::after, #" + HANDLE_ID + ".dragging::after { opacity: 0.9; }",
			"/* 7) 开关按钮（shell.overlay 槽位 / DOM 兜底共用样式） */",
			".dsh-pb-toggle { position: fixed; right: 8px; top: 50%; transform: translateY(-50%); z-index: 45; width: 30px; height: 30px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: var(--dsw-radius-full, 999px); border: 0.5px solid var(--dsw-alias-border-l3, transparent); background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,0.15)); color: var(--dsw-alias-label-secondary, inherit); cursor: pointer; font-size: 15px; line-height: 1; transition: background 0.15s ease, color 0.15s ease; }",
			".dsh-pb-toggle:hover { background: var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.3)); color: var(--dsw-alias-label-primary, inherit); }",
			".dsh-pb-toggle.on { background: var(--dsw-alias-accent-fill, rgba(64,120,220,0.9)); color: var(--dsw-static-neutral-100, #fff); border-color: transparent; }",
		].join("\n");
		function ensureStyle() {
			if (document.getElementById("dsh-portrait-bottom-style")) return;
			const tag = document.createElement("style");
			tag.id = "dsh-portrait-bottom-style";
			tag.textContent = CSS;
			document.head.appendChild(tag);
		}

		// ---------- DSH DOM 定位（全部走稳定 data-* 标记）----------
		function getRightCol() { return document.querySelector("[data-rightbar-col]"); }
		function getFrame() { const col = getRightCol(); return col ? col.parentElement : null; }
		function html() { return document.documentElement; }
		// 值未变化时不写：避免 <html> 上的 style 变更再触发自身的 MutationObserver
		function setVar(name, value) { const h = html(); if (h.style.getPropertyValue(name) !== value) h.style.setProperty(name, value); }

		// 给左栏/中列打上本插件标记（CSS 落位用）。React 重渲染不会清除未知属性；
		// 若整个区块被重建，观察器会再次调用 fix() 补打。
		function flowChildren(frame) {
			return Array.from(frame.children).filter((el) => {
				if (el.hasAttribute("data-rightbar-col") || el.hasAttribute("data-shell-bottom") || el.hasAttribute("data-shell-overlay")) return false;
				const cs = getComputedStyle(el);
				return cs.position !== "absolute" && cs.position !== "fixed";
			});
		}

		function defaultHeight(frame) {
			const saved = Number(lsGet(LS_H));
			if (Number.isFinite(saved) && saved >= MIN_H) return Math.round(saved);
			const h = Math.round(frame.getBoundingClientRect().height * DEFAULT_RATIO);
			return Math.max(MIN_H, h);
		}

		let raf = 0;
		function scheduleFix() {
			if (raf) return;
			raf = window.requestAnimationFrame(() => { raf = 0; try { fix(); } catch (e) { /* 布局探索失败：保持原状 */ } });
		}
		function fix() {
			const col = getRightCol();
			if (!col) return;
			const frame = col.parentElement;
			if (!frame) return;
			const flows = flowChildren(frame);
			if (flows.length >= 2) {
				flows[0].setAttribute("data-dsh-pb-sidebar", "");
				flows[1].setAttribute("data-dsh-pb-center", "");
			}
			if (!html().style.getPropertyValue("--dsh-pb-h")) {
				setVar("--dsh-pb-h", defaultHeight(frame) + "px");
			}
			// 列宽模板：左列 = 左栏当前实际宽度；中列吃满；第三列 0（右栏已挪到下方）。
			// 放在 CSS 变量里由样式表以 !important 引用，避免和 React 的内联样式互相覆盖。
			const sidebarW = flows.length >= 1 ? Math.round(flows[0].getBoundingClientRect().width) : 0;
			setVar("--dsh-pb-cols", sidebarW + "px minmax(0, 1fr) 0px");
			// 右栏面板内部滑入/滑出动画依赖 --dsh-sidebar-width（原为内联 px），
			// 用实际底部面板宽度接上，保证开合动画仍然完整。
			const rc = col.getBoundingClientRect();
			setVar("--dsh-pb-panel-w", Math.max(1, Math.round(rc.width)) + "px");
			positionHandle(frame, col);
			observeTargets(frame, col);
		}

		// ---------- 调高把手 ----------
		let handleEl = null;
		function ensureHandle() {
			if (handleEl && handleEl.isConnected) return;
			let el = document.getElementById(HANDLE_ID);
			if (!el) {
				el = document.createElement("div");
				el.id = HANDLE_ID;
				el.title = "拖拽调节底部面板高度";
				el.addEventListener("pointerdown", onHandleDown);
				document.body.appendChild(el);
			}
			handleEl = el;
		}
		function positionHandle(frame, col) {
			ensureHandle();
			if (!on || frame.hasAttribute("data-rightbar-collapsed")) { handleEl.classList.remove("live"); return; }
			const r = col.getBoundingClientRect();
			if (r.height < 8 || r.width < 8) { handleEl.classList.remove("live"); return; }
			handleEl.style.left = r.left + "px";
			handleEl.style.width = r.width + "px";
			handleEl.style.top = (r.top - 5) + "px";
			handleEl.classList.add("live");
		}
		function onHandleDown(e) {
			if (e.button !== 0) return;
			const col = getRightCol();
			const frame = getFrame();
			if (!col || !frame) return;
			e.preventDefault();
			const fr = frame.getBoundingClientRect();
			const maxH = Math.max(MIN_H + 1, Math.floor(fr.height * MAX_RATIO));
			handleEl.setPointerCapture(e.pointerId);
			handleEl.classList.add("dragging");
			document.body.style.userSelect = "none";
			const move = (ev) => {
				const h = Math.max(MIN_H, Math.min(maxH, Math.round(fr.bottom - ev.clientY)));
				html().style.setProperty("--dsh-pb-h", h + "px");
				lsSet(LS_H, h);
				positionHandle(frame, col);
			};
			const up = () => {
				handleEl.classList.remove("dragging");
			document.body.style.userSelect = "";
				handleEl.removeEventListener("pointermove", move);
				handleEl.removeEventListener("pointerup", up);
				handleEl.removeEventListener("pointercancel", up);
			};
			handleEl.addEventListener("pointermove", move);
			handleEl.addEventListener("pointerup", up);
			handleEl.addEventListener("pointercancel", up);
		}

		// ---------- 观察器：框架重建 / 折叠状态变化 / 尺寸变化时自动修补 ----------
		let mo = null;
		let ro = null;
		let roTargets = [];
		function installObserver() {
			if (mo) return;
			mo = new MutationObserver(() => { if (on) scheduleFix(); });
			mo.observe(document.documentElement, {
				subtree: true,
				childList: true,
				attributeFilter: ["data-rightbar-collapsed", "data-sidebar-right-open", "data-sidebar-right-panel", "class", "style"]
			});
			window.addEventListener("resize", scheduleFix);
		}
		function observeTargets(frame, col) {
			if (!ro) ro = new ResizeObserver(() => { if (on) scheduleFix(); });
			const wanted = [frame, col];
			const changed = wanted.length !== roTargets.length || wanted.some((el, i) => el !== roTargets[i]);
			if (!changed) return;
			for (const t of roTargets) ro.unobserve(t);
			roTargets = wanted;
			for (const t of roTargets) ro.observe(t);
		}

		// ---------- 开关 ----------
		function applyAttr() {
			if (on) {
				html().setAttribute(MODE_ATTR, "");
				scheduleFix();
			} else {
				html().removeAttribute(MODE_ATTR);
				if (handleEl) handleEl.classList.remove("live");
				for (const el of document.querySelectorAll("[data-dsh-pb-sidebar], [data-dsh-pb-center]")) el.removeAttribute("data-dsh-pb-" + (el.hasAttribute("data-dsh-pb-sidebar") ? "sidebar" : "center"));
			}
		}
		function setOn(v) {
			const next = !!v;
			if (next === on) { applyAttr(); return; }
			on = next;
			lsSet(LS_ON, on ? "1" : "0");
			applyAttr();
			notify();
		}
		function toggle() { setOn(!on); }

		// ---------- 快捷键 Ctrl+Alt+P ----------
		function onKey(e) {
			if (e.ctrlKey && e.altKey && !e.shiftKey && !e.metaKey && e.code === "KeyP") {
				e.preventDefault();
				e.stopPropagation();
				toggle();
			}
		}

		// ---------- 开关按钮（shell.overlay 槽位，失败则 DOM 兜底）----------
		function ToggleButton() {
			const [state, setState] = react.useState(isOn());
			react.useEffect(() => subscribe(() => setState(isOn())), []);
			return jsxRuntime.jsx("button", {
				className: "dsh-pb-toggle" + (state ? " on" : ""),
				title: state ? "底部布局：开（点击关闭，恢复右侧栏）" : "底部布局：关（点击开启：右侧栏移到下方，适合竖屏）",
				"aria-pressed": state ? "true" : "false",
				"aria-label": "切换纵向底部布局（Ctrl+Alt+P）",
				onClick: toggle,
				children: jsxRuntime.jsx("span", { style: { pointerEvents: "none" }, children: "\u21D5" })
			});
		}
		let fallbackBtn = null;
		function ensureFallbackButton() {
			if (fallbackBtn && fallbackBtn.isConnected) return;
			fallbackBtn = document.createElement("button");
			fallbackBtn.type = "button";
			fallbackBtn.className = "dsh-pb-toggle";
			fallbackBtn.addEventListener("click", toggle);
			subscribe(() => {
				fallbackBtn.classList.toggle("on", isOn());
				fallbackBtn.title = isOn() ? "底部布局：开（点击关闭）" : "底部布局：关（点击开启）";
			});
			fallbackBtn.classList.toggle("on", isOn());
			fallbackBtn.textContent = "\u21D5";
			document.body.appendChild(fallbackBtn);
		}

		// ---------- 插件入口 ----------
		function apply(ctx) {
			if (window.__dshPortraitBottomInstalled) return;
			window.__dshPortraitBottomInstalled = true;
			ensureStyle();
			ensureHandle();
			installObserver();
			window.addEventListener("keydown", onKey, true);
			let slotOk = false;
			try {
				if (ctx && ctx.slots && typeof ctx.slots.inject === "function") {
					ctx.slots.inject("shell.overlay", () => ctx.slots.register({
						name: "shell.overlay",
						id: "portrait-bottom",
						order: 200,
						inject: () => ({})
					}, ToggleButton));
					slotOk = true;
				}
			} catch (e) { slotOk = false; }
			if (!slotOk) ensureFallbackButton();
			applyAttr(); // 若上次会话为开启状态，恢复底部布局
		}
		exports.apply = apply;
		exports.inject = ["slots"];
		return module.exports;
	}
});
