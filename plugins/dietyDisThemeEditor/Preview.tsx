/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// A small, live copy of Discord that shows the theme being edited: colours, the background
// image or gradient (blur, dim, saturation, fit), see-through panels, the window effect,
// the Home icon, icon shapes, corner radius, fonts and hidden parts.
// The theme's variables are set on .dd-te-mock by store.applyPreview().

import { React, useEffect, useRef, useState } from "@webpack/common";

import { backgroundLayer, homeImage, SHAPE_RADIUS, ThemeDraft } from "./model";
import { settings, t, useFocus } from "./store";

export type WinEffect = "none" | "transparent" | "mica" | "acrylic" | "tabbed";
type View = "server" | "home" | "popup";
type Size = "small" | "large";

// Natural size of the mock; it is scaled to fit the editor
const W = 960;
const H = 520;

// ---------------------------------------------------------------- icons

const P = {
    hash: "M10.99 3.16A1 1 0 1 0 9 2.84L8.15 8H4a1 1 0 0 0 0 2h3.82l-.67 4H3a1 1 0 1 0 0 2h3.82l-.8 4.84a1 1 0 0 0 1.97.32L8.85 16h4.97l-.8 4.84a1 1 0 0 0 1.97.32l.86-5.16H20a1 1 0 1 0 0-2h-3.82l.67-4H21a1 1 0 1 0 0-2h-3.82l.8-4.84a1 1 0 1 0-1.97-.32L15.15 8h-4.97l.8-4.84ZM14.15 14l.67-4H9.85l-.67 4h4.97Z",
    speaker: "M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM15.1 20.75c-.58.14-1.1-.33-1.1-.92v-.03c0-.5.37-.92.85-1.05a7 7 0 0 0 0-13.5A1.11 1.11 0 0 1 14 4.2v-.03c0-.6.52-1.06 1.1-.92a9 9 0 0 1 0 17.5Z",
    mic: "M12 2a4 4 0 0 0-4 4v4a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4ZM6 10a1 1 0 0 0-2 0 8 8 0 0 0 7 7.94V21H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-3.06A8 8 0 0 0 20 10a1 1 0 1 0-2 0 6 6 0 0 1-12 0Z",
    headset: "M12 3a9 9 0 0 0-9 9v7a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5v-1a7 7 0 0 1 14 0v1h-1a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9Z",
    gear: "M10.56 1.1c-.46.05-.7.53-.64.98.18 1.16-.19 2.2-.98 2.53-.8.33-1.79-.15-2.49-1.1-.27-.36-.78-.52-1.14-.24-.77.59-1.45 1.27-2.04 2.04-.28.36-.12.87.24 1.14.96.7 1.43 1.7 1.1 2.49-.33.8-1.37 1.16-2.53.98-.45-.07-.93.18-.99.64a11.1 11.1 0 0 0 0 2.88c.06.46.54.7.99.64 1.16-.18 2.2.19 2.53.98.33.8-.14 1.79-1.1 2.49-.36.27-.52.78-.24 1.14.59.77 1.27 1.45 2.04 2.04.36.28.87.12 1.14-.24.7-.95 1.7-1.43 2.49-1.1.8.33 1.16 1.37.98 2.53-.07.45.18.93.64.99a11.1 11.1 0 0 0 2.88 0c.46-.06.7-.54.64-.99-.18-1.16.19-2.2.98-2.53.8-.33 1.79.14 2.49 1.1.27.36.78.52 1.14.24.77-.59 1.45-1.27 2.04-2.04.28-.36.12-.87-.24-1.14-.96-.7-1.43-1.7-1.1-2.49.33-.8 1.37-1.16 2.53-.98.45.07.93-.18.99-.64a11.1 11.1 0 0 0 0-2.88c-.06-.46-.54-.7-.99-.64-1.16.18-2.2-.19-2.53-.98-.33-.8.14-1.79 1.1-2.49.36-.27.52-.78.24-1.14a11.07 11.07 0 0 0-2.04-2.04c-.36-.28-.87-.12-1.14.24-.7.96-1.7 1.43-2.49 1.1-.8-.33-1.16-1.37-.98-2.53.07-.45-.18-.93-.64-.99a11.1 11.1 0 0 0-2.88 0ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
    plus: "M13 5a1 1 0 1 0-2 0v6H5a1 1 0 1 0 0 2h6v6a1 1 0 1 0 2 0v-6h6a1 1 0 1 0 0-2h-6V5Z",
    compass: "M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm4.24-15.24-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
    download: "M12 2a1 1 0 0 1 1 1v10.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.42l3.3 3.3V3a1 1 0 0 1 1-1ZM3 20a1 1 0 1 0 0 2h18a1 1 0 1 0 0-2H3Z",
    gift: "M4 6a4 4 0 0 1 4-4h.09c1.8 0 3.04 1.09 3.91 2.33C12.87 3.1 14.1 2 15.91 2H16a4 4 0 0 1 3.46 6H20a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1c0-1.1.9-2 2-2h.54A3.98 3.98 0 0 1 4 6Zm6.84 2c-.4-1.07-.85-2.03-1.38-2.72C8.87 4.48 8.43 4 8.09 4H8a2 2 0 1 0 0 4h2.84Zm2.32 0H16a2 2 0 1 0 0-4h-.09c-.34 0-.78.48-1.37 1.28-.53.69-.98 1.65-1.38 2.72ZM11 14H3v6a2 2 0 0 0 2 2h6v-8Zm2 8v-8h8v6a2 2 0 0 1-2 2h-6Z",
    smile: "M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22ZM6.5 13a1 1 0 0 1 1.34.45 4.65 4.65 0 0 0 8.32 0 1 1 0 1 1 1.79.9 6.65 6.65 0 0 1-11.9 0A1 1 0 0 1 6.5 13ZM9 10.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm7.5 1.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
    apps: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    people: "M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 21c0-4.42 3.58-8 8-8h4c4.42 0 8 3.58 8 8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1ZM6.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 18.5a6 6 0 0 1 4.37-5.78A9.97 9.97 0 0 0 1.07 20 1 1 0 0 1 2 18.5Z",
    nitro: "M15 2a7 7 0 1 1 0 14h-3l-4 5v-5H6a3 3 0 0 1 0-6h1.1A7 7 0 0 1 15 2Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
    shop: "M2.63 4.19A3 3 0 0 1 5.53 2H18.47a3 3 0 0 1 2.9 2.19L22 6.5V8a3 3 0 0 1-2 2.83V20a2 2 0 0 1-2 2h-3v-6h-6v6H6a2 2 0 0 1-2-2v-9.17A3 3 0 0 1 2 8V6.5l.63-2.31Z",
    quest: "M7 2a1 1 0 0 0-1 1v1H4a1 1 0 0 0-1 1v3a4 4 0 0 0 3.54 3.97A6 6 0 0 0 11 15.9V19H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-3.1a6 6 0 0 0 4.46-3.93A4 4 0 0 0 21 8V5a1 1 0 0 0-1-1h-2V3a1 1 0 0 0-1-1H7Z",
    search: "M15.62 17.03a9 9 0 1 1 1.41-1.41l4.68 4.67a1 1 0 0 1-1.42 1.42l-4.67-4.68ZM17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
    bell: "M9.7 2.89c.18-.07.32-.24.37-.43a2 2 0 0 1 3.86 0c.05.2.19.36.38.43A7 7 0 0 1 19 9.5v2.09c0 .12.05.24.13.33l1.1 1.22a3 3 0 0 1 .77 2.01v.28c0 .67-.34 1.29-.95 1.56-1.31.6-4 1.51-8.05 1.51-4.05 0-6.74-.91-8.05-1.5-.61-.28-.95-.9-.95-1.57v-.28a3 3 0 0 1 .77-2l1.1-1.23a.5.5 0 0 0 .13-.33V9.5a7 7 0 0 1 4.7-6.61ZM9.18 19.84A.16.16 0 0 0 9 20a3 3 0 1 0 6 0c0-.1-.09-.17-.18-.16a24.86 24.86 0 0 1-5.64 0Z",
    pin: "M19.38 11.38a3 3 0 0 0 4.24 0l.03-.03a.5.5 0 0 0 0-.7L13.35.35a.5.5 0 0 0-.7 0l-.03.03a3 3 0 0 0 0 4.24L13 5l-2.92 2.92-3.65-.34a2 2 0 0 0-1.6.58l-.62.63a1 1 0 0 0 0 1.42l9.58 9.58a1 1 0 0 0 1.42 0l.63-.63a2 2 0 0 0 .58-1.6l-.34-3.64L19 11l.38.38ZM9.07 17.07a.5.5 0 0 1-.08.77l-5.15 3.43a.5.5 0 0 1-.63-.06l-.42-.42a.5.5 0 0 1-.06-.63L6.16 15a.5.5 0 0 1 .77-.08l2.14 2.14Z",
    chevron: "M5.3 9.3a1 1 0 0 1 1.4 0l5.3 5.29 5.3-5.3a1 1 0 1 1 1.4 1.42l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.42Z",
    discord: "M19.7 5.3A17 17 0 0 0 15.4 4l-.5 1.1a15.6 15.6 0 0 0-5.8 0L8.6 4a17 17 0 0 0-4.3 1.3C1.6 9.4.9 13.3 1.2 17.2A17.2 17.2 0 0 0 6.5 20l1.1-1.8a11 11 0 0 1-1.7-.8l.4-.3a12.2 12.2 0 0 0 11.4 0l.4.3a11 11 0 0 1-1.7.8l1.1 1.8a17.1 17.1 0 0 0 5.3-2.8c.4-4.5-.7-8.4-3.1-11.9ZM8.5 14.8c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.8 2.2-1.9 2.2Zm7 0c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.8 2.2-1.9 2.2Z"
};

