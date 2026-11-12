/*
 * DietyDis rebrand script: turns a Vesktop checkout into DietyDis.
 * Usage: node rebrand.mjs <path-to-Vesktop> [path-to-icon.ico] [path-to-Vencord-dist]
 * Safe to run more than once.
 */

import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";

const root = resolve(process.argv[2] ?? ".");
const icon = process.argv[3];
const vencordDist = process.argv[4] ? resolve(process.argv[4]) : null;

if (!existsSync(join(root, "package.json"))) {
    console.error(`[rebrand] package.json not found in ${root}`);
    process.exit(1);
}

let failed = false;

// ---- package.json ----
const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.name = "dietydis";
pkg.productName = "DietyDis"; // also sets the data folder: %APPDATA%\DietyDis
pkg.description = "DietyDis is a custom Discord desktop app";
pkg.build.appId = "com.dietydis.app";
pkg.build.productName = "DietyDis";
pkg.build.executableName = "dietydis";
pkg.build.win.target = [{ target: "nsis", arch: ["x64"] }];
pkg.build.nsis = {
    ...pkg.build.nsis,
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    artifactName: "DietyDis-Setup-${version}.${ext}",
    shortcutName: "DietyDis",
    uninstallDisplayName: "DietyDis"
};
// No auto-update from Vesktop's GitHub releases (DietyDis gets its own updater later)
pkg.build.publish = null;
// Ship our Vencord build (with DietyDis plugins) inside the app: resources\vencord
if (vencordDist) {
    if (!existsSync(join(vencordDist, "vencordDesktopMain.js"))) {
        console.error(`[rebrand] Vencord build not found in ${vencordDist} (run pnpm build in Vencord first)`);
        process.exit(1);
    }
    pkg.build.extraResources = [
        {
            from: vencordDist,
            to: "vencord",
            filter: ["vencordDesktop*.js", "vencordDesktop*.css", "*.LEGAL.txt"]
        }
    ];
}
writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + "\n");
console.log("[rebrand] package.json updated");

// ---- user-visible strings ----
// Each entry must be found (or already replaced); otherwise upstream changed and we report it.
const edits = {
    "src/main/constants.ts": [
        ['"Uninstall Vesktop.exe"', '"Uninstall DietyDis.exe"'],
        ['// Written by "Reset Vesktop"', '// Written by "Reset DietyDis"']
    ],
    "src/main/mainWindow.ts": [
        ['label: "About Vesktop"', 'label: "About DietyDis"'],
        ['toolTip: "Vesktop will automatically restart after this operation"', 'toolTip: "DietyDis will automatically restart after this operation"', true],
        ['label: "Reset Vesktop"', 'label: "Reset DietyDis"'],
        ['label: "Vesktop",', 'label: "DietyDis",'],
        ['win.setTitle("Vesktop")', 'win.setTitle("DietyDis")'],
        ['options.title = "Vesktop"', 'options.title = "DietyDis"'],
        ['message: "Vesktop failed to start"', 'message: "DietyDis failed to start"'],
        ["and restart Vesktop.", "and restart DietyDis."]
    ],
    // Must equal build.appId, or Windows notifications and taskbar pinning break
    "src/main/main.ts": [['app.setAppUserModelId("dev.vencord.vesktop")', 'app.setAppUserModelId("com.dietydis.app")']],
    "src/main/tray.ts": [
        ['label: "Reset Vesktop"', 'label: "Reset DietyDis"'],
        ['tray.setToolTip("Vesktop")', 'tray.setToolTip("DietyDis")']
    ],
    "src/main/updater.ts": [
        ['title: "Vesktop Updater"', 'title: "DietyDis Updater"'],
        [
            "const isOutdated = autoUpdater.checkForUpdates().then(res => Boolean(res?.isUpdateAvailable));",
            "// DietyDis: Vesktop update checks disabled\nconst isOutdated = Promise.resolve(false);"
        ]
    ],
    "build/installer.nsh": [["$LocalAppData\\vesktop", "$LocalAppData\\dietydis", true]],
    "static/views/first-launch.html": [
        ["<title>Vesktop Setup</title>", "<title>DietyDis Setup</title>"],
        ["<h1>Welcome to Vesktop</h1>", "<h1>Welcome to DietyDis</h1>"],
        ["Automatically open Vesktop when", "Automatically open DietyDis when"]
    ],
    "static/views/splash.html": [["<p>Loading Vesktop...</p>", "<p>Loading DietyDis...</p>"]],
    // Keep the Vesktop links and license text in About: GPL credit for the original project
    "static/views/about.html": [
        ["<title>About Vesktop</title>", "<title>About DietyDis</title>"],
        ['<h1 id="title">Vesktop v{{APP_VERSION}}</h1>', '<h1 id="title">DietyDis v{{APP_VERSION}}</h1>'],
        [
            "<p>Vesktop is a cross platform Discord Desktop client, aiming to give you a better Discord experience</p>",
            "<p>DietyDis is a custom Discord desktop app for Windows, based on Vesktop and Vencord</p>"
        ]
    ],
    "static/views/updater/index.html": [["<title>Vesktop Updater</title>", "<title>DietyDis Updater</title>"]],
    // Phase 2: the installed app loads the Vencord build shipped in resources\vencord
    "src/main/vencordFilesDir.ts": [
        ['import { join } from "path";', 'import { join } from "path";\n\nimport { app } from "electron";'],
        [
            'export const VENCORD_FILES_DIR = State.store.vencordDir || join(SESSION_DATA_DIR, "vencordFiles");',
            "// DietyDis: packaged builds use the Vencord build bundled in resources\\vencord\n" +
                "export const USING_BUNDLED_VENCORD = !State.store.vencordDir && app.isPackaged;\n" +
                "export const VENCORD_FILES_DIR =\n" +
                "    State.store.vencordDir ||\n" +
                '    (USING_BUNDLED_VENCORD ? join(process.resourcesPath, "vencord") : join(SESSION_DATA_DIR, "vencordFiles"));'
        ]
    ],
    "src/main/utils/vencordLoader.ts": [
        [
            'import { VENCORD_FILES_DIR } from "main/vencordFilesDir";',
            'import { USING_BUNDLED_VENCORD, VENCORD_FILES_DIR } from "main/vencordFilesDir";'
        ],
        [
            // no trailing newline in the search text: checkouts on Windows may use CRLF
            "export async function downloadVencordFiles() {",
            "export async function downloadVencordFiles() {\n" +
                "    // DietyDis: never replace the bundled Vencord (with our plugins) by upstream files\n" +
                "    if (USING_BUNDLED_VENCORD) {\n" +
                '        console.warn("DietyDis ships its own Vencord build; skipping download. Reinstall DietyDis to repair it.");\n' +
                "        return;\n" +
                "    }\n"
        ]
    ]
};

