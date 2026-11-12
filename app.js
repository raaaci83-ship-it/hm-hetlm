'use strict';
/* ===== data model ===== */
const SUBJ={ar:'عربي',en:'إنجليزي',ha:'تاريخ — أحمد عادل (الأساسي)',hg:'تاريخ — جمعة السيد (مساعد)',hm:'تاريخ — كتاب الوزارة',pr:'برمجة'};
const BADGE={ar:['سيد اللغة','Arabic Master','📜'],en:['English Backlog Slayer','قاتل تراكمات الإنجليزي','⚔️'],ha:['The History Strategist','استراتيجي التاريخ','🏛️'],hg:['The Knowledge Collector','جامع المعرفة','📚'],pr:['Code Conqueror','فاتح الأكواد','💻']};
const TYPES={exam:'امتحان',hw:'واجب',book:'كتاب',video:'فيديو حل',rev:'مراجعة',lec:'محاضرة/شرح',other:'أخرى'};
const WD=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const MO=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const norm=s=>s.replace(/[أإآ]/g,'ا');
function sk(subj,t){if(subj==='عربي')return'ar';if(subj==='إنجليزي')return'en';if(subj==='برمجة')return'pr';
 if(/^أحمد عادل/.test(t))return'ha';if(/^جمعة السيد/.test(t))return'hg';return'hm'}
function ty(t){if(/امتحان/.test(t))return'exam';if(/فيديو.*حل|فيديوهات حل|الحل/.test(t)&&!/كتاب/.test(t.split('،')[0]))return'video';if(/مراجعة/.test(t))return'rev';
 if(/واجب/.test(t))return'hw';if(/كتاب|المصدر|التقييمات|الوزارة|الأضواء|المعاصر|الفائز|روائع|التعبير: كتابة|الهمزة|Quero|منصة|تدريب/.test(t))return'book';if(/شرح|مشاهدة|المحاضرة/.test(t))return'lec';return'other'}
const DAYS=PLAN.map(([date,off,rows])=>{const items=[];rows.forEach(([subj,lec,its],ri)=>its.forEach(([t,m],ii)=>{const s=sk(subj,t);
 items.push({id:date+'|'+ri+'|'+ii,date,s,subj,lec,t,m,ty:ty(subj+' '+lec+' '+t)})}));return{date,off:!!off,items}});
