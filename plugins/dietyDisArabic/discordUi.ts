/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Arabic for Discord's own interface. Discord has no Arabic locale, so we translate by English text:
// every message is a function (locale) => { locale, ast }, and all UI text goes through a few intl
// methods. We wrap those, and when a message's English text (its reserialized form) is in the
// dictionary we hand Discord an Arabic copy of the message instead.
//
// Message AST pieces: "text" | [1, "arg"] (variable) | [8, "hook", [children]] (rich text/link/bold).
// A translation is used only if it parses and has exactly the same variables and hooks as the
// original, so a wrong entry falls back to English instead of breaking the UI.

import { i18n } from "@webpack/common";

import { discordStrings } from "./discordStrings";

type AstNode = string | [1, string] | [8, string, AstNode[]] | unknown[];
type Message = { locale: string; ast: AstNode[]; reserialize(): string; };
type MessageFn = (locale: string) => Message;

const RLM = "‏";
const METHODS =["string", "format", "formatToPlainString", "formatToMarkdownString", "formatToParts"] as const;
const replacements = new WeakMap<MessageFn, MessageFn | null>();
const originals: Partial<Record<(typeof METHODS)[number], Function>> = {};
export const missingStrings = new Set<string>();

let installed = false;
let enabled = false;
let retryTimer: ReturnType<typeof setInterval> | undefined;

// "{arg}"  "$[children](hook)"  "**bold**"  -> AST
function parse(text: string): AstNode[] | null {
    const out: AstNode[] = [];
    const re = /\{(\w+)\}|\$\[([^\]]*)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
    let last = 0;
    for (let m: RegExpExecArray | null; (m = re.exec(text));) {
        if (m.index > last) out.push(text.slice(last, m.index));
        if (m[1]) out.push([1, m[1]]);
        else if (m[3]) out.push([8, m[3], m[2] ? [m[2]] : []]);
        else if (m[4]) out.push([8, "$b", [m[4]]]);
        last = re.lastIndex;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
}

// The variables and hooks a message uses; anything we can't read makes the message "unsupported"
function signature(ast: AstNode[]): string | null {
    const parts: string[] = [];
    for (const node of ast) {
        if (typeof node === "string") continue;
        if (!Array.isArray(node)) return null;
        if (node[0] === 1 && typeof node[1] === "string") parts.push("{" + node[1] + "}");
        else if (node[0] === 8 && typeof node[1] === "string") parts.push("$" + node[1]);
        else return null; // plural/select and other ICU forms: leave in English
    }
    return parts.sort().join(",");
}

function replacementFor(fn: MessageFn): MessageFn | null {
    if (replacements.has(fn)) return replacements.get(fn)!;
    let result: MessageFn | null = null;
    try {
        const message = fn(i18n.intl.currentLocale);
        const english = message.reserialize();
        const arabic = discordStrings[english];
        if (arabic) {
            const ast = parse(arabic);
            const original = signature(message.ast);
            if (ast && original != null && signature(ast) === original) {
                // Discord's text boxes are left-to-right: invisible right-to-left marks at both ends
                // keep punctuation like "!" and "؟" attached to the Arabic instead of jumping sides
                if (/[؀-ۿ]/.test(arabic)) {
                    if (typeof ast[0] === "string") ast[0] = RLM + ast[0]; else ast.unshift(RLM);
                    const end = ast.length - 1;
                    if (typeof ast[end] === "string") ast[end] += RLM; else ast.push(RLM);
                }
                const copy: Message = Object.create(Object.getPrototypeOf(message));
                copy.locale = message.locale;
                copy.ast = ast;
                result = () => copy;
            }
        } else if (english && signature(message.ast) != null && /[A-Za-z]/.test(english)) {
            missingStrings.add(english);
        }
    } catch { /* not a message we understand: leave it alone */ }
    replacements.set(fn, result);
    return result;
}

function install() {
    const intl = i18n?.intl;
    if (!intl || installed) return !!intl;
    for (const name of METHODS) {
        const original = intl[name];
        if (typeof original !== "function") continue;
        originals[name] = original;
        intl[name] = function (this: any, message: unknown, ...rest: unknown[]) {
            if (enabled && typeof message === "function") {
                const replacement = replacementFor(message as MessageFn);
                if (replacement) return original.call(this, replacement, ...rest);
            }
            return original.call(this, message, ...rest);
        };
    }
    installed = true;
    return true;
}

function uninstall() {
    const intl = i18n?.intl;
    if (!intl || !installed) return;
    for (const name of METHODS) {
        const original = originals[name];
        if (!original) continue;
        // `string` lives on the prototype: drop our own copy; the others were own properties
        if (name === "string") delete intl[name];
        else intl[name] = original;
    }
    installed = false;
}

function refreshUi() {
    // Ask Discord to re-render text that subscribes to locale changes
    try { i18n.intl.emitLocaleChange?.(i18n.intl.currentLocale); } catch { }
}

export function setDiscordTranslation(on: boolean) {
    enabled = on;
    clearInterval(retryTimer);
    if (!on) {
        refreshUi();
        return;
    }
    const tryInstall = () => {
        let ok = false;
        try { ok = install(); } catch { /* i18n module not loaded yet */ }
        if (ok) {
            clearInterval(retryTimer);
            refreshUi();
        }
        return ok;
    };
    if (!tryInstall()) retryTimer = setInterval(tryInstall, 250);
}

export function stopDiscordTranslation() {
    enabled = false;
    clearInterval(retryTimer);
    uninstall();
    refreshUi();
}
