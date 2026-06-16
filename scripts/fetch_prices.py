#!/usr/bin/env python3
"""
簡易抓取原價屋 (coolpc) 價格的腳本（best-effort）

使用方式（在你本機執行）：
1. 建議建立 virtualenv，安裝依賴： pip install -r requirements.txt
2. 執行： python scripts/fetch_prices.py

腳本會對每個型號嘗試搜尋頁面並解析價格，最後把結果寫入 data/prices.json
並印出如何把價格同步回 `app.js` 的建議步驟。

注意：網站可能對機器人或遠端容器封鎖；若抓不到，請改用你自己的瀏覽器開發者工具抓價格。
"""
import re
import json
import time
from pathlib import Path
import requests
from bs4 import BeautifulSoup

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                  'AppleWebKit/537.36 (KHTML, like Gecko) '
                  'Chrome/115.0 Safari/537.36'
}

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data'
OUT.mkdir(exist_ok=True)

# keyword map: key -> search keyword on coolpc
KEYWORDS = {
    'i5-12400': 'Intel i5-12400',
    'i7-12700': 'Intel i7-12700',
    'i9-12900': 'Intel i9-12900',
    'ryzen5-5600': 'AMD Ryzen 5 5600',
    'ryzen7-5800x': 'AMD Ryzen 7 5800X',
    'gtx1660': 'GTX 1660',
    'rtx3060': 'RTX 3060',
    'rtx4060': 'RTX 4060',
    'rtx4070': 'RTX 4070',
    'rx6600': 'RX 6600',
    '16gb': '16GB DDR4',
    '32gb': '32GB DDR4',
    'ssd-500': 'SSD 500GB',
    'ssd-1tb': 'SSD 1TB',
    'ssd-2tb': 'SSD 2TB',
    '550w': '550W PSU',
    '650w': '650W PSU',
    '750w': '750W PSU',
    '850w': '850W PSU',
}

SEARCH_URLS = [
    'https://www.coolpc.com.tw/search.php?keyword={q}',
    'https://www.coolpc.com.tw/products_search.php?keyword={q}',
    'https://www.coolpc.com.tw/products.php?keyword={q}',
]

PRICE_RE = re.compile(r'([\d,]{3,})')

def extract_price_from_text(text):
    # 找到第一個看起來像數字的群組
    m = PRICE_RE.search(text.replace('NT$', '').replace('$', ''))
    if not m:
        return None
    return int(m.group(1).replace(',', ''))

def fetch_price_for_keyword(keyword):
    for url_t in SEARCH_URLS:
        url = url_t.format(q=requests.utils.requote_uri(keyword))
        try:
            r = requests.get(url, headers=HEADERS, timeout=10)
        except Exception:
            # network error, try next
            continue
        if r.status_code != 200:
            continue
        soup = BeautifulSoup(r.text, 'html.parser')
        # heuristics: look for elements that contain 元 or NT$
        candidates = soup.find_all(text=re.compile(r'元|NT\$|\$'))
        for c in candidates:
            txt = c.strip()
            price = extract_price_from_text(txt)
            if price and price > 100:  # ignore tiny numbers
                return price
        # fallback: find numbers in whole text
        whole = soup.get_text(separator=' ')
        price = extract_price_from_text(whole)
        if price and price > 100:
            return price
    return None

def main():
    results = {}
    for key, kw in KEYWORDS.items():
        print(f'Fetching price for {key} ({kw})...')
        price = fetch_price_for_keyword(kw)
        if price:
            print(f'  -> {price} NT$')
            results[key] = price
        else:
            print('  -> not found')
        time.sleep(1)

    out_file = OUT / 'prices.json'
    with out_file.open('w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print('\nDone. prices written to:', out_file)
    print('If the script failed to fetch some prices, try running it locally in your browser network environment.')
    print('\nTo apply prices to `app.js`, open `data/prices.json` and update the `data` object manually or send me the file and I can patch `app.js` for you.')

if __name__ == '__main__':
    main()
