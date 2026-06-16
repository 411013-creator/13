// 最精簡的 PC 組裝計算器前端
const GOOGLE_SHEETS_SCRIPT_URL = ''; // 請填入你部署後的 GAS Web App URL

const data = {
  cpus: [
    { id: 'i5-12400', name: 'Intel i5-12400', price: 5500, tdp: 65 },
    { id: 'i7-12700', name: 'Intel i7-12700', price: 11000, tdp: 125 },
    { id: 'i9-12900', name: 'Intel i9-12900', price: 18500, tdp: 125 },
    { id: 'ryzen5-5600', name: 'AMD Ryzen 5 5600', price: 5000, tdp: 65 },
    { id: 'ryzen7-5800x', name: 'AMD Ryzen 7 5800X', price: 12000, tdp: 105 },
  ],
  gpus: [
    { id: 'gtx1660', name: 'NVIDIA GTX 1660', price: 6000, tdp: 120 },
    { id: 'rtx3060', name: 'NVIDIA RTX 3060', price: 14000, tdp: 170 },
    { id: 'rtx4060', name: 'NVIDIA RTX 4060', price: 18000, tdp: 160 },
    { id: 'rtx4070', name: 'NVIDIA RTX 4070', price: 30000, tdp: 200 },
    { id: 'rx6600', name: 'AMD RX 6600', price: 9000, tdp: 132 },
  ],
  rams: [
    { id: '16gb', name: '16GB (2x8GB)', price: 1200, tdp: 5 },
    { id: '32gb', name: '32GB (2x16GB)', price: 2600, tdp: 5 },
  ],
  storages: [
    { id: 'ssd-500', name: 'SSD 500GB', price: 1200, tdp: 5 },
    { id: 'ssd-1tb', name: 'SSD 1TB', price: 2000, tdp: 5 },
    { id: 'ssd-2tb', name: 'SSD 2TB', price: 3600, tdp: 6 },
  ],
  psus: [
    { id: '550w', name: '550W', price: 1800, watt: 550 },
    { id: '650w', name: '650W', price: 2400, watt: 650 },
    { id: '750w', name: '750W', price: 3200, watt: 750 },
    { id: '850w', name: '850W', price: 4200, watt: 850 },
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
  // keep first placeholder option if present
  const placeholder = sel.querySelector('option[value=""]') ? '<option value="">' + sel.querySelector('option[value=""]').textContent + '</option>' : '';
  sel.innerHTML = placeholder + items.map((it,i)=>`<option value="${i}">${it.name} - ${it.price} 元${psu?(' - '+it.watt+'W'):''}</option>`).join('');
}

function calculate() {
  const selCpu = $('cpu-select').value;
  const selGpu = $('gpu-select').value;
  const selRam = $('ram-select').value;
  const selStorage = $('storage-select').value;
  const selPsu = $('psu-select').value;

  if (!selCpu || !selGpu || !selRam || !selStorage || !selPsu) {
    alert('請完整選擇所有零件選項');
    return null;
  }

  const cpu = data.cpus[Number(selCpu)];
  const gpu = data.gpus[Number(selGpu)];
  const ram = data.rams[Number(selRam)];
  const storage = data.storages[Number(selStorage)];
  const psu = data.psus[Number(selPsu)];

  const totalPrice = cpu.price + gpu.price + ram.price + storage.price + psu.price;
  const totalTdp = cpu.tdp + gpu.tdp + ram.tdp + storage.tdp + 60; // +60W for motherboard/others

  $('total-price').textContent = totalPrice;
  $('total-watt').textContent = totalTdp;

  // compatibility percent: based on PSU watt vs required (totalTdp + headroom 100W)
  const requiredWatt = totalTdp + 100;
  let percent = Math.round((psu.watt / requiredWatt) * 100);
  if (percent > 100) percent = 100;
  if (percent < 0) percent = 0;

  const compatibilityEl = $('compatibility');
  compatibilityEl.textContent = `相容性：${percent}%（建議 PSU 至少 ${requiredWatt}W）`;
  // color coding
  if (percent >= 90) {
    compatibilityEl.style.color = 'green';
  } else if (percent >= 70) {
    compatibilityEl.style.color = 'orange';
  } else {
    compatibilityEl.style.color = '#b00';
  }

  return { cpu, gpu, ram, storage, psu, totalPrice, totalTdp, percent, requiredWatt };
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
