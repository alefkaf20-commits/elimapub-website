document.addEventListener('DOMContentLoaded', () => {

    const isInsideBookFolder = window.location.pathname.includes('/book/');

    // ================= سیستم جستجوی دوگانه =================
    const searchInput = document.querySelector('.search-box input');
    const searchBoxForm = document.querySelector('.search-box');

    if (searchInput && searchBoxForm && typeof BOOKS_DATABASE !== 'undefined') {
        const liveDropdown = document.createElement('div');
        liveDropdown.className = 'live-search-dropdown';
        searchBoxForm.insertAdjacentElement('afterend', liveDropdown);

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

        const renderBooks = (filteredBooks, isLive) => {
            if (filteredBooks.length === 0) return `<div class="${isLive ? 'live-no-results' : 'search-no-results-full'}">کتابی پیدا نشد 🔍</div>`;
            
            return filteredBooks.map(book => {
                const coverImage = book.images && book.images.length > 0 ? book.images[0] : 'default.jpg';
                const imagePath = isInsideBookFolder ? `covers/${coverImage}` : `book/covers/${coverImage}`;
                const linkPath = isInsideBookFolder ? `details.html?id=${book.id}` : `book/details.html?id=${book.id}`;
                
                if (isLive) {
                    return `
                        <a href="${linkPath}" class="live-result-item">
                            <img src="${imagePath}" alt="${book.title}" class="live-result-img" onerror="this.src='${isInsideBookFolder ? '' : 'book/'}covers/default.jpg';">
                            <div class="live-result-info">
                                <h4>${book.title}</h4>
                                <p>${book.author}</p>
                            </div>
                        </a>
                    `;
                } else {
                    return `
                        <a href="${linkPath}" class="search-result-card">
                            <img src="${imagePath}" alt="${book.title}" onerror="this.src='${isInsideBookFolder ? '' : 'book/'}covers/default.jpg';">
                            <div class="search-result-info">
                                <h4>${book.title}</h4>
                                <p>نویسنده: ${book.author}</p>
                            </div>
                        </a>
                    `;
                }
            }).join('');
        };

        const performLiveSearch = (query) => {
            const cleanedQuery = query.trim().toLowerCase();
            if (!cleanedQuery) { liveDropdown.classList.remove('active'); liveDropdown.innerHTML = ''; return; }
            const filteredBooks = BOOKS_DATABASE.filter(book => book.title.toLowerCase().includes(cleanedQuery) || book.author.toLowerCase().includes(cleanedQuery));
            liveDropdown.innerHTML = renderBooks(filteredBooks.slice(0, 5), true);
            liveDropdown.classList.add('active');
        };

        const performFullSearch = (query) => {
            const cleanedQuery = query.trim().toLowerCase();
            searchQueryText.textContent = cleanedQuery ? cleanedQuery : 'همه آثار';
            const filteredBooks = BOOKS_DATABASE.filter(book => book.title.toLowerCase().includes(cleanedQuery) || book.author.toLowerCase().includes(cleanedQuery));
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

    // ================= تزریق داینامیک اطلاعات در صفحه جزئیات =================
    if (window.location.pathname.includes('details.html') && typeof BOOKS_DATABASE !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('id');
        const currentBook = BOOKS_DATABASE.find(b => b.id === bookId);

        if (currentBook) {
            document.getElementById('pageTitle').textContent = `نشر الیما | ${currentBook.title}`;
            document.getElementById('bookTitle').textContent = currentBook.title;
            document.getElementById('bookAuthor').textContent = currentBook.author;
            document.getElementById('bookPrice').textContent = currentBook.price;
            document.getElementById('bookPages').textContent = currentBook.pages + ' صفحه';
            document.getElementById('bookFormat').textContent = currentBook.format;
            document.getElementById('bookCoverType').textContent = currentBook.coverType;
            document.getElementById('bookPaperType').textContent = currentBook.paperType;
            document.getElementById('bookIsbn').textContent = currentBook.isbn;
            document.getElementById('bookYear').textContent = currentBook.year;
            document.getElementById('bookDesc').innerHTML = currentBook.desc;

            let badgesHTML = `<span class="badge-tag">${currentBook.printEdition}</span>`;
            if (currentBook.isBestseller) badgesHTML += `<span class="badge-tag highlight">پرفروش</span>`;
            document.getElementById('badgesContainer').innerHTML = badgesHTML;

            const mainImg = document.getElementById('mainBookImg');
            const thumbsContainer = document.getElementById('thumbnailsContainer');
            
            if (currentBook.images && currentBook.images.length > 0) {
                mainImg.src = `covers/${currentBook.images[0]}`;
                thumbsContainer.innerHTML = currentBook.images.map((img, index) => `
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

    // ================= کدهای دکمه اسکرول و فیلتر =================
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
