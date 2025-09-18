(function(){
  const {$, state, getJob, currentKey, exportCSVs} = window.KPI;
  function nowHHMM(){ const d=new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
  function isHHMM(s){ return /^\d{2}:\d{2}$/.test(s) && +s.slice(0,2)<=23 && +s.slice(3)<=59; }
  function isDatePT(s){ return /^\d{2}\/\d{2}\/\d{4}$/.test(s); }
  function parseIntOrNull(s){ if(s==null||String(s).trim()==='') return null; const n=Number(String(s).replace(',','.')); return Number.isFinite(n)? Math.trunc(n): null; }
  function parseFloatOrNull(s){ if(s==null||String(s).trim()==='') return null; const n=Number(String(s).replace(',','.')); return Number.isFinite(n)? n: null; }
  function applyLanguage(){ document.title=tr(state.lang,'app_title');
    document.querySelector('[data-i18n="language"]').textContent=tr(state.lang,'language');
    document.querySelector('[data-i18n="line"]').textContent=tr(state.lang,'line');
    document.querySelector('[data-i18n="prod_order"]').textContent=tr(state.lang,'prod_order');
    document.querySelector('[data-i18n="date_label"]').textContent=tr(state.lang,'date_label');
    document.querySelector('[data-i18n="berry"]').textContent=tr(state.lang,'berry');
    document.querySelector('[data-i18n="origin"]').textContent=tr(state.lang,'origin');
    document.querySelector('[data-i18n="packtype"]').textContent=tr(state.lang,'packtype');
    document.querySelector('[data-i18n="start_time"]').textContent=tr(state.lang,'start_time');
    document.querySelector('[data-i18n="punnets_infeed"]').textContent=tr(state.lang,'punnets_infeed');
    document.querySelector('[data-i18n="operators"]').textContent=tr(state.lang,'operators');
    document.querySelector('[data-i18n="team_leaders"]').textContent=tr(state.lang,'team_leaders');
    document.getElementById('btnOverviewRegister').textContent=tr(state.lang,'register');
    document.getElementById('btnOverviewClose').textContent=tr(state.lang,'close');
    document.getElementById('dtTitle').textContent=tr(state.lang,'downtime_title');
    document.querySelector('[data-i18n="reason_code"]').textContent=tr(state.lang,'reason_code');
    document.querySelector('[data-i18n="time_min"]').textContent=tr(state.lang,'time_min');
    document.getElementById('btnDTRegister').textContent=tr(state.lang,'register');
    document.getElementById('btnDTNext').textContent=tr(state.lang,'next');
    document.getElementById('btnDTBack').textContent=tr(state.lang,'back');
    document.getElementById('outTitle').textContent=tr(state.lang,'output_title');
    document.querySelector('[data-i18n="stop_time"]').textContent=tr(state.lang,'stop_time');
    document.querySelector('[data-i18n="lbl_punnets_outfeed"]').textContent=tr(state.lang,'lbl_punnets_outfeed');
    document.querySelector('[data-i18n="lbl_weight_ok"]').textContent=tr(state.lang,'lbl_weight_ok');
    document.querySelector('[data-i18n="lbl_underweight"]').textContent=tr(state.lang,'lbl_underweight');
    document.querySelector('[data-i18n="lbl_avg_weight"]').textContent=tr(state.lang,'lbl_avg_weight');
    document.getElementById('btnOutSave').textContent=tr(state.lang,'register');
    document.getElementById('btnOutCancel').textContent=tr(state.lang,'cancel_all');
  }
  function setLang(code){ state.lang=code; localStorage.setItem('lang',code); applyLanguage(); }
  function fillCombo(sel, items){ const el=document.querySelector(sel); el.innerHTML = items.map(x=>`<option>${x}</option>`).join(''); el.value=items[0]||''; }
  function init(){
    const langSel=document.getElementById('cboLang');
    langSel.innerHTML = [["pt","Português"],["en","English"],["fr","Français"],["pl","Polski"]].map(([c,n])=>`<option value="${c}">${n}</option>`).join('');
    langSel.value=state.lang; langSel.addEventListener('change',e=>setLang(e.target.value));

    const lineSel=document.getElementById('cboLine');
    lineSel.innerHTML = '<option value=""></option>' + state.lines.map(l=>`<option>${l}</option>`).join('');
    lineSel.value=""; lineSel.addEventListener('change', onLineChanged);

    document.getElementById('cboBerry').innerHTML='';
    document.getElementById('cboOrigin').innerHTML='';
    document.getElementById('cboPack').innerHTML='';

    document.getElementById('txtDate').value = new Date().toLocaleDateString('pt-PT');
    applyLanguage();

    document.getElementById('btnOverviewRegister').addEventListener('click', onOverviewRegister);
    document.getElementById('btnOverviewClose').addEventListener('click', onOverviewClose);
    document.getElementById('btnExport').addEventListener('click', exportCSVs);
    document.getElementById('btnDTRegister').addEventListener('click', onDTRegister);
    document.getElementById('btnDTNext').addEventListener('click', onDTNext);
    document.getElementById('btnDTBack').addEventListener('click', ()=>show('screenOverview'));
    document.getElementById('btnOutSave').addEventListener('click', onOutSave);
    document.getElementById('btnOutCancel').addEventListener('click', onOutCancel);
  }
  function show(id){ ['screenOverview','screenDowntime','screenOutput'].forEach(sec=>document.getElementById(sec).classList.toggle('hidden', sec!==id)); }
  async function onLineChanged(){ const newLine=document.getElementById('cboLine').value.trim(); if(!newLine) return; const k=currentKey(); const job=getJob(); if(job && job.pending){ const ok = await KPIDialogs.confirm(state.lang, tr(state.lang,'confirm_switch_cleanup')); if(!ok) { document.getElementById('cboLine').value=state.currentLine||""; return; } delete state.jobs[k]; }
    state.currentLine = newLine; fillCombo('#cboBerry', state.berries); fillCombo('#cboOrigin', state.origins); fillCombo('#cboPack', state.packs); }
  async function onOverviewRegister(){
    const line=document.getElementById('cboLine').value.trim(); const po=document.getElementById('txtPO').value.trim(); const date=document.getElementById('txtDate').value.trim(); const berry=document.getElementById('cboBerry').value.trim(); const origin=document.getElementById('cboOrigin').value.trim(); const pack=document.getElementById('cboPack').value.trim(); const start=document.getElementById('txtStart').value.trim(); const infeed=parseIntOrNull(document.getElementById('txtInfeed').value); const ops=parseIntOrNull(document.getElementById('txtOps').value); const tls=parseIntOrNull(document.getElementById('txtTLs').value);
    if(!line) return KPIDialogs.error(state.lang, tr(state.lang,'err_required_field',{field:tr(state.lang,'line').replace(':','')}));
    if(!po) return KPIDialogs.error(state.lang, tr(state.lang,'err_po_required'));
    if(!isDatePT(date)) return KPIDialogs.error(state.lang, tr(state.lang,'err_date_invalid'));
    if(!berry) return KPIDialogs.error(state.lang, tr(state.lang,'err_required_field',{field:tr(state.lang,'berry').replace(' *','')}));
    if(!origin) return KPIDialogs.error(state.lang, tr(state.lang,'err_required_field',{field:tr(state.lang,'origin').replace(' *','')}));
    if(!pack) return KPIDialogs.error(state.lang, tr(state.lang,'err_required_field',{field:tr(state.lang,'packtype').replace(' *','')}));
    if(!isHHMM(start)) return KPIDialogs.error(state.lang, tr(state.lang,'err_start_invalid'));
    if(infeed==null) return KPIDialogs.error(state.lang, tr(state.lang,'err_integer_required',{field:tr(state.lang,'punnets_infeed').replace(' *','')}));
    if(ops==null) return KPIDialogs.error(state.lang, tr(state.lang,'err_integer_required',{field:tr(state.lang,'operators').replace(' *','')}));
    if(tls==null) return KPIDialogs.error(state.lang, tr(state.lang,'err_integer_required',{field:tr(state.lang,'team_leaders').replace(' *','')}));
    if(!(ops>=4 && ops<=12)) return KPIDialogs.error(state.lang, tr(state.lang,'err_ops_range'));
    if(!(tls>=0 && tls<=2)) return KPIDialogs.error(state.lang, tr(state.lang,'err_tls_max'));

    const exists = Object.values(state.jobs).some(j=> j?.overview?.line===line && j?.overview?.po===po && j?.overview?.date===date);
    if(exists){ const choice = await KPIDialogs.poExists(state.lang, po); if(choice!=='edit') return; }

    const job=getJob(); job.overview={ line, po, date, berry, origin, packtype: parseIntOrNull(pack)??pack, start_time:start, punnets_infeed:infeed, operators:ops, team_leaders:tls };
    job.pending=true; await KPIDialogs.info(state.lang, tr(state.lang,'saved_new')); document.getElementById('dtHeaderPO').textContent = `${tr(state.lang,'prod_number_hdr')}: ${po}`; document.getElementById('txtDTMin').value=''; show('screenDowntime');
  }
  async function onDTRegister(){ const disp=document.getElementById('cboDTCode').value.trim(); const minutes=parseFloatOrNull(document.getElementById('txtDTMin').value); if(!disp) return KPIDialogs.error(state.lang, tr(state.lang,'err_select_valid_code')); if(!(minutes && minutes>0)) return KPIDialogs.error(state.lang, tr(state.lang,'err_enter_minutes')); const job=getJob(); const code = (disp.match(/\[(.+?)\]$/)||[])[1]||disp; job.downtime.push({display:disp, code, minutes}); await KPIDialogs.info(state.lang, tr(state.lang,'time_saved_ok')); document.getElementById('txtDTMin').value=''; document.getElementById('txtDTMin').focus(); }
  function onDTNext(){ document.getElementById('txtStop').value=nowHHMM(); document.getElementById('outHeaderPO').textContent = `${tr(state.lang,'prod_number_hdr')}: ${document.getElementById('txtPO').value.trim()}`; show('screenOutput'); }
  async function onOutSave(){ const stop=document.getElementById('txtStop').value.trim(); if(!isHHMM(stop)) return KPIDialogs.error(state.lang, tr(state.lang,'err_stop_invalid')); const produced=parseIntOrNull(document.getElementById('txtProduced').value); const ok=parseIntOrNull(document.getElementById('txtOK').value); const tu2=parseIntOrNull(document.getElementById('txtTU2').value); const avgW=parseFloatOrNull(document.getElementById('txtAvgW').value);
    if(produced==null) return KPIDialogs.error(state.lang, tr(state.lang,'err_integer_required',{field:tr(state.lang,'lbl_punnets_outfeed').replace(':','')}));
    if(ok==null) return KPIDialogs.error(state.lang, tr(state.lang,'err_integer_required',{field:tr(state.lang,'lbl_weight_ok').replace(':','')}));
    if(tu2==null) return KPIDialogs.error(state.lang, tr(state.lang,'err_integer_required',{field:tr(state.lang,'lbl_underweight').replace(':','')}));
    if(avgW==null) return KPIDialogs.error(state.lang, tr(state.lang,'err_required_field',{field:tr(state.lang,'lbl_avg_weight').replace(':','')}));
    const job=getJob(); const infeed=job?.overview?.punnets_infeed??null; const pack=job?.overview?.packtype??null; if(infeed!=null && produced>infeed) return KPIDialogs.error(state.lang, tr(state.lang,'err_produced_gt_infeed')); if(pack!=null && avgW<Number(pack)) return KPIDialogs.error(state.lang, tr(state.lang,'err_avg_weight_lt_pack'));
    job.output={ stop_time:stop, produced, counted_ok:ok, counted_tu2:tu2, avg_weight: (Math.round(avgW*10)/10) }; job.pending=false; await KPIDialogs.info(state.lang, tr(state.lang,'values_saved'));
    document.getElementById('txtPO').value=''; document.getElementById('txtDate').value=new Date().toLocaleDateString('pt-PT'); document.getElementById('cboBerry').innerHTML=''; document.getElementById('cboOrigin').innerHTML=''; document.getElementById('cboPack').innerHTML=''; document.getElementById('txtStart').value=''; document.getElementById('txtInfeed').value=''; document.getElementById('txtOps').value=''; document.getElementById('txtTLs').value=''; document.getElementById('cboLine').value=''; state.currentLine=''; show('screenOverview');
  }
  async function onOutCancel(){ const ok = await KPIDialogs.confirm(state.lang, tr(state.lang,'confirm_cancel_msg')); if(!ok) return; const k=currentKey(); if(k && state.jobs[k]) delete state.jobs[k]; await KPIDialogs.info(state.lang, tr(state.lang,'all_deleted')); document.getElementById('cboLine').value=''; state.currentLine=''; show('screenOverview'); }
  async function onOverviewClose(){ const job=getJob(); if(job && job.pending){ const ok = await KPIDialogs.confirm(state.lang, tr(state.lang,'confirm_cancel_msg_main')); if(!ok) return; const k=currentKey(); if(k) delete state.jobs[k]; } document.getElementById('cboLine').value=''; state.currentLine=''; }
  document.addEventListener('DOMContentLoaded', init);
})();
