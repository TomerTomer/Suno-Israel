/* Small requested follow-up. No new services, polling, mutation observers or paid dependencies. */
(() => {
  'use strict';
  const path = '/' + location.pathname.split('/').filter(x => x && x !== 'index.html').join('/') + '/';
  const route = path === '//' ? '/' : path;
  const metadata = {
    '/': ['A.I.M.A | קהילת יוצרי מוזיקה עם AI בישראל: אמנים, רדיו, מגזין ומשאבים', 'A.I.M.A היא קהילת יוצרי המוזיקה עם AI בישראל. גלו אמנים, האזינו לרדיו ZIK, קראו את מגזין PULSE ומצאו מדריכים, כלים וטיפים ליצירה עם Suno.'],
    '/artists/': ['אמני הקהילה | A.I.M.A', 'גלו את יוצרי המוזיקה עם AI בקהילת A.I.M.A. חפשו אמנים והאזינו ליצירות שלהם.'],
    '/prompts/': ['Prompt Lab: מעבדת פרומפטים למוזיקה | A.I.M.A', 'בנו פרומפט למוזיקה לפי סגנון, קול ואווירה, ונסו מתכונים ליצירה עם Suno במעבדת הפרומפטים של A.I.M.A.'],
    '/news/': ['PULSE: עדכוני מוזיקה ו-AI | A.I.M.A', 'עדכוני Suno, כלי מוזיקה עם AI וחדשות מהקהילה, בעברית. קראו את עדכוני PULSE ואת המקורות שלהם.'],
    '/events/': ['מפגשים ואירועי הקהילה | A.I.M.A', 'מפגשים, סדנאות ואתגרי יצירה של קהילת A.I.M.A. פרטי האירועים וארכיון האירועים שהסתיימו.'],
    '/radio/': ['רדיו ZIK ותוכניות 106FM | A.I.M.A', 'האזינו לרדיו ZIK וגלו את תוכניות A.I.M.A עם גיא רפאל ב-106FM. מוזיקה ויוצרים מהקהילה.'],
    '/resources/': ['כלים ומשאבים ליצירת מוזיקה עם AI | A.I.M.A', 'ספריית הכלים, המדריכים והמשאבים של קהילת A.I.M.A ליוצרי מוזיקה עם AI ו-Suno.']
  };
  const css = document.createElement('style');
  css.textContent = '.aima-audit-hidden{display:none!important}.aima-founder{box-sizing:border-box;width:100%;padding:28px max(24px,calc((100% - 1100px)/2)) 76px;background:#141411;color:#f7f5ec;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;font-family:inherit;direction:rtl}.aima-founder p{margin:0;font-size:16px;line-height:1.7}.aima-founder a,.aima-next a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:10px 22px;border:1px solid currentColor;border-radius:999px;text-decoration:none;color:inherit;font-weight:700;box-sizing:border-box}.aima-founder a:hover,.aima-founder a:focus-visible{background:#d8ff3e;color:#141411;outline-offset:4px}.aima-next{margin:24px auto 40px;max-width:1180px;padding:24px;box-sizing:border-box;background:#efede5;border-radius:16px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}.aima-next p{margin:0;line-height:1.7}.aima-next a:hover{background:#d8ff3e}.aima-copy-status{position:fixed;bottom:24px;left:24px;right:24px;max-width:420px;margin:auto;padding:14px 20px;border-radius:14px;background:#151512;color:#fff;z-index:9999;text-align:center;pointer-events:none}.aima-copy-status:empty{display:none}@media(max-width:600px){.aima-founder a{width:100%}.aima-next{margin-inline:20px}}';
  document.head.append(css);
  const founder = document.createElement('section');
  founder.className = 'aima-founder'; founder.setAttribute('aria-label', 'מייסד הקהילה ויצירת קשר');
  const name = document.createElement('p'); name.textContent = 'מייסד הקהילה: תומר יאיר';
  const contact = document.createElement('a'); contact.href = 'mailto:tomeryairz1@gmail.com'; contact.textContent = 'יצירת קשר באימייל';
  founder.append(name, contact);
  // Outside the React root: static contact remains available without DOM-repair observers.
  document.body.append(founder);
  const set = (el, text) => { if (el && el.textContent !== text) el.textContent = text; };
  const next = {
    '/news/': ['קראתם משהו שנתן לכם רעיון?', 'נסו אותו ב-Prompt Lab ←', '/prompts/'],
    '/prompts/': ['רוצים לחדד את היצירה הבאה?', 'לטיפים של הקהילה ←', '/tips/'],
    '/artists/': ['הכירו עוד מהאנשים מאחורי המוזיקה.', 'לסיפורים של הקהילה ←', '/story/'],
    '/story/': ['מכאן אפשר להמשיך להאזין.', 'לספריית האמנים ←', '/artists/'],
    '/radio/': ['מוזיקה מתחילה באנשים שיוצרים אותה.', 'גלו את אמני הקהילה ←', '/artists/'],
    '/events/': ['עד המפגש הבא, ממשיכים ליצור.', 'למדריכים של הקהילה ←', '/guides.html']
  };
  const apply = () => {
    if (!founder.isConnected) document.body.append(founder);
    const oldCredit = document.querySelector('.r2-credit');
    if (oldCredit && oldCredit.firstChild?.nodeType === Node.TEXT_NODE && oldCredit.firstChild.nodeValue.includes('מייסד הקהילה')) oldCredit.firstChild.nodeValue = 'כל הזכויות שמורות · ';
    if (route === '/story/') {
      document.querySelectorAll('main p').forEach(p => {
        if (p.textContent.includes('sunoisrael.co.il')) p.textContent = p.textContent.replaceAll('sunoisrael.co.il', 'sunoisrael.com');
      });
    }
    if (metadata[route]) {
      if (document.title !== metadata[route][0]) document.title = metadata[route][0];
      const description = document.querySelector('meta[name="description"]');
      if (description && description.content !== metadata[route][1]) description.content = metadata[route][1];
    }
    if (next[route] && route !== '/prompts/') document.querySelectorAll('.community-app-strip').forEach(n => n.classList.add('aima-audit-hidden'));
    if (next[route] && !document.querySelector('.aima-next')) {
      const footer = document.querySelector('footer');
      if (footer) {
        const box = document.createElement('section'); box.className = 'aima-next'; box.setAttribute('aria-label', 'ממשיכים באתר');
        const p = document.createElement('p'); p.textContent = next[route][0];
        const a = document.createElement('a'); a.textContent = next[route][1]; a.href = next[route][2];
        box.append(p, a); footer.before(box);
      }
    }
    if (route === '/prompts/') {
      document.querySelectorAll('.recipe-top > span').forEach((n, i) => set(n, String(i + 1).padStart(2, '0')));
    }
    if (route === '/radio/') {
      const placeholder = [...document.querySelectorAll('.podcast-card')].find(n => n.textContent.includes('COMING SOON'));
      if (placeholder) placeholder.classList.add('aima-audit-hidden');
    }
    if (route === '/events/') {
      document.querySelectorAll('.event-card').forEach(card => {
        if (card.querySelector('h2')?.textContent.trim() === 'המפגש הבא של A.I.M.A') card.classList.add('aima-audit-hidden');
        // The workshop date is confirmed in the existing event content and is now past.
        if (!card.dataset.workshopArchive && card.querySelector('h2')?.textContent.includes('מקור הכנסה נוסף מיוטיוב')) {
          card.classList.add('aima-audit-hidden');
          const archive = document.querySelector('.aima-events-archive .event-grid');
          if (archive && !archive.querySelector('[data-workshop-archive]')) {
            const copy = card.cloneNode(true); copy.hidden = false; copy.classList.remove('aima-audit-hidden'); copy.dataset.workshopArchive = '1';
            set(copy.querySelector('b'), 'האירוע הסתיים'); set(copy.querySelector('.event-date small'), '5.11.2026 · חמישי 20:00');
            set(copy.querySelector('p'), 'סדנה עם אלעד אביגן, בהנחיית תומר יאיר זמל. הסדנה התקיימה ב-5 בנובמבר 2026.');
            copy.href = '/workshop/'; copy.removeAttribute('target'); set(copy.querySelector('strong'), 'לעמוד הסדנה ←'); archive.append(copy);
          }
        }
      });
      set(document.querySelector('.events-head h2'), 'מפגשים ויצירה בקהילה');
      const poster = document.querySelector('.events-poster span'); set(poster, 'A.I.M.A');
    }
  };
  if (typeof __aimaAfterHydration === 'function') __aimaAfterHydration(apply); else apply();
  // Bounded follow-up for legacy content loaded just after hydration. No polling or observer.
  [1000, 3000, 6500].forEach(ms => setTimeout(apply, ms));
  if (route === '/prompts/') {
    const status = document.createElement('p'); status.className = 'aima-copy-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); document.body.append(status);
    let timer;
    document.addEventListener('click', event => {
      if (event.target.closest('.filter-row button')) setTimeout(apply, 0);
      if (event.target.closest('.copy-prompt')) {
        setTimeout(() => { const btn = event.target.closest('.copy-prompt'); if (btn?.textContent.includes('הועתק')) { set(status, 'הועתק ✓'); clearTimeout(timer); timer = setTimeout(() => set(status, ''), 2200); } }, 180);
      }
    });
  }
})();
