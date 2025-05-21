// Main application initialization

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Set up the info button and modal
    setupInfoModal();

    // Add CSS class for highlighted cells
    const style = document.createElement('style');
    style.textContent = `
        .highlighted {
            font-weight: bold;
            background-color: #e3f2fd;
        }
        .error-message {
            background-color: #f8d7da;
            color: #721c24;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            text-align: center;
        }
    `;
    document.head.appendChild(style);

    // Set up the table toggle button
    setupTableToggle();

    // Set up minimum wage filter
    setupMinWageFilter();

    // Set up zip code lookup
    setupZipCodeLookup();

    // Load the wage data
    loadData();
});

// This function is no longer needed as we're using the map control for filter toggle
function setupSidebarToggle() {
    // Functionality moved to map.js in the toggleFilterBox function
}

// Set up minimum wage filter
function setupMinWageFilter() {
    const applyButton = document.getElementById('apply-wage-filters');
    const minWageInput = document.getElementById('min-wage');
    const maxWageInput = document.getElementById('max-wage');

    applyButton.addEventListener('click', function () {
        // Get the minimum wage value from the input
        const minWage = parseFloat(minWageInput.value);

        // Get the maximum wage value from the input
        const maxWage = parseFloat(maxWageInput.value);

        // Update the global wage filter variables
        minWageFilter = isNaN(minWage) ? 0 : minWage;
        maxWageFilter = isNaN(maxWage) ? 0 : maxWage;

        // Update the filtered data
        updateFilteredData();

        // Update the map
        updateMap();

        // Update the table
        updateTable();
    });

    // Also apply filters when Enter key is pressed in either input field
    minWageInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            applyButton.click();
        }
    });

    maxWageInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            applyButton.click();
        }
    });
}