const ALL=DAYS.flatMap(d=>d.items),BYID=Object.fromEntries(ALL.map(i=>[i.id,i]));
const START=new Date(2026,10,12);
/* ===== storage (IndexedDB, in-memory cache) ===== */
let S={v:1,done:{},notes:{},time:{},badges:{},hist:[],seen:[],set:{sound:true,vol:.6,anim:true}};
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('hm',1);r.onupgradeneeded=()=>r.result.createObjectStore('k');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function load(){try{const d=await idb();const v=await new Promise(r=>{const q=d.transaction('k').objectStore('k').get('s');q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)});if(v)S=Object.assign(S,v)}catch(e){try{const v=JSON.parse(localStorage.getItem('hm')||'null');if(v)S=Object.assign(S,v)}catch(_){}}}
let st;function save(){clearTimeout(st);st=setTimeout(async()=>{try{const d=await idb();d.transaction('k','readwrite').objectStore('k').put(S,'s')}catch(e){try{localStorage.setItem('hm',JSON.stringify(S))}catch(_){}}},150)}
/* ===== helpers ===== */
const $=s=>document.querySelector(s),fmt=m=>{const h=Math.floor(m/60),r=m%60;return h?(r?h+'س '+r+'د':h+'س'):(r+'د')};
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const pd=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};const dlabel=s=>{const d=pd(s);return WD[d.getDay()]+' — '+d.getDate()+' '+MO[d.getMonth()]+' '+d.getFullYear()};
const pct=(a,b)=>b?Math.round(a*100/b):0;const isd=i=>!!S.done[i.id];
function stats(items){const dn=items.filter(isd);return{n:items.length,d:dn.length,pm:items.reduce((a,i)=>a+i.m,0),dm:dn.reduce((a,i)=>a+i.m,0),p:pct(dn.length,items.length)}}
const today=()=>iso(new Date());
function dayState(d){if(d.off)return'off';const s=stats(d.items);if(s.d===s.n)return'full';if(s.d)return'part';return d.date<today()?'miss':'up'}
function nearestDay(){const t=today();return(DAYS.find(d=>d.date>=t&&!d.off)||DAYS[DAYS.length-1]).date}
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
/* ===== sound & fx ===== */
let AC;function tone(seq,type='sine'){if(!S.set.sound)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();let t=AC.currentTime;seq.forEach(([f,d])=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(S.set.vol*.3,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d);t+=d*.8})}catch(e){}}
const SND={s:[[660,.1],[880,.15]],day:[[523,.12],[659,.12],[784,.12],[1047,.3]],sub:[[392,.12],[523,.12],[659,.12],[784,.12],[1047,.12],[1319,.4]],win:[[523,.15],[523,.15],[523,.15],[659,.2],[784,.2],[1047,.2],[784,.15],[1047,.6]]};
const cv=$('#fx'),cx=cv.getContext('2d');let P=[],raf;function sz(){cv.width=innerWidth;cv.height=innerHeight}sz();addEventListener('resize',sz);
function burst(n,fw){if(!S.set.anim)return;const cols=['#f43f5e','#f59e0b','#10b981','#3b82f6','#a855f7','#facc15'];for(let k=0;k<n;k++){const a=Math.random()*6.28,v=fw?3+Math.random()*7:2+Math.random()*6;P.push({x:fw?innerWidth*(.2+Math.random()*.6):innerWidth/2,y:fw?innerHeight*(.2+Math.random()*.4):innerHeight*.4,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(fw?0:4),c:cols[k%6],l:70+Math.random()*50,w:3+Math.random()*4})}if(!raf)raf=requestAnimationFrame(tick)}
function tick(){cx.clearRect(0,0,cv.width,cv.height);P=P.filter(p=>p.l-->0);P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;cx.fillStyle=p.c;cx.globalAlpha=Math.min(1,p.l/30);cx.fillRect(p.x,p.y,p.w,p.w*1.4)});cx.globalAlpha=1;raf=P.length?requestAnimationFrame(tick):0}
function show(n,f,t){burst(n,f);let i=0;if(f){const iv=setInterval(()=>{burst(n,true);if(++i>(t||3))clearInterval(iv)},500)}}
let tt;function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('s');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('s'),2600)}
/* ===== rewards ===== */
const MSG=['عاش! تاسك من التراكمات بقى في خبر كان! 🔥','واحد كمان اتشال من على قلبك!','الإنجازات الصغيرة بتعمل فرق كبير!','كده أنت بتقرب من تصفير التراكمات!','كمّل يا بطل، التراكم بيترعب منك 😎','تاسك وراه تاسك.. أنت ماشي صح!'];
const POOL={small:['روح اشرب عصير قصب! 🥤','خد 10 دقايق راحة.','قوم اتمشى 10 دقايق.','افتح الشباك وغير جو شوية.','هات لنفسك حاجة بتحبها تاكلها.','اقعد 10 دقايق من غير ما تفكر في المذاكرة.','مدّ جسمك وخد نفس عميق 🧘'],
 med:['مبروك! تستحق نصف ساعة راحة.','اختار حاجة بتحب تعملها لمدة 20 دقيقة.','انزل اتمشى شوية وغير مودك.','اعمل لنفسك مشروبك المفضل.','شوف حلقة من مسلسل بتحبه ☕'],
 fun:['الحكم قرر: ممنوع الراحة دلوقتي، كمل التحدي التالي! 😂','أنت في مستوى خطير من الإنجاز... كمل يا أسطورة!','الحكم سمحلك براحة 5 دقايق فقط!','لسه فيه تراكمات مستنياك، ارجع للمهمة يا بطل!','تحدي: خلّص التاسك الجاية قبل ما الشاي يبرد 🍵'],
 big:['خد النهاردة بقية اليوم بالراحة اللي تحبها.','اطلب أكلة بتحبها وأنت مرتاح 🍕','اخرج مع صحابك ساعة، تستاهل.','سهرة فيلم من غير ذنب! 🎬']};
