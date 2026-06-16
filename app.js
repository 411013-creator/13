// 最精簡的 PC 組裝計算器前端
const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxMNRBdcI-LzZKa0z62_hefd_mdaE0VsF0sAvMRkDWNkjMnd1LLANv_eVdweeAtwyETkQ/exec';

const data = {
  cpus: [
    { id: 'i5-12400', name: 'Intel i5-12400', price: 5500, tdp: 65 },
    { id: 'i7-12700', name: 'Intel i7-12700', price: 11000, tdp: 125 },
    { id: 'i9-12900', name: 'Intel i9-12900', price: 18500, tdp: 125 },
    { id: 'ryzen5-5600', name: 'AMD Ryzen 5 5600', price: 5000, tdp: 65 },
    { id: 'ryzen7-5800x', name: 'AMD Ryzen 7 5800X', price: 12000, tdp: 105 },
  ],
  gpus: [
    { id: 'gtx1660', name: 'NVIDIA GTX 1660', price: 6500, tdp: 120, pcie: 1 },
    { id: 'rtx3060', name: 'NVIDIA RTX 3060', price: 12000, tdp: 170, pcie: 1 },
    { id: 'rtx4060', name: 'NVIDIA RTX 4060', price: 17000, tdp: 160, pcie: 1 },
    { id: 'rtx4070', name: 'NVIDIA RTX 4070', price: 26000, tdp: 200, pcie: 1 },
    { id: 'rx6600', name: 'AMD RX 6600', price: 8000, tdp: 132, pcie: 1 },
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
    { id: '450w', name: '450W', price: 1400, watt: 450, pcie_connectors: 1 },
    { id: '500w', name: '500W', price: 1500, watt: 500, pcie_connectors: 2 },
    { id: '550w', name: '550W', price: 1600, watt: 550, pcie_connectors: 2 },
    { id: '650w', name: '650W', price: 2200, watt: 650, pcie_connectors: 3 },
    { id: '750w', name: '750W', price: 3000, watt: 750, pcie_connectors: 4 },
    { id: '850w', name: '850W', price: 3800, watt: 850, pcie_connectors: 4 },
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
  // required watt: add buffer and consider 20% headroom
  const requiredWatt = Math.round(totalTdp * 1.2 + 50);

  // watt score (70%)
  let wattRatio = psu.watt / requiredWatt;
  let wattScore = Math.max(0, Math.min(1, wattRatio));

  // connector score (25%)
  const connectorNeeded = gpu.pcie || 1; // default 1
  const connectorHave = psu.pcie_connectors || 0;
  let connectorScore = connectorHave >= connectorNeeded ? 1 : (connectorHave / connectorNeeded);

  // small bonus for extra headroom (5%)
  let headroomScore = Math.max(0, Math.min(1, (psu.watt - requiredWatt) / requiredWatt + 0.5));

  const percent = Math.round((wattScore * 0.7 + connectorScore * 0.25 + headroomScore * 0.05) * 100);

  const compatibilityEl = $('compatibility');
  compatibilityEl.textContent = `相容性：${percent}%（建議 PSU 約 ${requiredWatt}W；接頭：${connectorNeeded}，PSU 提供 ${connectorHave}）`;
  if (percent >= 90) compatibilityEl.style.color = 'green';
  else if (percent >= 70) compatibilityEl.style.color = 'orange';
  else compatibilityEl.style.color = '#b00';

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
