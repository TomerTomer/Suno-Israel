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
  style.textContent = '.directory-avatar span.aima-fun{display:block;width:100%;height:100%;font-size:0;cursor:pointer;-webkit-tap-highlight-color:transparent}.directory-avatar span.aima-fun svg{width:100%;height:100%;display:block}.aima-fun .disc{transform-box:fill-box;transform-origin:center;animation:aimaSpin 14s linear infinite}.aima-fun.go .disc{animation-duration:.7s}.aima-fun .bar{transform-box:fill-box;transform-origin:50% 100%;animation:aimaBar 1.6s ease-in-out infinite}.aima-fun.go .bar{animation-duration:.35s}.aima-fun .note{opacity:0;transform-box:fill-box}.aima-fun.go .note{animation:aimaNote 1.1s ease-out forwards}@keyframes aimaSpin{to{transform:rotate(360deg)}}@keyframes aimaBar{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}@keyframes aimaNote{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-70px)}}@media(prefers-reduced-motion:reduce){.aima-fun .disc,.aima-fun .bar{animation:none}}';
  document.head.append(style);
  const hash = (text) => { let h = 2166136261; for (const ch of text) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const eyes = [
    (c) => `<circle cx="-22" cy="-8" r="7" fill="#fff"/><circle cx="22" cy="-8" r="7" fill="#fff"/><circle cx="-21" cy="-7" r="3.5" fill="${c}"/><circle cx="23" cy="-7" r="3.5" fill="${c}"/>`,
    (c) => `<path d="M-30 -6q8 -12 16 0M14 -6q8 -12 16 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    (c) => `<rect x="-34" y="-16" width="28" height="16" rx="6" fill="#111"/><rect x="6" y="-16" width="28" height="16" rx="6" fill="#111"/><rect x="-6" y="-12" width="12" height="4" fill="#111"/>`,
    (c) => `<circle cx="-22" cy="-8" r="9" fill="#fff"/><circle cx="22" cy="-8" r="9" fill="#fff"/><circle cx="-22" cy="-8" r="4" fill="${c}"/><circle cx="22" cy="-8" r="4" fill="${c}"/>`
  ];
  const mouths = [
    '<path d="M-18 14q18 20 36 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>',
    '<ellipse cx="0" cy="18" rx="9" ry="11" fill="#fff"/>',
    '<path d="M-16 16h32" stroke="#fff" stroke-width="5" stroke-linecap="round"/>',
    '<path d="M-20 12q20 26 40 0z" fill="#fff"/>',
    '<path d="M-14 14q14 12 28 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="12" cy="24" r="4" fill="#ff7aa8"/>'
  ];
  const extras = [
    '', '',
    '<path d="M-46 -26q46 -42 92 0" stroke="#111" stroke-width="7" fill="none"/><rect x="-54" y="-30" width="14" height="30" rx="7" fill="#111"/><rect x="40" y="-30" width="14" height="30" rx="7" fill="#111"/>',
    '<path d="M-26 -52l8 -22l14 14l12 -18l12 18l14 -14l8 22z" fill="#ffd23f" stroke="#111" stroke-width="2"/>'
  ];
  const palette = ['#111', '#2a1f4d', '#12343b', '#3d1a2c', '#1d2b1a'];
  const art = (name) => {
    const h = hash(name || 'AIMA');
    const eye = eyes[h % eyes.length], mouth = mouths[(h >> 3) % mouths.length], extra = extras[(h >> 6) % extras.length];
    const disc = palette[(h >> 9) % palette.length], iris = ['#ff3f73', '#2d7dff', '#18a058', '#8a5cff'][(h >> 12) % 4];
    const bars = [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect class="bar" x="${14 + i * 11}" y="${108 - 14 - ((h >> (i + 2)) % 4) * 6}" width="7" height="${26 + ((h >> (i + 5)) % 4) * 6}" rx="3" fill="#111" style="animation-delay:${(i * 0.17).toFixed(2)}s"/>`).join('');
    return `<svg viewBox="0 0 120 90" role="img" aria-label="אוואטר מצויר" preserveAspectRatio="xMidYMid slice"><g transform="translate(60 45) scale(.62)"><g class="disc"><circle r="70" fill="${disc}"/><circle r="56" fill="none" stroke="#ffffff22" stroke-width="2"/><circle r="44" fill="none" stroke="#ffffff22" stroke-width="2"/><circle cx="0" cy="-62" r="4" fill="#ffffff55"/></g><circle r="38" fill="${disc}" stroke="#ffffff55" stroke-width="3"/>${eye(iris)}${mouth}${extra}</g><g transform="translate(60 80) scale(.36) translate(-60 -80)" opacity=".0">${bars}</g><g class="notes"><text class="note" x="92" y="40" font-size="16">🎵</text><text class="note" x="18" y="46" font-size="14" style="animation-delay:.15s">🎶</text></g></svg>`;
  };
  const decorate = (card) => {
    const avatar = card.querySelector('.directory-avatar');
    if (!avatar || avatar.querySelector('img:not([hidden])')) return;
    const span = avatar.querySelector('span');
    if (!span || span.querySelector('svg')) return;
    const name = card.querySelector('h2')?.textContent || '';
    span.classList.add('aima-fun');
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
        avatar.querySelector('span.aima-fun')?.remove();
      }
      if (!src && !img) decorate(card);
    });
  };
  const load = () => fetch(`/api/public/artist-images?fresh=${Date.now()}`, { cache: 'no-store', headers: { accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('photos'))))
    .then((data) => {
      if (!data || !Array.isArray(data.items)) return;
      photos = new Map(data.items.filter((i) => i && typeof i.artistName === 'string' && /^\/api\/public\/artist-images\/artist-[a-f0-9-]+\.webp\?v=\d+$/i.test(i.image || '')).map((i) => [norm(i.artistName), i.image]));
      apply();
    }).catch(() => {});
  load();
  window.addEventListener('pageshow', load);
  let queued = false;
  new MutationObserver(() => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; apply(); }); }).observe(document.body, { childList: true, subtree: true });
})();
