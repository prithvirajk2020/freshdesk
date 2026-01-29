import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN;
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;

app.use(cors({
    origin: [
        FRESHDESK_DOMAIN,
        "https://companyname.freshdeskqa.com"
    ],
    methods: ["POST", "GET"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ENV variables (Render Dashboard)


app.post("/api/blur-test", async (req, res) => {

    const { caseId, category } = req.body;

    if (!caseId || !category) {
        return res.status(400).json({ error: "Missing data" });
    }

    try {

        // IMPORTANT: Use your Freshdesk custom field API names
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

    } catch (error) {

        console.error("Freshdesk error:", error.response?.data || error.message);

        res.status(500).json({ error: "Freshdesk API error" });
    }

});

// Health check for Render
app.get("/", (req, res) => {
    res.send("Freshdesk validator running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
