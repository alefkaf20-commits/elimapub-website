document.addEventListener('DOMContentLoaded', () => {
    
    // حل مشکل تداخل جاوااسکریپت و کامپوننت هدر
    customElements.whenDefined('site-header').then(() => {
        const themeBtn = document.getElementById('themeBtn');
        const body = document.body;
        const burgerBtn = document.getElementById('burgerBtn');
        const mobileNav = document.getElementById('mobileNav');
        const closeMenuBtn = document.getElementById('closeMenuBtn');

        // اطمینان از وجود دکمه‌ها قبل از اعمال رویدادها
        if (themeBtn) {
            updateThemeIcon(body.classList.contains('dark-theme'));

            themeBtn.addEventListener('click', () => {
                body.classList.toggle('dark-theme');
                const isDark = body.classList.contains('dark-theme');
                localStorage.setItem('elima-theme', isDark ? 'dark' : 'light');
                updateThemeIcon(isDark);
            });
        }

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
    });

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

    // ================= عملکرد بهینه‌شده اسلایدر عکس =================
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
        if (thumbnails.length > 0) {
            thumbnails.forEach(thumb => thumb.classList.remove('active-thumb'));
            element.classList.add('active-thumb');
        }
    };

});
