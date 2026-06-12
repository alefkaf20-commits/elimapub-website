document.addEventListener('DOMContentLoaded', () => {
    
    // تابع اصلی مدیریت منو و تم سایت
    function initHeaderLogic() {
        const themeBtn = document.getElementById('themeBtn');
        const body = document.body;
        const burgerBtn = document.getElementById('burgerBtn');
        const mobileNav = document.getElementById('mobileNav');
        const closeMenuBtn = document.getElementById('closeMenuBtn');

        if (themeBtn) {
            // هماهنگ‌سازی اولیه وضعیت تم بر اساس لکال‌استوریج یا کلاس بادی
            const isDark = body.classList.contains('dark-theme') || localStorage.getItem('elima-theme') === 'dark';
            
            // اطمینان از اینکه اگر لکال استوریج دارک بود ولی کلاس بادی جا افتاده بود، کلاس اضافه شود
            if (isDark && !body.classList.contains('dark-theme')) {
                body.classList.add('dark-theme');
            }
            
            updateThemeIcon(isDark);

            themeBtn.addEventListener('click', () => {
                body.classList.toggle('dark-theme');
                const currentDark = body.classList.contains('dark-theme');
                localStorage.setItem('elima-theme', currentDark ? 'dark' : 'light');
                updateThemeIcon(currentDark);
            });
        }

        function updateThemeIcon(isDark) {
            const themeImg = document.getElementById('themeIconImg');
            if (!themeImg) return;
            
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
            if (!mobileNav || !burgerBtn) return;
            if(isOpen) {
                mobileNav.classList.add('active');
                burgerBtn.classList.add('open'); 
                body.classList.add('no-scroll');
            } else {
                mobileNav.classList.remove('active'); 
                burgerBtn.classList.remove('open'); 
                body.classList.remove('no-scroll');
            }
        }

        if (burgerBtn && closeMenuBtn && mobileNav) {
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
        }
    }

    // بررسی هوشمند ساختار صفحه: اگر تگ سفارشی هدر وجود دارد صبر کند، در غیر این صورت فوری اجرا شود
    if (document.querySelector('site-header')) {
        customElements.whenDefined('site-header').then(() => {
            initHeaderLogic();
        });
    } else {
        initHeaderLogic();
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
