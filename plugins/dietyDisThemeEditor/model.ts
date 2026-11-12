/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// The theme being edited, the Discord variables each option controls, the templates,
// and turning a theme into a Vencord .theme.css file (and back).

import logoBase64 from "file://./home-dietydis.png?base64";

const dietydisLogo = `data:image/png;base64,${logoBase64}`;
export const DIETYDIS_LOGO = dietydisLogo;

export interface ThemeDraft {
    meta: { name: string; author: string; description: string; version: string; };
    /** colour key -> "#rrggbb" or "#rrggbbaa"; missing = Discord's own colour */
    colors: Record<string, string>;
    background: {
        type: "none" | "image" | "gradient";
        image: string;
        from: string;
        to: string;
        angle: number;
        blur: number;
        dim: number;
        /** how opaque Discord's panels stay over the image/gradient (%) */
        panelOpacity: number;
        fit: "cover" | "contain" | "repeat";
        position: "center" | "top" | "bottom";
        saturate: number;
        /** see-through panels even without an image (for a transparent window) */
        transparentApp: boolean;
    };
    shape: { radius: number; font: string; codeFont: string; };
    icons: {
        home: "default" | "dietydis" | "custom";
        homeImage: string;
        homeFit: "cover" | "contain";
        homeBg: string;
        guildShape: Shape;
        avatarShape: Shape;
    };
    hide: Record<string, boolean>;
    customCss: string;
    /** file in the themes folder, once saved */
    fileName?: string;
}

export type Shape = "default" | "circle" | "rounded" | "square";

export function newDraft(): ThemeDraft {
    return {
        meta: { name: "", author: "", description: "", version: "1.0.0" },
        colors: {},
        background: {
            type: "none", image: "", from: "#1e1f4b", to: "#0b0c1a", angle: 135, blur: 0, dim: 30, panelOpacity: 80,
            fit: "cover", position: "center", saturate: 100, transparentApp: false
        },
        shape: { radius: 100, font: "", codeFont: "" },
        icons: { home: "default", homeImage: "", homeFit: "cover", homeBg: "", guildShape: "default", avatarShape: "default" },
        hide: {},
        customCss: ""
    };
}

export function cloneDraft(d: ThemeDraft): ThemeDraft {
    return JSON.parse(JSON.stringify(d));
}

// Fill in anything missing (older saves, imported files)
export function normalizeDraft(d: any): ThemeDraft {
    const base = newDraft();
    if (!d || typeof d !== "object") return base;
    return {
        meta: { ...base.meta, ...d.meta },
        colors: { ...d.colors },
        background: { ...base.background, ...d.background },
        shape: { ...base.shape, ...d.shape },
        icons: { ...base.icons, ...d.icons },
        hide: { ...d.hide },
        customCss: typeof d.customCss === "string" ? d.customCss : "",
        fileName: typeof d.fileName === "string" ? d.fileName : undefined
    };
}

// ---- Colours ----

export type ColorGroup = "bg" | "text" | "accent" | "other";

export interface ColorDef {
    key: string;
    group: ColorGroup;
    ar: string;
    en: string;
    /** Discord CSS variables set to this colour */
    vars: string[];
    /** shown over a background image: these get the panel opacity */
    panel?: boolean;
}

