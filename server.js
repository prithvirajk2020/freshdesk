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
require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(express.json());

// Allow Freshdesk portal
app.use(cors({
    origin: "*"
}));

const DOMAIN = process.env.FRESHDESK_DOMAIN;
const API_KEY = process.env.FRESHDESK_API_KEY;
const PORT = process.env.PORT || 3000;

// Freshdesk Auth
const AUTH_HEADER = {
    Authorization: "Basic " + Buffer.from(API_KEY + ":X").toString("base64")
};

// --------------------
// Health Check
// --------------------

app.get("/", (req, res) => {
    res.send("Freshdesk Middleware Running ✅");
});

// --------------------
// Ping Test
// --------------------

app.get("/api/ping", (req, res) => {

    console.log("PING RECEIVED FROM PORTAL");

    res.json({
        success: true
    });

});

// --------------------
// Duplicate Validation API
// --------------------

app.post("/api/check-duplicate", async (req, res) => {

    try {

        const { case_id, category } = req.body;

        if (!case_id || !category) {
            return res.status(400).json({
                error: "Missing parameters"
            });
        }

        console.log("Checking:", case_id, category);

        // Search by Case ID
        const searchResponse = await axios.get(
            `https://${DOMAIN}/api/v2/search/tickets`,
            {
                headers: AUTH_HEADER,
                params: {
                    query: `cf_case_id:'${case_id}'`
                }
            }
        );

        const tickets = searchResponse.data.results || [];

        const selectedCategory = category.toLowerCase();

        // Today's 12:00 AM timestamp
        const now = new Date();
        const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        ).getTime();

        let duplicateFound = false;

        tickets.forEach(ticket => {

            const ticketCategory =
                ticket.custom_fields?.cf_category?.toLowerCase();

            if (!ticketCategory) return;

            if (ticketCategory !== selectedCategory) return;

            const createdTime = new Date(ticket.created_at).getTime();

            if (createdTime >= todayStart) {
                duplicateFound = true;
            }

        });

        console.log("Duplicate:", duplicateFound);

        return res.json({
            exists: duplicateFound
        });

    } catch (error) {

        console.error("ERROR:", error.response?.data || error.message);

        return res.status(500).json({
            error: "Validation failed"
        });

    }

});

// --------------------

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