function I({ d, size = 18 }: { d: string; size?: number; }) {
    return <svg className="dd-pv-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fillRule="evenodd" d={d} /></svg>;
}

// ---------------------------------------------------------------- people

const PEOPLE = {
    sara: { ar: "سارة", en: "Sara", color: "#e0679a", status: "online" },
    ahmed: { ar: "أحمد", en: "Ahmed", color: "#4c8df6", status: "idle" },
    omar: { ar: "عمر", en: "Omar", color: "#2fa774", status: "dnd" },
    lina: { ar: "لينا", en: "Lina", color: "#d9952b", status: "online" },
    bot: { ar: "DietyBot", en: "DietyBot", color: "#7b5cff", status: "online" }
} as const;
type Who = keyof typeof PEOPLE;

const name = (w: Who) => t(PEOPLE[w].ar, PEOPLE[w].en);

function Avatar({ who, size = 32, status = true, ring = "--background-base-lower" }: { who: Who; size?: number; status?: boolean; ring?: string; }) {
    const p = PEOPLE[who];
    const s = p.status;
    return (
        <span className="dd-pv-avatar" style={{ width: size, height: size, background: p.color, fontSize: size * 0.42 }}>
            {name(who).slice(0, 1)}
            {status && <span className="dd-pv-status" data-k={s} style={{ background: `var(--status-${s})`, borderColor: `var(${ring})` }} />}
        </span>
    );
}