// Set up zip code lookup functionality
function setupZipCodeLookup() {
    const zipInput = document.getElementById('zip-code');
    const lookupButton = document.getElementById('zip-lookup-btn');
    const resultDiv = document.getElementById('zip-result');

    // Add event listener to the lookup button
    lookupButton.addEventListener('click', function () {
        lookupZipCode();
    });

    // Also lookup when Enter key is pressed in the zip input field
    zipInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            lookupZipCode();
        }
    });

    // Function to perform the zip code lookup
    function lookupZipCode() {
        const zipCode = zipInput.value.trim();

        // Basic validation for US zip code format (5 digits)
        if (!/^\d{5}$/.test(zipCode)) {
            resultDiv.innerHTML = 'Please enter a valid 5-digit US zip code.';
            resultDiv.classList.add('active');
            return;
        }

        // Show loading state
        resultDiv.innerHTML = 'Looking up zip code...';
        resultDiv.classList.add('active');

        // Call the zippopotam.us API
        fetch(`https://api.zippopotam.us/us/${zipCode}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Zip code not found');
                }
                return response.json();
            })
            .then(data => {
                // Extract location data
                const place = data.places[0];
                const latitude = parseFloat(place.latitude);
                const longitude = parseFloat(place.longitude);
                const city = place.place_name;
                const state = place.state;
                const stateAbbr = place['state abbreviation'];

                // Find which CBSA area and county this location falls within
                const areaInfo = findAreaForCoordinates(latitude, longitude);

                if (areaInfo) {
                    // Display the results
                    resultDiv.innerHTML = `
                        <strong>Location:</strong> ${city}, ${stateAbbr} (${state})<br>
                        <strong>Area:</strong> ${areaInfo.areaName || 'N/A'}<br>
                        <strong>County:</strong> ${areaInfo.countyName || 'N/A'}<br>
                    `;

                    // If we have wage data for this area, display it
                    if (areaInfo.hasWageData) {
                        resultDiv.innerHTML += `
                            <strong>Wage Data Available:</strong> Yes<br>
                            <button id="view-area-data" class="view-area-button">View Wage Data</button>
                        `;

                        // Add event listener to the view data button
                        setTimeout(() => {
                            const viewDataBtn = document.getElementById('view-area-data');
                            if (viewDataBtn) {
                                viewDataBtn.addEventListener('click', function () {
                                    // Update filters to show this area
                                    if (areaInfo.stateAbbr) {
                                        selectedState = areaInfo.stateAbbr;
                                        document.getElementById('state').value = areaInfo.stateAbbr;

                                        // Update city and county dropdowns
                                        updateCityAndCountyOptions();

                                        if (areaInfo.cityName) {
                                            selectedCity = areaInfo.cityName;
                                            document.getElementById('city').value = areaInfo.cityName;

                                            // Update county options
                                            updateCountyOptions();
                                        }

                                        if (areaInfo.countyName) {
                                            selectedCounty = areaInfo.countyName;
                                            document.getElementById('county').value = areaInfo.countyName;
                                        }

                                        // Update filtered data and map
                                        updateFilteredData();
                                        updateMap();
                                        updateTable();

                                        // Close the zip lookup modal using the shared closeModal function
                                        const zipLookupModal = document.getElementById('zip-lookup-modal');
                                        closeModalFunction(zipLookupModal);
                                    }
                                });
                            }
                        }, 100);
                    } else {
                        resultDiv.innerHTML += `
                            <strong>Wage Data Available:</strong> No
                        `;
                    }
                } else {
                    resultDiv.innerHTML = `
                        <strong>Location:</strong> ${city}, ${stateAbbr} (${state})<br>
                        <strong>Area:</strong> Not found in CBSA boundaries<br>
                        <strong>Note:</strong> This location may be outside defined metropolitan areas.
                    `;
                }
            })
            .catch(error => {
                console.error('Error looking up zip code:', error);
                resultDiv.innerHTML = `Error: ${error.message || 'Failed to lookup zip code'}`;
            });
    }

    // Function to find which CBSA area contains the given coordinates
    function findAreaForCoordinates(latitude, longitude) {
        // Create a Leaflet point with the coordinates
        const point = L.latLng(latitude, longitude);

        // Check if countyData is loaded
        if (!countyData || !countyData.features) {
            return null;
        }

        // Loop through all CBSA areas to find which one contains the point
        for (const feature of countyData.features) {
            // Create a Leaflet polygon from the feature's coordinates
            try {
                const polygons = [];

                // Handle different geometry types
                if (feature.geometry.type === 'Polygon') {
                    // Single polygon
                    const coords = feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
                    polygons.push(L.polygon(coords));
                } else if (feature.geometry.type === 'MultiPolygon') {
                    // Multiple polygons
                    feature.geometry.coordinates.forEach(poly => {
                        const coords = poly[0].map(coord => [coord[1], coord[0]]);
                        polygons.push(L.polygon(coords));
                    });
                }

                // Check if any of the polygons contain the point
                for (const polygon of polygons) {
                    if (polygon.getBounds().contains(point)) {
                        // Check if the point is actually inside the polygon
                        if (isPointInPolygon(point, polygon)) {
                            // Return area information
                            return {
                                areaName: feature.properties.AreaName,
                                countyName: feature.properties.CountyTownName,
                                stateAbbr: feature.properties.StateAb,
                                cityName: feature.properties.AreaName ? feature.properties.AreaName.split(',')[0].trim() : null,
                                hasWageData: feature.properties.hasData
                            };
                        }
                    }
                }
            } catch (e) {
                console.error('Error processing feature:', e);
                continue;
            }
        }

        return null;
    }

    // Helper function to check if a point is inside a polygon
    function isPointInPolygon(point, polygon) {
        // Use Leaflet's built-in contains method if available
        if (polygon.contains && typeof polygon.contains === 'function') {
            return polygon.contains(point);
        }

        // Fallback to manual check
        const bounds = polygon.getBounds();
        if (!bounds.contains(point)) {
            return false;
        }

        // Ray casting algorithm
        const x = point.lng, y = point.lat;
        const vs = polygon.getLatLngs()[0];

        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i].lng, yi = vs[i].lat;
            const xj = vs[j].lng, yj = vs[j].lat;

            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }
}

// Handle errors that might occur during initialization
window.addEventListener('error', function (e) {
    console.error('Application error:', e.error);

    // Check if the main-content element exists before trying to prepend to it
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        displayError('An error occurred while loading the application. Please check the console for details.');
    } else {
        console.error('Could not display error message: .main-content element not found');
    }
});

// Safe version of displayError that checks if the element exists
function displayError(message) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        mainContent.prepend(errorDiv);
    } else {
        console.error('Could not display error message: .main-content element not found');
    }
}

// Global modal functions
let openModalFunction;
let closeModalFunction;

// Set up the info button and modal functionality
function setupInfoModal() {
    const infoButton = document.getElementById('info-button');
    const zipLookupButton = document.getElementById('zip-lookup-button');
    const dataSourcesModal = document.getElementById('data-sources-modal');
    const zipLookupModal = document.getElementById('zip-lookup-modal');

    // Define modal functions globally
    openModalFunction = function (modal) {
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
        modal.style.display = 'block';

        // Add a slight delay before adding the animation class for better effect
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    };

    closeModalFunction = function (modal) {
        modal.classList.remove('active');

        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }, 300);
    };

    // Set up data sources modal
    setupModal(infoButton, dataSourcesModal);

    // Set up zip lookup modal
    setupModal(zipLookupButton, zipLookupModal);

    // Helper function to set up a modal
    function setupModal(button, modal) {
        const closeButton = modal.querySelector('.close-button');

        // Open modal with animation when button is clicked
        button.addEventListener('click', function () {
            openModalFunction(modal);
        });

        // Close modal with animation when close button is clicked
        closeButton.addEventListener('click', function () {
            closeModalFunction(modal);
        });

        // Close modal when clicking outside the modal content
        window.addEventListener('click', function (event) {
            if (event.target === modal) {
                closeModalFunction(modal);
            }
        });

        // Close modal when ESC key is pressed
        window.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && modal.style.display === 'block') {
                closeModalFunction(modal);
            }
        });
    }
}
