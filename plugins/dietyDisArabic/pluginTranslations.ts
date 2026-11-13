/*
 * DietyDis, a custom Discord desktop app based on Vesktop and Vencord
 * Copyright (c) 2026 DietyDis contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Arabic descriptions for DietyDis plugins, applied at runtime so the ported plugin sources stay
// untouched (easier to update from Equicord). d = plugin description, o = option descriptions.

// A setting is either its description, or { n: title, d: description, s: select option labels in order }
export type SettingTexts = string | { n?: string; d?: string; s?: string[]; };
export type PluginTexts = { d?: string; o?: Record<string, SettingTexts>; };

export const pluginTranslations: Record<string, PluginTexts> = {
    DietyDisArabic: {
        d: "دعم العربية في DietyDis: لغة الواجهة، واتجاه تلقائي للنص، وخطوط عربية مدمجة",
        o: {
            uiLanguage: "لغة الواجهة: العربية، أو الإنجليزية الأصلية (أيضاً في الإعدادات > لغة الواجهة)",
            autoDirection: "اتجاه تلقائي للنص: العربي من اليمين لليسار والإنجليزي من اليسار لليمين",
            autoDirectionNames: "الاتجاه التلقائي أيضاً في أسماء القنوات والمستخدمين والسيرفرات والحالات والبحث",
            isolateMentions: "منع تداخل المنشن والروابط والأكواد مع النص العربي حولها",
            customFont: "استخدام خط خاص للحروف العربية فقط",
            arabicFont: "الخط العربي (الأربعة الأولى مدمجة في التطبيق وتظهر عند الجميع)",
            customFontName: "اسم الخط المثبت على جهازك (عند اختيار «خط آخر»)",
            arabicSize: "حجم الحروف العربية بالنسبة للإنجليزي (%)",
            missingStrings: "انسخ النصوص الإنجليزية التي ظهرت لك بلا ترجمة، وأرسلها لنضيفها إلى القاموس"
        }
    },
    ChannelTabs: {
        d: "اجمع القنوات التي تزورها كثيراً في تبويبات مثل المتصفح",
        o: {
            onStartup: "عند التشغيل",
            showStatusIndicators: "إظهار حالة الاتصال في تبويبات الرسائل الخاصة",
            bookmarkNotificationDot: "إظهار نقطة الإشعارات على الإشارات المرجعية",
            persistUnreadCountFallback: "الاحتفاظ بعدّاد غير المقروء للتبويبات والإشارات المرجعية بعد إعادة التحميل",
            widerTabsAndBookmarks: "تبويبات وإشارات مرجعية أعرض للشاشات الكبيرة",
            tabHeightScale: "ارتفاع التبويب (نسبة مئوية).",
            renderAllTabs: "إبقاء كل التبويبات في الذاكرة للتنقل الأسرع (يحفظ موضع التمرير والحالة)",
            switchToExistingTab: "الانتقال إلى التبويب إن كان مفتوحاً للقناة التي تذهب إليها",
            createNewTabIfNotExists: "فتح تبويب جديد إن لم يكن للقناة التي تذهب إليها تبويب",
            enableRapidNavigation: "التنقل السريع: عند التنقل بسرعة بين القنوات يُستبدل التبويب الحالي بدل فتح تبويبات جديدة",
            rapidNavigationThreshold: "مدة التنقل السريع بالثواني: خلالها تحل القنوات الجديدة محل التبويب الحالي بدل فتح تبويبات جديدة.",
            tabBarPosition: "مكان شريط التبويبات.",
            enableNumberKeySwitching: "التنقل بين التبويبات بأزرار الأرقام (1-9)",
            numberKeySwitchCount: "عدد التبويبات التي يمكن الوصول إليها بأزرار الأرقام (1-9)",
            enableCloseTabShortcut: "تفعيل اختصار لوحة المفاتيح لإغلاق التبويب",
            enableNewTabShortcut: "تفعيل اختصار لوحة المفاتيح لتبويب جديد",
            enableTabCycleShortcut: "تفعيل اختصار لوحة المفاتيح للتنقل بين التبويبات بالدور",
            showTabNumbers: "إظهار أرقام على التبويبات توضح اختصارات لوحة المفاتيح",
            tabNumberPosition: "مكان الرقم على التبويب",
            compactAutoExpandSelected: "توسيع التبويب المضغوط تلقائياً عند اختياره لإظهار اسم القناة كاملاً",
            compactAutoExpandOnHover: "توسيع التبويب المضغوط تلقائياً عند مرور المؤشر لإظهار اسم القناة كاملاً",
            openInNewTabAutoSwitch: "الانتقال تلقائياً إلى التبويب المفتوح من خيار «فتح في تبويب جديد»",
            bookmarksIndependentFromTabs: "التنقل بالإشارات المرجعية دون التأثير على شريط التبويبات",
            showResizeHandle: "إظهار مقبض تغيير العرض عند مرور المؤشر على التبويبات",
            openNewTabsInCompactMode: "فتح التبويبات الجديدة مضغوطة افتراضياً",
            newTabButtonBehavior: "زر التبويب الجديد (+) يلحق التبويبات بدل أن يبقى مثبتاً في الطرف",
            oneTabPerServer: "تبويب واحد لكل سيرفر: فتح قناة أخرى في نفس السيرفر يستخدم تبويبه الموجود.",
            maxOpenTabs: "أقصى عدد للتبويبات المفتوحة (0 = بلا حد)"
        }
    },
    CommandPalette: {
        d: "قائمة أوامر سريعة لتنفيذ الإجراءات من أي مكان في Discord",
        o: { closeAfterExecute: "إغلاق القائمة بعد تنفيذ الأمر." }
    },
    CustomSounds: {
        d: "تخصيص أصوات Discord.",
        o: { soundpack: "حزمة الأصوات المستخدمة بدل المضبوطة في Discord." }
    },
    FindReply: {
        d: "الانتقال إلى أول رد على رسالة في القناة (يسهّل متابعة المحادثات السابقة).",
        o: {
            includePings: "البحث أيضاً في الرسائل التي تذكر الكاتب مباشرة بـ @",
            includeAuthor: "البحث أيضاً في كل الردود على الكاتب، وليس على هذه الرسالة فقط",
            hideButtonIfNoReply: "إخفاء الزر إن لم توجد ردود على الرسالة"
        }
    },
    MediaPlaybackSpeed: {
        d: "تغيير سرعة التشغيل (الافتراضية) للصوت والفيديو",
        o: {
            defaultVoiceMessageSpeed: "الرسائل الصوتية",
            defaultVideoSpeed: "الفيديو",
            defaultAudioSpeed: "الملفات الصوتية"
        }
    },
    MessageLoggerEnhanced: {
        d: "تحسين MessageLogger: سجل تعديلات الرسائل، وكشف المنشن المحذوف، والمزيد",
        o: {
            saveMessages: "حفظ الرسائل المحذوفة والمعدلة.",
            saveImages: "حفظ المرفقات المحذوفة.",
            sortNewest: "ترتيب السجل من الأحدث.",
            cacheMessagesFromServers: "عادة يسجل الرسائل الخاصة والمعرّفات المسموحة فقط. التفعيل يسجل رسائل كل السيرفرات أيضاً، وقد يتجاوز الحد فتضيع بعض الرسائل. إذا كنت في سيرفرات كثيرة فقد يكبر السجل كثيراً ويحوي رسائل لا تهمك.",
            ignoreBots: "تجاهل رسائل البوتات",
            ignoreWebhooks: "تجاهل رسائل الـ webhooks",
            ignoreSelf: "تجاهل رسائلك أنت",
            ignoreMutedGuilds: "عدم تسجيل رسائل السيرفرات المكتومة. المستخدمون والقنوات المسموحة فيها تُسجل رغم ذلك.",
            ignoreMutedCategories: "عدم تسجيل رسائل القنوات في الفئات المكتومة. المستخدمون والقنوات المسموحة تُسجل رغم ذلك.",
            ignoreMutedChannels: "عدم تسجيل رسائل القنوات المكتومة. المستخدمون والقنوات المسموحة تُسجل رغم ذلك.",
            alwaysLogDirectMessages: "تسجيل الرسائل الخاصة دائماً",
            alwaysLogCurrentChannel: "تسجيل القناة المفتوحة حالياً دائماً. القنوات والمستخدمون المحظورون يُتجاهلون رغم ذلك.",
            permanentlyRemoveLogByDefault: "زر الحذف في MessageLogger الأساسي يحذف السجل نهائياً",
            hideMessageFromMessageLoggers: "يضيف زراً في قائمة الرسالة لحذف رسائلك دون أن تسجلها أدوات التسجيل الأخرى. قد لا يكون آمناً، استخدمه على مسؤوليتك.",
            ShowWhereMessageIsFrom: "إظهار اسم القناة أو الكاتب واسم السيرفر",
            messagesToDisplayAtOnceInLogs: "عدد الرسائل المعروضة في السجل دفعة واحدة، وعدد ما يُحمَّل عند طلب المزيد.",
            hideMessageFromMessageLoggersDeletedMessage: "النص الذي يحل محل الرسالة عند استخدام ميزة الإخفاء عن أدوات التسجيل.",
            messageLimit: "أقصى عدد للرسائل المحفوظة. تُحذف الأقدم عند بلوغ الحد. 0 = بلا حد",
            attachmentSizeLimitInMegabytes: "أقصى حجم للمرفق المحفوظ بالميجابايت. المرفقات الأكبر لا تُحفظ.",
            attachmentFileExtensions: "امتدادات الملفات المحفوظة، مفصولة بفواصل. المرفقات بامتداد غير مذكور لا تُحفظ.",
            cacheLimit: "أقصى عدد للرسائل في الذاكرة المؤقتة. تُحذف الأقدم عند بلوغ الحد، فيقل استهلاك الذاكرة. 0 = بلا حد",
            timeBasedCleanupMinutes: "حذف رسائل السيرفرات الأقدم من هذا العدد من الدقائق تلقائياً. 0 يعطّل التنظيف.",
            preserveCurrentChannel: "عدم تطبيق التنظيف الزمني على القناة المفتوحة حالياً.",
            whitelistedIds: "معرّفات سيرفرات أو قنوات أو مستخدمين تظهر في السجل دائماً.",
            blacklistedIds: "معرّفات سيرفرات أو قنوات أو مستخدمين لا تظهر في السجل أبداً.",
            imageCacheDir: "اختيار مجلد الصور المحفوظة",
            logsDir: "اختيار مجلد السجلات",
            importLogs: "استيراد السجلات من ملف",
            exportLogs: "تصدير السجلات",
            clearLogsOnRestart: "مسح السجلات عند إعادة تشغيل Discord.",
            openLogs: "فتح السجلات",
            openImageCacheFolder: "فتح مجلد الصور المحفوظة",
            clearLogs: "مسح السجلات"
        }
    },
    Quoter: {
        d: "إنشاء صورة اقتباس ملهمة من رسالة.",
        o: {
            quoteFont: "خط نص الاقتباس (اسم الكاتب يستخدم دائماً M PLUS Rounded 1c)",
            watermark: "نص العلامة المائية (32 حرفاً كحد أقصى)"
        }
    },
    StatusPresets: {
        d: "حفظ حالاتك واستخدامها لاحقاً بسرعة",
        o: { StatusPresets: "الحالات المحفوظة" }
    },
    AudioPlayerAPI: { d: "واجهة لتشغيل أصوات Discord الداخلية أو روابط صوتية خارجية (تحتاجها CustomSounds)." },
    ConcatenatedModules: { d: "يستخرج أيقونات Discord المدمجة (تحتاجها ChannelTabs لأيقونات المجلدات)." }
};
