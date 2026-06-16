# 13

這個專案是簡單的背單字應用程式，包含學習卡片與單字管理功能。

## Google 試算表儲存

已經新增「保存到 Google 試算表」按鈕，使用方式：

1. 開啟 Google 試算表，建立一個新試算表。
2. 點選「擴充功能」>「Apps Script」，建立新的 Apps Script 專案。
3. 將 `google-sheets-app-script.gs` 的內容貼到 Apps Script 編輯器中。
4. 將 `YOUR_SPREADSHEET_ID` 替換為你的試算表 ID。
5. 部署為 Web App，存取權限設為「任何人，包括匿名使用者」。
6. 拷貝部署後的 Web App URL，貼到 `app.js` 中的 `GOOGLE_SHEETS_SCRIPT_URL`。
7. 回到應用程式，點擊「保存到 Google 試算表」即可將本地單字上傳。

## Google Apps Script 範例

已新增檔案：`google-sheets-app-script.gs`。

資料會儲存成以下欄位：
- 英文單字
- 翻譯
- 詞性
- 例句
- 字根分析
- 匯入時間

如果要直接匯入試算表，也可以先匯出 CSV，再手動匯入。

更多詳盡步驟請參考 `Google-Sheets-Word-Sync.md`。