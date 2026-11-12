# DietyDis

تطبيق Discord خاص لـ Windows 10 و11 (64-bit)، مبني على **Vesktop** (التطبيق) و**Vencord** (محرك الإضافات).

## محتوى المجلد

| الملف | وظيفته |
|---|---|
| `run-setup.bat` | تشغيل الإعداد كاملاً بضغطتين |
| `setup-dietydis.ps1` | السكربت الفعلي: ينزّل الكود، ينسخ الإضافات، يبني، يغيّر الاسم، يشغّل |
| `scripts/rebrand.mjs` | يحوّل Vesktop إلى DietyDis (الاسم، المعرّف، ملف التثبيت، النصوص الظاهرة) |
| `plugins/` | إضافات DietyDis، وهي المصدر الأساسي. تُنسخ إلى `Vencord\src\userplugins\` |
| `assets/icon.ico` | شعار التطبيق (غير موجود بعد، وحتى تضيفه يبقى شعار Vesktop) |

الكود المصدري يُنزَّل إلى `%USERPROFILE%\DietyDis-src\` (مجلد `Vencord` ومجلد `Vesktop`).

## التشغيل

```bat
run-setup.bat              :: بناء وتشغيل DietyDis
run-setup.bat -NoStart     :: بناء فقط
run-setup.bat -Package     :: بناء ملف التثبيت DietyDis-Setup-<version>.exe
```

المتطلبات: Node.js 22 أو أحدث، وGit. أما pnpm فيفعّله السكربت تلقائياً إن لم يكن موجوداً.

السكربت يضبط تلقائياً **Vencord Location** على نسختنا (`Vencord\dist`) في `%APPDATA%\DietyDis\state.json`، فلا حاجة لضبطها يدوياً.

بعد أول تشغيل:
1. فعّل إضافة **DietyDisArabic** من Settings > Plugins إن لم تكن مفعّلة.
2. أوقف التحديث التلقائي لـ Vencord من Settings > Updater، حتى لا تُستبدل نسختنا بالنسخة الأصلية.

## إضافة DietyDisArabic

- اتجاه تلقائي للنص: العربي من اليمين لليسار والإنجليزي من اليسار لليمين، في الرسائل والردود والـ embeds وحقل الكتابة.
- خط خاص للحروف العربية فقط (الافتراضي Segoe UI)، دون تغيير شكل الإنجليزي.
- حجم خاص للحروف العربية (80% إلى 150%).

## تطوير الإضافات

عدّل الإضافات داخل `plugins/` ثم أعد تشغيل `run-setup.bat`. وللتطوير السريع:

```bat
cd %USERPROFILE%\DietyDis-src\Vencord
pnpm watch      :: ثم Ctrl+R داخل التطبيق لإعادة التحميل
```

## ما تم تغييره في Vesktop

- الاسم: DietyDis، المعرّف `com.dietydis.app`، الملف التنفيذي `dietydis.exe`.
- ملف التثبيت: NSIS لـ x64 فقط، مع اختيار مجلد التثبيت.
- النصوص الظاهرة: عنوان النافذة، أيقونة الشريط، القوائم، رسائل الأخطاء.
- **تحديثات Vesktop التلقائية معطّلة**، حتى لا يُستبدل DietyDis بـ Vesktop.

## المرحلة الثانية (لم تبدأ بعد)

- دمج Vencord داخل ملف التثبيت نفسه (`extraResources`) بدل الاعتماد على مسار `DietyDis-src`.
- نظام تحديث خاص بـ DietyDis.
- تغيير بقية نصوص "Vesktop" في صفحة الإعدادات وUser Agent.
- شعار DietyDis.

## تنبيهات

- تعديل عميل Discord مخالف لشروط خدمته. جرّب على حساب ثانٍ.
- المشروع مرخص بـ GPL-3.0: إذا وزعت التطبيق يجب نشر الكود المصدري.
