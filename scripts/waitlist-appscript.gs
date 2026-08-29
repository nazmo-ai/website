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

var HEADERS = [
  'Timestamp',
  'Name',
  'Company',
  'Role',
  'Job location',
  'Email',
  'Phone',
  'Source',
]

/** Fields the website marks required. Phone is deliberately not among them. */
var REQUIRED = ['name', 'company', 'role', 'location', 'email']

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

    for (var i = 0; i < REQUIRED.length; i++) {
      if (clean(params[REQUIRED[i]]) === '') {
        return json({ ok: false, error: 'missing_' + REQUIRED[i] })
      }
    }

    var email = clean(params.email)
    if (!isValidEmail(email)) {
      return json({ ok: false, error: 'invalid_email' })
    }

    var phone = clean(params.phone)
    if (phone !== '' && !isValidPhone(phone)) {
      return json({ ok: false, error: 'invalid_phone' })
    }

    var sheet = getSheet()
    if (isDuplicate(sheet, email)) {
      return json({ ok: true, duplicate: true })
    }

    sheet.appendRow([
      new Date(),
      clean(params.name),
      clean(params.company),
      clean(params.role),
      clean(params.location),
      email,
      phone,
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

/** Email lives in column 6; keep this in step with HEADERS. */
var EMAIL_COLUMN = 6

function isDuplicate(sheet, email) {
  var lastRow = sheet.getLastRow()
  if (lastRow < 2) return false

  var existing = sheet.getRange(2, EMAIL_COLUMN, lastRow - 1, 1).getValues()
  var needle = email.toLowerCase()
  for (var i = 0; i < existing.length; i++) {
    if (String(existing[i][0]).trim().toLowerCase() === needle) return true
  }
  return false
}

function clean(value) {
  return String(value || '').trim().slice(0, 200)
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254
}

/** Permissive on formatting, strict only on digit count. */
function isValidPhone(phone) {
  if (!/^[\d\s+()./-]+$/.test(phone)) return false
  var digits = phone.replace(/\D/g, '').length
  return digits >= 7 && digits <= 15
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  )
}
