// Dialogs with I18N buttons (no generic browser strings)
(function(){
  const root = document.body;
  function ensureStyles(){
    if(document.getElementById('kpi-dialog-styles')) return;
    const css = `
    .kpi-modal{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999}
    .kpi-box{background:#fff;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.2);max-width:520px;width:92%;overflow:hidden}
    .kpi-h{font-weight:700;font-size:16px;padding:12px 16px;border-bottom:1px solid #eee}
    .kpi-b{padding:14px 16px;white-space:pre-wrap}
    .kpi-f{display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid #eee}
    .kpi-btn{padding:8px 12px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer}
    .kpi-btn.primary{background:#0078d4;color:#fff;border-color:#0078d4}
    `;
    const s=document.createElement('style'); s.id='kpi-dialog-styles'; s.textContent=css; document.head.appendChild(s);
  }
  function modal(title, message, buttons){
    ensureStyles();
    return new Promise(res=>{
      const overlay = document.createElement('div'); overlay.className='kpi-modal';
      const box = document.createElement('div'); box.className='kpi-box';
      const h = document.createElement('div'); h.className='kpi-h'; h.textContent=title; box.appendChild(h);
      const b = document.createElement('div'); b.className='kpi-b'; b.textContent=message; box.appendChild(b);
      const f = document.createElement('div'); f.className='kpi-f';
      buttons.forEach(btn=>{
        const el=document.createElement('button'); el.className='kpi-btn'+(btn.primary?' primary':''); el.textContent=btn.text; el.onclick=()=>{ root.removeChild(overlay); res(btn.value); }; f.appendChild(el);
      });
      box.appendChild(f); overlay.appendChild(box); root.appendChild(overlay);
    });
  }
  window.KPIDialogs = {
    async info(lang, message){ return modal(tr(lang,'info_title'), message, [{text:tr(lang,'accept_button'), value:true, primary:true}]); },
    async error(lang, message){ return modal(tr(lang,'err_title'), message, [{text:tr(lang,'accept_button'), value:true, primary:true}]); },
    async confirm(lang, message){ return modal(tr(lang,'confirm_cancel_title'), message, [
      {text:tr(lang,'cancel_button'), value:false},
      {text:tr(lang,'accept_button'), value:true, primary:true}
    ]); },
    async poExists(lang, po){
      const msg = tr(lang,'po_exists_msg',{po});
      return modal(tr(lang,'po_exists_title'), msg, [
        {text:tr(lang,'decline'), value:'decline'},
        {text:tr(lang,'edit'), value:'edit', primary:true}
      ]);
    }
  };
})();
