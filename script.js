// --- START OF FILE script.js ---

document.addEventListener('DOMContentLoaded', function() {
    const appContainer = document.getElementById('appContainer');
    const searchInput = document.getElementById('searchInput');
    const sortOptions = document.getElementById('sortOptions');
    const suggestionsContainer = document.getElementById('suggestionsContainer');

    let allApps = [];
    let currentSortOrder = 'default';
    let suggestionFocusIndex = -1;

    // =======================================================================
    // ### شروع تغییر: اضافه کردن تابع parseCSV ###
    // =======================================================================
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(header => {
            let h = header.trim();
            // حذف کوتیشن‌های اضافی از هدرها
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
                
                if (char === '"') {
                    // بررسی دابل کوتیشن برای کوتیشن داخل رشته
                    if (i + 1 < line.length && line[i+1] === '"') {
                        currentValue += '"';
                        i++; // رد شدن از دابل کوتیشن
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
            values.push(currentValue.trim()); // اضافه کردن آخرین مقدار
            
            const row = {};
            headers.forEach((header, index) => {
                let val = values[index] || '';
                // حذف کوتیشن‌های اضافی از مقادیر، اگر لازم باشد (معمولا برای CSV لازم نیست مگر اینکه داده‌ها به این شکل باشند)
                // if (val.length >= 2 && val.startsWith('"') && val.endsWith('"')) {
                //     val = val.substring(1, val.length - 1);
                // }
                row[header] = val;
            });
            
            // اطمینان از اینکه ردیف دارای id و track_name است (مهم برای جلوگیری از خطا)
            return row;
        }).filter(row => row && row.id && row.track_name); // افزودن row && برای جلوگیری از خطای ردیف‌های خالی احتمالی
    }
    // =======================================================================
    // ### پایان تغییر: اضافه کردن تابع parseCSV ###
    // =======================================================================

    async function fetchData() {
        try {
            const response = await fetch('AppleStore.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            return parseCSV(csvText); // حالا parseCSV تعریف شده است
        } catch (error) {
            console.error('Error fetching or parsing CSV:', error);
            // نمایش پیام خطا به کاربر، شامل خطای اصلی از catch
            // و اطمینان از اینکه error.message وجود دارد
            let errorMessage = "Unknown error occurred.";
            if (error && error.message) {
                // اگر خطا از parseCSV باشد، ممکن است پیام بهتری بدهیم
                if (error.message.includes("not defined")) {
                     errorMessage = `A crucial function (${error.message.split(" ")[0]}) is missing or not loaded correctly.`;
                } else {
                    errorMessage = error.message;
                }
            }
            appContainer.innerHTML = `<div class="error">Failed to load data. Server response: ${errorMessage}. Please check file path and ensure server is running.</div>`;
            suggestionsContainer.style.display = 'none';
            return null;
        }
    }
    
    function renderApps(appsToDisplay, limit = 50) {
        if (!appsToDisplay) {
            appContainer.innerHTML = '<div class="error">Error: No app data to display.</div>';
            return;
        }
        if (appsToDisplay.length === 0) {
            appContainer.innerHTML = '<div class="no-results">No apps found matching your criteria.</div>';
            return;
        }
        
        appContainer.innerHTML = '';
        const appsToShowOnPage = appsToDisplay.slice(0, limit);
        
        appsToShowOnPage.forEach(app => {
            const appCardLink = document.createElement('a');
            appCardLink.href = `app-detail.html?id=${app.id}`;
            appCardLink.className = 'app-card-link';
            appCardLink.style.textDecoration = 'none';
            appCardLink.style.color = 'inherit';
        
            const appCard = document.createElement('div');
            appCard.className = 'app-card';
            
            const price = parseFloat(app.price) === 0 ? 'FREE' : `$${Number(app.price).toFixed(2)}`;
            const rating = parseFloat(app.user_rating) || 0;
            const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
            
            appCard.innerHTML = `
                <div class="app-header">
                    <h3 class="app-name" title="${app.track_name}">${app.track_name}</h3>
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
                        <span class="rating-count">(${parseInt(app.rating_count_tot || 0).toLocaleString()})</span>
                    </div>
                </div>
            `;
            
            appCardLink.appendChild(appCard);
            appContainer.appendChild(appCardLink);
        });
    }

    function sortApps(apps, sortOrder) {
        const sortedApps = [...apps];

        switch (sortOrder) {
            case 'name-asc':
                sortedApps.sort((a, b) => (a.track_name || "").localeCompare(b.track_name || ""));
                break;
            case 'name-desc':
                sortedApps.sort((a, b) => (b.track_name || "").localeCompare(a.track_name || ""));
                break;
            case 'price-asc':
                sortedApps.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
                break;
            case 'price-desc':
                sortedApps.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
                break;
            case 'rating-asc':
                sortedApps.sort((a, b) => (parseFloat(a.user_rating) || 0) - (parseFloat(b.user_rating) || 0));
                break;
            case 'rating-desc':
                sortedApps.sort((a, b) => (parseFloat(b.user_rating) || 0) - (parseFloat(a.user_rating) || 0));
                break;
            case 'default':
            default:
                // برگرداندن آرایه اصلی اگر سورت پیش‌فرض است یا گزینه‌ای نامعتبر انتخاب شده
                return apps; // یا یک کپی از آن اگر نمی‌خواهید آرایه اصلی تغییر کند: return [...apps];
        }
        return sortedApps;
    }
    
    function displayProcessedApps() {
        if (!allApps || allApps.length === 0) {
            // اگر هنوز در حال بارگذاری اولیه هستیم، پیام "loading" را تغییر نده
            if (appContainer.innerHTML.includes('loading')) {
                // کاری نکن، منتظر بمان تا داده‌ها بارگذاری شوند یا خطا رخ دهد
            } else if (!appContainer.innerHTML.includes('error')) { // اگر خطا هم نمایش داده نشده
                 appContainer.innerHTML = '<div class="no-results">No app data available.</div>';
            }
            suggestionsContainer.style.display = 'none';
            return;
        }

        const searchTerm = searchInput.value.toLowerCase().trim();
        let filteredApps = allApps;

        if (searchTerm) {
            filteredApps = allApps.filter(app => 
                (app.track_name || "").toLowerCase().includes(searchTerm) || 
                (app.prime_genre || "").toLowerCase().includes(searchTerm)
            );
        }
        
        const sortedAndFilteredApps = sortApps(filteredApps, currentSortOrder);
        
        renderApps(sortedAndFilteredApps);
    }

    function showSuggestions(searchTerm) {
        if (!allApps || searchTerm.length < 1) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
            suggestionFocusIndex = -1;
            return;
        }

        const matchedApps = allApps.filter(app =>
            (app.track_name || "").toLowerCase().startsWith(searchTerm.toLowerCase())
        ).slice(0, 7);

        suggestionsContainer.innerHTML = '';
        if (matchedApps.length > 0) {
            matchedApps.forEach(app => {
                const item = document.createElement('div');
                item.classList.add('suggestion-item');
                const appName = app.track_name || "";
                const matchIndex = appName.toLowerCase().indexOf(searchTerm.toLowerCase());
                if (matchIndex > -1) {
                    item.innerHTML = `<strong>${appName.substring(0, searchTerm.length)}</strong>${appName.substring(searchTerm.length)}`;
                } else {
                    item.textContent = appName;
                }
                
                item.addEventListener('click', function() {
                    searchInput.value = app.track_name;
                    suggestionsContainer.style.display = 'none';
                    suggestionFocusIndex = -1;
                    displayProcessedApps();
                });
                suggestionsContainer.appendChild(item);
            });
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
        suggestionFocusIndex = -1;
    }

    document.addEventListener('click', function(event) {
        if (!searchInput.contains(event.target) && !suggestionsContainer.contains(event.target)) {
            suggestionsContainer.style.display = 'none';
            suggestionFocusIndex = -1;
        }
    });

    sortOptions.addEventListener('change', function() {
        currentSortOrder = this.value;
        suggestionsContainer.style.display = 'none';
        displayProcessedApps();
    });

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        if (searchTerm === "") {
            suggestionsContainer.style.display = 'none';
            suggestionFocusIndex = -1;
            displayProcessedApps();
        } else {
            showSuggestions(searchTerm);
            displayProcessedApps();
        }
    });
    
    searchInput.addEventListener('keydown', function(e) {
        const items = suggestionsContainer.querySelectorAll('.suggestion-item');
        if (suggestionsContainer.style.display === 'block' && items.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                suggestionFocusIndex++;
                if (suggestionFocusIndex >= items.length) suggestionFocusIndex = 0;
                updateSuggestionFocus(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                suggestionFocusIndex--;
                if (suggestionFocusIndex < 0) suggestionFocusIndex = items.length - 1;
                updateSuggestionFocus(items);
            } else if (e.key === 'Enter') {
                if (suggestionFocusIndex > -1 && items[suggestionFocusIndex]) {
                    e.preventDefault();
                    items[suggestionFocusIndex].click();
                } else {
                    suggestionsContainer.style.display = 'none';
                    suggestionFocusIndex = -1;
                    displayProcessedApps();
                }
            } else if (e.key === 'Escape') {
                suggestionsContainer.style.display = 'none';
                suggestionFocusIndex = -1;
            }
        } else if (e.key === 'Enter') {
             e.preventDefault();
             displayProcessedApps();
        }
    });

    function updateSuggestionFocus(items) {
        items.forEach(item => item.classList.remove('active'));
        if (items[suggestionFocusIndex]) {
            items[suggestionFocusIndex].classList.add('active');
            items[suggestionFocusIndex].scrollIntoView({ block: 'nearest' });
        }
    }
    
    (async function init() {
        appContainer.innerHTML = '<div class="loading">Loading apps...</div>'; // افزودن سه نقطه به پیام بارگذاری
        const fetchedApps = await fetchData();
        if (fetchedApps) {
            allApps = fetchedApps;
            displayProcessedApps(); 
        }
        // اگر fetchedApps null باشد، خطا قبلا در fetchData مدیریت شده و پیام به کاربر نمایش داده شده است.
    })();
});
// --- END OF FILE script.js ---