    // State
    let isNight = true; // inicia à noite para mostrar vagalumes
    let lanternOn = true;
    let linking = false;
    let linkFrom = null;
    let constOpen = false;

    // Elements
    const morning = document.getElementById('morning');
    const night = document.getElementById('night');
    const lantern = document.getElementById('lantern');
    const beam = document.getElementById('beam');
    const flash = document.getElementById('flash');
    const lumiOrb = document.getElementById('lumiOrb');
    const lumiTip = document.getElementById('lumiTip');
    const constWrap = document.getElementById('constWrap');
    const constCard = document.getElementById('constCard');

    // Time-based auto theme (manhã 6-17)
    function autoTheme(){
      const h = new Date().getHours();
      isNight = !(h >= 6 && h <= 17);
      applyTheme(false);
    }

    function applyTheme(withFlash=true){
      if(withFlash){ showFlash(); }
      if(isNight){
        morning.classList.add('hidden');
        night.classList.remove('hidden');
        beam.classList.add('night');
        ensureFireflies();
        // constelação: visual noturno
        constCard.className = "rounded-2xl overflow-hidden border backdrop-blur bg-slate-900/70 border-slate-700/60";
      }else{
        night.classList.add('hidden');
        morning.classList.remove('hidden');
        beam.classList.remove('night');
        clearFireflies();
        // constelação: visual diurno
        constCard.className = "rounded-2xl overflow-hidden border backdrop-blur bg-white/70 border-sky-200";
      }
    }

    function showFlash(){
      flash.classList.add('show');
      setTimeout(()=> flash.classList.remove('show'), 420);
    }

    // Fireflies
    let fireflies = [];
    function ensureFireflies(){
      if(fireflies.length) return;
      const count = 28;
      for(let i=0;i<count;i++){
        const f = document.createElement('div');
        f.className='firefly';
        f.style.left = (Math.random()*100)+'%';
        f.style.top = (Math.random()*100)+'%';
        f.style.animationDelay = (Math.random()*2)+'s';
        f.style.opacity = 0.1 + Math.random()*0.9;
        night.appendChild(f);
        fireflies.push(f);
      }
    }
    function clearFireflies(){
      fireflies.forEach(f=> f.remove());
      fireflies = [];
    }

    // Cursor beam + lantern
    function updateBeam(e){
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      const y = (e.touches ? e.touches[0].clientY : e.clientY);
      beam.style.left = x + 'px';
      beam.style.top = y + 'px';
      if(lanternOn){
        night.style.setProperty('--lx', x+'px');
        night.style.setProperty('--ly', y+'px');
      }
      // trilha perto do orb
      const rect = lumiOrb.getBoundingClientRect();
      const dx = rect.left + rect.width/2 - x;
      const dy = rect.top + rect.height/2 - y;
      const d = Math.hypot(dx,dy);
      if(d < 140){
        const t = document.createElement('div');
        t.className='lumi-trail';
        t.style.left = (x)+'px';
        t.style.top = (y)+'px';
        document.body.appendChild(t);
        setTimeout(()=> t.remove(), 900);
      }
    }
    window.addEventListener('mousemove', updateBeam, {passive:true});
    window.addEventListener('touchmove', updateBeam, {passive:true});

    // Lantern buttons
    const btnLanternaNight = document.getElementById('btnLanternaNight');
    const btnLanternaMorning = document.getElementById('btnLanternaMorning');
    [btnLanternaNight, btnLanternaMorning].forEach(btn=>{
      if(!btn) return;
      btn.addEventListener('click', ()=>{
        lanternOn = false;
        lantern.classList.add('hidden');
        showFlash();
        showTip('Perfeito! Agora tudo está iluminado. Explore a constelação pelo menu.');
      })
    });

    // Toggle day/night
    const btnToggleDayNight1 = document.getElementById('btnToggleDayNight1');
    const btnToggleDayNight2 = document.getElementById('btnToggleDayNight2');
    [btnToggleDayNight1, btnToggleDayNight2].forEach(b=>{
      if(!b) return;
      b.addEventListener('click', ()=>{
        isNight = !isNight;
        applyTheme(true);
        updateLantern();
      })
    });

    // Initial
    autoTheme();
    applyTheme(false);

    // Keep time in sync each 10 minutes
    setInterval(autoTheme, 10*60*1000);

    // Starfield (night background)
    const starCanvas = document.getElementById('starfield');
    const sctx = starCanvas.getContext('2d');
    function sizeStarCanvas(){
      starCanvas.width = night.clientWidth;
      starCanvas.height = night.clientHeight;
    }
    window.addEventListener('resize', sizeStarCanvas);
    sizeStarCanvas();
    const stars = Array.from({length:160}).map(()=>({
      x: Math.random(),
      y: Math.random(),
      r: Math.random()*1.4 + 0.2,
      tw: Math.random()*2*Math.PI
    }));
    function drawStars(){
      sctx.clearRect(0,0,starCanvas.width,starCanvas.height);
      const w = starCanvas.width, h = starCanvas.height;
      stars.forEach(s=>{
        sctx.beginPath();
        const a = 0.5 + 0.5*Math.sin(s.tw);
        sctx.fillStyle = `rgba(255,255,255,${0.15+0.85*a})`;
        sctx.arc(s.x*w, s.y*h, s.r, 0, Math.PI*2);
        sctx.fill();
        s.tw += 0.01 + Math.random()*0.01;
      });
      requestAnimationFrame(drawStars);
    }
    drawStars();

    // Constellation simulator
    const c = document.getElementById('constellation');
    const ctx = c.getContext('2d');
    let nodes = []; // {id,x,y,color,drag}
    let edges = []; // [id1,id2]
    let nid = 1;

    function canvasResize(){
      const rect = c.getBoundingClientRect();
      c.width = rect.width; c.height = rect.height;
      drawConstellation();
    }
    window.addEventListener('resize', canvasResize);

    function randColor(){
      const palette = ['#34D399','#60A5FA','#F472B6','#F59E0B'];
      return palette[Math.floor(Math.random()*palette.length)];
    }
    function addStar(x,y,color=randColor()){
      nodes.push({id:nid++, x, y, color, drag:false});
      drawConstellation();
    }
    function clearStars(){
      nodes = []; edges = []; drawConstellation();
    }
    function connectStars(a,b){
      if(!a||!b||a.id===b.id) return;
      if(edges.find(e=> (e[0]===a.id && e[1]===b.id) || (e[0]===b.id && e[1]===a.id))) return;
      edges.push([a.id,b.id]);
      drawConstellation();
    }
    function findNodeAt(x,y){
      return nodes.find(n=> Math.hypot(n.x-x, n.y-y) < 12);
    }
    function drawConstellation(){
      ctx.clearRect(0,0,c.width,c.height);
      // edges glow
      ctx.save();
      ctx.lineWidth = 1.5;
      edges.forEach(([aId,bId])=>{
        const a = nodes.find(n=> n.id===aId);
        const b = nodes.find(n=> n.id===bId);
        if(!a||!b) return;
        const grad = ctx.createLinearGradient(a.x,a.y,b.x,b.y);
        grad.addColorStop(0, a.color);
        grad.addColorStop(1, b.color);
        ctx.strokeStyle = grad;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#9AE6B4';
        ctx.beginPath();
        ctx.moveTo(a.x,a.y);
        ctx.lineTo(b.x,b.y);
        ctx.stroke();
      });
      ctx.restore();
      // nodes glow
      nodes.forEach(n=>{
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = n.color;
        ctx.shadowBlur = 16; ctx.shadowColor = n.color;
        ctx.arc(n.x,n.y,5.5,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
        // halo
        const g = ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,16);
        g.addColorStop(0, 'rgba(255,255,255,.35)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x,n.y,16,0,Math.PI*2);
        ctx.fill();
      });
      // hint vazio
      if(!nodes.length){
        ctx.fillStyle = isNight ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.7)';
        ctx.font = '600 15px Plus Jakarta Sans';
        ctx.fillText('Clique para adicionar estrelas. Arraste para posicionar. Use "Conectar".', 12, 26);
      }
    }

    // Interações no canvas
    c.addEventListener('click', (e)=>{
      const rect = c.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      if(linking){
        const target = findNodeAt(x,y);
        if(linkFrom && target){
          connectStars(linkFrom, target);
          linking = false; linkFrom = null;
          showTip('Conexão criada! Continue ligando para desenhar sua estratégia.');
        }else{
          addStar(x,y);
        }
        return;
      }
      addStar(x,y);
    });
    let dragging = null;
    c.addEventListener('mousedown', e=>{
      const rect = c.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      dragging = findNodeAt(x,y) || null;
      if(dragging){ dragging.drag = true; }
    });
    window.addEventListener('mousemove', e=>{
      if(!dragging) return;
      const rect = c.getBoundingClientRect();
      dragging.x = Math.max(8, Math.min(e.clientX - rect.left, c.width-8));
      dragging.y = Math.max(8, Math.min(e.clientY - rect.top, c.height-8));
      drawConstellation();
    });
    window.addEventListener('mouseup', ()=>{
      if(dragging){ dragging.drag = false; dragging=null; }
    });

    // Controles topo do painel
    const btnAddStar = document.getElementById('btnAddStar');
    const btnLinkStars = document.getElementById('btnLinkStars');
    const btnClearStars = document.getElementById('btnClearStars');
    const btnCloseConst = document.getElementById('btnCloseConst');

    if(btnAddStar){
      btnAddStar.addEventListener('click', ()=>{
        const rect = c.getBoundingClientRect();
        addStar(Math.random()*rect.width*0.8+rect.width*0.1, Math.random()*rect.height*0.7+rect.height*0.15);
      });
    }
    if(btnLinkStars){
      btnLinkStars.addEventListener('click', ()=>{
        if(!nodes.length){ showTip('Adicione ao menos duas estrelas para conectar.'); return; }
        linking = !linking;
        linkFrom = nodes[nodes.length-1] || null;
        showTip(linking ? 'Modo conectar: clique na próxima estrela para formar uma linha.' : 'Modo conectar desativado.');
      });
    }
    if(btnClearStars){
      btnClearStars.addEventListener('click', ()=>{
        clearStars();
        showTip('Área limpa. Comece um novo céu estrelado.');
      });
    }

    // Abrir/fechar constelação pelo menu
    const btnToggleConstNight = document.getElementById('btnToggleConstNight');
    const btnToggleConstMorning = document.getElementById('btnToggleConstMorning');

    function openConstellation(){
      constWrap.classList.remove('hidden');
      // animação suave
      requestAnimationFrame(()=>{
        constWrap.classList.add('const-wrap-show');
      });
      constOpen = true;
      setTimeout(canvasResize, 50);
    }
    function closeConstellation(){
      constWrap.classList.remove('const-wrap-show');
      setTimeout(()=> { constWrap.classList.add('hidden'); }, 220);
      constOpen = false;
    }
    function toggleConstellation(){
      constOpen ? closeConstellation() : openConstellation();
    }

    [btnToggleConstNight, btnToggleConstMorning].forEach(b=>{
      if(!b) return;
      b.addEventListener('click', toggleConstellation);
    });
    if(btnCloseConst){ btnCloseConst.addEventListener('click', closeConstellation); }

    // Ações rápidas que abrem diretamente a constelação
    const btnGoSimNight = document.getElementById('btnGoSimNight');
    const btnGoSimNight2 = document.getElementById('btnGoSimNight2');
    const btnGoSimMorning = document.getElementById('btnGoSimMorning');
    [btnGoSimNight, btnGoSimNight2, btnGoSimMorning].forEach(b=>{
      if(!b) return;
      b.addEventListener('click', ()=>{
        if(!constOpen) openConstellation();
        // pequeno efeito: adicionar algumas estrelas de início
        for(let i=0;i<3;i++){
          setTimeout(()=> {
            const rect = c.getBoundingClientRect();
            addStar(Math.random()*rect.width*0.8 + rect.width*0.1, Math.random()*rect.height*0.7 + rect.height*0.15);
          }, i*90);
        }
        showTip('Adicione estrelas e conecte para visualizar sua estratégia.');
      });
    });

    // Conquistas iluminando o céu
    const btnGoalSave = document.getElementById('btnGoalSave');
    if(btnGoalSave){
      btnGoalSave.addEventListener('click', ()=>{
        if(!constOpen) openConstellation();
        const cx = c.width*0.35, cy = c.height*0.45;
        const burst = [];
        for(let i=0;i<5;i++){
          const angle = (Math.PI*2/5)*i;
          burst.push({x: cx + Math.cos(angle)*40, y: cy + Math.sin(angle)*28});
        }
        const ids = [];
        burst.forEach(p=>{ addStar(p.x,p.y,'#34D399'); ids.push(nid-1); });
        for(let i=0;i<ids.length;i++){
          edges.push([ids[i], ids[(i+1)%ids.length]]);
        }
        drawConstellation();
        showTip('Meta concluída! Uma nova constelação apareceu no seu céu.');
        badgeSparkle();
      });
    }
    function badgeSparkle(){
      const spark = document.createElement('div');
      spark.style.position='fixed';
      spark.style.left='28px'; spark.style.top='28px';
      spark.style.width='8px'; spark.style.height='8px';
      spark.style.borderRadius='50%';
      spark.style.background='radial-gradient(circle, rgba(255,255,255,1), rgba(255,255,255,0))';
      spark.style.filter='drop-shadow(0 0 10px rgba(255,255,255,.9))';
      spark.style.zIndex='60';
      document.body.appendChild(spark);
      spark.animate([{transform:'scale(0)',opacity:1},{transform:'scale(6)',opacity:0}],{duration:700, easing:'ease-out'});
      setTimeout(()=> spark.remove(), 700);
    }

    // Lumi Guide
    const tipMessages = [
      'Dica: Clique no painel para criar estrelas. Arraste para reposicionar.',
      'Use "Conectar" para formar constelações. Cada linha é uma decisão.',
      'Experimente alternar entre manhã e noite para ver a mudança no ambiente.',
      'Atinja metas para acender novas luzes no painel.'
    ];
    let tipIndex = 0;
    function showTip(text){
      lumiTip.textContent = text;
      positionTip();
      lumiTip.classList.add('show');
      setTimeout(()=> lumiTip.classList.remove('show'), 3600);
    }
    function positionTip(){
      const r = lumiOrb.getBoundingClientRect();
      lumiTip.style.left = (r.left + r.width/2) + 'px';
      lumiTip.style.top = (r.top - 8) + 'px';
    }
    positionTip();
    window.addEventListener('resize', positionTip);

    let orbX = window.innerWidth*0.84, orbY = window.innerHeight*0.78;
    function moveOrbTo(x,y,withTrail=true){
      orbX = x; orbY = y;
      lumiOrb.style.left = x+'px';
      lumiOrb.style.top = y+'px';
      if(withTrail){
        const t = document.createElement('div');
        t.className='lumi-trail';
        t.style.left = x+'px';
        t.style.top = y+'px';
        document.body.appendChild(t);
        setTimeout(()=> t.remove(), 900);
      }
      positionTip();
    }
    // Orb guia para o botão de constelação
    lumiOrb.addEventListener('click', ()=>{
      const targets = [
        document.getElementById(isNight? 'btnToggleConstNight' : 'btnToggleConstMorning'),
        document.getElementById(isNight? 'btnLanternaNight' : 'btnLanternaMorning'),
        document.getElementById(isNight? 'btnToggleDayNight2' : 'btnToggleDayNight1')
      ].filter(Boolean);
      const t = targets[(Math.random()*targets.length)|0];
      if(t){
        const r = t.getBoundingClientRect();
        moveOrbTo(r.left + r.width + 18, r.top + r.height/2);
        const msgs = [
          'Abra sua constelação pelo menu para começar!',
          ...tipMessages
        ];
        showTip(msgs[(tipIndex++)%msgs.length]);
      }
    });
    // flutuação suave
    setInterval(()=>{
      moveOrbTo(orbX + (Math.random()*20-10), orbY + (Math.random()*12-6), false);
    }, 1400);

    // Lantern visível apenas à noite
    function updateLantern(){
      lantern.classList.toggle('hidden', !lanternOn || !isNight);
    }
    updateLantern();
    window.addEventListener('mousemove', ()=> updateLantern());
    window.addEventListener('resize', ()=> updateLantern());

    // Acessibilidade: teclado
    document.addEventListener('keydown', (e)=>{
      if(e.key==='l' || e.key==='L'){
        lanternOn = !lanternOn; updateLantern();
        showTip(lanternOn? 'Lanterna ativada. Mova o mouse para revelar.' : 'Lanterna desativada.');
      }
      if(e.key==='n' || e.key==='N'){
        isNight = !isNight; applyTheme(true); updateLantern();
      }
      if(e.key==='Escape' && constOpen){
        closeConstellation();
      }
      if((e.key==='c' || e.key==='C') && !constOpen){
        openConstellation();
      }
    });

    // Garantir tamanho correto após render
    setTimeout(canvasResize, 80);


