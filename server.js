import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

// ================================
// STARTUP LOGS
// ================================

console.log("🚀 Freshdesk Validator Service Starting...");

// ================================
// ENV CONFIG
// ================================

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN;
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;

// IMPORTANT: Must match Freshdesk portal URL
const ALLOWED_ORIGIN = "https://tatvacloud-helpdesk.freshdesk.com";

// Validate ENV
console.log("ENV CHECK:");
console.log("FRESHDESK_DOMAIN:", FRESHDESK_DOMAIN ? "OK" : "MISSING");
console.log("FRESHDESK_API_KEY:", FRESHDESK_API_KEY ? "OK" : "MISSING");

// ================================
// MIDDLEWARE
// ================================

// Log all requests
app.use((req, res, next) => {
    console.log("➡ Incoming:", req.method, req.originalUrl);
    next();
});

// Enable CORS
app.use(cors({
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

// Preflight handler
app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        console.log("⚡ Preflight OPTIONS request");
        return res.sendStatus(200);
    }
    next();
});

// ================================
// ROUTES
// ================================

// Health check
app.get("/", (req, res) => {
    console.log("🏥 Health Check Hit");
    res.send("Freshdesk Duplicate Validator API Running ✅");
});

// ================================
// VALIDATION ENDPOINT
// ================================

app.get("/api/blur-test", async (req, res) => {

    console.log("🔵 /api/blur-test START");

    const caseId = req.query.caseId || req.query.cf_case_id;
    const category = req.query.category || req.query.cf_category;

    console.log("Received Params:");
    console.log("caseId:", caseId);
    console.log("category:", category);

    // Only category is mandatory
    if (!category) {

        console.log("❌ Missing category parameter");

        return res.status(400).json({
            error: "Missing category"
        });
    }

    try {

        // ================================
        // FILTER BY CATEGORY ONLY
        // ================================

        const query = `cf_category : '${category}'`;

        console.log("🔎 Freshdesk Query:", query);
        console.log("📡 Calling Freshdesk API...");

        const response = await axios.get(
            `https://${FRESHDESK_DOMAIN}/api/v2/search/tickets?query="${query}"`,
            {
                headers: {
                    Authorization: `basic ${FRESHDESK_API_KEY}`
                }
            }
        );

        console.log("✅ Freshdesk API responded");

        const results = response.data.results;

        console.log("📊 Category Match Count:", results.length);

        // ================================
        // DAILY DUPLICATE CHECK
        // ================================

        let duplicateFound = false;

        // Get today's UTC date (YYYY-MM-DD)
        const today = new Date().toISOString().split("T")[0];

        console.log("📅 Today's Date:", today);

        results.forEach(ticket => {

            const freshdeskCaseId = ticket.custom_fields?.cf_case_id;
            const createdAt = ticket.created_at;

            // Convert Freshdesk ticket date to YYYY-MM-DD
            const ticketDate = createdAt
                ? new Date(createdAt).toISOString().split("T")[0]
                : null;

            console.log("🔎 Checking Ticket");
            console.log("Freshdesk Case ID:", freshdeskCaseId);
            console.log("User Case ID:", caseId);
            console.log("Ticket Date:", ticketDate);

            // BLOCK ONLY IF:
            // Same Case ID
            // AND Same Calendar Day
            if (
                caseId &&
                ticketDate === today &&
                String(freshdeskCaseId).trim() ===
                String(caseId).trim()
            ) {

                console.log("❌ SAME DAY DUPLICATE FOUND");

                duplicateFound = true;
            }
        });

        // ================================
        // RESPONSE
        // ================================

        if (duplicateFound) {

            return res.json({
                exists: true
            });
        }

        console.log("✅ NO DUPLICATE FOUND FOR TODAY");

        res.json({
            exists: false,
            data: response.data
        });

    } catch (error) {

        console.log("🔥 ERROR calling Freshdesk API");

        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error("Error:", error.message);
        }

        res.status(500).json({
            error: "Freshdesk API failed"
        });
    }

    console.log("🟢 /api/blur-test END");
});

// ================================
// SERVER START
// ================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🟢 Server running on port", PORT);
});
