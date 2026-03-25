        // Full interactive script (simplified but fully functional)
        const CONFIG = { apiBase: 'https://api.coingecko.com/api/v3', updateInterval: 30000, defaultCoins: ['bitcoin','ethereum','litecoin'] };
        let state = { selectedCoins: new Set(CONFIG.defaultCoins), selectedCurrency: 'usd', autoInterval: null, priceData: {}, chart: null };
        const els = {
            themeToggle: document.getElementById('themeToggle'), currencySelect: document.getElementById('currencySelect'), coinSelect: document.getElementById('coinSelect'),
            coinSearch: document.getElementById('coinSearch'), searchBtn: document.getElementById('searchCoinBtn'), searchResult: document.getElementById('searchResult'),
            fetchBtn: document.getElementById('fetchAllBtn'), startAuto: document.getElementById('startAutoBtn'), stopAuto: document.getElementById('stopAutoBtn'),
            priceGrid: document.getElementById('priceGrid'), updateStatus: document.getElementById('updateStatus'), chartCoin: document.getElementById('chartCoinSelect'),
            chartInterval: document.getElementById('chartInterval'), priceChart: document.getElementById('priceChart'),
            totalMarketCap: document.getElementById('totalMarketCap'), totalVolume: document.getElementById('totalVolume'), btcDominance: document.getElementById('btcDominance'), activeCoins: document.getElementById('activeCoins'), marketCapChange: document.getElementById('marketCapChange')
        };
        function formatCurrency(amt, cur) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur.toUpperCase() }).format(amt); }
        function formatCoin(n) { return n.charAt(0).toUpperCase() + n.slice(1); }
        async function fetchPrices() {
            try {
                const coins = Array.from(state.selectedCoins); if(!coins.length) return;
                const url = `${CONFIG.apiBase}/simple/price?ids=${coins.join(',')}&vs_currencies=${state.selectedCurrency}&include_24h_change=true`;
                const res = await fetch(url); if(!res.ok) throw new Error();
                const data = await res.json(); state.priceData = data; updateUI(); updateTimestamp(); await fetchGlobal();
            } catch(e) { console.error(e); }
        }
        function updateUI() {
            els.priceGrid.innerHTML = '';
            if(Object.keys(state.priceData).length === 0) { els.priceGrid.innerHTML = '<div class="loader"></div><p>Loading...</p>'; return; }
            for(const [id, d] of Object.entries(state.priceData)) {
                const price = d[state.selectedCurrency]; const change = d[`${state.selectedCurrency}_24h_change`] || 0;
                const card = document.createElement('div'); card.className = 'price-card';
                card.innerHTML = `<div class="card-header"><div class="coin-icon"><i class="fas fa-gem"></i></div><div><h3>${formatCoin(id)}</h3><small>${id.toUpperCase()}</small></div></div><div class="price-amount">${formatCurrency(price, state.selectedCurrency)}</div><div class="price-change ${change>=0?'positive':'negative'}"><i class="fas fa-arrow-${change>=0?'up':'down'}"></i> ${change.toFixed(2)}%</div><div style="margin-top:12px; font-size:0.7rem;">24h change</div>`;
                els.priceGrid.appendChild(card);
            }
            els.activeCoins.textContent = Object.keys(state.priceData).length;
        }
        async function fetchGlobal() {
            try { const res = await fetch(`${CONFIG.apiBase}/global`); const data = await res.json(); if(data.data){ els.totalMarketCap.textContent = formatCurrency(data.data.total_market_cap?.[state.selectedCurrency]||0, state.selectedCurrency); els.totalVolume.textContent = formatCurrency(data.data.total_volume?.[state.selectedCurrency]||0, state.selectedCurrency); els.btcDominance.textContent = `${(data.data.market_cap_percentage?.btc||0).toFixed(1)}%`; const ch = data.data.market_cap_change_percentage_24h_usd||0; els.marketCapChange.textContent = `${ch>=0?'+':''}${ch.toFixed(2)}%`; } } catch(e){} }
        function updateTimestamp() { const now = new Date(); els.updateStatus.textContent = `Last updated: ${now.toLocaleTimeString()}`; }
        async function searchCoin() {
            const coin = els.coinSearch.value.toLowerCase().trim(); if(!coin) return;
            els.searchResult.innerHTML = '<div class="loader" style="width:30px;height:30px;"></div>';
            try { const url = `${CONFIG.apiBase}/simple/price?ids=${coin}&vs_currencies=${state.selectedCurrency}&include_24h_change=true`; const res = await fetch(url); const data = await res.json(); if(!data[coin]) throw new Error(); const p = data[coin][state.selectedCurrency]; const ch = data[coin][`${state.selectedCurrency}_24h_change`]||0; els.searchResult.innerHTML = `<div><i class="fas fa-coins" style="font-size:2rem;"></i><h3>${formatCoin(coin)}</h3><div style="font-size:1.5rem;">${formatCurrency(p,state.selectedCurrency)}</div><div class="price-change ${ch>=0?'positive':'negative'}">${ch.toFixed(2)}%</div><button class="btn-action btn-primary" style="margin-top:12px;" onclick="addCoin('${coin}')"><i class="fas fa-plus"></i> Track</button></div>`; } catch(e){ els.searchResult.innerHTML = '<p style="color:#f87171;">Coin not found</p>'; } }
        window.addCoin = (c) => { if(!state.selectedCoins.has(c)){ state.selectedCoins.add(c); const opt = document.createElement('option'); opt.value = c; opt.textContent = `${formatCoin(c)} (${c.toUpperCase()})`; opt.selected = true; els.coinSelect.appendChild(opt); fetchPrices(); els.searchResult.innerHTML = `<p style="color:#10b981;">✓ ${formatCoin(c)} added!</p>`; } };
        function updateSelected(){ const sel = Array.from(els.coinSelect.selectedOptions).map(o=>o.value); state.selectedCoins.clear(); sel.forEach(s=>state.selectedCoins.add(s)); fetchPrices(); }
        async function fetchHistory(coin=els.chartCoin.value, days=els.chartInterval.value) { try { const url = `${CONFIG.apiBase}/coins/${coin}/market_chart?vs_currency=${state.selectedCurrency}&days=${days}`; const res = await fetch(url); const data = await res.json(); if(!data.prices) return; const prices = data.prices.slice(-24*days); const labels = prices.map(([ts])=> days==1?new Date(ts).toLocaleTimeString([],{hour:'2-digit'}):new Date(ts).toLocaleDateString()); const vals = prices.map(([,p])=>p); const ctx = els.priceChart.getContext('2d'); if(state.chart) state.chart.destroy(); state.chart = new Chart(ctx, { type:'line', data:{ labels, datasets:[{ label:`${formatCoin(coin)} price`, data:vals, borderColor:'#6366f1', backgroundColor:'rgba(99,102,241,0.1)', borderWidth:2, fill:true, tension:0.3 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ tooltip:{ callbacks:{ label:(ctx)=>formatCurrency(ctx.raw,state.selectedCurrency) } } }, scales:{ y:{ ticks:{ callback:(v)=>formatCurrency(v,state.selectedCurrency) } } } } }); } catch(e){} }
        function startAuto(){ if(state.autoInterval) clearInterval(state.autoInterval); fetchPrices(); state.autoInterval = setInterval(fetchPrices, CONFIG.updateInterval); els.startAuto.disabled=true; els.stopAuto.disabled=false; }
        function stopAuto(){ if(state.autoInterval){ clearInterval(state.autoInterval); state.autoInterval=null; els.startAuto.disabled=false; els.stopAuto.disabled=true; } }
        function toggleTheme(){ document.body.classList.toggle('dark-theme'); const isDark = document.body.classList.contains('dark-theme'); if(!isDark) document.body.style.background = 'linear-gradient(135deg, #0a0c15 0%, #0f1222 100%)'; else document.body.style.background = 'linear-gradient(135deg, #0a0c15 0%, #0f1222 100%)'; els.themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i> Light' : '<i class="fas fa-moon"></i> Dark'; if(state.chart) state.chart.update(); }
        els.themeToggle.addEventListener('click',toggleTheme);
        els.currencySelect.addEventListener('change',(e)=>{ state.selectedCurrency=e.target.value; fetchPrices(); fetchGlobal(); fetchHistory(); });
        els.coinSelect.addEventListener('change', updateSelected);
        els.searchBtn.addEventListener('click', searchCoin);
        els.fetchBtn.addEventListener('click', fetchPrices);
        els.startAuto.addEventListener('click', startAuto);
        els.stopAuto.addEventListener('click', stopAuto);
        els.chartCoin.addEventListener('change',()=>fetchHistory());
        els.chartInterval.addEventListener('change',()=>fetchHistory());
        document.querySelector('.refresh-news')?.addEventListener('click',()=>alert("Latest news loaded (demo)"));
        fetchPrices(); fetchGlobal(); fetchHistory();
        setInterval(()=>{ if(!state.autoInterval) return; fetchPrices(); }, 30000);
   