// <--------------------------------------- FIM ANIMAÇÕES E FUNCIONALIDADES TELA INICIAL -------------------------------->


// <------------------------------------ INICIO ANIMAÇÕES E FUNCIONALIDADES INDICADORES ECONOMICOS ---------------------->


        // Mobile menu toggle
        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            menu.classList.toggle('mobile-menu-open');
            menu.classList.toggle('mobile-menu-closed');
        }

        // Mobile menu button event
        document.getElementById('mobile-menu-btn').addEventListener('click', toggleMobileMenu);

        // Close mobile menu when clicking on links
        document.querySelectorAll('.mobile-menu-link').forEach(link => {
            link.addEventListener('click', () => {
                setTimeout(toggleMobileMenu, 100);
            });
        });

        // Scroll progress
        window.addEventListener('scroll', () => {
            const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            document.getElementById('scroll-progress').style.width = scrolled + '%';
        });

        // Initialize calculator on page load
        document.addEventListener('DOMContentLoaded', () => {
            calculateInvestment();
            updateIndicators();
            setInterval(updateIndicators, 30000); // Update every 30 seconds
        });

        // Economic Indicators Data (simulated API responses)
        const indicatorsData = {
            selic: {
                title: 'Taxa Selic',
                icon: '🏛️',
                current: '13,75%',
                description: 'A Taxa Selic é a taxa básica de juros da economia brasileira, definida pelo Comitê de Política Monetária (COPOM) do Banco Central.',
                trend: 'up',
                change: '+0,50%',
                historical: [
                    { period: '2024', value: '13,75%' },
                    { period: '2023', value: '13,25%' },
                    { period: '2022', value: '11,75%' },
                    { period: '2021', value: '9,25%' }
                ],
                impact: 'Uma Selic alta torna investimentos em renda fixa mais atrativos, mas pode desacelerar o crescimento econômico.',
                nextMeeting: '20 de Março de 2024'
            },
            ipca: {
                title: 'IPCA (Inflação)',
                icon: '📈',
                current: '4,62%',
                description: 'O IPCA é o índice oficial de inflação do Brasil, medindo a variação de preços de produtos e serviços consumidos pelas famílias.',
                trend: 'down',
                change: '-0,12%',
                historical: [
                    { period: 'Fev/24', value: '4,62%' },
                    { period: 'Jan/24', value: '4,51%' },
                    { period: 'Dez/23', value: '4,62%' },
                    { period: 'Nov/23', value: '4,68%' }
                ],
                impact: 'Inflação controlada preserva o poder de compra e favorece investimentos de longo prazo.',
                target: 'Meta: 3,00% ± 1,5 p.p.'
            },
            cdi: {
                title: 'CDI',
                icon: '💰',
                current: '13,65%',
                description: 'O CDI é a taxa média dos empréstimos entre bancos, servindo como referência para investimentos em renda fixa.',
                trend: 'stable',
                change: '0,00%',
                historical: [
                    { period: 'Hoje', value: '13,65%' },
                    { period: 'Ontem', value: '13,65%' },
                    { period: '1 sem', value: '13,60%' },
                    { period: '1 mês', value: '13,40%' }
                ],
                impact: 'CDI alto beneficia investimentos como CDBs, LCIs e fundos DI.',
                relation: 'Acompanha de perto a Taxa Selic'
            },
            dollar: {
                title: 'Dólar Americano',
                icon: '💵',
                current: 'R$ 5,12',
                description: 'Cotação do dólar americano em relação ao real brasileiro, importante indicador da economia global.',
                trend: 'up',
                change: '+1,23%',
                historical: [
                    { period: 'Hoje', value: 'R$ 5,12' },
                    { period: 'Ontem', value: 'R$ 5,06' },
                    { period: '1 sem', value: 'R$ 5,08' },
                    { period: '1 mês', value: 'R$ 4,98' }
                ],
                impact: 'Dólar alto encarece importações mas favorece exportações brasileiras.',
                factors: 'Influenciado por política monetária, cenário político e fluxo de capital'
            },
            euro: {
                title: 'Euro',
                icon: '🇪🇺',
                current: 'R$ 5,58',
                description: 'Cotação do euro em relação ao real, moeda oficial de 19 países da União Europeia.',
                trend: 'up',
                change: '+0,87%',
                historical: [
                    { period: 'Hoje', value: 'R$ 5,58' },
                    { period: 'Ontem', value: 'R$ 5,53' },
                    { period: '1 sem', value: 'R$ 5,51' },
                    { period: '1 mês', value: 'R$ 5,45' }
                ],
                impact: 'Euro forte indica economia europeia sólida e pode afetar comércio bilateral.',
                economy: 'Segunda maior economia mundial'
            },
            bitcoin: {
                title: 'Bitcoin',
                icon: '₿',
                current: 'R$ 267.450',
                description: 'Primeira e maior criptomoeda do mundo, considerada reserva de valor digital.',
                trend: 'down',
                change: '-2,34%',
                historical: [
                    { period: 'Hoje', value: 'R$ 267.450' },
                    { period: 'Ontem', value: 'R$ 273.890' },
                    { period: '1 sem', value: 'R$ 285.120' },
                    { period: '1 mês', value: 'R$ 245.670' }
                ],
                impact: 'Bitcoin é volátil mas tem potencial de valorização a longo prazo.',
                warning: 'Investimento de alto risco - invista apenas o que pode perder'
            },
            pound: {
                title: 'Libra Esterlina',
                icon: '🇬🇧',
                current: 'R$ 6,47',
                description: 'Moeda oficial do Reino Unido, uma das mais antigas moedas ainda em circulação.',
                trend: 'up',
                change: '+0,45%',
                historical: [
                    { period: 'Hoje', value: 'R$ 6,47' },
                    { period: 'Ontem', value: 'R$ 6,44' },
                    { period: '1 sem', value: 'R$ 6,41' },
                    { period: '1 mês', value: 'R$ 6,38' }
                ],
                impact: 'Libra forte reflete estabilidade econômica pós-Brexit.',
                context: 'Influenciada por políticas do Banco da Inglaterra'
            },
            ibovespa: {
                title: 'Ibovespa',
                icon: '📊',
                current: '127.845',
                description: 'Principal índice da bolsa brasileira (B3), composto pelas ações mais negociadas.',
                trend: 'up',
                change: '+1,23%',
                historical: [
                    { period: 'Hoje', value: '127.845' },
                    { period: 'Ontem', value: '126.280' },
                    { period: '1 sem', value: '125.670' },
                    { period: '1 mês', value: '124.890' }
                ],
                impact: 'Ibovespa em alta indica otimismo com empresas brasileiras.',
                composition: 'Representa ~80% do volume negociado na B3'
            },
            sp500: {
                title: 'S&P 500',
                icon: '🇺🇸',
                current: '4.567,89',
                description: 'Índice que acompanha as 500 maiores empresas americanas por capitalização de mercado.',
                trend: 'down',
                change: '-0,45%',
                historical: [
                    { period: 'Hoje', value: '4.567,89' },
                    { period: 'Ontem', value: '4.588,45' },
                    { period: '1 sem', value: '4.612,30' },
                    { period: '1 mês', value: '4.534,20' }
                ],
                impact: 'S&P 500 é referência global para investimentos em ações.',
                companies: 'Inclui Apple, Microsoft, Amazon, Google'
            },
            nasdaq: {
                title: 'Nasdaq',
                icon: '💻',
                current: '14.234,56',
                description: 'Índice focado em empresas de tecnologia, incluindo as maiores big techs do mundo.',
                trend: 'up',
                change: '+0,78%',
                historical: [
                    { period: 'Hoje', value: '14.234,56' },
                    { period: 'Ontem', value: '14.124,89' },
                    { period: '1 sem', value: '14.089,45' },
                    { period: '1 mês', value: '13.987,23' }
                ],
                impact: 'Nasdaq reflete o desempenho do setor de tecnologia global.',
                focus: 'Concentrado em empresas inovadoras e de crescimento'
            },
            nikkei: {
                title: 'Nikkei 225',
                icon: '🇯🇵',
                current: '33.567,12',
                description: 'Principal índice da bolsa japonesa, representando as 225 maiores empresas do Japão.',
                trend: 'up',
                change: '+2,15%',
                historical: [
                    { period: 'Hoje', value: '33.567,12' },
                    { period: 'Ontem', value: '32.860,45' },
                    { period: '1 sem', value: '32.456,78' },
                    { period: '1 mês', value: '31.890,23' }
                ],
                impact: 'Nikkei em alta indica recuperação da economia japonesa.',
                market: 'Terceira maior bolsa de valores do mundo'
            }
        };

        // Open indicator modal
        function openIndicatorModal(indicator) {
            const data = indicatorsData[indicator];
            if (!data) return;

            const modal = document.getElementById('indicator-modal');
            const modalIcon = document.getElementById('modal-icon');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');

            // Update modal header
            modalIcon.innerHTML = `<span class="text-2xl">${data.icon}</span>`;
            modalTitle.textContent = data.title;

            // Create modal content
            const trendClass = data.trend === 'up' ? 'trend-up' : data.trend === 'down' ? 'trend-down' : 'trend-stable';
            const trendIcon = data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→';

            modalBody.innerHTML = `
                <div class="mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-4xl font-bold text-gradient">${data.current}</div>
                        <div class="indicator-trend ${trendClass}">
                            ${trendIcon} ${data.change}
                        </div>
                    </div>
                    <p class="text-gray-300 leading-relaxed">${data.description}</p>
                </div>

                <div class="chart-mini mb-6">
                    <h4 class="text-lg font-semibold mb-3">📈 Histórico Recente</h4>
                    <div class="historical-data">
                        ${data.historical.map(item => `
                            <div class="data-point">
                                <div class="text-xs text-gray-400 mb-1">${item.period}</div>
                                <div class="font-semibold text-lumi-green">${item.value}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="space-y-4">
                    <div class="glass-effect rounded-lg p-4">
                        <h4 class="font-semibold mb-2 flex items-center">
                            <span class="text-lg mr-2">💡</span>
                            Impacto na Economia
                        </h4>
                        <p class="text-sm text-gray-300">${data.impact}</p>
                    </div>

                    ${data.nextMeeting ? `
                        <div class="glass-effect rounded-lg p-4">
                            <h4 class="font-semibold mb-2 flex items-center">
                                <span class="text-lg mr-2">📅</span>
                                Próxima Reunião
                            </h4>
                            <p class="text-sm text-gray-300">${data.nextMeeting}</p>
                        </div>
                    ` : ''}

                    ${data.target ? `
                        <div class="glass-effect rounded-lg p-4">
                            <h4 class="font-semibold mb-2 flex items-center">
                                <span class="text-lg mr-2">🎯</span>
                                Meta Oficial
                            </h4>
                            <p class="text-sm text-gray-300">${data.target}</p>
                        </div>
                    ` : ''}

                    ${data.warning ? `
                        <div class="glass-effect rounded-lg p-4 border border-yellow-500/30">
                            <h4 class="font-semibold mb-2 flex items-center text-yellow-400">
                                <span class="text-lg mr-2">⚠️</span>
                                Atenção
                            </h4>
                            <p class="text-sm text-gray-300">${data.warning}</p>
                        </div>
                    ` : ''}

                    <div class="glass-effect rounded-lg p-4">
                        <h4 class="font-semibold mb-2 flex items-center">
                            <span class="text-lg mr-2">📚</span>
                            Para Jovens Investidores
                        </h4>
                        <p class="text-sm text-gray-300">
                            ${getYouthTip(indicator)}
                        </p>
                    </div>
                </div>

                <div class="mt-6 flex space-x-3">
                    <button onclick="addToWatchlist('${indicator}')" class="flex-1 gradient-bg text-white py-3 rounded-lg font-semibold interactive-button">
                        ⭐ Adicionar aos Favoritos
                    </button>
                    <button onclick="shareIndicator('${indicator}')" class="flex-1 glass-effect text-lumi-blue py-3 rounded-lg font-semibold interactive-button border border-lumi-blue/30">
                        📤 Compartilhar
                    </button>
                </div>
            `;

            modal.classList.add('active');
        }

        // Close indicator modal
        function closeIndicatorModal() {
            const modal = document.getElementById('indicator-modal');
            modal.classList.remove('active');
        }

        // Get youth-specific tips
        function getYouthTip(indicator) {
            const tips = {
                selic: 'Com a Selic alta, considere investimentos em Tesouro Selic ou CDBs. É uma boa oportunidade para renda fixa!',
                ipca: 'Acompanhe a inflação para proteger seu dinheiro. Investimentos que rendem acima do IPCA preservam seu poder de compra.',
                cdi: 'O CDI é sua referência para renda fixa. Procure investimentos que paguem pelo menos 100% do CDI.',
                dollar: 'Dólar alto pode ser oportunidade para investir em fundos cambiais ou ações de exportadoras.',
                euro: 'Diversificar em moedas estrangeiras pode proteger contra desvalorização do real.',
                bitcoin: 'Bitcoin é volátil mas pode ser parte de uma carteira diversificada. Comece com pouco!',
                pound: 'Libra é uma moeda estável para diversificação internacional de longo prazo.',
                ibovespa: 'Ibovespa em alta pode indicar bom momento para ações brasileiras. Estude as empresas antes de investir!',
                sp500: 'S&P 500 é excelente para exposição ao mercado americano. Considere ETFs que replicam este índice.',
                nasdaq: 'Para quem acredita em tecnologia, Nasdaq oferece exposição às maiores empresas de tech do mundo.',
                nikkei: 'Mercado japonês pode oferecer diversificação geográfica interessante para sua carteira.'
            };
            return tips[indicator] || 'Sempre estude antes de investir e diversifique sua carteira!';
        }

        // Add to watchlist (placeholder)
        function addToWatchlist(indicator) {
            alert(`${indicatorsData[indicator].title} adicionado aos seus favoritos! 🌟`);
        }

        // Share indicator (placeholder)
        function shareIndicator(indicator) {
            const data = indicatorsData[indicator];
            const text = `📊 ${data.title}: ${data.current} (${data.change}) - Acompanhe no Lumi Bank!`;
            
            if (navigator.share) {
                navigator.share({
                    title: `${data.title} - Lumi Bank`,
                    text: text,
                    url: window.location.href
                });
            } else {
                navigator.clipboard.writeText(text).then(() => {
                    alert('Informação copiada para a área de transferência! 📋');
                });
            }
        }

        // Update indicators with simulated real-time data
        function updateIndicators() {
            // Simulate small random changes
            const elements = [
                { id: 'selic-rate', base: 13.75 },
                { id: 'ipca-rate', base: 4.62 },
                { id: 'cdi-rate', base: 13.65 },
                { id: 'dollar-rate', base: 5.12, prefix: 'R$ ' },
                { id: 'euro-rate', base: 5.58, prefix: 'R$ ' },
                { id: 'bitcoin-rate', base: 267450, prefix: 'R$ ', format: 'number' },
                { id: 'pound-rate', base: 6.47, prefix: 'R$ ' },
                { id: 'ibovespa-rate', base: 127845, format: 'number' },
                { id: 'sp500-rate', base: 4567.89 },
                { id: 'nasdaq-rate', base: 14234.56 },
                { id: 'nikkei-rate', base: 33567.12 }
            ];

            elements.forEach(element => {
                const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
                let newValue = element.base * (1 + variation);
                
                let displayValue;
                if (element.format === 'number') {
                    displayValue = Math.round(newValue).toLocaleString('pt-BR');
                } else {
                    displayValue = newValue.toFixed(2).replace('.', ',');
                }
                
                const fullValue = (element.prefix || '') + displayValue + (element.id.includes('rate') && !element.prefix ? '%' : '');
                
                const elementNode = document.getElementById(element.id);
                if (elementNode) {
                    elementNode.textContent = fullValue;
                }
            });
        }

        // Close modal when clicking outside
        document.getElementById('indicator-modal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                closeIndicatorModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeIndicatorModal();
            }
        });

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Add interactive effects
        document.querySelectorAll('.gamification-element').forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.transform = 'scale(1.02)';
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'scale(1)';
            });
        });


// <----------------------------------- FIM ANIMAÇÕES E FUNCIONALIDADES INDICADORES ECONOMICOS --------------------------->


// <------------------------------------ INICIO ANIMAÇÕES E FUNCIONALIDADES SITE ----------------------------------------->


        // Gamification System
        let userStats = {
            level: 7,
            xp: 2847,
            maxXp: 3000,
            coins: 1247,
            streak: 7,
            achievements: [],
            dailyMissions: [
                { id: 1, title: 'Economizar R$ 20', reward: 25, completed: true, icon: '✅' },
                { id: 2, title: 'Pagar conta de luz', reward: 15, completed: false, icon: '⏳' },
                { id: 3, title: 'Ler artigo financeiro', reward: 10, completed: false, icon: '📚' }
            ],
            balance: 2847.50,
            transactions: [
                { type: 'income', description: 'Rendimento CDB', amount: 45.30, icon: '📈' },
                { type: 'expense', description: 'Supermercado', amount: -127.80, icon: '🛒' },
                { type: 'expense', description: 'Conta de luz', amount: -89.50, icon: '⚡' }
            ],
            alerts: [
                { type: 'warning', message: 'Cartão: 85% do limite', icon: '⚠️' },
                { type: 'danger', message: 'Fatura vence em 3 dias', icon: '📅' }
            ]
        };

        // Financial Indicators Data
        let financialData = {
            currencies: {
                usd: { rate: 5.12, change: 0.8 },
                eur: { rate: 5.58, change: -0.3 },
                btc: { rate: 267890, change: 2.1 }
            },
            rates: {
                selic: 11.75,
                cdi: 11.65,
                ipca: 4.23
            },
            stocks: {
                ibov: { value: 127842, change: 1.2 },
                ifix: { value: 2847, change: 0.8 },
                small11: { value: 3124, change: -0.5 }
            },
            commodities: {
                oil: { price: 82.45, change: 2.1 },
                gold: { price: 2018, change: -0.5 },
                soy: { price: 12.87, change: 1.3 }
            }
        };

        // Particle System
        function createParticles() {
            const container = document.getElementById('particles-container');
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 6 + 's';
                particle.style.animationDuration = (6 + Math.random() * 4) + 's';
                container.appendChild(particle);
            }
        }

        // Achievement System
        function showAchievement(title, description, icon, xp) {
            const popup = document.getElementById('achievement-popup');
            document.getElementById('achievement-title').textContent = title;
            document.getElementById('achievement-desc').textContent = description;
            document.getElementById('achievement-icon').textContent = icon;
            
            popup.classList.add('show');
            
            // Auto hide after 4 seconds
            setTimeout(() => {
                popup.classList.remove('show');
            }, 4000);
        }

        // Start Journey Function
        function startJourney() {
            showAchievement('Jornada Iniciada!', 'Bem-vindo ao Lumi! Sua aventura financeira começou', '🚀', 50);
            
            // Animate stats counter
            animateCounter('users-count', 50000, 'K+', 50);
            animateCounter('courses-count', 200, '+', 200);
            animateCounter('achievements-count', 1000000, 'M+', 1000);
        }

        // Counter animation
        function animateCounter(elementId, target, suffix, increment) {
            const element = document.getElementById(elementId);
            let current = 0;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                
                let displayValue;
                if (suffix === 'K+') {
                    displayValue = Math.floor(current / 1000) + 'K+';
                } else if (suffix === 'M+') {
                    displayValue = Math.floor(current / 1000000) + 'M+';
                } else {
                    displayValue = current + suffix;
                }
                
                element.textContent = displayValue;
            }, 50);
        }

        // Hide mobile menu when opening any modal
        function hideMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            const btn = document.getElementById('mobile-menu-btn');
            
            if (menu && !menu.classList.contains('-translate-x-full')) {
                menu.classList.add('-translate-x-full');
                menu.classList.remove('translate-x-0');
                btn.innerHTML = '<span class="text-xl">☰</span>';
            }
        }

        // Hide all menus when opening any modal
        function hideAllMenus() {
            hideMobileMenu();
            // No additional action needed for desktop menu as it's always visible
        }

        // Feature Demo System
        function showFeatureDemo(feature) {
            hideAllMenus(); // Hide all menus when opening modal
            
            const modal = document.getElementById('feature-demo');
            const icon = document.getElementById('demo-icon');
            const title = document.getElementById('demo-title');
            const description = document.getElementById('demo-description');
            const content = document.getElementById('demo-content');
            
            const demos = {
                education: {
                    icon: '🎓',
                    title: 'Educação Gamificada',
                    description: 'Veja como funciona nosso sistema de aprendizado',
                    content: `
                        <div class="space-y-4">
                            <div class="bg-gray-800/50 rounded-lg p-4">
                                <div class="flex items-center justify-between mb-3">
                                    <h4 class="font-semibold">Curso: Investimentos Básicos</h4>
                                    <span class="text-sm text-lumi-green">3/5 ⭐</span>
                                </div>
                                <div class="w-full bg-gray-700 rounded-full h-3 mb-2">
                                    <div class="progress-bar h-3 rounded-full" style="width: 60%"></div>
                                </div>
                                <div class="flex justify-between text-sm text-gray-400">
                                    <span>Progresso: 60%</span>
                                    <span>+150 XP ao completar</span>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="bg-lumi-blue/20 rounded-lg p-3 text-center">
                                    <div class="text-2xl mb-1">🏆</div>
                                    <div class="text-xs">Conquistas</div>
                                    <div class="font-bold text-lumi-blue">15</div>
                                </div>
                                <div class="bg-lumi-green/20 rounded-lg p-3 text-center">
                                    <div class="text-2xl mb-1">🎯</div>
                                    <div class="text-xs">Desafios</div>
                                    <div class="font-bold text-lumi-green">8</div>
                                </div>
                            </div>
                            <div class="flex flex-col xs:flex-row sm:flex-row gap-2 sm:gap-3">
                                <button onclick="closeFeatureDemo()" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 sm:py-3 rounded-lg transition-colors text-xs sm:text-sm md:text-base min-h-[44px]">
                                    Fechar
                                </button>
                                <button onclick="window.location.href='https://fernanda0408.github.io/Jogos-Lumi/'" class="flex-1 animated-gradient text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-300 text-xs sm:text-sm md:text-base min-h-[44px]">
                                    Experimentar Agora
                                </button>
                            </div>
                        </div>
                    `
                },
                goals: {
                    icon: '🎯',
                    title: 'Metas Inteligentes',
                    description: 'Sistema de metas com recompensas',
                    content: `
                        <div class="space-y-4">
                            <div class="bg-gray-800/50 rounded-lg p-4">
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center space-x-2">
                                        <span class="text-lg">🏖️</span>
                                        <span class="font-semibold">Viagem dos Sonhos</span>
                                    </div>
                                    <span class="text-sm text-lumi-green font-bold">75%</span>
                                </div>
                                <div class="w-full bg-gray-700 rounded-full h-3 mb-2">
                                    <div class="progress-bar h-3 rounded-full" style="width: 75%"></div>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-400">R$ 2.250 / R$ 3.000</span>
                                    <span class="text-lumi-green">Faltam R$ 750</span>
                                </div>
                            </div>
                            <div class="bg-lumi-blue/20 rounded-lg p-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm font-semibold">🎯 Missão Ativa</span>
                                    <span class="text-xs text-yellow-400">+75 🪙</span>
                                </div>
                                <p class="text-xs text-gray-300 mt-1">Economize R$ 50 esta semana em delivery</p>
                            </div>
                            <div class="flex flex-col xs:flex-row sm:flex-row gap-2 sm:gap-3">
                                <button onclick="closeFeatureDemo()" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 sm:py-3 rounded-lg transition-colors text-xs sm:text-sm md:text-base min-h-[44px]">
                                    Fechar
                                </button>
                                <button class="flex-1 animated-gradient text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-300 text-xs sm:text-sm md:text-base min-h-[44px]">
                                    Experimentar Agora
                                </button>
                            </div>
                        </div>
                    `
                },
                analysis: {
                    icon: '📊',
                    title: 'Análise Inteligente',
                    description: 'IA personalizada para suas finanças',
                    content: `
                        <div class="space-y-4">
                            <div class="bg-gray-800/50 rounded-lg p-4">
                                <div class="flex items-center justify-between mb-3">
                                    <span class="font-semibold">💡 Insight da IA</span>
                                    <span class="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">NOVO</span>
                                </div>
                                <p class="text-sm text-gray-300 mb-3">Você gastou 23% mais em entretenimento este mês. Que tal um desafio de economia?</p>
                                <button class="w-full bg-purple-500/20 text-purple-400 py-2 rounded-lg text-sm font-semibold">
                                    Aceitar Desafio (+50 XP)
                                </button>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="bg-red-500/20 rounded-lg p-3 text-center">
                                    <div class="text-lg mb-1">📉</div>
                                    <div class="text-xs text-red-400">Gastos</div>
                                    <div class="font-bold text-red-400">-12%</div>
                                </div>
                                <div class="bg-green-500/20 rounded-lg p-3 text-center">
                                    <div class="text-lg mb-1">📈</div>
                                    <div class="text-xs text-green-400">Economia</div>
                                    <div class="font-bold text-green-400">+8%</div>
                                </div>
                            </div>
                            <div class="flex flex-col xs:flex-row sm:flex-row gap-2 sm:gap-3">
                                <button onclick="closeFeatureDemo()" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 sm:py-3 rounded-lg transition-colors text-xs sm:text-sm md:text-base min-h-[44px]">
                                    Fechar
                                </button>
                                <button onclick="window.location.href='https://keth207.github.io/controlador-com-AI/'" class="flex-1 animated-gradient text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-300 text-xs sm:text-sm md:text-base min-h-[44px]">
                                    Experimentar Agora
                                </button>
                            </div>
                        </div>
                    `
                }
            };
            
            const demo = demos[feature];
            icon.textContent = demo.icon;
            title.textContent = demo.title;
            description.textContent = demo.description;
            content.innerHTML = demo.content;
            
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.querySelector('.glass-effect').classList.remove('scale-90');
            modal.querySelector('.glass-effect').classList.add('scale-100');
        }

        function closeFeatureDemo() {
            const modal = document.getElementById('feature-demo');
            modal.classList.add('opacity-0', 'pointer-events-none');
            modal.querySelector('.glass-effect').classList.add('scale-90');
            modal.querySelector('.glass-effect').classList.remove('scale-100');
        }

        // Enhanced Investment Calculator with Gamification
        function calculateInvestment() {
            const initialValue = parseFloat(document.getElementById('initialValue').value) || 0;
            const monthlyValue = parseFloat(document.getElementById('monthlyValue').value) || 0;
            const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
            const timePeriod = parseFloat(document.getElementById('timePeriod').value) || 0;
            
            const monthlyRate = interestRate / 100 / 12;
            const totalMonths = timePeriod * 12;
            
            // Calculate compound interest with monthly contributions
            let finalValue = initialValue;
            for (let i = 0; i < totalMonths; i++) {
                finalValue = (finalValue + monthlyValue) * (1 + monthlyRate);
            }
            
            const totalInvested = initialValue + (monthlyValue * totalMonths);
            const totalReturn = finalValue - totalInvested;
            
            // Update display with animation
            animateValue('totalInvested', totalInvested);
            animateValue('finalValue', finalValue);
            animateValue('totalReturn', totalReturn);
            
            // Award XP for using simulator
            if (!userStats.achievements.includes('first_simulation')) {
                userStats.achievements.push('first_simulation');
                //showAchievement('Primeira Simulação!', 'Você fez sua primeira simulação de investimento', '📊', 25);
            }
        }

        // Animate number values
        function animateValue(elementId, targetValue) {
            const element = document.getElementById(elementId);
            const startValue = 0;
            const duration = 1000;
            const startTime = performance.now();
            
            function updateValue(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentValue = startValue + (targetValue - startValue) * progress;
                
                element.textContent = `R$ ${currentValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
                
                if (progress < 1) {
                    requestAnimationFrame(updateValue);
                }
            }
            
            requestAnimationFrame(updateValue);
        }

        // Balance counter animation
        function animateBalance() {
            const element = document.getElementById('balance-counter');
            let current = 2500;
            const target = 2847.50;
            const increment = (target - current) / 50;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                element.textContent = `R$ ${current.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
            }, 50);
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Form submission handler with gamification
        function initFormHandler() {
            const form = document.querySelector('form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    showAchievement('Interesse Registrado!', 'Obrigado por se interessar pelo Lumi!', '📝', 30);
                    
                    setTimeout(() => {
                        alert('Obrigado pelo interesse! Este é um site demonstrativo. Em um ambiente real, seus dados seriam processados com segurança e você receberia mais informações sobre como abrir sua conta no Lumi.');
                    }, 1000);
                });
            }
        }

        // Add scroll animations with gamification
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('slide-in');
                    
                    // Award XP for exploring sections
                    const sectionId = entry.target.id;
                    if (sectionId && !userStats.achievements.includes(`visited_${sectionId}`)) {
                        userStats.achievements.push(`visited_${sectionId}`);
                        userStats.xp += 10;
                    }
                }
            });
        }, observerOptions);

        // Observe all sections
        document.querySelectorAll('section').forEach(section => {
            observer.observe(section);
        });

        // Enhanced Mobile menu functionality
        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            const btn = document.getElementById('mobile-menu-btn');
            const menuLines = btn.querySelectorAll('span');
            
            if (menu.classList.contains('translate-x-full')) {
                // Open menu
                menu.classList.remove('translate-x-full');
                menu.classList.add('translate-x-0');
                
                // Animate hamburger to X
                menuLines[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
                menuLines[1].style.opacity = '0';
                menuLines[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
            } else {
                // Close menu
                menu.classList.add('translate-x-full');
                menu.classList.remove('translate-x-0');
                
                // Animate X back to hamburger
                menuLines[0].style.transform = 'none';
                menuLines[1].style.opacity = '1';
                menuLines[2].style.transform = 'none';
            }
        }

        // Update Financial Indicators
        function updateFinancialIndicators() {
            // Simulate real-time updates with small random variations
            Object.keys(financialData.currencies).forEach(currency => {
                const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
                financialData.currencies[currency].change += variation;
                financialData.currencies[currency].rate *= (1 + variation / 100);
            });
            
            // Update ticker display
            updateTicker();
        }

        // Update ticker with current data
        function updateTicker() {
            const usdRate = document.getElementById('usd-rate');
            const usdChange = document.getElementById('usd-change');
            const eurRate = document.getElementById('eur-rate');
            const eurChange = document.getElementById('eur-change');
            
            if (usdRate) {
                usdRate.textContent = `R$ ${financialData.currencies.usd.rate.toFixed(2)}`;
                usdChange.textContent = `${financialData.currencies.usd.change >= 0 ? '+' : ''}${financialData.currencies.usd.change.toFixed(1)}%`;
                usdChange.className = financialData.currencies.usd.change >= 0 ? 'text-green-400 text-xs' : 'text-red-400 text-xs';
            }
            
            if (eurRate) {
                eurRate.textContent = `R$ ${financialData.currencies.eur.rate.toFixed(2)}`;
                eurChange.textContent = `${financialData.currencies.eur.change >= 0 ? '+' : ''}${financialData.currencies.eur.change.toFixed(1)}%`;
                eurChange.className = financialData.currencies.eur.change >= 0 ? 'text-green-400 text-xs' : 'text-red-400 text-xs';
            }
        }

        // Complete Daily Mission
        function completeMission(missionId) {
            const mission = userStats.dailyMissions.find(m => m.id === missionId);
            if (mission && !mission.completed) {
                mission.completed = true;
                mission.icon = '✅';
                userStats.coins += mission.reward;
                userStats.xp += mission.reward;
                
                showAchievement('Missão Concluída!', mission.title, '🎯', 0);
                
                // Update mission display in phone mockup
                updateMissionDisplay();
            }
        }

        // Update mission display
        function updateMissionDisplay() {
            // This would update the phone mockup missions in a real implementation
            console.log('Missions updated:', userStats.dailyMissions);
        }

        // Simulate market volatility
        function simulateMarketMovement() {
            // Add small random movements to create realistic market feel
            const elements = document.querySelectorAll('[id$="-change"]');
            elements.forEach(element => {
                if (Math.random() < 0.1) { // 10% chance of change
                    const currentValue = parseFloat(element.textContent.replace(/[+%]/g, ''));
                    const variation = (Math.random() - 0.5) * 0.2;
                    const newValue = currentValue + variation;
                    
                    element.textContent = `${newValue >= 0 ? '+' : ''}${newValue.toFixed(1)}%`;
                    element.className = newValue >= 0 ? 'text-green-400 text-xs' : 'text-red-400 text-xs';
                }
            });
        }

        // Support System Functions
        function openLiveChat() {
            showAchievement('Chat Iniciado!', 'Luna está aqui para ajudar você', '💬', 15);
            
            // Simulate chat opening
            setTimeout(() => {
                alert('💬 Chat ao Vivo\n\nLuna: Olá! Sou a Luna, sua assistente virtual do Lumi. Como posso ajudar você hoje?\n\n• Dúvidas sobre investimentos\n• Problemas técnicos\n• Informações sobre cursos\n• Suporte geral\n\nEm um ambiente real, você seria conectado com nossa equipe de suporte 24/7!');
            }, 500);
        }

        function submitSupportForm(event) {
            event.preventDefault();
            showAchievement('Solicitação Enviada!', 'Responderemos em até 2 horas', '📧', 20);
            
            setTimeout(() => {
                alert('📧 Formulário Enviado!\n\nObrigado por entrar em contato conosco. Sua solicitação foi registrada e nossa equipe responderá em até 2 horas.\n\nNúmero do protocolo: #LM' + Math.floor(Math.random() * 10000) + '\n\nEm um ambiente real, você receberia um e-mail de confirmação.');
            }, 1000);
        }

        function toggleFAQ(id) {
            const content = document.getElementById(`faq-content-${id}`);
            const icon = document.getElementById(`faq-icon-${id}`);
            
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                icon.textContent = '−';
                icon.classList.remove('text-lumi-green');
                icon.classList.add('text-lumi-blue');
            } else {
                content.classList.add('hidden');
                icon.textContent = '+';
                icon.classList.remove('text-lumi-blue');
                icon.classList.add('text-lumi-green');
            }
        }

        function openFullFAQ() {
            showAchievement('FAQ Acessado!', 'Explore nossas perguntas frequentes', '❓', 10);
            
            setTimeout(() => {
                alert('❓ FAQ Completo\n\nAqui você encontraria:\n\n• Como começar a investir (Básico)\n• Segurança e proteção de dados\n• Sistema de gamificação\n• Tipos de investimento disponíveis\n• Como resgatar moedas\n• Política de privacidade\n• Termos de uso\n• Suporte técnico\n• E muito mais!\n\nEm um ambiente real, isso abriria uma página completa com todas as perguntas e respostas organizadas por categoria.');
            }, 500);
        }

        // Animate metrics counters
        function animateMetrics() {
            const metrics = [
                { id: 'retention-rate', target: 94.2, suffix: '%' },
                { id: 'missions-completed', target: 2.8, suffix: 'M' },
                { id: 'courses-completed', target: 847, suffix: 'K' },
                { id: 'satisfaction-rate', target: 4.9, suffix: '/5' }
            ];

            metrics.forEach(metric => {
                const element = document.getElementById(metric.id);
                if (element) {
                    let current = 0;
                    const increment = metric.target / 50;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= metric.target) {
                            current = metric.target;
                            clearInterval(timer);
                        }
                        element.textContent = current.toFixed(metric.suffix === '/5' ? 1 : 1) + metric.suffix;
                    }, 50);
                }
            });
        }

        // Update metrics in real-time
        function updateMetrics() {
            const retentionElement = document.getElementById('retention-rate');
            const missionsElement = document.getElementById('missions-completed');
            const coursesElement = document.getElementById('courses-completed');
            
            if (retentionElement) {
                const currentRetention = parseFloat(retentionElement.textContent);
                const variation = (Math.random() - 0.5) * 0.1;
                const newRetention = Math.max(90, Math.min(99, currentRetention + variation));
                retentionElement.textContent = newRetention.toFixed(1) + '%';
            }
            
            if (missionsElement) {
                const currentMissions = parseFloat(missionsElement.textContent);
                const newMissions = currentMissions + (Math.random() * 0.01);
                missionsElement.textContent = newMissions.toFixed(1) + 'M';
            }
            
            if (coursesElement) {
                const currentCourses = parseFloat(coursesElement.textContent);
                const newCourses = currentCourses + (Math.random() * 0.5);
                coursesElement.textContent = Math.floor(newCourses) + 'K';
            }
        }

        // Digital Account Functions
        function openDigitalAccount() {
            hideAllMenus(); // Hide all menus when opening modal
            
            const modal = document.getElementById('digital-account-modal');
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.querySelector('.glass-effect').classList.remove('scale-90');
            modal.querySelector('.glass-effect').classList.add('scale-100');
            
            showAchievement('Conta Digital!', 'Explore os recursos da sua conta', '🏦', 15);
        }

        function closeDigitalAccount() {
            const modal = document.getElementById('digital-account-modal');
            modal.classList.add('opacity-0', 'pointer-events-none');
            modal.querySelector('.glass-effect').classList.add('scale-90');
            modal.querySelector('.glass-effect').classList.remove('scale-100');
        }

        function calculateAccountYield() {
            const balance = parseFloat(document.getElementById('account-balance').value) || 0;
            const period = parseFloat(document.getElementById('account-period').value) || 0;
            const cdiRate = 11.65; // CDI atual
            
            const monthlyRate = (cdiRate / 100) / 12;
            const finalValue = balance * Math.pow(1 + monthlyRate, period);
            const yield = finalValue - balance;
            
            document.getElementById('account-final-value').textContent = `R$ ${finalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
            document.getElementById('account-yield').textContent = `R$ ${yield.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
            document.getElementById('account-result').classList.remove('hidden');
            
            showAchievement('Simulação Realizada!', 'Veja como seu dinheiro pode render', '📈', 20);
        }

        function openAccount() {
            showAchievement('Interesse Registrado!', 'Em breve você receberá mais informações', '🎉', 30);
            
            setTimeout(() => {
                alert('🏦 Abertura de Conta\n\nParabéns! Seu interesse foi registrado.\n\nEm um ambiente real, você seria direcionado para:\n\n• Formulário de abertura de conta\n• Verificação de documentos\n• Configuração de segurança\n• Primeiro depósito\n\nSua conta seria aberta em poucos minutos!');
                closeDigitalAccount();
            }, 1000);
        }

        // Debit Card Functions
        function openDebitCard() {
            hideAllMenus(); // Hide all menus when opening modal
            
            const modal = document.getElementById('debit-card-modal');
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.querySelector('.glass-effect').classList.remove('scale-90');
            modal.querySelector('.glass-effect').classList.add('scale-100');
            
            showAchievement('Cartão de Débito!', 'Conheça o cartão mais inteligente', '💳', 15);
        }

        function closeDebitCard() {
            const modal = document.getElementById('debit-card-modal');
            modal.classList.add('opacity-0', 'pointer-events-none');
            modal.querySelector('.glass-effect').classList.add('scale-90');
            modal.querySelector('.glass-effect').classList.remove('scale-100');
        }

        function requestCard() {
            showAchievement('Cartão Solicitado!', 'Seu cartão chegará em 5 dias úteis', '🚚', 25);
            
            setTimeout(() => {
                alert('💳 Solicitação de Cartão\n\nSeu cartão de débito Lumi foi solicitado!\n\n📦 Entrega: 5 dias úteis\n🆓 Taxa: Gratuito\n🔒 Segurança: Chip + Contactless\n🎯 Controles: Disponíveis no app\n\nEm um ambiente real, você receberia:\n• Código de rastreamento\n• Instruções de ativação\n• Guia de primeiros passos\n\nSeu cartão seria entregue no endereço cadastrado!');
                closeDebitCard();
            }, 1000);
        }

        // PIX System Functions
        function openPixSystem() {
            hideAllMenus(); // Hide all menus when opening modal
            
            const modal = document.getElementById('pix-modal');
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.querySelector('.glass-effect').classList.remove('scale-90');
            modal.querySelector('.glass-effect').classList.add('scale-100');
            
            showAchievement('PIX Lumi!', 'Transferências instantâneas e inteligentes', '⚡', 15);
        }

        function closePixSystem() {
            const modal = document.getElementById('pix-modal');
            modal.classList.add('opacity-0', 'pointer-events-none');
            modal.querySelector('.glass-effect').classList.add('scale-90');
            modal.querySelector('.glass-effect').classList.remove('scale-100');
        }

        function sendPix() {
            const keyType = document.getElementById('pix-key-type').value;
            const key = document.getElementById('pix-key').value;
            const amount = parseFloat(document.getElementById('pix-amount').value);
            const description = document.getElementById('pix-description').value;
            
            if (!key || !amount || amount <= 0) {
                alert('⚠️ Preencha todos os campos obrigatórios!');
                return;
            }
            
            // Simulate PIX processing
            const processingSteps = [
                'Validando chave PIX...',
                'Verificando saldo...',
                'Processando transferência...',
                'PIX realizado com sucesso!'
            ];
            
            let currentStep = 0;
            const interval = setInterval(() => {
                if (currentStep < processingSteps.length - 1) {
                    alert(`⚡ ${processingSteps[currentStep]}`);
                    currentStep++;
                } else {
                    clearInterval(interval);
                    
                    // Award XP and coins for PIX
                    userStats.xp += 15;
                    userStats.coins += 5;
                    
                    showAchievement('PIX Enviado!', `R$ ${amount.toFixed(2)} transferido com sucesso`, '✅', 0);
                    
                    setTimeout(() => {
                        alert(`✅ PIX Realizado!\n\n💰 Valor: R$ ${amount.toFixed(2)}\n🔑 Chave: ${key}\n📝 Descrição: ${description || 'Sem descrição'}\n⏰ Horário: ${new Date().toLocaleTimeString()}\n\n🪙 Você ganhou 5 moedas Lumi!\n⭐ +15 XP adicionados!\n\nEm um ambiente real, o dinheiro seria transferido instantaneamente e você receberia um comprovante completo.`);
                        
                        // Clear form
                        document.getElementById('pix-key').value = '';
                        document.getElementById('pix-amount').value = '';
                        document.getElementById('pix-description').value = '';
                    }, 1500);
                }
            }, 1000);
        }

        function generatePixKey() {
            const randomKey = generateRandomPixKey();
            showAchievement('Chave PIX Criada!', 'Nova chave aleatória gerada', '🔑', 10);
            
            setTimeout(() => {
                alert(`🔑 Nova Chave PIX Criada!\n\nSua chave aleatória:\n${randomKey}\n\n✅ Chave ativa e pronta para uso\n🔒 Totalmente segura\n📋 Copiada para área de transferência\n\nVocê pode usar esta chave para receber PIX de qualquer pessoa!`);
            }, 500);
        }

        function generateRandomPixKey() {
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < 32; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
                if (i === 7 || i === 15 || i === 23) result += '-';
            }
            return result;
        }

        function openPixApp() {
            showAchievement('App PIX!', 'Redirecionando para o aplicativo', '📱', 10);
            
            setTimeout(() => {
                alert('📱 Aplicativo PIX Lumi\n\nEm um ambiente real, você seria direcionado para:\n\n• Download do app na loja\n• Login com biometria\n• Interface completa do PIX\n• Histórico de transações\n• Configurações avançadas\n• QR Code para recebimentos\n• PIX agendado\n• Limites personalizados\n\nO app ofereceria a experiência completa do PIX Lumi!');
                closePixSystem();
            }, 1000);
        }

        // Enhanced Card Controls
        function toggleCardFeature(feature, element) {
            const isEnabled = element.checked;
            const message = isEnabled ? 'ativado' : 'desativado';
            
            showAchievement('Controle Atualizado!', `${feature} ${message}`, '🎮', 5);
            
            // Simulate real-time card control
            setTimeout(() => {
                alert(`🎮 Controle do Cartão\n\n${feature} foi ${message} com sucesso!\n\n⚡ Alteração aplicada instantaneamente\n🔒 Seu cartão está protegido\n📱 Você pode alterar a qualquer momento\n\nEm um ambiente real, a mudança seria sincronizada imediatamente com seu cartão físico.`);
            }, 500);
        }

        // New Banking Services Functions
        function openCreditCard() {
            showAchievement('Cartão de Crédito!', 'Conheça nosso cartão sem anuidade', '💳', 15);
            
            setTimeout(() => {
                alert('💳 Cartão de Crédito Lumi\n\n✨ Recursos Exclusivos:\n\n• Sem anuidade para sempre\n• Cashback inteligente até 5%\n• Limite inicial até R$ 50.000\n• Controle total pelo app\n• Programa de pontos gamificado\n• Parcelamento inteligente\n• Proteção contra fraudes\n• Cartão virtual instantâneo\n\nEm um ambiente real, você poderia:\n• Solicitar o cartão em 2 minutos\n• Receber aprovação instantânea\n• Usar o cartão virtual imediatamente\n• Receber o físico em 5 dias úteis');
            }, 500);
        }

        function openInvestments() {
            showAchievement('Investimentos!', 'Explore nossas opções de investimento', '📈', 15);
            
            setTimeout(() => {
                alert('📈 Investimentos Lumi\n\n🎯 Produtos Disponíveis:\n\n• CDB: A partir de 12% a.a.\n• Tesouro Direto: Taxa zero\n• Ações: Corretagem R$ 0\n• Fundos: Mais de 500 opções\n• FIIs: Diversificação imobiliária\n• Criptomoedas: Bitcoin, Ethereum e mais\n• COE: Produtos estruturados\n• Debêntures: Renda fixa privada\n\n💡 Diferenciais:\n• Investimento mínimo: R$ 1\n• Recomendações personalizadas por IA\n• Educação financeira integrada\n• Simuladores avançados\n• Acompanhamento em tempo real');
            }, 500);
        }

        function openLoans() {
            showAchievement('Empréstimos!', 'Crédito justo e transparente', '💰', 15);
            
            setTimeout(() => {
                alert('💰 Empréstimos Lumi\n\n🏦 Modalidades Disponíveis:\n\n• Crédito Pessoal: 1,2% a.m.\n• Antecipação do 13º: 0,9% a.m.\n• Empréstimo com garantia: 0,8% a.m.\n• Crédito estudantil: 0,5% a.m.\n• Financiamento de cursos: Taxa zero\n\n⚡ Vantagens:\n• Aprovação em até 5 minutos\n• Sem burocracia\n• Parcelas flexíveis\n• Sem taxas ocultas\n• Pagamento antecipado sem multa\n• Simulação transparente\n• Educação financeira incluída');
            }, 500);
        }

        function openInsurance() {
            showAchievement('Seguros!', 'Proteção completa para sua vida', '🛡️', 15);
            
            setTimeout(() => {
                alert('🛡️ Seguros Lumi\n\n🔒 Proteções Disponíveis:\n\n• Seguro de Vida: R$ 9,90/mês\n• Seguro Celular: R$ 12,90/mês\n• Seguro Viagem: R$ 15,90/mês\n• Seguro Residencial: R$ 19,90/mês\n• Seguro Auto: Cotação personalizada\n• Seguro Saúde: Planos jovens\n• Seguro Dental: R$ 29,90/mês\n• Seguro Pet: R$ 39,90/mês\n\n🎯 Benefícios:\n• Contratação 100% digital\n• Suporte 24/7\n• Acionamento pelo app\n• Sem carência\n• Cobertura nacional\n• Preços especiais para jovens');
            }, 500);
        }

        function openCrypto() {
            showAchievement('Criptomoedas!', 'Invista no futuro do dinheiro', '₿', 15);
            
            setTimeout(() => {
                alert('₿ Criptomoedas Lumi\n\n🚀 Moedas Disponíveis:\n\n• Bitcoin (BTC)\n• Ethereum (ETH)\n• Binance Coin (BNB)\n• Cardano (ADA)\n• Solana (SOL)\n• Polygon (MATIC)\n• Chainlink (LINK)\n• Uniswap (UNI)\n\n💎 Recursos Exclusivos:\n• Taxa zero para compra/venda\n• Investimento mínimo: R$ 10\n• Staking automático\n• DCA (Dollar Cost Average)\n• Alertas de preço\n• Educação cripto gamificada\n• Carteira segura\n• Análise técnica por IA');
            }, 500);
        }

        function openCashback() {
            showAchievement('Cashback Plus!', 'Ganhe dinheiro de volta em tudo', '🎁', 15);
            
            setTimeout(() => {
                alert('🎁 Cashback Plus Lumi\n\n💰 Categorias e Percentuais:\n\n• 🍕 Alimentação: 5% de volta\n• 🎬 Entretenimento: 10% de volta\n• 📚 Educação: 15% de volta\n• ⛽ Combustível: 3% de volta\n• 🛒 Supermercado: 2% de volta\n• 💊 Farmácia: 8% de volta\n• 🚗 Transporte: 4% de volta\n• 👕 Roupas: 6% de volta\n\n🎮 Sistema Gamificado:\n• Multiplicadores por nível\n• Desafios mensais\n• Bônus por categoria\n• Cashback em moedas Lumi\n• Troca por prêmios reais\n• Ranking da comunidade');
            }, 500);
        }

        function openPlanning() {
            showAchievement('Planejamento IA!', 'Consultoria financeira personalizada', '📊', 15);
            
            setTimeout(() => {
                alert('📊 Planejamento Financeiro IA\n\n🤖 Recursos da IA:\n\n• Análise completa do perfil\n• Metas personalizadas\n• Estratégias de investimento\n• Otimização de gastos\n• Previsões de cenários\n• Alertas inteligentes\n• Rebalanceamento automático\n• Relatórios detalhados\n\n🎯 Planos Disponíveis:\n• Reserva de Emergência\n• Aposentadoria\n• Casa própria\n• Viagem dos sonhos\n• Educação dos filhos\n• Independência financeira\n• Empreendedorismo\n• Planos personalizados');
            }, 500);
        }

        function upgradeToPremium() {
            showAchievement('Upgrade Premium!', 'Desbloqueie recursos exclusivos', '👑', 25);
            
            setTimeout(() => {
                alert('👑 Lumi Premium\n\n✨ Recursos Exclusivos:\n\n• Mentoria 1:1 com especialistas\n• XP duplo em todas as atividades\n• Cursos premium exclusivos\n• Análise avançada por IA\n• Suporte prioritário 24/7\n• Cashback premium (até 20%)\n• Investimentos exclusivos\n• Relatórios detalhados\n• Sem limites de transações\n• Cartão premium personalizado\n\n💰 Preço: R$ 19,90/mês\n🎁 Primeiro mês GRÁTIS\n\nEm um ambiente real:\n• Upgrade instantâneo\n• Recursos ativados imediatamente\n• Cancelamento a qualquer momento\n• Garantia de 30 dias');
            }, 1000);
        }

        // Community Functions
        function openSocialFeed() {
            showAchievement('Feed Social!', 'Conecte-se com a comunidade', '📱', 10);
            
            setTimeout(() => {
                alert('📱 Feed da Comunidade Lumi\n\n🌟 Recursos Sociais:\n\n• Timeline personalizada\n• Posts sobre conquistas\n• Dicas de investimento\n• Desafios da comunidade\n• Grupos por interesse\n• Mentores verificados\n• Ranking de usuários\n• Eventos ao vivo\n\n💬 Interações:\n• Curtir e comentar\n• Compartilhar conquistas\n• Seguir outros usuários\n• Criar grupos privados\n• Mensagens diretas\n• Notificações em tempo real');
            }, 500);
        }

        function joinChallenge(challengeId) {
            const challenges = {
                '52weeks': {
                    name: 'Desafio 52 Semanas',
                    description: 'Economize R$ 1.378 em um ano',
                    reward: 500
                },
                'nodelivery': {
                    name: 'Mês Sem Delivery',
                    description: 'Economize cozinhando em casa',
                    reward: 200
                },
                'million': {
                    name: 'Primeiro Milhão',
                    description: 'Jornada para R$ 1.000.000',
                    reward: 1000
                }
            };
            
            const challenge = challenges[challengeId];
            if (challenge) {                
                showAchievement('Desafio Aceito!', `Você entrou no ${challenge.name}`, '🏆', 0);
                
                setTimeout(() => {
                    alert(`🏆 ${challenge.name}\n\n${challenge.description}\n\n🎯 Você foi inscrito com sucesso!\n\n🪙 Recompensa: +${challenge.reward} XP\n⭐ Bônus: +${Math.floor(challenge.reward / 10)} moedas\n\n📊 Acompanhe seu progresso:\n• Dashboard personalizado\n• Lembretes diários\n• Dicas personalizadas\n• Suporte da comunidade\n• Celebração de marcos\n\nBoa sorte na sua jornada! 💪`);
                }, 1000);
            }
        }

        function openForums() {
            showAchievement('Fóruns!', 'Participe das discussões', '💬', 10);
            
            setTimeout(() => {
                alert('💬 Fóruns Lumi\n\n📋 Categorias Principais:\n\n• 💰 Investimentos Iniciantes\n• 📈 Análise de Ações\n• 🏠 Fundos Imobiliários\n• ₿ Criptomoedas\n• 💳 Cartões e Cashback\n• 🎯 Metas e Planejamento\n• 🤝 Networking\n• ❓ Dúvidas Gerais\n\n🌟 Recursos:\n• Moderação ativa\n• Especialistas verificados\n• Sistema de reputação\n• Busca avançada\n• Notificações personalizadas\n• Mobile-friendly');
            }, 500);
        }

        function openMentorship() {
            showAchievement('Mentoria!', 'Conecte-se com especialistas', '🎓', 15);
            
            setTimeout(() => {
                alert('🎓 Programa de Mentoria Lumi\n\n👨‍🏫 Mentores Disponíveis:\n\n• Especialistas em investimentos\n• Planejadores financeiros\n• Empreendedores de sucesso\n• Educadores financeiros\n• Ex-executivos do mercado\n• Jovens investidores experientes\n\n📅 Modalidades:\n• Sessões 1:1 (30-60 min)\n• Grupos de mentoria\n• Workshops exclusivos\n• Acompanhamento mensal\n• Planos personalizados\n\n💎 Premium: Acesso ilimitado\n🆓 Gratuito: 1 sessão/mês');
            }, 500);
        }

        function openEvents() {
            showAchievement('Eventos!', 'Participe de webinars e encontros', '📅', 10);
            
            setTimeout(() => {
                alert('📅 Eventos Lumi\n\n🎪 Próximos Eventos:\n\n• Webinar: "Primeiros Passos na Bolsa"\n  📅 Amanhã, 19h\n  👥 2.3K inscritos\n\n• Workshop: "Criptomoedas para Iniciantes"\n  📅 Sábado, 14h\n  👥 1.8K inscritos\n\n• Encontro Presencial SP\n  📅 Próximo mês\n  👥 500 vagas\n\n🎯 Tipos de Eventos:\n• Webinars educativos\n• Workshops práticos\n• Encontros presenciais\n• Lives com especialistas\n• Networking jovem\n• Competições de trading');
            }, 500);
        }

        function openGroups() {
            showAchievement('Grupos!', 'Encontre sua tribo financeira', '👥', 10);
            
            setTimeout(() => {
                alert('👥 Grupos Lumi\n\n🌍 Grupos por Região:\n• São Paulo (12.4K membros)\n• Rio de Janeiro (8.7K membros)\n• Belo Horizonte (5.2K membros)\n• Brasília (4.1K membros)\n• Porto Alegre (3.8K membros)\n\n🎯 Grupos por Interesse:\n• Investidores Iniciantes (15.6K)\n• Cripto Enthusiasts (9.3K)\n• Empreendedores Jovens (7.8K)\n• Mulheres Investidoras (6.4K)\n• Universitários (11.2K)\n\n✨ Recursos dos Grupos:\n• Chat em tempo real\n• Eventos exclusivos\n• Desafios em grupo\n• Mentores dedicados\n• Conteúdo exclusivo');
            }, 500);
        }

        // Account Creation Functions
        function openAccountCreation() {
            hideAllMenus(); // Hide all menus when opening modal
            
            const modal = document.getElementById('account-creation-modal');
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.querySelector('.glass-effect').classList.remove('scale-90');
            modal.querySelector('.glass-effect').classList.add('scale-100');
            
            showAchievement('Criação de Conta!', 'Vamos começar sua jornada financeira', '🚀', 25);
        }

        function closeAccountCreation() {
            const modal = document.getElementById('account-creation-modal');
            modal.classList.add('opacity-0', 'pointer-events-none');
            modal.querySelector('.glass-effect').classList.add('scale-90');
            modal.querySelector('.glass-effect').classList.remove('scale-100');
        }

        function submitAccountCreation(event) {
            event.preventDefault();
            
            // Get form data
            const formData = {
                fullName: document.getElementById('full-name').value,
                birthDate: document.getElementById('birth-date').value,
                cpf: document.getElementById('cpf').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                income: document.getElementById('income').value,
                goal: document.getElementById('goal').value,
                terms: document.getElementById('terms').checked
            };
            
            // Validate required fields
            if (!formData.fullName || !formData.birthDate || !formData.cpf || !formData.phone || !formData.email || !formData.password || !formData.terms) {
                alert('⚠️ Por favor, preencha todos os campos obrigatórios e aceite os termos de uso.');
                return;
            }
            
            // Validate age (must be 16+)
            const birthDate = new Date(formData.birthDate);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (age < 16 || (age === 16 && monthDiff < 0)) {
                alert('⚠️ Você deve ter pelo menos 16 anos para criar uma conta no Lumi.');
                return;
            }
            
            // Validate CPF format (basic)
            if (formData.cpf.length < 11) {
                alert('⚠️ Por favor, digite um CPF válido.');
                return;
            }
            
            // Validate password strength
            if (formData.password.length < 8 || !/\d/.test(formData.password) || !/[A-Z]/.test(formData.password)) {
                alert('⚠️ A senha deve ter pelo menos 8 caracteres, incluindo 1 número e 1 letra maiúscula.');
                return;
            }
            
            // Simulate account creation process
            const steps = [
                'Validando dados pessoais...',
                'Verificando CPF na Receita Federal...',
                'Criando sua conta digital...',
                'Configurando perfil de investidor...',
                'Ativando bônus de boas-vindas...',
                'Conta criada com sucesso!'
            ];
            
            let currentStep = 0;
            const progressInterval = setInterval(() => {
                if (currentStep < steps.length - 1) {
                    alert(`🔄 ${steps[currentStep]}`);
                    currentStep++;
                } else {
                    clearInterval(progressInterval);
                    
                    // Award massive XP and coins for account creation
                    userStats.xp += 500;
                    userStats.coins += 500; // Welcome bonus
                    
                    showAchievement('Conta Criada!', 'Bem-vindo ao Lumi Bank!', '🎉', 0);
                    
                    setTimeout(() => {
                        alert(`🎉 Parabéns! Sua conta Lumi foi criada com sucesso!\n\n👤 Nome: ${formData.fullName}\n📧 E-mail: ${formData.email}\n🎯 Objetivo: ${getGoalText(formData.goal)}\n\n🎁 BÔNUS DE BOAS-VINDAS:\n• R$ 50 de bônus no primeiro depósito\n• 500 moedas Lumi creditadas\n• Acesso gratuito aos cursos básicos\n• Cartão de débito sem anuidade\n• +500 XP de bônus\n\n📱 Próximos passos:\n1. Faça seu primeiro depósito\n2. Complete seu perfil de investidor\n3. Explore os cursos gratuitos\n4. Solicite seu cartão de débito\n\nEm um ambiente real:\n• Você receberia um e-mail de confirmação\n• Teria acesso imediato ao app\n• Poderia fazer seu primeiro PIX\n• Começaria a usar todos os recursos\n\nObrigado por escolher o Lumi! 🚀`);
                        
                        // Clear form and close modal
                        document.getElementById('account-creation-form').reset();
                        closeAccountCreation();
                        
                        // Scroll to features section
                        document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
                    }, 1500);
                }
            }, 1500);
        }

        function getGoalText(goalValue) {
            const goals = {
                'learn': 'Aprender sobre investimentos',
                'save': 'Criar uma reserva de emergência',
                'invest': 'Começar a investir',
                'travel': 'Juntar dinheiro para viagem',
                'house': 'Comprar casa própria',
                'car': 'Comprar um carro',
                'business': 'Abrir um negócio',
                'retirement': 'Planejar aposentadoria'
            };
            return goals[goalValue] || 'Objetivo personalizado';
        }

        // Format input fields
        function formatCPF(input) {
            let value = input.value.replace(/\D/g, '');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            input.value = value;
        }

        function formatPhone(input) {
            let value = input.value.replace(/\D/g, '');
            value = value.replace(/(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
            input.value = value;
        }

        // Initialize everything on page load
        document.addEventListener('DOMContentLoaded', function() {
            createParticles();
            calculateInvestment();
            animateBalance();
            initFormHandler();
            updateTicker();
            
            // Initialize metrics animation when support section is visible
            const supportSection = document.getElementById('support');
            if (supportSection) {
                const metricsObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            animateMetrics();
                            metricsObserver.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.3 });
                
                metricsObserver.observe(supportSection);
            }
            
            // Mobile menu event listeners
            document.getElementById('mobile-menu-btn').addEventListener('click', toggleMobileMenu);
            
            // Close mobile menu when clicking on links
            document.querySelectorAll('.mobile-menu-link').forEach(link => {
                link.addEventListener('click', toggleMobileMenu);
            });
            
            // Add input formatting
            const cpfInput = document.getElementById('cpf');
            const phoneInput = document.getElementById('phone');
            
            if (cpfInput) {
                cpfInput.addEventListener('input', function() {
                    formatCPF(this);
                });
            }
            
            if (phoneInput) {
                phoneInput.addEventListener('input', function() {
                    formatPhone(this);
                });
            }
            
            // Update financial indicators every 30 seconds
            setInterval(updateFinancialIndicators, 30000);
            
            // Simulate market movements every 10 seconds
            setInterval(simulateMarketMovement, 10000);
            
            // Update metrics every 45 seconds
            setInterval(updateMetrics, 45000);
            
            // Welcome achievement
            setTimeout(() => {
                showAchievement('Bem-vindo ao Lumi!', 'Explore nosso site e ganhe XP e moedas', '👋', 20);
            }, 2000);
            
            // Add click handlers for mission completion (demo)
            setTimeout(() => {
                if (Math.random() < 0.3) { // 30% chance to auto-complete a mission for demo
                    const incompleteMissions = userStats.dailyMissions.filter(m => !m.completed);
                    if (incompleteMissions.length > 0) {
                        const randomMission = incompleteMissions[Math.floor(Math.random() * incompleteMissions.length)];
                        completeMission(randomMission.id);
                    }
                }
            }, 5000);
        });

        // Add click effects to interactive buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('interactive-button')) {
                e.target.classList.add('shake');
                setTimeout(() => {
                    e.target.classList.remove('shake');
                }, 500);
            }
        });

(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'96ca7c171150a47d',t:'MTc1NDc3NjM5MC4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();


// <--------------------------------------- FIM ANIMAÇÕES E FUNCIONALIDADES SITE ----------------------------------------->
