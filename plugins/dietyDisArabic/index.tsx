/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import SettingsPlugin from "@plugins/_core/settings";
import { removeFromArray } from "@utils/misc";
import definePlugin, { OptionType, StartAt } from "@utils/types";

// Bundled Arabic fonts (Arabic glyphs only, SIL Open Font License, licenses in ./fonts)
import cairo400 from "file://./fonts/cairo-400.woff2?base64";
import cairo700 from "file://./fonts/cairo-700.woff2?base64";
import plex400 from "file://./fonts/ibm-plex-sans-arabic-400.woff2?base64";
import plex700 from "file://./fonts/ibm-plex-sans-arabic-700.woff2?base64";
import naskh400 from "file://./fonts/noto-naskh-arabic-400.woff2?base64";
import naskh700 from "file://./fonts/noto-naskh-arabic-700.woff2?base64";
import tajawal400 from "file://./fonts/tajawal-400.woff2?base64";
import tajawal700 from "file://./fonts/tajawal-700.woff2?base64";
import { missingStrings, setDiscordTranslation, stopDiscordTranslation } from "./discordUi";
import { LanguageIcon, LanguagePage, type UiLanguage } from "./LanguagePage";
import { MissingStringsButton } from "./MissingStrings";
import { pluginTranslations } from "./pluginTranslations";

const STYLE_ID = "dietydis-arabic-style";
const FONT_ALIAS = "DietyDis Arabic";

// Arabic, Arabic Supplement, Arabic Extended-A/B, Presentation Forms A and B
const ARABIC_RANGE = "U+0600-06FF, U+0750-077F, U+0870-089F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF";

const BUNDLED_FONTS: Record<string, { 400: string; 700: string; }> = {
    "IBM Plex Sans Arabic": { 400: plex400, 700: plex700 },
    "Cairo": { 400: cairo400, 700: cairo700 },
    "Tajawal": { 400: tajawal400, 700: tajawal700 },
    "Noto Naskh Arabic": { 400: naskh400, 700: naskh700 }
};

// Discord hashes its class names, so match on the stable part only.
// Paragraph-like text: direction per paragraph, aligned to its own start.
const TEXT_SELECTORS = [
    '[class*="messageContent"]',
    '[class*="repliedTextContent"]',
    '[class*="embedTitle"]',
    '[class*="embedDescription"]',
    '[class*="embedFieldName"]',
    '[class*="embedFieldValue"]',
    '[class*="embedAuthorName"]',
    '[class*="threadMessageAccessoryContent"]',
    '[class*="bioText"]',
    '[data-slate-editor="true"] [data-slate-node="element"]'
];

// One-line names and labels: only the direction changes, the layout stays as Discord made it
const NAME_SELECTORS = [
    '[class*="channelName_"]',
    '[class*="username_"]',
    '[class*="nickname_"]',
    '[class*="displayName_"]',
    '[class*="guildNameText"]',
    '[class*="roleName_"]',
    '[class*="statusText_"]',
    '[class*="customStatusContent"]',
    '[class*="userTagUsername"]',
    '[class*="searchBar"] input',
    '[class*="searchBar"] [contenteditable="true"]'
];

// Inside Arabic paragraphs, keep @mentions, links, inline code and timestamps as solid blocks
// so they don't get reordered with the Arabic text around them
const ISOLATE_SELECTORS = [
    ".mention",
    '[class*="mention_"]',
    'a[class*="anchor_"]',
    "code.inline",
    "time"
].map(s => `[class*="messageContent"] ${s}`);

// With the Discord UI translated: let interface text boxes take their direction from their first
// letter. Translated texts start with a right-to-left mark, so they lay out right-to-left (word order
// and punctuation), while text still in English starts with a Latin letter and stays as it was.
// Discord already gives most divs `unicode-bidi: isolate`; plaintext keeps that isolation and only
// adds "take the direction from the first letter". It does not touch layout (that is `direction`).
const UI_TEXT_SELECTORS = ["div", "h1", "h2", "h3", "h4", "h5", "h6", "label", "button", "p"];

