require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const DOMAIN = process.env.FRESHDESK_DOMAIN;
const API_KEY = process.env.FRESHDESK_API_KEY;
const PORT = process.env.PORT || 3000;

// ----------------------
// Freshdesk Auth Header
// ----------------------

const AUTH_HEADER = {
    Authorization: "Basic " + Buffer.from(API_KEY + ":X").toString("base64")
};

// ----------------------
// Health Check
// ----------------------

app.get("/", (req, res) => {
    res.send("Middleware Running ✅");
});

// ----------------------
// Case Validation API
// ----------------------

app.post("/api/check-case", async (req, res) => {

    try {

        const { caseId, category } = req.body;

        if (!caseId || !category) {
            return res.status(400).json({ error: "Missing fields" });
        }

        const cleanCaseId = caseId.trim();
        const cleanCategory = category.toLowerCase();

        const searchResponse = await axios.get(
            `https://${DOMAIN}/api/v2/search/tickets`,
            {
                headers: AUTH_HEADER,
                params: {
                    query: `cf_case_id:'${cleanCaseId}'`
                }
            }
        );

        const tickets = searchResponse.data.results || [];

        let billingExists = false;
        let serviceExists = false;

        tickets.forEach(ticket => {

            const cat = ticket.custom_fields?.cf_category?.toLowerCase();

            if (cat === "billing") billingExists = true;
            if (cat === "service") serviceExists = true;

        });

        if (billingExists && serviceExists) {
            return res.json({ blocked: true, reason: "both" });
        }

        if (cleanCategory === "billing" && billingExists) {
            return res.json({ blocked: true, reason: "billing" });
        }

        if (cleanCategory === "service" && serviceExists) {
            return res.json({ blocked: true, reason: "service" });
        }

        return res.json({ blocked: false });

    } catch (error) {

        console.error("ERROR:", error.response?.data || error.message);

        res.status(500).json({ error: "Server error" });

    }

});

// ----------------------
// Start Server
// ----------------------

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
