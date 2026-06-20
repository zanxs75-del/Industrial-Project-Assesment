document.addEventListener("DOMContentLoaded", function(){
    const mapConfig = initMap(1.2938, 103.8540, "map");

    const form = document.querySelector("#recommend-form");
    const recommendBtn = document.querySelector("#recommend-btn");
    const btnLabel = document.querySelector("#recommend-btn-label");
    const btnSpinner = document.querySelector("#recommend-btn-spinner");
    const recommendError = document.querySelector("#recommend-error");
    const resultsOffcanvasEl = document.querySelector("#results-offcanvas");
    const resultsOffcanvas = new bootstrap.Offcanvas(resultsOffcanvasEl);

    function setLoading(isLoading){
        recommendBtn.disabled = isLoading;
        btnLabel.classList.toggle("d-none", isLoading);
        btnSpinner.classList.toggle("d-none", !isLoading);
    }

    function showError(message){
        recommendError.textContent = message;
        recommendError.classList.remove("d-none");
    }

    function clearError(){
        recommendError.textContent = "";
        recommendError.classList.add("d-none");
    }

    form.addEventListener("submit", async function(e){
        e.preventDefault();
        clearError();
        setLoading(true);

        try {
            const recommendTerms = document.querySelector("#recommend-terms").value.trim();
            if (!recommendTerms) {
                showError("Please enter what you are looking for.");
                setLoading(false);
                return;
            }

            const center = mapConfig.map.getBounds().getCenter();
            const response = await recommend(center.lat, center.lng, recommendTerms);
            displayRecommendations(mapConfig, response);
            resultsOffcanvas.show();
        } catch (error) {
            showError("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    });
});