// Map handling functions

// Global map variables
let map;
let countyLayer; // Layer for county boundaries
let stateLayer;  // Layer for state boundaries
let info;
let legend;
let countyData; // Will store the GeoJSON data for counties
let stateData;  // Will store the GeoJSON data for states

// Initialize the map
function initMap() {
    // Create the map centered on the US with zoom restrictions
    map = L.map('map', {
        center: [37.8, -96],
        zoom: 4,
        minZoom: 4, // Prevent zooming out beyond US view
        maxZoom: 19
    });

    // Add the base tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    // Add reset control
    addResetControl();

    // Load US states GeoJSON data
    loadStatesGeoJSON();

    // Add info control
    addInfoControl();

    // Add legend control
    addLegendControl();
}

// Add reset control to the map
function addResetControl() {
    // Create a custom control
    const ResetControl = L.Control.extend({
        options: {
            position: 'topleft'
        },

        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            const button = L.DomUtil.create('a', 'reset-button', container);

            button.innerHTML = '&#8634;'; // Refresh icon
            button.title = 'Reset Map View';
            button.href = '#';
            button.style.fontSize = '18px';
            button.style.fontWeight = 'bold';
            button.style.textDecoration = 'none';
            button.style.textAlign = 'center';
            button.style.lineHeight = '30px';
            button.style.width = '30px';
            button.style.height = '30px';
            button.style.display = 'block';
            container.style.border = 'None';

            L.DomEvent.on(button, 'click', function (e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                resetMapView();
            });

            return container;
        }
    });

    // Add the control to the map
    map.addControl(new ResetControl());
}

// Reset the map view to show the entire US
function resetMapView() {
    // Reset the map view
    map.flyTo([37.8, -96], 4, {
        duration: 1.5
    });

    // Reset filters if needed
    if (selectedState !== 'All' || selectedCity !== 'All' || selectedCounty !== 'All' || minWageFilter > 0 || maxWageFilter > 0) {
        // Reset state filter
        selectedState = 'All';
        document.getElementById('state').value = 'All';

        // Reset city and county dropdowns
        updateCityAndCountyOptions();

        // Reset wage filters
        minWageFilter = 0;
        maxWageFilter = 0;
        document.getElementById('min-wage').value = '';
        document.getElementById('max-wage').value = '';

        // Update filtered data
        updateFilteredData();

        // Update the map
        updateMap();

        // Update the table
        updateTable();
    }
}

// Load both state and county GeoJSON data
async function loadStatesGeoJSON() {
    try {
        // Load state boundaries
        const stateResponse = await fetch('/gz_2010_us_040_00_5m.json');
        stateData = await stateResponse.json();

        // Load county boundaries
        const countyResponse = await fetch('/cbsa_boundaries_raw.geojson');
        countyData = await countyResponse.json();

        // Match CBSA areas with wage data
        matchCBSAWithWageData();

        // Update the map with the data
        updateMap();
    } catch (error) {
        console.error('Error loading GeoJSON:', error);
        displayError('Failed to load map data. Please try again later.');
    }
}

