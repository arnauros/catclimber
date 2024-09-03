"use strict";

// Mapbox PROJECT STARTS HERE

// Global Variables
const mapContainerId = "map"; // ID of the map div
const defaultLocation = [2.154007, 41.390205]; // Default location (Barcelona coordinates)
const mapboxToken =
  "pk.eyJ1IjoiYXJuYXVyb3MiLCJhIjoiY20wYXNqOTU2MDEzYzJtc2Q0MXRpMjlnciJ9.UPU3udIJIprlj7HXDDgrbQ";
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
    style: "mapbox://styles/mapbox/outdoors-v11", // Map style
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

        // Visualize roads at user's location
        addCustomRoadLayer(userCoordinates);
      },
      function (error) {
        console.error("Error getting geolocation:", error);
        // Fallback to default location (Barcelona) if geolocation fails
        map.flyTo({
          center: defaultLocation,
          zoom: 12, // Adjust zoom level as needed
        });

        // Visualize roads at default location
        addCustomRoadLayer(defaultLocation);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
    map.flyTo({
      center: defaultLocation,
      zoom: 12, // Adjust zoom level as needed
    });

    // Visualize roads at default location
    addCustomRoadLayer(defaultLocation);
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
        const placeName = data.features[0].place_name; // Get the place name (including road name)

        console.log(`Found location: ${placeName}`);

        map.flyTo({
          center: coordinates,
          zoom: 12, // Adjust zoom level as needed
        });

        // Visualize roads at searched location
        addCustomRoadLayer(coordinates);
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

          // Visualize roads at user's location
          addCustomRoadLayer(userCoordinates);
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

// Function to add a custom road layer
function addCustomRoadLayer(center) {
  map.addLayer({
    id: "custom-roads",
    type: "line",
    source: {
      type: "vector",
      url: "mapbox://mapbox.mapbox-streets-v8", // This is Mapbox's vector tile source for streets
    },
    "source-layer": "road", // Specify the source layer
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#FF0000", // Customize color as needed
      "line-width": 4,
    },
    filter: [
      "in",
      "class",
      "street",
      "primary",
      "secondary",
      "tertiary",
      "residential",
      "road",
      "track",
      "service",
      "motorway",
      "path",
      "unclassified",
      "road-street-low",
      "road-primary",
      "road-secondary",
      "road-street",
    ], // Only show roads that match these classes
  });

  console.log("Custom road layer added");
}

// Function to draw the search area on the map
function drawSearchArea(location, radiusInMeters) {
  const searchAreaSourceId = "search-area";
  const searchAreaLayerId = "search-area-layer";

  // Convert radius from meters to kilometers for the circle creation
  const radiusInKm = radiusInMeters / 1000;

  // Remove existing search area layer and source if they exist
  removeExistingSearchArea(searchAreaSourceId, searchAreaLayerId);

  // Create the circular polygon and add it to the map
  const circlePolygon = createCirclePolygon(location, radiusInKm);
  addSearchAreaToMap(circlePolygon, searchAreaSourceId);
}

// Function to remove existing search area layer and source from the map
function removeExistingSearchArea(sourceId, layerId) {
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
}

// Function to create a circular polygon around a given point
function createCirclePolygon(center, radiusInKm, points = 64) {
  const latitude = center[1];
  const longitude = center[0];
  const coordinates = [];

  const distanceX =
    radiusInKm / (111.32 * Math.cos((latitude * Math.PI) / 180));
  const distanceY = radiusInKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coordinates.push([longitude + x, latitude + y]);
  }
  coordinates.push(coordinates[0]); // Close the polygon

  return coordinates;
}

// Function to add the search area polygon to the map
function addSearchAreaToMap(coordinates, sourceId) {
  map.addSource(sourceId, {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [coordinates],
      },
    },
  });

  map.addLayer({
    id: "search-area-layer",
    type: "fill",
    source: sourceId,
    paint: {
      "fill-color": "#FF5733",
      "fill-opacity": 0.3,
    },
  });

  console.log("Search area layer added");
}