// ---------------------------------------------------------------- parts

function ServerList({ d, view }: { d: ThemeDraft; view: View; }) {
    const home = homeImage(d);
    const homeFit = d.icons.home === "dietydis" || d.icons.homeFit === "contain" ? "70%" : "cover";
    const homeActive = view === "home";
    const guilds = [
        { l: "DD", c: "#5865f2", active: !homeActive, unread: false },
        { l: "🎮", c: "", active: false, unread: true },
        { l: "AR", c: "#2b8a5e", active: false, unread: false },
        { l: "✦", c: "#a8459b", active: false, unread: true }
    ];
    return (
        <nav className="dd-pv-servers" data-k="serverList">
            <div className="dd-pv-guild-wrap">
                {homeActive && <span className="dd-pv-pill dd-pv-pill-active" />}
                <span
                    className={"dd-pv-guild dd-pv-home" + (homeActive ? " dd-pv-guild-active" : "")}
                    data-k={homeActive ? "brand" : "surface"}
                    style={{
                        borderRadius: d.icons.guildShape !== "default" ? SHAPE_RADIUS[d.icons.guildShape] : undefined,
                        backgroundColor: d.icons.homeBg || undefined,
                        backgroundImage: home ? `url("${home.replace(/"/g, "%22")}")` : undefined,
                        backgroundSize: homeFit
                    }}
                >
                    {!home && <I d={P.discord} size={26} />}
                </span>
            </div>
            <span className="dd-pv-guild-sep" data-k="border" />
            {guilds.map((g, i) => (
                <div className="dd-pv-guild-wrap" key={i}>
                    {g.active ? <span className="dd-pv-pill dd-pv-pill-active" /> : g.unread && <span className="dd-pv-pill" />}
                    <span
                        className={"dd-pv-guild" + (g.active ? " dd-pv-guild-active" : "")}
                        data-k={g.c ? undefined : "surface"}
                        style={{
                            background: g.c || undefined,
                            borderRadius: d.icons.guildShape !== "default" ? SHAPE_RADIUS[d.icons.guildShape] : undefined
                        }}
                    >{g.l}</span>
                </div>
            ))}
            <span className="dd-pv-guild dd-pv-guild-action" data-k="online surface"><I d={P.plus} /></span>
            {!d.hide.discover && <span className="dd-pv-guild dd-pv-guild-action" data-k="online surface"><I d={P.compass} /></span>}
            {!d.hide.download && <span className="dd-pv-guild dd-pv-guild-action" data-k="online surface"><I d={P.download} /></span>}
        </nav>
    );
}

