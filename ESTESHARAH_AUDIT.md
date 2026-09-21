# يوميات مشروع «استشارة» — بوابة المريض

مستودع منفصل للموقع الخاص بالمريض (مقترن بمستودع «روشتة» للطبيب). انطلق هذا
المستودع من فصل واجهة `/patient` والكود المرتبط بها عن مشروع Rochetta الأصلي.

---

## 1. جولة 1 — إنشاء الموقع منفصلًا (2026-09-21)

| الميزة | الحالة |
|---|---|
| **مشروع جديد `estesharah`** على القرص — نسخة كاملة Next 16 static، مستقل عن Rochetta، بدون أي أثر لكود الطبيب أو المحتوى المرجعي (حُذفت `app/doctor`, `app/import`, `components/doctor`, `components/ui`, `data/prescriptions.json`, `lib/chapters|content|recents`, مكوّنات الهبوط للطبيب) | OK |
| **المسارات**: `/` (بطاقات الخدمات الست مباشرة)، `/new/[serviceType]` (6 نماذج)، `/tickets` (قائمة + شات)، `/login` (حساب المريض الاختياري فقط) — كل روابط `/patient/…` أعيدت إلى الجذر | OK |
| **العلامة** `استشارة` — هوية جديدة في `lib/site.ts` (وصف، وسم OG، مانيفست، sitemap)، مع `DOCTOR_SITE_URL` لرابط الاستيراد إلى روشتة | OK |
| **ربط متبادل**: رابط «أنا طبيب — تسجيل الدخول» أسفل الرئيسية → `DOCTOR_SITE_URL/login` | OK |
| **طبقة Firebase جاهزة** — `lib/firebase/config.ts` (معطَّلة: `null` حتى ملء القيم)، `lib/firebase/firestore.ts` (دفع تذكرة/رسالة + اشتراك onSnapshot بمعرّف التذاكر؛ تسجيل مجهول + `owner_uid`)، وحقن تحفظ في `portal-store` (createTicket/addMessage/initPortal) | OK |
| **تقسيم الحزمة**: حزمة Firebase لا تُحمَّل مسبقًا (`FIREBASE EAGER: false`) — تُجلب فقط عند ضبط الإعدادات | OK |
| `firestore.rules` + `FIREBASE_SETUP.md` — نموذج القواعد (المريض يرى تذاكره فقط، الطبيب عبر `admin/doctors/{uid}`) وخطوات التنشيط | OK |
| التحقق: `lint` 0 أخطاء، `build` أخضر (15 صفحة)، فحص `out/`: لا توجد أي روابط `/patient/` أو `/doctor/`، وجود الصفحات والروابط | OK |

**خطوات الانتظار (تحتاج إجراء المستخدم):**
1. إنشاء مشروع Firebase وملء `FIREBASE_CONFIG` (تعليمات `FIREBASE_SETUP.md`).
2. اختيار النطاق الخاص وتحديث `SITE_URL` في `lib/site.ts` ثم النشر.
3. بعد إطلاق هذا الموقع: حذف مسار `/patient` نهائيًا من «روشتة» وتوصيل
   `/doctor/inbox` بالـ Firestore (المرحلة القادمة في مستودع Rochetta).

*نهاية جولة 1.*

---

## 2. جولة 2 — استضافة GitHub Pages مؤقتة (2026-09-21)

| الميزة | الحالة |
|---|---|
| المستودع العام `drahmedyousefmd-prog/estesharah` (main `398efca…` — شِمال `da056ec` أول جولة) | OK |
| **بناء مؤقت بنطاق فرعي**: `basePath`/`assetPrefix = "/estesharah"` في `next.config.ts` حتى قدوم النطاق الخاص؛ كل الأصول والروابط مسبوقة (`/estesharah/_next/…`، `/estesharah/tickets`…) مع فحص المخرجات | OK |
| `SITE_URL` → `https://drahmedyousefmd-prog.github.io/estesharah` (مرجع meta/OG/sitemap مؤقت) — مع تعليق يوضح الإزالة عند النطاق النهائي | OK |
| سكربت نشر `scripts/deploy.ps1` (نمط روشتة: build → تقليم RSC .txt → مزامنة `out/` → فرض فرع `gh-pages`) مع نسخة عمل مؤقتة `opencode/estesharah-pages` (هوية git محلية) | OK |
| فرع `gh-pages` مبني (`2eeb44a`) وPages مفعّلة (project site) URL: `https://drahmedyousefmd-prog.github.io/estesharah/` | OK |
| المراجعة الحية للموقع المنشور | لاحقًا بعد إتمام البناء (R1) |

**ملاحظات هذا الطور:**
- الرابط «أنا طبيب — تسجيل الدخول» في أسفل الرئيسية يستهدف `DOCTOR_SITE_URL/login`
  وهو دومين روشتة وليس المقصود — يجب فحصه حيًا؛ إن فشل الرجوع إلى نطاق استشارة الفرعي
  (لا يوجد مسار `/login` على دومين روشتة) فهو سلوك متعمد: الطبيب يفتح `/login` من دومين
  روشتة مباشرة، بينما المريض في استشارة.
- عند قيام النطاق الخاص: احذف `basePath`/`assetPrefix` من `next.config.ts`، وعدّل
  `SITE_URL`، وأعد النشر. مسار GitHub Pages الفرعي يُهمل.

*نهاية جولة 2.*