// Data handling functions

// Global data variables
let wageData = [];
let filteredData = [];
let uniqueTitles = [];
let uniqueStates = [];
let uniqueCities = [];
let uniqueCounties = [];
let selectedTitle = '';
let selectedLevel = 'Level1';
let selectedState = 'All';
let selectedCity = 'All';
let selectedCounty = 'All';
let minWageFilter = 0; // Minimum wage filter value
let maxWageFilter = 0; // Maximum wage filter value (0 means no maximum)

// Constants
const ANNUAL_MULTIPLIER = 2080; // 40 hours per week * 52 weeks

// Load the CSV data
async function loadData() {
    try {
        // Show loading overlay
        document.getElementById('map-loading-overlay').style.display = 'flex';

        const response = await fetch('data/OFLC_Wages_2024-25/official/ALC_with_geography_and_soc.csv');
        const csvText = await response.text();

        // Parse CSV using PapaParse
        Papa.parse(csvText, {
            header: true,
            dynamicTyping: true, // Automatically convert numbers
            complete: function (results) {
                processData(results.data);
            },
            error: function (error) {
                console.error('Error parsing CSV:', error);
                displayError('Failed to load wage data. Please try again later.');
                // Hide loading overlay on error
                document.getElementById('map-loading-overlay').style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Error fetching CSV:', error);
        displayError('Failed to load wage data. Please try again later.');
        // Hide loading overlay on error
        document.getElementById('map-loading-overlay').style.display = 'none';
    }
}

// Process the loaded data
function processData(data) {
    // Filter out rows with missing essential data
    wageData = data.filter(row =>
        row.Area && row.Title && row.Level1 && row.Level2 &&
        row.Level3 && row.Level4 && row.Average && row.StateAb
    );

    // Calculate annual wages
    wageData.forEach(row => {
        // Check if the Label column indicates that wages are already annual
        const isAlreadyAnnual = row.Label && row.Label.toLowerCase().includes('annual');

        if (isAlreadyAnnual) {
            // If wages are already annual, just copy the values
            row.Level1_Annual = row.Level1;
            row.Level2_Annual = row.Level2;
            row.Level3_Annual = row.Level3;
            row.Level4_Annual = row.Level4;
            row.Average_Annual = row.Average;
        } else {
            // Otherwise, apply the multiplier
            row.Level1_Annual = row.Level1 * ANNUAL_MULTIPLIER;
            row.Level2_Annual = row.Level2 * ANNUAL_MULTIPLIER;
            row.Level3_Annual = row.Level3 * ANNUAL_MULTIPLIER;
            row.Level4_Annual = row.Level4 * ANNUAL_MULTIPLIER;
            row.Average_Annual = row.Average * ANNUAL_MULTIPLIER;
        }
    });

    // Extract unique titles, states, cities, and counties for filters
    uniqueTitles = [...new Set(wageData.map(row => row.Title))].filter(Boolean).sort();
    uniqueStates = ['All', ...new Set(wageData.map(row => row.StateAb))].filter(Boolean).sort();

    // Extract city names from AreaName (e.g., "New York, NY" -> "New York")
    const cityNames = wageData.map(row => {
        if (row.AreaName && row.AreaName.includes(',')) {
            return row.AreaName.split(',')[0].trim();
        }
        return null;
    });
    uniqueCities = ['All', ...new Set(cityNames)].filter(Boolean).sort();

    // Extract individual county names from CountyTownName
    // The CountyTownName field may contain multiple counties separated by commas
    const allCountyNames = [];
    wageData.forEach(row => {
        if (row.CountyTownName) {
            // Split the CountyTownName by commas and extract individual county names
            const countyNames = row.CountyTownName.split(',').map(county => county.trim());
            allCountyNames.push(...countyNames);
        }
    });
    uniqueCounties = ['All', ...new Set(allCountyNames)].filter(Boolean).sort();

    // Populate filter dropdowns
    populateFilters();

    // Set initial selection
    if (uniqueTitles.length > 0) {
        selectedTitle = uniqueTitles[0];
        document.getElementById('job-title').value = selectedTitle;
    }

    // Update the filtered data
    updateFilteredData();

    // Initialize the map
    initMap();
}

// Populate filter dropdowns
function populateFilters() {
    // Set up job title autocomplete
    const jobTitleInput = document.getElementById('job-title');
    const jobTitleResults = document.getElementById('job-title-results');

    // Set up initial job title value if available
    if (uniqueTitles.length > 0) {
        selectedTitle = uniqueTitles[0];
        jobTitleInput.value = selectedTitle;
    }

    // Job title input event listener
    jobTitleInput.addEventListener('input', function () {
        const inputValue = this.value.toLowerCase();

        // Filter titles based on input
        const filteredTitles = uniqueTitles.filter(title =>
            title.toLowerCase().includes(inputValue)
        );

        // Display autocomplete results
        displayAutocompleteResults(jobTitleResults, filteredTitles, inputValue, (selected) => {
            selectedTitle = selected;
            jobTitleInput.value = selected;
            updateFilteredData();
            updateMap();
            updateTable();
        });
    });

    // Handle focus on job title input
    jobTitleInput.addEventListener('focus', function () {
        if (jobTitleResults.children.length > 0) {
            jobTitleResults.classList.add('active');
        }
    });

    // Handle blur on job title input
    jobTitleInput.addEventListener('blur', function () {
        // Delay hiding to allow for click on autocomplete item
        setTimeout(() => {
            jobTitleResults.classList.remove('active');
        }, 200);
    });

    // Populate states
    const stateSelect = document.getElementById('state');
    stateSelect.innerHTML = '';

    uniqueStates.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });

    // Populate cities
    const citySelect = document.getElementById('city');
    citySelect.innerHTML = '';

    uniqueCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });

    // Set up county autocomplete
    const countyInput = document.getElementById('county');
    const countyResults = document.getElementById('county-results');

    // Set initial county value
    countyInput.value = 'All';
    selectedCounty = 'All';

    // County input event listener
    countyInput.addEventListener('input', function () {
        const inputValue = this.value.toLowerCase();

        // Filter counties based on input
        const filteredCounties = uniqueCounties.filter(county =>
            county.toLowerCase().includes(inputValue)
        );

        // Display autocomplete results
        displayAutocompleteResults(countyResults, filteredCounties, inputValue, (selected) => {
            selectedCounty = selected;
            countyInput.value = selected;
            updateFilteredData();
            updateMap();
            updateTable();
        });
    });

    // Handle focus on county input
    countyInput.addEventListener('focus', function () {
        if (countyResults.children.length > 0) {
            countyResults.classList.add('active');
        } else {
            // Show all counties on focus if no results are displayed
            displayAutocompleteResults(countyResults, uniqueCounties.slice(0, 10), '', (selected) => {
                selectedCounty = selected;
                countyInput.value = selected;
                updateFilteredData();
                updateMap();
                updateTable();
            });
            countyResults.classList.add('active');
        }
    });

    // Handle blur on county input
    countyInput.addEventListener('blur', function () {
        // Delay hiding to allow for click on autocomplete item
        setTimeout(() => {
            countyResults.classList.remove('active');
        }, 200);
    });

    // Add event listeners for wage level and location filters

    document.getElementById('wage-level').addEventListener('change', function () {
        selectedLevel = this.value;
        updateMap(); // This will also call zoomToSelectedArea
        updateTable();
    });

    stateSelect.addEventListener('change', function () {
        selectedState = this.value;
        // Update city and county dropdowns based on selected state
        updateCityAndCountyOptions();
        updateFilteredData();
        updateMap(); // This will also call zoomToSelectedArea
        updateTable();
    });

    citySelect.addEventListener('change', function () {
        selectedCity = this.value;
        // Update county dropdown based on selected city
        updateCountyOptions();
        updateFilteredData();
        updateMap(); // This will also call zoomToSelectedArea
        updateTable();
    });

    // County input is now handled by the autocomplete event listeners
}

