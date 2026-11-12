/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// A visual editor for Vencord themes. It lives as a "Theme Editor" tab in Settings > Themes
// (next to Local and Online Themes; scripts/patch-vencord.mjs adds the tab) and saves real
// .theme.css files into the themes folder, so they show up in Local Themes like any other theme.

import managedStyle from "./styles.css?managed";

import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin from "@utils/types";

import { ThemeEditorTab } from "./Editor";
import { applyPreview, loadStoredDraft, removeStyles, settings } from "./store";

export default definePlugin({
    name: "DietyDisThemeEditor",
    description: "Theme editor in Settings > Themes: colours, background, fonts and more with a live preview, saved as a Vencord theme",
    authors: [{ name: "DietyDis", id: 0n }],
    enabledByDefault: true,
    settings,
    managedStyle,

    /** Rendered by the "Theme Editor" tab in Vencord's Themes settings */
    EditorTab: ErrorBoundary.wrap(ThemeEditorTab, { message: "The theme editor crashed. Try reopening the Themes tab." }),

    start() {
        loadStoredDraft();
        // Keep showing unsaved edits after a restart (if preview is on)
        applyPreview();
    },

    stop() {
        removeStyles();
    }
});
