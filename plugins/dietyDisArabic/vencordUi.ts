/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Arabic for the fixed texts of Vencord's own plugin pages (filters, notices, plugin window).
// Those are plain English in Vencord's React code, not Discord messages, so they can't go through
// the intl dictionary: we swap exact text matches in the page instead. Only whole texts listed here
// are touched, and never inside chat messages, so user content can't be changed by accident.

const vencordStrings: Record<string, string> = {
    // Plugins page
    "Plugins": "الإضافات",
    "Restart required!": "إعادة التشغيل مطلوبة!",
    "Restart now to apply new plugins and their settings": "أعد التشغيل الآن لتطبيق الإضافات الجديدة وإعداداتها",
    "Restart": "إعادة التشغيل",
    "Plugin Management": "إدارة الإضافات",
    "Press the cog wheel or info icon to get more info on a plugin": "اضغط على الترس أو أيقونة المعلومات لمعرفة المزيد عن أي إضافة",
    "Plugins with a cog wheel have settings you can modify!": "الإضافات التي عليها ترس لها إعدادات يمكنك تغييرها!",
    "Search for a plugin...": "ابحث عن إضافة...",
    "Show All": "عرض الكل",
    "Show Favorites": "عرض المفضلة",
    "Show Enabled": "عرض المفعّلة",
    "Show Disabled": "عرض المعطّلة",
    "Show New": "عرض الجديدة",
    "Show UserPlugins": "عرض إضافات المستخدم",
    "Show API Plugins": "عرض إضافات API",
    "Filter by Type": "تصفية حسب النوع",
    "Filter by Tags": "تصفية حسب الوسوم",
    "No plugins meet the search criteria.": "لا توجد إضافات تطابق البحث.",
    "Are you looking for:": "هل تبحث عن:",
    "Required Plugins": "الإضافات الأساسية",
    "This plugin is required for Vencord to function.": "هذه الإضافة ضرورية لعمل Vencord.",
    "This plugin is required by:": "هذه الإضافة مطلوبة من:",
    "The following plugins require a restart:": "هذه الإضافات تحتاج إعادة تشغيل:",
    "Unfavorite plugin": "إزالة من المفضلة",
    "Favorite plugin - pins it to the top of the plugin list": "إضافة إلى المفضلة: تثبيتها أعلى قائمة الإضافات",
    // Plugin window
    "Authors": "المطورون",
    "Settings": "الإعدادات",
    "View more info": "عرض مزيد من المعلومات",
    "View source code": "عرض الكود المصدري",
    "There are no settings for this plugin.": "لا توجد إعدادات لهذه الإضافة.",
    "Enter a number": "أدخل رقماً",
    "Select an option": "اختر خياراً",
    "Enter a value": "أدخل قيمة",
    "Invalid input provided": "القيمة المدخلة غير صالحة",
    "Reset": "إعادة تعيين",
    "Save": "حفظ",
    "Cancel": "إلغاء",
    "Close": "إغلاق",
    // Restart prompt
    "Restart Required": "إعادة التشغيل مطلوبة",
    "A restart is required to apply this change": "يلزم إعادة التشغيل لتطبيق هذا التغيير",
    "Restart now": "أعد التشغيل الآن",
    "Later!": "لاحقاً",
    // Screen share picker (DietyDis app window)
    "Screen Share Picker": "مشاركة الشاشة",
    "Screens": "الشاشات",
    "Windows": "النوافذ",
    "Entire Screen": "الشاشة بالكامل",
    "Entire screen": "الشاشة بالكامل",
    "What you're streaming": "ما تبثّه الآن",
    "Stream Settings": "إعدادات البث",
    "Resolution": "الدقة",
    "Frame Rate": "معدل الإطارات",
    "Source": "الأصلية",
    "Content Type": "نوع المحتوى",
    "Prefer Smoothness": "الأولوية للسلاسة",
    "Prefer Clarity": "الأولوية للوضوح",
    "Choosing \"Prefer Clarity\" will result in a significantly lower framerate in exchange for a much sharper and clearer image.":
        "اختيار «الأولوية للوضوح» يخفض عدد الإطارات كثيراً مقابل صورة أوضح وأدق بكثير.",
    "Stream With Audio": "البث مع الصوت",
    "Back": "رجوع",
    "Go Live": "بدء البث"
};

// Texts with a number in them
const vencordPatterns: [RegExp, string][] = [
    [/^Screen (\d+)$/, "الشاشة $1"]
];

function lookup(text: string) {
    const exact = vencordStrings[text];
    if (exact) return exact;
    for (const [re, to] of vencordPatterns) if (re.test(text)) return text.replace(re, to);
    return undefined;
}

// Where Vencord's plugin UI lives: its own vc-* elements, plus Discord popouts it opens
// (filter dropdowns, tooltips, the restart dialog)
const SCOPE = '[class*="vc-"], [class*="tooltip"], [role="listbox"], [role="option"], [role="dialog"], [class*="select"]';
const NEVER = '[data-list-id="chat-messages"], [class*="messageContent"], [class*="textArea"], [contenteditable]';

let observer: MutationObserver | undefined;

function inScope(el: Element | null) {
    return !!el && !!el.closest(SCOPE) && !el.closest(NEVER);
}

function translateText(node: Text) {
    const raw = node.nodeValue;
    if (!raw) return;
    const arabic = lookup(raw.trim());
    if (arabic && inScope(node.parentElement)) node.nodeValue = raw.replace(raw.trim(), arabic);
}

function translateTree(root: Node) {
    if (root.nodeType === Node.TEXT_NODE) return translateText(root as Text);
    if (!(root instanceof Element)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) translateText(n as Text);
    const inputs = root.matches("input[placeholder]") ? [root] : root.querySelectorAll("input[placeholder]");
    for (const input of inputs) {
        const arabic = vencordStrings[input.getAttribute("placeholder")!.trim()];
        if (arabic && inScope(input)) input.setAttribute("placeholder", arabic);
    }
}

export function startVencordUiTranslation() {
    if (observer) return;
    observer = new MutationObserver(records => {
        for (const r of records) {
            if (r.type === "characterData") translateText(r.target as Text);
            else r.addedNodes.forEach(translateTree);
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    translateTree(document.body ?? document.documentElement);
}

export function stopVencordUiTranslation() {
    observer?.disconnect();
    observer = undefined;
}
