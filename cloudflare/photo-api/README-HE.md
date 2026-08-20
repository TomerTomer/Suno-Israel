# AIMA Photo API

ה־Worker הזה מטפל בטופס בקשות התמונות של AIMA. התמונות נשמרות ב־R2 פרטי, הבקשות נשמרות ב־D1, ורק אישור מתוך ה־Studio יוצר תמונה ציבורית בכרטיס האמן.

## משאבים נדרשים ב־Cloudflare

- D1 בשם `aima-photo-requests`
- R2 bucket בשם `aima-artist-images`
- Worker בשם `aima-photo-api` עם route: `sunoisrael.com/api/*`
- Secret בשם `RATE_LIMIT_SALT`, ערך אקראי ארוך
- Cloudflare Access על `sunoisrael.com/api/admin/*`, עם אותה מדיניות `Tomer only` שכבר מגינה על ה־Studio

## פריסה ראשונה

1. מעתיקים את `wrangler.example.jsonc` אל `wrangler.jsonc`.
2. יוצרים D1 ומדביקים את ה־database ID בקובץ.
3. יוצרים את R2 bucket.
4. מריצים את `schema.sql` על D1.
5. מגדירים את `RATE_LIMIT_SALT` כ־Worker secret.
6. פורסים את ה־Worker.
7. מוסיפים ל־AIMA Studio ב־Cloudflare Access גם את הנתיב `api/admin/*`. אסור להשאיר את שדה הנתיב ריק, כדי שהאתר הציבורי יישאר פתוח.

ה־Worker אינו מפעיל כתובת `workers.dev`, ולכן ממשק הניהול זמין רק דרך הדומיין ו־Cloudflare Access.
