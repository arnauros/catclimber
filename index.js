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

        // Fetch and display data around the user's location
        fetchRoadData(userCoordinates);
      },
      function (error) {
        console.error("Error getting geolocation:", error);
        // Fallback to default location (Barcelona) if geolocation fails
        fetchRoadData(defaultLocation);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
    fetchRoadData(defaultLocation); // Fallback to Barcelona if geolocation isn't available
  }
}

// Function to fetch road data using the Mapbox Streets vector tiles API
function fetchRoadData(location, radius = 1000) {
  const url = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${location[0]},${location[1]}.json?radius=${radius}&limit=50&dedupe&geometry=linestring&access_token=${mapboxToken}`;

  // Draw the search area on the map as a circle
  drawSearchArea(location, radius);

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        console.error("Error in API response:", data.message);
        return;
      }
      console.log("Road data received:", data);

      // After drawing the search area, visualize the roads last
      visualizeRoads(data.features);
    })
    .catch((error) => console.error("Error fetching road data:", error));
}

//==========================================
//          Visualizing Roads
//==========================================

// Function to visualize only paved roads on the map
function visualizeRoads(features) {
  // Remove existing road layers
  map.getStyle().layers.forEach((layer) => {
    if (layer.id.startsWith("road-layer-")) {
      map.removeLayer(layer.id);
    }
  });

  // Remove existing road sources
  Object.keys(map.getStyle().sources).forEach((source) => {
    if (source.startsWith("road-source-")) {
      map.removeSource(source);
    }
  });

  // Iterate over the features returned by the Tilequery API
  features.forEach((feature, index) => {
    // Filter out features that do not have LineString geometry
    if (feature.geometry.type === "LineString") {
      const roadClass = feature.properties.class;
      const surfaceType = feature.properties.surface;

      // Check if the surface is paved
      if (surfaceType === "paved" && roadClass) {
        const roadName =
          feature.properties.name ||
          `${roadClass.charAt(0).toUpperCase() + roadClass.slice(1)} Road ${
            index + 1
          }`;
        console.log("------------------");
        console.log(`Visualizing road: ${roadName} (Surface: ${surfaceType})`);
        console.log("Feature coordinates:", feature.geometry.coordinates);

        const sourceId = `road-source-${index}`;
        const layerId = `road-layer-${index}`;

        // Add the source for the road feature
        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: feature.geometry,
          },
        });
        console.log(`Added source for ${roadName}`); // <-- Add this log

        // Add the road layer, placing it above existing road layers
        map.addLayer(
          {
            id: layerId,
            type: "line",
            source: sourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#FF0000", // Customize color as needed
              "line-width": 4,
            },
          },
          undefined // Place this layer on top of all others
        );

        console.log(`Added layer for road ${index + 1}: ${roadName}`);
        console.log("------------------");
      } else {
        console.log(`Skipping feature ${index + 1}: Not a paved road`);
        console.log("------------------");
      }
    } else {
      console.log(
        `Skipping feature ${index + 1}: Not a LineString (found ${
          feature.geometry.type
        })`
      );
    }
  });
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
