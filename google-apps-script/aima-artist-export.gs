function doGet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheets()[0];
  const rows = sheet.getDataRange().getDisplayValues();
  const publicColumns = rows.map((row) => row.slice(0, 11));
  const csv = publicColumns.map((row) => row.map(csvCell).join(",")).join("\n");
  return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.CSV);
}

function csvCell(value) {
  const text = String(value == null ? "" : value);
  return `"${text.replace(/"/g, '""')}"`;
}
