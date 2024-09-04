"use strict";

console.log("Script started");

// ======================================
//          Map Initialization
// ======================================

// Global Variables
const mapContainerId = "map";
const defaultLocation = [2.154007, 41.390205];
const mapboxToken =
  "pk.eyJ1IjoiYXJuYXVyb3MiLCJhIjoiY20wYXNqOTU2MDEzYzJtc2Q0MXRpMjlnciJ9.UPU3udIJIprlj7HXDDgrbQ";
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
      style: "mapbox://styles/mapbox/outdoors-v11",
      center: defaultLocation,
      zoom: 10,
    });
    console.log("Map object created");

    map.on("load", () => {
      console.log("Map has loaded successfully.");
      setupGeolocation();
      setupSearch();
      addCustomRoadLayer(defaultLocation);
      attemptUserLocation(); // New function to attempt geolocation on load
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
      console.log("Geolocation button clicked");
      event.preventDefault();
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
      updateMapWithLocation(ipBasedLocation);
      drawSearchArea(ipBasedLocation, 1000); // Draw radius for IP-based location
      alert(
        "Using approximate location based on your IP address. For more accurate results, please enable location services."
      );
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
      map.flyTo({
        center: userCoordinates,
        zoom: 12,
      });
      new mapboxgl.Marker().setLngLat(userCoordinates).addTo(map);
      addCustomRoadLayer(userCoordinates);
      drawSearchArea(userCoordinates, 1000); // Draw radius around the user's location
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
      map.flyTo({ center: defaultLocation, zoom: 12 });
      addCustomRoadLayer(defaultLocation);
      drawSearchArea(defaultLocation, 1000); // Draw radius for default location
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
      console.log("Search button clicked");
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
      console.log("Geocoding API response received");
      if (data.features.length > 0) {
        const coordinates = data.features[0].center;
        const placeName = data.features[0].place_name;
        console.log("Location found:", placeName, coordinates);
        map.flyTo({
          center: coordinates,
          zoom: 12,
        });
        addCustomRoadLayer(coordinates);
        drawSearchArea(coordinates, 1000); // Draw radius around searched location
      } else {
        console.log("Location not found");
        alert("Location not found");
      }
    })
    .catch((error) => console.error("Geocoding API error:", error));
}

// ======================================
//          Add The Road Layer
// ======================================

function addCustomRoadLayer(center) {
  console.log("Adding custom road layer", center);
  if (map.getLayer("custom-roads")) {
    console.log("Removing existing custom road layer");
    map.removeLayer("custom-roads");
  }

  if (!map.getSource("custom-roads")) {
    console.log("Adding custom road source");
    map.addSource("custom-roads", {
      type: "vector",
      url: "mapbox://mapbox.mapbox-streets-v8",
    });
  }

  console.log("Adding custom road layer");
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
    filter: [
      "all",
      [
        "in",
        "class",
        "primary", // Road primary
        "secondary",
        "tertiary", // Road secondary tertiary
        "street_limited", // Road street low
        "street", // Road street
        "major_road_link", // Road major link
        "secondary_tertiary_case", // Road secondary tertiary case
        "street_case", // Road street case
      ],
      // ["in", "surface", "paved", "asphalt", "concrete"],
    ],
  });
  // Query for roads within the viewport and log the names
  map.on("idle", () => {
    const features = map.queryRenderedFeatures({
      layers: ["custom-roads"],
    });

    const roadNames = new Set(); // Using Set to avoid duplicates

    features.forEach((feature) => {
      const roadCoordinates = feature.geometry.coordinates[0]; // Coordinates of the road feature
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
    });

    // Display road names in console
    console.log("Roads within the search area:");
    roadNames.forEach((name) => {
      console.log(name);
    });
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
      "fill-color": "#FF5733",
      "fill-opacity": 0.3,
    },
  });

  console.log("Search area layer added");
}

// Function to draw the search area on the map
function drawSearchArea(center, radiusInMeters) {
  const searchAreaSourceId = "search-area";
  const radiusInKm = radiusInMeters / 1000;

  const circlePolygon = createCirclePolygon(center, radiusInKm);
  addSearchAreaToMap(circlePolygon, searchAreaSourceId);
}