function pick(k){const pool=POOL[k];let c=pool.filter(x=>!S.seen.includes(x));if(!c.length){S.seen=S.seen.filter(x=>!pool.includes(x));c=pool}const r=c[Math.floor(Math.random()*c.length)];S.seen.push(r);if(S.seen.length>12)S.seen.shift();return r}
function log(type,text){S.hist.unshift({d:new Date().toISOString(),type,text});S.hist=S.hist.slice(0,300)}
function modal(html){const o=$('#ov');o.innerHTML='<div class="card">'+html+'</div>';o.hidden=false}
function closeM(){$('#ov').hidden=true}
function rewardModal(title,emoji,pool){const r=pick(pool);modal(`<div class="big">${emoji}</div><h2>${title}</h2><p id="rw">${r}</p><div class="row"><button class="p" onclick="acc('${pool}')">تمام هاخدها ✅</button><button onclick="again('${pool}')">مفاجأة تانية!</button><button onclick="closeM()">تخطي</button></div>`);log('reward',r)}
window.again=p=>{const r=pick(p);$('#rw').textContent=r;log('reward',r)};window.acc=p=>{toast('استمتع! 🎉');closeM()};window.closeM=closeM;
function celebrate(kind,title,emoji,pool,snd){S.set.anim&&show(kind==='win'?200:120,true,kind==='win'?10:4);tone(SND[snd]);log('achv',title);modal(`<div class="big">${emoji}</div><h2>${title}</h2><button class="p" onclick="closeM();${kind==='win'?'go(\'cert\')':'rewardModal2()'}">${kind==='win'?'شوف شهادتك 🏆':'كمّل'}</button>`);window._pool=pool}
window.rewardModal2=()=>{closeM();if(window._pool)rewardModal('مكافأتك','🎁',window._pool)};
function unlock(key,title,emoji,pool,snd,kind){if(S.badges[key])return;S.badges[key]=new Date().toISOString();save();celebrate(kind||'big',title,emoji,pool,snd)}
function checkAchv(it){const d=DAYS.find(x=>x.date===it.date),ds=stats(d.items);const all=stats(ALL);
 const sub=['ar','en','ha','hg','pr'];let major=false;
 for(const k of sub){const ss=stats(ALL.filter(i=>i.s===k));if(ss.d===ss.n&&!S.badges['sub_'+k]){unlock('sub_'+k,'🏅 '+BADGE[k][0]+' — '+BADGE[k][1],BADGE[k][2],'big','sub');major=true}}
 if(sub.every(k=>S.badges['sub_'+k])&&stats(ALL.filter(i=>i.s==='hm')).d===stats(ALL.filter(i=>i.s==='hm')).n&&all.d===all.n&&!S.badges.win){S.badges.win=new Date().toISOString();save();celebrate('win','🏆 THE BACKLOG TERMINATOR — أسطورة تصفير التراكمات','🏆','big','win');return true}
 if(major)return true;
 for(const m of[25,50,75,100]){if(all.p>=m&&!S.badges['m'+m]&&m<100){unlock('m'+m,'وصلت '+m+'% من الخطة! 🎯','🎯','big','day');return true}}
 if(ds.d===ds.n&&!S.badges['day_'+d.date]){S.badges['day_'+d.date]=new Date().toISOString();save();celebrate('day','خلّصت يوم '+dlabel(d.date)+' كله! 🎉','🎉','med','day');
  const wk=DAYS.filter(x=>weekOf(x.date)===weekOf(d.date)&&!x.off);if(wk.every(x=>stats(x.items).d===stats(x.items).n)&&!S.badges['wk_'+weekOf(d.date)]){S.badges['wk_'+weekOf(d.date)]=1;log('achv','خلّصت أسبوع '+(weekOf(d.date)+1))}return true}
 return false}