// Descriptions here are English; their Arabic versions are in pluginTranslations.ts and are shown
// when the interface language is Arabic.
const settings = definePluginSettings({
    uiLanguage: {
        type: OptionType.SELECT,
        description: "Interface language: Arabic, or Discord's original English (also in Settings > Interface Language)",
        options: [
            { label: "العربية", value: "ar", default: true },
            { label: "English", value: "en" }
        ],
        onChange: switchLanguage
    },
    autoDirection: {
        type: OptionType.BOOLEAN,
        description: "Automatic text direction: Arabic right-to-left, English left-to-right",
        default: true,
        onChange: applyStyle
    },
    autoDirectionNames: {
        type: OptionType.BOOLEAN,
        description: "Automatic direction also in channel, user and server names, statuses and search",
        default: true,
        onChange: applyStyle
    },
    isolateMentions: {
        type: OptionType.BOOLEAN,
        description: "Keep mentions, links and code from mixing with the Arabic text around them",
        default: true,
        onChange: applyStyle
    },
    customFont: {
        type: OptionType.BOOLEAN,
        description: "Use a separate font for Arabic letters only",
        default: true,
        onChange: applyStyle
    },
    arabicFont: {
        type: OptionType.SELECT,
        description: "Arabic font (the first four are built into the app and show for everyone)",
        options: [
            { label: "IBM Plex Sans Arabic", value: "IBM Plex Sans Arabic", default: true },
            { label: "Cairo", value: "Cairo" },
            { label: "Tajawal", value: "Tajawal" },
            { label: "Noto Naskh Arabic", value: "Noto Naskh Arabic" },
            { label: "Segoe UI (Windows)", value: "Segoe UI" },
            { label: "Tahoma (Windows)", value: "Tahoma" },
            { label: "Other / خط آخر", value: "custom" }
        ],
        onChange: applyStyle
    },
    customFontName: {
        type: OptionType.STRING,
        description: "Name of a font installed on your computer (when \"Other\" is chosen)",
        default: "",
        onChange: applyStyle
    },
    arabicSize: {
        type: OptionType.SLIDER,
        description: "Size of Arabic letters relative to English (%)",
        markers: [80, 90, 100, 110, 120, 130, 140, 150],
        default: 110,
        stickToMarkers: false,
        onChange: applyStyle
    },
    missingStrings: {
        type: OptionType.COMPONENT,
        description: "Copy the English Discord texts you saw without a translation, to add them to the dictionary",
        component: MissingStringsButton
    }
});

const isArabic = () => settings.store.uiLanguage !== "en";

// Discord UI, plugin descriptions and the RTL text boxes all follow the chosen language
function applyLanguage() {
    setDiscordTranslation(isArabic());
    applyTranslations();
    applyStyle();
}

// Much of Discord's text is rendered once and never re-read, so switching live leaves a mix of
// both languages. Apply what we can at once, then reload so the whole interface follows.
let reloadTimer: ReturnType<typeof setTimeout> | undefined;
function switchLanguage() {
    applyLanguage();
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => location.reload(), 600);
}

// Earlier versions had two on/off switches instead of the language choice
function migrateOldSettings() {
    const store = settings.store as any;
    if (store.translateDiscord === false) store.uiLanguage = "en";
    delete store.translateDiscord;
    delete store.translatePlugins;
}

function LanguageSettingsPage() {
    const { uiLanguage } = settings.use(["uiLanguage"]);
    return <LanguagePage value={uiLanguage === "en" ? "en" : "ar"} onChange={(v: UiLanguage) => {
        if (v === (settings.store.uiLanguage === "en" ? "en" : "ar")) return;
        settings.store.uiLanguage = v;
        switchLanguage();
    }} />;
}

const LANGUAGE_ENTRY_KEY = "dietydis_language";
const languageEntry = {
    key: LANGUAGE_ENTRY_KEY,
    // Read each time Discord builds its settings sidebar
    get title() { return isArabic() ? "لغة الواجهة" : "Interface Language"; },
    get panelTitle() { return isArabic() ? "لغة الواجهة" : "Interface Language"; },
    Component: ErrorBoundary.wrap(LanguageSettingsPage, { noop: true }),
    Icon: LanguageIcon
};

function cssString(value: string) {
    return `"${value.replace(/["\\]/g, "")}"`;
}

function fontFaces(size: number) {
    const choice = settings.store.arabicFont || "IBM Plex Sans Arabic";
    const face = (src: string, weight: string) => `@font-face {
    font-family: ${cssString(FONT_ALIAS)};
    src: ${src};
    font-weight: ${weight};
    unicode-range: ${ARABIC_RANGE};
    size-adjust: ${size}%;
}
`;

    const bundled = BUNDLED_FONTS[choice];
    if (bundled) {
        // Regular covers 100-500, bold covers 600-900, so Discord's semibold headings get the bold cut
        return face(`url(data:font/woff2;base64,${bundled[400]}) format("woff2")`, "100 500")
            + face(`url(data:font/woff2;base64,${bundled[700]}) format("woff2")`, "600 900");
    }

    const name = (choice === "custom" ? settings.store.customFontName : choice)?.trim();
    return name ? face(`local(${cssString(name)})`, "100 900") : "";
}

