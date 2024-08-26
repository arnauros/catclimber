"use strict";

// Mapbox PROJECT STARTS HERE

// Global Variables
const mapContainerId = "map"; // ID of the map div
const defaultLocation = [2.154007, 41.390205]; // Default location (Barcelona coordinates)
const mapboxToken =
  "pk.eyJ1IjoiYXJuYXVyb3MiLCJhIjoiY20wYXNqOTU2MDEzYzJtc2Q0MXRpMjlnciJ9.UPU3udIJIprlj7HXDDgrbQ"; // Your Mapbox access token
let map; // Declare map variable globally so it can be accessed by other functions

// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function () {
  initializeMap(); // Call the function to initialize the map
  map.on("load", () => {
    locateUser(); // Call the function to locate the user after map is loaded
    setupSearch(); // Call the function to setup the search functionality
    setupGeolocation(); // Set up geolocation functionality
  });
});

// Function to initialize the map
function initializeMap() {
  // Ensure the Mapbox GL JS library is loaded
  if (typeof mapboxgl === "undefined") {
    console.error("Mapbox GL JS is not loaded.");
    return;
  }

  // Set the Mapbox access token
  mapboxgl.accessToken = mapboxToken;

  // Initialize the map
  map = new mapboxgl.Map({
    container: mapContainerId, // ID of the map container
    style: "mapbox://styles/mapbox/outdoors-v12", // Map style
    center: defaultLocation, // Default center location
    zoom: 10, // Default zoom level
  });
}

// Function to automatically locate the user on page load
function locateUser() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const userCoordinates = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        map.flyTo({
          center: userCoordinates,
          zoom: 12, // Adjust zoom level as needed
        });

        // Add a marker at the user's location
        new mapboxgl.Marker().setLngLat(userCoordinates).addTo(map);

        // Fetch climb data around the user's location
        fetchClimbData(userCoordinates);
      },
      function (error) {
        console.error("Error getting geolocation:", error);
        // Fallback to default location (Barcelona) if geolocation fails
        fetchClimbData(defaultLocation);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
    fetchClimbData(defaultLocation); // Fallback to Barcelona if geolocation isn't available
  }
}

// Function to set up search functionality
function setupSearch() {
  // Prevent form submission
  const form = document.querySelector("form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent form submission
    });
  }

  // Set up the search button click event
  document
    .getElementById("searchButton")
    .addEventListener("click", function (event) {
      event.preventDefault(); // Prevent the default form submission behavior
      const query = document.getElementById("searchLocate").value;
      if (query) {
        searchLocation(query);
      } else {
        alert("Please enter a location to search");
      }
    });

  // Set up 'Enter' key press event on the input field
  document
    .getElementById("searchLocate")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault(); // Prevent the default form submission behavior
        const query = e.target.value;
        if (query) {
          searchLocation(query);
        } else {
          alert("Please enter a location to search");
        }
      }
    });
}

// Function to search for a location using the Mapbox Geocoding API
function searchLocation(query) {
  const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    query
  )}.json?access_token=${mapboxToken}`;

  fetch(geocodingUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.features.length > 0) {
        const coordinates = data.features[0].center;
        map.flyTo({
          center: coordinates,
          zoom: 12, // Adjust zoom level as needed
        });
      } else {
        alert("Location not found");
      }
    })
    .catch((error) => console.error("Error:", error));
}

// Function to set up geolocation functionality
function setupGeolocation() {
  const geolocateButton = document.getElementById("geolocateButton");

  geolocateButton.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent any default behavior, such as form submission

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const userCoordinates = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          map.flyTo({
            center: userCoordinates,
            zoom: 12, // Adjust zoom level as needed
          });

          // Add a marker at the user's location
          new mapboxgl.Marker().setLngLat(userCoordinates).addTo(map);
        },
        function (error) {
          console.error("Error getting geolocation:", error);
          alert("Unable to retrieve your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  });
}

// Function to fetch climb data using the Mapbox API
function fetchClimbData(location, radius = 500) {
  const url = `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${
    location[0]
  },${location[1]}.json?radius=${
    radius * 1000
  }&limit=50&access_token=${mapboxToken}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        console.error("Error in API response:", data.message);
        return;
      }
      console.log("Raw data received:", data);
      const elevationPoints = data.features.map((feature) => ({
        coordinates: feature.geometry.coordinates,
        elevation: feature.properties.ele,
      }));
      const climbs = findClimbs(elevationPoints);
      console.log("Climbs found:", climbs);
    })
    .catch((error) => console.error("Error fetching elevation data:", error));
}

