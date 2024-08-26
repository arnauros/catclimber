"use strict";

/*
// Define constants for the base URL and the authorization token
const STRAVA_BASE_URL = "https://www.strava.com/api/v3/segments/";
const STRAVA_ACCESS_TOKEN = "Bearer f23239241d3c6a20b980bc1fb326235164b0b2f1";

// Function to calculate a bounding box based on segment data
function calculateBoundingBoxFromSegment(segment) {
  const startLatLng = segment.start_latlng;
  const endLatLng = segment.end_latlng;

  const latMin = Math.min(startLatLng[0], endLatLng[0]);
  const latMax = Math.max(startLatLng[0], endLatLng[0]);
  const lonMin = Math.min(startLatLng[1], endLatLng[1]);
  const lonMax = Math.max(startLatLng[1], endLatLng[1]);

  return `${latMin},${lonMin},${latMax},${lonMax}`;
}

// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function () {
  console.log("Script loaded and DOM fully parsed");

  // Function to fetch a single segment by ID
  async function fetchSegmentById(segmentId) {
    try {
      const url = `${STRAVA_BASE_URL}${segmentId}`;

      // Make the API request
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: STRAVA_ACCESS_TOKEN,
        },
      });

      // Check if the request was successful
      if (!response.ok) {
        if (response.status === 404) {
          console.error("Segment not found. Please check the segment ID.");
        } else {
          console.error("Error fetching segment:", response.statusText);
        }
        return null; // Return null to indicate failure
      }

      // Parse and return the JSON data
      const data = await response.json();
      console.log("API called successfully. Returned data:", data);
      return data;
    } catch (error) {
      console.error("Fetch error:", error);
      return null; // Return null on exception
    }
  }

  // Function to display a single segment's data
  async function displaySegmentData(segmentId) {
    const segmentData = await fetchSegmentById(segmentId); // Fetch segment data

    if (segmentData) {
      // Calculate bounding box dynamically based on the segment data
      const bounds = calculateBoundingBoxFromSegment(segmentData);

      // Now you have the bounds to use for further API calls or map displays
      console.log("Calculated Bounding Box:", bounds);

      // Mapping climb category to a more descriptive text
      const climbCategoryDescriptions = {
        0: "Category HC",
        1: "Category 1",
        2: "Category 2",
        3: "Category 3",
        4: "Category 4",
      };

      // Get the climb category from the segment data
      const climbCategory = segmentData.climb_category;
      console.log("Climb Category:", climbCategory); // Log the climb category

      // Map the climb category to its description or use "Category HC" if not found
      const description =
        climbCategoryDescriptions[climbCategory] || "Category HC";
      document.getElementById("categoryName").textContent = description;
      console.log("Segment data displayed successfully.");

      // Display the segment name
      const segmentNamePublic = segmentData.name;
      document.getElementById("segmentName").textContent = segmentNamePublic;

      // Convert and display the distance
      const distanceMeters = segmentData.distance;
      const distanceKm = (distanceMeters / 1000).toFixed(2);
      console.log("Distance in km:", distanceKm);
      document.getElementById("lengthClimb").textContent = `${distanceKm} km`;

      // Optionally, display additional segment data like elevation gain
      const elevationGain =
        segmentData.elevation_high - segmentData.elevation_low;
      document.getElementById(
        "elevationGain"
      ).textContent = `${elevationGain} meters`;
    } else {
      console.log("No segment data found.");
    }
  }

  // Example call to display the segment data
  const initialSegmentId = "5126312"; // Example segment ID
  displaySegmentData(initialSegmentId);
});

*/

////////////////////////////////////////


/*

//Mapbox PROJECT STARTS HERE

// Global Variables
// Global Variables
const mapContainerId = "map"; // ID of the div where the map will be rendered
const defaultLocation = [2.3522, 48.8566]; // Default location (Paris coordinates)
const mapboxToken =
  "pk.eyJ1IjoiYXJuYXVyb3MiLCJhIjoiY20wYXNqOTU2MDEzYzJtc2Q0MXRpMjlnciJ9.UPU3udIJIprlj7HXDDgrbQ"; // Your Mapbox access token

// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function () {
  initializeMap(); // Call the function to initialize the map
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
  const map = new mapboxgl.Map({
    container: mapContainerId, // ID of the map container
    style: "mapbox://styles/mapbox/streets-v11", // Style of the map
    center: defaultLocation, // Default center location
    zoom: 10, // Default zoom level
  });

  // Optional: Add navigation controls to the map (zoom, rotate)
  map.addControl(new mapboxgl.NavigationControl());

  // Optional: Add other map setup or event listeners here
}