export const COLOR_DEFS: ColorDef[] = [
    { key: "frame", group: "bg", ar: "إطار النافذة", en: "Window frame", vars: ["--app-frame-background"], panel: true },
    { key: "serverList", group: "bg", ar: "قائمة السيرفرات", en: "Server list", vars: ["--background-base-lowest"], panel: true },
    { key: "sidebar", group: "bg", ar: "قائمة القنوات والرسائل الخاصة", en: "Channel & DM list", vars: ["--background-base-lower"], panel: true },
    { key: "chat", group: "bg", ar: "خلفية الدردشة", en: "Chat background", vars: ["--background-base-low", "--chat-background", "--chat-background-default"], panel: true },
    { key: "surface", group: "bg", ar: "القوائم والنوافذ المنبثقة", en: "Menus & popouts", vars: ["--background-surface-high", "--background-surface-higher", "--background-surface-highest", "--bg-surface-raised", "--card-background-default", "--card-secondary-bg"] },
    { key: "modal", group: "bg", ar: "النوافذ الحوارية", en: "Dialogs", vars: ["--modal-background"] },
    { key: "input", group: "bg", ar: "حقل الكتابة", en: "Text input", vars: ["--input-background-default"] },
    { key: "hover", group: "bg", ar: "التمييز عند المرور", en: "Hover highlight", vars: ["--background-mod-subtle", "--interactive-background-hover"] },
    { key: "selected", group: "bg", ar: "العنصر المحدد", en: "Selected item", vars: ["--background-mod-normal", "--interactive-background-selected", "--interactive-background-active"] },

    { key: "textStrong", group: "text", ar: "العناوين والنص البارز", en: "Headings & strong text", vars: ["--text-strong", "--interactive-text-active"] },
    { key: "textDefault", group: "text", ar: "النص العادي", en: "Normal text", vars: ["--text-default"] },
    { key: "textMuted", group: "text", ar: "النص الخافت", en: "Muted text", vars: ["--text-muted", "--text-subtle", "--interactive-muted"] },
    { key: "channels", group: "text", ar: "أسماء القنوات والأيقونات", en: "Channel names & icons", vars: ["--channels-default", "--interactive-text-default"] },
    { key: "channelsHover", group: "text", ar: "القنوات والأيقونات عند المرور", en: "Channels & icons on hover", vars: ["--interactive-text-hover"] },
    { key: "link", group: "text", ar: "الروابط", en: "Links", vars: ["--text-link"] },

    { key: "brand", group: "accent", ar: "لون التمييز (الأزرار)", en: "Accent (buttons)", vars: ["--brand-500", "--background-brand", "--control-primary-background-default"] },
    { key: "buttonText", group: "accent", ar: "نص الأزرار", en: "Button text", vars: ["--control-primary-text-default", "--control-primary-text-hover", "--control-primary-text-active", "--control-primary-icon-default", "--control-primary-icon-hover", "--control-primary-icon-active"] },
    { key: "mentionBg", group: "accent", ar: "خلفية المنشن", en: "Mention background", vars: ["--mention-background"] },
    { key: "mentionText", group: "accent", ar: "نص المنشن", en: "Mention text", vars: ["--mention-foreground"] },
    { key: "online", group: "accent", ar: "حالة متصل", en: "Online status", vars: ["--status-online", "--status-positive"] },
    { key: "idle", group: "accent", ar: "حالة خامل", en: "Idle status", vars: ["--status-idle"] },
    { key: "dnd", group: "accent", ar: "حالة عدم الإزعاج", en: "Do Not Disturb status", vars: ["--status-dnd"] },

    { key: "border", group: "other", ar: "الحدود والفواصل", en: "Borders & dividers", vars: ["--border-subtle", "--border-normal", "--border-strong", "--app-frame-border", "--chat-border", "--card-border-default"] },
    { key: "scrollThumb", group: "other", ar: "شريط التمرير", en: "Scrollbar", vars: ["--scrollbar-auto-thumb", "--scrollbar-auto-scrollbar-color-thumb"] },
    { key: "scrollTrack", group: "other", ar: "مسار شريط التمرير", en: "Scrollbar track", vars: ["--scrollbar-auto-track", "--scrollbar-auto-scrollbar-color-track"] }
];

export const GROUPS: { key: ColorGroup; ar: string; en: string; }[] = [
    { key: "bg", ar: "الخلفيات", en: "Backgrounds" },
    { key: "text", ar: "النصوص", en: "Text" },
    { key: "accent", ar: "التمييز والحالات", en: "Accent & statuses" },
    { key: "other", ar: "أخرى", en: "Other" }
];

// ---- Colour maths ----

export interface Rgba { r: number; g: number; b: number; a: number; }

export function parseHex(hex: string): Rgba | null {
    const m = /^#?([0-9a-f]{3,8})$/i.exec(hex?.trim() ?? "");
    if (!m) return null;
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
}

export function toHex({ r, g, b, a }: Rgba) {
    const x = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
    return "#" + x(r) + x(g) + x(b) + (a < 1 ? x(a * 255) : "");
}

function toHsl({ r, g, b }: Rgba) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h *= 60;
    }
    return { h, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): Rgba {
    s /= 100; l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255, a: 1 };
}

function shade(c: Rgba, dl: number) {
    const { h, s, l } = toHsl(c);
    return toHex(hslToRgb(h, s, Math.max(0, Math.min(100, l + dl))));
}

function hslTriplet(c: Rgba) {
    const { h, s, l } = toHsl(c);
    return `${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%`;
}

export function css(c: Rgba) {
    return c.a < 1 ? `rgb(${Math.round(c.r)} ${Math.round(c.g)} ${Math.round(c.b)} / ${+c.a.toFixed(3)})` : toHex(c);
}

// ---- Hiding parts of the interface ----