// Function to find potential climbs based on elevation points
function findClimbs(elevationPoints) {
  console.log("Elevation points received:", elevationPoints.length);
  const climbs = [];
  let currentClimb = [];
  let totalElevationGain = 0;

  for (let i = 1; i < elevationPoints.length; i++) {
    const elevationDiff =
      elevationPoints[i].elevation - elevationPoints[i - 1].elevation;
    if (elevationDiff > 0) {
      currentClimb.push(elevationPoints[i]);
      totalElevationGain += elevationDiff;
    } else if (currentClimb.length > 0) {
      console.log(
        `Potential climb found: Length ${currentClimb.length}, Elevation gain ${totalElevationGain}`
      );
      if (totalElevationGain > 20 && currentClimb.length > 2) {
        // Example criteria for a climb
        climbs.push({
          name: `Climb ${climbs.length + 1}`,
          coordinates: currentClimb.map((point) => point.coordinates),
          elevationGain: totalElevationGain,
          length: calculateDistance(currentClimb),
          category: calculateClimbCategory(
            calculateDistance(currentClimb),
            totalElevationGain
          ),
        });
        console.log("Climb added");
      }
      currentClimb = [];
      totalElevationGain = 0;
    }
  }

  console.log(`Total climbs found: ${climbs.length}`);
  return climbs;
}

// Function to calculate the distance between points
function calculateDistance(points) {
  let distance = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].coordinates[0] - points[i - 1].coordinates[0];
    const dy = points[i].coordinates[1] - points[i - 1].coordinates[1];
    distance += Math.sqrt(dx * dx + dy * dy);
  }
  return distance * 111000; // Rough conversion to meters
}

// Function to calculate the climb category based on length and gradient
function calculateClimbCategory(length, gradient) {
  const score = length * gradient;

  // Ensure the climb meets the minimum criteria
  if (gradient < 3 || score < 8000) {
    return null; // Not categorized
  }

  // Categorize based on the score
  if (score >= 80000) {
    return "Hors Catégorie";
  } else if (score >= 64000) {
    return "Category 1";
  } else if (score >= 32000) {
    return "Category 2";
  } else if (score >= 16000) {
    return "Category 3";
  } else if (score >= 8000) {
    return "Category 4";
  }

  return null; // Default case, though it should not be reached
}

//working well

// Function to visualize the climbs on the map
// function visualizeClimbs(climbs) {
//   if (!map.loaded()) {
//     map.on("load", () => visualizeClimbs(climbs));
//     return;
//   }

//   climbs.forEach((climb, index) => {
//     // Add a source for the climb route
//     map.addSource(`climb-source-${index}`, {
//       type: "geojson",
//       data: {
//         type: "Feature",
//         properties: {},
//         geometry: {
//           type: "LineString",
//           coordinates: climb.coordinates,
//         },
//       },
//     });

//     // Add a layer to visualize the climb route
//     map.addLayer({
//       id: `climb-layer-${index}`,
//       type: "line",
//       source: `climb-source-${index}`,
//       layout: {
//         "line-join": "round",
//         "line-cap": "round",
//       },
//       paint: {
//         "line-color": "#FF5733", // Customize the color as needed
//         "line-width": 4,
//       },
//     });

//     // Add a marker at the start of the climb
//   });
// }
