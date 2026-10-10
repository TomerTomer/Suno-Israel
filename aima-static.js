(() => {
  const packageRoot = document.currentScript?.src ? new URL("./", document.currentScript.src) : new URL("./", location.href);
  const editable = (target) => target instanceof Element && target.closest("input, textarea, select, [contenteditable='true'], .allow-copy");
  document.addEventListener("copy", (event) => { if (!editable(event.target)) event.preventDefault(); });
  document.addEventListener("contextmenu", (event) => { if (!editable(event.target)) event.preventDefault(); });
  document.addEventListener("dragstart", (event) => { if (event.target instanceof Element && event.target.closest("img, svg, video, audio, main")) event.preventDefault(); });
  document.addEventListener("keydown", (event) => {
    if (!editable(event.target) && (event.ctrlKey || event.metaKey) && ["c", "s", "u"].includes(event.key.toLowerCase())) event.preventDefault();
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link || link.target || link.origin !== location.origin || link.hash) return;
    event.preventDefault();
    location.href = link.href;
  }, true);

  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
  const safeHref = (value = "") => /^https?:\/\//i.test(value) ? value : "#";
  const setText = (selector, value) => { const element = document.querySelector(selector); if (element && value) element.textContent = value; };
  const calendarWeekIndex = () => {
    const now = new Date();
    const current = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = current.getUTCDay() || 7;
    current.setUTCDate(current.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
    return current.getUTCFullYear() * 53 + Math.ceil((((current - yearStart) / 86400000) + 1) / 7);
  };

  fetch(new URL("content/community-overrides.json", packageRoot), { cache: "no-store" })
    .then((response) => response.ok ? response.json() : null)
    .then((data) => {
      if (!data) return;
      const artistCard = document.querySelector("[data-monthly-artist]");
      if (artistCard && data.monthlyArtist?.name && data.monthlyArtist?.href) {
        artistCard.href = safeHref(data.monthlyArtist.href);
        setText('[data-field="artist-initials"]', data.monthlyArtist.initials || "AI");
        setText('[data-field="artist-genre"]', data.monthlyArtist.genre);
        setText('[data-field="artist-name"]', data.monthlyArtist.name);
        setText('[data-field="artist-description"]', data.monthlyArtist.description);
      }
      const managedSongs = Array.isArray(data.weeklySongs) ? data.weeklySongs.filter((song) => song?.title && /^https?:\/\//i.test(song?.href || "")) : [];
      const songCard = document.querySelector("[data-weekly-song]");
      if (songCard && managedSongs.length) {
        const song = managedSongs[calendarWeekIndex() % managedSongs.length];
        songCard.href = safeHref(song.href);
        setText('[data-field="song-initials"]', song.initials || "♪");
        setText('[data-field="song-title"]', song.title);
        setText('[data-field="song-artist"]', song.artist || "AIMA");
        setText('[data-field="song-description"]', song.description);
      }
      const eventGrid = document.querySelector(".event-grid");
      if (eventGrid && Array.isArray(data.events)) {
        data.events.slice().reverse().forEach((item, index) => eventGrid.insertAdjacentHTML("afterbegin", `<a class="event-card" href="${safeHref(item.href)}" target="_blank" rel="noreferrer"><div class="event-date"><span>${String(index + 1).padStart(2, "0")}</span><small>${escapeHtml(item.date)}</small></div><div><b>${escapeHtml(item.status || "חדש")}</b><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p></div><strong>לפרטים ↗</strong></a>`));
      }

      const resourceGrid = document.querySelector(".resource-grid");
      if (resourceGrid && Array.isArray(data.resources)) {
        data.resources.slice().reverse().forEach((item) => resourceGrid.insertAdjacentHTML("afterbegin", `<a class="resource-card featured" href="${safeHref(item.href)}" target="_blank" rel="noreferrer"><div class="resource-card-top"><span>${escapeHtml(item.category || "חדש")}</span><b>${escapeHtml(item.platform || "AIMA")}</b></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p><div class="resource-card-bottom"><small>חדש מהסטודיו</small><strong>פתיחה ↗</strong></div></a>`));
      }

      const newsAnchor = document.querySelector(".lead-story");
      if (newsAnchor && Array.isArray(data.news) && data.news.length) {
        const cards = data.news.map((item, index) => `<a href="${safeHref(item.href)}" target="_blank" rel="noreferrer"><span>${String(index + 1).padStart(2, "0")}</span><div><small>${escapeHtml(item.label || "AIMA UPDATE")} · ${escapeHtml(item.date)}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></div><b>↗</b></a>`).join("");
        newsAnchor.insertAdjacentHTML("afterend", `<section class="managed-news"><div class="news-section-head"><p class="eyebrow">FROM AIMA HQ</p><h2>עדכוני הקהילה</h2></div><div class="news-list">${cards}</div></section>`);
      }
    })
    .catch(() => {});
})();

// AIMA guides navigation. Keep the existing site and backend intact.
(() => {
  const root = new URL('./', document.currentScript.src);
  const addGuidesLink = () => {
    document.querySelectorAll('nav[aria-label="ניווט ראשי"], nav[aria-label="ניווט מהיר"]').forEach(nav => {
      if (nav.querySelector('[data-aima-guides]')) return;
      const model = nav.querySelector('a');
      if (!model) return;
      const link = model.cloneNode(false);
      link.removeAttribute('aria-current');
      link.classList.remove('active');
      link.href = new URL('guides.html', root).href;
      link.textContent = 'מדריכים';
      link.dataset.aimaGuides = 'true';
      nav.append(link);
    });
  };
  addGuidesLink();
  const observer = new MutationObserver(addGuidesLink);
  observer.observe(document.body, {childList:true,subtree:true});
})();

// Phase 2: simplify home without replacing hydration, tracking or backend behavior.
(() => {
  const root = new URL('./', document.currentScript.src);
  const home = location.pathname === '/' || /\/index\.html$/.test(location.pathname) && location.pathname.split('/').length === 2;
  if (!home) return;
  const style = document.createElement('style');
  style.textContent = `.hero{display:block!important;padding-top:45px!important;padding-bottom:25px!important;min-height:0!important}.hero-copy{max-width:850px}.hero-stage,.hero-proof,.ticker,.home-feature-story,#resources,.artists-section,.manifesto,.community-app-strip{display:none!important}.hero h1{font-size:clamp(38px,5vw,62px)!important;line-height:1.1!important}.hero-lede{max-width:750px}.pulse-section{padding-top:35px!important;padding-bottom:35px!important}.spotlight-section{padding-top:35px!important;padding-bottom:35px!important}.spotlight-head h2{font-size:clamp(32px,4vw,48px)!important}.pulse-layout{grid-template-columns:1fr!important}.pulse-sidebar{display:none!important}.pulse-lead{max-width:100%}.pulse-section .section-head{margin-bottom:25px!important}.aima-guide-start{display:flex;justify-content:space-between;align-items:center;gap:20px;background:#d8ff3e;border-radius:18px;padding:22px;margin-top:20px;margin-bottom:35px}.aima-guide-start p{margin:0}.aima-guide-start a{white-space:nowrap}.aima-home-note{font-size:15px;line-height:1.7;color:#585751;margin:16px 0 0}.mobile-nav{overflow-x:auto!important}@media(max-width:700px){.aima-guide-start{flex-direction:column;align-items:flex-start}.hero{padding-top:28px!important}.site-header nav{overflow-x:auto}}`;
  document.head.append(style);
  const text = (selector,value) => {const el=document.querySelector(selector);if(el&&el.textContent!==value)el.textContent=value;};
  const update = () => {
    const title=document.querySelector('.hero h1');
    if(title && title.textContent !== 'מוזיקה חדשה.קהילה שיוצרת יחד.') title.innerHTML='מוזיקה חדשה.<br><em>קהילה שיוצרת יחד.</em>';
    text('.hero-lede','עדכונים שכדאי להכיר, יוצרים שכדאי לשמוע ומקום להתחיל ממנו.');
    const first=document.querySelector('.hero-actions .primary');if(first&&first.textContent!=='מה חדש השבוע? ←')first.textContent='מה חדש השבוע? ←';
    const pulse=document.querySelector('#aima-pulse');
    if(pulse){
      const eyebrow=pulse.querySelector('.eyebrow');if(eyebrow&&eyebrow.textContent!=='AIMA PULSE · העדכונים האחרונים')eyebrow.textContent='AIMA PULSE · העדכונים האחרונים';
      const h=pulse.querySelector('h2');if(h&&h.textContent!=='מה חדש השבוע?')h.textContent='מה חדש השבוע?';
      const head=pulse.querySelector('.pulse-heading');
      if(head){const p=head.querySelector(':scope > p');if(p&&p.textContent!=='העדכונים האחרונים שאושרו בקהילה. התאריך מופיע בכל עדכון; לא בכל שבוע מגיע עדכון חדש.')p.textContent='העדכונים האחרונים שאושרו בקהילה. התאריך מופיע בכל עדכון; לא בכל שבוע מגיע עדכון חדש.';}
      if(!document.querySelector('.aima-guide-start')){const section=document.createElement('section');section.className='shell aima-guide-start';section.innerHTML='<p><strong>חדשים בסונו?</strong><br>רעיון ראשון, פרומפט וטיפים לעברית. מתחילים בלי ללכת לאיבוד.</p><a class="button primary" href="'+new URL('guides.html',root).href+'">איפה מתחילים ←</a>';pulse.before(section);}
    }
    const spot=document.querySelector('#community-spotlight');
    if(spot){const h=spot.querySelector('h2');if(h&&h.textContent!=='האמן שבמרכז. שיר השבוע.')h.textContent='האמן שבמרכז. שיר השבוע.';
      if(!spot.querySelector('.aima-home-note')){const p=document.createElement('p');p.className='aima-home-note';p.textContent='כאן מוצגים אמן החודש ושיר שמתחלף אוטומטית מתוך רשימת הקהילה. בחירה שבועית לפי הצבעות עדיין לא פעילה, ולכן לא מוצג מנצח בהצבעה.';(spot.querySelector('.shell')||spot).append(p);}
    }
  };
  update();new MutationObserver(update).observe(document.body,{childList:true,subtree:true});
})();

// Phase 3: label community archives honestly and remove duplicate resource cards.
(() => {
  if (!/\/resources(?:\/index\.html)?\/?$/.test(location.pathname)) return;
  const fixes = {"עדכוני Suno 5.5": ["אתגר \"החיים שלנו טילים\"", "ארכיון יצירה קולקטיבית של הקהילה, לא עדכון מוצר."], "האשטגים וקידום": ["תגיות לפרומפט ב-Suno", "רעיונות לתיאור מבנה וביצוע, לא האשטגים לקידום ברשתות."], "הוקרה למאסטרו": ["שרשור הוקרה למתי כספי", "שרשור קהילתי של שירים וזיכרונות, לא מדריך."], "תוכנות וידאו מומלצות": ["שאלה מהקהילה: כלי וידאו", "דיון עם בקשת המלצות, לא השוואת כלים שנבדקה."], "זכויות ו-ACUM": ["שאלה מהקהילה: זכויות ואקו\"ם", "דיון קהילתי, לא ייעוץ משפטי או מדיניות רשמית."], "מתחילים מאסטרינג": ["ארכיון: מיזם מאסטרינג בקהילה", "הודעה על מיזם ושירות. זמינות, מחירים ותנאים לא אומתו."], "שיווק בלי לאבד את עצמכם": ["דעה: האם יצירה עם Suno היא מוזיקה?", "פוסט דעה ודיון, לא מדריך שיווק."], "חדשות ואותות מ-Suno": ["ארכיון: שיחה עם Suno", "דיווח קהילתי מהזמן שבו נכתב. אינו התחייבות או מדיניות עדכנית."], "ספר הקאברים": ["ארכיון: קאברים והפצה", "טענות משפטיות, מחירים ותנאי הפצה לא אומתו כעת."], "העלאת מוזיקה ל-Spotify": ["ארכיון: הפצה ל-Spotify", "מסלולים, מחירים וזכויות במקור דורשים בדיקה עדכנית."], "מדריך וידאו וליפ-סינק": ["ארכיון: וידאו וליפ-סינק", "רעיונות מהקהילה. זמינות כלים, מחירים ותוצאות לא אומתו."], "תגיות מורחבות": ["קובץ תגיות בתוך הקבוצה", "קישור לפוסט בקבוצה בלבד. תוכן הקובץ לא הועתק לאתר."], "בניית שיר שלב אחר שלב": ["תיאורי קול וכלים לפרומפט", "מאגר רעיונות מתוך ניסויי הקהילה. לא הוראות מוצר רשמיות."]};
  const duplicateTitles = new Set(['מדריך המאסטר של הקהילה','העברית ב-Suno','הטיפים החמים','ליפ-סינק, עוד שיטות']);
  const refresh = () => {
    const grid=document.querySelector('.resource-grid'); if(!grid)return;
    grid.querySelectorAll('.resource-card').forEach(card=>{
      const h=card.querySelector('h2,h3');if(!h)return;
      if(!card.dataset.aimaSourceTitle)card.dataset.aimaSourceTitle=h.textContent.trim();
      const title=card.dataset.aimaSourceTitle;
      if(duplicateTitles.has(title)){if(card.style.display!=='none')card.style.display='none';return;}
      const change=fixes[title];if(change){if(h.textContent!==change[0])h.textContent=change[0];const p=card.querySelector('p');if(p&&p.textContent!==change[1])p.textContent=change[1];}
    });
    if(!document.querySelector('.aima-resource-guide-entry')){
      const entry=document.createElement('a');entry.className='resource-card featured aima-resource-guide-entry';entry.href='../guides.html';
      entry.innerHTML='<div class="resource-card-top"><span>מדריכים</span><b>AIMA</b></div><h2>איפה מתחילים עם Suno?</h2><p>המסלול הקצר: שיר ראשון, עברית, מבנה ועריכה. המקורות והקרדיטים במקום אחד.</p><div class="resource-card-bottom"><small>חינמי ונגיש</small><strong>למדריכים ←</strong></div>';grid.before(entry);
    }
  };
  refresh();new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});
})();

