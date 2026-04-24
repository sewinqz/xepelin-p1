import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { google } from 'googleapis'

initializeApp()

const SPREADSHEET_ID = process.env.SPREADSHEET_ID!
const SHEET_NAME = process.env.SHEET_NAME ?? 'Sheet1'
const ZAPIER_URL = process.env.ZAPIER_WEBHOOK_URL!

async function getSheetsClient() {
  const privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY_B64!, 'base64').toString('utf-8')
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth: await auth.getClient() as any })
}

export interface Operation {
  idOp: number
  tasa: number
}

// Returns the full list of operations from the sheet
export const getOperations = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')

  const sheets = await getSheetsClient()
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:B`,
  })

  const rows = data.values ?? []
  const operations: Operation[] = rows.slice(1).map((row) => ({
    idOp: Number(row[0]),
    tasa: Number(row[1]),
  }))

  return { operations }
})

// Updates the tasa for a given idOp in the sheet, then notifies via Zapier.
export const updateTasa = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')

  const { idOp, tasa } = request.data as { idOp: number; tasa: number }
  if (typeof idOp !== 'number' || typeof tasa !== 'number') {
    throw new HttpsError('invalid-argument', 'idOp and tasa must be numbers')
  }

  const sheets = await getSheetsClient()

  // Find the row for this idOp and read idOp, tasa, email columns
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:C`,
  })
  const rows = data.values ?? []
  const rowIndex = rows.findIndex((row, i) => i > 0 && Number(row[0]) === idOp)
  if (rowIndex === -1) throw new HttpsError('not-found', `Operation ${idOp} not found`)

  const email = rows[rowIndex][2] as string

  // Write new tasa to column B of that row (rowIndex is 0-based, Sheets is 1-based)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!B${rowIndex + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[tasa]] },
  })
  await fetch(ZAPIER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idOp, tasa, email }),
  })

  return { success: true }
})
