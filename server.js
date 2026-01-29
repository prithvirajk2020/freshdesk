const express = require("express");
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Middleware Running");
});

// TEST ENDPOINT
app.get("/api/ping", (req, res) => {
    console.log("PING API CALLED FROM CLIENT");
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
