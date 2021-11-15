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

//____________________________________________________________________________

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

//____________________________________________________________________________

// DRIVING TIMES (MABPOX)
app.get("/map", function (req, res) {

  // retieve the user's address from the client side
  let address = req.query['address'];

  // encode the address text as a URL-encoded UTF-8 string
  let encodedAddress = encodeURI(address.trim());

  let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?country=us&limit=1&proximity=-74.4229%2C39.3643&types=address&access_token=${process.env.MAPBOX_API_KEY}`

  // retrieve the origin's coordinates from the Mapbox API using Axios
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

    // check if response exists
    if (response.features.length == 0) {
      throw "This address was not found. Try again.";
    }

    let geoCoordinates = response.features[0].geometry.coordinates;
    let longitude = geoCoordinates[0];
    let latitude = geoCoordinates[1];

    let foundAddress = response.features[0].place_name;

    // here are the Mapbox Directions API requests for each beach
    // the start will always be the user's address; only the end or destination will change based on beach location
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

      let durationsDict = {};

      // format the driving times into minutes
      for (let i=0; i<responseArr.length; i++) {
        let tripDuration = responseArr[i].data.routes[0].duration_typical;
        tripDuration = Math.round(Number(tripDuration)/60) + " min";
        durationsDict[beachNameList[i]] = tripDuration; // adds pairs in this format: 'Brigantine Beach':'97 min'
      }
      durationsDict['address'] = "Found address at " + foundAddress;

      // send the collected API data back to the client-side
      res.json(durationsDict);
    })
    .catch(function (error) {
        //handle errors
        console.log("Error! Status code was 300, 400, or 500-level.");
        res.json({"error": "Driving times were not found from this origin."});
    });

})
.catch(function (error) {
    //handle errors
    console.log("Error! Status code was 300, 400, or 500-level.");
    res.json({"error": error});
  });
})

//____________________________________________________________________________

let url_oceanTemp = `https://api.stormglass.io/v2/weather/point?lat=39.3696&lng=-74.4017&params=waterTemperature&source=noaa&key=${process.env.STORMGLASS_API_KEY}`

// convert Celsius to Fahrenheit
function cToF(celsius) {
  var cTemp = celsius;
  var cToFahr = cTemp * 9/5 + 32;
  return cToFahr;
}

// calculate the average of an array
function calculateAverage(array) {
    var total = 0;
    var count = 0;

    array.forEach(function(item) {
        total += item;
        count++;
    });
    return total/count;
}

app.get("/ocean", function (req, res) {
  axios.get(url_oceanTemp)
  .then(response => {
    if (response.status != 200) {
      throw "Feature currently unavailable. Please try again later.";
    }

    let waterTemps = [];
    let avgWaterTemp;

    // average an array of the next 48 hours of forecast water temps
    for (let i=1; i<=48; i++) {
      waterTemps.push(response.data.hours[i].waterTemperature.noaa);
    }

    avgWaterTemp = cToF(calculateAverage(waterTemps));
    avgWaterTemp = Math.round(avgWaterTemp)+'\xB0F';

    res.json({'oceanTemp':avgWaterTemp});
  })
  .catch(function (error) {
    //handle errors
    res.json({"error": error});
  });
})

