/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Pulls the friends you choose into every voice channel you go to in the same server.
// Moving members needs the "Move Members" permission in that server, like doing it by hand.

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import type { User, VoiceState } from "@vencord/discord-types";
import { ChannelStore, Menu, PermissionsBits, PermissionStore, RestAPI, showToast, UserStore, VoiceStateStore } from "@webpack/common";

import { resolveUsers, t, toggleUserIn } from "../_shared/friends";

const settings = definePluginSettings({
    friends: {
        type: OptionType.STRING,
        description: "User IDs (or usernames of your friends) to pull with you, separated by commas",
        default: "",
        placeholder: "123456789012345678, username"
    },
    pullWhenTheyLeave: {
        type: OptionType.BOOLEAN,
        description: "Also pull them to you when they join or move to another voice channel in the same server",
        default: false
    },
    notify: {
        type: OptionType.BOOLEAN,
        description: "Show a short notice when someone is moved, or when you lack the permission",
        default: true
    }
});

const myId = () => UserStore.getCurrentUser()?.id;
// Your channel last seen: mute/deafen updates repeat it and shouldn't trigger moves
let myLastChannel: string | null = null;
// One "no permission" notice per channel, not one per update
let warnedChannel: string | null = null;

function canMove(channelId: string) {
    const channel = ChannelStore.getChannel(channelId);
    return !!channel?.guild_id && PermissionStore.can(PermissionsBits.MOVE_MEMBERS, channel);
}

async function moveFriends(channelId: string, only?: string) {
    const channel = ChannelStore.getChannel(channelId);
    const guildId = channel?.guild_id;
    if (!guildId) return;

    const targets = resolveUsers(settings.store.friends).filter(id => {
        if (only && id !== only) return false;
        const state = VoiceStateStore.getVoiceStateForUser(id);
        // Only people already in voice in this server can be moved (Discord can't pull someone in)
        return !!state?.channelId && state.channelId !== channelId && ChannelStore.getChannel(state.channelId)?.guild_id === guildId;
    });
    if (!targets.length) return;

    if (!canMove(channelId)) {
        if (settings.store.notify && warnedChannel !== channelId) {
            warnedChannel = channelId;
            showToast({ text: t("ليست لديك صلاحية «نقل الأعضاء» في هذا السيرفر", "You don't have the Move Members permission here"), variant: "critical" });
        }
        return;
    }

    for (const id of targets) {
        try {
            await RestAPI.patch({ url: `/guilds/${guildId}/members/${id}`, body: { channel_id: channelId } });
            if (settings.store.notify) {
                const user = UserStore.getUser(id) as any;
                const who = user?.globalName ?? user?.username ?? id;
                showToast({ text: t(`سحبت ${who} إلى ${channel.name}`, `Moved ${who} to ${channel.name}`), variant: "success" });
            }
        } catch {
            if (settings.store.notify) showToast({ text: t("تعذّر سحب الصديق إلى الروم", "Couldn't move your friend"), variant: "critical" });
        }
    }
}

const userContextPatch: NavContextMenuPatchCallback = (children, { user }: { user?: User; }) => {
    if (!user || user.id === myId()) return;
    const pulling = resolveUsers(settings.store.friends).includes(user.id);
    children.push(
        <Menu.MenuSeparator />,
        <Menu.MenuCheckboxItem
            id="dd-auto-move-friend"
            label={t("اسحبه معي تلقائياً", "Auto Move With Me")}
            checked={pulling}
            action={() => { settings.store.friends = toggleUserIn(settings.store.friends, user.id, false); }}
        />
    );
};

export default definePlugin({
    name: "AutoMoveFriend",
    description: "Automatically pull the friends you choose into any voice channel you go to in the same server (needs the Move Members permission)",
    authors: [{ name: "DietyDis", id: 0n }],
    tags: ["Voice", "Friends"],
    settings,

    contextMenus: { "user-context": userContextPatch },

    flux: {
        VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: VoiceState[]; }) {
            const me = myId();
            for (const state of voiceStates) {
                if (state.userId === me) {
                    const channelId = state.channelId ?? null;
                    if (channelId === myLastChannel) continue;
                    myLastChannel = channelId;
                    warnedChannel = null;
                    if (channelId) moveFriends(channelId);
                } else if (settings.store.pullWhenTheyLeave && myLastChannel && state.channelId && state.channelId !== myLastChannel) {
                    // A pulled friend went elsewhere in the server: bring them back
                    if (resolveUsers(settings.store.friends).includes(state.userId)) moveFriends(myLastChannel, state.userId);
                }
            }
        }
    },

    start() {
        myLastChannel = VoiceStateStore.getVoiceStateForUser(myId())?.channelId ?? null;
    }
});
