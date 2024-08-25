// getting id's and naming them
const categoryIncline = document.getElementById("categoryName").textContent;
console.log(categoryIncline);

async function fetchSingleSegment() {
  try {
    // Specify the segment ID
    const segmentId = "10959819";
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
      const errorText = await response.text();
      console.error("Response text:", errorText);
      throw new Error("Network response was not ok");
    }

    // Parse the JSON data
    const data = await response.json();
    console.log("API called successfully. Returned data:", data);

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

fetchSingleSegment(); // Call the function to execute it

async function displaySingleSegment() {
  const segmentData = await fetchSingleSegment();

  if (segmentData) {
    const segmentContainer = document.getElementById("climbContainer");
    segmentContainer.innerHTML = ""; // Clear previous content

    const segmentElement = document.createElement("div");
    segmentElement.className = "climbItem";
    segmentElement.innerHTML = `
            <h3>${segmentData.name}</h3>
            <p>Average Grade: ${segmentData.average_grade}%</p>
            <p>Elevation Gain: ${
              segmentData.elevation_high - segmentData.elevation_low
            } meters</p>
            <p>Distance: ${(segmentData.distance / 1000).toFixed(2)} km</p>
        `;
    segmentContainer.appendChild(segmentElement);
  } else {
    console.log("No segment data available.");
    document.getElementById("climbContainer").innerHTML =
      "<p>No segment data found.</p>";
  }
}

displaySingleSegment(); // Call the function to display the segment data
