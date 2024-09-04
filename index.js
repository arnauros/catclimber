"use strict";

console.log("Script started");

// ======================================
//          Map Initialization
// ======================================

// Global Variables
const mapContainerId = "map";
const defaultLocation = [2.154007, 41.390205]; // Default location (Barcelona)
const mapboxToken =
  "pk.eyJ1IjoiYXJuYXVyb3MiLCJhIjoiY20wYXNqOTU2MDEzYzJtc2Q0MXRpMjlnciJ9.UPU3udIJIprlj7HXDDgrbQ";
const defaultRadius = 1000; // Default radius in meters
let map;

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded event fired");
  initializeMap();
});

function initializeMap() {
  console.log("Initializing map");

  if (typeof mapboxgl === "undefined") {
    console.error("Mapbox GL JS is not loaded.");
    return;
  }

  console.log("Mapbox GL JS is loaded");
  mapboxgl.accessToken = mapboxToken;

  try {
    map = new mapboxgl.Map({
      container: mapContainerId,
      style: "mapbox://styles/mapbox/streets-v11", // You can change this style
      center: defaultLocation,
      zoom: 10,
    });

    map.on("load", () => {
      console.log("Map has loaded successfully.");
      setupGeolocation();
      setupSearch();
      attemptUserLocation(); // Try to get user's geolocation on load
    });
  } catch (error) {
    console.error("Error initializing map:", error);
  }
}

// ======================================
//      Searching For Locations
// ======================================

function setupGeolocation() {
  console.log("Setting up geolocation");

  const geolocateButton = document.getElementById("geolocateButton");
  if (geolocateButton) {
    geolocateButton.addEventListener("click", function (event) {
      event.preventDefault();
      console.log("Geolocation button clicked");
      attemptUserLocation();
    });
  } else {
    console.error("Geolocation button not found");
  }
}

function attemptUserLocation() {
  if ("geolocation" in navigator) {
    navigator.permissions
      .query({ name: "geolocation" })
      .then(function (result) {
        if (result.state === "granted" || result.state === "prompt") {
          locateUser();
        } else {
          fallbackToIPGeolocation();
        }
      });
  } else {
    fallbackToIPGeolocation();
  }
}

function fallbackToIPGeolocation() {
  console.log("Falling back to IP-based geolocation");
  fetch("https://ipapi.co/json/")
    .then((response) => response.json())
    .then((data) => {
      const ipBasedLocation = [data.longitude, data.latitude];
      updateMapWithLocation(ipBasedLocation, defaultRadius);
    })
    .catch((error) => {
      console.error("IP geolocation failed:", error);
      useDefaultLocation();
    });
}

