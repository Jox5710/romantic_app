with open(r"c:\Users\youss\Desktop\jox\courses\romantic_app\romantic_app\user-guide.html", "w", encoding="utf-8") as out:
    out.write("""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Forever — Your Complete Guide / دليلك الشامل</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Manrope:wght@300;400;500;600&family=Caveat:wght@400;600&family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --gold: #c9a84c;
      --gold-light: #e8c97a;
      --gold-pale: #f5e9c8;
      --ivory: #f2ede4;
      --bg: #0d0a07;
      --surface: #141209;
      --surface2: #1c1810;
      --muted: #6b6358;
      --line: #2a2318;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Manrope', sans-serif;
      background: var(--bg);
      color: var(--ivory);
      font-size: 10.5pt;
      line-height: 1.75;
    }

    /* ─── COVER PAGE ─── */
    .cover {
      height: 100vh;
      min-height: 700px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 60px 40px;
      position: relative;
      background: radial-gradient(ellipse at 50% 40%, #1e1608 0%, var(--bg) 70%);
      page-break-after: always;
    }

    .cover::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle, rgba(201,168,76,0.06) 1px, transparent 1px);
      background-size: 28px 28px;
      pointer-events: none;
    }

    .cover-ornament {
      font-family: 'Cormorant Garamond', serif;
      font-size: 48pt;
      color: var(--gold);
      line-height: 1;
      margin-bottom: 8px;
      opacity: 0.7;
    }

    .cover-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 64pt;
      font-weight: 300;
      color: var(--gold-light);
      letter-spacing: 0.15em;
      line-height: 1;
      margin-bottom: 16px;
    }

    .cover-subtitle {
      font-family: 'Manrope', sans-serif;
      font-size: 11pt;
      font-weight: 300;
      color: var(--muted);
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin-bottom: 48px;
    }

    .cover-divider {
      width: 120px;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
      margin: 0 auto 48px;
    }

    .cover-tagline {
      font-family: 'Cormorant Garamond', serif;
      font-size: 16pt;
      font-style: italic;
      color: rgba(242,237,228,0.6);
      max-width: 420px;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .cover-tagline-ar {
      font-family: 'Tajawal', sans-serif;
      font-size: 15pt;
      color: rgba(242,237,228,0.6);
      max-width: 420px;
      line-height: 1.8;
    }

    .cover-footer {
      position: absolute;
      bottom: 40px;
      font-size: 8pt;
      color: var(--muted);
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }

    /* ─── TOC PAGE ─── */
    .toc-page {
      padding: 60px 72px;
      page-break-after: always;
      min-height: 100vh;
    }

    .toc-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28pt;
      color: var(--gold-light);
      font-weight: 300;
      margin-bottom: 10px;
      letter-spacing: 0.05em;
    }

    .toc-title-ar {
      font-family: 'Tajawal', sans-serif;
      font-size: 20pt;
      color: var(--gold);
      font-weight: 300;
      margin-bottom: 40px;
    }

    .toc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 48px;
    }

    .toc-item {
      display: flex;
      align-items: baseline;
      gap: 10px;
      padding: 7px 0;
      border-bottom: 1px solid var(--line);
    }

    .toc-num {
      font-family: 'Cormorant Garamond', serif;
      font-size: 13pt;
      color: var(--gold);
      min-width: 28px;
    }

    .toc-name {
      font-size: 10pt;
      color: var(--ivory);
      font-weight: 400;
      flex: 1;
    }

    .toc-name-ar {
      font-family: 'Tajawal', sans-serif;
      font-size: 10pt;
      color: var(--gold-pale);
      text-align: right;
      flex: 1;
    }

    /* ─── SECTION PAGES ─── */
    .section-intro {
      padding: 60px 72px;
      page-break-after: always;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .section-intro-label {
      font-size: 8pt;
      letter-spacing: 0.35em;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 16px;
    }

    .section-intro-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 42pt;
      font-weight: 300;
      color: var(--gold-light);
      line-height: 1.1;
      margin-bottom: 24px;
    }

    .section-intro-title-ar {
      font-family: 'Tajawal', sans-serif;
      font-size: 32pt;
      font-weight: 300;
      color: var(--gold);
      line-height: 1.3;
      margin-bottom: 24px;
    }

    .section-intro-body {
      font-size: 12pt;
      color: rgba(242,237,228,0.65);
      max-width: 500px;
      line-height: 1.8;
      font-weight: 300;
      margin-bottom: 24px;
    }

    .section-intro-body-ar {
      font-family: 'Tajawal', sans-serif;
      font-size: 12pt;
      color: rgba(242,237,228,0.65);
      max-width: 500px;
      line-height: 1.8;
      font-weight: 300;
      direction: rtl;
    }

    /* ─── FEATURE PAGE ─── */
    .feature-page {
      padding: 52px 72px;
      page-break-after: always;
      min-height: 100vh;
    }

    .feature-header {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 36px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--line);
    }

    .feature-icon {
      font-size: 32pt;
      line-height: 1;
      min-width: 48px;
    }

    .feature-number {
      font-family: 'Cormorant Garamond', serif;
      font-size: 11pt;
      color: var(--gold);
      letter-spacing: 0.15em;
      margin-bottom: 4px;
    }

    .feature-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 30pt;
      font-weight: 300;
      color: var(--gold-light);
      line-height: 1.1;
    }

    .feature-tagline {
      font-size: 10pt;
      color: var(--muted);
      margin-top: 4px;
      font-style: italic;
    }

    .feature-lead {
      font-size: 12pt;
      font-weight: 300;
      color: var(--ivory);
      line-height: 1.8;
      margin-bottom: 28px;
    }

    .feature-body {
      font-size: 10.5pt;
      color: rgba(242,237,228,0.75);
      line-height: 1.85;
      margin-bottom: 20px;
    }

    .feature-steps {
      margin: 20px 0;
    }

    .step {
      display: flex;
      gap: 14px;
      margin-bottom: 14px;
      align-items: flex-start;
    }

    .step-num {
      min-width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(201,168,76,0.12);
      border: 1px solid rgba(201,168,76,0.3);
      color: var(--gold);
      font-family: 'Cormorant Garamond', serif;
      font-size: 12pt;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .step-text {
      font-size: 10.5pt;
      color: rgba(242,237,228,0.8);
      line-height: 1.7;
    }

    .tip-box {
      background: rgba(201,168,76,0.06);
      border: 1px solid rgba(201,168,76,0.2);
      border-radius: 10px;
      padding: 16px 20px;
      margin: 20px 0;
    }

    .tip-label {
      font-size: 8pt;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 6px;
      font-weight: 600;
    }

    .tip-text {
      font-size: 10pt;
      color: rgba(242,237,228,0.7);
      line-height: 1.7;
    }

    /* ─── ARABIC SECTION (FULL DETAILS) ─── */
    .arabic-section {
      direction: rtl;
      text-align: right;
      margin-top: 40px;
      padding-top: 32px;
      border-top: 1px solid var(--line);
      font-family: 'Tajawal', sans-serif;
    }

    .arabic-title {
      font-size: 22pt;
      color: var(--gold-light);
      margin-bottom: 8px;
      font-weight: 500;
    }

    .arabic-tagline {
      font-size: 12pt;
      color: var(--muted);
      margin-bottom: 24px;
    }

    .arabic-lead {
      font-size: 13pt;
      font-weight: 400;
      color: var(--ivory);
      line-height: 1.9;
      margin-bottom: 24px;
    }

    .arabic-body {
      font-size: 11.5pt;
      color: rgba(242,237,228,0.75);
      line-height: 1.9;
      margin-bottom: 16px;
    }
    
    .arabic-steps {
      margin: 20px 0;
    }
    
    .arabic-step {
      display: flex;
      gap: 14px;
      margin-bottom: 14px;
      align-items: flex-start;
    }
    
    .arabic-step-text {
      font-size: 11pt;
      color: rgba(242,237,228,0.8);
      line-height: 1.8;
      padding-top: 2px;
    }

    .arabic-tip-box {
      background: rgba(201,168,76,0.06);
      border: 1px solid rgba(201,168,76,0.2);
      border-radius: 10px;
      padding: 16px 20px;
      margin: 20px 0;
    }

    .arabic-tip-label {
      font-size: 10pt;
      color: var(--gold);
      margin-bottom: 8px;
      font-weight: 700;
    }

    .arabic-tip-text {
      font-size: 11pt;
      color: rgba(242,237,228,0.7);
      line-height: 1.8;
    }

    /* ─── GETTING STARTED ─── */
    .getting-started {
      padding: 52px 72px;
      page-break-after: always;
    }

    .gs-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 32pt;
      font-weight: 300;
      color: var(--gold-light);
      margin-bottom: 32px;
    }

    .gs-step {
      display: flex;
      gap: 24px;
      margin-bottom: 32px;
      align-items: flex-start;
    }

    .gs-circle {
      min-width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 1px solid var(--gold);
      color: var(--gold);
      font-family: 'Cormorant Garamond', serif;
      font-size: 20pt;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .gs-step-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 18pt;
      color: var(--ivory);
      margin-bottom: 6px;
    }

    .gs-step-body {
      font-size: 10.5pt;
      color: rgba(242,237,228,0.7);
      line-height: 1.8;
    }

    /* ─── TWO-COLUMN LAYOUT ─── */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin: 20px 0;
    }

    .col-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 18px;
    }

    .col-card-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 13pt;
      color: var(--gold);
      margin-bottom: 8px;
    }

    .col-card-body {
      font-size: 10pt;
      color: rgba(242,237,228,0.65);
      line-height: 1.7;
    }

    .col-card-title-ar {
      font-family: 'Tajawal', sans-serif;
      font-size: 13pt;
      color: var(--gold);
      margin-bottom: 8px;
      font-weight: bold;
    }

    .col-card-body-ar {
      font-size: 11pt;
      color: rgba(242,237,228,0.65);
      line-height: 1.8;
    }

    /* ─── PRINT STYLES ─── */
    @media print {
      body { background: #0d0a07 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cover { height: 100vh; }
      .no-print { display: none; }
      @page { margin: 0; size: A4; }
    }

    /* ─── UTILITY ─── */
    .gold { color: var(--gold); }
    .italic { font-style: italic; }
    .small { font-size: 9pt; color: var(--muted); }
    .spacer { height: 20px; }
    .handwritten { font-family: 'Caveat', cursive; font-size: 14pt; color: var(--gold-light); }
    .handwritten-ar { font-family: 'Tajawal', sans-serif; font-size: 12pt; color: var(--gold-light); font-style: italic;}
  </style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-ornament">✦</div>
  <div class="cover-title">Forever</div>
  <div class="cover-subtitle">Your Private Sanctuary</div>
  <div class="cover-divider"></div>
  <div class="cover-tagline">
    A complete guide to every feature of your shared digital home — written for the two of you.
  </div>
  <div class="cover-tagline-ar" dir="rtl">
    دليل شامل لكل تفاصيل ملاذكما الرقمي المشترك — كُتب خصيصاً لكما.
  </div>
  <div class="cover-footer">Forever · User Guide · All Features Explained</div>
</div>

<!-- TOC -->
<div class="toc-page">
  <div class="toc-title">Inside This Guide</div>
  <div class="toc-title-ar" dir="rtl">محتويات الدليل</div>

  <div class="toc-grid">
    <div class="toc-item"><div class="toc-num">—</div><div class="toc-name">Getting Started</div><div class="toc-name-ar">البداية وإعداد الحساب</div></div>
    <div class="toc-item"><div class="toc-num">01</div><div class="toc-name">Your Dashboard</div><div class="toc-name-ar">الصفحة الرئيسية</div></div>
    <div class="toc-item"><div class="toc-num">02</div><div class="toc-name">Vibe Sync</div><div class="toc-name-ar">مزامنة الحالة</div></div>
    <div class="toc-item"><div class="toc-num">03</div><div class="toc-name">Daily Prompt</div><div class="toc-name-ar">سؤال اليوم</div></div>
    <div class="toc-item"><div class="toc-num">04</div><div class="toc-name">Heartbeat</div><div class="toc-name-ar">نبضة قلب</div></div>
    <div class="toc-item"><div class="toc-num">05</div><div class="toc-name">Gratitude Trail</div><div class="toc-name-ar">درب الامتنان</div></div>
    <div class="toc-item"><div class="toc-num">06</div><div class="toc-name">Whisper</div><div class="toc-name-ar">الهمسة</div></div>
    <div class="toc-item"><div class="toc-num">07</div><div class="toc-name">Memory Timeline</div><div class="toc-name-ar">مسيرة الذكريات</div></div>
    <div class="toc-item"><div class="toc-num">08</div><div class="toc-name">Constellation</div><div class="toc-name-ar">الكوكبة</div></div>
    <div class="toc-item"><div class="toc-num">09</div><div class="toc-name">Echo Calendar</div><div class="toc-name-ar">صدى التقويم</div></div>
    <div class="toc-item"><div class="toc-num">10</div><div class="toc-name">Bucket List</div><div class="toc-name-ar">قائمة الأحلام</div></div>
    <div class="toc-item"><div class="toc-num">11</div><div class="toc-name">Time Capsule</div><div class="toc-name-ar">كبسولة الزمن</div></div>
    <div class="toc-item"><div class="toc-num">12</div><div class="toc-name">Mirror Mode</div><div class="toc-name-ar">وضع المرآة</div></div>
    <div class="toc-item"><div class="toc-num">13</div><div class="toc-name">Promise Ledger</div><div class="toc-name-ar">سجل الوعود</div></div>
    <div class="toc-item"><div class="toc-num">14</div><div class="toc-name">Us Map</div><div class="toc-name-ar">خريطتنا</div></div>
    <div class="toc-item"><div class="toc-num">15</div><div class="toc-name">Blueprint</div><div class="toc-name-ar">المخطط الشخصي</div></div>
    <div class="toc-item"><div class="toc-num">16</div><div class="toc-name">Secret Missions</div><div class="toc-name-ar">المهام السرية</div></div>
    <div class="toc-item"><div class="toc-num">17</div><div class="toc-name">Truce / Safe Harbor</div><div class="toc-name-ar">الملاذ الآمن / الهدنة</div></div>
    <div class="toc-item"><div class="toc-num">18</div><div class="toc-name">Swipe to Eat</div><div class="toc-name-ar">قرار العشاء</div></div>
    <div class="toc-item"><div class="toc-num">19</div><div class="toc-name">Shared Canvas</div><div class="toc-name-ar">اللوحة المشتركة</div></div>
    <div class="toc-item"><div class="toc-num">20</div><div class="toc-name">The Queue</div><div class="toc-name-ar">قائمة الانتظار</div></div>
    <div class="toc-item"><div class="toc-num">21</div><div class="toc-name">Voice Notes</div><div class="toc-name-ar">الرسائل الصوتية</div></div>
  </div>

  <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--line);">
    <p class="handwritten">" Everything here exists only for the two of you. "</p>
    <p class="handwritten-ar" dir="rtl" style="margin-top: 10px;">" كل ما هنا موجود لكما وحدكما. "</p>
    <div class="spacer"></div>
    <p class="small">Forever is a private, invite-only app. Only you and your partner can see what's inside. Nothing is shared publicly. Your space, your story.</p>
    <p class="small" dir="rtl" style="margin-top: 8px; font-family: 'Tajawal', sans-serif;">التطبيق عبارة عن ملاذ خاص يعتمد على الدعوات فقط. لا يمكن لأحد رؤية ما بداخله سواكما. لا يتم مشاركة أي شيء علناً. مساحتكما، وقصتكما.</p>
  </div>
</div>

<!-- GETTING STARTED -->
<div class="getting-started">
  <div class="feature-number">BEFORE YOU BEGIN</div>
  <div class="gs-title">Getting Started</div>

  <div class="gs-step">
    <div class="gs-circle">1</div>
    <div>
      <div class="gs-step-title">Sign In with Your Email</div>
      <div class="gs-step-body">
        Open Forever and enter your email address. We'll send you a magic link — no password needed, ever. Just click the link in your email and you're in.
      </div>
    </div>
  </div>

  <div class="gs-step">
    <div class="gs-circle">2</div>
    <div>
      <div class="gs-step-title">Create the Space</div>
      <div class="gs-step-body">
        The first person to sign in sets up the sanctuary. You'll enter your name, your partner's email, your relationship date, and a "Secret Capsule Passphrase" (keep this safe, it's used to encrypt your future letters and is never stored on our servers).
      </div>
    </div>
  </div>

  <div class="gs-step">
    <div class="gs-circle">3</div>
    <div>
      <div class="gs-step-title">Invite Your Partner</div>
      <div class="gs-step-body">
        Send the private invite link to your partner. When they open it, your sanctuary is connected. Both of you will land on your shared dashboard.
      </div>
    </div>
  </div>

  <div class="arabic-section">
    <div class="arabic-title">البداية وإعداد الحساب</div>
    <div class="arabic-tagline">خطوات بسيطة للوصول إلى ملاذكما.</div>
    
    <div class="arabic-steps">
      <div class="arabic-step">
        <div class="step-num">١</div>
        <div class="arabic-step-text"><strong>تسجيل الدخول:</strong> أدخل بريدك الإلكتروني ليصلك "رابط سحري" للدخول المباشر، لا حاجة لكلمات مرور.</div>
      </div>
      <div class="arabic-step">
        <div class="step-num">٢</div>
        <div class="arabic-step-text"><strong>إنشاء الملاذ:</strong> يقوم الشخص الأول بإعداد المساحة بإدخال اسمه، وبريد شريكه، وتاريخ العلاقة المميز، و"عبارة سرية للكبسولة". (تذكروا هذه العبارة جيداً لأنها لا تُحفظ في خوادمنا وتُستخدم لتشفير رسائلكم المستقبلية).</div>
      </div>
      <div class="arabic-step">
        <div class="step-num">٣</div>
        <div class="arabic-step-text"><strong>دعوة الشريك:</strong> أرسل رابط الدعوة الخاص لشريكك، وبمجرد قبوله تصبح مساحتكما المشتركة جاهزة للاستخدام.</div>
      </div>
    </div>
  </div>
</div>

<!-- SECTION INTRO: DAILY -->
<div class="section-intro" style="background: radial-gradient(ellipse at 30% 50%, #1a1108 0%, var(--bg) 65%);">
  <div class="section-intro-label">Part One</div>
  <div class="section-intro-title">Your Daily<br/>Rituals</div>
  <div class="section-intro-body">
    Six features designed to be visited every day. Small moments, consistent presence, a thousand tiny threads weaving you closer.
  </div>
  
  <div class="arabic-section" style="border: none; margin-top: 0;">
    <div class="section-intro-label" dir="rtl" style="text-align: right;">الجزء الأول</div>
    <div class="section-intro-title-ar" dir="rtl" style="text-align: right;">طقوسكما اليومية</div>
    <div class="section-intro-body-ar">
      ست ميزات صُممت لترافقكما كل يوم. لحظات صغيرة، وتواصل مستمر، لتنسج خيوطاً دقيقة تقربكما أكثر فأكثر بمرور الأيام.
    </div>
  </div>
</div>

<!-- 01 DASHBOARD -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">🏠</div>
    <div>
      <div class="feature-number">Feature 01</div>
      <div class="feature-title">Your Dashboard</div>
      <div class="feature-tagline">The first thing you see. The heart of everything.</div>
    </div>
  </div>

  <p class="feature-lead">
    The dashboard is your home base. It features a living countdown to your most important date, tracking every day, hour, minute, and second.
  </p>

  <p class="feature-body">
    Below the countdown, all the features are laid out beautifully. The dashboard also automatically celebrates meaningful milestones (like 100 days, 6 months, or your anniversary) with warm banners without you having to set any reminders.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">الصفحة الرئيسية</div>
    <div class="arabic-tagline">القلب النابض للتطبيق وأول ما تريانه.</div>
    <p class="arabic-lead">
      بمجرد الدخول، تجدان اسميكما منقوشين جنباً إلى جنب بشكل أنيق. تحتضن الصفحة عداداً تنازلياً دقيقاً (بالأيام والساعات والدقائق والثواني) لمناسبتكم الكبرى، أو يحسب الأيام منذ بدايتكم.
    </p>
    <p class="arabic-body">
      تعرض الصفحة جميع ميزات التطبيق في بطاقات مرتبة وجميلة. التطبيق ذكي، فهو يعرف متى تمر ذكرى مهمة (مثل إتمام ١٠٠ يوم أو ٦ أشهر أو ذكرى سنوية) ويُظهر لافتة احتفالية دافئة تلقائياً لتشارككما الفرحة دون أي تدخل منكما.
    </p>
  </div>
</div>

<!-- 02 VIBE SYNC -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">💫</div>
    <div>
      <div class="feature-number">Feature 02</div>
      <div class="feature-title">Vibe Sync</div>
      <div class="feature-tagline">Check in on each other's world without needing to say a word.</div>
    </div>
  </div>

  <p class="feature-lead">
    A daily emotional check-in that takes five seconds. Tap one of six moods that describes how you feel right now, select your energy level, and optionally add what you're craving (like a hug, or coffee).
  </p>

  <p class="feature-body">
    Your partner sees it instantly. If your mood shifts during the day, you can change it, and it updates live. It's a quiet pulse you can check to see how they are really doing.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">مزامنة الحالة (Vibe Sync)</div>
    <div class="arabic-tagline">اطمئن على شريكك دون الحاجة لسؤاله.</div>
    <p class="arabic-lead">
      تحديث يومي لمشاعرك في خمس ثوانٍ. اختر واحداً من ستة أمزجة يعبر عن حالتك الحالية (مرح، متعب، ممتن، متوتر، مشتاق، حنون)، ثم حدد مستوى طاقتك، واذكر ما تشتهيه الآن (عناق، كوب قهوة، أو مجرد هدوء).
    </p>
    <p class="arabic-body">
      يرى شريكك هذا التحديث فوراً. إذا تغيّر مزاجك خلال اليوم وقمت بتعديله، سيتحدث لديه في اللحظة ذاتها. إنها طريقة هادئة وجميلة لتكونا على دراية بمشاعر بعضكما طوال اليوم.
    </p>
  </div>
</div>

<!-- 03 DAILY PROMPT -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">✍️</div>
    <div>
      <div class="feature-number">Feature 03</div>
      <div class="feature-title">Daily Prompt</div>
      <div class="feature-tagline">One question a day. A different answer every time.</div>
    </div>
  </div>

  <p class="feature-lead">
    Every morning, Forever presents a new, thought-provoking question. Both of you answer it privately, and your answers are hidden until you both submit.
  </p>

  <p class="feature-body">
    Once both answers are in, they appear side by side. It guarantees genuine responses and often reveals thoughts you both share or surprising new details about each other.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">سؤال اليوم (Daily Prompt)</div>
    <div class="arabic-tagline">سؤال واحد يومياً، لتعميق الفهم بينكما.</div>
    <p class="arabic-lead">
      كل صباح، يطرح التطبيق سؤالاً جديداً ومثيراً للتفكير. يجيب كل منكما على السؤال بشكل مستقل وسري، ولا يمكن لأي منكما رؤية إجابة الآخر حتى تُسلّما إجابتيكما.
    </p>
    <p class="arabic-body">
      بعد الإجابة، تنكشف الإجابتان جنباً إلى جنب. يضمن هذا النظام الحصول على إجابات عفوية وصادقة، وقد تفاجآن بأنكما تفكران بنفس الشيء، أو تكتشفان زوايا جديدة في شخصيات بعضكما.
    </p>
  </div>
</div>

<!-- 04 HEARTBEAT -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">💛</div>
    <div>
      <div class="feature-number">Feature 04</div>
      <div class="feature-title">Heartbeat</div>
      <div class="feature-tagline">The simplest "I'm thinking of you" ever invented.</div>
    </div>
  </div>

  <p class="feature-lead">
    A single large golden button. Press it, and your partner receives a gentle pulse notification. No words needed, no pressure to reply. Just a way to say they crossed your mind.
  </p>

  <p class="feature-body">
    You can also see how many heartbeats you've sent each other each day, creating a beautiful record of those small moments of affection.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">نبضة قلب (Heartbeat)</div>
    <div class="arabic-tagline">أبسط طريقة لقول "أفكر فيك الآن".</div>
    <p class="arabic-lead">
      زر ذهبي كبير ونابض. بمجرد الضغط عليه، تصل لشريكك إشعار بنبضة لطيفة (وقد يهتز الهاتف بلطف). لا حاجة لكتابة كلمات، ولا داعي لانتظار رد. هي مجرد إشارة دافئة تقول أنك تذكرته.
    </p>
    <p class="arabic-body">
      يمكنكما أيضاً رؤية عدد النبضات التي أرسلها كل منكما للآخر خلال اليوم. ويبدأ العد من الصفر كل صباح ليكون سجلاً يومياً لمدى تذكركم لبعضكم البعض.
    </p>
  </div>
</div>

<!-- 05 GRATITUDE TRAIL -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">🌿</div>
    <div>
      <div class="feature-number">Feature 05</div>
      <div class="feature-title">Gratitude Trail</div>
      <div class="feature-tagline">A growing record of everything you love about each other.</div>
    </div>
  </div>

  <p class="feature-lead">
    Each day, write one small thing you're grateful for about your partner. Over time, these daily entries form a chronological timeline of appreciation.
  </p>

  <p class="feature-body">
    It's a beautiful habit that turns small moments into a powerful, lasting document of love that you can look back on whenever you need a smile.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">درب الامتنان (Gratitude Trail)</div>
    <div class="arabic-tagline">نهر متدفق من لحظات الشكر الصادقة.</div>
    <p class="arabic-lead">
      حقل بسيط يطلب منك كتابة شيء واحد أنت ممتن له في شريكك اليوم. ومع مرور الوقت، تتراكم هذه العبارات اليومية لتكوّن مساراً زمنياً يوثق تقديركما لبعضكما.
    </p>
    <p class="arabic-body">
      إنها عادة ساحرة تحوّل اللحظات العابرة إلى وثيقة حب خالدة. في الأيام الصعبة، قراءة هذا الدرب ستكون كافية لرسم ابتسامة وإعادة الدفء لقلبيكما.
    </p>
  </div>
</div>

<!-- 06 WHISPER -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">🤍</div>
    <div>
      <div class="feature-number">Feature 06</div>
      <div class="feature-title">Whisper</div>
      <div class="feature-tagline">The message you mean. Delivered with intention, not impulse.</div>
    </div>
  </div>

  <p class="feature-lead">
    A structured space for expressing hard feelings without blame. You define what happened, how you feel (selecting from emotions like anxious or hurt), and what you need.
  </p>

  <p class="feature-body">
    It includes a 30-minute delivery delay so both of you have time to cool down. You can also use an AI "Soften" button that rephrases your message to be gentler while keeping its true meaning. When read, the message glows with a warm golden edge.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">الهمسة (Whisper)</div>
    <div class="arabic-tagline">قناة آمنة لقول ما يصعب قوله، بصدق وبدون لوم.</div>
    <p class="arabic-lead">
      مساحة مهيكلة للتعبير عن المشاعر الصعبة. تقوم بوصف ما حدث، ثم تختار من المشاعر (مثل وحيد، قلق، مجروح)، وتكتب ما تحتاجه من شريكك الآن.
    </p>
    <p class="arabic-body">
      يوجد زر "لطّف هذا" يستعين بالذكاء الاصطناعي لإعادة صياغة رسالتك بأسلوب أرق يقلل من الاتهامية مع الحفاظ على المعنى. وتتعمد الميزة تأخير إرسال الرسالة لمدة 30 دقيقة لتهدئة الأجواء. عند قراءتها، تُحاط الرسالة بهالة ذهبية دافئة بدلاً من علامة "قُرئ" الجافة. (يُسمح بهمسة واحدة فقط يومياً).
    </p>
  </div>
</div>

<!-- SECTION INTRO: MEMORIES -->
<div class="section-intro" style="background: radial-gradient(ellipse at 70% 50%, #0e1520 0%, var(--bg) 65%);">
  <div class="section-intro-label">Part Two</div>
  <div class="section-intro-title">Your Shared<br/>Memory</div>
  <div class="section-intro-body">
    Features for holding onto what matters. The moments you lived, the places you went, the dreams you plan to reach.
  </div>
  
  <div class="arabic-section" style="border: none; margin-top: 0;">
    <div class="section-intro-label" dir="rtl" style="text-align: right;">الجزء الثاني</div>
    <div class="section-intro-title-ar" dir="rtl" style="text-align: right;">ذاكرتكما المشتركة</div>
    <div class="section-intro-body-ar">
      ميزات صُممت للحفاظ على كل ما هو غالي. اللحظات التي عشتماها، والأماكن التي زرتماها، والأحلام التي تطمحان لتحقيقها.
    </div>
  </div>
</div>

<!-- 07 TIMELINE -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">📸</div>
    <div>
      <div class="feature-number">Feature 07</div>
      <div class="feature-title">Memory Timeline</div>
      <div class="feature-tagline">Your love story, told in chronological order.</div>
    </div>
  </div>

  <p class="feature-lead">
    A beautiful vertical timeline where you can save milestones, photos, and stories. Each entry includes a date, title, story, and optional location.
  </p>

  <p class="feature-body">
    You can easily scroll through your history or use filters to find memories by year, location, or type. It's the complete archive of your life together.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">مسيرة الذكريات (Timeline)</div>
    <div class="arabic-tagline">قصة حبكما، مدونة بالترتيب الزمني.</div>
    <p class="arabic-lead">
      خط زمني رأسي ساحر لحفظ أجمل محطات حياتكم. يمكنكم إضافة عنوان وتاريخ وقصة وصورة وموقع لكل ذكرى لتبقى محفوظة للأبد.
    </p>
    <p class="arabic-body">
      يمكنكما تصفح تاريخكما بسلاسة، أو استخدام الفلاتر للبحث عن الذكريات حسب السنة أو المكان. مع مرور الأشهر والسنوات، يصبح هذا السجل أجمل كتاب تقرآنه معاً.
    </p>
  </div>
</div>

<!-- 08 CONSTELLATION -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">✨</div>
    <div>
      <div class="feature-number">Feature 08</div>
      <div class="feature-title">Constellation</div>
      <div class="feature-tagline">Your memories, as a star map.</div>
    </div>
  </div>

  <p class="feature-lead">
    Every memory you add to your timeline automatically becomes a glowing star in a dark, beautiful digital night sky, connected by delicate gold lines.
  </p>

  <p class="feature-body">
    You can tap any star to reveal the memory it holds, or zoom out to see the entire constellation of your relationship.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">الكوكبة (Constellation)</div>
    <div class="arabic-tagline">ذكرياتكما، تتلألأ كنجوم السماء.</div>
    <p class="arabic-lead">
      كل ذكرى تقومون بإضافتها إلى خط الزمن تتحول تلقائياً إلى نجمة ساطعة في سماء ليلية رقمية جميلة، وترتبط النجوم ببعضها بخطوط ذهبية دقيقة ترسم مسار قصتكم.
    </p>
    <p class="arabic-body">
      يمكنكما لمس أي نجمة لتظهر تفاصيل تلك الذكرى، أو التصغير لرؤية خريطة النجوم الكاملة التي صنعتموها معاً. كلما كثرت الذكريات، ازدادت سماءكم جمالاً وإشراقاً.
    </p>
  </div>
</div>

<!-- 09 ECHO CALENDAR -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">📅</div>
    <div>
      <div class="feature-number">Feature 09</div>
      <div class="feature-title">Echo Calendar</div>
      <div class="feature-tagline">"On this day" — every day, across all your years together.</div>
    </div>
  </div>

  <p class="feature-lead">
    Echo Calendar automatically surfaces everything that happened "On This Day" in previous years across all your memories, gratitude entries, and letters.
  </p>

  <p class="feature-body">
    It requires no setup. Just open it to see the echoes of your past, reviving moments you might have otherwise forgotten.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">صدى التقويم (Echo Calendar)</div>
    <div class="arabic-tagline">الماضي يتحدث إليكما: "في مثل هذا اليوم".</div>
    <p class="arabic-lead">
      يجمع هذا التقويم سحرياً كل ما دونتماه (ذكريات، امتنان، وعود، رسائل) ويعرض لكما ما حدث في نفس اليوم من الأعوام السابقة.
    </p>
    <p class="arabic-body">
      لا يحتاج لأي إعداد. بمجرد فتحه سيُحيي الماضي أمامكما، لتسترجعا لحظات جميلة ربما كدتما تنسيانها. كلما زادت سنواتكما معاً، أصبح هذا الصدى أكثر سحراً.
    </p>
  </div>
</div>

<!-- 10 BUCKET LIST -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">🌍</div>
    <div>
      <div class="feature-number">Feature 10</div>
      <div class="feature-title">Bucket List</div>
      <div class="feature-tagline">Dreams you share. Adventures you're planning.</div>
    </div>
  </div>

  <p class="feature-lead">
    Organize your shared dreams by categories like Travel, Experiences, and Home. You can drag and drop items to reorder them by priority.
  </p>

  <p class="feature-body">
    When you accomplish a goal, you check it off and an animated gold seal stamps it as completed. You can then link it to a memory on your timeline.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">قائمة الأحلام (Bucket List)</div>
    <div class="arabic-tagline">الأحلام المشتركة والمغامرات التي تنتظر التحقيق.</div>
    <p class="arabic-lead">
      مساحة لتدوين كل ما تطمحان لفعله معاً؛ مصنفة إلى: السفر، التجارب، المنزل وغيرها. يمكنكما إعادة ترتيب الأولويات ببساطة عبر السحب والإفلات.
    </p>
    <p class="arabic-body">
      وعند تحقيق أحد هذه الأحلام، يكفي وضع علامة الصح ليتم ختمه بختم ذهبي متحرك احتفالاً بالإنجاز. كما يمكنكما ربط هذا الحلم المحقق بذكرى في خط مسيرتكم.
    </p>
  </div>
</div>

<!-- SECTION INTRO: DEPTH -->
<div class="section-intro" style="background: radial-gradient(ellipse at 50% 60%, #100818 0%, var(--bg) 65%);">
  <div class="section-intro-label">Part Three</div>
  <div class="section-intro-title">Deeper<br/>Connection</div>
  <div class="section-intro-body">
    Features for the moments when you want to go further — into who you are, what you believe, and what you've promised.
  </div>
  
  <div class="arabic-section" style="border: none; margin-top: 0;">
    <div class="section-intro-label" dir="rtl" style="text-align: right;">الجزء الثالث</div>
    <div class="section-intro-title-ar" dir="rtl" style="text-align: right;">العمق العاطفي</div>
    <div class="section-intro-body-ar">
      ميزات صُممت للغوص أعمق في علاقتكما — لاكتشاف ذواتكم، وتأكيد التزاماتكم، وفهم بعضكم بشكل أوضح.
    </div>
  </div>
</div>

<!-- 11 TIME CAPSULE -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">💌</div>
    <div>
      <div class="feature-number">Feature 11</div>
      <div class="feature-title">Time Capsule</div>
      <div class="feature-tagline">A letter to your future selves. Sealed until the moment you choose.</div>
    </div>
  </div>

  <p class="feature-lead">
    Write a letter to each other, or to your future selves, and select a future date to open it. It is end-to-end encrypted with a passphrase only you know.
  </p>

  <p class="feature-body">
    The app itself cannot read your letters. When the chosen date arrives, you enter the passphrase to break the seal and read what you wrote months or years ago.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">كبسولة الزمن (Time Capsule)</div>
    <div class="arabic-tagline">رسائل للمستقبل، تُقفل وتُختم حتى يحين موعدها.</div>
    <p class="arabic-lead">
      اكتبا رسالة لنفسيكما في المستقبل وحدّدا تاريخاً لفتحها. الرسائل مشفرة تماماً (End-to-End) ولا تُفتح إلا بعبارة المرور الخاصة بكما التي لا يعرفها التطبيق نفسه!
    </p>
    <p class="arabic-body">
      تظهر الرسائل المقفلة على شكل أظرف مختومة بالشمع. وعند حلول التاريخ المحدد، تقومون بإدخال عبارة المرور المشتركة لفك التشفير وقراءة ما تركتموه لأنفسكم منذ شهور أو سنوات.
    </p>
  </div>
</div>

<!-- 12 MIRROR MODE -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">🪞</div>
    <div>
      <div class="feature-number">Feature 12</div>
      <div class="feature-title">Mirror Mode</div>
      <div class="feature-tagline">The same question. Two perspectives. One revelation.</div>
    </div>
  </div>

  <p class="feature-lead">
    Every Monday, a profound, reflective question appears. You both answer privately, and your answers are only revealed side-by-side once both are submitted.
  </p>

  <p class="feature-body">
    It acts as a mirror showing how you both perceive your relationship. Past sessions are beautifully archived for you to revisit anytime.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">وضع المرآة (Mirror Mode)</div>
    <div class="arabic-tagline">سؤال واحد، وجهتا نظر، واكتشاف عميق.</div>
    <p class="arabic-lead">
      كل يوم اثنين، يطرح التطبيق سؤالاً عميقاً يحتاج لتأمل. يجيب كل منكما سراً ومنفرداً، ولا تنكشف الإجابات إلا بعد إرسال كلاكما لإجابته.
    </p>
    <p class="arabic-body">
      عند الكشف، تظهر إجابتاكما جنباً إلى جنب لتريا كيف ينظر كل منكما للأمر، مما يفتح أبواباً لنقاشات غنية. وتُحفظ الجلسات السابقة في أرشيف أنيق للرجوع إليها متى شئتم.
    </p>
  </div>
</div>

<!-- 13 PROMISE LEDGER -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">🤝</div>
    <div>
      <div class="feature-number">Feature 13</div>
      <div class="feature-title">Promise Ledger</div>
      <div class="feature-tagline">The commitments that matter, tracked with honesty.</div>
    </div>
  </div>

  <p class="feature-lead">
    Make a commitment — big or small — and define its frequency (daily, weekly, etc.). The app will gently ask if you kept your promise today.
  </p>

  <p class="feature-body">
    A simple "Yes" adds a gold seal, acknowledging your effort. A "No" receives a gentle "Tomorrow is new." It's about self-awareness, not punishment.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">سجل الوعود (Promise Ledger)</div>
    <div class="arabic-tagline">الالتزامات المصنوعة بالحب، تُسجّل بصدق وتُتابع برفق.</div>
    <p class="arabic-lead">
      أضف وعداً (مثل: "سأجهز العشاء في الموعد") وحدد وتيرته (يومي، أسبوعي...). سيطرح التطبيق سؤالاً دورياً بلطف: "هل وفيت بوعدك اليوم؟".
    </p>
    <p class="arabic-body">
      إذا ضغطت "نعم"، يُختم إنجازك بختم ذهبي ويرتفع عداد الوفاء. أما إذا ضغطت "لا"، فستتلقى رسالة مشجعة "الغد يوم جديد". الهدف هو الوعي وبناء العادات الحسنة، وليس العقاب.
    </p>
  </div>
</div>

<!-- 14 US MAP -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">🗺️</div>
    <div>
      <div class="feature-number">Feature 14</div>
      <div class="feature-title">Us Map</div>
      <div class="feature-tagline">Every place that's part of your story, pinned forever.</div>
    </div>
  </div>

  <p class="feature-lead">
    An interactive, elegantly designed dark map. Long-press to drop pins for places you've visited, your first date, home, or dream destinations.
  </p>

  <p class="feature-body">
    You can link pins directly to entries in your Memory Timeline, seamlessly weaving your physical journey with your shared memories. It even includes a 3D globe view.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">خريطتنا (Us Map)</div>
    <div class="arabic-tagline">كل مكان له معنى في قصتكما، موسوم على الخريطة.</div>
    <p class="arabic-lead">
      خريطة تفاعلية داكنة بلمسات ذهبية أنيقة. بالضغط المطول يمكنك إضافة دبوس لأي موقع، وتحديد نوعه: مكان زرتموه، موعدكما الأول، منزلكما، أو حلم للسفر.
    </p>
    <p class="arabic-body">
      الجميل أنه يمكنك ربط هذا المكان مباشرة بإحدى الذكريات في خط مسيرتكم، ليرتبط المكان بالقصة. كما تتوفر ميزة عرض الكرة الأرضية (Globe View) لرؤية خريطة حبكما حول العالم.
    </p>
  </div>
</div>

<!-- SECTION INTRO: PRACTICAL -->
<div class="section-intro" style="background: radial-gradient(ellipse at 60% 30%, #0a180e 0%, var(--bg) 65%);">
  <div class="section-intro-label">Part Four</div>
  <div class="section-intro-title">Practical &amp;<br/>Playful</div>
  <div class="section-intro-body">
    Features for the texture of daily life — making decisions, being playful, finding common ground, and handling hard moments with grace.
  </div>
  
  <div class="arabic-section" style="border: none; margin-top: 0;">
    <div class="section-intro-label" dir="rtl" style="text-align: right;">الجزء الرابع</div>
    <div class="section-intro-title-ar" dir="rtl" style="text-align: right;">الجانب العملي والمرح</div>
    <div class="section-intro-body-ar">
      ميزات تُسهّل تفاصيل الحياة اليومية المشتركة — في اتخاذ القرارات، وإضافة لمسة من المرح، والتعامل مع الخلافات بحكمة وحب.
    </div>
  </div>
</div>

<!-- 15 BLUEPRINT -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">📋</div>
    <div>
      <div class="feature-number">Feature 15</div>
      <div class="feature-title">Blueprint</div>
      <div class="feature-tagline">The things about your partner you should never have to Google.</div>
    </div>
  </div>

  <p class="feature-lead">
    Your personal cheat sheet for your partner. It is neatly categorized into Sizes (clothes, rings), Tastes (coffee orders, foods), Vitals (allergies), and Family (birthdays).
  </p>

  <p class="feature-body">
    No more guessing shoe sizes or forgetting their parents' anniversary. You both maintain your own profiles for the other to see.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">المخطط الشخصي (Blueprint)</div>
    <div class="arabic-tagline">دليل شامل لكل ما يخص شريكك ليلغي التخمين.</div>
    <p class="arabic-lead">
      بطاقة مرجعية خاصة مقسمة لـ ٤ أقسام: المقاسات (لخاتم أو حذاء)، الأذواق (القهوة المفضلة والأكلات الممنوعة)، الأساسيات والصحة (كالحساسيات)، والعائلة (تواريخ أعياد ميلاد الوالدين).
    </p>
    <p class="arabic-body">
      يقوم كل منكما بتعبئة بياناته الخاصة لتظهر لشريكه بوضوح. وداعاً لأسئلة مثل "ما هو مقاسك؟" أو نسيان تواريخ العائلة المهمة عند التخطيط لمفاجأة!
    </p>
  </div>
</div>

<!-- 16 SECRET MISSIONS -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">🎯</div>
    <div>
      <div class="feature-number">Feature 16</div>
      <div class="feature-title">Secret Missions</div>
      <div class="feature-tagline">Small acts of love that feel like an adventure.</div>
    </div>
  </div>

  <p class="feature-lead">
    Every 48 hours, you can accept a random, secret romantic mission — like leaving a sticky note or cooking their favorite meal. 
  </p>

  <p class="feature-body">
    Once you complete it, your partner gets to confirm it, rewarding you with a gold seal. It breaks routine and adds playful surprises to your week.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">المهام السرية (Secret Missions)</div>
    <div class="arabic-tagline">أفعال حب صغيرة تضفي متعة ومفاجأة لروتينكم.</div>
    <p class="arabic-lead">
      يمكنكما طلب مهمة عشوائية كل ٤٨ ساعة. سيُسند إليك فعل رومانسي بسيط (مثل: اترك ملاحظة صغيرة ليجدها، أو أعطه مساجاً لخمس دقائق).
    </p>
    <p class="arabic-body">
      بمجرد إنهائك للمهمة، تضغط "أنجزتها"، ليتلقى شريكك إشعاراً لتأكيد ذلك بابتسامة، وتحصل على ختم ذهبي لإنجازك. إنها ممتعة، وتكسر روتين الحياة بأجمل الطرق.
    </p>
  </div>
</div>

<!-- 17 TRUCE -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">🕊️</div>
    <div>
      <div class="feature-number">Feature 17</div>
      <div class="feature-title">Truce / Safe Harbor</div>
      <div class="feature-tagline">Press pause on the argument. Create space for something better.</div>
    </div>
  </div>

  <p class="feature-lead">
    When a conversation gets heated, hit the Truce button. A 20-minute timer begins, pausing notifications and allowing a structured cooling-off period.
  </p>

  <p class="feature-body">
    During this time, both partners can simply write "I feel..." to safely and calmly express their emotions, laying the groundwork for a more constructive conversation.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">الملاذ الآمن / الهدنة (Truce)</div>
    <div class="arabic-tagline">وقفة مدروسة لحل الخلافات بهدوء.</div>
    <p class="arabic-lead">
      إذا احتدم النقاش، يمكن لأي منكما تفعيل زر "الملاذ الآمن". يبدأ فوراً عداد تنازلي لمدة ٢٠ دقيقة وتتوقف باقي الإشعارات لتوفير مساحة من الهدوء لكليكما.
    </p>
    <p class="arabic-body">
      خلال هذه الدقائق، يُتاح لكل منكما حقل بسيط لكتابة "أنا أشعر بـ..." بصدق. بعد انتهاء الوقت، تقرآن ما كتبه كل منكما بصمت، ليكون نقطة انطلاق لحوار أهدأ وأكثر تفهماً.
    </p>
  </div>
</div>

<!-- 18 SWIPE TO EAT -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">🍽️</div>
    <div>
      <div class="feature-number">Feature 18</div>
      <div class="feature-title">Swipe to Eat</div>
      <div class="feature-tagline">No more "I don't know, what do you want?" — ever again.</div>
    </div>
  </div>

  <p class="feature-lead">
    A fun matching game to decide on dinner. Add your restaurant choices or home-cooked ideas, and independently swipe Yes or No on each option.
  </p>

  <p class="feature-body">
    When you both swipe Yes on the same option, you get an immediate celebratory match notification, and dinner is decided without any back-and-forth guessing!
  </p>

  <div class="arabic-section">
    <div class="arabic-title">قرار العشاء (Swipe to Eat)</div>
    <div class="arabic-tagline">نهاية حيرة "من أين نأكل اليوم؟" للأبد.</div>
    <p class="arabic-lead">
      أداة ممتعة تشبه ألعاب التطابق. أضيفا خياراتكم للمطاعم أو الوجبات المنزلية، ثم يقوم كل منكما بتمرير الخيارات (سوايب) يميناً للموافقة أو يساراً للرفض، بشكل مستقل.
    </p>
    <p class="arabic-body">
      عندما يوافق كلاكما على نفس الخيار (تطابق!)، يظهر إشعار احتفالي فوري ليحسم قرار العشاء ويوفر عليكما عناء النقاش والتخمين.
    </p>
  </div>
</div>

<!-- 19 SHARED CANVAS -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">🎨</div>
    <div>
      <div class="feature-number">Feature 19</div>
      <div class="feature-title">Shared Canvas</div>
      <div class="feature-tagline">One drawing. Both of you. No rules.</div>
    </div>
  </div>

  <p class="feature-lead">
    A real-time shared drawing board. Draw a quick heart, leave a funny sketch, or map out an idea using 7 beautiful colors. 
  </p>

  <p class="feature-body">
    Every stroke is saved automatically. Your partner sees your drawing when they open the app and can add to it. You can clear the board together to start fresh anytime.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">اللوحة المشتركة (Shared Canvas)</div>
    <div class="arabic-tagline">رسائل بصرية صامتة... ارسم شيئاً ليجده شريكك.</div>
    <p class="arabic-lead">
      لوحة رسم مشتركة في الوقت الحقيقي. باستخدام ٧ ألوان راقية، يمكنك رسم قلب سريع، خربشة مضحكة، أو رسالة بلا كلمات ليراها شريكك عندما يفتح التطبيق.
    </p>
    <p class="arabic-body">
      تُحفظ كل خطوة وتقدران على الرسم معاً في نفس اللوحة. وعند امتلاء اللوحة أو الرغبة في بداية جديدة، يمكنكما مسحها والبدء من جديد.
    </p>
  </div>
</div>

<!-- 20 THE QUEUE -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">🎬</div>
    <div>
      <div class="feature-number">Feature 20</div>
      <div class="feature-title">The Queue</div>
      <div class="feature-tagline">Your shared list of everything you want to watch, read, and explore.</div>
    </div>
  </div>

  <p class="feature-lead">
    Keep track of everything you plan to experience together across four categories: Movies, Shows, Books, and Places. 
  </p>

  <p class="feature-body">
    When you finally watch or visit an item, mark it complete to stamp it with a gold seal and archive it, building a beautiful catalog of your shared media and outings.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">قائمة الانتظار (The Queue)</div>
    <div class="arabic-tagline">قائمة مشتركة بكل ما ستشاهدونه وتقرؤونه وتكتشفونه معاً.</div>
    <p class="arabic-lead">
      مساحة لجمع اقتراحاتكم مقسمة لأربع فئات: أفلام، مسلسلات، كتب، وأماكن. لا مزيد من نسيان التوصيات التي تظهر لكم!
    </p>
    <p class="arabic-body">
      بمجرد الانتهاء من مشاهدة الفيلم أو زيارة المكان، ضع علامة "تم". سيُنقل إلى قسم المُنجَز مع ختم ذهبي وتاريخ، ليتحول مع الوقت إلى أرشيف لأوقاتكم الممتعة.
    </p>
  </div>
</div>

<!-- 21 VOICE NOTES -->
<div class="feature-page">
  <div class="feature-header">
    <div class="feature-icon">🎙️</div>
    <div>
      <div class="feature-number">Feature 21</div>
      <div class="feature-title">Voice Notes</div>
      <div class="feature-tagline">Your actual voice. The one your partner loves to hear.</div>
    </div>
  </div>

  <p class="feature-lead">
    Sometimes text isn't enough. Hold to record a short, private voice message (up to 60 seconds). A golden dot appears for your partner to let them know a new voice note is waiting.
  </p>

  <p class="feature-body">
    These notes accumulate safely over time, capturing the genuine warmth of your voices — from a sleepy "good morning" to an excited piece of news.
  </p>

  <div class="arabic-section">
    <div class="arabic-title">الرسائل الصوتية (Voice Notes)</div>
    <div class="arabic-tagline">صوتك محفوظ للأبد، كما يحب شريكك أن يسمعه.</div>
    <p class="arabic-lead">
      بعض المشاعر لا تترجمها النصوص. بضغطة مطولة يمكنك تسجيل رسالة صوتية قصيرة (حتى ٦٠ ثانية). وتظهر نقطة ذهبية لشريكك لتخبره بوجود رسالة جديدة لم تُسمع.
    </p>
    <p class="arabic-body">
      تُخزن هذه الملفات الصوتية بأمان تام وخصوصية عالية. ومع مرور الأيام، ستكوّن هذه الرسائل مكتبة دافئة لأصواتكما، من تحية الصباح الناعمة وحتى الحماس عند سماع خبر مفرح.
    </p>
  </div>
</div>

<!-- CLOSING PAGE -->
<div class="cover" style="page-break-before: always;">
  <div class="cover-ornament">✦</div>
  <div class="cover-title" style="font-size: 42pt;">Your space.<br/>Your story.</div>
  <div class="cover-title-ar" dir="rtl" style="font-family: 'Tajawal', sans-serif; font-size: 38pt; color: var(--gold); margin-top: 20px;">مساحتكما. قصتكما.</div>
  <div class="cover-divider" style="margin-top: 30px;"></div>
  
  <div class="cover-tagline">
    Forever is a sanctuary, not a social network. Nothing here is public. No algorithm decides what you see. No notifications unless your partner reaches out. Just the two of you, and the life you're building.
  </div>
  
  <div class="cover-tagline-ar" dir="rtl" style="margin-top: 20px;">
    تطبيق Forever هو ملاذ آمن، وليس شبكة تواصل اجتماعي. لا شيء هنا معلن، ولا توجد خوارزميات تتحكم بما ترونه، ولا إشعارات مزعجة. أنتم فقط، والحياة التي تبنونها معاً.
  </div>

  <div style="margin-top: 48px;">
    <p class="handwritten" style="font-size: 18pt; color: var(--gold-light);">
      " May every feature here make you feel a little more seen, <br/>
      a little more loved, and a little more home. "
    </p>
    <p class="handwritten-ar" dir="rtl" style="font-size: 16pt; color: var(--gold-light); margin-top: 20px;">
      " لعل كل زاوية هنا تجعلك تشعر بأنك مُقدّر أكثر، محبوب أكثر، وفي بيتك الدافئ. "
    </p>
  </div>
  
  <div class="cover-footer">Forever · Private · Encrypted · Yours | خاص · مشفر · لكما وحدكما</div>
</div>

</body>
</html>
""")
