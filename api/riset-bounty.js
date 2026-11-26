const {createHash, timingSafeEqual} = require('node:crypto');
const {prompt} = require('../dist/bounty-prompt.json');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const {HERMES_BASE_URL, HERMES_API_KEY, PARAF_STUDIO_PASSWORD} = process.env;
  let endpoint;
  try {
    const base = new URL(HERMES_BASE_URL);
    if (base.protocol === 'https:' && !base.username && !base.password && !base.search && !base.hash) {
      endpoint = new URL(base.href.replace(/\/+$/, '') + '/chat/completions');
    }
  } catch {}
  const configured = Boolean(endpoint && HERMES_API_KEY && PARAF_STUDIO_PASSWORD);
  if (req.method === 'GET') return res.json({configured});
  if (req.method !== 'POST') return res.status(405).end();
  if (!configured) return res.status(503).json({error:'Koneksi VPS belum dikonfigurasi.'});
  const hash = text => createHash('sha256').update(text).digest();
  if (!timingSafeEqual(hash(req.headers.authorization || ''), hash('Bearer ' + PARAF_STUDIO_PASSWORD))) {
    return res.status(401).json({error:'Kata sandi Studio tidak sesuai.'});
  }
  try {
    const result = await fetch(endpoint, {
      method:'POST', redirect:'error', signal:AbortSignal.timeout(110000),
      headers:{Authorization:'Bearer '+HERMES_API_KEY, 'Content-Type':'application/json'},
      body:JSON.stringify({model:'hermes-agent',stream:false,messages:[{role:'user',content:prompt}]})
    });
    if (!result.ok) return res.status(502).json({error:'Hermes mengembalikan HTTP '+result.status+'. Periksa konfigurasi VPS.'});
    const reply=(await result.json()).choices?.[0]?.message?.content;
    if(typeof reply!=='string'||!reply.trim()||reply.length>65000) throw new Error();
    return res.json({reply});
  } catch {
    return res.status(502).json({error:'Hasil Hermes belum tersedia. Periksa koneksi atau gunakan impor hasil dari chat Hermes.'});
  }
};
