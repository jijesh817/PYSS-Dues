// PYSS Dues – receives "Record payment" from the app and adds a row to the
// Payments tab. Paste this into the sheet's Extensions → Apps Script, set a PIN
// (Project Settings → Script properties → PIN) and deploy as a web app.
// See README → "Recording payments from the app".

const TAB = 'Payments';            // Date | S/N | Name | Amount | Note
const MAX_WRONG = 10;              // wrong PINs allowed per 15 minutes

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (x) { return out({ ok: false, error: 'bad_request' }); }

  const pin = PropertiesService.getScriptProperties().getProperty('PIN');
  if (!pin) return out({ ok: false, error: 'no_pin_set' });

  const cache = CacheService.getScriptCache();
  const wrong = Number(cache.get('wrong') || 0);
  if (wrong >= MAX_WRONG) return out({ ok: false, error: 'locked' });
  if (String(d.pin || '') !== pin) {
    cache.put('wrong', String(wrong + 1), 900);
    return out({ ok: false, error: 'wrong_pin' });
  }

  const sn = Math.round(Number(d.sn));
  const amount = Math.round(Number(d.amount));
  const date = String(d.date || '');
  if (!(sn >= 1 && sn <= 9999)) return out({ ok: false, error: 'bad_sn' });
  if (!(amount > 0 && amount <= 1000000)) return out({ ok: false, error: 'bad_amount' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return out({ ok: false, error: 'bad_date' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB);
    if (!sh) return out({ ok: false, error: 'no_tab' });
    sh.appendRow([date, sn, text(d.name, 80), amount, text(d.note, 120)]);
    return out({ ok: true, row: sh.getLastRow() });
  } finally {
    lock.releaseLock();
  }
}

// Plain text only: a leading = + - @ would make the cell a formula.
function text(v, max) {
  const s = String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
