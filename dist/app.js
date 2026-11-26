const el=id=>document.getElementById(id);

let tasks=[];
try { const saved=JSON.parse(localStorage.getItem('ruang.tasks') || '[]'); if(Array.isArray(saved)) tasks=saved.filter(t=>typeof t?.name==='string' && typeof t.done==='boolean'); } catch {}
function save(){try{localStorage.setItem('ruang.tasks',JSON.stringify(tasks));}catch{el('error').textContent='Penyimpanan perangkat tidak tersedia.';}}
function render(){
  for(const button of document.querySelectorAll('[data-program]')){
    const saved=tasks.some(t=>t.program===button.dataset.program);
    button.disabled=saved;button.textContent=saved?'Tersimpan':'Simpan tugas';
  }
  const done=tasks.filter(t=>t.done).length;
  const filter=el('filter').value;
  const visible=tasks.filter(t=>filter==='all'||(filter==='done')===t.done);
  el('empty').hidden=visible.length>0;
  el('empty').textContent=tasks.length?'Tidak ada tugas dengan status ini.':'Tugas yang kamu tambahkan akan muncul di sini.';
  el('export').disabled=!tasks.length;
  el('count').textContent=tasks.length ? done+' dari '+tasks.length+' selesai' : 'Belum ada tugas';
  el('meter').max=tasks.length||1;
  el('meter').value=done;
  el('list').replaceChildren();
  visible.forEach(t=>{
    const li=document.createElement('li'), label=document.createElement('label'), box=document.createElement('input');
    box.type='checkbox'; box.checked=t.done;
    box.onchange=()=>{t.done=box.checked;save();render();};
    label.append(box,document.createTextNode(t.name));
    const edit=document.createElement('button');
    edit.type='button'; edit.textContent='Edit'; edit.setAttribute('aria-label','Edit '+t.name);
    edit.onclick=()=>openEditor('task',t);
    li.append(label,edit);
    if(t.due){
      const date=document.createElement('small');
      date.textContent='Tenggat '+t.due.split('-').reverse().join('/');
      li.append(date);
    }
    el('list').append(li);
  });
}
function today(){
  const now=new Date();
  return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
}
const stages=['Tentukan masalah dan pengguna','Bangun prototipe utama','Uji dan rekam demo','Kirim proyek'];
function planTasks(project,start,end){
  const startTime=Date.parse(start+'T00:00:00Z');
  const days=(Date.parse(end+'T00:00:00Z')-startTime)/86400000;
  return stages.map((stage,index)=>({
    name:project+' · '+stage,done:false,
    due:new Date(startTime+Math.floor(days*index/(stages.length-1))*86400000).toISOString().slice(0,10)
  }));
}
let editing=null, planning=false;
function openEditor(mode,task=null){
  planning=mode==='plan'; editing=task;
  el('dialog-title').textContent=planning?'Rencanakan hackathon':task?'Edit tugas':'Tambah tugas';
  el('name-label').textContent=planning?'Nama proyek':'Nama tugas';
  el('date-label').textContent=planning?'Tanggal pengumpulan':'Tenggat (opsional)';
  el('name').value=task?.name||''; el('date').value=task?.due||'';
  el('date').min=planning?today():''; el('date').required=planning;
  el('name').setCustomValidity('');el('plan-tip').hidden=!planning;
  el('apply').textContent=planning?'Buat jadwal':'Simpan';
  el('editor').showModal();el('name').focus();
}
el('name').oninput=()=>el('name').setCustomValidity('');
el('cancel').onclick=()=>el('editor').close();
el('details').onsubmit=e=>{
  e.preventDefault();
  const name=el('name').value.trim(),due=el('date').value;
  if(!name){el('name').setCustomValidity('Isi nama terlebih dahulu.');el('name').reportValidity();return;}
  if(planning){
    const plan=planTasks(name,today(),due);
    for(const item of plan) if(!tasks.some(t=>t.name===item.name&&t.due===item.due)) tasks.push(item);
    note('Asisten lokal','Jadwal '+name+' siap. Kamu bisa menyesuaikan tenggat tiap tahap di Tugas saya.');
  }else if(editing){Object.assign(editing,{name,due});}
  else{tasks.push({name,due,done:false});}
  save();el('filter').value='all';render();el('editor').close();
};
for(const button of document.querySelectorAll('[data-program]')){
  button.onclick=()=>{
    const program=button.dataset.program;
    if(tasks.some(t=>t.program===program)) return;
    tasks.push({name:'Pelajari '+program,program,done:false});
    el('filter').value='all';save();render();
  };
}
el('filter').onchange=render;
el('export').onclick=()=>{
  const lines=tasks.map(t=>(t.done?'[x] ':'[ ] ')+t.name+(t.due?' | '+t.due:''));
  const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='tugas-ruang-agen.txt';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
};
function note(role,content){
  const a=document.createElement('article'),title=document.createElement('strong');
  title.textContent=role;a.append(title,document.createTextNode(content));el('log').append(a);return a;
}
function draft(value){el('msg').value=value;el('msg').focus();}
el('add').onclick=()=>openEditor('task');
el('suggest').onclick=()=>openEditor('plan');
function taskReport(items,day,summary){
  if(!items.length) return 'Daftar tugas masih kosong. Tambahkan tugas atau buat rencana hackathon terlebih dahulu.';
  const pending=items.filter(t=>!t.done).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
  const completed=items.filter(t=>t.done);
  const format=t=>t.name+(t.due?' ('+t.due.split('-').reverse().join('/')+')':'');
  const lines=list=>list.map(t=>'• '+format(t)).join('\n');
  if(summary){
    const parts=['Progres proyek — '+completed.length+' dari '+items.length+' tugas selesai.'];
    if(completed.length) parts.push('Selesai\n'+lines(completed));
    if(pending.length) parts.push('Berikutnya\n'+lines(pending.slice(0,3)));
    const overdue=pending.filter(t=>t.due&&t.due<day).length;
    if(overdue) parts.push(overdue+' tugas melewati tenggat.');
    return parts.join('\n\n');
  }
  if(!pending.length) return 'Semua tugas sudah selesai. Agenda kamu kosong.';
  const groups=[
    ['Melewati tenggat',pending.filter(t=>t.due&&t.due<day)],
    ['Hari ini',pending.filter(t=>t.due===day)],
    ['Mendatang',pending.filter(t=>t.due>day)],
    ['Tanpa tenggat',pending.filter(t=>!t.due)]
  ];
  return groups.filter(([,list])=>list.length).map(([title,list])=>title+'\n'+lines(list)).join('\n\n');
}
function showReport(summary){
  const report=taskReport(tasks,today(),summary);
  const article=note('Asisten lokal',report);
  if(!summary||!tasks.length) return;
  const copy=document.createElement('button');
  copy.type='button';copy.className='copy-report';copy.textContent='Salin ringkasan';
  copy.onclick=async()=>{
    try{await navigator.clipboard.writeText(report);copy.textContent='Tersalin';}
    catch{
      const range=document.createRange();
      range.selectNodeContents(article.childNodes[1]);
      const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
      copy.textContent='Pilih Salin pada teks terpilih';
    }
  };
  article.append(copy);
}
el('agenda').onclick=()=>showReport(false);
el('summary').onclick=()=>showReport(true);
function local(message){
  const title=message.match(/^tambah tugas\s*:\s*(.+)$/is)?.[1]?.trim();
  if(title){tasks.push({name:title,done:false});save();render();return 'Tugas ditambahkan ke daftar di perangkat ini.';}
  if(message.toLowerCase()==='rencanakan hackathon'){
    for(const name of ['Pilih masalah dan pengguna sasaran','Bangun prototipe fitur utama','Siapkan demo dan kirim proyek']) if(!tasks.some(t=>t.name===name)) tasks.push({name,done:false});
    save();render();return 'Daftar persiapan hackathon sudah tersedia. Centang tugas saat selesai.';
  }
  return 'Mode lokal mendukung “Rencanakan hackathon” dan “Tambah tugas: nama tugas”. Chat AI belum tersedia pada sesi ini.';
}
el('form').onsubmit=async e=>{
  e.preventDefault();const message=el('msg').value.trim();if(!message)return;
  el('error').textContent='';
  const command=message.toLowerCase();
  if(command==='susun agenda'||command==='ringkas progres'){
    note('Kamu',message);showReport(command==='ringkas progres');draft('');return;
  }
  note('Kamu',message);note('Asisten lokal',local(message));draft('');
};
render();
el('status').textContent='Mode lokal';
el('intro').textContent='Susun rencana, kelola tugas, dan lihat progresmu di perangkat ini.';
