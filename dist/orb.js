// A shared decorative surface for Studio and the Hermes dashboard.
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  try { paused = localStorage.getItem('paraf.motion.paused') === 'true'; } catch {}
  const active = new Set();
  const circles = Array.from({length:64}, (_, i) => {
    const a = i * Math.PI / 32;
    return [Math.cos(a), Math.sin(a), a];
  });
  const tube = Array.from({length:49}, (_, i) => {
    const b = i * Math.PI / 24;
    return [Math.cos(b), Math.sin(b)];
  });
  function refresh() {
    const still = paused || preference.matches;
    document.documentElement.classList.toggle('still', still);
    for (const orb of active) orb.update();
    for (const button of document.querySelectorAll('[data-motion]')) {
      button.hidden = preference.matches;
      button.setAttribute('aria-label', paused ? 'Putar animasi' : 'Jeda animasi');
      button.title = button.getAttribute('aria-label');
      button.textContent = paused ? '▷' : 'Ⅱ';
    }
  }
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-motion]')) return;
    paused = !paused;
    try { localStorage.setItem('paraf.motion.paused', String(paused)); } catch {}
    refresh();
  });
  class ParafOrb extends HTMLElement {
    connectedCallback() {
      this.canvas = document.createElement('canvas');
      this.canvas.setAttribute('aria-hidden','true');
      this.replaceChildren(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) return;
      this.visible = true;
      this.phase = 0;
      this.last = 0;
      this.resize = new ResizeObserver(() => {
        const ratio = Math.min(devicePixelRatio || 1, 2);
        this.canvas.width = Math.max(1,Math.round(this.clientWidth * ratio));
        this.canvas.height = Math.max(1,Math.round(this.clientHeight * ratio));
        this.update();
      });
      this.resize.observe(this);
      this.observer = new IntersectionObserver(entries => {
        this.visible = entries[0].isIntersecting;
        this.update();
      });
      this.observer.observe(this);
      active.add(this);
      queueMicrotask(refresh);
    }
    disconnectedCallback() {
      cancelAnimationFrame(this.frame);
      this.resize?.disconnect();this.observer?.disconnect();
      active.delete(this);
    }
    update() {
      cancelAnimationFrame(this.frame);
      this.last = 0;
      if (!this.isConnected || document.hidden || !this.visible) return;
      this.draw();
      if (!paused && !preference.matches) this.frame = requestAnimationFrame(t => this.tick(t));
    }
    tick(t) {
      if (!this.last) this.last = t;
      if (t-this.last >= 32) {
        this.phase += Math.min(t-this.last,80)/1000;
        this.last = t;
        this.draw();
      }
      this.frame = requestAnimationFrame(next => this.tick(next));
    }
    draw() {
      const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height,t=this.phase;
      const scale=Math.min(w/360,h/255);
      ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,w,h);
      ctx.setTransform(scale,0,0,scale,w*.5,h*.5);
      const tilt=.53+.24*Math.sin(t*.45), roll=.42+.26*Math.sin(t*.32);
      const cr=Math.cos(roll),sr=Math.sin(roll);
      for(const [cu,su,a] of circles) {
        ctx.beginPath();
        tube.forEach(([cv,sv],i)=>{
          const radius=103+32*cv+8*Math.sin(3*a-t*.8);
          const x=radius*cu, y=radius*su*tilt+(39*sv+17*Math.sin(2*a+t*.7))*.85;
          const px=x*cr-y*sr,py=x*sr+y*cr;
          if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
        });
        const light=(1+Math.cos(a-t*.6))/2;
        ctx.strokeStyle='rgba(212,255,151,'+(.3+.59*light)+')';
        ctx.lineWidth=1.15+.5*light;ctx.stroke();
      }
    }
  }
  customElements.define('paraf-orb',ParafOrb);
  preference.addEventListener('change',refresh);
  document.addEventListener('visibilitychange',refresh);
  refresh();
})();