// Homepage jump links should not leave a fragment that re-anchors mobile scroll.
(() => {
  if (!(location.pathname === '/' || location.pathname === '/index.html')) return;
  const hashes = ['#aima-pulse', '#community-spotlight', '#resources'];
  const consume = () => {
    if (!hashes.includes(location.hash)) return;
    const target = document.getElementById(location.hash.slice(1));
    if (!target || Math.abs(target.getBoundingClientRect().top) < 120) return;
    History.prototype.replaceState.call(history, history.state, '', location.pathname + location.search);
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !hashes.includes(url.hash)) return;
    const target = document.getElementById(url.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    target.scrollIntoView({ behavior: 'auto' });
  }, true);
  window.addEventListener('scroll', consume, { passive: true });
})();


// Artist directory: keep approved photos after late data loads, and give cards without a photo a playful avatar.
(() => {
  if (!/\/artists(?:\/index\.html)?\/?$/.test(location.pathname)) return;
  const norm = (value) => String(value || '').trim().toLocaleLowerCase('he');
  let photos = null;
  const style = document.createElement('style');
  style.textContent = '.directory-avatar span.aima-mono{display:block;width:100%;height:100%;font-size:0;cursor:pointer;-webkit-tap-highlight-color:transparent}.directory-avatar span.aima-mono svg{width:100%;height:100%;display:block}.aima-mono .bar{transform-box:fill-box;transform-origin:50% 50%;animation:aimaBreath 5s ease-in-out infinite}.aima-mono .glow{transition:transform 1.2s ease,opacity 1.2s ease;transform-box:fill-box;transform-origin:center}.aima-mono:hover .bar,.aima-mono.go .bar{animation-duration:1.8s}.aima-mono:hover .glow,.aima-mono.go .glow{transform:scale(1.18);opacity:.9}.aima-mono text{transition:letter-spacing .6s ease}@keyframes aimaBreath{0%,100%{transform:scaleY(.55)}50%{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){.aima-mono .bar{animation:none}}';
  document.head.append(style);
  const hash = (text) => { let h = 2166136261; for (const ch of text) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const art = (name) => {
    const h = hash(name || 'AIMA');
    const hue = h % 360, hue2 = (hue + 35 + ((h >> 8) % 40)) % 360;
    const id = 'g' + h.toString(36);
    const initials = (String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('') || 'AI').toUpperCase();
    let seed = h || 1;
    const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const bars = [];
    for (let i = 0; i < 29; i += 1) {
      const env = Math.sin((i / 28) * Math.PI);
      const height = 8 + (env * 0.7 + rnd() * 0.5) * 34;
      bars.push(`<rect class="bar" x="${(6 + i * 3.8).toFixed(1)}" y="${(45 - height / 2).toFixed(1)}" width="1.6" height="${height.toFixed(1)}" rx=".8" fill="#fff" fill-opacity=".38" style="animation-delay:-${(rnd() * 5).toFixed(2)}s"/>`);
    }
    return `<svg viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${initials}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 38% 20%)"/><stop offset="1" stop-color="hsl(${hue2} 42% 32%)"/></linearGradient><radialGradient id="${id}r"><stop offset="0" stop-color="hsl(${hue2} 70% 70%)" stop-opacity=".55"/><stop offset="1" stop-color="hsl(${hue2} 70% 70%)" stop-opacity="0"/></radialGradient></defs><rect width="120" height="90" fill="url(#${id})"/><circle class="glow" cx="${30 + (h % 60)}" cy="${20 + ((h >> 5) % 30)}" r="46" fill="url(#${id}r)" opacity=".6"/>${bars.join('')}<text x="60" y="55" text-anchor="middle" font-size="26" letter-spacing="2" fill="#fff" fill-opacity=".94" font-family="Georgia,'Times New Roman',serif" style="font-weight:400;font-style:italic">${initials}</text></svg>`;
  };
  const decorate = (card) => {
    const avatar = card.querySelector('.directory-avatar');
    if (!avatar || avatar.querySelector('img:not([hidden])')) return;
    const span = avatar.querySelector('span');
    if (!span || span.querySelector('svg')) return;
    const name = card.querySelector('h2')?.textContent || '';
    span.classList.add('aima-mono');
    span.innerHTML = art(name);
    span.addEventListener('click', () => {
      span.classList.remove('go'); void span.offsetWidth; span.classList.add('go');
      clearTimeout(span._t); span._t = setTimeout(() => span.classList.remove('go'), 1200);
    });
  };
  const apply = () => {
    if (!photos) return;
    document.querySelectorAll('.directory-card').forEach((card) => {
      const avatar = card.querySelector('.directory-avatar');
      if (!avatar) return;
      let img = avatar.querySelector('img');
      const src = photos.get(norm(card.querySelector('h2')?.textContent));
      if (src && (!img || !img.isConnected || img.hidden || !img.getAttribute('src'))) {
        if (img) img.remove();
        img = document.createElement('img');
        img.src = src;
        img.alt = `תמונת האמן ${card.querySelector('h2')?.textContent || ''}`;
        img.onerror = () => { img.hidden = true; };
        avatar.append(img);
        avatar.querySelector('span.aima-mono')?.remove();
      }
      if (!src && !img) decorate(card);
    });
  };
  const load = () => fetch(`/api/public/artist-images?fresh=${Date.now()}`, { cache: 'no-store', headers: { accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('photos'))))
    .then((data) => {
      if (!data || !Array.isArray(data.items)) return;
      photos = new Map(data.items.filter((i) => i && typeof i.artistName === 'string' && /^\/api\/public\/artist-images\/artist-[a-f0-9-]+\.webp\?v=\d+$/i.test(i.image || '')).map((i) => [norm(i.artistName), i.image]));
      const oldLior = photos.get(norm('ליאור הלפרין שושני (שירי מחאה)'));
      if (oldLior && !photos.has(norm('ליאור הלפרין שושני (ליקוי מאורות)'))) photos.set(norm('ליאור הלפרין שושני (ליקוי מאורות)'), oldLior);
      apply();
    }).catch(() => {});
  load();
  window.addEventListener('pageshow', load);
  let queued = false;
  new MutationObserver(() => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; apply(); }); }).observe(document.body, { childList: true, subtree: true });
})();


