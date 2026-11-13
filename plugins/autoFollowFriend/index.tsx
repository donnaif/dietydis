/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Joins the voice channel your friend joins, in any server you share with them.
// Idea from Equicord's FollowVoiceUser (TheArmagan), rewritten for DietyDis.

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import type { User, VoiceState } from "@vencord/discord-types";
import { findByPropsLazy } from "@webpack";
import { ChannelStore, Menu, PermissionsBits, PermissionStore, showToast, UserStore, VoiceStateStore } from "@webpack/common";

import { resolveUsers, t, toggleUserIn } from "../_shared/friends";

const VoiceActions = findByPropsLazy("selectVoiceChannel");

const settings = definePluginSettings({
    friend: {
        type: OptionType.STRING,
        description: "Your friend's username or user ID. You join every voice channel they join",
        default: "",
        placeholder: "username / ID",
        onChange: () => joinFriendNow()
    },
    onlyWhenInVoice: {
        type: OptionType.BOOLEAN,
        description: "Follow only while you are already in a voice channel",
        default: false
    },
    leaveWhenFriendLeaves: {
        type: OptionType.BOOLEAN,
        description: "Leave the voice channel when your friend disconnects",
        default: false
    },
    notify: {
        type: OptionType.BOOLEAN,
        description: "Show a short notice each time you follow your friend",
        default: true
    }
});

// The friend's channel last seen: mute/deafen updates repeat it and must not pull you back in
let lastFriendChannel: string | null = null;

const myId = () => UserStore.getCurrentUser()?.id;
const myChannelId = () => VoiceStateStore.getVoiceStateForUser(myId())?.channelId ?? null;

function canJoin(channelId: string) {
    const channel = ChannelStore.getChannel(channelId);
    if (!channel) return false;
    // DMs and group calls have no permissions to check
    if (!channel.guild_id) return true;
    return PermissionStore.can(PermissionsBits.VIEW_CHANNEL, channel) && PermissionStore.can(PermissionsBits.CONNECT, channel);
}

function follow(channelId: string) {
    if (channelId === myChannelId()) return;
    if (settings.store.onlyWhenInVoice && !myChannelId()) return;
    if (!canJoin(channelId)) {
        showToast({ text: t("لا يمكنك دخول الروم الذي دخله صديقك", "You can't join the channel your friend joined"), variant: "critical" });
        return;
    }
    VoiceActions.selectVoiceChannel(channelId);
    if (settings.store.notify) {
        const name = ChannelStore.getChannel(channelId)?.name;
        showToast({ text: t(`تبعت صديقك إلى ${name ?? "الروم"}`, `Followed your friend to ${name ?? "the channel"}`), variant: "success" });
    }
}

// When the friend is set (or the plugin starts), join them at once if they're already in voice
function joinFriendNow() {
    const [friendId] = resolveUsers(settings.store.friend);
    if (!friendId) return;
    const channelId = VoiceStateStore.getVoiceStateForUser(friendId)?.channelId ?? null;
    lastFriendChannel = channelId;
    if (channelId) follow(channelId);
}

const userContextPatch: NavContextMenuPatchCallback = (children, { user }: { user?: User; }) => {
    if (!user || user.id === myId() || user.bot) return;
    const following = resolveUsers(settings.store.friend)[0] === user.id;
    children.push(
        <Menu.MenuSeparator />,
        <Menu.MenuCheckboxItem
            id="dd-auto-follow-friend"
            label={t("تتبّع هذا الصديق تلقائياً", "Auto Follow This Friend")}
            checked={following}
            action={() => { settings.store.friend = toggleUserIn(settings.store.friend, user.id, true); }}
        />
    );
};

export default definePlugin({
    name: "AutoFollowFriend",
    description: "Automatically join any voice channel your friend joins, in the same server or any other server you share",
    authors: [{ name: "DietyDis", id: 0n }],
    tags: ["Voice", "Friends"],
    settings,

    contextMenus: { "user-context": userContextPatch },

    flux: {
        VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: VoiceState[]; }) {
            const [friendId] = resolveUsers(settings.store.friend);
            if (!friendId) return;
            for (const state of voiceStates) {
                if (state.userId !== friendId) continue;
                const channelId = state.channelId ?? null;
                if (channelId === lastFriendChannel) continue;
                lastFriendChannel = channelId;
                if (channelId) follow(channelId);
                else if (settings.store.leaveWhenFriendLeaves && myChannelId()) VoiceActions.selectVoiceChannel(null);
            }
        }
    },

    // Remember where the friend is, without joining: opening the app shouldn't pull you into voice
    start() {
        const [friendId] = resolveUsers(settings.store.friend);
        lastFriendChannel = friendId ? VoiceStateStore.getVoiceStateForUser(friendId)?.channelId ?? null : null;
    }
});
