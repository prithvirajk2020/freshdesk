import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

// ================================
// CONFIG
// ================================

// IMPORTANT: Use your EXACT Freshdesk portal URL


// From Render Environment Variables
const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN;
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;
const ALLOWED_ORIGIN = FRESHDESK_DOMAIN;
// ================================
// MIDDLEWARE (ORDER MATTERS)
// ================================

// Enable CORS FIRST
app.use(cors({
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

// Handle OPTIONS preflight
app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// ================================
// ROUTES
// ================================

// Health Check Route
app.get("/", (req, res) => {
    res.send("Freshdesk Duplicate Validator API Running ✅");
});

// VALIDATION ROUTE (GET)
app.get("/api/blur-test", async (req, res) => {
    console.log("blur test api start");

    const { caseId, category } = req.query;

    console.log("Incoming request:", caseId, category);

    if (!caseId || !category) {
        return res.status(400).json({
            error: "Missing caseId or category"
        });
    }

    try {

        console.log("blur test api start try");

        // IMPORTANT: Replace API names if different in your Freshdesk
        const query = `cf_case_id:'${caseId}' AND cf_category:'${category}'`;

        console.log("Freshdesk Query:", query);

        const response = await axios.get(
            `https://${FRESHDESK_DOMAIN}/api/v2/search/tickets`,
            {
                params: { query },
                auth: {
                    username: FRESHDESK_API_KEY,
                    password: "X"
                }
            }
        );

        const results = response.data.results;

        if (results.length > 0) {

            console.log("Duplicate Found");

            return res.json({
                exists: true
            });
        }

        console.log("No Duplicate");

        res.json({
            exists: false
        });

    } catch (error) {

        console.log("blur test api error");

        console.error("Freshdesk API Error:",
            error.response?.data || error.message
        );

        res.status(500).json({
            error: "Freshdesk API failed"
        });
    }
});

// ================================
// SERVER START
// ================================

const PORT = process.env.PORT || 3000;

console.log("blur test api end");


app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