// Homepage: make artist registration easy to see.
(() => {
  if (!(location.pathname === '/' || /\/index\.html$/.test(location.pathname) && location.pathname.split('/').length === 2)) return;
  const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSfzCzlnnUf7rre6cR0HmpHOFyJypyrF_117DPCcn8c_nqKLoA/viewform';
  const css = document.createElement('style');
  css.textContent = '.aima-join{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;background:#ff3f73;color:#fff;border-radius:22px;padding:26px 30px;margin:20px auto 30px;width:min(1100px,calc(100% - 32px))}.aima-join h2{margin:0 0 6px;font-size:clamp(26px,4vw,38px);line-height:1.15}.aima-join p{margin:0;font-size:17px;line-height:1.5;opacity:.95}.aima-join a{background:#111;color:#d8ff3e;font-weight:900;border-radius:999px;padding:15px 28px;text-decoration:none;white-space:nowrap;font-size:18px}@media(max-width:700px){.aima-join{flex-direction:column;align-items:flex-start;padding:22px}.aima-join a{width:100%;text-align:center;box-sizing:border-box}}';
  document.head.append(css);
  const add = () => {
    if (document.querySelector('.aima-join')) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const box = document.createElement('section');
    box.className = 'aima-join';
    box.innerHTML = '<div><h2>רוצים להירשם כאמן? מלאו את הטופס</h2><p>דקה אחת, והפרופיל שלכם מצטרף לספריית האמנים של הקהילה.</p></div>';
    const link = document.createElement('a');
    link.href = FORM; link.target = '_blank'; link.rel = 'noreferrer'; link.textContent = 'לטופס ההרשמה ↗';
    box.append(link);
    hero.insertAdjacentElement('afterend', box);
  };
  add();
  new MutationObserver(add).observe(document.body, { childList: true, subtree: true });
})();


