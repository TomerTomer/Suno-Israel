# AIMA, project handoff

## Production

- Live URL: https://aima-community.tomeryair.chatgpt.site
- ChatGPT Sites project: `appgprj_6a7dd70eea408191810c522977a027e0`
- Latest ChatGPT Sites version: 8, now private and not used as the public website
- Version ID: `appgprj_6a7dd70eea408191810c522977a027e0~appgver_0dae134b2364819194eb07d6b74e4e85`

- Latest GitHub package: `AIMA-GitHub-final-v12.zip`
- The public website is hosted from the user's GitHub repository and Suno domain.

## Artists source

The artist directory is synchronized from this Google Sheet:

https://docs.google.com/spreadsheets/d/1rArfDxHNYnou_iq1h5M_ZichFrChmMa_50XoMEpjzn4/edit?usp=drive_link

## Continue in a new chat

Upload this source archive and ask the assistant to read this file and the repository README before making changes. After each update, request a validated GitHub Pages export and a new saved Sites version. Publishing the public Sites version requires explicit approval.

The separate `AIMA-GitHub-final-v11.zip` archive is the ready-to-upload static GitHub Pages package. This source archive is the editable application code.

Version 9 adds the Facebook post containing all community stories to the article and resources, and fixes a mobile scroll trap caused by the collapsed cookie banner becoming a nested scroll container.

Version 10 fixes Google Analytics initialization. The tracking configuration now loads before hydration, and the full Google tag with an automatic page view is injected only after analytics consent.

Version 11 is the complete August 2026 update. It adds the corrected Tomer paragraph, a stable article table of contents, the Shir BeClick support strip, approved artist photos, protected artist profile synchronization, a runtime-editable article file, and Studio tools for editing the article and preparing approved artist images. It also preserves the corrected Google Analytics initialization from version 10.

Version 12 adds a complete moderated artist-photo workflow. Artists submit from `/photo-update/`; requests are stored in private Cloudflare R2 with metadata in D1; the Access-protected Studio displays each request already matched to an artist and provides Approve or Reject actions. Approval creates a 640px WebP and updates the public artist card immediately without a GitHub commit. Rejection deletes the submitted image. The public site remains open, while both `/studio/*` and `/api/admin/*` must use the `Tomer only` Cloudflare Access policy.
