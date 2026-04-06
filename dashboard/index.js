const blessed = require('blessed');
const contrib = require('blessed-contrib');
const fs = require('fs');
const path = require('path');

const screen = blessed.screen({ smartCSR: true, title: 'GhostNet PRO Dashboard' });
const grid = new contrib.grid({rows: 12, cols: 12, screen: screen});

// 1. Grafik (Gecikme)
const line = grid.set(0, 0, 8, 8, contrib.line, {
    style: { line: "cyan", text: "white", baseline: "black" },
    label: ' Network Latency (ms) ',
    showLegend: true
});

// 2. Port Tablosu
const table = grid.set(0, 8, 8, 4, contrib.table, {
    keys: true, fg: 'green', label: ' Open Ports ',
    columnSpacing: 1, columnWidth: [10, 10]
});

// 3. Log Ekranı
const log = grid.set(8, 0, 4, 12, contrib.log, { label: ' System Events ', fg: "yellow" });

let latencyData = { title: 'Latency', x: [], y: [] };

function update() {
    const logPath = path.join(__dirname, 'logs', 'metrics.json');
    try {
        if (fs.existsSync(logPath)) {
            const data = JSON.parse(fs.readFileSync(logPath));
            if (data.length > 0) {
                const target = data[0];
                const now = new Date().toLocaleTimeString();

                // Grafiği Güncelle
                latencyData.x.push(now);
                latencyData.y.push(target.latency);
                if (latencyData.x.length > 15) { latencyData.x.shift(); latencyData.y.shift(); }
                line.setData([latencyData]);

                // Tabloyu Güncelle
                const portRows = target.openPorts.map(p => [p.toString(), 'ACTIVE']);
                table.setData({ headers: ['PORT', 'STATUS'], data: portRows });

                log.log(`Analysis: ${target.url} is ${target.status} (${target.latency}ms)`);
            }
        }
    } catch (e) { log.log("Syncing data..."); }
    screen.render();
}

screen.key(['q', 'C-c'], () => process.exit(0));
setInterval(update, 2000);