// Events page: add the AIMA salon evening (published details only; no address).
(() => {
  if (!/\/events(?:\/index\.html)?\/?$/.test(location.pathname)) return;
  const add = () => {
    if (document.querySelector('.aima-salon-card')) return;
    const grid = document.querySelector('.event-grid');
    if (!grid) return;
    const card = document.createElement('article');
    card.className = 'event-card aima-salon-card';
    card.innerHTML = '<div class="event-date"><span>08</span><small>8.10.2026 · חמישי 20:00</small></div><div><b>האירוע הסתיים</b><h2>AIMA בסלון: ערב האזנה ראשון</h2><p>ערב ההאזנה הראשון של הקהילה התקיים ב-8 באוקטובר. ההרשמה לאירוע סגורה. תודה לכל מי שהגיע.</p></div><strong>ההרשמה סגורה</strong>';
    let archive = document.querySelector('.aima-events-archive');
    if (!archive) {
      archive = document.createElement('section');
      archive.className = 'aima-events-archive';
      archive.innerHTML = '<div class="events-head"><div><p class="eyebrow">AIMA ARCHIVE</p><h2>אירועים שהסתיימו</h2></div></div><div class="event-grid"></div>';
      document.querySelector('.events-empty').before(archive);
    }
    archive.querySelector('.event-grid').append(card);
    if (!grid.querySelector('a[href*="workshop"]')) {
      const ws = document.createElement('a');
      ws.className = 'event-card aima-workshop-card';
      ws.href = '/workshop/';
      ws.innerHTML = '<div class="event-date"><span>05</span><small>נובמבר, חמישי 20:00</small></div><div><b>סדנה</b><h2>איך היצירות שלנו יכולות להפוך למקור הכנסה נוסף מיוטיוב?</h2><p>סדנה מעשית עם אלעד אביגן, בהנחיית תומר יאיר זמל. מספר המקומות מוגבל.</p></div><strong>לפרטים ↗</strong>';
      grid.prepend(ws);
    }
  };
  add();
  new MutationObserver(add).observe(document.body, { childList: true, subtree: true });
})();