function UserPanel({ d }: { d: ThemeDraft; }) {
    return (
        <div className="dd-pv-userpanel" data-k="surface">
            <Avatar who="lina" size={32} ring="--background-surface-high" />
            <div className="dd-pv-userpanel-text">
                <span className="dd-pv-strong" data-k="textStrong">{name("lina")}</span>
                <span className="dd-pv-muted" data-k="textMuted">{t("متصلة", "Online")}</span>
            </div>
            <span className="dd-pv-iconbtn" data-k="channels"><I d={P.mic} /></span>
            <span className="dd-pv-iconbtn" data-k="channels"><I d={P.headset} /></span>
            <span className="dd-pv-iconbtn" data-k="channels"><I d={P.gear} /></span>
        </div>
    );
}

function ChannelSidebar({ d }: { d: ThemeDraft; }) {
    return (
        <aside className="dd-pv-sidebar" data-k="sidebar">
            <header className="dd-pv-sidebar-head" data-k="border textStrong">
                <span>DietyDis</span>
                <I d={P.chevron} size={16} />
            </header>
            <div className="dd-pv-channels">
                <div className="dd-pv-category" data-k="textMuted"><I d={P.chevron} size={10} /> {t("قنوات نصية", "Text channels")}</div>
                <div className="dd-pv-channel dd-pv-channel-selected" data-k="selected textStrong"><I d={P.hash} /> {t("عام", "general")}</div>
                <div className="dd-pv-channel dd-pv-channel-unread" data-k="textStrong"><span className="dd-pv-unread-dot" /><I d={P.hash} /> {t("الإعلانات", "announcements")}</div>
                <div className="dd-pv-channel dd-pv-channel-hover" data-k="hover channelsHover"><I d={P.hash} /> {t("الألعاب", "gaming")}</div>
                <div className="dd-pv-channel" data-k="channels"><I d={P.hash} /> {t("الصور", "media")}</div>
                <div className="dd-pv-category" data-k="textMuted"><I d={P.chevron} size={10} /> {t("قنوات صوتية", "Voice channels")}</div>
                <div className="dd-pv-channel" data-k="channels"><I d={P.speaker} /> {t("الاستراحة", "Lounge")}</div>
                <div className="dd-pv-voice-user" data-k="channels"><Avatar who="omar" size={20} status={false} /> {name("omar")}</div>
                <div className="dd-pv-voice-user" data-k="channels"><Avatar who="sara" size={20} status={false} /> {name("sara")}</div>
            </div>
            <UserPanel d={d} />
        </aside>
    );
}

