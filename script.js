document.addEventListener('DOMContentLoaded', () => {

    // ================= دیتابیس جامع کتاب‌ها =================
    const BOOKS_DATABASE = [
        { title: 'نوای دل', author: 'هوشنگ اعتمادی گندمانی', url: 'book/book1.html', image: 'book/covers/navayedel.jpg', category: 'literature' },
        { title: 'برای شماره ۱۳ ها', author: 'علی قنواتی', url: 'book/book2.html', image: 'book/covers/barayeshomare13.jpg', category: 'history' },
        { title: 'دوباره مرز', author: 'نام مشخص نشده', url: '#', image: 'book/covers/dobarehmarz.jpg', category: 'literature' },
        { title: 'از زویر تا کوبا', author: 'نام مشخص نشده', url: '#', image: 'book/covers/azzovirtacuba.jpg', category: 'history' },
        { title: 'آیینه ترین طواف', author: 'نام مشخص نشده', url: '#', image: 'book/covers/aeinetarintavaf.jpg', category: 'history' },
        { title: 'رگ زیر دندان', author: 'نام مشخص نشده', url: '#', image: 'book/covers/ragziredandan.jpg', category: 'history' }
    ];

    // ================= سیستم جستجوی دوگانه (Live Dropdown + Full Overlay) =================
    const searchInput = document.querySelector('.search-box input');
    const searchBoxForm = document.querySelector('.search-box');

    if (searchInput && searchBoxForm) {
        
        // ۱. ساخت منوی کشویی جستجوی زنده (در جریان اصلی صفحه تا متون را نرم هل دهد)
        const liveDropdown = document.createElement('div');
        liveDropdown.className = 'live-search-dropdown';
        searchBoxForm.insertAdjacentElement('afterend', liveDropdown);

        // ۲. ساخت لایه تمام‌صفحه نتایج جامع
        const overlay = document.createElement('div');
        overlay.className = 'search-overlay';
        overlay.innerHTML = `
            <div class="search-overlay-header">
                <h3>نتایج جستجو برای: <span id="searchQueryText">همه آثار</span></h3>
                <button class="close-overlay-btn" id="closeSearchBtn" aria-label="بستن جستجو">✕</button>
            </div>
            <div class="search-overlay-body">
                <div class="search-results-grid" id="searchResultsGrid"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        const searchResultsGrid = overlay.querySelector('#searchResultsGrid');
        const searchQueryText = overlay.querySelector('#searchQueryText');
        const closeSearchBtn = overlay.querySelector('#closeSearchBtn');

        function debounce(func, delay) {
            let timeoutId;
            return function (...args) {
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        }

        // عملکرد تایپ زنده (بدون پرش)
        const performLiveSearch = (query) => {
            const cleanedQuery = query.trim().toLowerCase();

            if (!cleanedQuery) {
                liveDropdown.classList.remove('active');
                liveDropdown.innerHTML = '';
                return;
            }

            const filteredBooks = BOOKS_DATABASE.filter(book => 
                book.title.toLowerCase().includes(cleanedQuery) || 
                book.author.toLowerCase().includes(cleanedQuery)
            );

            if (filteredBooks.length === 0) {
                liveDropdown.innerHTML = `<div class="live-no-results">کتابی پیدا نشد 🔍</div>`;
            } else {
                liveDropdown.innerHTML = filteredBooks.slice(0, 5).map(book => `
                    <a href="${book.url}" class="live-result-item">
                        <img src="${book.image}" alt="${book.title}" class="live-result-img" onerror="this.src='book/covers/default.jpg';">
                        <div class="live-result-info">
                            <h4>${book.title}</h4>
                            <p>${book.author}</p>
                        </div>
                    </a>
                `).join('');
            }
            liveDropdown.classList.add('active');
        };

        // عملکرد جستجوی جامع (Full Screen Overlay)
        const performFullSearch = (query) => {
            const cleanedQuery = query.trim().toLowerCase();
            searchQueryText.textContent = cleanedQuery ? cleanedQuery : 'همه آثار';

            const filteredBooks = BOOKS_DATABASE.filter(book => 
                book.title.toLowerCase().includes(cleanedQuery) || 
                book.author.toLowerCase().includes(cleanedQuery)
            );

            if (filteredBooks.length === 0) {
                searchResultsGrid.innerHTML = `<div class="search-no-results-full">متأسفانه کتابی با این عنوان یا نویسنده یافت نشد 🔍</div>`;
            } else {
                searchResultsGrid.innerHTML = filteredBooks.map(book => `
                    <a href="${book.url}" class="search-result-card">
                        <img src="${book.image}" alt="${book.title}" onerror="this.src='book/covers/default.jpg';">
                        <div class="search-result-info">
                            <h4>${book.title}</h4>
                            <p>نویسنده: ${book.author}</p>
                        </div>
                    </a>
                `).join('');
            }

            liveDropdown.classList.remove('active');
            overlay.classList.add('active');
            document.body.classList.add('no-scroll');
        };

        // لیسنرها
        searchInput.addEventListener('input', debounce((e) => {
            performLiveSearch(e.target.value);
        }, 100));

        searchBoxForm.addEventListener('submit', (e) => {
            e.preventDefault();
            performFullSearch(searchInput.value);
        });

        const closeOverlay = () => {
            overlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        };

        closeSearchBtn.addEventListener('click', closeOverlay);

        document.addEventListener('click', (e) => {
            if (!searchBoxForm.contains(e.target) && !liveDropdown.contains(e.target)) {
                liveDropdown.classList.remove('active');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                liveDropdown.classList.remove('active');
                if (overlay.classList.contains('active')) closeOverlay();
            }
        });

        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim()) {
                liveDropdown.classList.add('active');
            }
        });
    }

    // ================= کدهای دکمه اسکرول =================
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (scrollTopBtn) {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (window.scrollY > 400) { scrollTopBtn.classList.add('visible'); } 
                    else { scrollTopBtn.classList.remove('visible'); }
                    ticking = false;
                });
                ticking = true;
            }
        });
        scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // ================= سیستم فیلتر گالری کتاب‌ها =================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.compact-card');

    if (filterBtns.length > 0 && galleryItems.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                galleryItems.forEach(item => {
                    if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                        item.classList.remove('hide');
                    } else {
                        item.classList.add('hide');
                    }
                });
            });
        });
    }

    // ================= عملکرد بهینه‌شده اسلایدر عکس =================
    window.changeImage = function(element) {
        const mainImage = document.getElementById('mainBookImg');
        if (!mainImage || mainImage.src === element.src) return;
        
        mainImage.style.opacity = '0';
        setTimeout(() => {
            mainImage.src = element.src;
            mainImage.style.opacity = '1';
        }, 200);
        
        const thumbnails = document.querySelectorAll('.thumb-img');
        if (thumbnails.length > 0) {
            thumbnails.forEach(thumb => thumb.classList.remove('active-thumb'));
            element.classList.add('active-thumb');
        }
    };

});