for (const [file, pairs] of Object.entries(edits)) {
    const path = join(root, file);
    if (!existsSync(path)) {
        console.error(`[rebrand] missing file: ${file}`);
        failed = true;
        continue;
    }
    let text = readFileSync(path, "utf8");
    for (const [from, to, all] of pairs) {
        // Already applied? (checked first: some replacements contain their own search text)
        if (text.includes(to) && !(all && text.includes(from) && !to.includes(from))) continue;
        if (text.includes(from)) {
            text = all ? text.split(from).join(to) : text.replace(from, to);
        } else {
            console.error(`[rebrand] not found in ${file}: ${from}`);
            failed = true;
        }
    }
    writeFileSync(path, text);
}
console.log("[rebrand] strings updated");

// ---- visible "Vesktop" text in the settings UI (src/renderer) ----
// Renames the word only where it stands alone in text: identifiers (VesktopNative, useVesktopState),
// URLs (github.com/Vencord/Vesktop), comments, imports, patch owners and logger names stay untouched.
const VISIBLE_WORD = /(?<![\w/.@-])Vesktop(?![\w/-])/g;
const SKIP_LINE = /^\s*(\*|\/\/|\/\*|import\b)|addPatch|new Logger/;
function listSources(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
        e.isDirectory() ? listSources(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : []
    );
}
let renamedLines = 0;
for (const file of listSources(join(root, "src", "renderer"))) {
    const lines = readFileSync(file, "utf8").split("\n");
    let changed = false;
    const out = lines.map(line => {
        if (SKIP_LINE.test(line)) return line;
        const next = line.replace(VISIBLE_WORD, "DietyDis");
        if (next !== line) {
            changed = true;
            renamedLines++;
        }
        return next;
    });
    if (changed) writeFileSync(file, out.join("\n"));
}
console.log(`[rebrand] settings UI: ${renamedLines} lines renamed`);

// ---- icon ----
if (icon && existsSync(icon)) {
    copyFileSync(icon, join(root, "build", "icon.ico"));
    // Made by scripts/make-icon.ps1 next to icon.ico; each one is optional
    const assets = dirname(icon);
    const extra = {
        "tray.png": ["static/tray/tray.png", "static/tray.png"],
        "trayUnread.png": ["static/tray/trayUnread.png"],
        // The loading screen shows it with <img>, which detects PNG by content despite the .webp name
        "splash.png": ["static/splash.webp"]
    };
    for (const [name, targets] of Object.entries(extra)) {
        if (!existsSync(join(assets, name))) continue;
        for (const target of targets) copyFileSync(join(assets, name), join(root, target));
    }
    console.log("[rebrand] icon, tray and splash images copied");
} else {
    console.log("[rebrand] no assets\\icon.ico, keeping the Vesktop icon");
}

if (failed) {
    console.error("[rebrand] finished with problems (see above): Vesktop source probably changed");
    process.exit(1);
}
console.log("[rebrand] done");