export const HIDE_DEFS: { key: string; ar: string; en: string; css: string; }[] = [
    { key: "nitro", ar: "تبويب Nitro في الرسائل الخاصة", en: "Nitro tab in Direct Messages", css: 'a[href="/store"]' },
    { key: "shop", ar: "تبويب المتجر", en: "Shop tab", css: 'a[href="/shop"]' },
    { key: "quests", ar: "تبويب المهام", en: "Quests tab", css: 'a[href="/quest-home"], a[href^="/discovery/quests"]' },
    { key: "gift", ar: "زر الهدية في حقل الكتابة", en: "Gift button in the message box", css: 'button[aria-label="Send a gift"], button[aria-label="إرسال هدية"]' },
    { key: "apps", ar: "زر التطبيقات في حقل الكتابة", en: "Apps button in the message box", css: '[class*="channelTextArea"] button[aria-label="Apps"], [class*="channelTextArea"] button[aria-label="التطبيقات"]' },
    { key: "download", ar: "زر تنزيل التطبيقات في قائمة السيرفرات", en: "Download Apps button in the server list", css: '[class*="listItem"]:has([data-list-item-id="guildsnav___app-download-button"])' },
    { key: "discover", ar: "زر الاستكشاف في قائمة السيرفرات", en: "Discover button in the server list", css: '[class*="listItem"]:has([data-list-item-id="guildsnav___guild-discover-button"])' },
    { key: "activeNow", ar: "عمود «نشط الآن» في صفحة الأصدقاء", en: "\"Active Now\" column on the Friends page", css: '[class*="nowPlayingColumn"]' }
];

// ---- Fonts and corner radius ----

const RADII: Record<string, number> = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const FONTS = ["", "Segoe UI", "Tahoma", "Arial", "Verdana", "Trebuchet MS", "Calibri", "Georgia", "Consolas"];
export const CODE_FONTS = ["", "Consolas", "Cascadia Code", "Cascadia Mono", "Courier New", "Lucida Console"];

// ---- Templates ----

export const TEMPLATES: { key: string; ar: string; en: string; colors: Record<string, string>; }[] = [
    { key: "default", ar: "Discord الأصلي", en: "Discord default", colors: {} },
    {
        key: "amoled", ar: "أسود كامل (AMOLED)", en: "Pure black (AMOLED)",
        colors: { frame: "#000000", serverList: "#000000", sidebar: "#000000", chat: "#000000", surface: "#0b0b0b", modal: "#0b0b0b", input: "#121212", border: "#1f1f1f", textDefault: "#e6e6e6", hover: "#ffffff0f", selected: "#ffffff1a" }
    },
    {
        key: "midnight", ar: "أزرق ليلي", en: "Midnight blue",
        colors: { frame: "#0b1020", serverList: "#0b1020", sidebar: "#10172b", chat: "#141c33", surface: "#1a2340", modal: "#1a2340", input: "#1d2747", border: "#26305a", brand: "#5b8cff", link: "#7aa7ff", mentionBg: "#5b8cff33", mentionText: "#c9d8ff" }
    },
    {
        key: "desert", ar: "رمال الصحراء", en: "Desert sand",
        colors: { frame: "#1c1712", serverList: "#1c1712", sidebar: "#241e17", chat: "#2b241c", surface: "#332a20", modal: "#332a20", input: "#3a3025", border: "#4a3d2e", brand: "#c9a227", buttonText: "#1c1712", link: "#e0b84a", textDefault: "#efe6d8", textMuted: "#b3a690", channels: "#c8bba5", mentionBg: "#c9a22733", mentionText: "#f3d27a", online: "#2e9e5b" }
    },
    {
        key: "green", ar: "أخضر", en: "Green",
        colors: { frame: "#06140d", serverList: "#06140d", sidebar: "#0b1f15", chat: "#0f281b", surface: "#133222", modal: "#133222", input: "#163a28", border: "#1e4a33", brand: "#1f9d55", link: "#4cc38a", mentionBg: "#1f9d5533", mentionText: "#9be3bd" }
    },
    {
        key: "purple", ar: "بنفسجي", en: "Purple night",
        colors: { frame: "#140f1f", serverList: "#140f1f", sidebar: "#1b1429", chat: "#211933", surface: "#291f3f", modal: "#291f3f", input: "#2e2347", border: "#3a2c5a", brand: "#9b5cff", link: "#b78cff", mentionBg: "#9b5cff33", mentionText: "#dcc6ff" }
    },
    {
        key: "light", ar: "فاتح", en: "Light",
        colors: { frame: "#e3e5e8", serverList: "#e3e5e8", sidebar: "#f2f3f5", chat: "#ffffff", surface: "#ffffff", modal: "#ffffff", input: "#ebedef", textStrong: "#060607", textDefault: "#313338", textMuted: "#5c5e66", channels: "#4e5058", channelsHover: "#060607", border: "#d4d7dc", hover: "#0000000f", selected: "#0000001a", scrollThumb: "#c4c9ce", scrollTrack: "#f2f3f5" }
    }
];