function weekOf(s){return Math.floor((pd(s)-START)/864e5/7)}
function toggle(id,on){const it=BYID[id];if(on){S.done[id]=new Date().toISOString();save();if(!checkAchv(it)){tone(SND.s);toast(MSG[Math.floor(Math.random()*MSG.length)]);if(Math.random()<.25)show(30);if(it.m>=60&&Math.random()<.35)rewardModal('تاسك محترم!','🎁',Math.random()<.4?'fun':(it.m>=120?'med':'small'))}}else{delete S.done[id];save()}render()}
window.toggle=toggle;
/* ===== timers & notes ===== */
let RUN=null;setInterval(()=>{if(RUN){S.time[RUN.id]=(S.time[RUN.id]||0)+1;const e=document.getElementById('t_'+RUN.id.replace(/\W/g,'_'));if(e)e.textContent='⏱ '+tf(S.time[RUN.id]);if(S.time[RUN.id]%15==0)save()}},1000);
const tf=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
window.tm=id=>{RUN=RUN&&RUN.id===id?null:{id};save();render()};window.rs=id=>{delete S.time[id];if(RUN&&RUN.id===id)RUN=null;save();render()};
window.nt=id=>{const e=document.getElementById('n_'+id.replace(/\W/g,'_'));e.hidden=!e.hidden};window.sn=(id,v)=>{if(v.trim())S.notes[id]=v;else delete S.notes[id];save()};
function itemHTML(i,showDate){const k=i.id.replace(/\W/g,'_'),dn=isd(i);return`<div class="it ${dn?'d':''}"><input type="checkbox" ${dn?'checked':''} onchange="toggle('${i.id}',this.checked)"><div style="flex:1"><div class="tt"><span class="tag ${i.s}">${SUBJ[i.s].split(' — ')[0]}</span>${showDate?'<span class="m">'+dlabel(i.date)+'</span> ':''}<span class="m">${esc(i.lec)}</span><br>${esc(i.t)}</div><div class="m">المقدّر ${fmt(i.m)} · الفعلي <span id="t_${k}">⏱ ${tf(S.time[i.id]||0)}</span></div>
<button class="tm" onclick="tm('${i.id}')">${RUN&&RUN.id===i.id?'⏸ إيقاف':(S.time[i.id]?'▶ استئناف':'▶ ابدأ')}</button><button class="tm" onclick="rs('${i.id}')">↺</button><button class="tm" onclick="nt('${i.id}')">📝${S.notes[i.id]?' ●':''}</button><div id="n_${k}" ${S.notes[i.id]?'':'hidden'}><textarea rows="2" placeholder="ملاحظتك..." onchange="sn('${i.id}',this.value)">${esc(S.notes[i.id]||'')}</textarea></div></div></div>`}
/* ===== views ===== */
let V='home',CUR=nearestDay(),FL={q:'',s:'',st:'',ty:'',d:''};
window.go=(v,d)=>{V=v;if(d)CUR=d;render();scrollTo(0,0)};
const NAV=[['home','🏠','الرئيسية'],['day','📅','اليوم'],['cal','🗓️','التقويم'],['week','📊','الأسبوع'],['more','☰','المزيد']];
function card(k,label,items){const s=stats(items);return`<div class="card"><div class="row"><b><span class="tag ${k}">&nbsp;</span>${label}</b><span>${s.p}%</span></div><div class="bar"><i style="width:${s.p}%"></i></div><div class="m">تم ${s.d} · متبقي ${s.n-s.d} · ${fmt(s.dm)} من ${fmt(s.pm)}</div></div>`}
function home(){const a=stats(ALL),sd=DAYS.filter(d=>!d.off),fd=sd.filter(d=>dayState(d)==='full').length,td=DAYS.find(d=>d.date===today());const cur=td||DAYS.find(d=>d.date===nearestDay());
 const status=a.d===a.n?'🏆 صفّرت التراكمات!':'التراكم لسه شغال — باقي '+(a.n-a.d)+' مهمة';
 return`<div class="card"><div class="row"><b>التقدم الكلي</b><b>${a.p}%</b></div><div class="bar"><i style="width:${a.p}%"></i></div><div class="m">تم ${a.d} · متبقي ${a.n-a.d} من ${a.n} مهمة<br>أيام مذاكرة خلصت ${fd} · متبقي ${sd.length-fd}<br>${status}</div></div>
<h2>مهام ${td?'النهاردة':'أقرب يوم'} — ${dlabel(cur.date)}</h2><div class="card">${cur.off?'<b>إجازة 🌴</b>':cur.items.map(i=>itemHTML(i)).join('')}</div>
<h2>تقدم المواد</h2>${['ar','en','pr'].map(k=>card(k,SUBJ[k],ALL.filter(i=>i.s===k))).join('')}${card('ha','التاريخ (الكل)',ALL.filter(i=>['ha','hg','hm'].includes(i.s)))}${['ha','hg','hm'].map(k=>card(k,SUBJ[k],ALL.filter(i=>i.s===k))).join('')}<p class="m">أحمد عادل هو المدرس الأساسي وجمعة السيد مساعد، وترتيب الدروس متزامن كما في الخطة.</p>`}
function day(){const d=DAYS.find(x=>x.date===CUR),i=DAYS.indexOf(d),s=stats(d.items);
 return`<div class="row"><button onclick="go('day','${DAYS[Math.min(i+1,DAYS.length-1)].date}')">◀ التالي</button><input type="date" value="${d.date}" min="${DAYS[0].date}" max="${DAYS[DAYS.length-1].date}" onchange="this.value&&go('day',(DAYS.find(x=>x.date>=this.value)||d).date)"><button onclick="go('day','${DAYS[Math.max(i-1,0)].date}')">السابق ▶</button></div><button style="margin:8px 0" onclick="go('day',nearestDay())">اليوم</button>
<div class="card"><b>${dlabel(d.date)}</b> ${dayState(d)==='full'?'✅':''}${d.off?'<h2>إجازة 🌴</h2>':`<div class="bar"><i style="width:${s.p}%"></i></div><div class="m">إجمالي ${fmt(s.pm)} · تم ${fmt(s.dm)} · متبقي ${fmt(s.pm-s.dm)} · ${s.p}%</div>`}</div>
${d.off?'':'<div class="card">'+d.items.map(x=>itemHTML(x)).join('')+'</div>'}`}
function cal(){let h='<div class="cal">'+WD.map(w=>`<b class="m" style="text-align:center">${w.slice(0,3)}</b>`).join('')+'</div>';let last='';
 DAYS.forEach(d=>{const dt=pd(d.date),m=MO[dt.getMonth()]+' '+dt.getFullYear();if(m!==last){h+=(last?'</div>':'')+`<h2>${m}</h2><div class="cal">`;h+='<span></span>'.repeat(dt.getDay());last=m}h+=`<a class="${dayState(d)} ${d.date===today()?'today':''}" href="#" onclick="go('day','${d.date}');return false">${dt.getDate()}</a>`});
 return h+'</div><p class="m">🟩 خلص · 🟨 جزئي · 🟥 فايت · ⚪ جاي · باهت = إجازة</p>'}
