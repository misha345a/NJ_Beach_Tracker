// import beach names and requests from data.js
const data = require('./data.js');
const beachNames = data.beachNames;
const forecastRequests = data.createForecastRequests();
const oceanTempRequest = data.oceanTempRequest;

const axios = require("axios");
const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public_html"));

//____________________________________________________________________________

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
  arr[7] = Math.round(arr[7]); // round wind speeds
  arr[8] = Math.round(arr[8]); // round UV Index 
  return arr
}

//____________________________________________________________________________

app.listen(port, () => {
    console.log(`Starting server at: ${port}`);
});

// FORECAST DATA (OPENWEATHER)
app.get("/forecast", function (req, res) {
  
  // compile a list of all forecasts requests
  let promises = [];
  for (let i=0; i<forecastRequests.length; i++) {
    promises.push(axios.get(forecastRequests[i]));
  }

  // execute requests simultaneously
  axios.all(promises)
  .then(response => {
    console.log("Success! Status code was 200 level.");
    
    // check the response's status code
    if (response[0].status != 200) {
      throw "Sorry, too many requests already made today. Please check back tomorrow.";
    }

    // loop through each beach's API call
    let dataList = [];
    
    for (let i=0; i<beachNames.length; i++) {
      // and define variables over multiple days
      for (let j=0; j<5; j++) {
        let beachName = beachNames[i];
        let date = convertUnixUTC(response[i].data.daily[j].dt);
        let feelsLikeMorn = response[i].data.daily[j].feels_like.morn;
        let feelsLikeDay = response[i].data.daily[j].feels_like.day;
        let description = response[i].data.daily[j].weather[0].description;
        let pop = response[i].data.daily[j].pop;
        let windSpeed = response[i].data.daily[j].wind_speed;
        let uvi = response[i].data.daily[j].uvi;

        let drivingTime = "";
        let responseList = [
          beachName,
          drivingTime,
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
      "recordsTotal": 150,
      "recordsFiltered": 150,
      "data": dataList
    })
  })
  .catch(function (error) {
    //handle errors
    console.log("Error! Status code was 300, 400, or 500-level.");
    res.json({"error": error});
  });
})

//____________________________________________________________________________

// DRIVING TIMES (MABPOX)
app.get("/map", function (req, res) {

  // retrieve the user's address from the client side
  let address = req.query['address'];

  // encode the address text as a URL-encoded UTF-8 string
  let encodedAddress = encodeURI(address.trim());

  // retrieve the origin's coordinates from the Mapbox API using Axios
  let geoCodingRequest = data.createGeocodingRequest(encodedAddress);
  async function axiosGeocoding() {
    try {
      const {data:response} = await axios.get(geoCodingRequest)
      return response
    }
    catch (error) {
      console.log(error);
    }
  }

  // longitude/latitude data is required for the Mapbox Directions API requests
  axiosGeocoding().then(response => {

    // check if response exists
    if (response.features.length == 0) {
      throw "This address was not found. Try again.";
    }

    let geoCoordinates = response.features[0].geometry.coordinates;
    let longitude = geoCoordinates[0];
    let latitude = geoCoordinates[1];
    let foundAddress = response.features[0].place_name;

    // define the Mapbox Directions API requests
    // the start will always be the user's address; only the end or destination will change based on beach location
    let mapRequests = data.createMapRequests(longitude, latitude);
    
    let mapPromises = [];
    for (let i=0; i<mapRequests.length; i++) {
        mapPromises.push(axios.get(mapRequests[i]));
    }
    
    // execute all Mapbox Directions API requests to retrieve the driving-traffic profiles    
    axios.all(mapPromises)    
    .then(responseArr => {

      let durationsDict = {};

      // format the driving times into minutes
      for (let i=0; i<responseArr.length; i++) {
        let tripDuration = responseArr[i].data.routes[0].duration_typical;
        tripDuration = Math.round(Number(tripDuration)/60);
        durationsDict[beachNames[i]] = tripDuration; // adds pairs in this format: 'Brigantine Beach':'97 min'
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
  axios.get(oceanTempRequest)
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