// Update city and county options based on selected state
// Make this function globally accessible for the reset button
window.updateCityAndCountyOptions = function () {
    const citySelect = document.getElementById('city');
    const countyInput = document.getElementById('county');
    const countyResults = document.getElementById('county-results');

    // Reset selections
    selectedCity = 'All';
    selectedCounty = 'All';
    countyInput.value = 'All';

    // Filter cities based on selected state
    if (selectedState === 'All') {
        // Show all cities
        citySelect.innerHTML = '';
        uniqueCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    } else {
        // Filter cities by state
        const stateCities = wageData
            .filter(row => row.StateAb === selectedState)
            .map(row => {
                if (row.AreaName && row.AreaName.includes(',')) {
                    return row.AreaName.split(',')[0].trim();
                }
                return null;
            });

        const uniqueStateCities = ['All', ...new Set(stateCities)].filter(Boolean).sort();

        citySelect.innerHTML = '';
        uniqueStateCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    }

    // Update county options
    updateCountyOptions();
}

// Display autocomplete results
function displayAutocompleteResults(resultsElement, items, inputValue, onSelectCallback) {
    // Clear previous results
    resultsElement.innerHTML = '';

    if (items.length === 0 || (items.length === 1 && items[0].toLowerCase() === inputValue.toLowerCase())) {
        resultsElement.classList.remove('active');
        return;
    }

    // Create and append result items
    items.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.className = 'autocomplete-item';
        resultItem.textContent = item;

        // Add click event to select this item
        resultItem.addEventListener('click', function () {
            onSelectCallback(item);
            resultsElement.classList.remove('active');
        });

        resultsElement.appendChild(resultItem);
    });

    // Show results
    resultsElement.classList.add('active');
}

