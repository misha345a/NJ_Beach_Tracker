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
  arr[3] = Math.round(arr[3])+'°F'; // round feelsLikeMorn
  arr[4] = Math.round(arr[4])+'°F'; // round feelsLikeDay
  arr[5] = toTitleCase(arr[5]); // title case description
  arr[6] = Math.round(arr[6])+'%'; // round percentage of precipitation
  arr[7] = Math.round(arr[7])+' mph'; // round wind speeds
  arr[8] = Math.round(arr[8]); // round UV Index 
  return arr
}

// URLs to retrieve forecasts at various beach locations
const url_Brigantine_Beach = `https://api.openweathermap.org/data/2.5/onecall?lat=39.4021&lon=-74.3668&exclude=current,minutely,alerts&units=imperial&appid=${process.env.OPENWEATHER_API_KEY}`;
const url_Atlantic_City_Beach = `https://api.openweathermap.org/data/2.5/onecall?lat=39.3755&lon=-74.4158&exclude=current,minutely,alerts&units=imperial&appid=${process.env.OPENWEATHER_API_KEY}`;
const url_Ideal_Beach = `https://api.openweathermap.org/data/2.5/onecall?lat=40.4448&lon=-74.1119&exclude=current,minutely,alerts&units=imperial&appid=${process.env.OPENWEATHER_API_KEY}`;
const url_Beach_Haven= `https://api.openweathermap.org/data/2.5/onecall?lat=39.5593&lon=-74.2432&exclude=current,minutely,alerts&units=imperial&appid=${process.env.OPENWEATHER_API_KEY}`;

//_________________________________________

app.listen(port, () => {
    console.log(`Starting server at: ${port}`);
});

// FORECAST DATA (OPENWEATHER)
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

        let travelTime = "";
        let responseList = [
          beachName,
          travelTime,
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

// ---------------------------------------------------

// DRIVING TIMES (MABPOX)
app.get("/map", function (req, res) {

  // retrieve the user's address from the client side
  let address = req.query['address'];

  // encode the address text as a URL-encoded UTF-8 string
  let encodedAddress = encodeURI(address.trim());

  let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${process.env.MAPBOX_API_KEY}`

  // retrieve the origin's geographic coordinates
  async function axiosTest() {
        try {
          const {data:response} = await axios.get(url)
          return response
        }

        catch (error) {
          console.log(error);
        }
      }

  // longitude/latitude data is required for the Mapbox Directions API requests
  axiosTest().then(response => {
  let geoCoordinates = response.features[0].geometry.coordinates;
  let longitude = geoCoordinates[0];
  let latitude = geoCoordinates[1];

  // here are the Mapbox Directions API requests for each beach
  // the start will always be the user's address location; only the destination changes based on the beach location
  let url_map_Brigantine_Beach = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${longitude},${latitude};-74.3668,39.4021?geometries=geojson&access_token=${process.env.MAPBOX_API_KEY}`;
  let url_map_Atlantic_City_Beach = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${longitude},${latitude};-74.4158,39.3755?geometries=geojson&access_token=${process.env.MAPBOX_API_KEY}`;
  let url_map_Ideal_Beach = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${longitude},${latitude};-74.1119,40.4448?geometries=geojson&access_token=${process.env.MAPBOX_API_KEY}`;
  let url_map_Beach_Haven = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${longitude},${latitude};-74.2432,39.5593?geometries=geojson&access_token=${process.env.MAPBOX_API_KEY}`;

  // execute the Mapbox Directions API requests to retrieve the driving-traffic profiles
  axios.all([
    axios.get(url_map_Brigantine_Beach),
    axios.get(url_map_Atlantic_City_Beach),
    axios.get(url_map_Ideal_Beach),
    axios.get(url_map_Beach_Haven),
  ])
  .then(responseArr => {
    let beachNameList = [
      "Brigantine Beach",
      "Atlantic City Beach",
      "Ideal Beach",
      "Beach Haven",
    ];

    // format the driving times into minutes
    let durationsDict = {};
    for (let i=0; i<responseArr.length; i++) {
      let tripDuration = responseArr[i].data.routes[0].duration_typical;
      tripDuration = Math.round(Number(tripDuration)/60) + " min";
      durationsDict[beachNameList[i]] = tripDuration; // add 'Brigantine Beach':'97 min' pairs
    }
    durationsDict["error"] = "No Error";

    // send the collected API data back to the client-side
    res.json(durationsDict);
  })
  .catch(function (error) {
      //handle errors
      console.log("Error! Status code was 300, 400, or 500-level.");
      // res.json({"error": "geocodes not found"});
  });

})
.catch(function (error) {
//     //handle errors
    console.log("Error! Status code was 300, 400, or 500-level.");
//     // res.json({"error": "geocodes not found"});
});
})
