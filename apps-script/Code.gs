/**
 * PYSS Dues – lets the app record a payment in the Payments tab.
 *
 * Set up once (full steps in README.md, "Recording payments from the app"):
 *  1. In the PYSS Payments Google Sheet: Extensions -> Apps Script.
 *     Replace everything in Code.gs with this file and save.
 *  2. Project Settings (gear) -> Script Properties -> Add property:
 *     PIN = the treasurer's PIN (6 digits or more is best).
 *  3. Deploy -> New deployment -> type "Web app".
 *     Execute as: Me.  Who has access: Anyone.  Deploy, allow access,
 *     and copy the Web app URL (ends in /exec) into SCRIPT_URL in index.html.
 *
 * The PIN never appears in the app's code: it is checked here. After 5 wrong
 * PINs, saving is paused for 10 minutes.
 */
const PAYMENTS_TAB = 'Payments';
const MAX_FAILS = 5;
const LOCK_SECONDS = 600;
const TIME_ZONE = 'Asia/Dubai';

function doPost(e) {
  let d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: 'bad_request' });
  }

  const pin = PropertiesService.getScriptProperties().getProperty('PIN');
  if (!pin) return reply({ ok: false, error: 'no_pin_set' });

  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('fails') || 0);
  if (fails >= MAX_FAILS) return reply({ ok: false, error: 'locked' });
  if (String(d.pin || '') !== pin) {
    cache.put('fails', String(fails + 1), LOCK_SECONDS);
    return reply({ ok: false, error: fails + 1 >= MAX_FAILS ? 'locked' : 'wrong_pin' });
  }
  cache.remove('fails');

  if (d.action === 'check') return reply({ ok: true });

  const sn = Math.round(Number(d.sn));
  const amount = Math.round(Number(d.amount));
  if (!(sn >= 1 && sn <= 9999)) return reply({ ok: false, error: 'bad_sn' });
  if (!(amount > 0 && amount <= 1000000)) return reply({ ok: false, error: 'bad_amount' });
  const date = /^\d{4}-\d{2}-\d{2}$/.test(d.date || '')
    ? d.date
    : Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd');

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    // The app sends an id with each save, so a retry never adds the row twice.
    const rid = String(d.rid || '').slice(0, 64);
    if (rid && cache.get('rid_' + rid)) return reply({ ok: true, duplicate: true });

    const sheet = SpreadsheetApp.getActive().getSheetByName(PAYMENTS_TAB);
    if (!sheet) return reply({ ok: false, error: 'no_tab' });

    // Put each value under its own heading, wherever the columns are.
    const lastCol = Math.max(sheet.getLastColumn(), 5);
    const head = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
      .map(h => String(h).toLowerCase().replace(/[^a-z]/g, ''));
    const col = names => head.findIndex(h => names.indexOf(h) >= 0);
    const iD = col(['date', 'datepaid']);
    const iS = col(['sn', 'sno', 'serial', 'serialno']);
    const iN = col(['name']);
    const iA = col(['amount', 'amountpaid', 'paid']);
    const iT = col(['note', 'notes', 'remarks', 'remark']);
    if (iS < 0 || iA < 0) return reply({ ok: false, error: 'no_columns' });

    const row = new Array(lastCol).fill('');
    if (iD >= 0) row[iD] = date;
    row[iS] = sn;
    if (iN >= 0) row[iN] = clean(d.name);
    row[iA] = amount;
    if (iT >= 0) row[iT] = clean(d.note);
    sheet.appendRow(row);

    if (rid) cache.put('rid_' + rid, '1', 21600);
    return reply({ ok: true, row: sheet.getLastRow() });
  } finally {
    lock.releaseLock();
  }
}

// Opening the URL in a browser just shows that the script is running.
function doGet() {
  return reply({ ok: true, service: 'PYSS Dues payments' });
}

// Text only: a leading = + - @ would make the sheet treat it as a formula.
function clean(s) {
  return String(s || '').replace(/^[=+\-@\s]+/, '').slice(0, 100);
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
