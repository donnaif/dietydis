/*
 * Rewrites Equicord-only imports in plugins/ so they build inside Vencord:
 *   - EquicordDevs from "@utils/constants"  ->  plugins/_shared/devs.ts
 *   - "@equicordplugins/<plugin>/..."       ->  relative path inside plugins/
 * Usage: node scripts/port-equicord.mjs [plugin-folder ...]   (default: all of plugins/)
 * Safe to run more than once.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { dirname, join, relative, sep } from "path";
import { fileURLToPath } from "url";

const pluginsDir = fileURLToPath(new URL("../plugins", import.meta.url));
const only = process.argv.slice(2);

function sourceFiles(dir) {
    return readdirSync(dir).flatMap(name => {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) return sourceFiles(p);
        return /\.tsx?$/.test(name) ? [p] : [];
    });
}

function rel(fromFile, target) {
    let r = relative(dirname(fromFile), target).split(sep).join("/");
    if (!r.startsWith(".")) r = "./" + r;
    return r;
}

const folders = readdirSync(pluginsDir).filter(f => !f.startsWith("_") && (!only.length || only.includes(f)));
for (const folder of folders) {
    for (const file of sourceFiles(join(pluginsDir, folder))) {
        let text = readFileSync(file, "utf8");
        const before = text;

        // "@equicordplugins/foo/bar" -> relative path to plugins/foo/bar
        text = text.replace(/(["'])@equicordplugins\/([^"']+)\1/g, (m, q, path) => {
            const [plugin, ...rest] = path.split("/");
            const real = readdirSync(pluginsDir).find(f => f.toLowerCase() === plugin.toLowerCase());
            if (!real) return m; // plugin not ported: leave it, the type check will report it
            return q + rel(file, join(pluginsDir, real, ...rest)) + q;
        });

        // import { Devs, EquicordDevs } from "@utils/constants"
        text = text.replace(/import\s*\{([^}]*)\}\s*from\s*"@utils\/constants";?/g, (m, names) => {
            const list = names.split(",").map(s => s.trim()).filter(Boolean);
            if (!list.includes("EquicordDevs")) return m;
            const restNames = list.filter(n => n !== "EquicordDevs");
            const devsImport = `import { EquicordDevs } from "${rel(file, join(pluginsDir, "_shared", "devs"))}";`;
            return (restNames.length ? `import { ${restNames.join(", ")} } from "@utils/constants";\n` : "") + devsImport;
        });

        if (text !== before) {
            writeFileSync(file, text);
            console.log("[port] " + relative(pluginsDir, file));
        }
    }
}
