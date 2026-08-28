# הפעלה חד-פעמית של האוטומציות

## עדכון אמנים מדי יום

1. פתחו את גיליון האמנים ב-Google Sheets.
2. בחרו Extensions ואז Apps Script.
3. החליפו את הקוד בקובץ `google-apps-script/aima-artist-export.gs` ושמרו.
4. לחצו Deploy, אחר כך New deployment ובחרו Web app.
5. Execute as: Me. Who has access: Anyone.
6. העתיקו את כתובת ה-Web app.
7. ב-GitHub פתחו Settings, אחר כך Secrets and variables, Actions, לשונית Variables.
8. צרו משתנה בשם `ARTIST_SHEET_CSV_URL` והדביקו בו את הכתובת.

מכאן GitHub בודק את הגיליון בכל יום בשעה 05:17 UTC, מאחד כפילויות ושומר תמונות מאושרות.

## עדכוני Suno מדי יום

1. ב-Cloudflare פתחו Workers & Pages ואז `aima-photo-api`.
2. ב-Bindings הוסיפו Workers AI binding בשם `AI`.
3. ב-Triggers הוסיפו Cron Trigger: `17 5 * * *`.
4. פרסו את הקוד החדש של ה-Worker מתוך `AIMA-WORKER-COPY-PASTE.txt`.

העדכונים נכנסים כטיוטות בלבד. הם לא מתפרסמים עד שמאשרים אותם בסטודיו.
