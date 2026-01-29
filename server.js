// const express = require("express");
// const app = express();

// app.use(express.json());

// const PORT = process.env.PORT || 3000;

// app.get("/", (req, res) => {
//     res.send("Middleware Running");
// });

// // TEST ENDPOINT
// app.get("/api/ping", (req, res) => {
//     console.log("PING API CALLED FROM CLIENT");
//     res.json({ success: true });
// });

// app.listen(PORT, () => {
//     console.log("Server running on port", PORT);
// });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: ['https://yourdomain.freshdesk.com', 'https://*.freshdesk.com']
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Simple in-memory cache
const ticketCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Replace with YOUR Freshdesk details
const FRESHDESK = {
    domain: process.env.FRESHDESK_DOMAIN || 'YOURDOMAIN.freshdesk.com',
    apiKey: process.env.FRESHDESK_API_KEY || 'YOUR_API_KEY'
};

app.get('/api/ping', (req, res) => {
    res.json({ status: 'OK', message: 'Freshdesk middleware ready!' });
});

app.post('/api/check-duplicate', async (req, res) => {
    const { case_id, category } = req.body;

    if (!case_id || !category) {
        return res.status(400).json({ error: 'Missing case_id or category', exists: false });
    }

    const key = `${case_id.trim().toLowerCase()}_${category.trim().toLowerCase()}`;
    const now = Date.now();
    const cached = ticketCache.get(key);

    // Cache hit
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
        return res.json({ exists: cached.exists });
    }

    try {
        // Search Freshdesk
        const query = `cf_case_id:"${case_id}" cf_category:"${category}"`;
        const url = `https://${FRESHDESK.domain}/api/v2/search/tickets?query="${encodeURIComponent(query)}"`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${FRESHDESK.apiKey}:X`).toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        const tickets = await response.json();
        const exists = Array.isArray(tickets) && tickets.length > 0;

        // Cache result
        ticketCache.set(key, { exists, timestamp: now });

        res.json({ exists });

    } catch (error) {
        console.error('Freshdesk error:', error.message);
        res.json({ exists: false }); // Fail open
    }
});

// Cleanup cache hourly
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of ticketCache) {
        if (now - value.timestamp > CACHE_TTL) {
            ticketCache.delete(key);
        }
    }
}, 3600000);

app.get('/', (req, res) => {
    res.json({
        service: 'Freshdesk Duplicate Checker',
        endpoints: {
            ping: 'GET /api/ping',
            check: 'POST /api/check-duplicate'
        },
        status: 'active'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Running on port ${PORT}`);
    console.log(`📍 https://freshdesk-xqpp.onrender.com`);
});
