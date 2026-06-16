// 最精簡的 PC 組裝計算器前端
const GOOGLE_SHEETS_SCRIPT_URL = ''; // 請填入你部署後的 GAS Web App URL

const data = {
  cpus: [
    { id: 'i5-12400', name: 'Intel i5-12400', price: 7000, tdp: 65 },
    { id: 'i7-12700', name: 'Intel i7-12700', price: 12000, tdp: 125 },
    { id: 'ryzen5-5600', name: 'AMD Ryzen 5 5600', price: 6500, tdp: 65 },
  ],
  gpus: [
    { id: 'gtx1660', name: 'NVIDIA GTX 1660', price: 8000, tdp: 120 },
    { id: 'rtx3060', name: 'NVIDIA RTX 3060', price: 15000, tdp: 170 },
    { id: 'rtx4070', name: 'NVIDIA RTX 4070', price: 32000, tdp: 200 },
  ],
  rams: [
    { id: '16gb', name: '16GB (2x8GB)', price: 2000, tdp: 5 },
    { id: '32gb', name: '32GB (2x16GB)', price: 3500, tdp: 5 },
  ],
  storages: [
    { id: 'ssd-500', name: 'SSD 500GB', price: 1500, tdp: 5 },
    { id: 'ssd-1tb', name: 'SSD 1TB', price: 2500, tdp: 5 },
  ],
  psus: [
    { id: '550w', name: '550W', price: 2000, watt: 550 },
    { id: '650w', name: '650W', price: 2600, watt: 650 },
    { id: '750w', name: '750W', price: 3300, watt: 750 },
  ],
};

function $(id) { return document.getElementById(id); }

function populate() {
  populateSelect('cpu-select', data.cpus);
  populateSelect('gpu-select', data.gpus);
  populateSelect('ram-select', data.rams);
  populateSelect('storage-select', data.storages);
  populateSelect('psu-select', data.psus, true);
}

function populateSelect(id, items, psu=false) {
  const sel = $(id);
  sel.innerHTML = items.map((it,i)=>`<option value="${i}">${it.name} - ${it.price} 元${psu?(' - '+it.watt+'W'):''}</option>`).join('');
}

function calculate() {
  const cpu = data.cpus[$('cpu-select').value];
  const gpu = data.gpus[$('gpu-select').value];
  const ram = data.rams[$('ram-select').value];
  const storage = data.storages[$('storage-select').value];
  const psu = data.psus[$('psu-select').value];

  const totalPrice = cpu.price + gpu.price + ram.price + storage.price + psu.price;
  const totalTdp = cpu.tdp + gpu.tdp + ram.tdp + storage.tdp + 50; // +50W for motherboard/others

  $('total-price').textContent = totalPrice;
  $('total-watt').textContent = totalTdp;

  const compatibilityEl = $('compatibility');
  if (psu.watt < totalTdp + 100) {
    compatibilityEl.textContent = `警告：建議 PSU 至少 ${totalTdp + 100}W，當前選擇 ${psu.watt}W 可能不足`;
  } else {
    compatibilityEl.textContent = '相容性良好';
  }

  return { cpu, gpu, ram, storage, psu, totalPrice, totalTdp };
}

async function saveToGSheets(build) {
  if (!GOOGLE_SHEETS_SCRIPT_URL) {
    alert('請先在 app.js 設定 GOOGLE_SHEETS_SCRIPT_URL');
    return;
  }

  try {
    const res = await fetch(GOOGLE_SHEETS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pcBuild: build }),
    });
    const j = await res.json();
    if (j.success) alert('已儲存到 Google 試算表');
    else alert('儲存失敗：' + (j.message || 'unknown'));
  } catch (e) {
    console.error(e); alert('儲存發生錯誤');
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  populate();
  $('calculate-btn').addEventListener('click', ()=> calculate());
  $('save-btn').addEventListener('click', ()=> {
    const build = calculate();
    saveToGSheets(build);
  });
});
