document.addEventListener('DOMContentLoaded', () => {

    // ================= دیتابیس جامع کتاب‌ها (تغییرناپذیر و آماده) =================
    const BOOKS_DATABASE = [
        { title: 'نوای دل', author: 'هوشنگ اعتمادی گندمانی', url: 'book/book1.html', image: 'book/covers/navayedel.jpg', category: 'literature' },
        { title: 'برای شماره ۱۳ ها', author: 'علی قنواتی', url: 'book/book2.html', image: 'book/covers/barayeshomare13.jpg', category: 'history' },
        { title: 'دوباره مرز', author: 'نام مشخص نشده', url: '#', image: 'book/covers/dobarehmarz.jpg', category: 'literature' },
        { title: 'از زویر تا کوبا', author: 'نام مشخص نشده', url: '#', image: 'book/covers/azzovirtacuba.jpg', category: 'history' },
        { title: 'آیینه ترین طواف', author: 'نام مشخص نشده', url: '#', image: 'book/covers/aeinetarintavaf.jpg', category: 'history' },
        { title: 'رگ زیر دندان', author: 'نام مشخص نشده', url: '#', image: 'book/covers/ragziredandan.jpg', category: 'history' }
    ];

    // ================= سیستم جستجوی زنده و هوشمند =================
    const searchInput = document.querySelector('.search-box input');
    const searchBoxForm = document.querySelector('.search-box');

    if (searchInput && searchBoxForm) {
        // ایجاد داینامیک باکس نتایج جستجو
        const resultsDropdown = document.createElement('div');
        resultsDropdown.className = 'search-results-dropdown';
        searchBoxForm.appendChild(resultsDropdown);

        // تابع دی‌بانس (Debounce) برای جلوگیری از اجرای رگباری کد با هر تایپ
        function debounce(func, delay) {
            let timeoutId;
            return function (...args) {
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        }

        // تابع اصلی فیلتر و رندر نتایج
        const performSearch = (query) => {
            const cleanedQuery = query.trim().toLowerCase();

            if (!cleanedQuery) {
                resultsDropdown.classList.remove('active');
                resultsDropdown.innerHTML = '';
                return;
            }

            // فیلتر کردن بر اساس عنوان یا نویسنده
            const filteredBooks = BOOKS_DATABASE.filter(book => 
                book.title.toLowerCase().includes(cleanedQuery) || 
                book.author.toLowerCase().includes(cleanedQuery)
            );

            if (filteredBooks.length === 0) {
                resultsDropdown.innerHTML = `<div class="search-no-results">کتابی با این مشخصات پیدا نشد 🔍</div>`;
            } else {
                resultsDropdown.innerHTML = filteredBooks.map(book => `
                    <a href="${book.url}" class="search-result-item">
                        <img src="${book.image}" alt="${book.title}" onerror="this.src='book/covers/default.jpg';">
                        <div class="search-result-info">
                            <span class="search-result-title">${book.title}</span>
                            <span class="search-result-author">نویسنده: ${book.author}</span>
                        </div>
                    </a>
                `).join('');
            }

            resultsDropdown.classList.add('active');
        };

        // گوش دادن به تایپ کاربر با تاخیر ۲۵۰ میلی‌ثانیه
        searchInput.addEventListener('input', debounce((e) => {
            performSearch(e.target.value);
        }, 250));

        // بستن باکس نتایج با زدن کلید Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                resultsDropdown.classList.remove('active');
            }
        });

        // بستن باکس نتایج با کلیک روی هر جایی خارج از فرم جستجو
        document.addEventListener('click', (e) => {
            if (!searchBoxForm.contains(e.target)) {
                resultsDropdown.classList.remove('active');
            }
        });

        // باز شدن مجدد باکس در صورت فوکوس و داشتن متن
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim()) {
                resultsDropdown.classList.add('active');
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
