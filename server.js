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

        tickets.forEach(t => {

            const cat = t.custom_fields?.cf_category?.toLowerCase();

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

    } catch (err) {

        console.error(err);
        res.status(500).json({ error: "Server error" });

    }

});
