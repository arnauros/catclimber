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
    setupGeolocation(); // Set up geolocation functionality
    setupSearch(); // Set up search functionality
  });
});

// Function to initialize the map
function initializeMap() {
  if (typeof mapboxgl === "undefined") {
    console.error("Mapbox GL JS is not loaded.");
    return;
  }

  mapboxgl.accessToken = mapboxToken;

  map = new mapboxgl.Map({
    container: mapContainerId, // ID of the map container
    style: "mapbox://styles/mapbox/outdoors-v11", // Map style
    center: defaultLocation, // Default center location
    zoom: 10, // Default zoom level
  });
}

console.log("Layers:", map.getStyle().layers);
console.log("Sources:", map.getStyle().sources);

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
        new mapboxgl.Marker().setLngLat(userCoordinates).addTo(map);
        addCustomRoadLayer(userCoordinates);
      },
      function (error) {
        console.error("Error getting geolocation:", error);
        // Fallback to default location (Barcelona) if geolocation fails
        map.flyTo({ center: defaultLocation, zoom: 12 });
        addCustomRoadLayer(defaultLocation);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
    map.flyTo({ center: defaultLocation, zoom: 12 });
    addCustomRoadLayer(defaultLocation);
  }
}

// Function to set up search functionality
function setupSearch() {
  const searchButton = document.getElementById("searchButton");
  searchButton.addEventListener("click", function (event) {
    event.preventDefault();
    const query = document.getElementById("searchLocate").value;
    if (query) {
      searchLocation(query);
    } else {
      alert("Please enter a location to search");
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
        const placeName = data.features[0].place_name;

        map.flyTo({
          center: coordinates,
          zoom: 12,
        });

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
    event.preventDefault(); // Prevent any default behavior

    locateUser(); // Call the locateUser function when the button is clicked
  });
}

// Function to add a custom road layer
function addCustomRoadLayer(center) {
  if (!map.isStyleLoaded()) {
    console.error("Map style not fully loaded yet.");
    return;
  }

  map.addLayer({
    id: "custom-roads",
    type: "line",
    source: {
      type: "vector",
      url: "mapbox://mapbox.mapbox-streets-v8", // Ensure this is correct
    },
    "source-layer": "road", // Ensure the source layer name is correct
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#FF0000",
      "line-width": 2,
      "line-opacity": 0.6,
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
