// AIMA growth layer: email sign-up (home + news) and share buttons on the Pulse lead.
// Same pattern as aima-static.js: waits for React hydration, then re-adds blocks if React removes them.
(function () {
  var start = function () {
    var css = document.createElement("style");
    css.textContent =
      ".aima-sub{display:grid;grid-template-columns:1.1fr 1fr;gap:28px;align-items:center;background:#111;color:#fff;border-radius:24px;padding:32px;margin:28px auto}" +
      ".aima-sub h2{margin:4px 0 8px;font-size:clamp(28px,4vw,42px);line-height:1.1;color:#d8ff3e}.aima-sub p{margin:0;line-height:1.6}" +
      ".aima-sub .aima-eyebrow{font-size:13px;letter-spacing:.12em;color:#ff3f73;font-weight:800}" +
      ".aima-sub form{display:grid;grid-template-columns:1fr auto;gap:10px}.aima-sub input[type=email]{font:inherit;min-height:50px;border-radius:999px;border:2px solid #d8ff3e;padding:0 20px;background:#fff;color:#111;min-width:0}" +
      ".aima-sub button{font:inherit;font-weight:800;min-height:50px;border:0;border-radius:999px;padding:0 26px;background:#d8ff3e;color:#111;cursor:pointer}.aima-sub button:disabled{opacity:.6}" +
      ".aima-consent{grid-column:1/-1;display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.5;opacity:.92}.aima-consent input{margin-top:3px;width:18px;height:18px;flex:none}.aima-consent a{color:#d8ff3e}" +
      ".aima-msg{grid-column:1/-1;min-height:1.4em;font-weight:700}.aima-hp{position:absolute!important;width:1px;height:1px;opacity:0;overflow:hidden;clip:rect(0 0 0 0)}" +
      ".aima-pulse-share{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.aima-pulse-share button{font:inherit;font-weight:700;min-height:44px;border:1px solid #24241f;background:#fff;color:#111;border-radius:999px;padding:0 18px;cursor:pointer}" +
      "@media(max-width:760px){.aima-sub{grid-template-columns:1fr;padding:24px}.aima-sub form{grid-template-columns:1fr}}";
    document.head.append(css);

    var copy = function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
      var t = document.createElement("textarea"); t.value = text; document.body.append(t); t.select();
      try { document.execCommand("copy"); } catch (e) {} t.remove(); return Promise.resolve();
    };

    var buildSub = function (source) {
      var s = document.createElement("section");
      s.className = "shell aima-sub"; s.setAttribute("data-aima-sub", "1");
      s.innerHTML = '<div><span class="aima-eyebrow">AIMA UPDATES</span><h2>לא מפספסים עדכון.</h2><p>מייל קצר עם חדשות Suno, אמנים חדשים ואירועי הקהילה. בלי ספאם, ואפשר לבקש הסרה בכל עת.</p></div>' +
        '<form novalidate><input type="email" required autocomplete="email" dir="ltr" placeholder="המייל שלך" aria-label="כתובת מייל">' +
        '<input class="aima-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<button type="submit">להרשמה ←</button>' +
        '<label class="aima-consent"><input type="checkbox"><span>אני מאשר/ת קבלת עדכונים במייל מ-AIMA. המייל ישמש רק לשליחת עדכונים ואפשר להסיר אותו בכל עת. <a href="/privacy/index.html">פרטיות ועוגיות</a></span></label>' +
        '<p class="aima-msg" role="status" aria-live="polite"></p></form>';
      var form = s.querySelector("form"), msg = s.querySelector(".aima-msg"), btn = s.querySelector("button");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = form.querySelector("input[type=email]").value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = "כתובת המייל לא נראית תקינה."; return; }
        if (!form.querySelector("input[type=checkbox]").checked) { msg.textContent = "צריך לאשר קבלת עדכונים כדי להירשם."; return; }
        btn.disabled = true; msg.textContent = "שולחים…";
        fetch("/api/public/subscribe", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: email, consent: true, source: source, website: form.querySelector(".aima-hp").value })
        }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
          .then(function (x) {
            if (x.ok) { msg.textContent = "נרשמתם. תודה שהצטרפתם!"; form.reset(); }
            else { msg.textContent = x.d.message || "משהו השתבש. אפשר לנסות שוב בעוד רגע."; btn.disabled = false; }
          }).catch(function () { msg.textContent = "אין חיבור כרגע. אפשר לנסות שוב בעוד רגע."; btn.disabled = false; });
      });
      return s;
    };

    var addPulseShare = function () {
      var links = document.querySelector("#aima-pulse .pulse-lead .pulse-links");
      if (!links || links.parentNode.querySelector(".aima-pulse-share")) return;
      var title = (document.querySelector("#aima-pulse .pulse-lead h3") || {}).textContent || "AIMA Pulse";
      var wrap = document.createElement("div"); wrap.className = "aima-pulse-share";
      var urlFor = function () {
        var id = ""; try { var it = JSON.parse(localStorage.getItem("aima-pulse-lead-v1") || "null"); id = it && it.id ? String(it.id) : ""; } catch (e) {}
        var u = new URL(id ? "/news/index.html" : "/", location.origin); if (id) u.hash = id; return u.href;
      };
      var share = document.createElement("button"); share.type = "button"; share.textContent = "שיתוף ↗";
      share.onclick = function () {
        var url = urlFor();
        if (navigator.share) { navigator.share({ title: title, text: title + " | AIMA", url: url }).catch(function (e) { if (e.name !== "AbortError") copy(url); }); return; }
        copy(url).then(function () { share.textContent = "הקישור הועתק ✓"; setTimeout(function () { share.textContent = "שיתוף ↗"; }, 2000); });
      };
      var wa = document.createElement("button"); wa.type = "button"; wa.textContent = "שליחה בוואטסאפ";
      wa.onclick = function () { window.open("https://wa.me/?text=" + encodeURIComponent(title + " | AIMA\n" + urlFor()), "_blank", "noopener"); };
      wrap.append(share, wa); links.after(wrap);
    };

    var apply = function () {
      if (!document.querySelector("[data-aima-sub]")) {
        var pulse = document.getElementById("aima-pulse");
        var news = document.querySelector(".news-wrap");
        if (pulse) pulse.after(buildSub("home"));
        else if (news) { var strip = news.querySelector(".community-feature-strip"); var el = buildSub("news"); strip ? strip.before(el) : news.append(el); }
      }
      addPulseShare();
    };
    var queued = false;
    new MutationObserver(function () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; apply(); }); })
      .observe(document.body, { childList: true, subtree: true });
    apply();
  };
  var needsWait = !!document.getElementById("_R_");
  var hydrated = function () {
    var el = document.querySelector("main"); if (!el) return false;
    for (var k in el) { if (k.indexOf("__reactFiber$") === 0 || k.indexOf("__reactProps$") === 0) return true; }
    return false;
  };
  if (!needsWait || hydrated()) { start(); return; }
  // Never touch the server HTML before React finishes hydrating: on slow phones the app
  // bundle can need well over 6s, and early edits make React throw hydration error 418 and
  // rebuild the whole page, which throws the reader's scroll back to the top. Wait for
  // hydration without a short deadline; the 60s fallback only covers browsers where the
  // bundle never loads at all (no React there, so no rebuild risk).
  var done = false, t0 = Date.now();
  var go = function () { if (done) return; done = true; clearInterval(iv); start(); };
  var iv = setInterval(function () { if (hydrated() || Date.now() - t0 > 60000) go(); }, 40);
})();

