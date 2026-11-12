/*
 * DietyDis rebrand script: turns a Vesktop checkout into DietyDis.
 * Usage: node rebrand.mjs <path-to-Vesktop> [path-to-icon.ico]
 * Safe to run more than once.
 */

import { copyFileSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const root = resolve(process.argv[2] ?? ".");
const icon = process.argv[3];

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
    "static/views/updater/index.html": [["<title>Vesktop Updater</title>", "<title>DietyDis Updater</title>"]]
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
        if (text.includes(from)) {
            text = all ? text.split(from).join(to) : text.replace(from, to);
        } else if (!text.includes(to)) {
            console.error(`[rebrand] not found in ${file}: ${from}`);
            failed = true;
        }
    }
    writeFileSync(path, text);
}
console.log("[rebrand] strings updated");

// ---- icon ----
if (icon && existsSync(icon)) {
    copyFileSync(icon, join(root, "build", "icon.ico"));
    console.log("[rebrand] icon copied");
} else {
    console.log("[rebrand] no assets\\icon.ico, keeping the Vesktop icon");
}

if (failed) {
    console.error("[rebrand] finished with problems (see above): Vesktop source probably changed");
    process.exit(1);
}
console.log("[rebrand] done");
