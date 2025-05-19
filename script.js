document.addEventListener('DOMContentLoaded', function() {
    // Get reference to the container and search input
    const appContainer = document.getElementById('appContainer');
    const searchInput = document.getElementById('searchInput');
    
    // Function to fetch and parse CSV data
    async function fetchData() {
        try {
            const response = await fetch('AppleStore.csv');
            const csvText = await response.text();
            return parseCSV(csvText);
        } catch (error) {
            console.error('Error fetching or parsing CSV:', error);
            appContainer.innerHTML = '<div class="error">Failed to load data. Please refresh the page.</div>';
        }
    }
    
    // Function to parse CSV text
    function parseCSV(text) {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(header => {
            // Remove quotes if they exist
            return header.replace(/^"(.*)"$/, '$1');
        });
        
        return lines.slice(1).map(line => {
            // Handle commas within quotes properly
            const values = [];
            let inQuotes = false;
            let currentValue = '';
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue);
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue); // Push the last value
            
            // Create an object with header keys and row values
            const row = {};
            headers.forEach((header, index) => {
                // Remove quotes if they exist
                if (values[index]) {
                    row[header] = values[index].replace(/^"(.*)"$/, '$1');
                } else {
                    row[header] = '';
                }
            });
            
            return row;
        }).filter(row => row.id); // Filter out any empty rows
    }
    
    // Function to render apps
    function renderApps(apps, limit = 50) {
        if (!apps || apps.length === 0) {
            appContainer.innerHTML = '<div class="no-results">No apps found</div>';
            return;
        }
        
        appContainer.innerHTML = '';
        const appsToShow = apps.slice(0, limit);
        
        appsToShow.forEach(app => {
            // Create app card element
            const appCard = document.createElement('div');
            appCard.className = 'app-card';
            
            // Format price to display as free if 0
            const price = parseFloat(app.price) === 0 ? 'FREE' : `$${app.price}`;
            
            // Calculate rating stars
            const rating = parseFloat(app.user_rating) || 0;
            const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
            
            appCard.innerHTML = `
                <div class="app-header">
                    <h3 class="app-name">${app.track_name}</h3>
                </div>
                <div class="app-content">
                    <div class="app-info">
                        <span class="category">${app.prime_genre}</span>
                        <span class="price">${price}</span>
                    </div>
                    <div class="app-genre">${app.prime_genre}</div>
                    <div class="app-rating">
                        <span class="stars">${stars}</span>
                        <span class="rating-value">${rating.toFixed(1)}</span>
                        <span class="rating-count">(${app.rating_count_tot})</span>
                    </div>
                </div>
            `;
            
            appContainer.appendChild(appCard);
        });
    }
    
    // Function to handle search
    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        
        if (!allApps) return;
        
        const filteredApps = allApps.filter(app => 
            app.track_name.toLowerCase().includes(searchTerm) || 
            app.prime_genre.toLowerCase().includes(searchTerm)
        );
        
        renderApps(filteredApps);
    }
    
    // Add event listener for search input
    searchInput.addEventListener('input', handleSearch);
    
    // Store all apps globally for filtering
    let allApps = [];
    
    // Initialize app
    (async function init() {
        appContainer.innerHTML = '<div class="loading">Loading apps</div>';
        allApps = await fetchData();
        renderApps(allApps);
    })();
}); 