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

    // Set up sidebar toggle button
    setupSidebarToggle();

    // Set up minimum wage filter
    setupMinWageFilter();

    // Load the wage data
    loadData();
});

// Set up sidebar toggle functionality
function setupSidebarToggle() {
    const toggleButton = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');

    if (toggleButton && sidebar) {
        toggleButton.addEventListener('click', function () {
            sidebar.classList.toggle('hidden');

            // Update button position when sidebar is shown/hidden
            if (sidebar.classList.contains('hidden')) {
                toggleButton.style.left = '20px';
            } else {
                toggleButton.style.left = `${sidebar.offsetWidth + 20}px`;
            }
        });

        // Initialize button position
        if (sidebar.classList.contains('hidden')) {
            toggleButton.style.left = '20px';
        } else {
            toggleButton.style.left = `${sidebar.offsetWidth + 20}px`;
        }

        // Update button position on window resize
        window.addEventListener('resize', function () {
            if (!sidebar.classList.contains('hidden')) {
                toggleButton.style.left = `${sidebar.offsetWidth + 20}px`;
            }
        });
    }
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

// Set up the info button and modal functionality
function setupInfoModal() {
    const infoButton = document.getElementById('info-button');
    const modal = document.getElementById('data-sources-modal');
    const closeButton = modal.querySelector('.close-button');

    // Open modal with animation when info button is clicked
    infoButton.addEventListener('click', function () {
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
        modal.style.display = 'block';

        // Add a slight delay before adding the animation class for better effect
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    });

    // Close modal with animation when close button is clicked
    closeButton.addEventListener('click', closeModal);

    // Close modal when clicking outside the modal content
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Close modal when ESC key is pressed
    window.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });

    // Function to close modal with animation
    function closeModal() {
        modal.classList.remove('active');

        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }, 300);
    }
}