function buildCss(originalPrimary: string, originalDisplay: string) {
    const { autoDirection, autoDirectionNames, isolateMentions, customFont, arabicSize } = settings.store;
    let css = "";

    if (isArabic()) {
        css += `${UI_TEXT_SELECTORS.join(",\n")} {\n    unicode-bidi: plaintext;\n}\n`;
    }

    if (autoDirection) {
        css += `${TEXT_SELECTORS.join(",\n")} {\n    unicode-bidi: plaintext;\n    text-align: start;\n}\n`;
    }
    if (autoDirectionNames) {
        css += `${NAME_SELECTORS.join(",\n")} {\n    unicode-bidi: plaintext;\n}\n`;
    }
    if (autoDirection && isolateMentions) {
        css += `${ISOLATE_SELECTORS.join(",\n")} {\n    unicode-bidi: isolate;\n}\n`;
    }

    if (customFont) {
        const faces = fontFaces(Math.round(Number(arabicSize) || 100));
        if (faces) {
            css += faces + `:root, .theme-dark, .theme-light, .theme-midnight, .theme-darker {
    --font-primary: ${cssString(FONT_ALIAS)}, ${originalPrimary || "sans-serif"};
    --font-display: ${cssString(FONT_ALIAS)}, ${originalDisplay || originalPrimary || "sans-serif"};
}
`;
        }
    }

    return css;
}

function applyStyle() {
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        document.head.appendChild(style);
    }
    // Read Discord's own font stacks with our override switched off: they may load after we start
    style.textContent = "";
    const root = getComputedStyle(document.documentElement);
    const primary = root.getPropertyValue("--font-primary").trim();
    const display = root.getPropertyValue("--font-display").trim();
    style.textContent = buildCss(primary, display);
}

// ---- Arabic plugin descriptions (originals kept so they come back when turned off) ----
const originals = new Map<object, string>();

function setDescription(target: { description?: string; }, arabic: string | undefined, translate: boolean) {
    if (!target || !arabic) return;
    if (!originals.has(target)) originals.set(target, target.description ?? "");
    target.description = translate ? arabic : originals.get(target)!;
}

function applyTranslations() {
    const translate = isArabic() && !!Vencord?.Plugins?.plugins;
    const plugins = Vencord?.Plugins?.plugins ?? {};
    for (const [name, t] of Object.entries(pluginTranslations)) {
        const plugin = plugins[name] as any;
        if (!plugin) continue;
        setDescription(plugin, t.d, translate);
        const def = plugin.settings?.def ?? plugin.options ?? {};
        for (const [key, arabic] of Object.entries(t.o ?? {})) setDescription(def[key], arabic, translate);
    }
}

function restoreTranslations() {
    for (const [target, original] of originals) (target as any).description = original;
    originals.clear();
}

export default definePlugin({
    name: "DietyDisArabic",
    description: "Arabic support for DietyDis: interface language, automatic text direction and bundled Arabic fonts",
    authors: [{ name: "DietyDis", id: 0n }],
    // On for new DietyDis users; they can still turn it off in Settings > Plugins
    enabledByDefault: true,
    settings,
    // Only CSS is needed, so start as soon as the page exists (also on the login screen)
    startAt: StartAt.DOMContentLoaded,

    // Untranslated Discord texts seen so far (for the dictionary; also in the settings button)
    getMissingStrings: () => [...missingStrings].sort(),

    start() {
        migrateOldSettings();
        applyLanguage();
        SettingsPlugin.customEntries.push(languageEntry);
        // Discord's stylesheets may still be loading: re-read its fonts once everything is in
        if (document.readyState !== "complete") window.addEventListener("load", applyStyle, { once: true });
    },

    stop() {
        removeFromArray(SettingsPlugin.customEntries, e => e.key === LANGUAGE_ENTRY_KEY);
        window.removeEventListener("load", applyStyle);
        document.getElementById(STYLE_ID)?.remove();
        restoreTranslations();
        stopDiscordTranslation();
    }
});