function locateUser() {
  console.log("Attempting to locate user");
  navigator.geolocation.getCurrentPosition(
    function (position) {
      console.log("Geolocation successful");
      const userCoordinates = [
        position.coords.longitude,
        position.coords.latitude,
      ];
      console.log("User coordinates:", userCoordinates);
      updateMapWithLocation(userCoordinates, defaultRadius);
    },
    function (error) {
      console.error("Geolocation error:", error);
      let errorMessage = "Unable to retrieve your location. ";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage += "Location access was denied.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage += "Location information is unavailable.";
          break;
        case error.TIMEOUT:
          errorMessage += "The request to get user location timed out.";
          break;
        default:
          errorMessage += "An unknown error occurred.";
      }
      alert(errorMessage + " Using default location.");
      updateMapWithLocation(defaultLocation, defaultRadius);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}

function setupSearch() {
  console.log("Setting up search");

  const searchButton = document.getElementById("searchButton");
  if (searchButton) {
    searchButton.addEventListener("click", function (event) {
      event.preventDefault();
      const query = document.getElementById("searchLocate").value;
      if (query) {
        searchLocation(query);
      } else {
        console.log("Empty search query");
        alert("Please enter a location to search");
      }
    });
  } else {
    console.error("Search button not found");
  }
}

function searchLocation(query) {
  console.log("Searching for location:", query);

  const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    query
  )}.json?access_token=${mapboxToken}`;

  fetch(geocodingUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.features.length > 0) {
        const coordinates = data.features[0].center;
        const placeName = data.features[0].place_name;
        console.log("Location found:", placeName, coordinates);
        updateMapWithLocation(coordinates, defaultRadius);
      } else {
        console.log("Location not found");
        alert("Location not found");
      }
    })
    .catch((error) => console.error("Geocoding API error:", error));
}

// ======================================
//      Update Map and Display Roads
// ======================================

function updateMapWithLocation(coordinates, radiusInMeters) {
  map.flyTo({ center: coordinates, zoom: 12 });
  drawSearchArea(coordinates, radiusInMeters);
  addCustomRoadLayer(coordinates, radiusInMeters);
}

// Function to add the custom road layer and query roads within the radius
function addCustomRoadLayer(center, radiusInMeters = 1000) {
  console.log("Adding custom road layer around", center);

  // Remove existing custom road layer
  if (map.getLayer("custom-roads")) {
    map.removeLayer("custom-roads");
  }

  // Add the road source if it doesn't already exist
  if (!map.getSource("custom-roads")) {
    map.addSource("custom-roads", {
      type: "vector",
      url: "mapbox://mapbox.mapbox-streets-v8", // Mapbox streets vector source
    });
  }

  // Add the custom road layer
  map.addLayer({
    id: "custom-roads",
    type: "line",
    source: "custom-roads",
    "source-layer": "road",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#a200ff",
      "line-width": 2,
      "line-opacity": 1,
    },
    filter: ["in", "class", "primary", "secondary", "tertiary", "street"], // Filter by road class
  });

  // Query roads within the radius
  map.on("sourcedata", () => {
    const features = map.querySourceFeatures("custom-roads", {
      sourceLayer: "road",
    });

    const roadNames = new Set(); // To store unique road names

    features.forEach((feature) => {
      if (feature.geometry && feature.geometry.type === "LineString") {
        const roadCoordinates = feature.geometry.coordinates[0]; // Get the first coordinate in the LineString
        const roadLngLat = new mapboxgl.LngLat(
          roadCoordinates[0],
          roadCoordinates[1]
        );
        const distanceFromCenter = roadLngLat.distanceTo(
          new mapboxgl.LngLat(center[0], center[1])
        );

        if (distanceFromCenter <= radiusInMeters) {
          const roadName = feature.properties.name;
          if (roadName) {
            roadNames.add(roadName);
          }
        }
      }
    });

    // Display road names in console
    if (roadNames.size > 0) {
      console.log("Roads within the search area:");
      roadNames.forEach((name) => {
        console.log(name);
      });
    } else {
      console.log("No roads found within the radius");
    }
  });
}

// Function to create a circular polygon around a given point
function createCirclePolygon(center, radiusInKm) {
  return turf.circle(center, radiusInKm, { steps: 64 }).geometry.coordinates;
}

// Function to add the search area polygon to the map
function addSearchAreaToMap(coordinates, sourceId) {
  if (map.getLayer("search-area-layer")) {
    map.removeLayer("search-area-layer");
  }
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }

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
      "fill-color": "#ffffff",
      "fill-opacity": 0.05,
    },
  });

  // Add a line layer for the border
  map.addLayer({
    id: "search-area-border",
    type: "line",
    source: sourceId,
    paint: {
      "line-color": "#ffffff",
      "line-width": 2,
    },
  });

  console.log("Search area layer added");
}

// Function to draw the search area on the map
function drawSearchArea(center, radiusInMeters) {
  const radiusInKm = radiusInMeters / 1000;
  const circlePolygon = createCirclePolygon(center, radiusInKm);
  addSearchAreaToMap(circlePolygon, "search-area");
}