function week(){const W={};DAYS.forEach(d=>(W[weekOf(d.date)]=W[weekOf(d.date)]||[]).push(...d.items));const cw=Math.max(0,Math.min(weekOf(today()),29));
 return Object.keys(W).map(w=>{const s=stats(W[w]),on=+w===cw;const subs=Object.keys(SUBJ).map(k=>{const q=stats(W[w].filter(i=>i.s===k));return q.n?`<span class="tag ${k}">${SUBJ[k].split(' — ')[0]} ${q.d}/${q.n}</span>`:''}).join('');
 return`<div class="card" ${on?'style="border-color:var(--p)"':''}><div class="row"><b>الأسبوع ${+w+1}</b><span>${s.p}%</span></div><div class="bar"><i style="width:${s.p}%"></i></div><div class="m">تم ${s.d} · متبقي ${s.n-s.d} · ساعات ${(s.dm/60).toFixed(1)} من ${(s.pm/60).toFixed(1)}</div><div>${subs}</div></div>`}).join('')}
function search(){const L=ALL.filter(i=>(!FL.s||i.s===FL.s)&&(!FL.ty||i.ty===FL.ty)&&(!FL.d||i.date===FL.d)&&(!FL.st||(FL.st==='d')===isd(i))&&(!FL.q||norm(i.t+i.lec).includes(norm(FL.q))));
 const o=(o,v)=>Object.entries(o).map(([k,l])=>`<option value="${k}" ${FL.__===k?'':''}${v===k?'selected':''}>${l}</option>`).join('');
 return`<div class="card"><input placeholder="بحث..." value="${esc(FL.q)}" onchange="FL.q=this.value;render()" style="width:100%"><div class="row" style="margin-top:6px;flex-wrap:wrap"><select onchange="FL.s=this.value;render()"><option value="">كل المواد</option>${o(SUBJ,FL.s)}</select><select onchange="FL.ty=this.value;render()"><option value="">كل الأنواع</option>${o(TYPES,FL.ty)}</select><select onchange="FL.st=this.value;render()"><option value="">كل الحالات</option><option value="d" ${FL.st==='d'?'selected':''}>مكتمل</option><option value="n" ${FL.st==='n'?'selected':''}>غير مكتمل</option></select><input type="date" value="${FL.d}" onchange="FL.d=this.value;render()"></div></div><p class="m">${L.length} نتيجة (أول 100)</p><div class="card">${L.slice(0,100).map(i=>itemHTML(i,true)).join('')}</div>`}
