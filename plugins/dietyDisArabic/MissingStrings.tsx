/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { copyWithToast } from "@utils/discord";

import { missingStrings } from "./discordUi";

// Copies the English Discord texts seen so far that have no Arabic yet, as JSON ready for
// discordStrings.ts ("English": ""), so the dictionary can grow from what users actually see.
export function MissingStringsButton() {
    return (
        <Button
            size="small"
            onClick={() => {
                const entries = Object.fromEntries([...missingStrings].sort().map(s => [s, ""]));
                copyWithToast(JSON.stringify(entries, null, 4), `تم نسخ ${missingStrings.size} نصاً غير مترجم`);
            }}
        >
            نسخ النصوص غير المترجمة
        </Button>
    );
}
