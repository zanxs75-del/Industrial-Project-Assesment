const API_BASE_URL = "http://localhost:3000"

async function recommend(lat, lng, query) {
    const response = await axios.post(API_BASE_URL + "/api/travel-advisor", {
        userMessage: query,
        lat: lat,
        lng: lng
    });

    console.log(response.data);

    // remove data with null lat or lng, or with 0 values
    response.data.locations = (response.data.locations || []).filter(function(location){
        return location.lat !== null && location.lng !== null && location.lat !== 0 && location.lng !== 0;
    });

    // if empty results, throw an error
    if (response.data.locations.length === 0) {
        throw new Error("The AI didn't find any results. Please try again");
    }

    return response.data;
}