// Homepage weekly song: show the artist's approved photo (when there is one) instead of initials.
(() => {
  if (!(location.pathname === '/' || /\/index\.html$/.test(location.pathname) && location.pathname.split('/').length === 2)) return;
  const norm = (value) => String(value || '').trim().toLocaleLowerCase('he');
  let photos = null;
  const style = document.createElement('style');
  style.textContent = '.week-record span[data-field="song-initials"].has-photo{display:block;width:100%;height:100%;border-radius:50%;overflow:hidden;font-size:0}.week-record span.has-photo img{width:100%;height:100%;object-fit:cover;display:block}';
  document.head.append(style);
  const apply = () => {
    if (!photos) return;
    const span = document.querySelector('[data-weekly-song] [data-field="song-initials"]');
    const artist = norm(document.querySelector('[data-weekly-song] [data-field="song-artist"]')?.textContent);
    if (!span || !artist) return;
    let src = photos.get(artist);
    if (!src) for (const [name, image] of photos) { if (name.startsWith(artist) || artist.startsWith(name)) { src = image; break; } }
    if (!src || span.querySelector('img')) return;
    span.classList.add('has-photo');
    span.innerHTML = `<img src="${src}" alt="" onerror="this.parentNode.classList.remove('has-photo');this.remove()">`;
  };
  fetch(`/api/public/artist-images?fresh=${Date.now()}`, { cache: 'no-store', headers: { accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('photos'))))
    .then((data) => {
      photos = new Map((data.items || []).filter((i) => i && typeof i.artistName === 'string' && /^\/api\/public\/artist-images\/artist-[a-f0-9-]+\.webp\?v=\d+$/i.test(i.image || '')).map((i) => [norm(i.artistName), i.image]));
      const oldLior = photos.get(norm('ליאור הלפרין שושני (שירי מחאה)'));
      if (oldLior && !photos.has(norm('ליאור הלפרין שושני (ליקוי מאורות)'))) photos.set(norm('ליאור הלפרין שושני (ליקוי מאורות)'), oldLior);
      apply();
      [600, 1500, 3500].forEach((ms) => setTimeout(apply, ms));
    }).catch(() => {});
})();
// Events: replace the generic challenge placeholder with the competition page.
(() => {
  if (!/^\/events(?:\/index\.html)?\/?$/.test(location.pathname)) return;
  const apply = () => {
    const grid = document.querySelector('.event-grid');
    if (!grid || grid.querySelector('.aima-blow-us-away-card')) return;
    const placeholder = [...grid.querySelectorAll('.event-card')].find(card =>
      card.querySelector('h2')?.textContent.trim() === 'אתגר היצירה הקהילתי'
    );
    if (!placeholder) return;
    const card = document.createElement('a');
    card.className = 'event-card aima-blow-us-away-card';
    card.href = '/blow-us-away/';
    card.innerHTML = '<div class="event-date"><span>✦</span><small>סיכום התחרות</small></div><div><b>תחרות שהסתיימה</b><h2 dir="ltr">Blow Us Away</h2><p>תחרות מוזיקה בינלאומית עם AI, בהשתתפות יוצרים מהקהילה.</p></div><strong>לעמוד התחרות ←</strong>';
    placeholder.replaceWith(card);
  };
  apply();
  new MutationObserver(apply).observe(document.body, { childList: true, subtree: true });
})();

