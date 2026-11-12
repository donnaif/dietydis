/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Editor state: the theme being edited (kept in the plugin settings, so it survives restarts),
// undo/redo, the live preview style, and Discord's own colours.

import { definePluginSettings, Settings } from "@api/Settings";
import { OptionType } from "@utils/types";
import { useEffect, useReducer } from "@webpack/common";

import { buildCss, buildVarDecls, cloneDraft, COLOR_DEFS, newDraft, normalizeDraft, ThemeDraft } from "./model";

export const settings = definePluginSettings({
    livePreview: {
        type: OptionType.BOOLEAN,
        description: "Show the theme being edited on Discord while editing",
        default: true,
        hidden: true
    },
    draft: {
        type: OptionType.CUSTOM,
        default: null as unknown as ThemeDraft | null
    }
});

// ---- Language (follows DietyDisArabic's interface language) ----

export function isArabic() {
    try {
        return Vencord.Plugins.isPluginEnabled("DietyDisArabic") && (Settings.plugins.DietyDisArabic as any)?.uiLanguage !== "en";
    } catch {
        return false;
    }
}

export const t = (ar: string, en: string) => isArabic() ? ar : en;

// ---- Draft, undo/redo ----

let draft: ThemeDraft = newDraft();
const undoStack: ThemeDraft[] = [];
const redoStack: ThemeDraft[] = [];
const listeners = new Set<() => void>();
let lastCoalesce = { key: "", at: 0 };
let saveTimer: ReturnType<typeof setTimeout> | undefined;

export const getDraft = () => draft;
export const canUndo = () => undoStack.length > 0;
export const canRedo = () => redoStack.length > 0;

let loaded = false;

export function loadStoredDraft() {
    draft = normalizeDraft(settings.store.draft);
    undoStack.length = redoStack.length = 0;
    loaded = true;
}

/** The editor may open before the plugin has started (e.g. Vencord starts plugins late) */
export function ensureLoaded() {
    if (!loaded) loadStoredDraft();
}

function changed(persistNow = false) {
    clearTimeout(saveTimer);
    const persist = () => { settings.store.draft = cloneDraft(draft); };
    if (persistNow) persist(); else saveTimer = setTimeout(persist, 400);
    applyPreview();
    listeners.forEach(l => l());
}

/** Editing a theme that is also enabled as a file: switch the file off and preview the edits instead */
function takeOverFromFile() {
    const file = draft.fileName;
    if (!file) return;
    const enabled = Settings.enabledThemes ?? [];
    if (enabled.includes(file)) Settings.enabledThemes = enabled.filter(f => f !== file);
    settings.store.livePreview = true;
}

/**
 * Change the draft. Edits with the same `coalesce` key in quick succession (sliders, typing)
 * become one undo step.
 */
export function update(fn: (d: ThemeDraft) => void, coalesce?: string) {
    const now = Date.now();
    const merge = coalesce && lastCoalesce.key === coalesce && now - lastCoalesce.at < 800;
    if (!merge) {
        undoStack.push(cloneDraft(draft));
        if (undoStack.length > 100) undoStack.shift();
    }
    redoStack.length = 0;
    lastCoalesce = { key: coalesce ?? "", at: now };
    const next = cloneDraft(draft);
    fn(next);
    draft = next;
    takeOverFromFile();
    changed();
}

/** Replace the whole draft (new theme, template, opening a file) as one undo step */
export function replaceDraft(next: ThemeDraft) {
    undoStack.push(cloneDraft(draft));
    redoStack.length = 0;
    draft = normalizeDraft(next);
    changed(true);
}

/** Change without an undo step and without touching the files (e.g. remembering the file name) */
export function patchQuietly(fn: (d: ThemeDraft) => void) {
    const next = cloneDraft(draft);
    fn(next);
    draft = next;
    changed(true);
}

export function undo() {
    const prev = undoStack.pop();
    if (!prev) return;
    redoStack.push(cloneDraft(draft));
    draft = prev;
    lastCoalesce = { key: "", at: 0 };
    changed();
}

export function redo() {
    const next = redoStack.pop();
    if (!next) return;
    undoStack.push(cloneDraft(draft));
    draft = next;
    lastCoalesce = { key: "", at: 0 };
    changed();
}

export function useDraft() {
    const [, force] = useReducer((x: number) => x + 1, 0);
    useEffect(() => {
        listeners.add(force);
        return () => void listeners.delete(force);
    }, []);
    return draft;
}

export function notify() {
    listeners.forEach(l => l());
}

// ---- Discord's own colours ----

let defaults: Record<string, string> = {};
export const getDefaults = () => defaults;

function resolveColor(cssValue: string, probe: HTMLElement, ctx: CanvasRenderingContext2D): string | null {
    probe.style.color = "";
    probe.style.color = cssValue;
    const computed = getComputedStyle(probe).color;
    if (!computed) return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = computed;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const x = (v: number) => v.toString(16).padStart(2, "0");
    return "#" + x(r) + x(g) + x(b) + (a < 255 ? x(a) : "");
}

/** Read Discord's current value of every variable the editor controls (with our preview off) */
export function readDefaults() {
    const style = document.getElementById(PREVIEW_ID) as HTMLStyleElement | null;
    if (style) style.disabled = true;
    const probe = document.createElement("span");
    probe.style.display = "none";
    document.body.appendChild(probe);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const out: Record<string, string> = {};
    for (const def of COLOR_DEFS) {
        for (const v of def.vars) {
            const value = resolveColor(`var(${v})`, probe, ctx);
            if (value) out[v] = value;
        }
    }
    probe.remove();
    if (style) style.disabled = false;
    defaults = out;
    return out;
}

// ---- Styles: live preview on Discord, and the editor's own preview card ----

const PREVIEW_ID = "dietydis-theme-editor-preview";
const MOCK_ID = "dietydis-theme-editor-mock";

function styleEl(id: string) {
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
        el = document.createElement("style");
        el.id = id;
    }
    // Keep it last, after Discord's and Vencord's styles
    document.documentElement.appendChild(el);
    return el;
}

export function applyPreview() {
    if (settings.store.livePreview) styleEl(PREVIEW_ID).textContent = buildCss(draft, defaults);
    else document.getElementById(PREVIEW_ID)?.remove();

    // The preview card in the editor always shows the draft, preview on or off
    const decls = buildVarDecls({ ...draft, background: { ...draft.background, type: "none" } }, defaults, false);
    styleEl(MOCK_ID).textContent = `.dd-te-mock {\n${decls.join("\n")}\n}\n`;
}

export function removeStyles() {
    document.getElementById(PREVIEW_ID)?.remove();
    document.getElementById(MOCK_ID)?.remove();
}
