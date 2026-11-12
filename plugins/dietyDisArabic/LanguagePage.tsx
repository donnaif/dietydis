/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import type { IconProps } from "@utils/types";

export type UiLanguage = "ar" | "en";

const CHOICES: { value: UiLanguage; title: string; detail: string; dir: "rtl" | "ltr"; }[] = [
    {
        value: "ar",
        title: "العربية",
        detail: "واجهة Discord وإضافات DietyDis بالعربي (تجريبي: النصوص غير المترجمة تبقى بالإنجليزي)",
        dir: "rtl"
    },
    {
        value: "en",
        title: "English",
        detail: "Discord's original interface, in English",
        dir: "ltr"
    }
];

export function LanguageIcon({ width = 20, height = 20, className }: IconProps) {
    return (
        <svg width={width} height={height} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    );
}

// Settings > "لغة الواجهة / Interface Language": pick Arabic or Discord's original English.
// Bilingual on purpose, so it reads the same whichever language is active.
export function LanguagePage({ value, onChange }: { value: UiLanguage; onChange(v: UiLanguage): void; }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
                <Heading tag="h3">لغة الواجهة · Interface Language</Heading>
                <Paragraph>اختر لغة واجهة DietyDis. · Choose the language of DietyDis.</Paragraph>
            </div>

            <div role="radiogroup" aria-label="Interface Language" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {CHOICES.map(c => {
                    const selected = value === c.value;
                    return (
                        <div
                            key={c.value}
                            role="radio"
                            aria-checked={selected}
                            tabIndex={0}
                            dir={c.dir}
                            onClick={() => onChange(c.value)}
                            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(c.value); } }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "12px 16px",
                                borderRadius: 8,
                                cursor: "pointer",
                                textAlign: "start",
                                background: selected ? "var(--background-modifier-selected)" : "var(--background-secondary)",
                                border: `2px solid ${selected ? "var(--brand-500)" : "transparent"}`
                            }}
                        >
                            <span
                                aria-hidden="true"
                                style={{
                                    flex: "none",
                                    width: 18,
                                    height: 18,
                                    borderRadius: "50%",
                                    border: `2px solid ${selected ? "var(--brand-500)" : "var(--interactive-normal)"}`,
                                    boxShadow: selected ? "inset 0 0 0 3px var(--background-secondary), inset 0 0 0 9px var(--brand-500)" : "none"
                                }}
                            />
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--header-primary)" }}>{c.title}</div>
                                <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{c.detail}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Paragraph>
                عند تغيير اللغة يُعاد تحميل Discord تلقائياً لتتغير الواجهة كلها. الخطوط العربية واتجاه النص تبقى تعمل في اللغتين.
                <br />
                Changing the language reloads Discord so the whole interface switches. Arabic fonts and text direction keep working in both.
            </Paragraph>
        </div>
    );
}
