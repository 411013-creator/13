function doGet(e) {
  return createJsonResponse({success: true, message: 'ready'});
}

function doPost(e) {
  if (!e.postData || !e.postData.contents) {
    return createJsonResponse({success: false, message: 'No payload provided.'});
  }

  var payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return createJsonResponse({success: false, message: 'JSON parse error: ' + err.message});
  }

  // 支援接收 pcBuild 物件，或舊有 words/word 結構
  var pcBuild = payload.pcBuild || null;

  var spreadsheetId = 'YOUR_SPREADSHEET_ID'; // <-- 請改成你的 Spreadsheet ID
  var sheetName = '工作表1';
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    return createJsonResponse({success: false, message: 'Sheet not found: ' + sheetName});
  }

  // 如果是 pcBuild，就寫入固定欄位
  if (pcBuild) {
    // 如果是空表，先寫入標頭
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp','CPU','GPU','RAM','Storage','PSU','TotalPrice','TotalWatt','RawJSON']);
    }

    var row = [
      new Date(),
      pcBuild.cpu.name || '',
      pcBuild.gpu.name || '',
      pcBuild.ram.name || '',
      pcBuild.storage.name || '',
      pcBuild.psu.name || '',
      pcBuild.totalPrice || '',
      pcBuild.totalTdp || '',
      JSON.stringify(pcBuild)
    ];

    sheet.appendRow(row);
    return createJsonResponse({success: true, message: '已新增 1 筆 PC 組裝紀錄。'});
  }

  // 其他舊格式備援
  var words = [];
  if (Array.isArray(payload.words)) {
    words = payload.words;
  } else if (payload.word) {
    words = [payload.word];
  }
  if (words.length === 0) {
    return createJsonResponse({success: false, message: 'Payload must contain pcBuild or words/word.'});
  }

  var rows = words.map(function(word) {
    return [
      word.word || '',
      word.translation || '',
      word.partOfSpeech || '',
      word.example || '',
      word.etymology || '',
      new Date(),
    ];
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  return createJsonResponse({success: true, message: '已新增 ' + rows.length + ' 筆資料。'});
}

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
