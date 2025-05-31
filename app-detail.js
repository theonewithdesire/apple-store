document.addEventListener('DOMContentLoaded', function() {
    const appDetailContainer = document.getElementById('appDetailContainer');
    const appDetailHeaderTitle = document.getElementById('appDetailHeaderTitle');

    // تابع برای تبدیل بایت به مگابایت یا گیگابایت (اختیاری)
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // تابع واکشی و پارس کردن CSV (می‌توانید از script.js کپی کنید یا به یک فایل مشترک منتقل کنید)
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
        }).filter(row => row.id && row.track_name); // اطمینان از وجود id و track_name
    }

    function renderAppDetails(app) {
        if (!app) {
            appDetailContainer.innerHTML = '<div class="error">App not found or data is incomplete.</div>';
            appDetailHeaderTitle.textContent = "خطا در نمایش اپلیکیشن";
            return;
        }

        appDetailHeaderTitle.textContent = app.track_name || "جزئیات اپلیکیشن"; // عنوان صفحه در هدر

        const price = parseFloat(app.price) === 0 ? 'رایگان' : `${Number(app.price).toFixed(2)} دلار`;
        const rating = parseFloat(app.user_rating) || 0;
        const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
        const formattedSize = app.size_bytes ? formatBytes(parseInt(app.size_bytes)) : 'نامشخص';
        
        // ستون app_desc که در تصویر دوم دیتابیس شما بود، برای توضیحات استفاده می‌شود
        const description = app.app_desc || 'توضیحاتی برای این اپلیکیشن موجود نیست.';

        // برای آیکون، چون آدرس تصویر آیکون را در CSV نداریم، یک Placeholder می‌سازیم
        const appInitial = app.track_name ? app.track_name.substring(0, 1).toUpperCase() : "?";

        appDetailContainer.innerHTML = `
            <div class="app-detail-header">
                <div class="app-icon-placeholder">${appInitial}</div>
                <div class="app-title-section">
                    <h2>${app.track_name}</h2>
                    <!-- <p class="developer-name">توسط: نام توسعه‌دهنده (اگر در CSV بود)</p> -->
                    <span class="price" style="font-size: 1.2rem; color: var(--primary-dark); font-weight: bold;">${price}</span>
                </div>
            </div>

            <a href="#" class="download-button" onclick="alert('لینک دانلود واقعی در اینجا قرار می‌گیرد!'); return false;">دانلود اپلیکیشن</a>
            
            <div class="rating-section">
                <h3>امتیاز کاربران:</h3>
                <span class="stars" title="${rating.toFixed(1)} از 5">${stars}</span>
                <span class="rating-value">${rating.toFixed(1)}</span>
                <span class="rating-count">(${parseInt(app.rating_count_tot || 0).toLocaleString()} رأی)</span>
            </div>

            <h3>توضیحات:</h3>
            <p class="app-description">${description.replace(/\\n/g, '<br>')}</p> <!-- جایگزینی \n با <br> اگر توضیحات چند خطی است -->
            
            <h3>اطلاعات بیشتر:</h3>
            <div class="app-meta-grid">
                <div class="meta-item"><strong>ژانر اصلی:</strong> ${app.prime_genre || 'نامشخص'}</div>
                <div class="meta-item"><strong>نسخه:</strong> ${app.ver || 'نامشخص'}</div>
                <div class="meta-item"><strong>حجم:</strong> ${formattedSize}</div>
                <div class="meta-item"><strong>رده‌بندی سنی:</strong> ${app.cont_rating || 'نامشخص'}</div>
                <div class="meta-item"><strong>تعداد دستگاه‌های پشتیبانی شده:</strong> ${app['sup_devices.num'] || 'نامشخص'}</div>
                <div class="meta-item"><strong>تعداد زبان‌ها:</strong> ${app['lang.num'] || 'نامشخص'}</div>
                <!-- می‌توانید فیلدهای بیشتری از CSV را اینجا اضافه کنید -->
            </div>
        `;
    }

    async function init() {
        const urlParams = new URLSearchParams(window.location.search);
        const appId = urlParams.get('id');

        if (!appId) {
            appDetailContainer.innerHTML = '<div class="error">شناسه اپلیکیشن مشخص نشده است.</div>';
            return;
        }

        const allApps = await fetchData();

        if (allApps) {
            // بسیار مهم: مطمئن شوید که appId از URL (که یک رشته است) با appId در داده‌های CSV (که ممکن است رشته یا عدد باشد) به درستی مقایسه می‌شود.
            // اگر app.id در CSV به صورت عددی است، appId را به عدد تبدیل کنید: const targetApp = allApps.find(app => Number(app.id) === Number(appId));
            // اگر app.id در CSV به صورت رشته است (که معمولا امن‌تر است):
            const targetApp = allApps.find(app => String(app.id) === String(appId)); 
            renderAppDetails(targetApp);
        }
    }

    init();
});