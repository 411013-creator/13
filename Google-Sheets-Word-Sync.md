# Google 試算表單字同步操作說明

此文件說明如何建立後端 Google Apps Script，並將「管理者新增單字」的資料送到 Google 試算表。

## 目標

當管理者在管理頁面填寫欄位：
- 英文單字
- 中文翻譯
- 字根分析
- 例句
- 詞性

點擊「儲存單字」後，資料會：
1. 儲存在本機 localStorage
2. 透過 POST 請求傳送到 Google Apps Script Web App
3. 由 Apps Script 寫入指定的 Google 試算表

---

## 前端變更

### 1. `index.html`

- 將提交按鈕文字調整為 `儲存單字`
- 保留額外的 `保存到 Google 試算表` 按鈕，供手動同步使用

相關區塊：
```html
<div class="manage-actions">
  <button type="submit" class="submit-btn">儲存單字</button>
  <button type="button" id="save-gsheet-btn" class="submit-btn secondary">保存到 Google 試算表</button>
</div>
```

### 2. `app.js`

- `handleAddWord()` 會在表單提交後：
  - 檢查資料
  - 存入 `appState.words`
  - 儲存到 localStorage
  - 重置表單
  - 如果已設定 `GOOGLE_SHEETS_SCRIPT_URL`，則呼叫 `saveWordToGoogleSheets(word)` 同步後端

- 新增 `saveWordToGoogleSheets(word)`：
  - 使用 `fetch()` 將單字資料 POST 到 Google Apps Script
  - 如果成功，顯示「單字已同步到 Google 試算表」
  - 失敗時顯示錯誤通知

- 保留 `handleSaveToGoogleSheets()`：
  - 手動送出所有本機單字到後端

- `GOOGLE_SHEETS_SCRIPT_URL` 常數位置：
  - 填入部署後的 Apps Script Web App URL

---

## 後端 Google Apps Script

### 1. 建立 Apps Script 專案

1. 開啟 Google 試算表
2. 選擇「擴充功能」>「Apps Script」
3. 建立新專案

### 2. 貼上程式碼

在 Apps Script 編輯器中建立檔案（例如 `Code.gs`），貼上以下內容：

```javascript
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

  var words = [];

  if (Array.isArray(payload.words)) {
    words = payload.words;
  } else if (payload.word) {
    words = [payload.word];
  }

  if (words.length === 0) {
    return createJsonResponse({success: false, message: 'Payload must contain a non-empty word or words array.'});
  }

  var spreadsheetId = 'YOUR_SPREADSHEET_ID';
  var sheetName = '工作表1';
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    return createJsonResponse({success: false, message: 'Sheet not found: ' + sheetName});
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

  return createJsonResponse({success: true, message: '已新增 ' + rows.length + ' 筆單字。'});
}

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 3. 設定試算表 ID

- 將 `YOUR_SPREADSHEET_ID` 換成自己的試算表 ID。
- 試算表 ID 可從網址列中取得：
  - `https://docs.google.com/spreadsheets/d/你的試算表ID/edit`

### 4. 建立工作表

- 預設工作表名稱為 `工作表1`
- 若想改名，請同時修改 `sheetName` 變數

### 5. 部署 Web App

1. 選擇「部署」>「新增部署」
2. 選擇 `Web 應用程式`
3. 設定：
   - 執行應用程式的人：`自己` 或 `Me`
   - 存取權限：`任何人，包括匿名使用者`
4. 點選「部署」，取得 Web App URL

### 6. 更新前端 `app.js`

- 把 `GOOGLE_SHEETS_SCRIPT_URL` 設定為部署後的 Web App URL，例如：

```js
const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/xxxxx/exec';
```

---

## 操作流程

1. 管理者打開管理頁面
2. 在表單填入：英文單字、中文翻譯、詞性、例句、字根分析
3. 點擊 `儲存單字`
4. 前端會先保存到本機 localStorage
5. 前端再將資料 POST 到 Google Apps Script
6. Apps Script 會將資料寫入 Google 試算表

---

## 資料欄位說明

Google 試算表欄位順序：
1. 英文單字
2. 中文翻譯
3. 詞性
4. 例句
5. 字根分析
6. 匯入時間

---

## 檔案清單

- `index.html`：管理頁面表單與按鈕
- `app.js`：前端資料驗證、localStorage、後端同步
- `google-sheets-app-script.gs`：Google Apps Script 後端程式
- `Google-Sheets-Word-Sync.md`：本文件

---

## 注意事項

- 若要讓前端能成功寫入試算表，請務必設定 `GOOGLE_SHEETS_SCRIPT_URL`。
- 若 Web App 合法存取權限設定不正確，前端請求會失敗。
- 若要保護試算表私密性，可以改為採用 OAuth 或僅允許特定帳號訪問，但此專案範例使用公開 Web App 以簡化流程。