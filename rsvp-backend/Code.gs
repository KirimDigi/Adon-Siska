/**
 * KirimDigi - Backend RSVP & Ucapan (Google Apps Script)
 * ------------------------------------------------------------------
 * Spreadsheet : https://docs.google.com/spreadsheets/d/1JcK0Fdz2qfS9baxn3sKrW5KdnHYcFM4JSbOzQ7xCjEw/edit
 * Sheet       : Sheet1
 * Kolom       : 1) Timestamp  2) Nama Tamu  3) Ucapan
 *               4) Konfirmasi Kehadiran  5) Jumlah Tamu
 * ------------------------------------------------------------------
 * CARA PAKAI (sekali saja):
 *   1. Buka https://docs.google.com/spreadsheets/d/1JcK0Fdz2qfS9baxn3sKrW5KdnHYcFM4JSbOzQ7xCjEw/edit
 *   2. Menu: Extensions > Apps Script
 *   3. Hapus isi Code.gs yang ada, tempel seluruh file ini, lalu Save.
 *   4. Deploy > New deployment > "Web app"
 *        - Execute as       : Me
 *        - Who has access   : Anyone
 *      Deploy -> Authorize (izinkan akses Spreadsheet).
 *   5. Copy URL yang berakhiran "/exec"
 *   6. Tempelkan ke index.html pada baris:
 *        <script id="kd-rsvp-config">
 *        window.KD_RSVP = { url: "", timeout: 12000 };
 *        ...
 *      menjadi  window.KD_RSVP = { url: "URL_ANDA/exec", timeout: 12000 };
 * ------------------------------------------------------------------
 */

var SHEET_ID = '1JcK0Fdz2qfS9baxn3sKrW5KdnHYcFM4JSbOzQ7xCjEw';
var SHEET_NAME = 'Sheet1';
var HEADERS = ['Timestamp', 'Nama Tamu', 'Ucapan', 'Konfirmasi Kehadiran', 'Jumlah Tamu'];
var MAX_LIST = 500;       // maksimal ucapan yang dikirim ke halaman
var DEDUP_SECONDS = 45;   // cegah dobel submit dari orang yang sama

function sheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 150);
    sh.setColumnWidth(2, 170);
    sh.setColumnWidth(3, 420);
    sh.setColumnWidth(4, 170);
    sh.setColumnWidth(5, 100);
  }
  return sh;
}

function clean_(v, max) {
  v = (v == null ? '' : String(v)).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  if (max && v.length > max) v = v.substring(0, max);
  return v;
}

function json_(obj, callback) {
  var body = callback ? callback + '(' + JSON.stringify(obj) + ')' : JSON.stringify(obj);
  return ContentService.createTextOutput(body)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  var cb = p.callback ? clean_(p.callback, 60).replace(/[^\w.$]/g, '') : '';
  var action = p.action || 'list';
  var out;
  try {
    out = (action === 'setup')
      ? { ok: true, sheetId: SHEET_ID, sheetName: SHEET_NAME, sheetUrl: 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit' }
      : list_();
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return json_(out, cb);
}

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};
    if (e && e.postData && e.postData.contents) {
      var raw = e.postData.contents;
      if (raw.charAt(0) === '{') {
        try {
          var j = JSON.parse(raw);
          for (var k in j) if (j.hasOwnProperty(k)) p[k] = j[k];
        } catch (x) { }
      }
    }
    var name = clean_(p.author || p.name, 60);
    var attend = clean_(p.attendance, 20);
    var guest = clean_(p.guest, 5);
    var text = clean_(p.comment || p.message, 1000);

    if (!name) return json_({ ok: false, error: 'Nama wajib diisi.' });
    if (text.length < 2) return json_({ ok: false, error: 'Ucapan minimal 2 karakter.' });

    var labels = { 'present': 'Hadir', 'notpresent': 'Tidak Hadir', 'notsure': 'Masih Ragu' };
    var attendLabel = labels[attend] || attend;

    var cache = CacheService.getScriptCache();
    var key = 'kd_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5, (name + '|' + text).toLowerCase())).slice(0, 32);
    if (cache.get(key)) return json_({ ok: false, error: 'Ucapan ini baru saja terkirim.' });
    cache.put(key, '1', DEDUP_SECONDS);

    var now = new Date();
    // Kolom: 1 Timestamp | 2 Nama Tamu | 3 Ucapan | 4 Konfirmasi Kehadiran | 5 Jumlah Tamu
    sheet_().appendRow([
      now,
      name,
      text,
      attendLabel,
      (attend === 'present' ? guest : '')
    ]);

    return json_({
      ok: true, name: name, attendance: attendLabel, guest: guest, comment: text,
      time: Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd MMM yyyy HH:mm')
    });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doOptions(e) {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function list_() {
  var sh = sheet_();
  var last = sh.getLastRow();
  var out = { ok: true, count: 0, comments: [] };
  if (last < 2) return out;
  var n = Math.min(last - 1, MAX_LIST);
  var start = last - n + 1;
  var rows = sh.getRange(start, 1, n, 5).getValues();
  var tz = Session.getScriptTimeZone();
  for (var i = rows.length - 1; i >= 0; i--) {
    var r = rows[i];
    var name = clean_(r[1]);
    var text = clean_(r[2]);
    if (!name && !text) continue;
    out.comments.push({
      name: name,
      comment: text,
      attendance: clean_(r[3]),
      guest: clean_(r[4]),
      time: (r[0] instanceof Date) ? Utilities.formatDate(r[0], tz, 'dd MMM yyyy HH:mm') : clean_(r[0])
    });
  }
  out.count = out.comments.length;
  return out;
}

/** Jalankan manual sekali dari editor untuk mengecek ID & URL. */
function info() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  Logger.log('Spreadsheet : ' + ss.getUrl());
  Logger.log('Sheet       : ' + SHEET_NAME + ' (baris: ' + ss.getSheetByName(SHEET_NAME).getLastRow() + ')');
  Logger.log('WebApp URL  : ' + ScriptApp.getService().getUrl());
  return { sheetUrl: ss.getUrl(), webAppUrl: ScriptApp.getService().getUrl() };
}
