let geoJSON;
let beachKeys;
let beachNames;

geoJSON = {
  "Brigantine_Beach": {
    "long": "-74.3668",
    "lat": "39.4021"
  },
  "Atlantic_City_Beach": {
    "long": "-74.4158",
    "lat": "39.3755"
  },
//   "Ideal_Beach": {
//     "long": "-74.1119",
//     "lat": "40.4448"
//   },
//   "Beach_Haven": {
//     "long": "-74.2432",
//     "lat": "39.5593"
//   },
//   "Ocean_City_Beach": {
//     "long": "-74.5766",
//     "lat": "39.2722"
//   },
//   "Wildwood": {
//     "long": "-74.8387",
//     "lat": "38.9644"
//   },
//   "Cape_May_Point": {
//     "long": "-74.9125",
//     "lat": "38.9302"
//   },
//   "Beach_at_Avalon": {
//     "long": "-74.7178",
//     "lat": "39.0935"
//   },
//   "Point_Pleasant_Beach": {
//     "long": "-74.0479",
//     "lat": "40.0912"
//   },
//   "Stone_Harbor_Beach": {
//     "long": "-74.7545",
//     "lat": "39.0533"
//   },
//   "Lavallette_Beach": {
//     "long": "-74.0654",
//     "lat": "39.9735"
//   },
//   "Sea_Bright_Beach": {
//     "long": "-73.9738",
//     "lat": "40.3615"
//   },
//   "Sea_Girt_Beach": {
//     "long": "-74.0295",
//     "lat": "40.1279"
//   },
//   "Belmar_Beach": {
//     "long": "-74.0122",
//     "lat": "40.1792"
//   },
//   "Avon_Beach": {
//     "long": "-74.0091",
//     "lat": "40.1907"
//   },
//   "Bradley_Beach": {
//     "long": "-74.0121",
//     "lat": "40.2023"
//   },
//   "Asbury_Park_Beach": {
//     "long": "-73.9973",
//     "lat": "40.2246"
//   },
//   "Pearl_Beach": {
//     "long": "-74.9708",
//     "lat": "38.9374"
//   },
//   "Spring_Lake_Beach": {
//     "long": "-74.0221",
//     "lat": "40.1500"
//   },
//   "Ocean_Grove_Beach": {
//     "long": "-74.0019",
//     "lat": "40.2131"
//   },
//   "Gunnison_Beach": {
//     "long": "-73.9932",
//     "lat": "40.4605"
//   },
//   "Margate_Beach": {
//     "long": "-74.5135",
//     "lat": "39.3191"
//   },
//   "Sandy_Hook_Beach": {
//     "long": "-73.9861",
//     "lat": "40.4279"
//   },
//   "Manasquan_Beach": {
//     "long": "-74.0327",
//     "lat": "40.1124"
//   },
//   "Seaside_Heights_Beach": {
//     "long": "-74.0700",
//     "lat": "39.9413"
//   },
//   "Long_Branch_Beach": {
//     "long": "-73.9822",
//     "lat": "40.2846"
//   },
//   "Whale_Beach": {
//     "long": "-74.6622",
//     "lat": "39.1909"
//   },
//   "Sunset_Beach": {
//     "long": "-74.9694",
//     "lat": "38.9445"
//   }
}

// define an array of the JSON object's property names
beachKeys = Object.keys(geoJSON);

// define the beach names
beachNames = []
for (let i=0; i<beachKeys.length; i++) {
  beachNames.push(beachKeys[i].replace(/_/g, ' '));
}

// create all forecast requests to OpenWeather
function createForecastRequests() {
  let forecastRequests = [];
  let forecastURL;
  let beach;

  for (let i=0; i<beachKeys.length; i++) {
    beach = beachKeys[i];
    forecastURL = `https://api.openweathermap.org/data/2.5/onecall?lat=${geoJSON[beach].lat}&lon=${geoJSON[beach].long}&exclude=current,minutely,alerts&units=imperial&appid=${process.env.OPENWEATHER_API_KEY}`;
    forecastRequests.push(forecastURL);
  }
  return forecastRequests;
}

// create all driving-time requests to Mapbox
function createMapRequests(longitude, latitude) {
  let mapRequests = [];
  let mapURL;
  let beach;

  for (let i=0; i<beachKeys.length; i++) {
    beach = beachKeys[i];
    mapURL = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${longitude},${latitude};${geoJSON[beach].long},${geoJSON[beach].lat}?geometries=geojson&access_token=${process.env.MAPBOX_API_KEY}`;
    mapRequests.push(mapURL);
  }
  return mapRequests;
}

module.exports = { beachNames, createForecastRequests, createMapRequests};