// Match CBSA areas with wage data
function matchCBSAWithWageData() {
    // For each CBSA area in the GeoJSON, find matching wage data
    if (countyData && countyData.features) {
        countyData.features.forEach(feature => {
            // Get the GEOID (CBSA code)
            const geoid = feature.properties.GEOID;

            if (geoid) {
                // Find all wage data for this CBSA area and selected job title
                const areaWageData = wageData.filter(row =>
                    row.Area === parseInt(geoid) && row.Title === selectedTitle
                );

                // If we have wage data for this area, add it to the feature properties
                if (areaWageData.length > 0) {
                    // Just use the first matching record for this example
                    // In a more complex implementation, you might want to aggregate multiple records
                    const wageRecord = areaWageData[0];

                    feature.properties.Level1 = wageRecord.Level1;
                    feature.properties.Level2 = wageRecord.Level2;
                    feature.properties.Level3 = wageRecord.Level3;
                    feature.properties.Level4 = wageRecord.Level4;
                    feature.properties.Average = wageRecord.Average;

                    feature.properties.Level1_Annual = wageRecord.Level1_Annual;
                    feature.properties.Level2_Annual = wageRecord.Level2_Annual;
                    feature.properties.Level3_Annual = wageRecord.Level3_Annual;
                    feature.properties.Level4_Annual = wageRecord.Level4_Annual;
                    feature.properties.Average_Annual = wageRecord.Average_Annual;

                    feature.properties.StateAb = wageRecord.StateAb;
                    feature.properties.AreaName = wageRecord.AreaName;
                    feature.properties.CountyTownName = wageRecord.CountyTownName;
                    feature.properties.hasData = true;
                    feature.properties.isCounty = true; // Mark as county for styling
                } else {
                    // No data for this area
                    feature.properties.Level1 = null;
                    feature.properties.Level2 = null;
                    feature.properties.Level3 = null;
                    feature.properties.Level4 = null;
                    feature.properties.Average = null;
                    feature.properties.hasData = false;
                    feature.properties.isCounty = true; // Mark as county for styling
                }
            }
        });
    }

    // Add state information to state boundaries
    if (stateData && stateData.features) {
        stateData.features.forEach(feature => {
            // Get the state name and abbreviation
            const stateName = feature.properties.NAME;

            // Find the state abbreviation from the wage data
            const stateRecord = wageData.find(row => {
                const stateParts = row.State ? row.State.split(' ') : [];
                return stateParts.join(' ').toLowerCase() === stateName.toLowerCase();
            });

            if (stateRecord) {
                feature.properties.StateAb = stateRecord.StateAb;
            }

            // Mark as state for styling
            feature.properties.isState = true;
        });
    }
}

// Calculate average value for a property
function calculateAverage(data, property) {
    const values = data.map(item => item[property]).filter(val => val !== null && val !== undefined);
    if (values.length === 0) return null;

    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
}

// Update the map with current data
function updateMap() {
    // Remove existing layers if they exist
    if (countyLayer) {
        map.removeLayer(countyLayer);
    }
    if (stateLayer) {
        map.removeLayer(stateLayer);
    }

    // Match CBSA areas with wage data
    matchCBSAWithWageData();

    // Add state layer first (underneath) - not interactive
    if (stateData) {
        stateLayer = L.geoJson(stateData, {
            style: styleStateFeature,
            interactive: false // State layer is not interactive
        }).addTo(map);
    }

    // Add county layer on top - interactive
    if (countyData) {
        countyLayer = L.geoJson(countyData, {
            style: styleCountyFeature,
            onEachFeature: onEachFeature,
            interactive: true // County layer is interactive
        }).addTo(map);
    }

    // Update the legend
    updateLegend();

    // Zoom to the selected area
    zoomToSelectedArea();
}

// Style function for county features
function styleCountyFeature(feature) {
    // Check if this feature is selected based on current filters
    const isSelected = isFeatureSelected(feature);

    return {
        fillColor: getColor(feature.properties[selectedLevel]),
        weight: isSelected ? 4 : 1, // Thinner for county boundaries
        opacity: 1,
        color: isSelected ? '#ff7800' : '#4ad66d', // Light green for county boundaries
        dashArray: isSelected ? '' : '3',
        fillOpacity: 0.7 // Consistent fill opacity for all areas
    };
}

// Style function for state features
function styleStateFeature(feature) {
    // Check if this feature is selected based on current filters
    const isSelected = isFeatureSelected(feature);

    return {
        fillColor: 'transparent', // Transparent fill for state boundaries
        weight: isSelected ? 4 : 3, // Thicker for state boundaries
        opacity: 1,
        color: isSelected ? '#ff7800' : '#208b3a', // Dark green for state boundaries
        dashArray: isSelected ? '' : '',
        fillOpacity: 0 // No fill for state boundaries
    };
}

