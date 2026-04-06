const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'metrics.json');
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1490807706804555971/JEEWeMCgL7YYMIsZ2FJn-J7NFAH_z-dZtmpFc5mOowpq2Ene7LioXEE1Ort3Z1ZMxlWf';
const TARGET_HOST = '1.1.1.1'; 

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

let lastStatus = 'UNKNOWN';

/**
 * Sends a highly formatted Discord alert with developer jargon
 */
async function sendDiscordAlert(title, message, isCritical = false) {
    const statusHeader = isCritical ? "🚨 [CRITICAL_FAILURE]" : "⚡ [SYSTEM_INIT]";
    const color = isCritical ? 15158332 : 3066993; // Red or Green

    const payload = {
        embeds: [{
            title: `${statusHeader} - ${title}`,
            description: message,
            color: color,
            timestamp: new Date().toISOString(),
            footer: { text: "GhostNet Sentinel Core v2.0" }
        }]
    };

    try {
        await axios.post(DISCORD_WEBHOOK_URL, payload);
        console.log(`>> [LOG]: Alert dispatched to Discord.`);
    } catch (err) {
        console.error(`>> [ERROR]: Failed to dispatch alert: ${err.message}`);
    }
}

/**
 * Main Monitoring Loop
 */
async function start() {
    console.log(">> [SYSTEM]: Initializing GhostNet Sentinel...");

    // Initial Boot Message
    const bootMsg = `**GhostNet Monitoring Engine** is now **ONLINE**.\n> Protocol: \`ICMP/HTTP-SECURE\`\n> Target Cluster: \`${TARGET_HOST}\`\n\n*Secure socket connection established. Watching the packets...*`;
    await sendDiscordAlert("BOOT_SEQUENCE_COMPLETE", bootMsg);

    setInterval(async () => {
        const start = Date.now();
        let status = "UP";
        let latency = 0;

        try {
            // Heartbeat check
            await axios.get(`http://${TARGET_HOST}`, { timeout: 4000 });
            latency = Date.now() - start;
        } catch (e) {
            status = "DOWN";
            latency = -1;
        }

        // --- INTELLIGENT ALERT LOGIC ---
        if (status !== lastStatus && lastStatus !== 'UNKNOWN') {
            if (status === "DOWN") {
                const alertMsg = `Connectivity lost with target node: \`${TARGET_HOST}\`\n\`\`\`diff\n- STATUS: OFFLINE\n- ERROR: CONNECTION_TIMEOUT\n- TRACE_ID: ${Math.random().toString(36).substring(7)}\n\`\`\`\n@everyone *System integrity compromised!*`;
                await sendDiscordAlert("NODE_UNREACHABLE", alertMsg, true);
            } else {
                const recoveryMsg = `Node has rejoined the cluster successfully.\n\`\`\`diff\n+ STATUS: OPERATIONAL\n+ LATENCY: ${latency}ms\n+ SYNC_RESTORED: true\n\`\`\`\n*System stability re-verified. Monitoring continues.*`;
                await sendDiscordAlert("RECOVERY_SUCCESS", recoveryMsg, false);
            }
        }
        lastStatus = status;

        // --- UPDATE LOCAL METRICS FOR DASHBOARD ---
        const metrics = [{
            url: TARGET_HOST,
            status: status,
            latency: latency,
            time: new Date().toISOString()
        }];

        try {
            fs.writeFileSync(LOG_FILE, JSON.stringify(metrics));
            console.log(`[${new Date().toLocaleTimeString()}] ANALYZER: ${status} | MS: ${latency}`);
        } catch (err) {
            console.error(">> [FILE_ERROR]: Could not update metrics.json");
        }

    }, 10000); // 10-second polling interval
}

// Fire it up!
start();