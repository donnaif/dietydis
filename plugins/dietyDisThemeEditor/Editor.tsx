/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import editorStyle from "./styles.css?managed";

import { Settings } from "@api/Settings";
import { enableStyle } from "@api/Styles";
import { Button } from "@components/Button";
import { PluginNative } from "@utils/types";
import { showToast, TabBar, useEffect, useMemo, useState } from "@webpack/common";

import {
    buildCss, buildThemeFile, CODE_FONTS, COLOR_DEFS, ColorDef, css, FONTS, GROUPS, hasEditorData, HIDE_DEFS,
    newDraft, parseHex, readThemeFile, TEMPLATES, ThemeDraft, themeFileName, toHex
} from "./model";
import {
    applyPreview, canRedo, canUndo, ensureLoaded, getDefaults, isArabic, notify, patchQuietly, readDefaults, redo, replaceDraft,
    settings, t, undo, update, useDraft
} from "./store";

type Native = PluginNative<typeof import("./native")>;
const native = () => Object.values(VencordNative.pluginHelpers)
    .find(m => (m as any).dietydisThemeEditorNative) as Native | undefined;

const ok = (msg: string) => showToast({ text: msg, variant: "success" });
const fail = (msg: string) => showToast({ text: msg, variant: "critical" });

// ---------------------------------------------------------------- small inputs

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string; }) {
    return (
        <label className="dd-te-field">
            <span className="dd-te-label">{label}</span>
            {children}
            {hint && <span className="dd-te-hint">{hint}</span>}
        </label>
    );
}

function Range({ value, min, max, step = 1, unit = "", onChange }: { value: number; min: number; max: number; step?: number; unit?: string; onChange(v: number): void; }) {
    return (
        <div className="dd-te-range">
            <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.currentTarget.value))} />
            <span className="dd-te-range-value">{value}{unit}</span>
        </div>
    );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange(v: boolean): void; label: string; }) {
    return (
        <label className="dd-te-toggle">
            <input type="checkbox" checked={checked} onChange={e => onChange(e.currentTarget.checked)} />
            <span>{label}</span>
        </label>
    );
}

// ---------------------------------------------------------------- colour row

function ColorRow({ def, draft }: { def: ColorDef; draft: ThemeDraft; }) {
    const value = draft.colors[def.key];
    const parsed = parseHex(value);
    const fallback = getDefaults()[def.vars[0]] ?? "#000000";
    const shown = parsed ?? parseHex(fallback) ?? { r: 0, g: 0, b: 0, a: 1 };
    const [text, setText] = useState(value ?? "");
    useEffect(() => setText(value ?? ""), [value]);

    const set = (hex: string | undefined, coalesce?: string) => update(d => {
        if (hex) d.colors[def.key] = hex; else delete d.colors[def.key];
    }, coalesce);

    return (
        <div className={"dd-te-color" + (parsed ? "" : " dd-te-color-default")}>
            <span className="dd-te-color-name">{t(def.ar, def.en)}</span>
            <span className="dd-te-swatch" style={{ background: css(shown) }}>
                <input
                    type="color"
                    aria-label={t(def.ar, def.en)}
                    value={toHex({ ...shown, a: 1 }).slice(0, 7)}
                    onChange={e => {
                        const c = parseHex(e.currentTarget.value)!;
                        set(toHex({ ...c, a: shown.a }), "color-" + def.key);
                    }}
                />
            </span>
            <input
                className="dd-te-hex"
                dir="ltr"
                spellCheck={false}
                value={text}
                placeholder={fallback}
                onChange={e => {
                    const v = e.currentTarget.value.trim();
                    setText(v);
                    if (!v) set(undefined);
                    else if (parseHex(v)) set(v.startsWith("#") ? v : "#" + v, "hex-" + def.key);
                }}
            />
            <input
                className="dd-te-alpha"
                type="range"
                min={0}
                max={100}
                title={t("الشفافية", "Opacity")}
                aria-label={t("الشفافية", "Opacity")}
                value={Math.round(shown.a * 100)}
                onChange={e => set(toHex({ ...shown, a: Number(e.currentTarget.value) / 100 }), "alpha-" + def.key)}
            />
            <button
                className="dd-te-reset"
                title={t("استرجاع لون Discord", "Back to Discord's colour")}
                aria-label={t("استرجاع لون Discord", "Back to Discord's colour")}
                disabled={!parsed}
                onClick={() => set(undefined)}
            >↺</button>
        </div>
    );
}