function more(){return`<div class="card"><button style="width:100%;margin:3px 0" onclick="go('search')">🔎 بحث وفلاتر</button><button style="width:100%;margin:3px 0" onclick="go('badges')">🏆 إنجازاتي وألقابي</button><button style="width:100%;margin:3px 0" onclick="go('hist')">📜 سجل المكافآت</button><button style="width:100%;margin:3px 0" onclick="go('set')">⚙️ الإعدادات والنسخ الاحتياطي</button></div>`}
function badges(){const a=stats(ALL);const sb=['ar','en','ha','hg','pr'].map(k=>{const q=stats(ALL.filter(i=>i.s===k)),on=S.badges['sub_'+k];return`<div class="card badge ${on?'on':''}"><div class="row"><b>${BADGE[k][2]} ${BADGE[k][0]}</b><span>${q.p}%</span></div><div class="m">${BADGE[k][1]} · ${on?'اتفتح '+new Date(on).toLocaleDateString('ar-EG'):'الشرط: خلّص كل مهام '+SUBJ[k]+' ('+q.d+'/'+q.n+')'}</div></div>`}).join('');
 const w=S.badges.win;return`<div class="card badge ${w?'on':''}"><b>🏆 THE BACKLOG TERMINATOR</b><div class="m">أسطورة تصفير التراكمات · ${w?new Date(w).toLocaleDateString('ar-EG'):'الشرط: كل المواد والكتب 100% ('+a.d+'/'+a.n+')'}</div>${w?'<button class="p" onclick="go(\'cert\')">الشهادة</button>':''}</div>${sb}<div class="card"><b>معالم التقدم</b><div class="m">${[25,50,75].map(m=>(S.badges['m'+m]?'✅ ':'⬜ ')+m+'%').join(' · ')}</div></div>`}
