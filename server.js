const axios = require("axios");
const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public_html"));

//_________________________________________

// convert Unix, UTC timestamps into a readable form (i.e. 1575909015000 -> 9 Monday)
function convertUnixUTC(unixTimestamp) {
  const milliseconds = unixTimestamp * 1000;
  const dateObject = new Date(milliseconds);
  const humanDateFormat = dateObject.toLocaleString("en-US", {day:"numeric", weekday:"long"});
  return humanDateFormat;
}

//_________________________________________

app.listen(port, () => {
    console.log(`Starting server at: ${port}`);
});

app.get("/forecast", function (req, res) {
  res.json({
  "draw": 1,
  "recordsTotal": 57,
  "recordsFiltered": 57,
  "data": [
    [
      "#",
      "#",
      "#",
      "#",
      "#",
      "#",
      "#",
      "#"
    ],
    [
     "#",
     "#",
     "#",
     "#",
     "#",
     "#",
     "#",
     "#"
   ],
   [
     "#",
     "#",
     "#",
     "#",
     "#",
     "#",
     "#",
     "#"
   ],
  ]})
}
)
