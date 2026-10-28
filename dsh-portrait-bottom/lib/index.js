/**
 * Host half of @local/dsh-portrait-bottom.
 *
 * This plugin is intentionally client-only: all it does in the browser is
 * reflow the built-in three-column frame (sidebar | chat | right panel) into a
 * top/bottom split (sidebar + chat on top, the right panel docked below at a
 * draggable height) whenever the user toggles it on. The host side needs no
 * services, routes, or state - hence an empty apply.
 */
export const name = "portrait-bottom";
export function apply(_ctx) { /* client-only plugin: nothing to do on the host */ }
