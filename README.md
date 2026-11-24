# PYSS Fund – Pending Dues app

A phone-installable web app (PWA) showing each member's pending dues. The
base figures are the list as on 25 Oct 2026. Payments made after that are read
from the treasurer's Google Sheet, so recording a payment means adding a row to
the sheet.

## One-time setup

### 1. Create the Google Sheet

1. Go to <https://sheets.new> and name the sheet **PYSS Payments**.
2. **File → Import → Upload** `sheet-template/Payments.csv` and choose
   **Replace current sheet**. Rename the tab at the bottom to exactly
   **Payments**.
3. Optional, as a lookup list: **File → Import** `sheet-template/Members.csv`
   with **Insert new sheet(s)**. It lists every member's S/N.
4. Click **Share**. Under *General access*, choose **Anyone with the link** →
   **Viewer**. (People can view, but only you and those you add as editors can
   change it.)
5. Copy the sheet ID from the address bar. It is the long part between
   `/d/` and `/edit`:
   `https://docs.google.com/spreadsheets/d/`**`1AbC…xyz`**`/edit`

### 2. Connect the app to the sheet

In `index.html`, find this line near the top of the script and paste the ID
between the quotes:

```js
const SHEET_ID='__SHEET_ID__';
```

### 3. Turn on GitHub Pages

Repo **Settings → Pages → Build and deployment**: Source **Deploy from a
branch**, Branch **main**, folder **/ (root)**, then **Save**. After a minute
the app is at <https://jijesh817.github.io/PYSS-Dues/>.

## Recording a payment

Add one row to the **Payments** tab:

| Date       | S/N | Name          | Amount | Note    |
|------------|-----|---------------|--------|---------|
| 2026-11-07 | 88  | MANEESH BALAN | 2000   | Yr 2026 |

- **S/N** is what the app uses to find the member (see the Members tab). Name
  is only for your reference. ID 107 is shared by two members, which is why
  S/N is used.
- **Amount** is a whole number. **Note** is optional.
- To correct a mistake, edit or delete the row.

The app picks up changes when it is opened, brought back to the screen, or
when **Refresh** is tapped. Google can take a minute or two to serve a change.
If a row's S/N or amount is not recognised, the app names that sheet row so it
can be fixed.

## Recording payments from the app

The app has a **+ Add payment** button (top of the app, and in each member's
details) that adds the row to the Payments tab for you. A treasurer PIN
protects it. It stays hidden until it is set up once:

1. Open the **PYSS Payments** Google Sheet and choose **Extensions → Apps
   Script**.
2. Delete what is in `Code.gs`, paste in everything from
   [`apps-script/Code.gs`](apps-script/Code.gs), and tap **Save**.
3. Click **Project Settings** (the gear), scroll to **Script Properties**,
   choose **Add script property**, and add:
   - Property: `PIN`
   - Value: the treasurer PIN. Use 6 digits or more.

   Then **Save script properties**. To change the PIN later, edit it here.
4. Click **Deploy → New deployment**. Next to *Select type*, click the gear and
   choose **Web app**. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**

   Click **Deploy**, then **Authorize access** and allow it with your Google
   account. (Google may warn that the app is unverified: choose **Advanced →
   Go to … (unsafe)**. It is your own script.)
5. Copy the **Web app URL** (it ends in `/exec`). In `index.html`, paste it
   between the quotes of:

   ```js
   const SCRIPT_URL='__SCRIPT_URL__';
   ```

   and commit. The button appears once GitHub Pages has updated.

Using it: tap **+ Add payment**, find the member, enter the amount (or tap a
quick amount such as *Full due*), check the date, add a note if you like,
enter the PIN and tap **Save**. The payment shows straight away, marked
*saving to sheet…* until the sheet returns it a minute or so later.

- The PIN is checked by the script, never stored in the app's code. Tick
  **Remember PIN on this phone** only on the treasurer's own phone.
- After 5 wrong PINs, saving pauses for 10 minutes.
- To correct or remove a payment, edit or delete its row in the sheet.
- If you change `Code.gs` later, use **Deploy → Manage deployments → Edit
  (pencil) → Version: New version → Deploy**, so the URL stays the same.

## Changing a member's block

The app also reads the **Members** tab of the same sheet (import
`sheet-template/Members.csv` to start it). It needs an **S/N** column and a
**Block** column; other columns are ignored. Type the new block in that
member's row and the app shows it on the next refresh. A blank Block cell
keeps the block from the 25 Oct list. If there is no Members tab, the app
uses the 25 Oct blocks.

## Installing on a phone

- **Android (Chrome):** open the link and tap **Install app** on the page, or
  **⋮ → Install app / Add to Home screen**.
- **iPhone (Safari):** open the link, tap **Share → Add to Home Screen**.

The app works offline with the payments it last loaded.

## Files

- `index.html` – the app, including the 25 Oct base figures
- `manifest.webmanifest`, `sw.js`, `icons/` – what makes it installable and
  work offline
- `sheet-template/` – CSV files to start the Google Sheet
- `apps-script/Code.gs` – the small Google script behind **+ Add payment**
