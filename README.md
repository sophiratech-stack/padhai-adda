# Padhai Adda – Apps Script + Google Sheets version (hosted on Cloudflare Pages)

## How the pieces fit
- **Website** (HTML/CSS/JS) → Cloudflare Pages.
- **Cities and areas** → plain files in `/locations` (one per state). No server call needed.
- **Tutors** → your Google Sheet: one tab per state (`Teachers_<State>`) + `Submissions`. Tabs are created automatically.
- **Backend** → `Code.gs` (Apps Script). Search results are cached per city, so repeat searches are fast.

## Setup, step by step
1. **Google Sheet:** create a new empty spreadsheet and copy its URL.
2. **Apps Script:** go to script.google.com → *New project*. Paste all of `Code.gs`. (The script is separate from the sheet.)
3. In `Code.gs` set **`SHEET_URL`** (your sheet's URL) and **`ADMIN_PASSWORD`** (your own long password).
4. Pick the function **`testSheetConnection`** and press *Run*. Allow access. The log should say it connected.
5. Pick the function **`setupSheets`** and press *Run*. It creates all the tabs the app needs (safe to run again).
6. **Deploy:** *Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone → Deploy*. Copy the **Web app URL**.
7. **Paste the Web app URL** in two places, replacing `PASTE_YOUR_APPS_SCRIPT_URL_HERE`: the settings at the top of `app.js`, and the top of the script in `Admin.html`.
8. **Auto-refresh:** pick the function **`setupTriggers`** and press *Run* (once). It reloads the cache every 5 hours.
9. **Icons:** put the images listed in `assets/README.txt` into `/assets`.
10. **Cloudflare Pages:** *Workers & Pages → Create → Pages → Upload assets*. Name the project `padhaiadda` (site: https://padhai-adda.operates-on.workers.dev) and upload the folder. If you use another name or your own domain, replace `https://padhai-adda.operates-on.workers.dev` in all pages, `sitemap.xml` and `robots.txt`.
11. Open `/Admin`, sign in, and test: import teachers, submit a listing, approve it, search for it.

## After you change Code.gs
*Deploy → Manage deployments → pencil → Version: New version → Deploy.* The URL stays the same.

## Adding cities and areas
- **One at a time:** open `locations/<state>.js`, follow the instructions at the top of the file, upload it again.
- **Many at once:** *Admin → Locations*: upload a CSV with columns `State, City, Zone/Sector/Village`, press *Build files*, download the ZIP, unzip, upload the `locations` folder to Cloudflare Pages.

## Importing teachers
*Admin → Import CSV*. The CSV needs these column names in the first row: Name, Contact, Qualifications, State, City, Zone/Sector/Village, Classes Taught, Subjects Taught, Fees, Teaching Mode, Experience, Status, Current Teaching Location (Teacher ID, Description, Consent, Consent Time are optional). Use *Google Sheets → File → Download → CSV* on your old Teachers tab. Rows are split into the state tabs; bad rows are listed with the reason.

## The cache in one paragraph
The first search of a state (after a change or after 6 hours) reads that state's tab once and stores each city separately in memory; later searches never touch the sheet. Approving, editing, deleting and importing clear only the affected state. If you edit the sheet by hand, press *Clear cache* on the admin dashboard (or run `clearCacheNow` in the editor).

## Notes
- Edit dropdown choices (classes, subjects, modes, qualifications) in `lists.js`. State names must stay identical in `lists.js`, `Code.gs` and the file names in `/locations`.
- If your pages are produced by a build script from `app.js`, repeat the head/URL edits in its templates.
