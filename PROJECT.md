PC 組裝規格與預算計算器 — 部署與使用說明

目標：建立一個前端（純 HTML + 原生 JS）與後端（Google Apps Script）的最小專案。

檔案說明
- index.html：前端頁面（下拉選單、計算與儲存按鈕）。
- app.js：前端邏輯，計算總價與功耗，使用 `fetch()` POST 到 GAS Web App。
- google-sheets-app-script.gs：GAS 程式，接收 `doPost(e)`，把資料寫入 Google 試算表。

步驟 1 — 建立 Google 試算表
1. 到 Google Sheets 建立一份試算表。記下試算表的 ID（位於網址：https://docs.google.com/spreadsheets/d/<<SPREADSHEET_ID>>/）。
2. 建議在第一列放標頭（若不放，GAS 腳本會在第一筆資料時自動建立標頭）。

步驟 2 — 建立 Google Apps Script 專案並部署為 Web App
1. 開啟 https://script.google.com/，點「新專案」。
2. 將 `google-sheets-app-script.gs` 的內容貼到 Code.gs（或覆寫現有檔案）。
3. 修改 `spreadsheetId`（在檔案中註記為 'YOUR_SPREADSHEET_ID'）為你在步驟1 的試算表 ID。
4. 存檔，點選「部署」→「新建部署」→ 選擇「網路應用程式（Web app）」。
   - 執行應用程式的身分：選「我（你的帳號）」
   - 允許存取：選「任何人，包括匿名使用者」(若你不想對外開放，可選 Google 帳號範圍，但為簡單教學請選任何人)
5. 部署後，複製 Web 應用程式的 URL（以 https://script.google.com/macros/s/.../exec 開頭）。

安全提醒：此示範為教學目的，選擇「任何人」會讓任何有 URL 的人能夠呼叫。請避免在公開網站中接受敏感資料。

步驟 3 — 設定前端（本專案）
1. 打開 `app.js`，將最上方的 `GOOGLE_SHEETS_SCRIPT_URL` 設為你部署後的 Web App URL（字串格式）。
   例如：
   const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/XXXXX/exec';
2. 將專案 push 到 GitHub （下方為範例命令）：

```bash
git add .
git commit -m "PC builder minimal"
git push origin main
```

步驟 4 — 啟用 GitHub Pages（發佈前端）
1. 到 GitHub repository 設定頁面 → Pages。
2. 選擇來源分支（例如 `main`）與資料夾（`/ (root)`），按儲存。
3. 幾分鐘後，你會取得 GitHub Pages 網址：`https://<你的帳號>.github.io/<repo>/`。
4. 這個網址會載入 `index.html`，使用者可以在頁面上操作並點選「儲存到 Google 試算表」把資料送到 GAS。

如何測試
1. 本機測試：直接用瀏覽器打開 `index.html`（部分瀏覽器會封鎖 local file 的 fetch 至外部，建議使用 GitHub Pages 或簡單 HTTP 伺服器，例如：`python -m http.server 8000`）。
2. 部署後測試：在瀏覽器打開你的 GitHub Pages 網址，選取零件，按「計算」，確認總價與功耗正確，按「儲存到 Google 試算表」並檢查試算表是否新增紀錄。

注意事項
- 不要放任何 API KEY；本專案不需要。
- GAS 的 `doPost(e)` 接收一個 JSON，並把 `pcBuild` 寫入試算表的欄位中。
- 如果在 GAS 部署時遇到權限要求，按提示授權你的帳號。

如需我幫你：
- 我可以把 `GOOGLE_SHEETS_SCRIPT_URL` 的值範例填回 `app.js`（你提供 Web App URL）。
- 我可以幫你把專案準備成可直接 commit 的狀態，或協助你部署 GAS（需你在瀏覽器操作授權）。

祝順利！
*** End Patch