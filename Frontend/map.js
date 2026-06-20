function initMap(lat, lng, mapElementID) {
    const coordinate = [lat, lng];
    const map = L.map(mapElementID);
    map.setView(coordinate, 13);

    // Use Google Maps as base layer via GoogleMutant
    const googleLayer = L.gridLayer.googleMutant({
        type: 'roadmap'
    }).addTo(map);

    const searchResultLayer = L.layerGroup().addTo(map);

    return {map, searchResultLayer, googleLayer};
}

/**
 * Renders AI recommendation results from the Gemini backend.
 *
 * Expected response shape:
 * {
 *   locations: [
 *     {
 *       name: string,
 *       lat: number,
 *       lng: number,
 *       description: string,
 *       address: string,
 *       source: { uri: string, title: string, placeId: string }
 *     }
 *   ],
 *   sources: [ { uri, title, placeId } ],
 *   groundingSupports: []
 * }
 */
function displayRecommendations(mapConfig, results) {
    mapConfig.searchResultLayer.clearLayers();

    const recommendationResultDisplay = document.querySelector("#recommend-results");
    const emptyState = document.querySelector("#recommend-empty");
    const countBadge = document.querySelector("#results-count-badge");
    const toggleBtn = document.querySelector("#results-toggle-btn");

    recommendationResultDisplay.innerHTML = "";

    const locations = (results && results.locations) || [];

    countBadge.textContent = locations.length;

    if (locations.length === 0) {
        emptyState.classList.remove("d-none");
        toggleBtn.classList.add("d-none");
        return;
    }

    emptyState.classList.add("d-none");
    toggleBtn.classList.remove("d-none");

    const markers = [];

    locations.forEach(function(location){
        const marker = L.marker([location.lat, location.lng]);
        marker.addTo(mapConfig.searchResultLayer);
        markers.push(marker);

        const source = location.source;

        function createPopupContent() {
            return `
                <h1>${location.name}</h1>
                <ul>
                    ${location.address ? `<li><i class="bi bi-geo-alt"></i> ${location.address}</li>` : ''}
                    ${location.description ? `<li>${location.description}</li>` : ''}
                    ${source && source.uri ? `<li>
                        <img src="https://www.google.com/favicon.ico" width="14" height="14">
                        <a href="${source.uri}" target="_blank" rel="noopener">View on Google Maps</a>
                    </li>` : ''}
                </ul>
            `;
        }

        marker.bindPopup(createPopupContent);

        // build a Bootstrap list-group item for each result
        const resultElement = document.createElement('a');
        resultElement.href = "#";
        resultElement.className = 'list-group-item list-group-item-action result-item';

        resultElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-start gap-2">
                <div class="flex-grow-1">
                    <div class="result-name">${location.name}</div>
                    ${location.address ? `<div class="result-address">
                        <i class="bi bi-geo-alt"></i> ${location.address}
                    </div>` : ''}
                    ${location.description ? `<div class="result-description mt-1">${location.description}</div>` : ''}
                    ${source && source.uri ? `<div class="result-attribution mt-1">
                        <img src="https://www.google.com/favicon.ico" width="12" height="12">
                        <a href="${source.uri}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${source.title || 'Google Maps'}</a>
                    </div>` : ''}
                </div>
                <i class="bi bi-arrow-right-circle text-primary fs-5"></i>
            </div>
        `;
        recommendationResultDisplay.appendChild(resultElement);

        resultElement.addEventListener("click", function(e){
            e.preventDefault();
            mapConfig.map.flyTo([location.lat, location.lng], 16);
            marker.openPopup();

            // Dismiss the offcanvas so the map is fully visible.
            // The user can reopen the results via the toggle button in the search card.
            const offcanvasEl = document.querySelector("#results-offcanvas");
            const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
            if (offcanvas) offcanvas.hide();
        });
    });

    // Fit map to all markers so the user sees everything at once
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        mapConfig.map.fitBounds(group.getBounds().pad(0.2));
    }
}
