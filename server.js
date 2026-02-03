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

const ALLOWED_ORIGIN = "https://tatvacloud-helpdesk.freshdesk.com";

// ================================
// GLOBAL MIDDLEWARE
// ================================

// Parse JSON body
app.use(express.json());

// Disable caching
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
});

// Enable CORS
app.use(cors({
    origin: ALLOWED_ORIGIN,
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

// Preflight handler
app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// ================================
// ROUTES
// ================================

// Health check
app.get("/", (req, res) => {
    res.send("Freshdesk Duplicate Validator API Running ✅");
});

// ================================
// VALIDATION ENDPOINT (POST)
// ================================

app.post("/api/blur-test", async (req, res) => {

    console.log("🔵 /api/blur-test START");

    const caseId = req.body.caseId || req.body.cf_case_id;
    const category = req.body.category || req.body.cf_category;

    console.log("Received Body:");
    console.log("caseId:", caseId);
    console.log("category:", category);

    if (!category) {
        return res.status(400).json({
            error: "Missing category"
        });
    }

    try {

        // ================================
        // FILTER ONLY BY CATEGORY
        // ================================

        const query = `cf_category : '${category}'`;

        console.log("🔎 Freshdesk Query:", query);

        const response = await axios.get(
            `https://${FRESHDESK_DOMAIN}/api/v2/search/tickets?query="${query}"`,
            {
                headers: {
                    Authorization: `basic ${FRESHDESK_API_KEY}`
                }
            }
        );

        const results = response.data.results;

        console.log("📊 Category Match Count:", results.length);

        // ================================
        // DAILY DUPLICATE CHECK
        // ================================

        let duplicateFound = false;
        let duplicateTicketId = null;

        const today = new Date().toISOString().split("T")[0];

        results.forEach(ticket => {

            const freshdeskCaseId = ticket.custom_fields?.cf_case_id;
            const createdAt = ticket.created_at;

            const ticketDate = createdAt
                ? new Date(createdAt).toISOString().split("T")[0]
                : null;

            if (
                caseId &&
                ticketDate === today &&
                String(freshdeskCaseId).trim() ===
                String(caseId).trim()
            ) {

                duplicateFound = true;
                duplicateTicketId = ticket.id;
            }
        });

        // ================================
        // RESPONSE
        // ================================

        if (duplicateFound) {

            return res.json({
                exists: true,
                ticket_id: duplicateTicketId
            });
        }

        res.json({
            exists: false
        });

    } catch (error) {

        console.log("🔥 Freshdesk API error");

        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
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
