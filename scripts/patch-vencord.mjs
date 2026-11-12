// Small source changes to Vencord itself that a plugin can't make (Vencord's own settings pages
// aren't part of Discord's code, so Vencord's patch system can't reach them).
// Usage: node scripts/patch-vencord.mjs <path to Vencord>
// Safe to run again: every change checks whether it is already there.

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const vencord = process.argv[2];
if (!vencord) {
    console.error("usage: node patch-vencord.mjs <Vencord dir>");
    process.exit(1);
}

let failed = false;

function patchFile(rel, edits) {
    const file = join(vencord, rel);
    let text = readFileSync(file, "utf8");
    const eol = text.includes("\r\n") ? "\r\n" : "\n";
    let changed = false;
    for (const { name, done, find, replace } of edits) {
        if (text.includes(done)) continue;
        if (!text.includes(find)) {
            console.error(`[patch-vencord] ${rel}: can't find the spot for "${name}" (Vencord changed?)`);
            failed = true;
            continue;
        }
        text = text.replace(find, replace.replace(/\n/g, eol));
        changed = true;
    }
    if (changed) writeFileSync(file, text);
    console.log(`[patch-vencord] ${rel}: ${changed ? "patched" : "already patched"}`);
}

// Settings > Themes: a third tab, "Theme Editor", rendered by the DietyDisThemeEditor plugin
patchFile("src/components/settings/tabs/themes/index.tsx", [
    {
        name: "tab id",
        done: "DIETYDIS_EDITOR",
        find: "    LOCAL,\n    ONLINE\n}".replace(/\n/g, readEol()),
        replace: "    LOCAL,\n    ONLINE,\n    DIETYDIS_EDITOR\n}\n\n// DietyDis: the theme editor tab comes from the DietyDisThemeEditor plugin (when it is on)\nfunction getDietyDisThemeEditor(): React.ComponentType | null {\n    const plugin = Vencord.Plugins.plugins.DietyDisThemeEditor as any;\n    return plugin && Vencord.Plugins.isPluginEnabled(\"DietyDisThemeEditor\") ? plugin.EditorTab ?? null : null;\n}"
    },
    {
        name: "tab button",
        done: "id={ThemeTab.DIETYDIS_EDITOR}",
        find: "                    Online Themes\n                </TabBar.Item>".replace(/\n/g, readEol()),
        replace: "                    Online Themes\n                </TabBar.Item>\n                {DietyDisEditor && (\n                    <TabBar.Item\n                        className=\"vc-settings-tab-bar-item\"\n                        id={ThemeTab.DIETYDIS_EDITOR}\n                    >\n                        {dietyDisArabic ? \"محرر الثيمات\" : \"Theme Editor\"}\n                    </TabBar.Item>\n                )}"
    },
    {
        name: "tab state",
        done: "const DietyDisEditor = getDietyDisThemeEditor();",
        find: "    const [currentTab, setCurrentTab] = useState(ThemeTab.LOCAL);",
        replace: "    const [currentTab, setCurrentTab] = useState(ThemeTab.LOCAL);\n    const DietyDisEditor = getDietyDisThemeEditor();\n    const dietyDisArabic = Vencord.Plugins.isPluginEnabled(\"DietyDisArabic\") && (Vencord.Settings.plugins.DietyDisArabic as any)?.uiLanguage !== \"en\";"
    },
    {
        name: "tab content",
        done: "currentTab === ThemeTab.DIETYDIS_EDITOR",
        find: "                {currentTab === ThemeTab.ONLINE && <OnlineThemesTab />}",
        replace: "                {currentTab === ThemeTab.ONLINE && <OnlineThemesTab />}\n                {currentTab === ThemeTab.DIETYDIS_EDITOR && DietyDisEditor && <DietyDisEditor />}"
    }
]);

function readEol() {
    const text = readFileSync(join(vencord, "src/components/settings/tabs/themes/index.tsx"), "utf8");
    return text.includes("\r\n") ? "\r\n" : "\n";
}

if (failed) process.exit(1);
