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

// Validation endpoint
app.get("/api/blur-test", async (req, res) => {

    console.log("🔵 /api/blur-test START");
    console.log("QUeryyyyyyy", req);

    const caseId = req?.query.caseId || req?.query.cf_case_id;
    const category = req?.query.category || req?.query.cf_category;

    console.log("Received Params:");
    console.log("caseId:", caseId);
    console.log("category:", category);

    if (!caseId || !category) {

        console.log("❌ Missing query parameters");

        return res.status(400).json({
            error: "Missing caseId or category"
        });
    }

    try {

        // Build Freshdesk query
        const query = `cf_case_id : '${caseId}' AND cf_category : '${category}'`;


        console.log("🔎 Freshdesk Query:", query);
        console.log("🔑 API KEY LENGTH:", FRESHDESK_API_KEY.length);

        console.log("📡 Calling Freshdesk API...");

        const response = await axios.get(
            `https://${FRESHDESK_DOMAIN}/api/v2/search/tickets?query="${query}"`,
            {
                headers: {
                    Authorization: `basic ${FRESHDESK_API_KEY}`
                }
            }
        );

        console.log("✅ Freshdesk API responseeee", response);

        const results = response.data.results;

        console.log("📊 Result Count:", results.length);

        if (results.length > 0) {

            console.log("❌ DUPLICATE FOUND");

            return res.json({
                exists: true
            });
        }

        console.log("✅ NO DUPLICATE FOUND");

        res.json({
            exists: false
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
            error: "Freshdesk API failed",
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