// Zoom to the selected area based on filters
function zoomToSelectedArea() {
    // Only zoom if a specific state, city, county, or wage filter is selected
    if (selectedState === 'All' && selectedCity === 'All' && selectedCounty === 'All' && minWageFilter <= 0 && maxWageFilter <= 0) {
        // If all filters are set to 'All' and no wage filters, maintain the current view or reset to US view
        return;
    }

    // Create a filtered GeoJSON layer with only the selected features
    const selectedFeatures = countyData.features.filter(feature => isFeatureSelected(feature));

    if (selectedFeatures.length > 0) {
        // Create a temporary GeoJSON layer with the selected features
        const selectedLayer = L.geoJson({
            type: 'FeatureCollection',
            features: selectedFeatures
        });

        // Zoom to the bounds of the selected features with a smooth animation
        map.flyToBounds(selectedLayer.getBounds(), {
            padding: [50, 50],
            duration: 1.5 // Animation duration in seconds
        });
    } else if (selectedState !== 'All') {
        // If a state is selected but no counties match, zoom to the state
        const selectedStateFeatures = stateData.features.filter(feature =>
            feature.properties.NAME &&
            feature.properties.StateAb === selectedState
        );

        if (selectedStateFeatures.length > 0) {
            const stateLayer = L.geoJson({
                type: 'FeatureCollection',
                features: selectedStateFeatures
            });

            map.flyToBounds(stateLayer.getBounds(), {
                padding: [50, 50],
                duration: 1.5
            });
        } else {
            // If no state features match, zoom out to show the entire US
            map.flyTo([37.8, -96], 4, {
                duration: 1.5
            });
        }
    } else {
        // If no features are selected, zoom out to show the entire US
        map.flyTo([37.8, -96], 4, {
            duration: 1.5
        });
    }
}

// Style function for GeoJSON features
function styleFeature(feature) {
    // Check if this feature is in the filtered data (matches all current filters)
    const isSelected = isFeatureSelected(feature);

    // Style all boundaries with state boundary style for visibility
    return {
        fillColor: getColor(feature.properties[selectedLevel]),
        weight: isSelected ? 4 : 3, // Thicker for all boundaries
        opacity: 1,
        color: isSelected ? '#ff7800' : '#208b3a', // Dark green for all boundaries
        dashArray: isSelected ? '' : '',
        fillOpacity: 0.7 // Consistent fill opacity for all areas
    };
}

// Check if a feature is selected based on current filters
function isFeatureSelected(feature) {
    // For state features, check if the state is selected
    if (feature.properties.isState) {
        return selectedState !== 'All' && feature.properties.StateAb === selectedState;
    }

    // For county features
    if (feature.properties.isCounty) {
        // If all filters are set to 'All' and no minimum wage filter, no features should be selected
        if (selectedState === 'All' && selectedCity === 'All' && selectedCounty === 'All' && minWageFilter <= 0) {
            return false;
        }

        // Check if the feature matches the current filters
        let matches = true;

        // Check state filter
        if (selectedState !== 'All' && feature.properties.StateAb !== selectedState) {
            matches = false;
        }

        // Check city filter
        if (selectedCity !== 'All') {
            const featureCity = feature.properties.AreaName && feature.properties.AreaName.includes(',')
                ? feature.properties.AreaName.split(',')[0].trim()
                : null;

            if (featureCity !== selectedCity) {
                matches = false;
            }
        }

        // Check county filter
        if (selectedCounty !== 'All' && feature.properties.CountyTownName) {
            // Split the CountyTownName by commas and check if it includes the selected county
            const countyNames = feature.properties.CountyTownName.split(',').map(county => county.trim());
            if (!countyNames.includes(selectedCounty)) {
                matches = false;
            }
        }

        // Get the appropriate wage field based on the selected level
        const wageField = selectedLevel.includes('Annual') ? selectedLevel : selectedLevel + '_Annual';

        // Check minimum wage filter
        if (minWageFilter > 0) {
            // Check if the wage is below the minimum
            if (!feature.properties.hasData || feature.properties[wageField] < minWageFilter) {
                matches = false;
            }
        }

        // Check maximum wage filter
        if (maxWageFilter > 0) {
            // Check if the wage is above the maximum
            if (!feature.properties.hasData || feature.properties[wageField] > maxWageFilter) {
                matches = false;
            }
        }

        return matches;
    }

    // If it's neither a state nor a county feature, it can't be selected
    return false;
}

