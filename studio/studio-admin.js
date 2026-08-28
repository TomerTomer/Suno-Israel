(() => {
  const api = "/api/admin/content";
  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/gu, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
  let contentItems = [];
  let editingId = null;

  const template = () => `<section class="panel pulse-admin" id="pulse-admin">
    <div class="pulse-admin-head"><div><small class="eyebrow">AIMA PULSE · LIVE CONTENT</small><h2>מה חדש, למה זה משנה.</h2><p>העדכונים החדשים של Suno נכנסים לכאן כטיוטות בעברית. אפשר לערוך הכול לפני הפרסום, וגם להוסיף עדכונים וקישורים משלכם.</p></div><button class="save" id="pulse-import" type="button">בדיקה חדשה ב-Suno</button></div>
    <div class="pulse-admin-status" id="pulse-admin-status" aria-live="polite">מתחבר למערכת התוכן...</div>
    <div class="pulse-admin-grid">
      <form class="pulse-admin-card" id="pulse-admin-form"><h3 id="pulse-form-title">עדכון חדש</h3>
        <label>כותרת בעברית<input name="title" required maxlength="180"></label>
        <label>תקציר קצר<textarea name="summary" maxlength="1200"></textarea></label>
        <label>מה המשמעות ליוצר?<textarea name="impact" maxlength="900"></textarea></label>
        <label>מה כדאי לנסות עכשיו?<textarea name="action" maxlength="600"></textarea></label>
        <label>קישור למקור<input name="url" type="url" dir="ltr" placeholder="https://..."></label>
        <div class="pulse-admin-form-row"><label>תאריך<input name="publishedAt" type="date" required></label><label>תגית<input name="label" value="AIMA UPDATE"></label></div>
        <div class="pulse-admin-form-row"><label>סוג תוכן<select name="contentType"><option value="news">חדשות ועדכונים</option><option value="resource">קישור חשוב / משאב</option></select></label><label>סטטוס<select name="status"><option value="draft">טיוטה</option><option value="published">פרסום באתר</option></select></label></div>
        <label>סדר תצוגה<input name="position" type="number" value="0"></label>
        <div class="pulse-admin-actions"><button class="save" type="submit">שמירה</button><button class="save" id="pulse-cancel" type="button">ניקוי</button></div>
      </form>
      <section class="pulse-admin-card"><h3>ממתינים ופורסמו</h3><div class="pulse-admin-list" id="pulse-admin-list"></div></section>
    </div>
  </section>`;

  const status = (message) => { document.querySelector("#pulse-admin-status").textContent = message; };
  const editor = () => document.querySelector("#pulse-admin-form");

  function resetForm() {
    editingId = null;
    editor().reset();
    editor().elements.publishedAt.value = new Date().toISOString().slice(0, 10);
    editor().elements.label.value = "AIMA UPDATE";
    editor().elements.contentType.value = "news";
    editor().elements.position.value = "0";
    document.querySelector("#pulse-form-title").textContent = "עדכון חדש";
  }

  function render() {
    const list = document.querySelector("#pulse-admin-list");
    if (!contentItems.length) { list.innerHTML = '<div class="empty">עוד אין עדכונים. לחצו על בדיקה חדשה ב-Suno.</div>'; return; }
    list.innerHTML = contentItems.map((item) => `<article class="pulse-admin-item is-${escapeHtml(item.status)}" data-id="${item.id}"><small>${escapeHtml(item.label)} · ${escapeHtml(item.publishedAt)} · ${item.contentType === "resource" ? "משאב" : "חדשות"} · ${item.status === "published" ? "מפורסם" : "ממתין לאישור"}</small><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.summary)}</p>${item.impact ? `<p><b>המשמעות:</b> ${escapeHtml(item.impact)}</p>` : ""}${item.sourceKind === "suno" ? `<div class="pulse-admin-original"><b>Original:</b> ${escapeHtml(item.originalTitle)}</div>` : ""}<div class="pulse-admin-item-actions"><button data-action="edit">עריכה</button><button class="publish" data-action="toggle">${item.status === "published" ? "החזרה לטיוטה" : "פרסום עכשיו"}</button><button class="delete" data-action="delete">מחיקה</button></div></article>`).join("");
  }

  async function load() {
    const response = await fetch(`${api}?fresh=${Date.now()}`, { cache: "no-store", headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("לא הצלחתי להתחבר. ודאו שנכנסתם לסטודיו דרך Cloudflare Access.");
    contentItems = (await response.json()).items || [];
    render();
    status(`נטענו ${contentItems.length} עדכונים. ${contentItems.filter((item) => item.status === "draft").length} ממתינים לאישור.`);
  }

  function edit(item) {
    editingId = item.id;
    const form = editor();
    ["title", "summary", "impact", "action", "url", "publishedAt", "label", "contentType", "status", "position"].forEach((name) => { form.elements[name].value = item[name] ?? ""; });
    document.querySelector("#pulse-form-title").textContent = "עריכת עדכון";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function patchItem(item, changes) {
    const response = await fetch(`${api}/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...item, ...changes }) });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || "השמירה נכשלה.");
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".hero").insertAdjacentHTML("afterend", template());
    resetForm();
    load().catch((error) => status(error.message));

    document.querySelector("#pulse-import").addEventListener("click", async (event) => {
      event.currentTarget.disabled = true;
      status("בודק את עמוד העדכונים הרשמי של Suno ומכין הסברים בעברית...");
      try {
        const response = await fetch(`${api}/import-suno`, { method: "POST", headers: { accept: "application/json" } });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "הבדיקה נכשלה.");
        await load();
        status(result.imported ? `נמצאו ${result.imported} עדכונים חדשים. הם ממתינים לעריכה ולאישור.` : "הכול מעודכן. לא נמצאו עדכונים חדשים.");
      } catch (error) { status(error.message); }
      finally { event.currentTarget.disabled = false; }
    });

    editor().addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(editor()));
      status("שומר את העדכון...");
      try {
        const response = await fetch(editingId ? `${api}/${editingId}` : api, { method: editingId ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "השמירה נכשלה.");
        resetForm();
        await load();
        status(data.status === "published" ? "נשמר ופורסם באתר." : "נשמר בטיוטות.");
      } catch (error) { status(error.message); }
    });
    document.querySelector("#pulse-cancel").addEventListener("click", resetForm);
    document.querySelector("#pulse-admin-list").addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      const card = event.target.closest("[data-id]");
      if (!button || !card) return;
      const item = contentItems.find((entry) => entry.id === Number(card.dataset.id));
      if (!item) return;
      if (button.dataset.action === "edit") { edit(item); return; }
      try {
        if (button.dataset.action === "toggle") await patchItem(item, { status: item.status === "published" ? "draft" : "published" });
        if (button.dataset.action === "delete") {
          if (!window.confirm("למחוק את העדכון הזה?")) return;
          const response = await fetch(`${api}/${item.id}`, { method: "DELETE" });
          if (!response.ok) throw new Error("המחיקה נכשלה.");
        }
        await load();
      } catch (error) { status(error.message); }
    });
  });
})();
