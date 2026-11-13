/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Helpers shared by AutoFollowFriend and AutoMoveFriend.

import { Settings } from "@api/Settings";
import { RelationshipStore, UserStore } from "@webpack/common";

// Arabic when the DietyDis interface language is Arabic (the DietyDisArabic default)
export function isArabicUi() {
    const ar = Settings.plugins.DietyDisArabic as any;
    return !!ar?.enabled && ar.uiLanguage !== "en";
}

export const t = (arabic: string, english: string) => isArabicUi() ? arabic : english;

const ID = /^\d{17,20}$/;

// "sara, 123456789012345678 @omar" -> user IDs. A name is looked up among your friends by
// username, display name or nickname; IDs are used as they are (they needn't be friends).
export function resolveUsers(input: string | undefined): string[] {
    const ids = new Set<string>();
    const tokens = (input ?? "").split(/[\s,،;]+/).map(s => s.replace(/^@/, "").trim()).filter(Boolean);
    if (!tokens.length) return [];

    let friends: { id: string; names: string[]; }[] | undefined;
    for (const token of tokens) {
        if (ID.test(token)) { ids.add(token); continue; }
        friends ??= RelationshipStore.getFriendIDs().map(id => {
            const u = UserStore.getUser(id) as any;
            const nick = (RelationshipStore as any).getNickname?.(id);
            return { id, names: [u?.username, u?.globalName, nick].filter(Boolean).map((n: string) => n.toLowerCase()) };
        });
        const name = token.toLowerCase();
        const match = friends.find(f => f.names.includes(name));
        if (match) ids.add(match.id);
    }
    ids.delete(UserStore.getCurrentUser()?.id);
    return [...ids];
}

// Adds or removes a user in a comma-separated settings field, written as IDs
export function toggleUserIn(current: string | undefined, userId: string, single: boolean) {
    const ids = resolveUsers(current);
    if (ids.includes(userId)) return ids.filter(id => id !== userId).join(", ");
    return single ? userId : [...ids, userId].join(", ");
}
