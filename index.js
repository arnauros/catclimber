"use strict";

//Mapbox PROJECT STARTS HERE

// Global Variables
const mapContainerId = "map"; // ID of the map div
const defaultLocation = [2.154007, 41.390205]; // Default location (Paris coordinates)
const mapboxToken =
  "pk.eyJ1IjoiYXJuYXVyb3MiLCJhIjoiY20wYXNqOTU2MDEzYzJtc2Q0MXRpMjlnciJ9.UPU3udIJIprlj7HXDDgrbQ"; // Your Mapbox access token
let map; // Declare map variable globally so it can be accessed by other functions

// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function () {
  initializeMap(); // Call the function to initialize the map
  locateUser(); // Call the function to locate the user
  setupSearch(); // Call the function to setup the search functionality
  setupGeolocation(); // Set up geolocation functionality
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
    style: "mapbox://styles/mapbox/outdoors-v12",
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

        // Optionally, add a marker at the user's location
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
  // Added this part to prevent form submission
  const form = document.querySelector("form"); // Select the form element
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
    // Notice the event parameter
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

          // Optionally, add a marker at the user's location
          new mapboxgl.Marker().setLngLat(userCoordinates).addTo(map);
        },
        function (error) {
          console.error("Error getting geolocation: ", error);
          alert("Unable to retrieve your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  });
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

// const category = calculateClimbCategory(climb1.length, climb1.gradient);
// console.log(`${climb1.name} is classified as: ${category}`);

///////////////////// Finding the climbs ///////////////////////

function fetchClimbData(location, radius = 50) {
  const destination = [location[0] + 0.1, location[1] + 0.1]; // Adjust the destination point slightly for simplicity
  const url = `https://api.mapbox.com/directions/v5/mapbox/cycling/${location[0]},${location[1]};${destination[0]},${destination[1]}?geometries=geojson&access_token=${mapboxToken}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      console.log("Climb data fetched:", data);
      // Here we would process the data to extract relevant information
      // For now, just log the data to understand its structure
    })
    .catch((error) => console.error("Error fetching climb data:", error));
}
