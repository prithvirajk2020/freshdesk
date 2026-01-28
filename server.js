require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(express.json());

// Allow Freshdesk domain
app.use(cors({
    origin: "*"
}));

const DOMAIN = process.env.FRESHDESK_DOMAIN;
const API_KEY = process.env.FRESHDESK_API_KEY;
const PORT = process.env.PORT || 3000;

// ----------------------
// Auth Header
// ----------------------

const AUTH_HEADER = {
    Authorization: "Basic " + Buffer.from(API_KEY + ":X").toString("base64")
};

// ----------------------
// Health Check
// ----------------------

app.get("/", (req, res) => {
    res.send("Freshdesk Validation Server Running ✅");
});

// ----------------------
// Validation Endpoint
// ----------------------

app.post("/api/create-ticket", async (req, res) => {

    try {

        let { caseId, category, email, subject } = req.body;

        if (!caseId || !category || !email || !subject) {
            return res.status(400).json({
                error: "Missing required fields"
            });
        }

        const cleanCaseId = caseId.trim();
        const cleanCategory = category.toLowerCase();

        console.log("Request:", cleanCaseId, cleanCategory);

        // ----------------------
        // Freshdesk Search
        // ----------------------

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

        // ----------------------
        // Rules
        // ----------------------

        if (billingExists && serviceExists) {
            return res.status(409).json({
                error: "Both Billing and Service tickets already exist for this Case ID"
            });
        }

        if (cleanCategory === "billing" && billingExists) {
            return res.status(409).json({
                error: "Billing ticket already exists. Please select Service."
            });
        }

        if (cleanCategory === "service" && serviceExists) {
            return res.status(409).json({
                error: "Service ticket already exists. Please select Billing."
            });
        }

        // ----------------------
        // PASS
        // ----------------------

        return res.json({
            success: true
        });

    } catch (error) {

        console.error("ERROR:", error.response?.data || error.message);

        return res.status(500).json({
            error: "Server validation error"
        });

    }

});

// ----------------------

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