function DmSidebar({ d }: { d: ThemeDraft; }) {
    return (
        <aside className="dd-pv-sidebar" data-k="sidebar">
            <header className="dd-pv-sidebar-head" data-k="border">
                <span className="dd-pv-search" data-k="input textMuted">{t("ابحث أو ابدأ محادثة", "Find or start a conversation")}</span>
            </header>
            <div className="dd-pv-channels">
                <div className="dd-pv-channel dd-pv-channel-selected dd-pv-dm-link" data-k="selected textStrong"><I d={P.people} /> {t("الأصدقاء", "Friends")}</div>
                {!d.hide.nitro && <div className="dd-pv-channel dd-pv-dm-link" data-k="channels"><I d={P.nitro} /> Nitro</div>}
                {!d.hide.shop && <div className="dd-pv-channel dd-pv-dm-link dd-pv-channel-hover" data-k="hover channelsHover"><I d={P.shop} /> {t("المتجر", "Shop")}</div>}
                {!d.hide.quests && <div className="dd-pv-channel dd-pv-dm-link" data-k="channels"><I d={P.quest} /> {t("المهام", "Quests")}</div>}
                <div className="dd-pv-category" data-k="textMuted">{t("الرسائل الخاصة", "Direct Messages")} <span className="dd-pv-flex" /> <I d={P.plus} size={12} /></div>
                {(["sara", "ahmed", "omar"] as Who[]).map(w => (
                    <div className="dd-pv-dm" key={w} data-k="channels"><Avatar who={w} size={28} /> {name(w)}</div>
                ))}
            </div>
            <UserPanel d={d} />
        </aside>
    );
}

function Message({ who, time, children }: { who: Who; time: string; children: React.ReactNode; }) {
    return (
        <div className="dd-pv-message">
            <Avatar who={who} size={36} status={false} />
            <div className="dd-pv-message-body">
                <div className="dd-pv-msg-head">
                    <span className="dd-pv-author" data-k="textStrong">{name(who)}</span>
                    {who === "bot" && <span className="dd-pv-tag" data-k="brand buttonText">{t("تطبيق", "APP")}</span>}
                    <span className="dd-pv-time" data-k="textMuted">{time}</span>
                </div>
                {children}
            </div>
        </div>
    );
}

function MessageBox({ d, placeholder }: { d: ThemeDraft; placeholder: string; }) {
    return (
        <div className="dd-pv-inputbar" data-k="input">
            <span className="dd-pv-input-plus" data-k="channels"><I d={P.plus} size={16} /></span>
            <span className="dd-pv-input-text" data-k="textMuted">{placeholder}</span>
            {!d.hide.gift && <span className="dd-pv-iconbtn" data-k="channels"><I d={P.gift} /></span>}
            {!d.hide.apps && <span className="dd-pv-iconbtn" data-k="channels"><I d={P.apps} /></span>}
            <span className="dd-pv-iconbtn" data-k="channels"><I d={P.smile} /></span>
        </div>
    );
}

