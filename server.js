import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

// ================================
// CONFIG
// ================================

// CHANGE THIS to your Freshdesk portal URL
const ALLOWED_ORIGIN = "https://tatvacloud-helpdesk.freshdesk.com";

// Environment variables from Render
const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN;
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;

// ================================
// MIDDLEWARE
// ================================

// Body parser
app.use(express.json());

// CORS Setup
app.use(cors({
    origin: ALLOWED_ORIGIN,
    methods: ["POST", "GET", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

// Handle Preflight Requests
app.options("*", cors());

// ================================
// ROUTES
// ================================

// Health check
app.get("/", (req, res) => {
    res.send("Freshdesk Validator API Running ✅");
});

// Validation API
app.post("/api/blur-test", async (req, res) => {

    const { caseId, category } = req.body;

    if (!caseId || !category) {
        return res.status(400).json({
            error: "Missing caseId or category"
        });
    }

    try {

        // IMPORTANT: Replace API field names if different in your Freshdesk
        const query = `cf_case_id:'${caseId}' AND cf_category:'${category}'`;

        console.log("Freshdesk Search Query:", query);

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

        console.error("Freshdesk API Error:",
            error.response?.data || error.message
        );

        res.status(500).json({
            error: "Freshdesk API Failed"
        });
    }
});

// ================================
// SERVER START
// ================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
