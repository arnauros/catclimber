"use strict";

// Ensure the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Script loaded and DOM fully parsed");

  // Function to fetch a segment from Strava
  async function fetchSingleSegment() {
    try {
      const segmentId = "4629741"; // The specific segment ID
      const url = `https://www.strava.com/api/v3/segments/${segmentId}`;

      // Make the API request
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: "Bearer f23239241d3c6a20b980bc1fb326235164b0b2f1",
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
      // Mapping climb category to a more descriptive text
      const climbCategoryDescriptions = {
        0: "HC (Hors Catégorie)",
        1: "Category 1",
        2: "Category 2",
        3: "Category 3",
        4: "Category 4",
        5: "Category HC",
      };

      // Get the climb category from the segment data
      const climbCategory = segmentData.climb_category;
      console.log("Climb Category:", climbCategory); // Log the climb category

      // Map the climb category to its description or use "N/A" if not found
      const description = climbCategoryDescriptions[climbCategory] || "N/A";
      document.getElementById("categoryName").textContent = description;
      console.log("Segment data displayed successfully.");
    } else {
      console.log("No segment data found.");
    }
  }

  // Call the function to display the segment data
  displaySegmentData();
});
