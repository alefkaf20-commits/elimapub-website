document.addEventListener('DOMContentLoaded', () => {
    const toPersianNum = (num) => {
    if (num === null || num === undefined) return '';
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, x => farsiDigits[x]);
};
    
    const currentScript = document.currentScript || document.querySelector('script[src*="script.js"]');
    let basePath = '';
    if (currentScript) {
        const src = currentScript.getAttribute('src');
        if (src) basePath = src.split('script.js')[0];
    }

    // ================= سیستم مدیریت پری‌لودر =================
    const preloader = document.getElementById('elima-preloader');
    if (preloader) {
        setTimeout(() => { preloader.classList.add('loaded'); }, 500); 
    }

    // ================= Intersection Observer (انیمیشن‌های اسکرول) =================
    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px 0px -5% 0px', threshold: 0 });

    const observeAnimations = () => {
        const animatedElements = document.querySelectorAll('.reveal-on-scroll:not(.is-visible), .reveal-zoom:not(.is-visible)');
        animatedElements.forEach(el => scrollObserver.observe(el));
    };
    
    // اجرای فوری انیمیشن‌ها برای صفحات اصلی
    observeAnimations();

    // ================= هسته مرکزی متصل به دیتابیس ابری =================
    const initDynamicFeatures = () => {
        
        if (!window.BOOKS_DATABASE || window.BOOKS_DATABASE.length === 0) {
            console.warn("⚠️ دیتابیس خالی است.");
            return;
        }

        // --- ۱. سیستم جستجوی دوگانه ---
        const searchInput = document.querySelector('.search-box input');
        const searchBoxForm = document.querySelector('.search-box');
        if (searchInput && searchBoxForm) {
            let liveDropdown = document.querySelector('.live-search-dropdown');
            if (!liveDropdown) {
                liveDropdown = document.createElement('div');
                liveDropdown.className = 'live-search-dropdown';
                searchBoxForm.insertAdjacentElement('afterend', liveDropdown);
            }
            let overlay = document.querySelector('.search-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
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
            }

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

            const renderBooks = (filteredBooks, isLive) => {
                if (filteredBooks.length === 0) return `<div class="${isLive ? 'live-no-results' : 'search-no-results-full'}">کتابی پیدا نشد 🔍</div>`;
                return filteredBooks.map(book => {
                    let parsedImages = [];
                    try { parsedImages = typeof book.images === 'string' ? JSON.parse(book.images) : book.images; } catch(e) {}
                    
                    const coverImage = parsedImages && parsedImages.length > 0 ? parsedImages[0] : 'default.jpg';
                    const imagePath = basePath + 'book/covers/' + coverImage;
                    const linkPath = basePath + 'book/details.html?id=' + book.id;
                    
                    if (isLive) {
                        return `
                            <a href="${linkPath}" class="live-result-item">
                                <img src="${imagePath}" alt="${book.title}" class="live-result-img" onerror="this.src='${basePath}book/covers/default.jpg';">
                                <div class="live-result-info">
                                    <h4>${book.title || ''}</h4>
                                    <p>${book.author || ''}</p>
                                </div>
                            </a>
                        `;
                    } else {
                        return `
                            <a href="${linkPath}" class="search-result-card">
                                <img src="${imagePath}" alt="${book.title}" onerror="this.src='${basePath}book/covers/default.jpg';">
                                <div class="search-result-info">
                                    <h4>${book.title || ''}</h4>
                                    <p>نویسنده: ${book.author || ''}</p>
                                </div>
                            </a>
                        `;
                    }
                }).join('');
            };

            const performLiveSearch = (query) => {
                const cleanedQuery = query.trim().toLowerCase();
                if (!cleanedQuery) { liveDropdown.classList.remove('active'); liveDropdown.innerHTML = ''; return; }
                const filteredBooks = window.BOOKS_DATABASE.filter(book => 
                    (book.title && book.title.toLowerCase().includes(cleanedQuery)) || 
                    (book.author && book.author.toLowerCase().includes(cleanedQuery))
                );
                liveDropdown.innerHTML = renderBooks(filteredBooks.slice(0, 5), true);
                liveDropdown.classList.add('active');
            };

            const performFullSearch = (query) => {
                const cleanedQuery = query.trim().toLowerCase();
                searchQueryText.textContent = cleanedQuery ? cleanedQuery : 'همه آثار';
                const filteredBooks = window.BOOKS_DATABASE.filter(book => 
                    (book.title && book.title.toLowerCase().includes(cleanedQuery)) || 
                    (book.author && book.author.toLowerCase().includes(cleanedQuery))
                );
                searchResultsGrid.innerHTML = renderBooks(filteredBooks, false);
                liveDropdown.classList.remove('active');
                overlay.classList.add('active');
                document.body.classList.add('no-scroll');
            };

            searchInput.addEventListener('input', debounce((e) => { performLiveSearch(e.target.value); }, 100));
            searchBoxForm.addEventListener('submit', (e) => { e.preventDefault(); performFullSearch(searchInput.value); });
            
            const closeOverlay = () => { overlay.classList.remove('active'); document.body.classList.remove('no-scroll'); };
            closeSearchBtn.addEventListener('click', closeOverlay);
            
            document.addEventListener('click', (e) => { if (!searchBoxForm.contains(e.target) && !liveDropdown.contains(e.target)) liveDropdown.classList.remove('active'); });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { liveDropdown.classList.remove('active'); if (overlay.classList.contains('active')) closeOverlay(); } });
            searchInput.addEventListener('focus', () => { if (searchInput.value.trim()) liveDropdown.classList.add('active'); });
        }

        // --- ۲. رندر داینامیک گالری کتاب‌ها ---
        const galleryContainer = document.querySelector('.compact-book-gallery');
        if (galleryContainer) {
            galleryContainer.innerHTML = window.BOOKS_DATABASE.map(book => {
                let parsedImages = [];
                try { parsedImages = typeof book.images === 'string' ? JSON.parse(book.images) : book.images; } catch(e) {}
                const coverImage = parsedImages && parsedImages.length > 0 ? parsedImages[0] : 'default.jpg';
                const imagePath = basePath + 'book/covers/' + coverImage;
                const linkPath = basePath + 'book/details.html?id=' + book.id;
                return `
                <a href="${linkPath}" class="compact-card" data-category="${book.category}">
                    <div style="position: relative; border-radius: 8px; margin-bottom: 10px;">
                        <img src="${imagePath}" alt="${book.title}" loading="lazy" style="width: 100%; aspect-ratio: 2/3; object-fit: cover; display: block; margin: 0; border-radius: inherit; box-shadow: 0 8px 15px rgba(0,0,0,0.1);" onerror="this.src='${basePath}book/covers/default.jpg'">
                    </div>
                    <h4>${book.title}</h4>
                </a>
                `;
            }).join('');

            const filterBtns = document.querySelectorAll('.filter-btn');
            const galleryItems = document.querySelectorAll('.compact-card');
            if (filterBtns.length > 0 && galleryItems.length > 0) {
                filterBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        filterBtns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        const filterValue = btn.getAttribute('data-filter');
                        galleryItems.forEach(item => {
                            if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) item.classList.remove('hide');
                            else item.classList.add('hide');
                        });
                    });
                });
            }
        }

        // --- ۳. تزریق داینامیک اطلاعات در صفحه جزئیات ---
        if (window.location.pathname.includes('details.html')) {
            const urlParams = new URLSearchParams(window.location.search);
            const bookId = urlParams.get('id');
            const currentBook = window.BOOKS_DATABASE.find(b => b.id === bookId);
            
            if (currentBook) {
                document.getElementById('pageTitle').textContent = `نشر الیما | ${currentBook.title}`;
                document.getElementById('bookTitle').textContent = currentBook.title;
                document.getElementById('bookAuthor').textContent = currentBook.author;
                document.getElementById('bookPrice').textContent = currentBook.price;
                document.getElementById('bookPages').textContent = currentBook.pages + ' صفحه';
                document.getElementById('bookFormat').textContent = currentBook.format;
                document.getElementById('bookCoverType').textContent = currentBook.covertype || currentBook.coverType;
                document.getElementById('bookPaperType').textContent = currentBook.papertype || currentBook.paperType;
                document.getElementById('bookIsbn').textContent = currentBook.isbn;
                document.getElementById('bookYear').textContent = currentBook.year;
                document.getElementById('bookDesc').innerHTML = currentBook.desc || '';

                let badgesHTML = `<span class="badge-tag">${currentBook.printedition || currentBook.printEdition || ''}</span>`;
                if (currentBook.isbestseller || currentBook.isBestseller) badgesHTML += `<span class="badge-tag highlight">پرفروش</span>`;
                document.getElementById('badgesContainer').innerHTML = badgesHTML;

                let parsedImages = [];
                try { parsedImages = typeof currentBook.images === 'string' ? JSON.parse(currentBook.images) : currentBook.images; } catch(e) {}

                const mainImg = document.getElementById('mainBookImg');
                const thumbsContainer = document.getElementById('thumbnailsContainer');
                
                if (parsedImages && parsedImages.length > 0) {
                    mainImg.src = `covers/${parsedImages[0]}`;
                    thumbsContainer.innerHTML = parsedImages.map((img, index) => `
                        <img src="covers/${img}" class="thumb-img ${index === 0 ? 'active-thumb' : ''}" onclick="changeImage(this)" alt="تصویر ${index + 1}">
                    `).join('');
                } else {
                    mainImg.src = `covers/default.jpg`;
                }
            } else {
                document.querySelector('.pro-book-container').innerHTML = `
                    <div style="text-align: center; padding: 100px 20px;">
                        <h1 style="color: var(--text-title); margin-bottom: 20px;">کتاب مورد نظر یافت نشد!</h1>
                        <a href="index.html" class="btn-primary">بازگشت به فروشگاه</a>
                    </div>
                `;
            }
        }

        // --- ۴. داینامیک کردن صفحه اصلی ---
        const newBooksContainer = document.querySelector('.books-wrapper');
        if (newBooksContainer && !window.location.pathname.includes('book/')) {
            newBooksContainer.innerHTML = window.BOOKS_DATABASE.slice(0, 3).map((book, index) => {
                let parsedImages = [];
                try { parsedImages = typeof book.images === 'string' ? JSON.parse(book.images) : book.images; } catch(e) {}
                const coverImage = parsedImages && parsedImages.length > 0 ? parsedImages[0] : 'default.jpg';
                const imagePath = basePath + 'book/covers/' + coverImage;
                const linkPath = basePath + 'book/details.html?id=' + book.id;
                const delay = (index + 1) * 100;
                return `
                <article class="book-item reveal-on-scroll delay-${delay}">
                    <div style="position: relative; border-radius: 8px; margin-bottom: 10px;">
                        <img src="${imagePath}" alt="${book.title}" class="book-cover-img" onerror="this.src='${basePath}book/covers/default.jpg'">
                    </div>
                    <h3 class="item-title">${book.title}</h3>
                    <p class="item-author">نویسنده: ${book.author}</p>
                    <div class="item-price">${book.price} تومان</div>
                    <a href="${linkPath}" class="btn-action">مشاهده و خرید</a>
                </article>
                `;
            }).join('');
        }

        setTimeout(() => {
            observeAnimations();
        }, 50);
    };

    // ================= اتصال سیگنال‌های دیتابیس =================
    if (window.IS_DATA_READY) {
        initDynamicFeatures();
    } else {
        document.addEventListener('cloudDataLoaded', initDynamicFeatures);
    }

    // ================= سایر کدهای پایه سایت =================
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (scrollTopBtn) {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (window.scrollY > 400) scrollTopBtn.classList.add('visible'); 
                    else scrollTopBtn.classList.remove('visible');
                    ticking = false;
                });
                ticking = true;
            }
        });
        scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

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

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.target !== '_blank' && link.host === window.location.host) {
            const hrefAttr = link.getAttribute('href');
            const isHashLink = hrefAttr.startsWith('#');
            const isSamePageHash = link.href.includes('#') && link.pathname === window.location.pathname;
            const isDownload = link.hasAttribute('download');
            const isSpecialLink = hrefAttr.startsWith('mailto:') || hrefAttr.startsWith('tel:') || hrefAttr.startsWith('javascript:');
            
            if (!isHashLink && !isSamePageHash && !isDownload && !isSpecialLink) {
                e.preventDefault(); 
                document.body.classList.add('fade-out'); 
                setTimeout(() => { window.location.href = link.href; }, 350); 
            }
        }
    });

    window.addEventListener('pageshow', (event) => {
        if (event.persisted) document.body.classList.remove('fade-out');
    });
});
