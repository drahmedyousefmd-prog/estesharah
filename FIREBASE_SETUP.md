# تفعيل قاعدة Firebase المشتركة بين الموقعين

هذا الملف يخطّ لك خطوات ربط موقع «استشارة» (المريض) بموقع «روشتة» (الطبيب)
عبر Firebase Firestore واحد. الكود في `src/lib/firebase/` جاهز ويتعطل تلقائيًا
(localStorage فقط) حتى تملأ الإعدادات.

## 1) إنشاء مشروع Firebase (مرة واحدة، ~10 دقائق)
1. ادخل https://console.firebase.google.com وأنشئ مشروعًا (اضغط Go to console → Create project). اسمه مثل `rochetta-shared` (التعليمة لا تهم، يظهر بالرابط).
2. من القائمة: **Build → Firestore Database → Create database**.
   - الوضع: **production** (موصى به) أو test.
   - الموقع: منطقة قريبة (مثل `europe-west1` او `europe-west3`).
3. **Authentication → Get started → Sign-in method → Anonymous → Enable** (نحتاجه للتسجيل المجهول للمريض).
4. **Project settings (⚙) → Your apps → Add app → Web (</>)**.
   - اكتب اسمًا مثل `estesharah-web` واضغط Register app.
   - انسخ الكائن الناتج بهذا الشكل:

     ```js
     const firebaseConfig = {
       apiKey: "AIz...",
       authDomain: "rochetta-shared.firebaseapp.com",
       projectId: "rochetta-shared",
       storageBucket: "rochetta-shared.appspot.com",
       messagingSenderId: "...",
       appId: "1:...:web:..."
     };
     ```

## 2) لصق الإعدادات في المشروع
افتح `src/lib/firebase/config.ts` واستبدل `FIREBASE_CONFIG = null` بهذه القيم:

```ts
export const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "…",
  authDomain: "…",
  projectId: "…",
  storageBucket: "…",
  messagingSenderId: "…",
  appId: "…",
};
```

عندها: يُكتب أي تذكرة جديدة مباشرة في Firestore، وتُدفع رسائل الشات، ويشتغل
الاشتراك اللحظي (onSnapshot) لتذاكر هذا الجهاز.

> ملاحظة: البيانات المحلية (localStorage) تبقى وتعمل كما هي — Firestore إضافة،
> والقراءة من الجهاز/سحاب تُدمج بالمعرّف.

## 3) نشر قواعد الأمان
من مجلد المشروع بعد تثبيت أدوات Firebase:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # اختر firestore.rules و projectId
firebase deploy --only firestore:rules
```

نموذج القواعد الجاهز موجود بالفعل في `firestore.rules`. منطقها:

- **المريض** يقرأ/يكتب تذاكره فقط: `owner_uid == request.auth.uid` (التسجيل
  المجهول) أو `guest_token` مطابق.
- **الطبيب** وحده يقرأ/يرد على كل التذاكر: بوجود مدخل في
  `admin/doctors/{uid}` (أضفه يدويًا من الكونسول بعد تسجيل دخول الطبيب الأول،
  أو عدّل القواعد لقبول custom claim `role == "doctor"`).

## 4) سماح النطاق (اختياري، للوقاية من إساءة الاستخدام)
من Firebase console → **Authentication → Settings → Authorized domains** أضف
دومين موقع «استشارة» النهائي ودومين «روشتة».

## 5) بعد التفعيل
1. ابنِ ونشر موقع «استشارة» على دومينه الخاص.
2. ابنِ ونشر موقع «روشتة» (شغّل `/doctor/inbox` من Firestore بدل localStorage —
   هذه خطوة الفصل النهائية المرحّلة).
3. احذف مسار `/patient` من «روشتة».

## حدود معروفة (حتى اشعار آخر)
- المرفقات (صور/PDF) لا تُنقل إلى Firestore حاليًا (ذات القيد المطبق في رابط
  الاستيراد القديم) — تبقى على جهاز المُرسِل وتصل الطبيب بمشاركتها عبر
  WhatsApp/Gmail.
- حسابات المرضى (بريد/كلمة مرور) تبقى محلية؛ والمزامنة السحابية تتم عبر
  **guest flow** (`guest_token` / التسجيل المجهول). اختراق الحسابات السحابية
  تحسين مرحّلة.