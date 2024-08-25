async function fetchClimbs() {
  try {
    const response = await fetch(
      "https://www.strava.com/api/v3/segments/explore",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer f23239241d3c6a20b980bc1fb326235164b0b2f1",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    console.log(data); // You can inspect the data to see the structure
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
}