// ---- CSS ----

/** Every selector Discord declares its theme variables on */
export const VAR_SCOPE = ":root, .theme-dark, .theme-light, .theme-darker, .theme-midnight, .visual-refresh";

/**
 * Variable declarations for a theme.
 * @param defaults Discord's own value for each variable (needed to fade panels over a background image)
 */
export function buildVarDecls(d: ThemeDraft, defaults: Record<string, string>, important = true) {
    const imp = important ? " !important" : "";
    const lines: string[] = [];
    const set = (name: string, value: string) => lines.push(`    ${name}: ${value}${imp};`);
    const fading = d.background.type !== "none" || d.background.transparentApp;
    const opacity = Math.max(0, Math.min(100, d.background.panelOpacity));

    for (const def of COLOR_DEFS) {
        const c = parseHex(d.colors[def.key]);
        if (def.panel && fading) {
            const value = c ? css(c) : defaults[def.vars[0]];
            if (!value) continue;
            for (const v of def.vars) set(v, `color-mix(in srgb, ${value} ${opacity}%, transparent)`);
            continue;
        }
        if (!c) continue;
        for (const v of def.vars) set(v, css(c));
        if (def.key === "brand") {
            set("--brand-560", shade(c, -8));
            set("--control-primary-background-hover", shade(c, -8));
            set("--brand-600", shade(c, -14));
            set("--control-primary-background-active", shade(c, -14));
            set("--brand-360", shade(c, 12));
            set("--text-brand", shade(c, 12));
            set("--control-brand-foreground", shade(c, 12));
            set("--control-brand-foreground-new", shade(c, 12));
            set("--brand-500-hsl", hslTriplet(c));
            set("--brand-560-hsl", hslTriplet(parseHex(shade(c, -8))!));
            set("--brand-600-hsl", hslTriplet(parseHex(shade(c, -14))!));
            set("--brand-360-hsl", hslTriplet(parseHex(shade(c, 12))!));
        }
    }

    const { radius, font, codeFont } = d.shape;
    if (radius !== 100) {
        for (const [k, px] of Object.entries(RADII)) set(`--radius-${k}`, `${Math.round(px * radius / 100)}px`);
    }
    const quote = (s: string) => `"${s.replace(/["\\]/g, "")}"`;
    if (font.trim()) {
        const stack = `"DietyDis Arabic", ${quote(font.trim())}, "gg sans", "Noto Sans", sans-serif`;
        set("--font-primary", stack);
        set("--font-display", stack);
        set("--font-headline", stack);
    }
    if (codeFont.trim()) set("--font-code", `${quote(codeFont.trim())}, Consolas, monospace`);

    return lines;
}

/** The CSS `background` value for the theme's image or gradient ("" when there is none) */
export function backgroundLayer(d: ThemeDraft) {
    const bg = d.background;
    const black = { r: 0, g: 0, b: 0, a: 1 };
    const size = bg.fit === "repeat" ? "auto" : bg.fit;
    return bg.type === "image" && bg.image
        ? `url("${bg.image.replace(/"/g, "%22")}") ${bg.position} / ${size} ${bg.fit === "repeat" ? "repeat" : "no-repeat"}`
        : bg.type === "gradient"
            ? `linear-gradient(${Math.round(bg.angle)}deg, ${css(parseHex(bg.from) ?? black)}, ${css(parseHex(bg.to) ?? black)})`
            : "";
}

/** The picture on the Home button ("" = Discord's own icon) */
export function homeImage(d: ThemeDraft) {
    return d.icons.home === "dietydis" ? dietydisLogo : d.icons.home === "custom" ? d.icons.homeImage : "";
}