// Update county options based on selected state and city
window.updateCountyOptions = function () {
    const countyInput = document.getElementById('county');
    const countyResults = document.getElementById('county-results');

    // Reset selection
    selectedCounty = 'All';
    countyInput.value = 'All';

    // Filter counties based on selected state and city
    let filteredCounties = [];

    if (selectedState === 'All' && selectedCity === 'All') {
        // If no state or city is selected, show all counties
        filteredCounties = uniqueCounties;
    } else {
        // Filter wage data based on state and city
        let filteredWageData = wageData;

        if (selectedState !== 'All') {
            filteredWageData = filteredWageData.filter(row => row.StateAb === selectedState);
        }

        if (selectedCity !== 'All') {
            filteredWageData = filteredWageData.filter(row => {
                if (row.AreaName && row.AreaName.includes(',')) {
                    const cityName = row.AreaName.split(',')[0].trim();
                    return cityName === selectedCity;
                }
                return false;
            });
        }

        // Extract unique county names from the filtered wage data
        const countyNames = [];
        filteredWageData.forEach(row => {
            if (row.CountyTownName) {
                // Split the CountyTownName by commas and extract individual county names
                const counties = row.CountyTownName.split(',').map(county => county.trim());
                countyNames.push(...counties);
            }
        });

        filteredCounties = ['All', ...new Set(countyNames)].filter(Boolean).sort();
    }

    // Clear previous results
    countyResults.innerHTML = '';

    // Create a sample of counties to show initially
    const sampleCounties = filteredCounties.slice(0, 5);

    // Display sample counties
    displayAutocompleteResults(countyResults, sampleCounties, '', (selected) => {
        selectedCounty = selected;
        countyInput.value = selected;
        updateFilteredData();
        updateMap();
        updateTable();
    });
}

