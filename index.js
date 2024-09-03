"use strict";

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
  if (typeof mapboxgl === "undefined") {
    console.error("Mapbox GL JS is not loaded.");
    return;
  }

  mapboxgl.accessToken = mapboxToken;

  map = new mapboxgl.Map({
    container: mapContainerId, // ID of the map container
    style: "mapbox://styles/mapbox/streets-v12", // Map style
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

        new mapboxgl.Marker().setLngLat(userCoordinates).addTo(map);
        fetchRoadData(userCoordinates); // Fetch and display data around the user's location
      },
      function (error) {
        console.error("Error getting geolocation:", error);
        fetchRoadData(defaultLocation); // Fallback to default location (Barcelona) if geolocation fails
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
    fetchRoadData(defaultLocation); // Fallback to Barcelona if geolocation isn't available
  }
}

// Function to set up search functionality
function setupSearch() {
  const form = document.querySelector("form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
    });
  }

  document
    .getElementById("searchButton")
    .addEventListener("click", function (event) {
      event.preventDefault();
      const query = document.getElementById("searchLocate").value;
      if (query) {
        searchLocation(query);
      } else {
        alert("Please enter a location to search");
      }
    });

  document
    .getElementById("searchLocate")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
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
          zoom: 12,
        });

        fetchRoadData(coordinates); // Fetch and display data for the searched location
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
    event.preventDefault();
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const userCoordinates = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          map.flyTo({
            center: userCoordinates,
            zoom: 12,
          });

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

// Function to fetch road data using the Mapbox API and visualize the search area
function fetchRoadData(location, radius = 500) {
  const url = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${location[0]},${location[1]}.json?radius=${radius}&limit=50&dedupe&geometry=linestring&access_token=${mapboxToken}`;

  drawSearchArea(location, radius); // Draw the search area on the map as a circle

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        console.error("Error in API response:", data.message);
        return;
      }
      console.log("Road data received:", data);

      visualizeRoads(data.features); // After drawing the search area, visualize the roads last
    })
    .catch((error) => console.error("Error fetching road data:", error));
}

// Function to visualize roads on the map
function visualizeRoads(features) {
  const layers = map.getStyle().layers;
  let firstSymbolId;
  for (const layer of layers) {
    if (layer.type === "symbol") {
      firstSymbolId = layer.id;
      break;
    }
  }

  features.forEach((feature, index) => {
    if (
      feature.properties.class &&
      [
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
      ].includes(feature.properties.class)
    ) {
      const roadName =
        feature.properties.name ||
        `${
          feature.properties.class.charAt(0).toUpperCase() +
          feature.properties.class.slice(1)
        } Road ${index + 1}`;

      console.log(`Visualizing road: ${roadName}`);

      map.addSource(`road-source-${index}`, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: feature.geometry,
        },
      });

      // Get the first symbol layer id for placement reference
      const layers = map.getStyle().layers;
      let firstSymbolId;
      for (const layer of layers) {
        if (layer.type === "symbol") {
          firstSymbolId = layer.id;
          break;
        }
      }

      map.addLayer(
        {
          id: `road-layer-${index}`,
          type: "line",
          source: `road-source-${index}`,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#FF5733",
            "line-width": 4,
          },
        },
        firstSymbolId
      ); // Place the road layer beneath labels

      console.log(`Added layer for road ${index + 1}: ${roadName}`);
    } else {
      console.log(`Skipping feature ${index + 1}: Not a road`);
    }
  });
}

// Function to draw the search area on the map
function drawSearchArea(location, radiusInMeters) {
  const searchAreaSourceId = "search-area";
  const searchAreaLayerId = "search-area-layer";

  removeExistingSearchArea(searchAreaSourceId, searchAreaLayerId);

  const circlePolygon = createCirclePolygon(location, radiusInMeters / 1000);
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
}