export function buildCss(d: ThemeDraft, defaults: Record<string, string>) {
    let out = "";
    const decls = buildVarDecls(d, defaults);
    if (decls.length) out += `${VAR_SCOPE} {\n${decls.join("\n")}\n}\n`;

    const bg = d.background;
    const layer = backgroundLayer(d);
    if (layer || bg.transparentApp) {
        out += `
/* Background${bg.transparentApp ? " (transparent app)" : ""} */
html, body, #app-mount {
    background: transparent !important;
}
`;
    }
    if (layer) {
        out += `body::before {
    content: "";
    position: fixed;
    inset: ${bg.blur ? -bg.blur * 2 : 0}px;
    z-index: -1;
    pointer-events: none;
    background: ${layer};
    filter: blur(${bg.blur}px) brightness(${100 - bg.dim}%) saturate(${bg.saturate}%);
}
`;
    }

    out += iconsCss(d);

    const hidden = HIDE_DEFS.filter(h => d.hide[h.key]);
    if (hidden.length) out += `\n/* Hidden parts */\n${hidden.map(h => h.css).join(",\n")} {\n    display: none !important;\n}\n`;

    if (d.customCss.trim()) out += `\n/* Custom CSS */\n${d.customCss.trim()}\n`;
    return out;
}

// ---- Home button and icon shapes ----

export const SHAPE_RADIUS: Record<Exclude<Shape, "default">, string> = { circle: "50%", rounded: "30%", square: "6px" };

const HOME = '[data-list-item-id="guildsnav___home"]';

function iconsCss(d: ThemeDraft) {
    const ic = d.icons;
    let out = "";
    const image = homeImage(d);
    if (image) {
        const fit = ic.home === "dietydis" ? "70%" : ic.homeFit === "contain" ? "70%" : "cover";
        out += `
/* Home button icon */
${HOME} svg,
${HOME} img {
    opacity: 0 !important;
}
${HOME} {
    background-image: url("${image.replace(/"/g, "%22")}") !important;
    background-size: ${fit} !important;
    background-position: center !important;
    background-repeat: no-repeat !important;
}
`;
    }
    const homeBg = parseHex(ic.homeBg);
    if (homeBg) out += `${HOME} {\n    background-color: ${css(homeBg)} !important;\n}\n`;

    if (ic.guildShape !== "default") {
        const r = SHAPE_RADIUS[ic.guildShape];
        out += `
/* Server icon shape */
nav[class*="guilds"] foreignObject[mask] {
    mask: none !important;
}
nav[class*="guilds"] [data-list-item-id^="guildsnav___"],
nav[class*="guilds"] foreignObject img {
    border-radius: ${r} !important;
    overflow: hidden;
}
`;
    }
    if (ic.avatarShape !== "default") {
        const r = SHAPE_RADIUS[ic.avatarShape];
        out += `
/* Avatar shape */
foreignObject[mask^="url(#svg-mask-avatar"] {
    mask: none !important;
}
foreignObject[mask^="url(#svg-mask-avatar"] img,
img[class*="avatar"] {
    border-radius: ${r} !important;
}
`;
    }
    return out;
}

// ---- File format ----

const DATA_MARK = "DietyDis-Theme-Editor-Data:";

function toBase64(s: string) {
    const bytes = new TextEncoder().encode(s);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
}

function fromBase64(s: string) {
    const bin = atob(s);
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

const metaLine = (s: string) => s.replace(/\*\//g, "* /").replace(/[\r\n]+/g, " ").trim();

/** A complete Vencord theme file; the editor's settings ride along so the theme can be edited again */
export function buildThemeFile(d: ThemeDraft, defaults: Record<string, string>) {
    const name = metaLine(d.meta.name) || "DietyDis Theme";
    const header = [
        "/**",
        ` * @name ${name}`,
        ` * @author ${metaLine(d.meta.author) || "DietyDis"}`,
        ` * @description ${metaLine(d.meta.description) || "Made with the DietyDis Theme Editor"}`,
        ` * @version ${metaLine(d.meta.version) || "1.0.0"}`,
        " */",
        ""
    ].join("\n");
    const data = { ...cloneDraft(d), fileName: undefined };
    return header + buildCss(d, defaults) + `\n/* ${DATA_MARK}${toBase64(JSON.stringify(data))} */\n`;
}

/** Editor settings inside a theme file, if it was made with this editor */
export function readThemeFile(text: string): ThemeDraft | null {
    const i = text.lastIndexOf(DATA_MARK);
    if (i === -1) return null;
    const end = text.indexOf("*/", i);
    try {
        return normalizeDraft(JSON.parse(fromBase64(text.slice(i + DATA_MARK.length, end === -1 ? undefined : end).trim())));
    } catch {
        return null;
    }
}

export function hasEditorData(text: string) {
    return text.includes(DATA_MARK);
}

export function themeFileName(d: ThemeDraft) {
    if (d.fileName) return d.fileName;
    const slug = d.meta.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `${slug || "dietydis-theme-" + Date.now().toString(36)}.theme.css`;
}
