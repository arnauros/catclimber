// getting id's and naming them
const categoryElement = document.getElementById("categoryName").textContent;
// console.log(categoryElement);

// function to fetch segment from strava
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

// fetchSingleSegment(); // Call the function to execute it

async function displaySegmentData() {
  const segmentData = await fetchSingleSegment();

  if (segmentData) {
    document.getElementById("categoryName").textContent = "a";
    console.log("yes");
  }
}
