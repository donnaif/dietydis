/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "dietydis-arabic-style";
const FONT_ALIAS = "DietyDis Arabic";

// Arabic, Arabic Supplement, Arabic Extended-A, Presentation Forms A and B
const ARABIC_RANGE = "U+0600-06FF, U+0750-077F, U+0870-089F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF";

// Discord hashes its class names, so match on the stable part only
const TEXT_SELECTORS = [
    '[class*="messageContent"]',
    '[class*="repliedTextContent"]',
    '[class*="embedTitle"]',
    '[class*="embedDescription"]',
    '[class*="embedFieldValue"]',
    '[class*="threadMessageAccessoryContent"]',
    '[data-slate-editor="true"] [data-slate-node="element"]'
];

const settings = definePluginSettings({
    autoDirection: {
        type: OptionType.BOOLEAN,
        description: "اتجاه تلقائي للنص: العربي من اليمين لليسار والإنجليزي من اليسار لليمين",
        default: true,
        onChange: applyStyle
    },
    customFont: {
        type: OptionType.BOOLEAN,
        description: "استخدام خط خاص للحروف العربية فقط",
        default: true,
        onChange: applyStyle
    },
    arabicFont: {
        type: OptionType.STRING,
        description: "اسم الخط العربي المثبت على جهازك (مثل Segoe UI أو Tahoma أو Noto Naskh Arabic)",
        default: "Segoe UI",
        onChange: applyStyle
    },
    arabicSize: {
        type: OptionType.SLIDER,
        description: "حجم الحروف العربية بالنسبة للإنجليزي (%)",
        markers: [80, 90, 100, 110, 120, 130, 140, 150],
        default: 110,
        stickToMarkers: false,
        onChange: applyStyle
    }
});

let originalPrimary = "";
let originalDisplay = "";

function cssString(value: string) {
    return `"${value.replace(/["\\]/g, "")}"`;
}

function buildCss() {
    const { autoDirection, customFont, arabicFont, arabicSize } = settings.store;
    let css = "";

    if (autoDirection) {
        css += `${TEXT_SELECTORS.join(",\n")} {\n    unicode-bidi: plaintext;\n    text-align: start;\n}\n`;
    }

    const fontName = arabicFont?.trim();
    if (customFont && fontName) {
        const size = Math.round(Number(arabicSize) || 100);
        css += `@font-face {
    font-family: ${cssString(FONT_ALIAS)};
    src: local(${cssString(fontName)});
    unicode-range: ${ARABIC_RANGE};
    size-adjust: ${size}%;
}
:root, .theme-dark, .theme-light, .theme-midnight, .theme-darker {
    --font-primary: ${cssString(FONT_ALIAS)}, ${originalPrimary || "sans-serif"};
    --font-display: ${cssString(FONT_ALIAS)}, ${originalDisplay || originalPrimary || "sans-serif"};
}
`;
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
    style.textContent = buildCss();
}

export default definePlugin({
    name: "DietyDisArabic",
    description: "دعم العربية في DietyDis: اتجاه تلقائي للنص، وخط وحجم خاص للحروف العربية",
    authors: [{ name: "DietyDis", id: 0n }],
    settings,

    start() {
        // Read Discord's own font stacks before we override them
        const root = getComputedStyle(document.documentElement);
        originalPrimary = root.getPropertyValue("--font-primary").trim();
        originalDisplay = root.getPropertyValue("--font-display").trim();
        applyStyle();
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    }
});