function Chat({ d }: { d: ThemeDraft; }) {
    return (
        <main className="dd-pv-chat" data-k="chat">
            <header className="dd-pv-chat-head" data-k="border">
                <span data-k="channels"><I d={P.hash} /></span>
                <span className="dd-pv-strong" data-k="textStrong">{t("عام", "general")}</span>
                <span className="dd-pv-head-sep" data-k="border" />
                <span className="dd-pv-muted" data-k="textMuted">{t("أهلاً بكم في السيرفر", "Welcome to the server")}</span>
                <span className="dd-pv-flex" />
                <span className="dd-pv-iconbtn" data-k="channels"><I d={P.bell} /></span>
                <span className="dd-pv-iconbtn" data-k="channels"><I d={P.pin} /></span>
                <span className="dd-pv-iconbtn" data-k="channels"><I d={P.people} /></span>
            </header>
            <div className="dd-pv-messages">
                <Message who="sara" time={t("اليوم 9:41 ص", "Today at 9:41 AM")}>
                    <div className="dd-pv-text" data-k="textDefault">
                        {t("صباح الخير ", "Morning ")}<span className="dd-pv-mention" data-k="mentionBg mentionText">@{name("ahmed")}</span>
                        {t(" شوف الثيم الجديد على ", " check out the new theme on ")}<span className="dd-pv-link" data-k="link">dietydis.app</span>
                    </div>
                </Message>
                <div className="dd-pv-message dd-pv-message-hover" data-k="hover">
                    <Avatar who="ahmed" size={36} status={false} />
                    <div className="dd-pv-message-body">
                        <div className="dd-pv-msg-head"><span className="dd-pv-author" data-k="textStrong">{name("ahmed")}</span><span className="dd-pv-time" data-k="textMuted">{t("اليوم 9:43 ص", "Today at 9:43 AM")}</span></div>
                        <div className="dd-pv-text" data-k="textDefault">{t("جميل! هذا الكود:", "Nice! Here's the code:")}</div>
                        <code className="dd-pv-code" data-k="border">{"--brand-500: #5865f2;"}</code>
                        <div className="dd-pv-reactions">
                            <span className="dd-pv-reaction dd-pv-reaction-on" data-k="brand">🔥 3</span>
                            <span className="dd-pv-reaction" data-k="border">👍 2</span>
                        </div>
                    </div>
                </div>
                <div className="dd-pv-divider" data-k="dnd"><span>{t("جديد", "NEW")}</span></div>
                <Message who="bot" time={t("اليوم 9:45 ص", "Today at 9:45 AM")}>
                    <div className="dd-pv-embed" data-k="surface border">
                        <span className="dd-pv-strong" data-k="textStrong">{t("تم تطبيق الثيم", "Theme applied")}</span>
                        <span className="dd-pv-text" data-k="textDefault">{t("كل الألوان والخلفية تظهر هنا مباشرة.", "Colours and background show up here live.")}</span>
                        <span className="dd-pv-button" data-k="brand buttonText">{t("فتح", "Open")}</span>
                    </div>
                </Message>
            </div>
            <MessageBox d={d} placeholder={t("اكتب رسالة في #عام", "Message #general")} />
            <span className="dd-pv-scroll" data-k="scrollTrack"><span data-k="scrollThumb" /></span>
        </main>
    );
}

function Members() {
    const group = (title: string, list: Who[]) => (
        <>
            <div className="dd-pv-category" data-k="textMuted">{title} — {list.length}</div>
            {list.map(w => (
                <div key={w} className="dd-pv-member" data-k="channels">
                    <Avatar who={w} size={30} />
                    <div className="dd-pv-member-text">
                        <span style={{ color: w === "bot" ? "#b9a3ff" : undefined }}>{name(w)}</span>
                        {w === "omar" && <span className="dd-pv-muted" data-k="textMuted">{t("يلعب Minecraft", "Playing Minecraft")}</span>}
                    </div>
                </div>
            ))}
        </>
    );
    return (
        <aside className="dd-pv-members" data-k="sidebar">
            {group(t("متصل", "Online"), ["sara", "ahmed", "omar", "bot"])}
        </aside>
    );
}

