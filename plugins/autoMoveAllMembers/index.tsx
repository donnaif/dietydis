/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Right-click a voice channel > "Move all members to this voice channel": moves everyone in your
// current voice channel there, one by one. Needs the "Move Members" permission, like doing it by hand.
// Idea from Equicord's VoiceChatUtilities, rewritten for DietyDis.

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import type { Channel } from "@vencord/discord-types";
import { ChannelStore, Menu, PermissionsBits, PermissionStore, RestAPI, showToast, UserStore, VoiceStateStore } from "@webpack/common";

import { t } from "../_shared/friends";

const settings = definePluginSettings({
    includeSelf: {
        type: OptionType.BOOLEAN,
        description: "Move yourself too, so you arrive with everyone",
        default: true
    },
    delay: {
        type: OptionType.NUMBER,
        description: "Pause between two moves in milliseconds (higher is gentler on Discord's rate limits)",
        default: 250
    }
});

// Voice and stage channels
const isVoice = (c?: Channel) => !!c && (c.type === 2 || c.type === 13);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
let moving = false;

async function moveAll(source: Channel, target: Channel) {
    if (moving) return;
    if (!PermissionStore.can(PermissionsBits.MOVE_MEMBERS, source) || !PermissionStore.can(PermissionsBits.MOVE_MEMBERS, target)) {
        showToast({ text: t("ليست لديك صلاحية «نقل الأعضاء» في هذا السيرفر", "You don't have the Move Members permission here"), variant: "critical" });
        return;
    }

    const me = UserStore.getCurrentUser()?.id;
    const users = Object.values(VoiceStateStore.getVoiceStatesForChannel(source.id) ?? {})
        .map((s: any) => s.userId as string)
        .filter(id => id && id !== me);
    // You go last, so you can still see the others leave if something fails
    if (settings.store.includeSelf && me) users.push(me);
    if (!users.length) {
        showToast({ text: t("لا يوجد أعضاء لسحبهم", "There's nobody to move"), variant: "critical" });
        return;
    }

    moving = true;
    let moved = 0;
    try {
        for (const id of users) {
            try {
                await RestAPI.patch({ url: `/guilds/${target.guild_id}/members/${id}`, body: { channel_id: target.id } });
                moved++;
            } catch { /* left already, or can't be moved: carry on with the others */ }
            await sleep(Math.max(0, Number(settings.store.delay) || 0));
        }
    } finally {
        moving = false;
    }

    const failed = users.length - moved;
    showToast({
        text: failed
            ? t(`تم سحب ${moved} من ${users.length} إلى ${target.name}`, `Moved ${moved} of ${users.length} to ${target.name}`)
            : t(`تم سحب ${moved} إلى ${target.name}`, `Moved ${moved} to ${target.name}`),
        variant: failed ? "critical" : "success"
    });
}

const channelContextPatch: NavContextMenuPatchCallback = (children, { channel }: { channel?: Channel; }) => {
    if (!isVoice(channel)) return;
    const me = UserStore.getCurrentUser()?.id;
    const sourceId = VoiceStateStore.getVoiceStateForUser(me)?.channelId;
    const source = sourceId ? ChannelStore.getChannel(sourceId) : undefined;
    // Only from your own voice channel, to another one in the same server
    if (!isVoice(source) || source!.id === channel!.id || source!.guild_id !== channel!.guild_id) return;

    children.push(
        <Menu.MenuSeparator />,
        <Menu.MenuItem
            id="dd-move-all-members"
            label={t("سحب جميع الأعضاء إلى هذا الروم الصوتي", "Move all members to this voice channel")}
            action={() => moveAll(source!, channel!)}
        />
    );
};

export default definePlugin({
    name: "AutoMoveAllMembers",
    description: "Right-click a voice channel to move everyone in your current voice channel there at once (needs the Move Members permission)",
    authors: [{ name: "DietyDis", id: 0n }],
    tags: ["Voice"],
    settings,
    contextMenus: { "channel-context": channelContextPatch }
});