// AIMA Artist of the Month archive: a permanent home for monthly winners.
(() => {
  const root = new URL('./', document.currentScript.src);
  const home = location.pathname === '/' || location.pathname === '/index.html';
  if (!home) return;
  const addArchive = () => {
    const host = document.querySelector('.spotlight-section .shell') || document.querySelector('.spotlight-section');
    if (!host || host.querySelector('[data-aima-month-archive]')) return;
    const box = document.createElement('div');
    box.dataset.aimaMonthArchive = 'true';
    box.className = 'aima-guide-start';
    const text = document.createElement('div');
    const heading = document.createElement('h3');
    heading.textContent = 'אמני החודש. מקום לכל קול.';
    heading.style.margin = '0 0 8px';
    const description = document.createElement('p');
    description.textContent = 'היוצרות והיוצרים שקיבלו את הבמה בקהילה, הסיפורים והיצירות שלהם.';
    text.append(heading, description);
    const link = document.createElement('a');
    link.href = new URL('artist-of-the-month/index.html', root).href;
    link.className = 'button primary';
    link.textContent = 'לארכיון אמני החודש ↗';
    box.append(text, link);
    host.append(box);
  };
  addArchive();
  new MutationObserver(addArchive).observe(document.body, {childList:true, subtree:true});
})();

