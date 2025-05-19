document.addEventListener('DOMContentLoaded', function() {
    const appContainer = document.getElementById('appContainer');
    const searchInput = document.getElementById('searchInput');
    const sortOptions = document.getElementById('sortOptions');
    const suggestionsContainer = document.getElementById('suggestionsContainer'); // المان جدید

    let allApps = [];
    let currentSortOrder = 'default';
    let suggestionFocusIndex = -1; // برای ناوبری با کیبورد در پیشنهادات

    async function fetchData() {
        // ... (کد fetchData بدون تغییر) ...
        try {
            const response = await fetch('AppleStore.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            return parseCSV(csvText);
        } catch (error) {
            console.error('Error fetching or parsing CSV:', error);
            appContainer.innerHTML = `<div class="error">Failed to load data. Server response: ${error.message}. Please check file path and ensure server is running.</div>`;
            suggestionsContainer.style.display = 'none'; // مخفی کردن پیشنهادات در صورت خطا
            return null;
        }
    }
    
    function parseCSV(text) {
        // ... (کد parseCSV بدون تغییر) ...
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
                
                if (char === '"' && (i === 0 || line[i-1] !== '"')) {
                    if (i + 1 < line.length && line[i+1] === '"') {
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
                if (val.length >= 2 && val.startsWith('"') && val.endsWith('"')) {
                    val = val.substring(1, val.length - 1);
                }
                row[header] = val;
            });
            
            return row;
        }).filter(row => row.id && row.track_name);
    }
    
    function renderApps(appsToDisplay, limit = 50) {
        // ... (کد renderApps بدون تغییر) ...
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
            
            appContainer.appendChild(appCard);
        });
    }

    function sortApps(apps, sortOrder) {
        // ... (کد sortApps بدون تغییر) ...
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
                return apps; 
        }
        return sortedApps;
    }
    
    function displayProcessedApps() {
        // ... (کد displayProcessedApps بدون تغییر، اما مطمئن شوید پیشنهادات را مخفی می‌کند) ...
        if (!allApps || allApps.length === 0) {
            if (appContainer.innerHTML.includes('loading')) {
            } else if (!appContainer.innerHTML.includes('error')) {
                 appContainer.innerHTML = '<div class="no-results">No app data available.</div>';
            }
            suggestionsContainer.style.display = 'none'; // مخفی کردن پیشنهادات
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
        // اگر جستجو فعال است و پیشنهادات نمایش داده می‌شوند، آنها را مخفی نمی‌کنیم مگر اینکه کاربر آیتمی را انتخاب کند.
    }

    // --- توابع جدید برای مدیریت پیشنهادات ---
    function showSuggestions(searchTerm) {
        if (!allApps || searchTerm.length < 1) { // حداقل 1 کاراکتر برای نمایش پیشنهاد
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
            suggestionFocusIndex = -1;
            return;
        }

        const matchedApps = allApps.filter(app =>
            (app.track_name || "").toLowerCase().startsWith(searchTerm.toLowerCase()) // فقط آنهایی که با عبارت شروع می‌شوند
        ).slice(0, 7); // محدود کردن تعداد پیشنهادات (مثلاً به ۷)

        suggestionsContainer.innerHTML = '';
        if (matchedApps.length > 0) {
            matchedApps.forEach(app => {
                const item = document.createElement('div');
                item.classList.add('suggestion-item');
                // برجسته کردن بخش تایپ شده
                const appName = app.track_name || "";
                const matchIndex = appName.toLowerCase().indexOf(searchTerm.toLowerCase());
                if (matchIndex > -1) { // باید همیشه 0 باشد چون از startsWith استفاده کردیم
                    item.innerHTML = `<strong>${appName.substring(0, searchTerm.length)}</strong>${appName.substring(searchTerm.length)}`;
                } else {
                    item.textContent = appName; // Fallback
                }
                
                item.addEventListener('click', function() {
                    searchInput.value = app.track_name; // پر کردن فیلد جستجو
                    suggestionsContainer.style.display = 'none'; // مخفی کردن پیشنهادات
                    suggestionFocusIndex = -1;
                    displayProcessedApps(); // نمایش نتایج جستجو
                });
                suggestionsContainer.appendChild(item);
            });
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
        suggestionFocusIndex = -1; // ریست کردن فوکوس با هر بار آپدیت پیشنهادات
    }

    // مخفی کردن پیشنهادات وقتی روی جای دیگری کلیک می‌شود
    document.addEventListener('click', function(event) {
        if (!searchInput.contains(event.target) && !suggestionsContainer.contains(event.target)) {
            suggestionsContainer.style.display = 'none';
            suggestionFocusIndex = -1;
        }
    });

    // Event listener برای تغییر نوع مرتب‌سازی
    sortOptions.addEventListener('change', function() {
        currentSortOrder = this.value;
        suggestionsContainer.style.display = 'none'; // مخفی کردن پیشنهادات هنگام تغییر سورت
        displayProcessedApps();
    });

    // Event listener برای جستجو و پیشنهادات
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        if (searchTerm === "") { // اگر فیلد جستجو خالی شد
            suggestionsContainer.style.display = 'none';
            suggestionFocusIndex = -1;
            displayProcessedApps(); // نمایش همه اپ‌ها (با سورت فعلی)
        } else {
            showSuggestions(searchTerm);
            // displayProcessedApps(); // دیگر نیازی به فراخوانی مستقیم این نیست، چون انتخاب پیشنهاد آن را فراخوانی می‌کند
                                   // یا اگر می‌خواهید نتایج همزمان با تایپ آپدیت شوند، این را فعال نگه دارید.
                                   // برای تجربه کاربری بهتر، شاید بهتر باشد فقط با enter یا انتخاب پیشنهاد، نتایج فیلتر شوند.
                                   // در حال حاضر، با هر تایپ هم نتایج گرید آپدیت می‌شوند و هم پیشنهادات.
            displayProcessedApps(); // این خط را نگه می‌داریم تا نتایج همزمان با تایپ آپدیت شوند.
        }
    });
    
    // ناوبری با کیبورد برای پیشنهادات
    searchInput.addEventListener('keydown', function(e) {
        const items = suggestionsContainer.querySelectorAll('.suggestion-item');
        if (suggestionsContainer.style.display === 'block' && items.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault(); // جلوگیری از حرکت کرسر در اینپوت
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
                    e.preventDefault(); // جلوگیری از submit فرم (اگر در فرم بود)
                    items[suggestionFocusIndex].click(); // شبیه‌سازی کلیک روی آیتم انتخاب شده
                } else {
                    // اگر آیتمی انتخاب نشده بود و Enter زده شد، فقط پیشنهادات را ببند
                    suggestionsContainer.style.display = 'none';
                    suggestionFocusIndex = -1;
                    displayProcessedApps(); // و نتایج فعلی را نمایش بده
                }
            } else if (e.key === 'Escape') {
                suggestionsContainer.style.display = 'none';
                suggestionFocusIndex = -1;
            }
        } else if (e.key === 'Enter') { // اگر پیشنهادات باز نبودند و Enter زده شد
             e.preventDefault();
             displayProcessedApps(); // فقط نتایج جستجو را آپدیت کن
        }
    });

    function updateSuggestionFocus(items) {
        items.forEach(item => item.classList.remove('active'));
        if (items[suggestionFocusIndex]) {
            items[suggestionFocusIndex].classList.add('active');
            // اسکرول به آیتم فعال در صورت نیاز
            items[suggestionFocusIndex].scrollIntoView({ block: 'nearest' });
        }
    }
    
    // تابع init برای شروع
    (async function init() {
        appContainer.innerHTML = '<div class="loading">Loading apps</div>';
        const fetchedApps = await fetchData();
        if (fetchedApps) {
            allApps = fetchedApps;
            displayProcessedApps(); 
        }
        // اگر fetchedApps null باشد، خطا قبلا مدیریت شده.
    })();
});