(() => {
  const get = id => document.getElementById(id);
  const key = 'paraf.bounty.v1';
  const unknown = 'Belum tercantum';
  const seed = {nama:'Nosana Content',url:'https://superteam.fun/earn/listing/create-nosana-content-explainer-threadarticle-or-creative-memevideo/',status:'ditutup',bukti:'Laporan Hermes: Submissions in Review, hitung mundur nol, dan tombol submit sudah hilang.',diperiksa:'2026-11-26T12:02:00+07:00',tenggat:'',konfirmasi:'Brief menyebut 25 November tanpa zona waktu.'};
  const fields = {hadiah_total:'Total hadiah',hadiah_pemenang:'Per pemenang',peserta:'Peserta',format:'Format karya',syarat:'Syarat',ide:'Ide konten',konfirmasi:'Perlu dikonfirmasi'};
  const iso = s => typeof s==='string' && /^\d{4}-\d{2}-\d{2}T\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/.test(s) && Number.isFinite(Date.parse(s));
  // Hermes can split one JSON array across chat messages. Only commit complete objects.
  function readReport(text) {
    if (text.length > 65000) throw Error('Hasil terlalu panjang.');
    const raw = text.replace(/^[ \t]*`{3}(?:json)?[ \t]*$/gim, '')
      .replace(/^[ \t]*\(\d+\s*\/\s*\d+\)[ \t]*/gm, '')
      .replace(/[ \t]*\(\d+\s*\/\s*\d+\)[ \t]*(?=\r?$)/gm, '').trim();
    const formatError = () => new Error('Periksa format JSON dari Hermes. Tempel laporan mulai dari tanda [.');
    if (!raw.startsWith('[')) throw formatError();
    try {
      const items = JSON.parse(raw);
      return {items, partial:false};
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
    const items = [];
    let i = 1;
    const skipSpace = () => { while (i < raw.length && /\s/.test(raw[i])) i++; };
    while (true) {
      skipSpace();
      if (i === raw.length) return {items, partial:true};
      if (raw[i] !== '{') throw formatError();
      const start = i;
      let depth = 0, quoted = false, escaped = false;
      for (; i < raw.length; i++) {
        const ch = raw[i];
        if (quoted) {
          if (escaped) escaped = false;
          else if (ch === '\\') escaped = true;
          else if (ch === '"') quoted = false;
        } else if (ch === '"') quoted = true;
        else if (ch === '{') depth++;
        else if (ch === '}' && --depth === 0) break;
      }
      if (i === raw.length) return {items, partial:true};
      try { items.push(JSON.parse(raw.slice(start, ++i))); } catch { throw formatError(); }
      skipSpace();
      if (i < raw.length && raw[i++] !== ',') throw formatError();
    }
  }
  function normalized(r) {
    if(!r || typeof r.nama!=='string'||!r.nama.trim()||r.nama.length>200) throw Error('Nama bounty harus diisi.');
    const url=new URL(r.url);
    if(url.protocol!=='https:'||url.username||url.password) throw Error('Gunakan URL HTTPS halaman resmi.');
    url.hash='';
    for(const k of [...url.searchParams.keys()]) if(k.startsWith('utm_')) url.searchParams.delete(k);
    if(!['terbuka','ditutup','perlu_cek'].includes(r.status)||!iso(r.diperiksa)||Date.parse(r.diperiksa)>Date.now()+300000) throw Error('Periksa status dan waktu pemeriksaan beserta zona waktunya.');
    if(r.tenggat && !iso(r.tenggat)) throw Error('Tenggat perlu mencantumkan jam dan zona waktu. Kosongkan jika belum jelas.');
    const result={nama:r.nama.trim(),url:url.href,status:r.status,diperiksa:r.diperiksa,tenggat:r.tenggat||''};
    for(const k of ['bukti',...Object.keys(fields)]) {
      if(r[k]!=null && (typeof r[k]!=='string'||r[k].length>4500)) throw Error('Isi '+k+' sebagai teks singkat.');
      result[k]=r[k]?.trim()||unknown;
    }
    return result;
  }
  let db=[seed], pending=false, mode='';
  try {const old=JSON.parse(localStorage.getItem(key));if(Array.isArray(old))db=old.map(normalized)} catch {}
  const time=s=>new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(s))+' WIB';
  function label(r) {
    if(r.status==='ditutup'||(r.tenggat && Date.parse(r.tenggat)<=Date.now())) return 'Ditutup';
    if(r.status==='perlu_cek'||!r.bukti||r.bukti===unknown||Date.now()-Date.parse(r.diperiksa)>86400000) return 'Perlu cek';
    return 'Terbuka';
  }
  const node=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n};
  function draw() {
    const box=get('b-cards');box.replaceChildren();
    for(const r of db){
      const status=label(r);
      if(get('b-filter').value!=='all'&&get('b-filter').value!==status)continue;
      const card=node('article','','op-card');
      card.append(node('small',status+' · Laporan Hermes'),node('h3',r.nama),node('p',r.bukti),node('p','Diperiksa '+time(r.diperiksa),'terms'));
      const detail=node('details','');detail.append(node('summary','Lihat brief dan tenggat'),node('p','Tenggat · '+(r.tenggat?time(r.tenggat):unknown)));
      for(const [k,name] of Object.entries(fields)) detail.append(node('p',name+' · '+(r[k]||unknown)));
      const row=node('div',''),a=node('a','Halaman resmi');a.href=r.url;a.target='_blank';a.rel='noopener noreferrer';row.append(a);
      if(status==='Terbuka'){
        const saved=tasks.some(t=>t.bountyUrl===r.url),button=node('button',saved?'Tugas tersimpan':'Jadikan tugas');button.disabled=saved;
        button.onclick=()=>{
          if(label(r)!=='Terbuka') {draw();return}
          if(!tasks.some(t=>t.bountyUrl===r.url)){
            const due=r.tenggat?new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(r.tenggat)):'';
            tasks.push({name:r.nama+' · '+(r.ide&&r.ide!==unknown?r.ide:'Siapkan karya sesuai brief'),bountyUrl:r.url,done:false,due});
            save();get('filter').value='all';render();
          }
          get('b-status').textContent='Ide ditambahkan ke Tugas saya.';draw();
        };
        row.append(button);
      }
      card.append(detail,row);box.append(card);
    }
    if(!box.childElementCount)box.append(node('p','Belum ada bounty dengan status ini.'));
  }
  const dialog=get('b-dialog'),area=get('b-text');
  const draftKey = 'paraf.bounty.import.draft';
  let draft = '';
  try { draft = sessionStorage.getItem(draftKey) || ''; } catch {}
  function keepDraft(value) {
    draft = value;
    try {
      if (value) sessionStorage.setItem(draftKey, value);
      else sessionStorage.removeItem(draftKey);
    } catch {}
  }
  area.addEventListener('input', () => { if (mode === 'import' && area.value.length <= 65000) keepDraft(area.value); });
  function setup(next) {
    mode=next;const research=mode==='research';
    get('b-title').textContent=research?'Minta riset Hermes':'Impor hasil Hermes';
    get('b-info').textContent=research?'Salin instruksi ke chat Hermes di VPS. Setelah Hermes menjawab, tempel JSON melalui Impor hasil Hermes.':'Tempel jawaban Hermes. Jika pesan terbagi, simpan bagian pertama lalu tambahkan bagian berikutnya di akhir teks. Laporan terbaru untuk URL yang sama akan memperbarui kartu. Data tersimpan di browser ini.';
    get('b-label').textContent=research?'Instruksi untuk Hermes':'Hasil riset JSON';
    area.value=research?'':draft;area.readOnly=research;get('b-error').textContent='';get('b-password').value='';get('b-direct').hidden=true;get('b-apply').textContent=research?'Salin instruksi':'Simpan hasil';
    if(!dialog.open)dialog.showModal();
  }
  get('research').onclick=async()=>{
    setup('research');get('b-apply').disabled=true;
    try {
      const res=await fetch('bounty-prompt.json');if(!res.ok)throw Error();const {prompt}=await res.json();
      if(mode!=='research'||!dialog.open)return;
      area.value=prompt;get('b-apply').disabled=false;
      const cfg=await fetch('/api/riset-bounty',{cache:'no-store'});if(cfg.ok && (await cfg.json()).configured && mode==='research'&&dialog.open)get('b-direct').hidden=false;
    }catch{if(!area.value)get('b-error').textContent='Instruksi gagal dimuat. Tutup dan coba lagi.'}
  };
  get('import-research').onclick=()=>{setup('import');get('b-apply').disabled=false};
  get('b-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{get('b-password').value=''});
  get('b-apply').onclick=async()=>{
    if(mode==='research'){
      try{await navigator.clipboard.writeText(area.value);get('b-error').textContent='Instruksi disalin. Tempel di chat Hermes.'}catch{area.focus();area.select();get('b-error').textContent='Pilih Salin pada teks yang disorot.'}return;
    }
    try{
      const {items,partial}=readReport(area.value);
      if(items.length>30)throw Error('Gunakan maksimal 30 bounty per impor.');
      if(partial){
        if(!area.value.endsWith('\n'))area.value+='\n';
        keepDraft(area.value);
      }
      if(!items.length){
        get('b-error').textContent=partial?'Belum ada kandidat lengkap. Tempel bagian berikutnya di akhir teks.':'Hermes tidak menemukan kandidat untuk disimpan.';
        return;
      }
      const next=new Map(db.map(x=>[x.url,x]));let count=0;
      for(const item of items.map(normalized)){
        const prev=next.get(item.url);if(prev&&(Date.parse(prev.diperiksa)>Date.parse(item.diperiksa)||JSON.stringify(prev)===JSON.stringify(item)))continue;
        next.set(item.url,item);count++;
      }
      const sorted=[...next.values()].sort((a,b)=>Date.parse(b.diperiksa)-Date.parse(a.diperiksa));
      localStorage.setItem(key,JSON.stringify(sorted));db=sorted;get('b-filter').value='all';draw();
      const message=count?count+' laporan disimpan.':'Laporan yang sama atau lebih baru sudah tersimpan.';
      get('b-status').textContent=message;
      if(partial){
        get('b-error').textContent=message+' Pesan masih terpotong. Tempel bagian berikutnya di akhir teks lalu tekan Simpan hasil lagi.';
        area.focus();
        area.setSelectionRange(area.value.length,area.value.length);
      }else{
        keepDraft('');dialog.close();
      }
    }catch(e){get('b-error').textContent=e instanceof SyntaxError?'JSON belum valid. Salin seluruh array dari jawaban Hermes.':e.message}
  };
  get('b-run').onclick=async()=>{
    const password=get('b-password').value;if(!password||pending)return;
    pending=true;get('b-run').disabled=true;get('b-error').textContent='Hermes sedang memeriksa listing…';get('b-password').value='';
    try{
      const response=await fetch('/api/riset-bounty',{method:'POST',headers:{Authorization:'Bearer '+password}});const result=await response.json();if(!response.ok)throw Error(result.error);
      setup('import');area.value=result.reply;get('b-apply').disabled=false;
    }catch(e){get('b-error').textContent=e.message||'Gagal menghubungi Hermes.'}finally{pending=false;get('b-run').disabled=false}
  };
  get('b-filter').onchange=draw;draw();setInterval(draw,60000);
})();