// ---------------------------------------------------------------- preview card

function PreviewCard() {
    return (
        <div className="dd-te-mock" dir="ltr" aria-hidden="true">
            <div className="dd-te-mock-servers">
                <span className="dd-te-mock-guild dd-te-mock-guild-active" />
                <span className="dd-te-mock-guild" />
                <span className="dd-te-mock-guild" />
            </div>
            <div className="dd-te-mock-sidebar">
                <div className="dd-te-mock-heading">DietyDis</div>
                <div className="dd-te-mock-channel dd-te-mock-channel-selected"># {t("عام", "general")}</div>
                <div className="dd-te-mock-channel dd-te-mock-channel-hover"># {t("الألعاب", "gaming")}</div>
                <div className="dd-te-mock-channel"># {t("الصور", "media")}</div>
                <div className="dd-te-mock-user">
                    <span className="dd-te-mock-avatar"><span className="dd-te-mock-status" /></span>
                    <span>{t("أحمد", "Ahmed")}</span>
                </div>
            </div>
            <div className="dd-te-mock-chat">
                <div className="dd-te-mock-message">
                    <span className="dd-te-mock-avatar" />
                    <div dir="auto">
                        <div><span className="dd-te-mock-author">{t("سارة", "Sara")}</span> <span className="dd-te-mock-time">{t("اليوم 9:41", "Today 9:41")}</span></div>
                        <div className="dd-te-mock-text">
                            {t("أهلاً ", "Hey ")}<span className="dd-te-mock-mention">@{t("أحمد", "Ahmed")}</span>
                            {t("، شوف هذا ", ", check this ")}<span className="dd-te-mock-link">dietydis.app</span>
                        </div>
                        <div className="dd-te-mock-muted">{t("نص خافت", "muted text")}</div>
                    </div>
                </div>
                <div className="dd-te-mock-popout">
                    <div className="dd-te-mock-strong">{t("قائمة", "Menu")}</div>
                    <span className="dd-te-mock-button">{t("زر", "Button")}</span>
                </div>
                <div className="dd-te-mock-input">{t("اكتب رسالة…", "Message #general")}</div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- sections

function StartSection({ draft }: { draft: ThemeDraft; }) {
    const [mine, setMine] = useState<{ fileName: string; name: string; }[]>([]);

    const refresh = async () => {
        try {
            const list = await VencordNative.themes.getThemesList();
            const out: { fileName: string; name: string; }[] = [];
            for (const theme of list) {
                const data = await VencordNative.themes.getThemeData(theme.fileName);
                if (data && hasEditorData(data)) out.push({ fileName: theme.fileName, name: theme.name || theme.fileName });
            }
            setMine(out);
        } catch { setMine([]); }
    };
    useEffect(() => { refresh(); }, []);

    const meta = (key: keyof ThemeDraft["meta"], value: string) => update(d => { d.meta[key] = value; }, "meta-" + key);

    const openFile = async (fileName: string) => {
        const data = await VencordNative.themes.getThemeData(fileName);
        const parsed = data && readThemeFile(data);
        if (!parsed) return fail(t("تعذّر فتح الثيم", "Couldn't open the theme"));
        replaceDraft({ ...parsed, fileName });
        ok(t("فُتح الثيم للتعديل", "Theme opened for editing"));
    };

    const importFile = async () => {
        try {
            const res = await native()?.importTheme();
            if (!res) return;
            const parsed = readThemeFile(res.data);
            if (parsed) replaceDraft({ ...parsed, fileName: undefined });
            else {
                // A theme from elsewhere: keep its CSS as custom CSS on top of a fresh theme
                const d = newDraft();
                d.meta.name = res.name.replace(/\.theme\.css$|\.css$/i, "");
                d.customCss = res.data;
                replaceDraft(d);
            }
            ok(t("تم استيراد الثيم", "Theme imported"));
        } catch (e) {
            fail(String(e));
        }
    };

    return (
        <div className="dd-te-section">
            <h3 className="dd-te-h">{t("معلومات الثيم", "Theme details")}</h3>
            <div className="dd-te-grid2">
                <Field label={t("الاسم", "Name")}>
                    <input className="dd-te-input" value={draft.meta.name} placeholder={t("ثيمي", "My theme")} onChange={e => meta("name", e.currentTarget.value)} />
                </Field>
                <Field label={t("المؤلف", "Author")}>
                    <input className="dd-te-input" value={draft.meta.author} onChange={e => meta("author", e.currentTarget.value)} />
                </Field>
                <Field label={t("الوصف", "Description")}>
                    <input className="dd-te-input" value={draft.meta.description} onChange={e => meta("description", e.currentTarget.value)} />
                </Field>
                <Field label={t("النسخة", "Version")}>
                    <input className="dd-te-input" dir="ltr" value={draft.meta.version} onChange={e => meta("version", e.currentTarget.value)} />
                </Field>
            </div>

            <h3 className="dd-te-h">{t("ابدأ من قالب", "Start from a template")}</h3>
            <p className="dd-te-hint">{t("القالب يستبدل الألوان فقط، ويمكنك التراجع عنه.", "A template replaces the colours only, and can be undone.")}</p>
            <div className="dd-te-templates">
                {TEMPLATES.map(tp => (
                    <button key={tp.key} className="dd-te-template" onClick={() => update(d => { d.colors = { ...tp.colors }; })}>
                        <span className="dd-te-template-swatches">
                            {["serverList", "sidebar", "chat", "brand"].map(k => (
                                <span key={k} style={{ background: tp.colors[k] ?? getDefaults()[COLOR_DEFS.find(c => c.key === k)!.vars[0]] }} />
                            ))}
                        </span>
                        <span>{t(tp.ar, tp.en)}</span>
                    </button>
                ))}
            </div>

            <h3 className="dd-te-h">{t("ثيماتي", "My themes")}</h3>
            {mine.length === 0
                ? <p className="dd-te-hint">{t("الثيمات التي تحفظها من المحرر تظهر هنا لتعديلها لاحقاً.", "Themes you save from the editor show up here, to edit later.")}</p>
                : (
                    <div className="dd-te-list">
                        {mine.map(m => (
                            <div key={m.fileName} className="dd-te-list-item">
                                <span>{m.name} <span className="dd-te-hint" dir="ltr">{m.fileName}</span></span>
                                <Button size="small" variant="secondary" onClick={() => openFile(m.fileName)}>{t("تعديل", "Edit")}</Button>
                            </div>
                        ))}
                    </div>
                )}
            <div className="dd-te-buttons">
                <Button size="small" variant="secondary" onClick={() => replaceDraft(newDraft())}>{t("ثيم جديد", "New theme")}</Button>
                <Button size="small" variant="secondary" onClick={importFile}>{t("استيراد ملف CSS", "Import a CSS file")}</Button>
                <Button size="small" variant="secondary" onClick={refresh}>{t("تحديث القائمة", "Refresh list")}</Button>
            </div>
        </div>
    );
}

function ColorsSection({ draft }: { draft: ThemeDraft; }) {
    return (
        <div className="dd-te-section">
            <p className="dd-te-hint">
                {t("اللون الرمادي يعني أن Discord يستخدم لونه الأصلي. اكتب كود اللون (مثل #1e1f22 أو #1e1f2280 مع الشفافية)، أو اضغط المربع لاختياره.",
                    "Greyed out means Discord's own colour is used. Type a colour code (like #1e1f22, or #1e1f2280 with opacity) or click the square to pick one.")}
            </p>
            {GROUPS.map(g => (
                <div key={g.key}>
                    <h3 className="dd-te-h">{t(g.ar, g.en)}</h3>
                    {COLOR_DEFS.filter(c => c.group === g.key).map(def => <ColorRow key={def.key} def={def} draft={draft} />)}
                </div>
            ))}
        </div>
    );
}

function BackgroundSection({ draft }: { draft: ThemeDraft; }) {
    const bg = draft.background;
    const set = <K extends keyof ThemeDraft["background"]>(k: K, v: ThemeDraft["background"][K]) => update(d => { d.background[k] = v; }, "bg-" + k);
    const [url, setUrl] = useState(bg.image.startsWith("data:") ? "" : bg.image);

    const pick = async () => {
        try {
            const res = await native()?.pickImage();
            if (!res) return;
            if ("error" in res) return fail(t("الصورة أكبر من 4 ميجابايت", "The image is larger than 4 MB"));
            update(d => { d.background.type = "image"; d.background.image = res.dataUrl; });
        } catch (e) { fail(String(e)); }
    };

    return (
        <div className="dd-te-section">
            <div className="dd-te-segmented" role="radiogroup">
                {([["none", "بدون", "None"], ["image", "صورة", "Image"], ["gradient", "تدرّج لوني", "Gradient"]] as const).map(([v, ar, en]) => (
                    <button key={v} role="radio" aria-checked={bg.type === v} className={bg.type === v ? "dd-te-on" : ""} onClick={() => set("type", v)}>{t(ar, en)}</button>
                ))}
            </div>

            {bg.type === "image" && (
                <>
                    <div className="dd-te-buttons">
                        <Button size="small" onClick={pick}>{t("اختيار صورة من جهازك", "Choose an image")}</Button>
                        {bg.image && <Button size="small" variant="dangerSecondary" onClick={() => update(d => { d.background.image = ""; })}>{t("إزالة الصورة", "Remove image")}</Button>}
                    </div>
                    <Field label={t("أو رابط صورة", "Or an image link")} hint={t("الصورة من جهازك تُحفظ داخل ملف الثيم، فيعمل عند أي شخص.", "An image from your computer is stored inside the theme file, so it works for anyone.")}>
                        <input
                            className="dd-te-input"
                            dir="ltr"
                            value={url}
                            placeholder="https://…"
                            onChange={e => {
                                const v = e.currentTarget.value.trim();
                                setUrl(v);
                                if (/^https:\/\/\S+$/i.test(v)) update(d => { d.background.image = v; }, "bg-url");
                            }}
                        />
                    </Field>
                    {bg.image && <div className="dd-te-thumb" style={{ backgroundImage: `url("${bg.image.replace(/"/g, "%22")}")` }} />}
                </>
            )}

            {bg.type === "gradient" && (
                <div className="dd-te-grid2">
                    <Field label={t("من", "From")}>
                        <input type="color" className="dd-te-colorbox" value={(parseHex(bg.from) ? toHex({ ...parseHex(bg.from)!, a: 1 }) : "#000000").slice(0, 7)} onChange={e => set("from", e.currentTarget.value)} />
                    </Field>
                    <Field label={t("إلى", "To")}>
                        <input type="color" className="dd-te-colorbox" value={(parseHex(bg.to) ? toHex({ ...parseHex(bg.to)!, a: 1 }) : "#000000").slice(0, 7)} onChange={e => set("to", e.currentTarget.value)} />
                    </Field>
                    <Field label={t("الزاوية", "Angle")}>
                        <Range value={bg.angle} min={0} max={360} unit="°" onChange={v => set("angle", v)} />
                    </Field>
                </div>
            )}

            {bg.type !== "none" && (
                <div className="dd-te-grid2">
                    <Field label={t("شفافية اللوحات فوق الخلفية", "Panel opacity over the background")} hint={t("أقل = الخلفية أوضح", "Lower = background shows more")}>
                        <Range value={bg.panelOpacity} min={0} max={100} unit="%" onChange={v => set("panelOpacity", v)} />
                    </Field>
                    <Field label={t("التمويه", "Blur")}>
                        <Range value={bg.blur} min={0} max={30} unit="px" onChange={v => set("blur", v)} />
                    </Field>
                    <Field label={t("التعتيم", "Darken")}>
                        <Range value={bg.dim} min={0} max={90} unit="%" onChange={v => set("dim", v)} />
                    </Field>
                </div>
            )}
        </div>
    );
}

function FontSelect({ value, options, onChange }: { value: string; options: string[]; onChange(v: string): void; }) {
    const custom = value !== "" && !options.includes(value);
    const [other, setOther] = useState(custom);
    return (
        <div className="dd-te-fontpick">
            <select className="dd-te-input" value={other ? "__other" : value} onChange={e => {
                const v = e.currentTarget.value;
                if (v === "__other") { setOther(true); return; }
                setOther(false);
                onChange(v);
            }}>
                {options.map(o => <option key={o} value={o} style={o ? { fontFamily: o } : undefined}>{o || t("خط Discord الأصلي", "Discord's font")}</option>)}
                <option value="__other">{t("خط آخر مثبت على جهازك…", "Another installed font…")}</option>
            </select>
            {other && <input className="dd-te-input" dir="ltr" value={value} placeholder={t("اسم الخط", "Font name")} onChange={e => onChange(e.currentTarget.value)} />}
        </div>
    );
}

function ShapeSection({ draft }: { draft: ThemeDraft; }) {
    const set = <K extends keyof ThemeDraft["shape"]>(k: K, v: ThemeDraft["shape"][K]) => update(d => { d.shape[k] = v; }, "shape-" + k);
    return (
        <div className="dd-te-section">
            <Field label={t("استدارة الحواف", "Corner roundness")} hint={t("100% = مثل Discord، 0% = حواف حادة", "100% = like Discord, 0% = sharp corners")}>
                <Range value={draft.shape.radius} min={0} max={200} step={5} unit="%" onChange={v => set("radius", v)} />
            </Field>
            <Field label={t("خط الواجهة", "Interface font")} hint={t("للحروف الإنجليزية. الحروف العربية تبقى بالخط المختار في إعدادات DietyDisArabic.", "For Latin letters. Arabic letters keep the font chosen in DietyDisArabic.")}>
                <FontSelect value={draft.shape.font} options={FONTS} onChange={v => set("font", v)} />
            </Field>
            <Field label={t("خط الأكواد", "Code font")}>
                <FontSelect value={draft.shape.codeFont} options={CODE_FONTS} onChange={v => set("codeFont", v)} />
            </Field>
        </div>
    );
}

function HideSection({ draft }: { draft: ThemeDraft; }) {
    return (
        <div className="dd-te-section">
            <p className="dd-te-hint">{t("تجريبي: إذا غيّر Discord واجهته قد يتوقف إخفاء بعض العناصر.", "Beta: some of these may stop working when Discord changes its interface.")}</p>
            {HIDE_DEFS.map(h => (
                <Toggle key={h.key} label={t(h.ar, h.en)} checked={!!draft.hide[h.key]} onChange={v => update(d => { d.hide[h.key] = v; })} />
            ))}
        </div>
    );
}

function CodeSection({ draft }: { draft: ThemeDraft; }) {
    const generated = useMemo(() => buildCss({ ...draft, customCss: "" }, getDefaults()), [draft]);
    return (
        <div className="dd-te-section">
            <Field label={t("CSS خاص بك (يُضاف بعد ما يولّده المحرر)", "Your own CSS (added after what the editor generates)")}>
                <textarea
                    className="dd-te-code"
                    dir="ltr"
                    spellCheck={false}
                    rows={12}
                    value={draft.customCss}
                    placeholder={"/* .some-class { color: red; } */"}
                    onKeyDown={e => {
                        if (e.key !== "Tab") return;
                        e.preventDefault();
                        const el = e.currentTarget;
                        const { selectionStart: s, selectionEnd: en } = el;
                        const v = el.value.slice(0, s) + "    " + el.value.slice(en);
                        update(d => { d.customCss = v; }, "css");
                        requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 4; });
                    }}
                    onChange={e => { const v = e.currentTarget.value; update(d => { d.customCss = v; }, "css"); }}
                />
            </Field>
            <Field label={t("CSS الذي ولّده المحرر", "CSS generated by the editor")}>
                <textarea className="dd-te-code" dir="ltr" readOnly rows={12} value={generated.length > 20000 ? generated.replace(/url\("data:[^"]{200,}"\)/g, 'url("data:… (image)")') : generated} />
            </Field>
            <div className="dd-te-buttons">
                <Button size="small" variant="secondary" onClick={() => { navigator.clipboard.writeText(buildCss(draft, getDefaults())); ok(t("تم النسخ", "Copied")); }}>{t("نسخ CSS كاملاً", "Copy all CSS")}</Button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- the tab

const enum Section { START, COLORS, BACKGROUND, SHAPE, HIDE, CODE }

export function ThemeEditorTab() {
    const draft = useDraft();
    const [section, setSection] = useState(Section.START);
    const [, setTick] = useState(0);
    const live = settings.store.livePreview;

    useEffect(() => {
        enableStyle(editorStyle);
        ensureLoaded();
        notify();
        readDefaults();
        applyPreview();
        setTick(x => x + 1);
    }, []);

    const enabledThemes = Settings.enabledThemes ?? [];
    const fileActive = !!draft.fileName && enabledThemes.includes(draft.fileName);

    const save = async () => {
        const n = native();
        if (!n) return fail(t("الحفظ غير متاح", "Saving isn't available"));
        if (!draft.meta.name.trim()) {
            setSection(Section.START);
            return fail(t("اكتب اسماً للثيم أولاً", "Give the theme a name first"));
        }
        try {
            const name = await n.saveTheme(themeFileName(draft), buildThemeFile(draft, getDefaults()));
            patchQuietly(d => { d.fileName = name; });
            const enabled = Settings.enabledThemes ?? [];
            if (!enabled.includes(name)) Settings.enabledThemes = [...enabled, name];
            // The saved file takes over from the preview
            settings.store.livePreview = false;
            applyPreview();
            setTick(x => x + 1);
            ok(t(`حُفظ في الثيمات المحلية: ${name}`, `Saved to Local Themes: ${name}`));
        } catch (e) {
            fail(String(e));
        }
    };

    const exportFile = async () => {
        try {
            const path = await native()?.exportTheme(themeFileName(draft), buildThemeFile(draft, getDefaults()));
            if (path) ok(t("تم تصدير الثيم", "Theme exported"));
        } catch (e) { fail(String(e)); }
    };

    const status = fileActive
        ? t(`مفعّل من الثيمات المحلية (${draft.fileName})`, `Active from Local Themes (${draft.fileName})`)
        : live
            ? t("تعديلات غير محفوظة، والمعاينة تعمل على Discord", "Unsaved edits, previewing on Discord")
            : t("المعاينة متوقفة", "Preview is off");

    return (
        <div className="dd-te" dir={isArabic() ? "rtl" : "ltr"}>
            <div className="dd-te-toolbar">
                <Button size="small" variant="secondary" disabled={!canUndo()} onClick={undo} title={t("تراجع", "Undo")}>↶ {t("تراجع", "Undo")}</Button>
                <Button size="small" variant="secondary" disabled={!canRedo()} onClick={redo} title={t("إعادة", "Redo")}>↷ {t("إعادة", "Redo")}</Button>
                <Toggle
                    label={t("معاينة على Discord", "Preview on Discord")}
                    checked={live && !fileActive}
                    onChange={v => {
                        settings.store.livePreview = v;
                        applyPreview();
                        setTick(x => x + 1);
                    }}
                />
                <span className="dd-te-spacer" />
                <Button size="small" variant="secondary" onClick={exportFile}>{t("تصدير", "Export")}</Button>
                <Button size="small" variant="secondary" onClick={() => VencordNative.themes.openFolder()}>{t("مجلد الثيمات", "Themes folder")}</Button>
                <Button size="small" variant="positive" onClick={save}>{t("حفظ في الثيمات", "Save to themes")}</Button>
            </div>
            <div className="dd-te-status">{status}</div>

            <PreviewCard />

            <TabBar type="top" look="brand" className="vc-settings-tab-bar" selectedItem={section} onItemSelect={setSection}>
                <TabBar.Item className="vc-settings-tab-bar-item" id={Section.START}>{t("البداية", "Start")}</TabBar.Item>
                <TabBar.Item className="vc-settings-tab-bar-item" id={Section.COLORS}>{t("الألوان", "Colours")}</TabBar.Item>
                <TabBar.Item className="vc-settings-tab-bar-item" id={Section.BACKGROUND}>{t("الخلفية", "Background")}</TabBar.Item>
                <TabBar.Item className="vc-settings-tab-bar-item" id={Section.SHAPE}>{t("الشكل والخطوط", "Shape & fonts")}</TabBar.Item>
                <TabBar.Item className="vc-settings-tab-bar-item" id={Section.HIDE}>{t("إخفاء عناصر", "Hide parts")}</TabBar.Item>
                <TabBar.Item className="vc-settings-tab-bar-item" id={Section.CODE}>{t("الكود", "Code")}</TabBar.Item>
            </TabBar>

            {section === Section.START && <StartSection draft={draft} />}
            {section === Section.COLORS && <ColorsSection draft={draft} />}
            {section === Section.BACKGROUND && <BackgroundSection draft={draft} />}
            {section === Section.SHAPE && <ShapeSection draft={draft} />}
            {section === Section.HIDE && <HideSection draft={draft} />}
            {section === Section.CODE && <CodeSection draft={draft} />}
        </div>
    );
}
