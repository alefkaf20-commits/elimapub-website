// ================= سیستم هوشمند و سراسری مدیریت خطای تصاویر =================
const DEFAULT_COVER = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300' fill='%23f1f5f9'%3E%3Crect width='200' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='16' fill='%2394a3b8' text-anchor='middle' dominant-baseline='middle'%3Eبدون تصویر%3C/text%3E%3C/svg%3E";
window.handleImgError = function(img) {
    if (!img.dataset.retried) {
        img.dataset.retried = 'true';
        const originalSrc = img.src.split('?')[0];
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        setTimeout(() => { img.src = originalSrc + '?retry=' + Date.now(); }, 1000);
    } else {
        if (img.src !== DEFAULT_COVER) { img.onerror = null;
        img.src = DEFAULT_COVER; }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_STORAGE_BASE = 'https://dgdxxzwgqlhepvchfigh.supabase.co/storage/v1/object/public/covers/';

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

    const getDisplayUrl = (img) => {
        if (!img || img === 'default.jpg' || img === '') return DEFAULT_COVER;
        if (img.startsWith('http')) return img;
        return SUPABASE_STORAGE_BASE + encodeURI(img); 
    };

    const preloader = document.getElementById('elima-preloader');
    if (preloader) { setTimeout(() => { preloader.classList.add('loaded'); }, 500); }

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px 0px -5% 0px', threshold: 0 });

    const observeAnimations = () => {
        setTimeout(() => {
            const animatedElements = document.querySelectorAll('.reveal-on-scroll:not(.is-visible), .reveal-zoom:not(.is-visible)');
            animatedElements.forEach(el => scrollObserver.observe(el));
        }, 150);
    };
    observeAnimations();

    const initDynamicFeatures = () => {
        if (!window.BOOKS_DATABASE && !window.NEWS_DATABASE) return;

        // --- ۱. جستجوی زنده ---
        const searchInput = document.querySelector('.search-box input');
        const searchBoxForm = document.querySelector('.search-box');
        if (searchInput && searchBoxForm && window.BOOKS_DATABASE) {
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
                        <button class="close-overlay-btn" id="closeSearchBtn">✕</button>
                    </div>
                    <div class="search-overlay-body"><div class="search-results-grid" id="searchResultsGrid"></div></div>
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
                    let parsedImages = []; try { parsedImages = typeof book.images === 'string' ? JSON.parse(book.images) : book.images; } catch(e) {}
                    const imagePath = getDisplayUrl(parsedImages && parsedImages.length > 0 ? parsedImages[0] : 'default.jpg');
                    const linkPath = basePath + 'book/details.html?id=' + book.id;
                    
                    if (isLive) {
                        return `<a href="${linkPath}" class="live-result-item"><img src="${imagePath}" class="live-result-img" onerror="window.handleImgError(this)"><div class="live-result-info"><h4>${book.title || ''}</h4><p>${book.author || ''}</p></div></a>`;
                    } else {
                        return `<a href="${linkPath}" class="search-result-card"><img src="${imagePath}" onerror="window.handleImgError(this)"><div class="search-result-info"><h4>${book.title || ''}</h4><p>نویسنده: ${book.author || ''}</p></div></a>`;
                    }
                }).join('');
            };

            const performLiveSearch = (query) => {
                const cleanedQuery = query.trim().toLowerCase();
                if (!cleanedQuery) { liveDropdown.classList.remove('active'); liveDropdown.innerHTML = ''; return; }
                const filteredBooks = window.BOOKS_DATABASE.filter(book => (book.title && book.title.toLowerCase().includes(cleanedQuery)) || (book.author && book.author.toLowerCase().includes(cleanedQuery)));
                liveDropdown.innerHTML = renderBooks(filteredBooks.slice(0, 5), true); liveDropdown.classList.add('active');
            };

            const performFullSearch = (query) => {
                const cleanedQuery = query.trim().toLowerCase();
                searchQueryText.textContent = cleanedQuery ? cleanedQuery : 'همه آثار';
                const filteredBooks = window.BOOKS_DATABASE.filter(book => (book.title && book.title.toLowerCase().includes(cleanedQuery)) || (book.author && book.author.toLowerCase().includes(cleanedQuery)));
                searchResultsGrid.innerHTML = renderBooks(filteredBooks, false); liveDropdown.classList.remove('active'); overlay.classList.add('active'); document.body.classList.add('no-scroll');
            };

            searchInput.addEventListener('input', debounce((e) => { performLiveSearch(e.target.value); }, 100));
            searchBoxForm.addEventListener('submit', (e) => { e.preventDefault(); performFullSearch(searchInput.value); });
            
            const closeOverlay = () => { overlay.classList.remove('active'); document.body.classList.remove('no-scroll'); };
            closeSearchBtn.addEventListener('click', closeOverlay);
            document.addEventListener('click', (e) => { if (!searchBoxForm.contains(e.target) && !liveDropdown.contains(e.target)) liveDropdown.classList.remove('active'); });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { liveDropdown.classList.remove('active'); if (overlay.classList.contains('active')) closeOverlay(); } });
            searchInput.addEventListener('focus', () => { if (searchInput.value.trim()) liveDropdown.classList.add('active'); });
        }

        // --- ۲. رندر گالری کتاب‌ها ---
        const galleryContainer = document.querySelector('.compact-book-gallery');
        if (galleryContainer && window.BOOKS_DATABASE) {
            galleryContainer.innerHTML = window.BOOKS_DATABASE.map(book => {
                let parsedImages = []; try { parsedImages = typeof book.images === 'string' ? JSON.parse(book.images) : book.images; } catch(e) {}
                const imagePath = getDisplayUrl(parsedImages && parsedImages.length > 0 ? parsedImages[0] : 'default.jpg');
                const linkPath = basePath + 'book/details.html?id=' + book.id;
                return `<a href="${linkPath}" class="compact-card" data-category="${book.category}">
                    <div style="position: relative; border-radius: 8px; margin-bottom: 10px;"><img src="${imagePath}" alt="${book.title}" loading="lazy" style="width: 100%; aspect-ratio: 2/3; object-fit: cover; display: block; margin: 0; border-radius: inherit; box-shadow: 0 8px 15px rgba(0,0,0,0.1);" onerror="window.handleImgError(this)"></div>
                    <h4>${book.title}</h4>
                </a>`;
            }).join('');
            const filterBtns = document.querySelectorAll('.filter-btn');
            const galleryItems = document.querySelectorAll('.compact-card');
            if (filterBtns.length > 0 && galleryItems.length > 0) {
                filterBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        filterBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active');
                        const filterValue = btn.getAttribute('data-filter');
                        galleryItems.forEach(item => { if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) item.classList.remove('hide'); else item.classList.add('hide'); });
                    });
                });
            }
        }

        // --- ۳. صفحه جزئیات کتاب ---
        if (window.location.pathname.includes('book/details.html') && window.BOOKS_DATABASE) {
            const urlParams = new URLSearchParams(window.location.search);
            const bookId = urlParams.get('id');
            const currentBook = window.BOOKS_DATABASE.find(b => b.id === bookId);
            if (currentBook) {
                document.getElementById('pageTitle').textContent = `نشر الیما | ${currentBook.title}`;
                document.getElementById('bookTitle').textContent = currentBook.title; document.getElementById('bookAuthor').textContent = currentBook.author;
                document.getElementById('bookPrice').textContent = toPersianNum(currentBook.price); document.getElementById('bookPages').textContent = toPersianNum(currentBook.pages) + ' صفحه';
                document.getElementById('bookFormat').textContent = currentBook.format;
                document.getElementById('bookCoverType').textContent = currentBook.covertype || currentBook.coverType;
                document.getElementById('bookPaperType').textContent = currentBook.papertype || currentBook.paperType; document.getElementById('bookIsbn').textContent = currentBook.isbn;
                document.getElementById('bookYear').textContent = toPersianNum(currentBook.year); document.getElementById('bookDesc').innerHTML = currentBook.desc || '';

                let badgesHTML = `<span class="badge-tag">${currentBook.printedition || currentBook.printEdition || ''}</span>`;
                if (currentBook.isbestseller || currentBook.isBestseller) badgesHTML += `<span class="badge-tag highlight">پرفروش</span>`;
                document.getElementById('badgesContainer').innerHTML = badgesHTML;

                let parsedImages = []; try { parsedImages = typeof currentBook.images === 'string' ? JSON.parse(currentBook.images) : currentBook.images;
                } catch(e) {}
                const mainImg = document.getElementById('mainBookImg');
                const thumbsContainer = document.getElementById('thumbnailsContainer');
                
                mainImg.src = getDisplayUrl(parsedImages && parsedImages.length > 0 ? parsedImages[0] : 'default.jpg');
                mainImg.onerror = function() { window.handleImgError(this); };
                
                if (parsedImages && parsedImages.length > 0) {
                    thumbsContainer.innerHTML = parsedImages.map((img, index) => {
                        const imgSrc = getDisplayUrl(img);
                        return `<img src="${imgSrc}" class="thumb-img ${index === 0 ? 'active-thumb' : ''}" onclick="changeImage(this)" onerror="window.handleImgError(this)">`;
                    }).join('');
                }
            } else {
                document.querySelector('.pro-book-container').innerHTML = `<div style="text-align: center; padding: 100px 20px;"><h1 style="color: var(--text-title); margin-bottom: 20px;">کتاب مورد نظر یافت نشد!</h1><a href="index.html" class="btn-primary">بازگشت به فروشگاه</a></div>`;
            }
        }

        // --- ۴. تازه های نشر ---
        const newBooksContainer = document.querySelector('.books-wrapper');
        if (newBooksContainer && window.BOOKS_DATABASE && !window.location.pathname.includes('book/') && !window.location.pathname.includes('news/')) {
            newBooksContainer.innerHTML = window.BOOKS_DATABASE.slice(0, 3).map((book, index) => {
                let parsedImages = []; try { parsedImages = typeof book.images === 'string' ? JSON.parse(book.images) : book.images; } catch(e) {}
                const imagePath = getDisplayUrl(parsedImages && parsedImages.length > 0 ? parsedImages[0] : 'default.jpg');
                const linkPath = basePath + 'book/details.html?id=' + book.id;
                const delay = (index + 1) * 100;
                
                return `
                <article class="book-item reveal-on-scroll delay-${delay}">
                    <div style="position: relative; border-radius: 8px; margin-bottom: 10px;">
                        <img src="${imagePath}" alt="${book.title}" class="book-cover-img" onerror="window.handleImgError(this)">
                    </div>
                    <h3 class="item-title">${book.title}</h3>
                    <p class="item-author">نویسنده: ${book.author}</p>
                    <div class="item-price">${toPersianNum(book.price)} تومان</div>
                    <a href="${linkPath}" class="btn-action">مشاهده و خرید</a>
                </article>`;
            }).join('');
        }

        // --- ۵. اخبار و رویدادها ---
        const newsContainers = document.querySelectorAll('#newsContainer, #newsGalleryContainer');
        if (newsContainers.length > 0 && window.NEWS_DATABASE) {
            newsContainers.forEach(container => {
                if (window.NEWS_DATABASE.length === 0) {
                    container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-body);">در حال حاضر خبری منتشر نشده است.</div>';
                } else {
                    const isHomePage = container.id === 'newsContainer';
                    const displayNews = isHomePage ? window.NEWS_DATABASE.slice(0, 3) : window.NEWS_DATABASE;
                    
                    container.innerHTML = displayNews.map((news, index) => {
                        const imagePath = getDisplayUrl(news.image);
                        const delay = isHomePage ? (index + 1) * 100 : 0;
                        const linkPath = basePath + 'news/details.html?id=' + news.id;
                        
                        return `
                        <a href="${linkPath}" class="news-card reveal-on-scroll delay-${delay}">
                            <div class="news-img-box">
                                <span class="news-date-badge">${toPersianNum(news.date)}</span>
                                <img src="${imagePath}" alt="${news.title}" onerror="window.handleImgError(this)">
                            </div>
                            <div class="news-content">
                                <h3 class="news-title">${news.title}</h3>
                                <p class="news-excerpt">${news.excerpt}</p>
                                <div class="news-read-more">مطالعه کامل خبر <span>←</span></div>
                            </div>
                        </a>
                        `;
                    }).join('');
                }
            });
        }

        // --- ۶. صفحه جزئیات خبر ---
        if (window.location.pathname.includes('news/details.html') && window.NEWS_DATABASE) {
            const urlParams = new URLSearchParams(window.location.search);
            const newsId = urlParams.get('id');
            const currentNews = window.NEWS_DATABASE.find(n => n.id === newsId);
            if (currentNews) {
                document.title = `نشر الیما | ${currentNews.title}`;
                
                const titleEl = document.getElementById('newsMainTitle');
                if (titleEl) titleEl.textContent = currentNews.title;
                
                const dateEl = document.getElementById('newsDate');
                if (dateEl) dateEl.textContent = toPersianNum(currentNews.date);
                const contentEl = document.getElementById('newsFullContent');
                
                if (contentEl) contentEl.innerHTML = currentNews.content ? currentNews.content.replace(/\n/g, '<br><br>') : '';
                
                const coverImg = document.getElementById('newsCoverImg');
                if (coverImg) {
                    coverImg.src = getDisplayUrl(currentNews.image);
                    coverImg.onerror = function() { window.handleImgError(this); };
                }
            } else {
                const container = document.querySelector('.news-details-page');
                if (container) {
                    container.innerHTML = `<div style="text-align: center; padding: 100px 20px;"><h1 style="color: var(--text-title); margin-bottom: 20px;">خبر مورد نظر یافت نشد!</h1><a href="index.html" class="btn-primary">بازگشت به لیست اخبار</a></div>`;
                }
            }
        }

        observeAnimations();
    };

    // ================= سیستم هوشمند نمایش اسکلتون لودینگ =================
    const showSkeletons = () => {
        const newBooksContainer = document.querySelector('.books-wrapper');
        if (newBooksContainer && !window.IS_DATA_READY && !window.location.pathname.includes('book/') && !window.location.pathname.includes('news/')) {
            newBooksContainer.innerHTML = Array(3).fill(`
                <article class="book-item" style="border: 1px solid var(--border-glass); box-shadow: none;">
                    <div class="skeleton-box" style="width: 100%; max-width: 180px; aspect-ratio: 2/3; margin: 0 auto 20px; border-radius: 8px;"></div>
                    <div class="skeleton-box" style="width: 70%; height: 24px; margin-bottom: 15px; border-radius: 6px;"></div>
                    <div class="skeleton-box" style="width: 40%; height: 18px; margin-bottom: 25px; border-radius: 6px;"></div>
                    <div class="skeleton-box" style="width: 100%; height: 46px; border-radius: 14px;"></div>
                </article>
            `).join('');
        }

        const newsContainers = document.querySelectorAll('#newsContainer, #newsGalleryContainer');
        newsContainers.forEach(container => {
            if (!window.IS_DATA_READY) {
                container.innerHTML = Array(3).fill(`
                    <div class="news-card" style="border: 1px solid var(--border-glass); box-shadow: none;">
                        <div class="news-img-box skeleton-box" style="border-radius: 0;"></div>
                        <div class="news-content">
                            <div class="skeleton-box" style="width: 90%; height: 22px; margin-bottom: 12px; border-radius: 6px;"></div>
                            <div class="skeleton-box" style="width: 100%; height: 14px; margin-bottom: 8px; border-radius: 4px;"></div>
                            <div class="skeleton-box" style="width: 80%; height: 14px; margin-bottom: 20px; border-radius: 4px;"></div>
                            <div class="skeleton-box" style="width: 40%; height: 18px; border-radius: 4px; margin-top: auto;"></div>
                        </div>
                    </div>
                `).join('');
            }
        });

        const galleryContainer = document.querySelector('.compact-book-gallery');
        if (galleryContainer && !window.IS_DATA_READY) {
            galleryContainer.innerHTML = Array(12).fill(`
                <div class="compact-card" style="width: 100%;">
                    <div class="skeleton-box" style="width: 100%; aspect-ratio: 2/3; border-radius: 8px; margin-bottom: 10px;"></div>
                    <div class="skeleton-box" style="width: 80%; height: 16px; border-radius: 4px; margin: 0 auto;"></div>
                </div>
            `).join('');
        }
    };

    if (window.IS_DATA_READY) { 
        initDynamicFeatures();
    } else { 
        showSkeletons(); 
        document.addEventListener('cloudDataLoaded', initDynamicFeatures);
    }

    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (scrollTopBtn) {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (window.scrollY > 400) scrollTopBtn.classList.add('visible'); else scrollTopBtn.classList.remove('visible');
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
        setTimeout(() => { mainImage.src = element.src; mainImage.style.opacity = '1'; }, 200);
        const thumbnails = document.querySelectorAll('.thumb-img');
        if (thumbnails.length > 0) { thumbnails.forEach(thumb => thumb.classList.remove('active-thumb')); element.classList.add('active-thumb'); }
    };
    
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.target !== '_blank' && link.host === window.location.host) {
            const hrefAttr = link.getAttribute('href');
            if (!hrefAttr.startsWith('#') && !link.hasAttribute('download') && !hrefAttr.startsWith('mailto:')) {
                e.preventDefault(); document.body.classList.add('fade-out'); 
                setTimeout(() => { window.location.href = link.href; }, 350); 
            }
        }
    });
    
    window.addEventListener('pageshow', (event) => { if (event.persisted) document.body.classList.remove('fade-out'); });
});