// Get color based on wage value
function getColor(wage) {
    // Return a light gray for states with no data
    if (wage === null || wage === undefined) {
        return '#cccccc';
    }

    // Color scale from light to dark blue
    return wage > 100 ? '#084594' :
        wage > 80 ? '#2171b5' :
            wage > 60 ? '#4292c6' :
                wage > 40 ? '#6baed6' :
                    wage > 20 ? '#9ecae1' :
                        '#deebf7';
}

// Add interaction to each feature
function onEachFeature(feature, layer) {
    // Add event listeners to both state and county features
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });

    // For debugging
    console.log("Added event listeners to feature:", feature.properties.isState ? "State" : "County");
}

// Highlight a feature on mouseover
function highlightFeature(e) {
    const layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

// Reset highlight on mouseout
function resetHighlight(e) {
    // Apply the appropriate style based on whether the feature is selected
    const feature = e.target.feature;
    const isSelected = isFeatureSelected(feature);

    // Check if this is a state or county feature
    const isState = feature.properties.isState;

    if (isState) {
        // Apply state styling
        e.target.setStyle(styleStateFeature(feature));
    } else {
        // Apply county styling
        e.target.setStyle(styleCountyFeature(feature));
    }

    info.update();
}

// Zoom to feature on click and update filters
function zoomToFeature(e) {
    const feature = e.target.feature;

    // Zoom to the feature
    map.fitBounds(e.target.getBounds());

    // If this is a state feature, update the state filter
    if (feature.properties.isState && feature.properties.StateAb) {
        // Update the state filter
        selectedState = feature.properties.StateAb;

        // Update the state dropdown
        const stateSelect = document.getElementById('state');
        if (stateSelect) {
            stateSelect.value = selectedState;
        }

        // Update city and county dropdowns based on selected state
        updateCityAndCountyOptions();

        // Update filtered data
        updateFilteredData();

        // Update the map
        updateMap();

        // Update the table
        updateTable();
    }
    // If this is a county feature, update the county filter
    else if (feature.properties.isCounty) {
        // If the state is not already selected, select it first
        if (selectedState !== feature.properties.StateAb) {
            selectedState = feature.properties.StateAb;

            // Update the state dropdown
            const stateSelect = document.getElementById('state');
            if (stateSelect) {
                stateSelect.value = selectedState;
            }

            // Update city and county dropdowns based on selected state
            updateCityAndCountyOptions();
        }

        // If the feature has a city name, update the city filter
        if (feature.properties.AreaName && feature.properties.AreaName.includes(',')) {
            const cityName = feature.properties.AreaName.split(',')[0].trim();
            selectedCity = cityName;

            // Update the city dropdown
            const citySelect = document.getElementById('city');
            if (citySelect) {
                citySelect.value = selectedCity;
            }

            // Update county options based on selected city
            updateCountyOptions();
        }

        // If the feature has a county name, update the county filter
        if (feature.properties.CountyTownName) {
            // For simplicity, just use the first county if there are multiple
            const countyName = feature.properties.CountyTownName.split(',')[0].trim();
            selectedCounty = countyName;

            // Update the county dropdown
            const countySelect = document.getElementById('county');
            if (countySelect) {
                countySelect.value = selectedCounty;
            }
        }

        // Update filtered data
        updateFilteredData();

        // Update the map
        updateMap();

        // Update the table
        updateTable();
    }
}

// Add info control to the map
function addInfoControl() {
    // Use topright position for better mobile layout
    info = L.control({ position: 'topright' });

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };

    info.update = function (props) {
        if (!props) {
            this._div.innerHTML = `
                <h4>OFLC Prevailing Wage</h4>
                <div class="info-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <p>Hover over an area</p>
                </div>
            `;
            return;
        }

        const areaName = props.AreaName || props.NAME;
        const stateAb = props.StateAb ? ` (${props.StateAb})` : '';
        const countyInfo = props.CountyTownName ? `<div class="info-county">${props.CountyTownName}</div>` : '';

        if (!props.hasData) {
            this._div.innerHTML = `
                <h4>OFLC Prevailing Wage</h4>
                <div class="info-area-name">${areaName}${stateAb}</div>
                ${countyInfo}
                <div class="info-no-data">No data available</div>
            `;
            return;
        }

        this._div.innerHTML = `
            <h4>OFLC Prevailing Wage</h4>
            <div class="info-area-name">${areaName}${stateAb}</div>
            ${countyInfo}
            <div class="info-wages">
                <div class="wage-row">
                    <span class="wage-label">Level 1:</span>
                    <span class="wage-value">${formatCurrency(props.Level1_Annual)}</span>
                </div>
                <div class="wage-row">
                    <span class="wage-label">Level 2:</span>
                    <span class="wage-value">${formatCurrency(props.Level2_Annual)}</span>
                </div>
                <div class="wage-row">
                    <span class="wage-label">Level 3:</span>
                    <span class="wage-value">${formatCurrency(props.Level3_Annual)}</span>
                </div>
                <div class="wage-row">
                    <span class="wage-label">Level 4:</span>
                    <span class="wage-value">${formatCurrency(props.Level4_Annual)}</span>
                </div>
                <div class="wage-row average">
                    <span class="wage-label">Avg:</span>
                    <span class="wage-value">${formatCurrency(props.Average_Annual)}</span>
                </div>
            </div>
        `;
    };

    info.addTo(map);
}

