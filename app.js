(function(){
  // ============ CONFIGURACIÓN ============
  var MW=30,N=18,DH=108,RH=240,LEFT=34,TOP_PAD=50,MAXC=5,W=LEFT+N*MW+40;
  var cfg={mono:true,rows:2,elec:'basica',igaAmps:25},PLACED=[],seq=1,PHASE={},LOADS=[0,0,0];
  var isMobile = window.matchMedia('(max-width:820px), (pointer: coarse)').matches;

  function C(id,name,amps,sect,color,watts,cs,cu,own,pol){
    pol=pol||2;
    return{id:id,lab:id.toUpperCase(),name:name,mods:pol,pol:pol,amps:amps,sect:sect,color:color,watts:watts,cs:cs,cu:cu,own:!!own};
  }
  var C_TYPES={
    c1:C('c1','C1 Alumbrado',10,'1.5','#c2372f',2300,.75,.5),
    c2:C('c2','C2 Tomas generales y frigorífico',16,'2.5','#c06a1d',3450,.2,.25),
    c3:C('c3','C3 Cocina y horno',25,'6','#2b7fa8',5400,.5,.75),
    c4:C('c4','C4 Lavadora, lavavajillas y termo',20,'4','#245f8c',3450,.66,.75),
    c5:C('c5','C5 Tomas baño y cocina',16,'2.5','#7B4B2A',3450,.4,.5)};
  var C_ELEVATED={
    c6:C('c6','C6 Alumbrado adicional',10,'1.5','#9c2a23',2300,.75,.5),
    c7:C('c7','C7 Tomas adicionales',16,'2.5','#985215',3450,.2,.25),
    c8:C('c8','C8 Calefacción',25,'6','#1e6283',5750,1,1),
    c9:C('c9','C9 Aire acondicionado',25,'6','#1a4a70',5750,1,1),
    c10:C('c10','C10 Secadora',16,'2.5','#5a4a42',3450,.75,.75),
    c11:C('c11','C11 Automatización/seguridad',10,'1.5','#3d3d40',2300,.5,.5),
    c12:C('c12','C12 Adicional (tipo C5)',16,'2.5','#6a5a2a',3450,.4,.5),
    c13:C('c13','C13 Recarga VE (RCD exclusivo)',32,'6','#b3891d',7360,1,1,true),
    c3t:C('c3t','C3 Cocina trifásica',25,'6','#2b7fa8',5400,.5,.75,false,4),
    c8t:C('c8t','C8 Calefacción trifásica',25,'6','#1e6283',5750,1,1,false,3),
    c9t:C('c9t','C9 Aire acondicionado trifásico',25,'6','#1a4a70',5750,1,1,false,3),
    c13t:C('c13t','C13 Recarga VE trifásica (RCD exclusivo)',32,'6','#b3891d',22080,1,1,true,4),
    c4a:C('c4a','C4.1 Lavadora',16,'2.5','#245f8c',3450,.66,.75),
    c4b:C('c4b','C4.2 Lavavajillas',16,'2.5','#2b6f9c',3450,.66,.75),
    c4c:C('c4c','C4.3 Termo eléctrico',16,'2.5','#1f5478',3450,.66,.75),
    rsv:C('rsv','Reserva / auxiliar',16,'2.5','#777777',0,1,1)
  };
  C_ELEVATED.c4a.lab='C4.1';C_ELEVATED.c4b.lab='C4.2';C_ELEVATED.c4c.lab='C4.3';C_ELEVATED.rsv.lab='RES';
  C_ELEVATED.c3t.lab='C3T';C_ELEVATED.c8t.lab='C8T';C_ELEVATED.c9t.lab='C9T';C_ELEVATED.c13t.lab='C13T';

  var WCOL={L1:'#7B4B2A',L2:'#232329',L3:'#8d9096',N:'#1f5fae',PE:'#43a047'};
  var wrap=document.getElementById('railwrap'),pal=document.getElementById('pal-mobile'),palDesk=document.getElementById('pal-desktop');
  function T(t){return C_TYPES[t]||C_ELEVATED[t];}
  function allowed(t){return !!(C_TYPES[t]||(cfg.elec==='elevada'&&C_ELEVATED[t]));}
  function P(){return cfg.mono?2:4;}
  function conds(){return cfg.mono?[WCOL.N,WCOL.L1]:[WCOL.N,WCOL.L1,WCOL.L2,WCOL.L3];}
  function rowOf(s){return (s/N)|0;}
  function rcdA(){return cfg.igaAmps<=25?25:40;}
  function px(slot,pi){return LEFT+(slot%N+pi)*MW+MW/2;}
  function yT(r){return r*RH+TOP_PAD+15;} function yB(r){return r*RH+TOP_PAD+93;}
  function rcdSlot(r){return r?r*N:2*P();}
  function isFixedSlot(s,m){var si=s%N;if(si+m>N)return true;return si<(rowOf(s)?P():3*P());}
  function rowCircs(r,ign){return PLACED.filter(function(c){return rowOf(c.slot)===r&&c.id!==ign;});}
  function usedRows(){var a=[0];for(var r=1;r<cfg.rows;r++)if(rowCircs(r).length)a.push(r);return a;}
  function ok(s,t,ign){
    var it=T(t);
    if(s<0||s+it.mods>cfg.rows*N||isFixedSlot(s,it.mods))return false;
    for(var i=0;i<PLACED.length;i++){var p=PLACED[i];if(p.id===ign)continue;if(p.slot<s+it.mods&&s<p.slot+T(p.type).mods)return false;}
    var rc=rowCircs(rowOf(s),ign);
    if(it.own&&rc.length)return false;
    if(rc.some(function(c){return T(c.type).own;}))return false;
    return rc.length<MAXC;
  }
  function firstFit(t){for(var s=0;s<cfg.rows*N-1;s++)if(ok(s,t,-1))return s;return -1;}
  function refit(){var old=PLACED.slice().sort(function(a,b){return a.slot-b.slot;});PLACED=[];
    old.forEach(function(b){if(!allowed(b.type))return;var s=ok(b.slot,b.type,-1)?b.slot:firstFit(b.type);if(s>=0){b.slot=s;PLACED.push(b);}});}
  function assignPhases(){
    LOADS=[0,0,0];PHASE={};
    PLACED.slice().sort(function(a,b){return T(b.type).watts-T(a.type).watts;}).forEach(function(c){
      var it=T(c.type);
      if(cfg.mono||it.pol===2){
        var k=cfg.mono?0:LOADS.indexOf(Math.min.apply(null,LOADS));
        PHASE[c.id]=k;LOADS[k]+=it.watts;
      }else{
        var w=it.watts/3;LOADS[0]+=w;LOADS[1]+=w;LOADS[2]+=w;PHASE[c.id]=-1;
      }
    });
  }

  // ============ CABLEADO ============
  function wire(d,c,t){t=t||3.5;var a=' fill="none" stroke-linecap="round" stroke-linejoin="round"';
    return '<path d="'+d+'" stroke="#fff" stroke-width="'+(t+3)+'"'+a+'/><path d="'+d+'" stroke="'+c+'" stroke-width="'+t+'"'+a+'/>';
  }
  function pe(d,t){t=t||3.5;return wire(d,WCOL.PE,t)+'<path d="'+d+'" stroke="#e6c200" stroke-width="'+t+'" stroke-dasharray="5 5" fill="none"/>';}
  function hh(){return cfg.rows*RH+30;}

  function wiresSVG(){
    var Pn=P(),NI=Pn-1,CD=conds(),s='',rows=usedRows(),last=rows[rows.length-1],xe=LEFT+N*MW,xp=xe+24,yb=last*RH+234,yMin=1e9,i;
    rows.forEach(function(r){var it=[];
      if(!r)it.push({x:LEFT+Pn*MW+Pn*MW/2,pcs:1});
      rowCircs(r).sort(function(a,b){return a.slot-b.slot;}).forEach(function(b){it.push({x:LEFT+(b.slot%N+1)*MW});});
      it.forEach(function(q,k){var y=r*RH+182+4*k;yMin=Math.min(yMin,y);
        s+=pe('M'+xp+' '+y+' H '+q.x+' V '+(q.pcs?r*RH+152:r*RH+210),2.5);});
    });
    s+=pe('M'+xp+' '+yb+' V '+yMin,3.5);
    s+='<rect x="'+LEFT+'" y="'+(yb-3.5)+'" width="'+(xp+10-LEFT)+'" height="7" rx="2" fill="#3b8f3b" stroke="#2a6a2a"/>';
    for(i=LEFT+8;i<xp+8;i+=14)s+='<circle cx="'+i+'" cy="'+yb+'" r="2.4" fill="#d8d4cb"/>';
    s+=pe('M'+(LEFT+10)+' '+yb+' V '+(hh()-14),3.5)+'<text x="'+(LEFT+16)+'" y="'+(hh()-4)+'" font-size="9" fill="#555">Tierra general</text>';
    function link(a,t,r){var bx=LEFT+(t%N)*MW;
      for(var i=0;i<Pn;i++){var xr=bx+((Pn-1)/2-i)*5;
        s+=wire('M'+px(a,i)+' '+yB(r)+' V '+(r*RH+162+(NI-i)*4)+' H '+xr+' V '+(r*RH+6+(NI-i)*6)+' H '+px(t,i)+' V '+yT(r),CD[i],3);}
    }
    link(0,Pn,0);link(0,2*Pn,0);
    rows.forEach(function(r){if(!r)return;
      for(var i=0;i<Pn;i++)s+=wire('M'+px(0,i)+' '+yB(0)+' V '+(178+i*4)+' H '+(4+i*6)+' V '+(r*RH+6+(NI-i)*6)+' H '+px(r*N,i)+' V '+yT(r),CD[i],3);});
    rows.forEach(function(r){
      var rc=rowCircs(r),sr=rcdSlot(r),bx=LEFT+(sr%N+Pn)*MW,dr=[];
      rc.forEach(function(b){
        var it=T(b.type);
        if(it.pol===2){
          dr.push({i:0,x:px(b.slot,0)},{i:1,x:px(b.slot,1)});
          s+=wire('M'+px(b.slot,0)+' '+yB(r)+' V '+(r*RH+226),CD[0],3);
          s+=wire('M'+px(b.slot,1)+' '+yB(r)+' V '+(r*RH+226),CD[1],3);
        }else if(it.pol===3){
          dr.push({i:1,x:px(b.slot,0)},{i:2,x:px(b.slot,1)},{i:3,x:px(b.slot,2)});
          s+=wire('M'+px(b.slot,0)+' '+yB(r)+' V '+(r*RH+226),CD[1],3);
          s+=wire('M'+px(b.slot,1)+' '+yB(r)+' V '+(r*RH+226),CD[2],3);
          s+=wire('M'+px(b.slot,2)+' '+yB(r)+' V '+(r*RH+226),CD[3],3);
        }else{
          dr.push({i:0,x:px(b.slot,0)},{i:1,x:px(b.slot,1)},{i:2,x:px(b.slot,2)},{i:3,x:px(b.slot,3)});
          s+=wire('M'+px(b.slot,0)+' '+yB(r)+' V '+(r*RH+226),CD[0],3);
          s+=wire('M'+px(b.slot,1)+' '+yB(r)+' V '+(r*RH+226),CD[1],3);
          s+=wire('M'+px(b.slot,2)+' '+yB(r)+' V '+(r*RH+226),CD[2],3);
          s+=wire('M'+px(b.slot,3)+' '+yB(r)+' V '+(r*RH+226),CD[3],3);
        }
      });
      for(var i=0;i<Pn;i++){
        var xs=dr.filter(function(q){return q.i===i;}).map(function(q){return q.x;});
        if(!xs.length)continue;
        var xr=bx+((Pn-1)/2-i)*5,yt=r*RH+6+(NI-i)*6;
        s+=wire('M'+px(sr,i)+' '+yB(r)+' V '+(r*RH+162+(NI-i)*4)+' H '+xr+' V '+yt+' H '+Math.max.apply(null,xs),CD[i],3);
        xs.forEach(function(x){s+=wire('M'+x+' '+yt+' V '+yT(r),CD[i],2.5);});
      }
      rc.forEach(function(b){
        var it=T(b.type);
        s+='<rect x="'+(px(b.slot,0)-8)+'" y="'+(r*RH+210)+'" width="'+(it.mods*MW-14)+'" height="16" rx="3" fill="#bdbdbd" stroke="#8a8a8a"/>';
      });
    });
    for(i=0;i<Pn;i++)s+=wire('M'+px(0,i)+' 0 V '+yT(0),CD[i],4);
    return s;
  }

  // ============ APARAMENTA ============
  function screw(cx,cy){return '<circle cx="'+cx+'" cy="'+cy+'" r="3.4" fill="#d8d4cb" stroke="#b3afa6"/><path d="M'+(cx-2)+' '+cy+'h4M'+cx+' '+(cy-2)+'v4\" stroke=\"#8f8b83\"/>';}
  function devSVG(mods,col,cs,mw,mh,tst,lbl){
    var w=mw*mods,h=mh,bw=w-4,bh=h-6,s='<rect x="2" y="3" width="'+bw+'" height="'+bh+'" rx="3" fill="#f1efe9" stroke="#d0cdc4"/>',i;
    for(i=1;i<mods;i++)s+='<line x1="'+(2+bw/mods*i)+'" y1="5" x2="'+(2+bw/mods*i)+'" y2="'+(1+bh)+'" stroke="#dcd8cf"/>';
    for(i=0;i<mods;i++)s+=screw(2+bw/mods*i+bw/mods/2,15)+screw(2+bw/mods*i+bw/mods/2,bh-9);
    s+='<rect x="6" y="'+(bh*0.38+3)+'" width="'+(bw-8)+'" height="'+(bh*0.3)+'" rx="2\" fill=\"'+col+'\" stroke=\"'+cs+'\"/>';
    if(tst)s+='<rect x="'+(bw-13)+'" y=\"23\" width=\"11\" height=\"9\" rx=\"1.5\" fill=\"#9d998f\"/><rect x=\"'+(bw-13)+'\" y=\"37\" width=\"7\" height=\"7\" rx=\"1\" fill=\"#aba79e\"/>';
    if(lbl)s+='<text x=\"'+(w/2)+'\" y=\"'+(bh*0.53+3)+'\" font-size=\"8\" text-anchor=\"middle\" fill=\"#fff\" font-weight=\"bold\">'+lbl+'</text>';
    return '<svg width=\"'+w+'\" height=\"'+h+'\">'+s+'</svg>';
  }
  function railSVG(){var s='';for(var r=0;r<cfg.rows;r++)s+='<rect x="'+(LEFT-6)+'" y="'+(r*RH+TOP_PAD+60)+'" width="'+(N*MW+12)+'" height="16" rx="2" fill="#cdcac2"/>';return s;}
  function setHeights(){
    var H=hh();
    ['railbase','wires','railbase-m','wires-m'].forEach(function(id){
      var e=document.getElementById(id); if(!e) return;
      e.setAttribute('width',W); e.setAttribute('height',H); e.setAttribute('viewBox','0 0 '+W+' '+H);
    });
    var rail = wrap; rail.style.height=H+'px';
    ['railwrap-desktop'].forEach(function(id){ var e=document.getElementById(id); if(e) e.style.height=H+'px'; });
    ['wires','wires-m'].forEach(function(id){ var e=document.getElementById(id); if(e) e.style.zIndex=15; });
    ['railwrap','railwrap-desktop'].forEach(function(id){ var e=document.getElementById(id); if(e) e.style.width=W+'px'; });
  }
  function dragify(el,b){
    if(isMobile) return;
    var sx=0,oL=0,oS=0,mv=false;
    el.addEventListener('pointerdown',function(e){if(e.target.closest('.del'))return;sx=e.clientX;oL=parseFloat(el.style.left);oS=b.slot;mv=false;el.setPointerCapture(e.pointerId);el.classList.add('drag');});
    el.addEventListener('pointermove',function(e){if(!el.classList.contains('drag'))return;var dx=e.clientX-sx;if(Math.abs(dx)>3)mv=true;el.style.left=(oL+dx)+'px';});
    el.addEventListener('pointerup',function(e){el.classList.remove('drag');
      if(!mv){el.style.left=(LEFT+(oS%N)*MW)+'px';return;}
      var ns=Math.round(oS+(e.clientX-sx)/MW);if(ok(ns,b.type,b.id))b.slot=ns;render();});
  }

  function mkDev(b,fixed,container){
    var d=document.createElement('div'),Pn=P(),m,art,l1,l2,it,suf;d.className='dev'+(fixed?' fix':'');
    if(b.type==='iga'){m=Pn;art=devSVG(m,'#3d3d40','#242428',MW,DH,false,'');l1='IGA';l2=cfg.igaAmps+'A '+(cfg.mono?'2P':'4P');}
    else if(b.type==='pcs'){m=Pn;art=devSVG(m,'#6b6b6b','#4a4a4a',MW,DH,false,'');l1='PCS';l2='Tipo 2';}
    else if(b.type==='rcd'){m=Pn;art=devSVG(m,'#b3891d','#8a6813',MW,DH,true,'');l1=(b.ex?40:rcdA())+'A';l2='30mA '+(b.ex?'A-SI/B':'Tipo A');}
    else{
      it=T(b.type);m=it.pol;
      art=devSVG(m,it.color,it.color,MW,DH,false,'');
      l1=it.lab;
      if(cfg.mono) suf='';
      else if(it.pol===3) suf=' · 3P';
      else if(it.pol===4) suf=' · 3P+N';
      else suf=' · L'+(PHASE[b.id]+1);
      l2=it.amps+'A'+suf;
      d.title=it.name+' · '+it.amps+' A · '+it.sect+' mm² · '+it.pol+'P';
    }
    d.style.left=(LEFT+(b.slot%N)*MW)+'px';d.style.top=(rowOf(b.slot)*RH+TOP_PAD)+'px';d.style.width=(m*MW)+'px';
    d.innerHTML=art+(fixed?'':'<button class=\"del\"><svg width=\"10\" height=\"10\"><path d=\"M1.5 1.5l7 7M8.5 1.5l-7 7\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg></button>')+'<div class=\"circ-lbl\"><div class=\"nm\">'+l1+'</div>'+l2+'</div>';
    if(!fixed){d.querySelector('.del').onclick=function(e){e.stopPropagation();PLACED=PLACED.filter(function(q){return q.id!==b.id;});render();};dragify(d,b);}
    (container||wrap).appendChild(d);
  }

  function render(){
    assignPhases();
    var rails = document.querySelectorAll('[id^="railbase"]');
    rails.forEach(function(r){ r.innerHTML = railSVG(); });
    var ws = document.querySelectorAll('[id^="wires"]');
    ws.forEach(function(w){ w.innerHTML = wiresSVG(); });
    document.querySelectorAll('.dev').forEach(function(e){e.remove();});
    var Pn=P(),rows=usedRows(),ch=document.getElementById('chips'),chM=document.querySelector('[data-out="chips"]');

    var rd = document.getElementById('railwrap-desktop');
    mkDev({type:'iga',slot:0},true,rd); mkDev({type:'pcs',slot:Pn},true,rd);
    rows.forEach(function(r){mkDev({type:'rcd',slot:rcdSlot(r),ex:rowCircs(r).some(function(c){return T(c.type).own;})},true,rd);});
    PLACED.forEach(function(b){mkDev(b,false,rd);});

    var rm = document.getElementById('railwrap');
    mkDev({type:'iga',slot:0},true,rm); mkDev({type:'pcs',slot:Pn},true,rm);
    rows.forEach(function(r){mkDev({type:'rcd',slot:rcdSlot(r),ex:rowCircs(r).some(function(c){return T(c.type).own;})},true,rm);});
    PLACED.forEach(function(b){mkDev(b,false,rm);});

    var wT=0,uM=Pn*2+rows.length*Pn;
    PLACED.forEach(function(b){var it=T(b.type);wT+=it.watts*it.cs*it.cu;uM+=it.mods;});wT=Math.round(wT);
    var wM=cfg.mono?230*cfg.igaAmps:Math.round(Math.sqrt(3)*400*cfg.igaAmps),pct=Math.round(wT/wM*100);

    setAll('[id="pct"], [data-out="pct"]', pct);
    setAll('[id="used"], [data-out="used"]', uM);
    setAll('[id="tot"], [data-out="tot"]', cfg.rows*N);

    var fills = document.querySelectorAll('#fill, [data-out="fill"]');
    fills.forEach(function(f){ f.style.width=Math.min(pct,100)+'%'; f.classList.toggle('warn',pct>100); });

    var chipsHTML='';
    function chip(t,bad){chipsHTML+='<span class="chip"'+(bad?' style="color:#c2372f;font-weight:bold;"':'')+'>'+t+'</span>';}
    if(pct>100)chip('⚠️ Previsión '+wT+' W &gt; IGA '+wM+' W',1);
    if(cfg.elec==='elevada'&&cfg.igaAmps<40)chip('⚠️ Electrificación elevada: IGA mín. 40 A (9200 W)',1);
    if(cfg.mono&&PLACED.some(function(b){return T(b.type).pol>2;}))chip('⚠️ Hay circuitos trifásicos en una instalación monofásica',1);
    function has(t){return PLACED.some(function(b){return b.type===t;});}
    var miss=['c1','c2','c3','c4','c5'].filter(function(t){return t==='c4'?!(has('c4')||(has('c4a')&&has('c4b')&&has('c4c'))):!has(t);});
    if(PLACED.length&&miss.length)chip('⚠️ Faltan circuitos mínimos: '+miss.map(function(t){return t.toUpperCase();}).join(', '),1);
    chip('RCD 30 mA: <b>'+rows.length+'</b> (máx. '+MAXC+' circuitos c/u)');
    var counts={};PLACED.forEach(function(b){counts[b.type]=(counts[b.type]||0)+1;});
    Object.keys(counts).forEach(function(t){chip(T(t).lab+' <b>&times;'+counts[t]+'</b>');});

    if(ch)ch.innerHTML=chipsHTML;
    if(chM)chM.innerHTML=chipsHTML;
  }
  function setAll(sel,val){document.querySelectorAll(sel).forEach(function(e){e.textContent=val;});}

  function buildPalette(){
    pal.innerHTML='';palDesk.innerHTML='';
    var list=cfg.elec==='basica'?C_TYPES:Object.assign({},C_TYPES,C_ELEVATED);
    Object.keys(list).forEach(function(t){
      var it=list[t];
      if(cfg.mono&&it.pol>2)return;
      var html=devSVG(it.mods,it.color,it.color,18,50,false,'')+'<span class=\"nm\"><b>'+it.lab+'</b>'+it.amps+'A · '+it.sect+'mm²</span>';
      var b1=document.createElement('button');b1.title=it.name+' · '+it.sect+' mm² · '+it.pol+'P';b1.innerHTML=html;b1.onclick=function(){add(t);};palDesk.appendChild(b1);
      var b2=document.createElement('button');b2.title=it.name+' · '+it.sect+' mm² · '+it.pol+'P';b2.innerHTML=html;b2.onclick=function(){add(t);};pal.appendChild(b2);
    });
  }
  function add(t){var s=firstFit(t);
    if(s<0){var f=document.getElementById('fill');if(f){f.classList.add('warn');setTimeout(function(){render();},600);}return;}
    PLACED.push({id:seq++,type:t,slot:s});render();
    if(isMobile){var d=document.getElementById('drawer');if(d)d.classList.remove('open');}
  }

  // ============ ESQUEMA UNIFILAR ============
  function unifilarSVG(){
    var Pn=P(),rows=usedRows(),groups=rows.map(function(r){
      var cs=rowCircs(r).sort(function(a,b){return a.slot-b.slot;});
      return {ex:cs.some(function(c){return T(c.type).own;}),circs:cs};});
    var CW=80, GAP=30, MX=30;
    var Y_INFO=20, INFO_H=70, Y_ARR=100, Y_IGA=118, Y_BUS=185, Y_RCD=215, Y_SUB=270, Y_CT=290;
    var Y_LABEL=Y_CT+18+150;
    var totalH=Y_LABEL+38;
    var gw=groups.map(function(g){return Math.max(CW,g.circs.length*CW);});
    var xStart=200, xCur=xStart, centers=[], i;
    for(i=0;i<gw.length;i++){centers.push(xCur+gw[i]/2);xCur+=gw[i]+GAP;}
    var totalW=Math.max(xCur+MX,720);
    var xIga=120, xPcs=210, s='';
    s+='<rect x="0" y="0" width="'+totalW+'" height="'+totalH+'" fill="#fff" stroke="#222" stroke-width="2"/>';
    s+='<rect x="5" y="5" width="'+(totalW-10)+'" height="'+(totalH-10)+'" fill="none" stroke="#222" stroke-width="0.6"/>';
    s+='<rect x="'+MX+'" y="'+Y_INFO+'" width="150" height="'+INFO_H+'" fill="#fff" stroke="#222" stroke-width="1.4"/>';
    s+='<text x="'+(MX+6)+'" y="'+(Y_INFO+14)+'" font-size="9.5" font-weight="bold" fill="#222">CUADRO VIVIENDA</text>';
    s+='<text x="'+(MX+6)+'" y="'+(Y_INFO+28)+'" font-size="8.5" fill="#444">ELECTRIFICACIÓN '+(cfg.elec==='elevada'?'ELEVADA':'BÁSICA')+'</text>';
    s+='<text x="'+(MX+6)+'" y="'+(Y_INFO+42)+'" font-size="8.5" fill="#444">'+(cfg.mono?'MONOFÁSICA 230 V':'TRIFÁSICA 400 V')+'</text>';
    s+='<text x="'+(MX+6)+'" y="'+(Y_INFO+56)+'" font-size="8.5" fill="#444">IGA '+cfg.igaAmps+' A · '+groups.length+' RCD 30 mA</text>';
    s+='<rect x="'+(MX+160)+'" y="'+Y_INFO+'" width="280" height="'+INFO_H+'" fill="#fff" stroke="#222" stroke-width="1.4"/>';
    s+='<text x="'+(MX+166)+'" y="'+(Y_INFO+14)+'" font-size="9.5" font-weight="bold" fill="#222">DERIVACIÓN INDIVIDUAL</text>';
    s+='<text x="'+(MX+166)+'" y="'+(Y_INFO+28)+'" font-size="8.5" fill="#444">'+(cfg.mono?'2 x 10 + 10/TT mm² Cu':'4 x 10 + 10/TT mm² Cu')+'</text>';
    s+='<text x="'+(MX+166)+'" y="'+(Y_INFO+42)+'" font-size=\"8.5\" fill=\"#444\">Tubo Ø 32 mm · Longitud 15 m</text>';
    s+='<text x="'+(MX+166)+'" y="'+(Y_INFO+56)+'" font-size="8.5" fill="#444">ITC-BT-15 · caída tensión &lt; 1,5 %</text>';
    s+='<polygon points="'+(xIga-5)+','+(Y_ARR-10)+' '+(xIga+5)+','+(Y_ARR-10)+' '+xIga+','+(Y_ARR+2)+'" fill="#222"/>';
    s+='<line x1="'+xIga+'" y1="'+Y_ARR+'" x2="'+xIga+'" y2="'+Y_IGA+'" stroke="#222" stroke-width="1.8"/>';
    s+='<rect x="'+(xIga-30)+'" y="'+Y_IGA+'" width="60" height="30" rx="2" fill="#e8e5dc" stroke="#222" stroke-width="1.4"/>';
    s+='<line x1="'+(xIga-24)+'" y1="'+(Y_IGA+24)+'" x2="'+(xIga+24)+'" y2="'+(Y_IGA+6)+'" stroke="#222" stroke-width="1.4"/>';
    s+='<text x="'+xIga+'" y="'+(Y_IGA-22)+'" font-size="7" text-anchor="middle" fill="#666">INTERRUPTOR GENERAL</text>';
    s+='<text x="'+xIga+'" y="'+(Y_IGA-12)+'" font-size="7" text-anchor="middle" fill="#666">AUTOMÁTICO</text>';
    s+='<text x="'+xIga+'" y="'+(Y_IGA-1)+'" font-size="11" font-weight="bold" text-anchor="middle" fill="#222">IGA</text>';
    s+='<text x="'+xIga+'" y="'+(Y_IGA+44)+'" font-size="8.5" text-anchor="middle" fill="#444">'+cfg.igaAmps+' A · '+Pn+'P</text>';
    s+='<rect x="'+(xPcs-28)+'" y="'+Y_IGA+'" width="56" height="30" rx="2" fill="#f5f5f5" stroke="#222" stroke-width="1.4"/>';
    s+='<line x1="'+xPcs+'" y1="'+(Y_IGA+5)+'" x2="'+xPcs+'" y2="'+(Y_IGA+13)+'" stroke="#222" stroke-width="1.4"/>';
    s+='<polygon points="'+(xPcs-5)+','+(Y_IGA+13)+' '+(xPcs+5)+','+(Y_IGA+13)+' '+xPcs+','+(Y_IGA+23)+'" fill="#222"/>';
    s+='<text x="'+xPcs+'" y="'+(Y_IGA-22)+'" font-size="7" text-anchor="middle" fill="#666">PROTECCIÓN</text>';
    s+='<text x="'+xPcs+'" y="'+(Y_IGA-12)+'" font-size="7" text-anchor="middle" fill="#666">SOBRETENSIÓN</text>';
    s+='<text x="'+xPcs+'" y="'+(Y_IGA-1)+'" font-size="10" font-weight="bold" text-anchor="middle" fill="#222">PCS</text>';
    s+='<text x="'+xPcs+'" y="'+(Y_IGA+44)+'" font-size="8.5" text-anchor="middle" fill="#444">Tipo 2 · 4,5 kA</text>';
    s+='<line x1="'+xIga+'" y1="'+(Y_IGA+30)+'" x2="'+xIga+'" y2="'+Y_BUS+'" stroke="#222" stroke-width="2"/>';
    s+='<line x1="'+xPcs+'" y1="'+(Y_IGA+30)+'" x2="'+xPcs+'" y2="'+Y_BUS+'" stroke="#222" stroke-width="1.4"/>';
    s+='<line x1="'+xIga+'" y1="'+Y_BUS+'" x2="'+(totalW-MX)+'" y2="'+Y_BUS+'" stroke="#222" stroke-width="2"/>';
    s+='<circle cx="'+xIga+'" cy="'+Y_BUS+'" r="3" fill="#222"/>';
    groups.forEach(function(g,gi){
      var xRcd=centers[gi], xGStart=xRcd-gw[gi]/2;
      s+='<circle cx="'+xRcd+'\" cy=\"'+Y_BUS+'\" r=\"3\" fill=\"#222\"/>';
      s+='<line x1=\"'+xRcd+'\" y1=\"'+Y_BUS+'\" x2=\"'+xRcd+'\" y2=\"'+Y_RCD+'\" stroke=\"#222\" stroke-width=\"1.8\"/>';
      s+='<rect x=\"'+(xRcd-34)+'\" y=\"'+Y_RCD+'\" width=\"68\" height=\"34\" rx=\"2\" fill=\"#fdf5e0\" stroke=\"#8a6813\" stroke-width=\"1.6\"/>';
      s+='<line x1=\"'+(xRcd-28)+'\" y1=\"'+(Y_RCD+28)+'\" x2=\"'+(xRcd+28)+'\" y2=\"'+(Y_RCD+6)+'\" stroke=\"#8a6813\" stroke-width=\"1.6\"/>';
      s+='<ellipse cx=\"'+xRcd+'\" cy=\"'+(Y_RCD+17)+'\" rx=\"11\" ry=\"5\" fill=\"none\" stroke=\"#8a6813\" stroke-width=\"1.4\"/>';
      s+='<text x=\"'+xRcd+'\" y=\"'+(Y_RCD-18)+'\" font-size=\"7\" text-anchor=\"middle\" fill=\"#666\">INTERRUPTOR DIFERENCIAL II</text>';
      s+='<text x=\"'+xRcd+'\" y=\"'+(Y_RCD-6)+'\" font-size=\"9\" font-weight=\"bold\" text-anchor=\"middle\" fill=\"#8a6813\">RCD'+(gi+1)+'</text>';
      s+='<text x=\"'+xRcd+'\" y=\"'+(Y_RCD+48)+'\" font-size=\"8\" text-anchor=\"middle\" fill=\"#444\">'+(g.ex?'40 A · 30 mA A-SI/B':rcdA()+' A · 30 mA Clase AC')+'</text>';
      var n=g.circs.length; if(!n)return;
      s+='<line x1=\"'+xRcd+'\" y1=\"'+(Y_RCD+34)+'\" x2=\"'+xRcd+'\" y2=\"'+Y_SUB+'\" stroke=\"#222\" stroke-width=\"1.8\"/>';
      var xF=xGStart+CW/2, xL=xGStart+(n-1)*CW+CW/2;
      s+='<line x1=\"'+xF+'\" y1=\"'+Y_SUB+'\" x2=\"'+xL+'\" y2=\"'+Y_SUB+'\" stroke=\"#222\" stroke-width=\"1.8\"/>';
      s+='<circle cx=\"'+xRcd+'\" cy=\"'+Y_SUB+'\" r=\"3\" fill=\"#222\"/>';
      g.circs.forEach(function(c,j){
        var xC=xF+j*CW, it=T(c.type);
        s+='<circle cx=\"'+xC+'\" cy=\"'+Y_SUB+'\" r=\"2.5\" fill=\"#222\"/>';
        s+='<line x1=\"'+xC+'\" y1=\"'+Y_SUB+'\" x2=\"'+xC+'\" y2=\"'+Y_CT+'\" stroke=\"#222\" stroke-width=\"1.4\"/>';
        s+='<rect x=\"'+(xC-16)+'\" y=\"'+Y_CT+'\" width=\"32\" height=\"18\" rx=\"2\" fill=\"#e8e5dc\" stroke=\"#222\" stroke-width=\"1.2\"/>';
        s+='<line x1=\"'+(xC-12)+'\" y1=\"'+(Y_CT+15)+'\" x2=\"'+(xC+12)+'\" y2=\"'+(Y_CT+3)+'\" stroke=\"#222\" stroke-width=\"1.3\"/>';
        if(it.pol>2) s+='<text x=\"'+(xC+11)+'\" y=\"'+(Y_CT+14)+'\" font-size=\"7\" text-anchor=\"end\" fill=\"#222\">'+it.pol+'P</text>';
        s+='<line x1=\"'+xC+'\" y1=\"'+(Y_CT+18)+'\" x2=\"'+xC+'\" y2=\"'+(Y_LABEL-16)+'\" stroke=\"#222\" stroke-width=\"1.1\"/>';
        var pref=it.pol===4?'4x':it.pol===3?'3x':'2x';
        var txt=['PIA 4,5 kA',it.amps+' A Curva C',pref+it.sect+'+TT mm² Cu','Tubo Ø '+(it.sect==='6'?25:it.sect==='4'?20:16)+' mm','Longitud 8 m',it.watts+' W'];
        var dy=9, yAnchor=Y_CT+26;
        txt.forEach(function(L,k){
          var xa=xC+5+k*dy;
          s+='<text x=\"'+xa+'\" y=\"'+yAnchor+'\" font-size=\"7\" fill=\"#333\" text-anchor=\"start\" transform=\"rotate(90 '+xa+' '+yAnchor+')\">'+L+'</text>';
        });
        var words=it.name.split(/\\s+/), ls=[], cur='';
        words.forEach(function(w){
          if(!cur)cur=w;
          else if((cur+' '+w).length<=11)cur+=' '+w;
          else{ls.push(cur);cur=w;}
        });
        if(cur)ls.push(cur);
        if(ls.length>2)ls=ls.slice(0,2);
        ls.forEach(function(L,k){
          s+='<text x=\"'+xC+'\" y=\"'+(Y_LABEL+k*9)+'\" font-size=\"7\" text-anchor=\"middle\" fill=\"#222\" font-weight=\"bold\">'+L+'</text>';
        });
      });
    });
    s+='<text x=\"'+(totalW-MX)+'\" y=\"'+(totalH-12)+'\" font-size=\"9\" text-anchor=\"end\" fill=\"#8a6813\" font-style=\"italic\" font-weight=\"bold\">by J.A.RAMOS</text>';
    return '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"'+totalW+'\" height=\"'+totalH+'\" viewBox=\"0 0 '+totalW+' '+totalH+'\">'+s+'</svg>';
  }

  // ============ HANDLERS ============
  function syncSelects(key,value){
    document.querySelectorAll('[data-cfg=\"'+key+'\"]').forEach(function(s){s.value=value;});
  }
  document.querySelectorAll('[data-cfg=\"ac\"]').forEach(function(sel){
    sel.onchange=function(e){cfg.mono=e.target.value==='mono';PLACED=[];syncSelects('ac',e.target.value);buildPalette();render();};
  });
  document.querySelectorAll('[data-cfg=\"iga-amp\"]').forEach(function(sel){
    sel.onchange=function(e){cfg.igaAmps=+e.target.value;syncSelects('iga-amp',e.target.value);render();};
  });
  document.querySelectorAll('[data-cfg=\"rows\"]').forEach(function(sel){
    sel.onchange=function(e){cfg.rows=+e.target.value;syncSelects('rows',e.target.value);refit();setHeights();render();};
  });
  document.querySelectorAll('[data-cfg=\"elec\"]').forEach(function(sel){
    sel.onchange=function(e){cfg.elec=e.target.value;syncSelects('elec',e.target.value);refit();buildPalette();render();};
  });

  document.querySelectorAll('[data-action=\"clear\"]').forEach(function(b){
    b.onclick=function(){PLACED=[];render();};
  });
  document.querySelectorAll('[data-action=\"unifilar\"]').forEach(function(b){
    b.onclick=function(){
      if(!PLACED.length){alert('Añade al menos un circuito al cuadro.');return;}
      document.getElementById('unifilar-body').innerHTML=unifilarSVG();
      document.getElementById('unifilar-modal').style.display='flex';
    };
  });
  document.querySelectorAll('[data-action=\"uni\"]').forEach(function(b){
    b.onclick=function(){
      if(!PLACED.length)return;assignPhases();
      var wT=0,rows=usedRows();
      var L=PLACED.slice().sort(function(a,b){return a.slot-b.slot;}).map(function(b){
        var it=T(b.type);wT+=it.watts*it.cs*it.cu;
        var poleLabel=it.pol===2?'1P+N':(it.pol===3?'3P':'3P+N');
        var faseSuf='';
        if(!cfg.mono){ if(it.pol>=3) faseSuf=' · '+it.pol+'P'; else faseSuf=' · Fase L'+(PHASE[b.id]+1); }
        return ' - RCD'+(rows.indexOf(rowOf(b.slot))+1)+' · Fila '+(rowOf(b.slot)+1)+' (Mód '+(b.slot%N+1)+'): '+it.name+' · PIA '+it.amps+'A '+poleLabel+' · '+it.sect+' mm² Cu'+faseSuf;
      });
      var wM=cfg.mono?230*cfg.igaAmps:Math.round(Math.sqrt(3)*400*cfg.igaAmps);
      var msg='*** MEMORIA REBT (ITC-BT-25) ***\nby J.A.RAMOS\nAcometida: '+(cfg.mono?'Mono 230V':'Tri 400V')+'\nIGA: '+cfg.igaAmps+'A '+(cfg.mono?'2P':'4P')+' (máx. '+wM+' W)\nPrevisión (ΣP·Cs·Cu): '+wT+' W\n';
      if(!cfg.mono)msg+='Reparto nominal: L1 '+Math.round(LOADS[0])+' W | L2 '+Math.round(LOADS[1])+' W | L3 '+Math.round(LOADS[2])+' W\n';
      msg+='\n--- CIRCUITOS ---\n'+L.join('\n')+'\n\n---\nDiseñador Técnico de Cuadros Eléctricos REBT · by J.A.RAMOS';
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(msg).then(function(){alert('¡Memoria copiada!');});else alert(msg);
    };
  });

  window.closeUnifilar=function(){document.getElementById('unifilar-modal').style.display='none';};
  document.addEventListener('keydown',function(e){if(e.key==='Escape')window.closeUnifilar();});

  // ============ UI MÓVIL ============
  if(isMobile){
    var panelCfg=document.getElementById('panel-cfg');
    var panelInfo=document.getElementById('panel-info');
    var drawer=document.getElementById('drawer');
    var fab=document.getElementById('fab');
    var ctx=document.getElementById('ctx-menu');
    var stage=document.getElementById('stage');
    var stageWrap=document.getElementById('stage-wrap');

    document.getElementById('btn-cfg').onclick=function(){
      panelInfo.classList.remove('open');
      panelCfg.classList.toggle('open');
    };
    document.getElementById('btn-info').onclick=function(){
      panelCfg.classList.remove('open');
      panelInfo.classList.toggle('open');
    };

    fab.onclick=function(e){e.stopPropagation();drawer.classList.toggle('open');};

    document.addEventListener('click',function(e){
      if(drawer.classList.contains('open') && !drawer.contains(e.target) && e.target!==fab) drawer.classList.remove('open');
    });

    var zoom=1, lastZoom=1;
    document.querySelectorAll('#zoom-controls button').forEach(function(b){
      b.onclick=function(){
        var z=b.dataset.zoom;
        if(z==='+')zoom=Math.min(zoom*1.2,2.5);
        else if(z==='-')zoom=Math.max(zoom/1.2,0.5);
        else if(z==='fit')zoom=(stageWrap.clientWidth-20)/W;
        lastZoom=zoom;
        stage.style.transform='scale('+zoom+')';
      };
    });

    window.addEventListener('resize', function(){
      var nz = Math.min(1, (stageWrap.clientWidth - 20) / W);
      if (nz !== zoom) {
        zoom = nz;
        lastZoom = zoom;
        stage.style.transform = 'scale(' + zoom + ')';
      }
    });
    window.addEventListener('orientationchange', function(){
      setTimeout(function(){
        var nz = Math.min(1, (stageWrap.clientWidth - 20) / W);
        zoom = nz;
        lastZoom = zoom;
        stage.style.transform = 'scale(' + zoom + ')';
      }, 300);
    });

    var pinchStart=0, pinchZoomStart=1;
    stageWrap.addEventListener('touchstart',function(e){
      if(e.touches.length===2){
        pinchStart=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        pinchZoomStart=lastZoom;
      }
    },{passive:true});
    stageWrap.addEventListener('touchmove',function(e){
      if(e.touches.length===2 && pinchStart>0){
        var d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        zoom=Math.max(0.5,Math.min(2.5,pinchZoomStart*(d/pinchStart)));
        stage.style.transform='scale('+zoom+')';
      }
    },{passive:true});
    stageWrap.addEventListener('touchend',function(){pinchStart=0;lastZoom=zoom;},{passive:true});

    wrap.addEventListener('click',function(e){
      var dev=e.target.closest('.dev');
      if(!dev||dev.classList.contains('fix'))return;
      var left=parseFloat(dev.style.left);
      var top=parseFloat(dev.style.top);
      var slot=Math.round((left-LEFT)/MW)+Math.round((top-TOP_PAD)/RH)*N;
      var circ=PLACED.filter(function(b){return b.slot===slot;})[0];
      if(!circ)return;
      ctx.classList.add('open');
      ctx.style.left=Math.min(e.clientX-70, window.innerWidth-170)+'px';
      ctx.style.top=Math.min(e.clientY-50, window.innerHeight-120)+'px';
      ctx.dataset.circ=circ.id;
    });
    document.addEventListener('click',function(e){
      if(!ctx.contains(e.target) && !e.target.closest('.dev')) ctx.classList.remove('open');
    });
    ctx.querySelector('[data-act="delete"]').onclick=function(){
      var id=+ctx.dataset.circ;
      PLACED=PLACED.filter(function(q){return q.id!==id;});
      ctx.classList.remove('open');render();
    };
    ctx.querySelector('[data-act="info\"]').onclick=function(){
      var id=+ctx.dataset.circ;
      var b=PLACED.filter(function(q){return q.id===id;})[0];
      if(!b)return;
      var it=T(b.type);
      alert(it.name+'\n'+it.amps+' A · '+it.sect+' mm² Cu · Fila '+(rowOf(b.slot)+1)+' Mód '+(b.slot%N+1));
      ctx.classList.remove('open');
    };
  }

  setHeights();buildPalette();render();
})();
