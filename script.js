document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('themeBtn');
    const body = document.body;
    const burgerBtn = document.getElementById('burgerBtn');
    const mobileNav = document.getElementById('mobileNav');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    updateThemeIcon(body.classList.contains('dark-theme'));

    themeBtn.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        const isDark = body.classList.contains('dark-theme');
        localStorage.setItem('elima-theme', isDark ? 'dark' : 'light');
        updateThemeIcon(isDark);
    });

    function updateThemeIcon(isDark) {
        const themeImg = document.getElementById('themeIconImg');
        if (!themeImg) return;
        
        // تشخیص مسیر فعلی عکس تا در پوشه‌های تو در تو به مشکل نخورد
        const currentSrc = themeImg.getAttribute('src');
        const basePath = currentSrc.substring(0, currentSrc.lastIndexOf('/') + 1);
        
        if(isDark) {
            themeImg.setAttribute('src', basePath + 'lightmode.png');
            themeBtn.style.background = 'rgba(255, 255, 255, 0.1)'; 
        } else {
            themeImg.setAttribute('src', basePath + 'darkmode.png');
            themeBtn.style.background = 'rgba(0, 0, 0, 0.05)'; 
        }
    }

    function toggleMenu(isOpen) {
        if(isOpen) {
            mobileNav.classList.add('active'); burgerBtn.classList.add('open'); body.classList.add('no-scroll');
        } else {
            mobileNav.classList.remove('active'); burgerBtn.classList.remove('open'); body.classList.remove('no-scroll');
        }
    }

    burgerBtn.addEventListener('click', () => toggleMenu(!mobileNav.classList.contains('active')));
    closeMenuBtn.addEventListener('click', () => toggleMenu(false));

    mobileNav.addEventListener('click', (e) => {
        if (e.target === mobileNav) toggleMenu(false);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
            toggleMenu(false);
        }
    });

    document.querySelectorAll('.mobile-nav a').forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });

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
        // سیستم فیلتر گالری کتاب‌ها
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (filterBtns.length > 0 && galleryItems.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // حذف کلاس active از همه دکمه‌ها و دادن آن به دکمه کلیک شده
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                // فیلتر کردن کارت‌ها
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
// عملکرد بهینه‌شده اسلایدر عکس
    window.changeImage = function(element) {
        const mainImage = document.getElementById('mainBookImg');
        
        // اگر عکسی که کلیک شده همان عکس اصلی است، هیچ کاری نکن (جلوگیری از باگ چشمک زدن)
        if (!mainImage || mainImage.src === element.src) return; 

        // اعمال افکت محو شدن
        mainImage.style.opacity = '0';
        
        // صبر برای اتمام محو شدن، سپس تغییر مسیر عکس
        setTimeout(() => {
            mainImage.src = element.src;
            mainImage.style.opacity = '1';
        }, 200); 

        // جابجایی کلاس قاب دور عکس‌های کوچک
        const thumbnails = document.querySelectorAll('.thumb-img');
        thumbnails.forEach(thumb => thumb.classList.remove('active-thumb'));
        element.classList.add('active-thumb');
    };
    // ================= سیستم جستجوی زنده کتاب‌ها =================
    
    // دیتابیس فرضی ما (شما باید کتاب‌های انتشارات را اینجا وارد کنید)
    const booksDatabase = [
        { title: "نوای دل", author: "هوشنگ اعتمادی گندمانی", url: "book/book1.html", image: "book/covers/navayedel.jpg" },
        { title: "برای شماره 13 ها", author: "علی قنواتی", url: "book/book2.html", image: "book/covers/barayeshomare13.jpg" },
        { title: "شعر معاصر", author: "نام شاعر", url: "book/book3.html", image: "book/covers/book3.jpg" },
        { title: "تاریخ جهان", author: "نام پژوهشگر", url: "book/book4.html", image: "book/covers/book4.jpg" }
    ];

    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', function() {
            // دریافت کلمه جستجو شده و حذف فاصله‌های اضافه قبل و بعدش
            const query = this.value.trim(); 
            
            // پاک کردن نتایج قبلی در باکس
            searchResults.innerHTML = '';
            
            // اگر کاربر کمتر از ۲ حرف تایپ کرده بود، باکس را مخفی کن
            if (query.length < 2) {
                searchResults.classList.add('hide');
                return;
            }

            // گشتن در دیتابیس (پیدا کردن بر اساس نام کتاب یا نام نویسنده)
            const filteredBooks = booksDatabase.filter(book => 
                book.title.includes(query) || book.author.includes(query)
            );

            // نمایش باکس نتایج
            searchResults.classList.remove('hide');

            if (filteredBooks.length > 0) {
                // اگر کتاب پیدا شد، آن‌ها را یکی‌یکی به باکس اضافه کن
                filteredBooks.forEach(book => {
                    const itemHtml = `
                        <a href="${book.url}" class="search-result-item">
                            <img src="${book.image}" alt="${book.title}" class="search-result-img">
                            <div class="search-result-info">
                                <h4>${book.title}</h4>
                                <p>نویسنده: ${book.author}</p>
                            </div>
                        </a>
                    `;
                    searchResults.insertAdjacentHTML('beforeend', itemHtml);
                });
            } else {
                // اگر هیچ کتابی مطابق با حروف تایپ شده نبود
                searchResults.innerHTML = '<div class="no-results">متأسفانه کتاب یا نویسنده‌ای با این عنوان یافت نشد.</div>';
            }
        });

        // برای اینکه وقتی کاربر جای دیگری از صفحه کلیک کرد، باکس جستجو بسته شود
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.add('hide');
            }
        });
    }
});
