const axios = require("axios");
const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public_html"));

//_________________________________________

app.listen(port, () => {
    console.log(`Starting server at: ${port}`);
});
