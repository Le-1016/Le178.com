import { store } from './store.js';
import { lookupWeather } from './weather.js';
const views=['home','map','observations','missions','drone','log'];
const labels={home:'ホーム',map:'森林マップ',observations:'観測結果',missions:'調査依頼',drone:'機体情報',log:'活動ログ'};
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=value=>new Date(value).toLocaleString('ja-JP');
const badge=value=>'<span class="badge '+e(value.toLowerCase())+'">'+e(value)+'</span>';
const link=(target,text)=>'<a class="button" href="#'+e(target)+'">'+e(text)+'</a>';
const dl=rows=>'<dl>'+rows.map(([a,b])=>'<div><dt>'+e(a)+'</dt><dd>'+e(b)+'</dd></div>').join('')+'</dl>';
let filter='ALL',busy=false;
let postal='',weather=null,weatherLoading=false,weatherError='',selectedArea='';
try {postal=localStorage.getItem('forest.postal.v1')||'';} catch {}
function weatherPanel(){
 const w=weather,c=w?.current;
 return '<section class="weather-panel '+(w?w.appearance.theme:'unconfigured')+'" aria-labelledby="weather-title"><div class="weather-art" aria-hidden="true">'+(w?w.appearance.icon:'◌')+'</div><div class="weather-content"><p class="eyebrow">LOCAL WEATHER</p><h2 id="weather-title">地域の気象情報</h2><form id="weather-form"><label for="postal">郵便番号</label><div class="postal-row"><input id="postal" name="postal" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="例：100-0001" value="'+e(postal)+'" required><button type="submit" '+(weatherLoading?'disabled':'')+'>'+(weatherLoading?'取得中…':'地域を表示')+'</button></div></form><p class="weather-status" role="status">'+e(weatherError||(weatherLoading?'地域の気象情報を取得しています。':w?'〒'+w.postal.slice(0,3)+'-'+w.postal.slice(3)+' · '+w.region:'郵便番号を設定して、地域の天気を表示します。'))+'</p>'+(w?'<div class="weather-reading"><strong>'+e(c.temperature_2m)+'<small>°C</small></strong><span>'+e(w.appearance.label)+'</span></div><div class="weather-metrics">'+[['風速',c.wind_speed_10m+' m/s'],['突風',c.wind_gusts_10m+' m/s'],['降水量',c.precipitation+' mm'],['湿度',c.relative_humidity_2m+'%']].map(([l,v])=>'<div><span>'+l+'</span><strong>'+e(v)+'</strong></div>').join('')+'</div><p class="weather-source">'+e(c.time.replace('T',' '))+' JST · 市区町村付近のモデル推定値<br>気象：<a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> · 住所：<a href="https://zipcloud.ibsnet.co.jp/" target="_blank" rel="noopener">zipcloud</a> · 位置：<a href="https://maps.gsi.go.jp/" target="_blank" rel="noopener">国土地理院</a></p>':'')+'</div></section>';
}
async function updateWeather(input){
 if(weatherLoading)return;
 postal=input;weatherLoading=true;weatherError='';weather=null;render();
 try{weather=await lookupWeather(input);postal=weather.postal;try{localStorage.setItem('forest.postal.v1',postal);}catch{}}
 catch(error){weatherError=error.name==='AbortError'?'接続がタイムアウトしました。再度お試しください。':error instanceof TypeError?'気象サービスに接続できません。通信環境を確認して再度お試しください。':error.message;}
 finally{weatherLoading=false;render();document.querySelector('#postal')?.focus();}
}
const content=document.querySelector('main');
const notice=document.querySelector('#notice');
let timer;
function notify(message){notice.textContent=message;clearTimeout(timer);timer=setTimeout(()=>notice.textContent='',7000);}
function observationCard(o){return '<article class="card"><div class="row">'+badge(o.status)+'<span class="muted">'+e(o.area_id)+'</span></div><h3>'+e(o.label)+'</h3><p class="muted">'+e(o.id)+' · '+e(date(o.captured_at))+'</p><div class="confidence"><strong>'+Math.round(o.confidence*100)+'%</strong> AI Confidence</div>'+link('observations/'+o.id,'観測詳細を見る →')+'</article>';}
function map(data){return '<div class="forest-map" aria-label="森林区画の模式図">'+data.areas.map(a=>'<div class="area" style="left:'+a.bounds.x+'%;top:'+a.bounds.y+'%;width:'+a.bounds.width+'%;height:'+a.bounds.height+'%"><span>'+e(a.id)+'<small>'+e(a.name)+'</small></span></div>').join('')+data.observations.map(o=>'<a class="marker '+e(o.status.toLowerCase())+'" style="left:'+o.position.x+'%;top:'+o.position.y+'%" href="#observations/'+e(o.id)+'" aria-label="'+e(o.id+' '+o.label)+'">'+(o.status==='NORMAL'?'●':'!')+'</a>').join('')+data.drones.map(d=>'<a class="marker drone" style="left:'+d.position.x+'%;top:'+d.position.y+'%" href="#drone" aria-label="'+e(d.id)+'">✦</a>').join('')+'<span class="north">↑ N</span><span class="map-caption">模式図 · 座標はデモ用</span></div><p class="legend">● 正常　<span>! 要確認 / 異常</span>　✦ 機体　· 地点を選択して詳細へ</p>';}
function render(){
 const {data,persistent}=store.getSnapshot();
 const [raw,id]=location.hash.slice(1).split('/');const view=views.includes(raw)?raw:'home';
 document.querySelector('nav').innerHTML=views.map(v=>'<a href="#'+v+'" '+(v===view?'aria-current="page"':'')+'><span>'+v.toUpperCase()+'</span>'+labels[v]+'</a>').join('');
 let html='<div class="page-heading"><p class="eyebrow">FOREST / '+view.toUpperCase()+'</p><h1>'+labels[view]+'</h1>'+(view==='home'?'':'<p class="muted">森林の変化を見つけ、次の観測につなげる。</p>')+'</div>';
 if(!persistent) html+='<p class="warning">ブラウザーに保存できないため、再読み込みで操作内容がリセットされます。</p>';
 if(view==='home'){
 html+=weatherPanel()+'<div class="section-title"><h2>登録した調査機</h2>'+link('drone','機体の詳細を見る')+'</div><div class="grid">'+data.drones.map(d=>'<article class="card drone-summary"><div class="row"><h3>'+e(d.id)+'</h3>'+badge(d.status)+'</div><div class="battery"><span style="width:'+d.battery_pct+'%"></span></div>'+dl([['バッテリー',d.battery_pct+'%'],['GPS',d.gps],['Jetson',d.jetson],['最終受信',date(d.last_seen_at)]])+'</article>').join('')+'</div><section class="card dispatch"><div><p class="eyebrow">FIELD REQUEST</p><h2>調査機を稼働・要請する</h2><p class="muted">機体と調査区域を選び、依頼を作成します。</p></div><form id="dispatch-form"><label for="dispatch-drone">調査機</label><select id="dispatch-drone" name="drone_id">'+data.drones.map(d=>'<option value="'+e(d.id)+'">'+e(d.id)+'</option>').join('')+'</select><label for="dispatch-area">調査区域</label><select id="dispatch-area" name="area_id">'+data.areas.map(a=>'<option value="'+e(a.id)+'" '+(a.id===selectedArea?'selected':'')+'>'+e(a.id+' · '+a.name)+'</option>').join('')+'</select><div class="dispatch-actions"><button type="submit" name="type" value="PATROL" '+(busy?'disabled':'')+'>稼働を要請（巡回）</button><button class="primary" type="submit" name="type" value="INSPECT" '+(busy?'disabled':'')+'>調査を要請</button></div><p class="muted">デモでは依頼を記録します。実機の飛行は開始しません。</p></form>'+link('missions','依頼状況を見る →')+'</section><div class="section-title"><h2>最新の観測</h2>'+link('observations','すべてを見る')+'</div><div class="grid">'+data.observations.slice(0,2).map(observationCard).join('')+'</div>';

 }
 if(view==='map') html+=map(data)+'<div class="grid">'+data.areas.map(a=>'<article class="card"><h3>'+e(a.id)+' / '+e(a.name)+'</h3>'+badge(a.health)+'</article>').join('')+'</div>';
 if(view==='observations'){
 const o=data.observations.find(o=>o.id===id);
 if(id && !o) html+='<p>観測が見つかりません。</p>'+link('observations','一覧に戻る');
 else if(o){const existing=data.missions.find(m=>m.type==='REOBSERVE'&&m.target.observation_id===o.id&&['REQUESTED','ACCEPTED','RUNNING'].includes(m.status));
 html+=link('observations','← 観測一覧')+'<div class="detail"><figure><img src="'+e(o.image_url)+'" alt="樹冠を模したデモ画像。実際の観測写真ではありません。"><figcaption>シミュレーション画像 / 実際の観測写真ではありません</figcaption></figure><article class="card">'+badge(o.status)+'<h2>'+e(o.label)+'</h2><p>'+e(o.note)+'</p><div class="confidence"><strong>'+Math.round(o.confidence*100)+'%</strong> AI Confidence</div>'+dl([['Observation',o.id],['Area',o.area_id],['Drone',o.drone_id],['観測時刻',date(o.captured_at)],['緯度 / 経度',o.position.lat+' / '+o.position.lng]])+'<p class="muted">再観測条件：高度上限20m / ジオフェンス必須</p><button class="primary" data-reobserve="'+e(o.id)+'" '+(busy||existing?'disabled':'')+'>'+(existing?'再観測依頼済み · '+e(existing.id):busy?'作成中…':'再観測を依頼する')+'</button>'+link('missions','Mission一覧を見る')+'</article></div>';}
 else html+='<label class="filter">状態 <select id="filter">'+['ALL','NORMAL','REVIEW','ANOMALY'].map(s=>'<option '+(s===filter?'selected':'')+'>'+s+'</option>').join('')+'</select></label><div class="grid">'+data.observations.filter(o=>filter==='ALL'||o.status===filter).map(observationCard).join('')+'</div>';
 }
 if(view==='missions') html+='<p class="muted">REQUESTEDは依頼の作成状態です。実機は自動で飛行しません。</p><div class="grid">'+[...data.missions].reverse().map(m=>'<article class="card"><div class="row"><h2>'+e(m.id)+'</h2>'+badge(m.status)+'</div><h3>'+e(m.type)+'</h3>'+dl([['区域',m.target.area_id],['調査機',m.drone_id||'未指定'],['対象観測',m.target.observation_id||'区域巡回'],['理由',m.reason],['高度上限',m.constraints.max_altitude_m+' m'],['ジオフェンス',m.constraints.geofence_required?'必須':'任意'],['作成時刻',date(m.created_at)]])+(m.target.observation_id?link('observations/'+m.target.observation_id,'対象の観測を見る'):'')+'</article>').join('')+'</div>';
 if(view==='drone') html+='<div class="grid">'+data.drones.map(d=>'<article class="card"><p class="eyebrow">SURVEY VEHICLE</p><h2>'+e(d.id)+'</h2>'+badge(d.status)+'<div class="battery"><span style="width:'+d.battery_pct+'%"></span></div>'+dl([['バッテリー',d.battery_pct+'%'],['GPS',d.gps],['Jetson',d.jetson],['高度',d.altitude_m+' m'],['緯度 / 経度',d.position.lat+' / '+d.position.lng],['最終受信',date(d.last_seen_at)]])+'<p class="muted">サンプルの機体テレメトリーです。</p></article>').join('')+'</div>';
 if(view==='log') html+='<div class="timeline">'+data.logs.map(l=>'<article class="card"><p class="eyebrow">'+e(l.event)+'</p><h3>'+e(l.message)+'</h3><p class="muted">'+e(date(l.time))+' · '+e(l.id)+'</p>'+(l.mission_id?link('missions',l.mission_id+'を確認'):'')+'</article>').join('')+'</div>';
 content.innerHTML=html;
}
content.addEventListener('input',event=>{if(event.target.id==='postal')postal=event.target.value;});
content.addEventListener('submit',async event=>{
 if(event.target.id==='weather-form'){event.preventDefault();updateWeather(new FormData(event.target).get('postal'));return;}
 if(event.target.id!=='dispatch-form')return;event.preventDefault();if(busy)return;
 const form=new FormData(event.target);const type=event.submitter?.value||'INSPECT';const drone=form.get('drone_id');selectedArea=form.get('area_id');busy=true;render();
 try{const result=await store.requestDispatch({type,drone_id:drone,area_id:selectedArea});notify(result.duplicate?'依頼済みです：'+result.mission.id:result.mission.id+' を作成し、LOGに記録しました。');}
 catch(error){notify(error.message);}finally{busy=false;render();document.querySelector('#dispatch-area')?.focus();}
});
content.addEventListener('change',event=>{if(event.target.id==='filter'){filter=event.target.value;render();}});
content.addEventListener('click',async event=>{const button=event.target.closest('[data-reobserve]');if(!button||busy)return;busy=true;render();try{const result=await store.requestReobserve(button.dataset.reobserve);notify(result.duplicate?'既存の依頼 '+result.mission.id+' を確認してください。':result.mission.id+' を作成し、LOGに記録しました。');}catch(error){notify(error.message);}finally{busy=false;render();document.querySelector('[data-reobserve]')?.focus();}});
window.addEventListener('hashchange',()=>{render();content.focus();window.scrollTo(0,0);});
store.subscribe(render);
try{await store.init();render();if(postal)updateWeather(postal);}catch{content.textContent='読み込みに失敗しました。ページを再読み込みしてください。';}