// Update filtered data based on selections
window.updateFilteredData = function () {
    filteredData = wageData.filter(row => row.Title === selectedTitle);

    if (selectedState !== 'All') {
        filteredData = filteredData.filter(row => row.StateAb === selectedState);
    }

    if (selectedCity !== 'All') {
        filteredData = filteredData.filter(row => {
            if (row.AreaName && row.AreaName.includes(',')) {
                const cityName = row.AreaName.split(',')[0].trim();
                return cityName === selectedCity;
            }
            return false;
        });
    }

    if (selectedCounty !== 'All') {
        filteredData = filteredData.filter(row => {
            if (row.CountyTownName) {
                // Check if the CountyTownName contains the selected county
                const countyNames = row.CountyTownName.split(',').map(county => county.trim());
                return countyNames.includes(selectedCounty);
            }
            return false;
        });
    }

    // Get the appropriate wage field based on the selected level
    const wageField = selectedLevel.includes('Annual') ? selectedLevel : selectedLevel + '_Annual';

    // Apply minimum wage filter if set
    if (minWageFilter > 0) {
        // Filter out areas with wages below the minimum
        filteredData = filteredData.filter(row => {
            return row[wageField] >= minWageFilter;
        });
    }

    // Apply maximum wage filter if set
    if (maxWageFilter > 0) {
        // Filter out areas with wages above the maximum
        filteredData = filteredData.filter(row => {
            return row[wageField] <= maxWageFilter;
        });
    }

    // Update the subtitle with all selected filters
    let subtitle = `${selectedTitle} | ${selectedLevel}`;
    if (selectedState !== 'All') subtitle += ` | ${selectedState}`;
    if (selectedCity !== 'All') subtitle += ` | ${selectedCity}`;
    if (selectedCounty !== 'All') subtitle += ` | ${selectedCounty}`;
    if (minWageFilter > 0) subtitle += ` | Min: ${formatCurrency(minWageFilter)}`;
    if (maxWageFilter > 0) subtitle += ` | Max: ${formatCurrency(maxWageFilter)}`;

    document.getElementById('map-subtitle').textContent = subtitle;

    // Update the table
    updateTable();
}

// Display error message is now defined in main.js

// Update the data table
window.updateTable = function () {
    const tableBody = document.querySelector('#wage-table tbody');
    tableBody.innerHTML = '';

    // Sort data by selected level (descending)
    const sortedData = [...filteredData].sort((a, b) => b[selectedLevel] - a[selectedLevel]);

    sortedData.forEach(row => {
        const tr = document.createElement('tr');

        // Create cells
        const areaCell = document.createElement('td');
        areaCell.textContent = row.AreaName || `Area ${row.Area}`;

        const stateCell = document.createElement('td');
        stateCell.textContent = row.StateAb;

        const level1Cell = document.createElement('td');
        level1Cell.textContent = formatCurrency(row.Level1_Annual);

        const level2Cell = document.createElement('td');
        level2Cell.textContent = formatCurrency(row.Level2_Annual);

        const level3Cell = document.createElement('td');
        level3Cell.textContent = formatCurrency(row.Level3_Annual);

        const level4Cell = document.createElement('td');
        level4Cell.textContent = formatCurrency(row.Level4_Annual);

        const avgCell = document.createElement('td');
        avgCell.textContent = formatCurrency(row.Average_Annual);

        // Highlight the selected level
        const cells = [level1Cell, level2Cell, level3Cell, level4Cell, avgCell];
        const levelIndex = ['Level1', 'Level2', 'Level3', 'Level4', 'Average'].indexOf(selectedLevel);

        if (levelIndex >= 0) {
            cells[levelIndex].classList.add('highlighted');
        }

        // Append cells to row
        tr.appendChild(areaCell);
        tr.appendChild(stateCell);
        tr.appendChild(level1Cell);
        tr.appendChild(level2Cell);
        tr.appendChild(level3Cell);
        tr.appendChild(level4Cell);
        tr.appendChild(avgCell);

        // Append row to table
        tableBody.appendChild(tr);
    });
}

// Format currency
function formatCurrency(value) {
    if (value === undefined || value === null) return 'N/A';
    return '$' + value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Toggle data table visibility function
function setupTableToggle() {
    const toggleButton = document.getElementById('toggle-table');
    if (toggleButton) {
        toggleButton.addEventListener('click', function () {
            const dataTable = document.getElementById('data-table');
            if (dataTable) {
                const isHidden = dataTable.classList.contains('hidden');

                if (isHidden) {
                    dataTable.classList.remove('hidden');
                    this.textContent = 'Hide Data Table';
                } else {
                    dataTable.classList.add('hidden');
                    this.textContent = 'Show Data Table';
                }
            }
        });
    }
}