function hist(){return`<div class="card">${S.hist.length?S.hist.map(h=>`<div class="it"><div>${h.type==='achv'?'🏅':'🎁'} ${esc(h.text)}<div class="m">${new Date(h.d).toLocaleString('ar-EG')}</div></div></div>`).join(''):'لسه مفيش سجل.'}</div>`}
function cert(){setTimeout(()=>{const c=document.getElementById('cc');if(!c)return;const x=c.getContext('2d');x.fillStyle='#fffbeb';x.fillRect(0,0,1000,700);x.strokeStyle='#b45309';x.lineWidth=10;x.strokeRect(25,25,950,650);x.fillStyle='#78350f';x.textAlign='center';x.font='bold 54px sans-serif';x.fillText('🏆 THE BACKLOG TERMINATOR',500,150);x.font='36px sans-serif';x.fillText('أسطورة تصفير التراكمات',500,215);x.font='28px sans-serif';const a=stats(ALL);x.fillText('تاريخ الإنجاز: '+new Date(S.badges.win||Date.now()).toLocaleDateString('ar-EG'),500,300);x.fillText('المهام المكتملة: '+a.d,500,350);x.fillText('ساعات الدراسة المسجّلة: '+(Object.values(S.time).reduce((p,c)=>p+c,0)/3600).toFixed(1)+' س',500,400);x.fillText(['ar','en','ha','hg','pr'].filter(k=>S.badges['sub_'+k]).map(k=>BADGE[k][2]).join(' '),500,470);x.font='24px sans-serif';x.fillText('هم ما يتلم',500,620)},0);
 return`<div class="card"><canvas id="cc" width="1000" height="700" style="width:100%"></canvas><button class="p" onclick="const c=document.getElementById('cc');const a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='certificate.png';a.click()">حفظ كصورة</button></div>`}
function set(){const s=S.set;return`<div class="card"><label><input type="checkbox" ${s.sound?'checked':''} onchange="S.set.sound=this.checked;save()"> الصوت</label><br><label>مستوى الصوت <input type="range" min="0" max="1" step=".1" value="${s.vol}" onchange="S.set.vol=+this.value;save();tone(SND.s)"></label><br><label><input type="checkbox" ${s.anim?'checked':''} onchange="S.set.anim=this.checked;save()"> الأنيميشن والكونفيتي</label><br><button onclick="tone(SND.day);burst(80,true)">جرّب الاحتفال</button></div>
<div class="card"><b>نسخة احتياطية</b><p class="m">بتشمل المهام المنجزة والملاحظات والوقت الفعلي والإنجازات والإعدادات.</p><button class="p" onclick="exp()">تصدير JSON</button> <input type="file" accept=".json" id="imp" hidden onchange="imp(this.files[0])"><button onclick="document.getElementById('imp').click()">استيراد</button></div>`}
window.exp=()=>{const b=new Blob([JSON.stringify({app:'hm-planner',version:1,exported:new Date().toISOString(),state:S})],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='hm-backup-'+today()+'.json';a.click()};
window.imp=async f=>{if(!f)return;try{const j=JSON.parse(await f.text());if(j.app!=='hm-planner'||!j.state||typeof j.state.done!=='object'||typeof j.state.notes!=='object')throw 0;const bad=Object.keys(j.state.done).some(k=>!BYID[k]);if(bad&&!confirm('الملف فيه مهام مش موجودة في الخطة الحالية وهتتجاهل. تكمل؟'))return;if(!confirm('هيتم استبدال تقدمك الحالي بالكامل بالنسخة دي. متأكد؟'))return;const n=j.state;for(const k of Object.keys(n.done))if(!BYID[k])delete n.done[k];S=Object.assign({v:1,done:{},notes:{},time:{},badges:{},hist:[],seen:[],set:S.set},n);save();alert('تم الاسترجاع ✅');render()}catch(e){alert('الملف غير صالح أو غير متوافق. ما اتغيّر حاجة.')}};
const VIEWS={home,day,cal,week,search,more,badges,hist,cert,set};
const TITLES={home:'هم ما يتلم',day:'جدول اليوم',cal:'التقويم',week:'الأسبوعي',search:'بحث وفلاتر',more:'المزيد',badges:'🏆 إنجازاتي وألقابي',hist:'سجل المكافآت',cert:'الشهادة',set:'الإعدادات'};
function render(){const a=document.activeElement;if(a&&a.tagName==='TEXTAREA')return;$('#hd').textContent=TITLES[V];$('#v').innerHTML=VIEWS[V]();const grp={search:'more',badges:'more',hist:'more',set:'more',cert:'more'}[V]||V;$('#nav').innerHTML=NAV.map(([k,e,l])=>`<a href="#" class="${grp===k?'on':''}" onclick="go('${k}');return false"><b>${e}</b>${l}</a>`).join('')}
(async()=>{await load();render();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})})();