// News front-end only. Keep publication and ingestion in the existing pipeline.
(() => {
  if (!/^\/news(?:\/index\.html)?\/?$/.test(location.pathname)) return;
  const style = document.createElement('style');
  style.textContent = `.aima-news-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin:22px 0}.aima-news-toolbar button,.aima-news-actions button{font:inherit;font-weight:700;min-height:44px;border:1px solid #24241f;border-radius:99px;padding:10px 18px;background:transparent;color:#24241f;cursor:pointer}.aima-news-toolbar button[aria-pressed=true]{background:#24241f;color:#f4f0e7}.news-list:has(.aima-news-item){display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.aima-news-item{background:#eeece2;border:1px solid #dfdcd0;border-radius:22px;padding:24px;min-width:0;scroll-margin-top:100px;transition:background .15s}.aima-news-item:hover{background:#e8ecd9}.aima-news-item:nth-child(4n + 1){border-top:4px solid #ff3f73}.aima-news-item:nth-child(4n + 2){border-top:4px solid #bbd946}.aima-news-item[hidden]{display:none!important}.news-list .aima-news-item>a{display:block;border:0;padding:0;color:inherit;text-decoration:none}.news-list .aima-news-item>a>span,.news-list .aima-news-item>a>b{display:none}.aima-news-item small{font-size:13px!important;font-weight:700;line-height:1.7;display:block}.aima-news-item h3{font-size:25px!important;line-height:1.25!important;margin:16px 0!important;overflow-wrap:anywhere}.aima-news-item p{font-size:17px!important;line-height:1.65!important;white-space:pre-line}.aima-news-item:not(.expanded) p{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}.aima-news-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:20px}.news-list .aima-news-actions a{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;width:auto;padding:10px 12px;min-height:44px;font-weight:700;color:inherit;border:0;white-space:nowrap}.aima-news-actions button{font-size:14px;padding:9px 13px}.aima-news-share{background:#d8ef8e!important}.aima-news-status{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#24241f;color:white;padding:13px 22px;border-radius:99px;z-index:100;max-width:85vw;font-size:16px}.lead-story{margin-bottom:32px}.news-section-head h2{font-size:clamp(30px,5vw,46px)}@media(max-width:700px){.news-list:has(.aima-news-item){grid-template-columns:1fr}.aima-news-item{padding:22px 18px}.aima-news-item h3{font-size:25px!important}.news-intro-grid{display:none!important}}`;
  document.head.append(style);
  let activeFilter = 'all';
  const hash = value => { let n=2166136261; for(const c of value) n=Math.imul(n^c.charCodeAt(0),16777619); return (n>>>0).toString(36); };
  let notice;
  const status = message => {
    if(!notice){ notice=document.createElement('div');notice.className='aima-news-status';notice.setAttribute('role','status');document.body.append(notice); }
    notice.textContent=message;notice.hidden=false;clearTimeout(notice.timer);notice.timer=setTimeout(()=>notice.hidden=true,3200);
  };
  const copy = async url => {
    try { await navigator.clipboard.writeText(url); status('הקישור הועתק. אפשר לשלוח לחברים.'); }
    catch { const input=document.createElement('textarea');input.value=url;input.className='allow-copy';document.body.append(input);input.select();const ok=document.execCommand('copy');input.remove();status(ok?'הקישור הועתק.':'לא הצלחנו להעתיק. אפשר להעתיק את הכתובת משורת הדפדפן.'); }
  };
  const apply = () => {
    const lead=document.querySelector('.lead-story');
    if(lead && !document.querySelector('[data-lead-share]')){
      lead.id='news-'+hash(lead.href);
      const actions=document.createElement('div');actions.className='aima-news-actions';actions.dataset.leadShare='true';
      const url=new URL('news/index.html',location.origin+'/');url.hash=lead.id;
      const title=lead.querySelector('h2,h3')?.textContent?.trim() || 'חדשות AIMA';
      const share=document.createElement('button');share.type='button';share.className='aima-news-share';share.textContent='שיתוף הכתבה ↗';share.onclick=async()=>{if(navigator.share){try{await navigator.share({title,text:title+' | AIMA',url:url.href});return;}catch(e){if(e.name==='AbortError')return;}}await copy(url.href);};
      const cp=document.createElement('button');cp.type='button';cp.textContent='העתקת קישור';cp.onclick=()=>copy(url.href);actions.append(share,cp);lead.after(actions);
      if(location.hash==='#'+lead.id)requestAnimationFrame(()=>lead.scrollIntoView());
    }
    const lists=[...document.querySelectorAll('.news-list')];
    for(const list of lists){
      if(!list.previousElementSibling?.classList.contains('aima-news-toolbar')){
        const toolbar=document.createElement('div');toolbar.className='aima-news-toolbar';toolbar.setAttribute('aria-label','סינון חדשות');
        for(const [value,label] of [['all','הכול'],['suno','עדכוני Suno'],['industry','מוזיקה ו־AI']]){
          const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.filter=value;button.setAttribute('aria-pressed',String(value===activeFilter));
          button.onclick=()=>{activeFilter=value;document.querySelectorAll('.aima-news-toolbar button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===value)));document.querySelectorAll('.aima-news-item').forEach(item=>item.hidden=value!=='all'&&item.dataset.category!==value);};toolbar.append(button);
        }
        list.before(toolbar);
      }
      for(const link of [...list.children].filter(x=>x.matches('a[href]'))){
        const title=link.querySelector('h3')?.textContent?.trim(); if(!title)continue;
        const source=link.href;
        if(!/^https?:/.test(source))continue;
        const item=document.createElement('article');item.className='aima-news-item';item.id='news-'+hash(source);item.dataset.category=new URL(source).hostname.replace(/^www\./,'')==='suno.com'?'suno':'industry';
        const shareUrl=new URL('news/index.html',new URL('./',document.currentScript?.src || location.origin+'/aima-static.js'));shareUrl.hash=item.id;
        link.before(item);item.append(link);link.setAttribute('aria-label',title+' - פתיחת המקור');
        const actions=document.createElement('div');actions.className='aima-news-actions';
        const read=document.createElement('a');read.href=source;read.target='_blank';read.rel='noopener noreferrer';read.textContent='למקור ↗';actions.append(read);
        const more=document.createElement('button');more.type='button';more.textContent='עוד על זה';more.setAttribute('aria-expanded','false');more.onclick=()=>{const expanded=item.classList.toggle('expanded');more.setAttribute('aria-expanded',String(expanded));more.textContent=expanded?'פחות':'עוד על זה';};actions.append(more);
        const share=document.createElement('button');share.type='button';share.className='aima-news-share';share.textContent='שיתוף ↗';share.setAttribute('aria-label','שיתוף: '+title);
        share.onclick=async()=>{if(navigator.share){try{await navigator.share({title,text:title+' | AIMA',url:shareUrl.href});return;}catch(e){if(e.name==='AbortError')return;}}await copy(shareUrl.href);};actions.append(share);
        const copyButton=document.createElement('button');copyButton.type='button';copyButton.textContent='העתקת קישור';copyButton.setAttribute('aria-label','העתקת קישור: '+title);copyButton.onclick=()=>copy(shareUrl.href);actions.append(copyButton);item.append(actions);
        item.hidden=activeFilter!=='all'&&item.dataset.category!==activeFilter;
        if(location.hash==='#'+item.id){item.classList.add('expanded');more.setAttribute('aria-expanded','true');more.textContent='פחות';requestAnimationFrame(()=>item.scrollIntoView());}
      }
    }
  };
  apply();new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});
})();
