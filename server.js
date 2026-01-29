import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

// ================================
// CONFIG
// ================================

const ALLOWED_ORIGIN = "https://tatvacloud-helpdesk.freshdesk.com";

const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN;
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;

// ================================
// MIDDLEWARE (ORDER MATTERS)
// ================================

// Enable JSON first
app.use(express.json());

// CORS MUST be before routes
app.use(cors({
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false
}));

// Explicit OPTIONS handler (CRITICAL)
app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// ================================
// ROUTES
// ================================

app.get("/", (req, res) => {
    res.send("Freshdesk Validator Running ✅");
});

app.post("/api/blur-test", async (req, res) => {

    const { caseId, category } = req.body;

    if (!caseId || !category) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {

        const query = `cf_case_id:'${caseId}' AND cf_category:'${category}'`;

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
            return res.json({ exists: true });
        }

        res.json({ exists: false });

    } catch (err) {

        console.error(err.response?.data || err.message);

        res.status(500).json({ error: "Freshdesk search failed" });
    }
});

// ================================
// START SERVER
// ================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
