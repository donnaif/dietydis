/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Main-process helpers for the theme editor: Vencord's own uploadTheme only works on the web,
// so the desktop app writes theme files into Vencord's themes folder here.

import { THEMES_DIR } from "@main/utils/constants";
import { dialog, IpcMainInvokeEvent } from "electron";
import { mkdir, readFile, writeFile } from "fs/promises";
import { basename, join } from "path";

const MAX_SIZE = 8 * 1024 * 1024;

// Used by the renderer to find these helpers among VencordNative.pluginHelpers
export function dietydisThemeEditorNative() {
    return true;
}

function safeThemeName(fileName: string) {
    let name = basename(String(fileName)).replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").trim();
    if (!name.toLowerCase().endsWith(".css")) name += ".theme.css";
    if (name === ".theme.css") name = "dietydis-theme.theme.css";
    return name;
}

// Writes a theme into the themes folder; Vencord sees it at once in Local Themes
export async function saveTheme(_: IpcMainInvokeEvent, fileName: string, data: string) {
    if (typeof data !== "string" || data.length > MAX_SIZE) throw new Error("Theme too large");
    const name = safeThemeName(fileName);
    await mkdir(THEMES_DIR, { recursive: true });
    await writeFile(join(THEMES_DIR, name), data, "utf8");
    return name;
}

// "Save as" dialog, to export a theme file anywhere
export async function exportTheme(_: IpcMainInvokeEvent, suggestedName: string, data: string) {
    if (typeof data !== "string" || data.length > MAX_SIZE) throw new Error("Theme too large");
    const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: safeThemeName(suggestedName),
        filters: [{ name: "CSS theme", extensions: ["css"] }]
    });
    if (canceled || !filePath) return null;
    await writeFile(filePath, data, "utf8");
    return filePath;
}

// "Open" dialog, to import a theme file (any .css)
export async function importTheme(_: IpcMainInvokeEvent) {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "CSS theme", extensions: ["css"] }]
    });
    if (canceled || !filePaths[0]) return null;
    const data = await readFile(filePaths[0], "utf8");
    if (data.length > MAX_SIZE) throw new Error("Theme too large");
    return { name: basename(filePaths[0]), data };
}

// Picks an image for the background and returns it as a data URL (so the theme is one file)
export async function pickImage(_: IpcMainInvokeEvent) {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif"] }]
    });
    if (canceled || !filePaths[0]) return null;
    const buf = await readFile(filePaths[0]);
    if (buf.length > 4 * 1024 * 1024) return { error: "too-large" as const };
    const ext = filePaths[0].split(".").pop()!.toLowerCase();
    const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
    return { dataUrl: `data:${mime};base64,${buf.toString("base64")}` };
}