// Add vertical gradient legend control to the map
function addLegendControl() {
    // Use topleft position, below zoom controls
    legend = L.control({ position: 'topleft' });

    legend.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'vertical-legend');
        this.update();
        return this._div;
    };

    legend.update = function () {
        const minGrade = 0;
        const midGrade = 50;
        const maxGrade = 100;
        const minAnnual = minGrade * ANNUAL_MULTIPLIER;
        const midAnnual = midGrade * ANNUAL_MULTIPLIER;
        const maxAnnual = maxGrade * ANNUAL_MULTIPLIER;

        let html = '<div class="vertical-gradient-bar"></div>';

        // Add min, mid, and max wage markers
        html += '<div class="wage-markers">';
        html += `<div class="wage-marker" style="bottom: 0%;">
                  <span class="wage-value">$${Math.round(minAnnual / 1000)}k</span>
                 </div>`;
        html += `<div class="wage-marker" style="bottom: 50%;">
                  <span class="wage-value">$${Math.round(midAnnual / 1000)}k</span>
                 </div>`;
        html += `<div class="wage-marker" style="bottom: 100%;">
                  <span class="wage-value">$${Math.round(maxAnnual / 1000)}k+</span>
                 </div>`;
        html += '</div>';

        // Add no-data indicator
        html += '<div class="no-data-indicator">';
        html += '<i style="background:#cccccc"></i>';
        html += '<span>No data</span>';
        html += '</div>';

        this._div.innerHTML = html;
    };

    legend.addTo(map);
}

// Update the legend based on current selection
function updateLegend() {
    if (legend) {
        legend.update();
    }
}
