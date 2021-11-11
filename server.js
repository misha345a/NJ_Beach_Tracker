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

// convert a string to title case
function toTitleCase(str) {
  return str.toLowerCase().split(' ').map(function (word) {
    return (word.charAt(0).toUpperCase() + word.slice(1));
  }).join(' ');
}

// format the data before sending it to the client-side
function adjustFormatting(arr) {
  arr[2] = Math.round(arr[2])+'°F'; // round feelsLikeMorn
  arr[3] = Math.round(arr[3])+'°F'; // round feelsLikeDay
  arr[4] = toTitleCase(arr[4]); // title case description
  arr[5] = Math.round(arr[5])+'%'; // round percentage of precipitation
  arr[6] = Math.round(arr[6])+' mph'; // round wind speeds
  arr[7] = arr[7].toFixed(1); // round UV Index to tenths
  return arr
}

// URLs to retrieve forecasts at beach locations
const url_Brigantine_Beach = `https://api.openweathermap.org/data/2.5/onecall?lat=39.4021&lon=-74.3668&exclude=current,minutely,alerts&units=imperial&appid=${process.env.OPENWEATHER_API_KEY}`;
const url_Atlantic_City_Beach = `https://api.openweathermap.org/data/2.5/onecall?lat=39.3755&lon=-74.4158&exclude=current,minutely,alerts&units=imperial&appid=${process.env.OPENWEATHER_API_KEY}`;
const url_Ideal_Beach = `https://api.openweathermap.org/data/2.5/onecall?lat=40.4448&lon=-74.1119&exclude=current,minutely,alerts&units=imperial&appid=${process.env.OPENWEATHER_API_KEY}`;
const url_Beach_Haven= `https://api.openweathermap.org/data/2.5/onecall?lat=39.5593&lon=-74.2432&exclude=current,minutely,alerts&units=imperial&appid=${process.env.OPENWEATHER_API_KEY}`;

//_________________________________________

app.listen(port, () => {
    console.log(`Starting server at: ${port}`);
});

app.get("/forecast", function (req, res) {

  // execute simultaneous requests
  axios.all([
    axios.get(url_Brigantine_Beach),
    axios.get(url_Atlantic_City_Beach),
    axios.get(url_Ideal_Beach),
    axios.get(url_Beach_Haven),
  ])
  .then(response => {
    console.log("Success! Status code was 200 level.");

    let beachNameList = [
      "Brigantine Beach",
      "Atlantic City Beach",
      "Ideal Beach",
      "Beach Haven",
    ];

    // loop through each beach's API call
    let dataList = [];
    
    for (let i=0; i<beachNameList.length; i++) {
      // and define variables over multiple days
      for (let j=0; j<5; j++) {
        let beachName = beachNameList[i];
        let date = convertUnixUTC(response[i].data.daily[j].dt);
        let feelsLikeMorn = response[i].data.daily[j].feels_like.morn;
        let feelsLikeDay = response[i].data.daily[j].feels_like.day;
        let description = response[i].data.daily[j].weather[0].description;
        let pop = response[i].data.daily[j].pop;
        let windSpeed = response[i].data.daily[j].wind_speed;
        let uvi = response[i].data.daily[j].uvi;

        let responseList = [
          beachName,
          date,
          feelsLikeMorn,
          feelsLikeDay,
          description,
          pop,
          windSpeed,
          uvi
        ];
        responseList = adjustFormatting(responseList); // reformatted
        dataList.push(responseList);
      }
    }

    // send the collected API data back to the client-side
    res.json({
      "draw": 1,
      "recordsTotal": 90,
      "recordsFiltered": 90,
      "data": dataList
    })
  })
  .catch(function (error) {
    //handle errors
    console.log("Error! Status code was 300, 400, or 500-level.");
  });
})
