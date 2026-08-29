/**
 * Nazmo.AI waitlist receiver.
 *
 * Paste this into the Apps Script project bound to the signup sheet, then
 * deploy it as a web app. Setup instructions are in DEPLOY.md.
 *
 * The endpoint is public, so every check the website performs is repeated here.
 * Client-side validation is trivially bypassed; this is the one that counts.
 */

/** Sheet tab the rows are appended to. Created on first run if missing. */
var SHEET_NAME = 'Waitlist'

/** Must match MIN_DWELL_MS in src/lib/waitlist.ts. */
var MIN_DWELL_MS = 2500

var HEADERS = ['Timestamp', 'Email', 'Name', 'Company', 'Use case', 'Source']

function doPost(e) {
  try {
    var params = (e && e.parameter) || {}

    // Honeypot: hidden on the real form, so anything here is a bot.
    if (String(params.website || '').trim() !== '') {
      return json({ ok: true })
    }

    var dwell = Number(params.dwellMs || 0)
    if (!isFinite(dwell) || dwell < MIN_DWELL_MS) {
      return json({ ok: false, error: 'too_fast' })
    }

    var email = String(params.email || '').trim()
    if (!isValidEmail(email)) {
      return json({ ok: false, error: 'invalid_email' })
    }

    var sheet = getSheet()
    if (isDuplicate(sheet, email)) {
      return json({ ok: true, duplicate: true })
    }

    sheet.appendRow([
      new Date(),
      email,
      String(params.name || '').trim().slice(0, 200),
      String(params.company || '').trim().slice(0, 200),
      String(params.useCase || '').trim().slice(0, 200),
      'website',
    ])

    return json({ ok: true })
  } catch (err) {
    return json({ ok: false, error: String(err) })
  }
}

/** Browsers preflight some requests; answer them rather than 405. */
function doGet() {
  return json({ ok: true, service: 'nazmo-waitlist' })
}

function getSheet() {
  var book = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = book.getSheetByName(SHEET_NAME)

  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME)
    sheet.appendRow(HEADERS)
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold')
    sheet.setFrozenRows(1)
  }
  return sheet
}

function isDuplicate(sheet, email) {
  var lastRow = sheet.getLastRow()
  if (lastRow < 2) return false

  var existing = sheet.getRange(2, 2, lastRow - 1, 1).getValues()
  var needle = email.toLowerCase()
  for (var i = 0; i < existing.length; i++) {
    if (String(existing[i][0]).trim().toLowerCase() === needle) return true
  }
  return false
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  )
}
