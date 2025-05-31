document.addEventListener('DOMContentLoaded', function() {
    const appDetailContainer = document.getElementById('appDetailContainer');
    const appDetailHeaderTitle = document.getElementById('appDetailHeaderTitle');

    function formatBytes(bytes, decimals = 2) {
        if (!bytes || bytes === "0") return 'N/A'; // Handle cases where bytes might be undefined or "0" string
        const parsedBytes = parseInt(bytes);
        if (isNaN(parsedBytes) || parsedBytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(parsedBytes) / Math.log(k));
        return parseFloat((parsedBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    async function fetchData() {
        try {
            const response = await fetch('AppleStore.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            return parseCSV(csvText);
        } catch (error) {
            console.error('Error fetching or parsing CSV:', error);
            appDetailContainer.innerHTML = `<div class="error">Failed to load app data. ${error.message}</div>`;
            return null;
        }
    }
    
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(header => {
            let h = header.trim();
            if (h.length >= 2 && h.startsWith('"') && h.endsWith('"')) {
                h = h.substring(1, h.length - 1);
            }
            return h;
        });
        
        return lines.slice(1).map(line => {
            const values = [];
            let inQuotes = false;
            let currentValue = '';
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"' && (i === 0 || line[i-1] !== '"')) { // Check for actual quote, not escaped one
                    if (i + 1 < line.length && line[i+1] === '"') { // Escaped quote ""
                        currentValue += '"';
                        i++; 
                        continue;
                    }
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim());
            
            const row = {};
            headers.forEach((header, index) => {
                let val = values[index] || '';
                // No need to strip quotes from values here unless they are consistently problematic
                row[header] = val;
            });
            return row;
        }).filter(row => row && row.id && row.track_name);
    }

    // --- New function to find similar apps ---
    function findSimilarApps(currentApp, allAppsList, count = 4) {
        if (!currentApp || !currentApp.prime_genre || !allAppsList || allAppsList.length === 0) {
            return [];
        }

        const similarGenreApps = allAppsList.filter(app =>
            app.prime_genre === currentApp.prime_genre &&
            String(app.id) !== String(currentApp.id) // Ensure IDs are compared as strings
        );

        similarGenreApps.sort((a, b) => {
            const ratingDiff = (parseFloat(b.user_rating) || 0) - (parseFloat(a.user_rating) || 0);
            if (ratingDiff !== 0) {
                return ratingDiff;
            }
            return (parseInt(b.rating_count_tot) || 0) - (parseInt(a.rating_count_tot) || 0);
        });

        return similarGenreApps.slice(0, count);
    }

    function renderAppDetails(app, allAppsData) { // Pass allAppsData for finding similar apps
        if (!app) {
            appDetailContainer.innerHTML = '<div class="error">App not found or data is incomplete.</div>';
            appDetailHeaderTitle.textContent = "Error Displaying App";
            return;
        }

        appDetailHeaderTitle.textContent = app.track_name || "App Details";

        const price = parseFloat(app.price) === 0 ? 'FREE' : `$${Number(app.price).toFixed(2)}`;
        const rating = parseFloat(app.user_rating) || 0;
        const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
        const formattedSize = formatBytes(app.size_bytes);
        const description = (app.app_desc || 'No description available.').replace(/\\n/g, '<br>');
        const appInitial = app.track_name ? app.track_name.substring(0, 1).toUpperCase() : "?";

        // --- Generate HTML for Similar Apps ---
        let similarAppsHtml = '';
        const similarApps = findSimilarApps(app, allAppsData);

        if (similarApps.length > 0) {
            similarAppsHtml = `
                <div class="similar-apps-section">
                    <h3>You Might Also Like:</h3>
                    <div class="app-grid similar-apps-grid">
                        ${similarApps.map(simApp => {
                            const simPrice = parseFloat(simApp.price) === 0 ? 'FREE' : `$${Number(simApp.price).toFixed(2)}`;
                            const simRating = parseFloat(simApp.user_rating) || 0;
                            const simStars = '★'.repeat(Math.floor(simRating)) + '☆'.repeat(5 - Math.floor(simRating));
                            // Truncate long names for display in small cards
                            const displayName = simApp.track_name.length > 30 ? simApp.track_name.substring(0, 27) + '...' : simApp.track_name;
                            
                            return `
                                <a href="app-detail.html?id=${simApp.id}" class="app-card-link" style="text-decoration: none; color: inherit;">
                                    <div class="app-card"> <!-- Re-use app-card styling -->
                                        <div class="app-header">
                                            <h4 class="app-name" title="${simApp.track_name}">${displayName}</h4>
                                        </div>
                                        <div class="app-content">
                                            <div class="app-info">
                                                <span class="category">${simApp.prime_genre}</span>
                                                <span class="price">${simPrice}</span>
                                            </div>
                                            <div class="app-rating">
                                                <span class="stars">${simStars}</span>
                                                <span class="rating-value">${simRating.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        appDetailContainer.innerHTML = `
            <div class="app-detail-header">
                <div class="app-icon-placeholder">${appInitial}</div>
                <div class="app-title-section">
                    <h2>${app.track_name}</h2>
                    <span class="price" style="font-size: 1.2rem; color: var(--primary-dark); font-weight: bold;">${price}</span>
                </div>
            </div>

            <a href="#" class="download-button" onclick="alert('Actual download link would go here!'); return false;">Download App</a>
            
            <div class="rating-section">
                <h3>User Rating:</h3>
                <span class="stars" title="${rating.toFixed(1)} out of 5">${stars}</span>
                <span class="rating-value">${rating.toFixed(1)}</span>
                <span class="rating-count">(${parseInt(app.rating_count_tot || 0).toLocaleString()} ratings)</span>
            </div>

            <h3>Description:</h3>
            <p class="app-description">${description}</p>
            
            <h3>More Information:</h3>
            <div class="app-meta-grid">
                <div class="meta-item"><strong>Primary Genre:</strong> ${app.prime_genre || 'N/A'}</div>
                <div class="meta-item"><strong>Version:</strong> ${app.ver || 'N/A'}</div>
                <div class="meta-item"><strong>Size:</strong> ${formattedSize}</div>
                <div class="meta-item"><strong>Content Rating:</strong> ${app.cont_rating || 'N/A'}</div>
                <div class="meta-item"><strong>Supported Devices:</strong> ${app['sup_devices.num'] || 'N/A'}</div>
                <div class="meta-item"><strong>Languages:</strong> ${app['lang.num'] || 'N/A'}</div>
            </div>

            ${similarAppsHtml} <!-- Injecting the similar apps HTML here -->
        `;
    }

    async function init() {
        const urlParams = new URLSearchParams(window.location.search);
        const appId = urlParams.get('id');

        if (!appId) {
            appDetailContainer.innerHTML = '<div class="error">App ID not specified in URL.</div>';
            return;
        }
        
        appDetailContainer.innerHTML = '<div class="loading">Loading app details...</div>'; // Show loading message
        const allApps = await fetchData();

        if (allApps && allApps.length > 0) {
            const targetApp = allApps.find(app => String(app.id) === String(appId)); 
            if (targetApp) {
                renderAppDetails(targetApp, allApps); // Pass allApps to renderAppDetails
            } else {
                appDetailContainer.innerHTML = `<div class="error">App with ID ${appId} not found.</div>`;
                appDetailHeaderTitle.textContent = "App Not Found";
            }
        } else if (allApps === null) {
            // Error message already shown by fetchData
        } else {
             appDetailContainer.innerHTML = '<div class="error">No app data could be loaded or data is empty.</div>';
        }
    }

    init();
});