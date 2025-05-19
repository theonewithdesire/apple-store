document.addEventListener('DOMContentLoaded', function() {
    const appContainer = document.getElementById('appContainer');
    const searchInput = document.getElementById('searchInput');
    const sortOptions = document.getElementById('sortOptions'); // المان جدید
    
    let allApps = [];
    let currentSortOrder = 'default'; // برای نگهداری ترتیب مرتب‌سازی فعلی

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
            appContainer.innerHTML = `<div class="error">Failed to load data. Server response: ${error.message}. Please check file path and ensure server is running.</div>`;
            return null; // برگرداندن null در صورت خطا
        }
    }
    
    function parseCSV(text) {
        const lines = text.trim().split('\n'); // trim برای حذف خطوط خالی احتمالی در ابتدا یا انتها
        const headers = lines[0].split(',').map(header => {
            let h = header.trim();
            // حذف دابل کوتیشن‌ها فقط اگر در ابتدا و انتهای رشته باشند
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
                
                if (char === '"' && (i === 0 || line[i-1] !== '"')) { // مدیریت دابل کوتیشن‌های escape شده (اگرچه در CSV شما نیست)
                    // اگر " بعدی هم " بود، یعنی یک دابل کوتیشن واقعی در متن است
                    if (i + 1 < line.length && line[i+1] === '"') {
                        currentValue += '"';
                        i++; // پرش از دابل کوتیشن بعدی
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
                let val = values[index] || ''; // مقدار پیشفرض اگر وجود نداشت
                 // حذف دابل کوتیشن‌ها فقط اگر در ابتدا و انتهای رشته باشند
                if (val.length >= 2 && val.startsWith('"') && val.endsWith('"')) {
                    val = val.substring(1, val.length - 1);
                }
                row[header] = val;
            });
            
            return row;
        }).filter(row => row.id && row.track_name); // اطمینان از وجود id و track_name
    }
    
    function renderApps(appsToDisplay, limit = 50) { // نام پارامتر به appsToDisplay تغییر کرد
        if (!appsToDisplay) { // بررسی برای null یا undefined
            appContainer.innerHTML = '<div class="error">Error: No app data to display.</div>';
            return;
        }
        if (appsToDisplay.length === 0) {
            appContainer.innerHTML = '<div class="no-results">No apps found matching your criteria.</div>';
            return;
        }
        
        appContainer.innerHTML = ''; // پاک کردن محتوای قبلی
        const appsToShowOnPage = appsToDisplay.slice(0, limit); // انتخاب 50 تای اول برای نمایش
        
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

    // تابع جدید برای مرتب‌سازی اپلیکیشن‌ها
    function sortApps(apps, sortOrder) {
        const sortedApps = [...apps]; // ایجاد کپی برای جلوگیری از تغییر آرایه اصلی

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
                // برای 'default'، ترتیب اولیه (که همان ترتیب فیلتر شده است) حفظ می‌شود.
                // یا می‌توانیم به ترتیب اولیه از CSV برگردانیم اگر آن را جداگانه ذخیره کرده باشیم.
                // در اینجا، اگر default است، به سادگی از sort صرف‌نظر می‌کنیم و ترتیب فعلی (فیلتر شده) را برمی‌گردانیم.
                return apps; 
        }
        return sortedApps;
    }
    
    // تابع اصلی برای نمایش اپ‌ها (فیلتر، سورت، رندر)
    function displayProcessedApps() {
        if (!allApps || allApps.length === 0) { // بررسی اگر allApps هنوز لود نشده یا خالی است
            if (appContainer.innerHTML.includes('loading')) { // اگر هنوز در حال لودینگ است، کاری نکن
                 // یا پیامی برای صبر کردن نمایش بده
            } else if (!appContainer.innerHTML.includes('error')) { // اگر خطا نمایش داده نشده
                 appContainer.innerHTML = '<div class="no-results">No app data available.</div>';
            }
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
        
        // مرتب‌سازی بر اساس currentSortOrder
        // اگر 'default' باشد، sortApps خود ترتیب اولیه (filteredApps) را برمی‌گرداند.
        const sortedAndFilteredApps = sortApps(filteredApps, currentSortOrder);
        
        renderApps(sortedAndFilteredApps); // renderApps خودش 50 تای اول را مدیریت می‌کند
    }

    // Event listener برای تغییر نوع مرتب‌سازی
    sortOptions.addEventListener('change', function() {
        currentSortOrder = this.value;
        displayProcessedApps();
    });

    // Event listener برای جستجو
    searchInput.addEventListener('input', displayProcessedApps);
    
    // تابع init برای شروع
    (async function init() {
        appContainer.innerHTML = '<div class="loading">Loading apps</div>';
        const fetchedApps = await fetchData();
        if (fetchedApps) { // فقط اگر داده‌ها با موفقیت دریافت شدند
            allApps = fetchedApps;
            displayProcessedApps(); // نمایش اولیه اپ‌ها با سورت default
        } 
        // اگر fetchedApps null باشد، یعنی خطا قبلا در fetchData یا parseCSV مدیریت و نمایش داده شده.
    })();
});