function Friends({ d }: { d: ThemeDraft; }) {
    return (
        <>
            <main className="dd-pv-chat" data-k="chat">
                <header className="dd-pv-chat-head" data-k="border">
                    <span data-k="channels"><I d={P.people} /></span>
                    <span className="dd-pv-strong" data-k="textStrong">{t("الأصدقاء", "Friends")}</span>
                    <span className="dd-pv-head-sep" data-k="border" />
                    <span className="dd-pv-tab dd-pv-tab-on" data-k="selected textStrong">{t("متصل", "Online")}</span>
                    <span className="dd-pv-tab" data-k="channels">{t("الكل", "All")}</span>
                    <span className="dd-pv-tab" data-k="channels">{t("معلّق", "Pending")}</span>
                    <span className="dd-pv-button dd-pv-button-small" data-k="brand buttonText">{t("إضافة صديق", "Add Friend")}</span>
                </header>
                <div className="dd-pv-friends">
                    <span className="dd-pv-search dd-pv-search-wide" data-k="input textMuted"><I d={P.search} size={14} /> {t("بحث", "Search")}</span>
                    <div className="dd-pv-category" data-k="textMuted">{t("متصل", "Online")} — 3</div>
                    {(["sara", "ahmed", "omar"] as Who[]).map((w, i) => (
                        <div key={w} className={"dd-pv-friend" + (i === 1 ? " dd-pv-message-hover" : "")} data-k={i === 1 ? "hover border" : "border"}>
                            <Avatar who={w} size={32} ring={i === 1 ? "--background-base-low" : "--chat-background"} />
                            <div className="dd-pv-member-text">
                                <span className="dd-pv-strong" data-k="textStrong">{name(w)}</span>
                                <span className="dd-pv-muted" data-k="textMuted">{[t("متصلة", "Online"), t("خامل", "Idle"), t("عدم الإزعاج", "Do Not Disturb")][i]}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
            {!d.hide.activeNow && (
                <aside className="dd-pv-members dd-pv-active-now" data-k="chat border">
                    <span className="dd-pv-strong dd-pv-active-title" data-k="textStrong">{t("نشط الآن", "Active Now")}</span>
                    <div className="dd-pv-embed" data-k="surface border">
                        <div className="dd-pv-member"><Avatar who="omar" size={28} ring="--background-surface-high" /><span className="dd-pv-strong" data-k="textStrong">{name("omar")}</span></div>
                        <span className="dd-pv-muted" data-k="textMuted">{t("يلعب Minecraft", "Playing Minecraft")}</span>
                    </div>
                </aside>
            )}
        </>
    );
}

function Popups() {
    return (
        <div className="dd-pv-overlay">
            <div className="dd-pv-menu" data-k="surface border">
                <div className="dd-pv-menu-item dd-pv-menu-item-hover" data-k="brand buttonText">{t("وضع علامة مقروء", "Mark as read")}</div>
                <div className="dd-pv-menu-item" data-k="textDefault">{t("كتم القناة", "Mute channel")}</div>
                <div className="dd-pv-menu-item" data-k="textDefault">{t("نسخ الرابط", "Copy link")}</div>
                <span className="dd-pv-menu-sep" data-k="border" />
                <div className="dd-pv-menu-item dd-pv-danger" data-k="dnd">{t("حذف القناة", "Delete channel")}</div>
            </div>
            <div className="dd-pv-modal" data-k="modal border">
                <span className="dd-pv-modal-title" data-k="textStrong">{t("إنشاء قناة", "Create Channel")}</span>
                <span className="dd-pv-muted" data-k="textMuted">{t("في قنوات نصية", "in Text channels")}</span>
                <span className="dd-pv-label" data-k="textStrong">{t("اسم القناة", "Channel name")}</span>
                <span className="dd-pv-field" data-k="input textDefault"><I d={P.hash} size={14} /> {t("قناة-جديدة", "new-channel")}</span>
                <div className="dd-pv-modal-foot">
                    <span className="dd-pv-button dd-pv-button-secondary" data-k="textDefault">{t("إلغاء", "Cancel")}</span>
                    <span className="dd-pv-button" data-k="brand buttonText">{t("إنشاء", "Create")}</span>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- the preview

const VIEWS = [["server", "السيرفر", "Server"], ["home", "الرئيسية", "Home"], ["popup", "القوائم والنوافذ", "Menus & dialogs"]] as const;

export function LivePreview({ draft: d, winEffect }: { draft: ThemeDraft; winEffect: WinEffect; }) {
    const focus = useFocus();
    const [view, setView] = useState<View>("server");
    const size: Size = settings.store.previewSize === "small" ? "small" : "large";
    const pinned = settings.store.previewPinned !== false;
    const collapsed = !!settings.store.previewCollapsed;
    const [, force] = useState(0);
    const setOpt = (k: "previewSize" | "previewPinned" | "previewCollapsed", v: any) => { (settings.store as any)[k] = v; force(x => x + 1); };

    const stage = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.7);
    useEffect(() => {
        const el = stage.current;
        if (!el) return;
        const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / W)));
        ro.observe(el);
        return () => ro.disconnect();
    }, [collapsed, size]);

    // Hovering a menu or dialog colour shows the view that has it
    const shown: View = focus === "surface" || focus === "modal" ? "popup" : view;

    const bg = d.background;
    const layer = backgroundLayer(d);
    // The mock is about half the size of a real window, so the blur is scaled down with it
    const blur = bg.blur * 0.5;
    const seeThrough = !layer && (bg.transparentApp || winEffect !== "none");
    const glass = winEffect === "acrylic" ? "blur(18px) saturate(120%)" : winEffect === "mica" || winEffect === "tabbed" ? "blur(40px) saturate(160%)" : "";
    const avatarRadius = d.icons.avatarShape !== "default" ? SHAPE_RADIUS[d.icons.avatarShape] : "50%";

    return (
        <section className={"dd-pv" + (pinned ? " dd-pv-pinned" : "") + (size === "small" ? " dd-pv-small" : "")}>
            <div className="dd-pv-bar">
                <span className="dd-pv-live"><span className="dd-pv-live-dot" />{t("معاينة مباشرة", "Live preview")}</span>
                {!collapsed && (
                    <div className="dd-te-segmented dd-pv-views" role="radiogroup">
                        {VIEWS.map(([v, ar, en]) => (
                            <button key={v} role="radio" aria-checked={shown === v} className={shown === v ? "dd-te-on" : ""} onClick={() => setView(v)}>{t(ar, en)}</button>
                        ))}
                    </div>
                )}
                <span className="dd-te-spacer" />
                {!collapsed && (
                    <>
                        <button className="dd-pv-tool" title={size === "small" ? t("تكبير", "Larger") : t("تصغير", "Smaller")} onClick={() => setOpt("previewSize", size === "small" ? "large" : "small")}>
                            {size === "small" ? "⤢" : "⤡"}
                        </button>
                        <button className={"dd-pv-tool" + (pinned ? " dd-pv-tool-on" : "")} title={t("تثبيت أثناء التمرير", "Keep in view while scrolling")} onClick={() => setOpt("previewPinned", !pinned)}>📌</button>
                    </>
                )}
                <button className="dd-pv-tool" title={collapsed ? t("إظهار المعاينة", "Show preview") : t("إخفاء المعاينة", "Hide preview")} onClick={() => setOpt("previewCollapsed", !collapsed)}>
                    {collapsed ? "▾" : "▴"}
                </button>
            </div>

            {!collapsed && (
                <div className="dd-pv-stage" ref={stage} style={{ height: H * scale }}>
                    <div className="dd-pv-desktop" style={{ width: W, height: H, transform: `scale(${scale})` }}>
                        <div
                            className="dd-te-mock"
                            data-focus={focus || undefined}
                            data-k="frame"
                            dir="ltr"
                            aria-hidden="true"
                            style={{
                                ["--dd-pv-avatar-radius" as any]: avatarRadius,
                                backdropFilter: seeThrough && glass ? glass : undefined
                            }}
                        >
                            {layer && (
                                <div
                                    className="dd-pv-bg"
                                    style={{
                                        inset: blur ? -blur * 2 : 0,
                                        background: layer,
                                        filter: `blur(${blur}px) brightness(${100 - bg.dim}%) saturate(${bg.saturate}%)`
                                    }}
                                />
                            )}
                            <div className="dd-pv-titlebar" data-k="frame">
                                <span className="dd-pv-titlebar-text" data-k="textMuted">{shown === "home" ? t("الأصدقاء", "Friends") : "DietyDis"}</span>
                                <span className="dd-pv-winbtns" data-k="textMuted"><i /><i /><i /></span>
                            </div>
                            <div className="dd-pv-body" data-k="border">
                                <ServerList d={d} view={shown} />
                                {shown === "home" ? <DmSidebar d={d} /> : <ChannelSidebar d={d} />}
                                {shown === "home" ? <Friends d={d} /> : <><Chat d={d} /><Members /></>}
                                {shown === "popup" && <Popups />}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
