/* A.I.M.A English homepage (/en/) — phase A: site shell + homepage in natural English.
   Hebrew stays the default and source of truth; dynamic content (PULSE items, artist content)
   stays in Hebrew and is tagged "Hebrew only" per the brief. Idempotent; never breaks the page. */
(() => {
  'use strict';
  const isEn = /^\/en\/?$/.test(location.pathname) || /^\/en\/index\.html$/.test(location.pathname);
  if (!isEn) return;
  document.documentElement.classList.add('en');
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const el = (tag, cls, text, attrs) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };

  /* element-level translations, keyed by exact normalized textContent (\n = <br/>) */
  const MAP = new Map(Object.entries({
    'דלג לתוכן המרכזי': 'Skip to main content',
    'בית': 'Home', 'אמנים': 'Artists', 'משאבים': 'Resources', 'רדיו': 'Radio', 'אירועים': 'Events',
    'חדשות ועדכונים': 'PULSE', 'תמיכה בקהילה': 'Support the community', 'הצטרפות ↗': 'Join ↗', 'הצטרפות': 'Join',
    'הבית הישראלי ליוצרות וליוצרי מוזיקה עם AI. ללמוד, ליצור, לשתף, להכיר אמנים ולגלות עד כמה רחוק רעיון אחד יכול להגיע.':
      'The Israeli home for music creators with AI. Learn, create, share, meet artists, and see how far one idea can go.',
    'מה חדש השבוע?': "What's new this week?", 'מה חדש השבוע? ←': "What's new this week? →",
    'לגלות אמנים': 'Discover artists',
    'קהילה אחת, מאות סאונדים. כאן לא צריך לבחור בין טכנולוגיה לנשמה.': 'Technology and soul, no need to choose.\nHundreds of creators, one community, new music born here.',
    'קהילה אחת, מאות סאונדים.': 'Technology and soul, no need to choose.',
    'כאן לא צריך לבחור בין טכנולוגיה לנשמה.': 'Hundreds of creators, one community, new music born here.',
    'הדור הבא של המוזיקה': 'The next generation of music',
    'רוצים להירשם כאמן? מלאו את הטופס': 'Want to join as an artist? Fill out the form',
    'דקה אחת, והפרופיל שלכם מצטרף לספריית האמנים של הקהילה.': 'One minute, and your profile joins the community artist library.',
    'לטופס ההרשמה ↗': 'To the signup form ↗',
    'חדשים בסונו? רעיון ראשון, פרומפט וטיפים לעברית. מתחילים בלי ללכת לאיבוד.': 'New to Suno? A first idea, a prompt, and tips. Start without getting lost.',
    'חדשים בסונו?': 'New to Suno?',
    'רעיון ראשון, פרומפט וטיפים לעברית. מתחילים בלי ללכת לאיבוד.': 'A first idea, a prompt, and tips. Start without getting lost.',
    'איפה מתחילים ←': 'Where to start →',
    'מה השתנה. למה זה משנה.': 'What changed. Why it matters.',
    'מה השתנה.': 'What changed.', 'למה זה משנה.': 'Why it matters.',
    'העדכונים הרשמיות של Suno, בעברית אנושית: מה באמת קרה, מה זה אומר ליוצרים, ומה כדאי לנסות עכשיו.': 'The official Suno updates, in human language: what actually happened, what it means for creators, and what is worth trying now.',
    'העדכונים הרשמיים של Suno, בעברית אנושית: מה באמת קרה, מה זה אומר ליוצרים, ומה כדאי לנסות עכשיו. ': 'The official Suno updates, in human language: what actually happened, what it means for creators, and what is worth trying now.',
    'העדכונים הרשמיים של Suno, בעברית אנושית: מה באמת קרה, מה זה אומר ליוצרים, ומה כדאי לנסות עכשיו.': 'The official Suno updates, in human language: what actually happened, what it means for creators, and what is worth trying now.',
    'עוד בדופק': 'More from PULSE', 'לכל העדכונים ←': 'All updates →',
    'העדכון הבא כבר בדרך.': 'The next update is on its way.',
    'אנחנו בודקים את Suno מדי יום ומפרסמים רק את מה שבאמת שווה להכיר.': 'We follow Suno and publish only what is worth knowing, every Sunday.',
    'לא משתמשים ב-Suno?': 'Not using Suno?',
    'בואו לגלות ולהצביע לאמנים החדשים ←': 'Come discover new artists and vote for your favorites →',
    'אז מה זה אומר לי?': 'What does it mean for me?', 'נסו עכשיו': 'Try it now',
    'לקחת את זה ליצירה ←': 'Take it into a creation →', 'לעדכון הרשמי ↗': 'Official update ↗',
    'סיפורים מהקהילה · קריאה מיוחדת': 'Community stories · A special read',
    'האנשים שמאחורי הצלילים החדשים.': 'The people behind the new sounds.',
    'מי הם היוצרים שמעניקים למוזיקת ה-AI בישראל לב, זיכרון וקול? מסע אישי בין אמני Suno שהפכו כאב, חלומות ורגעים שלא נאמרו לשירים שאפשר סוף סוף לשמוע.':
      'Who are the creators giving Israeli AI music heart, memory and voice? A personal journey among Suno artists who turned pain, dreams and unsaid moments into songs you can finally hear.',
    'קראו את הסיפורים מאחורי האמנים ←': 'Read the stories behind the artists →',
    'כל מה שצריך. במקום אחד.': 'Everything you need. In one place.',
    'כל מה שצריך.': 'Everything you need.', 'במקום אחד.': 'In one place.',
    'לא עוד חיפוש בין פוסטים ישנים וטאבים פתוחים. הכניסות החשובות לקהילה נמצאות כאן.':
      'No more hunting through old posts and open tabs. The community’s key doors are right here.',
    'הבית שלנו': 'Our home', 'קבוצת הפייסבוק': 'The Facebook group',
    'יצירות, שיחות, ביקורת בונה וכל מה שקורה עכשיו בקהילה.': 'Creations, talks, constructive feedback, and everything happening in the community right now.',
    'מדברים מוזיקה': 'Talking music', 'קבוצת WhatsApp מרכזית': 'The main WhatsApp group',
    'הקבוצה המרכזית החדשה של הקהילה: שאלות, שיתופי פעולה והאנשים שמבינים למה עשית עוד 34 גרסאות לפזמון.':
      'The community’s new main group: questions, collaborations, and people who get why you made 34 versions of a chorus.',
    'כל החדרים': 'All rooms', 'חדרי הקהילה': 'Community rooms',
    'הקבוצה המרכזית, קהילת הוואטסאפ ושאר החדרים, עם הסבר על כל אחד.': 'The main group, the WhatsApp community and the other rooms, with an explanation for each.',
    'ארגז הכלים': 'The toolbox', 'ספריית המשאבים': 'Resource library',
    'עשרות מדריכים, כלים, פלייסליסטים ושירותים שאספנו משני האתרים.': 'Dozens of guides, tools, playlists and services we collected for you.',
    'עשרות מדריכים, כלים, פלייליסטים ושירותים שאספנו משני האתרים. ': 'Dozens of guides, tools, playlists and services we collected for you.',
    'עשרות מדריכים, כלים, פלייליסטים ושירותים שאספנו משני האתרים.': 'Dozens of guides, tools, playlists and services we collected.',
    'פצצת הטיפים': 'The tips bomb', 'ארגז הטיפים של הקהילה': 'The community tips box',
    'ארבעה חודשים של טיפים, פרומפטים וניסויים של חברי הקהילה - הכול במקום אחד.': 'Tips, prompts and experiments from community members — all in one place.',
    'רדיו ZIK': 'ZIK Radio',
    'הרדיו הדיגיטלי של הקהילה. נכנסים ומאזינים למוזיקה החדשה שלנו.': 'The community’s digital radio, broadcasting 24/7. Come hear our new music.',
    'כל התוכניות': 'All shows',
    'SUNO IL, A.I.M.A עם 106, ראיונות ושידורים מרוכזים בארכיון אחד.': 'SUNO IL, A.I.M.A on 106, interviews and broadcasts gathered in one archive.',
    'עוזרים לנו להמשיך ליצור תוכן, מפגשים ובמות ליוצרים ישראלים.': 'Help us keep creating content, meetups and stages for Israeli creators.',
    'כניסה עכשיו': 'Enter now',
    'הפנים והסאונד של הרגע.': 'The face and sound of the moment.',
    'הפנים והסאונד': 'The face and sound', 'של הרגע.': 'of the moment.',
    'שיר השבוע מתחלף אוטומטית מתוך רשימת הקהילה. אמן החודש נשאר במרכז הבמה עד שבוחרים את הבא.':
      'Song of the week rotates automatically from the community list. Artist of the month stays center stage until the next one is chosen.',
    'אמן החודש': 'Artist of the month', 'שיר השבוע': 'Song of the week',
    'להכיר ולהאזין ↗': 'Meet & listen ↗', 'מתחלף אוטומטית בכל שבוע': 'Rotates automatically every week',
    'להאזנה ↗': 'Listen ↗', 'יצירה נבחרת מהקהילה': 'A featured community creation',
    'הסאונד של הקהילה.': 'The sound of the community.', 'הסאונד של': 'The sound of', 'הקהילה.': 'the community.',
    'לכל האמנים ←': 'All artists →', 'לכל האמנים': 'All artists',
    '“לא באנו לתת לבינה המלאכותית להחליף אמנים. באנו לתת ליותר אנשים להפוך לאמנים. ”':
      '“We didn’t come to let AI replace artists. We came to let more people become artists.”',
    'שיר בקליק': 'Song in a Click',
    'אפליקציה ישראלית חינמית ליצירת שירים מהטלפון או מהדפדפן, בתמיכת קהילת A.I.M.A. נסו את הבטא ושלחו פידבק.':
      'A free Israeli app for making songs from your phone or browser, supported by the A.I.M.A community. Try the beta and send us feedback.',
    'לגלות': 'Discover', 'הסיפורים מאחורי האמנים': 'The stories behind the artists',
    'ספריית משאבים': 'Resource library', 'להאזין ולהיפגש': 'Listen & meet',
    'אירועי הקהילה': 'Community events', 'יוצרים': 'Create', 'הוספת אמן': 'Add an artist',
    'עדכון תמונת אמן': 'Update artist photo', 'מאסטרינג': 'Mastering',
    'נבנה באהבה לקהילת המוזיקה החדשה בישראל': 'Built with love for Israel’s new music community',
    'פרטיות ועוגיות': 'Privacy & cookies', 'נגישות': 'Accessibility', 'העדפות פרטיות': 'Privacy preferences',
    'התאימו את האתר אליכם': 'Adapt the site to you', 'A+ טקסט מוגדל': 'A+ Larger text',
    '◐ ניגודיות גבוהה': '◐ High contrast', '_ הדגשת קישורים': '_ Highlight links', 'Ⅱ עצירת אנימציות': 'Ⅱ Stop animations',
    'איפוס התאמות': 'Reset adjustments', 'להצהרת הנגישות ←': 'Accessibility statement →',
    'הבחירה נשארת אצלכם.': 'The choice stays yours.',
    'האתר משתמש באחסון חיוני לשמירת ההעדפות שלכם. סטטיסטיקות ו־Meta Pixel יופעלו רק אם תאשרו.':
      'The site uses essential storage to save your preferences. Statistics and Meta Pixel run only if you allow them.',
    'למדיניות הפרטיות והעוגיות': 'Privacy & cookie policy',
    'חיוני': 'Essential', 'שמירת בחירת פרטיות ונגישות': 'Saves privacy & accessibility choices',
    'סטטיסטיקה': 'Statistics', 'Google Analytics, אם הוגדר באתר': 'Google Analytics, if configured',
    'שיווק': 'Marketing', 'Meta Pixel, אם הוגדר באתר': 'Meta Pixel, if configured',
    'אישור הכל': 'Accept all', 'רק חיוני': 'Essential only', 'התאמה אישית': 'Customize', 'שמירת הבחירה': 'Save my choice',
    'סגירת תפריט נגישות': 'Close accessibility menu',
    'מייסד הקהילה: תומר יאיר · כל הזכויות שמורות · ': 'Community founder: Tomer Yair · All rights reserved · ',
    'האנשים שמאחורי': 'The people behind', 'הצלילים החדשים.': 'the new sounds.',
    'בשבילך': 'For you', 'iPhone ודפדפן ↗': 'iPhone & browser ↗', 'ZIK ו-106FM': 'ZIK & 106FM',
    'רותי חי Ruti Hai': 'Ruti Hai', 'משדר 24/7': 'Broadcasting 24/7', 'משדר 24/7 ': 'Broadcasting 24/7',
    'האזנה לרדיו ZIK': 'Listen to ZIK radio',
  }));

  const norm = (t) => t.replace(/\s+/g, ' ').trim();
  const INLINE_OK = new Set(['BR', 'EM', 'B', 'STRONG', 'I', 'SMALL', 'SPAN', 'BDI', 'WBR']);

  const translateElement = (node) => {
    if (!(node instanceof Element)) return;
    if (node.closest('script,style')) return;
    /* full-textContent replace only when every child is inline (keeps structure safe) */
    let allInline = true;
    for (const c of node.children) if (!INLINE_OK.has(c.tagName)) { allInline = false; break; }
    if (allInline) {
      const key = norm(node.textContent);
      const hit = key && MAP.get(key);
      if (hit) {
        node.innerHTML = '';
        hit.split('\n').forEach((part, i) => {
          if (i) node.append(document.createElement('br'));
          node.append(document.createTextNode(part));
        });
        return;
      }
    }
    /* direct text-node children always get a chance (e.g. button with an SVG icon) */
    if (!node.children.length) return;
    for (const t of Array.from(node.childNodes)) {
      if (t.nodeType === 3) {
        const k = norm(t.textContent);
        if (k && MAP.has(k)) t.textContent = t.textContent.replace(k, MAP.get(k));
      }
    }
  };

  /* headings with <em> structure get their own markup */
  const headings = () => {
    const h1 = $('.hero h1');
    if (h1 && norm(h1.textContent).indexOf('המקום שבו') === 0) h1.innerHTML = 'Where new music<br/>finds its voice.';
    const quote = $('.manifesto blockquote');
    if (quote && quote.textContent.indexOf('לא באנו') > -1) {
      quote.innerHTML = '“We didn’t come to let AI<br/>replace artists. We came to let more<br/>people <em>become artists.</em>”';
    }
    const kicker = $('.hero .kicker');
    if (kicker) kicker.lastChild && kicker.lastChild.nodeType === 3 && (kicker.lastChild.textContent = ' AI MUSIC ARTISTS ISRAEL');
  };

  const ATTRS = [
    ['.skip-link, a[href="#main-content"]', null],
  ];
  const attrs = () => {
    const nav1 = $('nav.main-nav'); if (nav1) nav1.setAttribute('aria-label', 'Main navigation');
    const nav2 = $('nav.mobile-nav'); if (nav2) nav2.setAttribute('aria-label', 'Quick navigation');
    const brand = $('.site-header .brand'); if (brand) brand.setAttribute('aria-label', 'A.I.M.A, homepage');
    const dock = $('.utility-dock'); if (dock) dock.setAttribute('aria-label', 'Site tools');
    const panel = $('#aima-accessibility-panel'); if (panel) panel.setAttribute('aria-label', 'Accessibility options');
    const banner = $('.cookie-banner'); if (banner) banner.setAttribute('aria-label', 'Privacy preferences');
  };

  /* language toggle: EN is current here, עב links home */
  const toggle = () => {
    const actions = $('.site-header .header-actions');
    if (actions && !$('.en-lang')) {
      const t = el('span', 'en-lang');
      const he = el('a', null, 'עב', { href: '/', hreflang: 'he', lang: 'he', 'aria-label': 'מעבר לעברית / Switch to Hebrew' });
      he.addEventListener('click', () => { try { localStorage.setItem('aima-lang', 'he'); } catch (e) {} });
      t.append(he, el('b', null, 'EN', { 'aria-current': 'true' }));
      actions.prepend(t);
    }
  };

  /* tag dynamic, untranslated Hebrew areas (item 44) */
  const hebrewOnlyTags = () => {
    [['#aima-pulse', 'News items are published in Hebrew · החדשות מוצגות בעברית'],
     ['.spotlight-section', 'Artist & song content in Hebrew · תוכן האמנים בעברית'],
     ['.artists-section', 'Artist content in Hebrew · תוכן האמנים בעברית']]
      .forEach(([sel, txt]) => {
        const s = $(sel);
        if (s && !s.querySelector('.en-he-only')) {
          const tag = el('p', 'en-he-only', txt, { lang: 'en' });
          const shell = s.querySelector('.shell') || s;
          shell.insertBefore(tag, shell.children[1] || null);
        }
      });
  };

  /* PULSE eyebrow in English, weekly cadence */
  const pulse = () => {
    const p = $('#aima-pulse');
    if (!p) return;
    const eb = $('.pulse-heading .eyebrow', p);
    if (eb && /מתעדכן|PULSE/.test(eb.textContent)) eb.textContent = 'PULSE · UPDATED EVERY SUNDAY';
  };

  const ensure = () => {
    try {
      const main = $('main');
      if (main) {
        const walker = document.createTreeWalker(main, NodeFilter.SHOW_ELEMENT);
        const batch = [];
        let n = walker.currentNode;
        while (n) { batch.push(n); n = walker.nextNode(); }
        batch.forEach(translateElement);
      }
      headings(); attrs(); toggle(); hebrewOnlyTags(); pulse();
    } catch (e) { /* never break the page */ }
  };

  const hydrated = () => { const m = document.querySelector('main'); if (!m) return false; for (const k in m) if (k.indexOf('__reactFiber$') === 0 || k.indexOf('__reactProps$') === 0) return true; return false; };
  const t0 = Date.now();
  const iv = setInterval(() => {
    if (hydrated() || Date.now() - t0 > 15000) {
      clearInterval(iv);
      ensure();
      let q = false;
      new MutationObserver(() => { if (q) return; q = true; requestAnimationFrame(() => { q = false; ensure(); }); }).observe(document.body, { childList: true, subtree: true });
    }
  }, 80);
})();
