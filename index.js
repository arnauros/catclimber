"use strict";

// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Script loaded and DOM fully parsed");

  // Function to fetch a segment from Strava
  async function fetchSingleSegment() {
    try {
      const segmentId = "10959819"; // The specific segment ID
      const url = `https://www.strava.com/api/v3/segments/${segmentId}`;

      // Make the API request
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: "Bearer f23239241d3c6a20b980bc1fb326235164b0b2f1", // Replace with your valid token
        },
      });

      // Check if the request was successful
      if (!response.ok) {
        console.error("Error fetching segment:", response.statusText);
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

  // Function to display the segment data
  async function displaySegmentData() {
    const segmentData = await fetchSingleSegment(); // Fetch segment data

    if (segmentData) {
      // Get the element by ID and set its text content
      document.getElementById("categoryName").textContent =
        segmentData.climb_category || "N/A";
      console.log("Segment data displayed successfully.");
    } else {
      console.log("No segment data found.");
    }
  }

  // Call the function to display the segment data
  displaySegmentData();
});
