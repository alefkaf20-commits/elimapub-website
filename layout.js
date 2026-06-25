const scriptTag = document.currentScript || document.querySelector('script[src*="layout.js"]');
const src = scriptTag.getAttribute('src');
const basePath = src.split('layout.js')[0];

class SiteHeader extends HTMLElement {
    connectedCallback() {
        const isDark = document.body.classList.contains('dark-theme') || localStorage.getItem('elima-theme') === 'dark';

        this.innerHTML = `
        <header>
            <div class="header-container">
                <div class="header-controls">
                    <button class="theme-switch" id="themeBtn" aria-label="تغییر تم سایت">
                        <img id="themeIconImg" src="${basePath}${isDark ? 'lightmode.png' : 'darkmode.png'}" alt="تغییر تم" width="24" height="24">
                    </button>
                </div>
                <div class="logo-area">
                    <a href="${basePath}index.html"><img src="${basePath}header_logo.png" alt="لوگو نشر الیما" width="130" height="48"></a>
                    <span class="dev-badge">نسخه آزمایشی</span>
                </div>
                <nav class="desktop-nav">
                    <ul class="nav-links">
                        <li><a href="${basePath}index.html" class="nav-item-link">صفحه اصلی</a></li>
                        <li><a href="#" class="nav-item-link">ورود</a></li>
                        <li><a href="${basePath}book/index.html" class="nav-item-link">کتاب‌ها</a></li>
                        <li><a href="${basePath}news/index.html" class="nav-item-link">اخبار و رویدادها</a></li>
                        <li><a href="${basePath}about/index.html" class="nav-item-link">درباره ما</a></li>
                        <li><a href="${basePath}contact/index.html" class="nav-item-link">ارتباط با ما</a></li>
                    </ul>
                </nav>
                <div class="burger-wrapper">
                    <button class="burger-menu" id="burgerBtn" aria-label="منوی سایت">
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </div>
        </header>

        <nav class="mobile-nav" id="mobileNav">
            <button class="close-menu-btn" id="closeMenuBtn">✕ برگشت</button>
            <ul class="nav-links">
                <li><a href="${basePath}index.html" class="nav-item-link">صفحه اصلی</a></li>
                <li><a href="#" class="nav-item-link">ورود</a></li>
                <li><a href="${basePath}book/index.html" class="nav-item-link">کتاب‌ها</a></li>
                <li><a href="${basePath}news/index.html" class="nav-item-link">اخبار و رویدادها</a></li>
                <li><a href="${basePath}about/index.html" class="nav-item-link">درباره ما</a></li>
                <li><a href="${basePath}contact/index.html" class="nav-item-link">ارتباط با ما</a></li>
            </ul>
        </nav>
        `;

        const currentUrl = new URL(window.location.href);
        const currentPath = currentUrl.pathname.endsWith('/') ? currentUrl.pathname + 'index.html' : currentUrl.pathname;
        const currentHash = currentUrl.hash;
        
        const navLinks = this.querySelectorAll('.nav-item-link');
        navLinks.forEach(link => {
            try {
                const hrefAttr = link.getAttribute('href');
                if (!hrefAttr || hrefAttr === '#' || hrefAttr.startsWith('#')) return;

                const linkUrl = new URL(link.href, window.location.href);
                const linkPath = linkUrl.pathname.endsWith('/') ? linkUrl.pathname + 'index.html' : linkUrl.pathname;
                const linkHash = linkUrl.hash;

                if (currentPath === linkPath) {
                    if (linkHash) {
                        if (currentHash === linkHash) link.classList.add('active-page');
                    } else {
                        if (!currentHash) link.classList.add('active-page');
                    }
                }
            } catch (e) {}
        });

        const themeBtn = this.querySelector('#themeBtn');
        const themeIconImg = this.querySelector('#themeIconImg');
        const burgerBtn = this.querySelector('#burgerBtn');
        const mobileNav = this.querySelector('#mobileNav');
        const closeMenuBtn = this.querySelector('#closeMenuBtn');
        const body = document.body;

        const updateThemeIcon = (dark) => {
            if (!themeIconImg) return;
            themeIconImg.setAttribute('src', `${basePath}${dark ? 'lightmode.png' : 'darkmode.png'}`);
            themeBtn.style.background = dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
        };

        if (themeBtn) {
            updateThemeIcon(isDark);
            
            themeBtn.addEventListener('click', () => {
                const switchTheme = () => {
                    body.classList.toggle('dark-theme');
                    const currentDark = body.classList.contains('dark-theme');
                    localStorage.setItem('elima-theme', currentDark ? 'dark' : 'light');
                    updateThemeIcon(currentDark);
                };

                if (!document.startViewTransition) {
                    switchTheme();
                } else {
                    document.startViewTransition(switchTheme);
                }
            });
        }

        const toggleMenu = (isOpen) => {
            if (!mobileNav || !burgerBtn) return;
            if (isOpen) {
                mobileNav.classList.add('active');
                burgerBtn.classList.add('open');
                body.classList.add('no-scroll');
            } else {
                mobileNav.classList.remove('active');
                burgerBtn.classList.remove('open');
                body.classList.remove('no-scroll');
            }
        };

        if (burgerBtn && closeMenuBtn && mobileNav) {
            burgerBtn.addEventListener('click', () => toggleMenu(!mobileNav.classList.contains('active')));
            closeMenuBtn.addEventListener('click', () => toggleMenu(false));
            mobileNav.addEventListener('click', (e) => { if (e.target === mobileNav) toggleMenu(false); });
        }

        const headerEl = this.querySelector('header');
        window.addEventListener('scroll', () => {
            if (!headerEl) return;
            if (window.scrollY > 50) {
                headerEl.classList.add('header-scrolled');
            } else {
                headerEl.classList.remove('header-scrolled');
            }
        }, { passive: true });
    }
}

class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer>
            <div class="footer-grid">
                <div class="social-section">
                    <h3>شبکه‌های اجتماعی ما</h3>
                    <p>با دنبال کردن ما، از تازه‌های نشر اِلیما و تخفیف‌های ویژه جا نمانید:</p>
                    <div class="social-icons compact">
                        <a href="https://www.instagram.com/elima.pub?igsh=MWFnbjllMGZndGUxdQ==" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="اینستاگرام">
                            <img src="${basePath}instaicon.svg" alt="اینستاگرام">
                        </a>
                        <a href="https://t.me/elimapub" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="تلگرام">
                            <img src="${basePath}teleicon.svg" alt="تلگرام">
                        </a>
                    </div>
                </div>
                <div class="quick-links">
                    <h3>لینک‌های سریع</h3>
                    <div class="quick-links-wrapper">
                        <a href="${basePath}book/index.html" class="quick-link-item"><span class="arrow">←</span> فروشگاه آنلاین</a>
                        <a href="${basePath}contact/index.html" class="quick-link-item"><span class="arrow">←</span> مراحل پذیرش آثار</a>
                    </div>
                </div>
                <div class="newsletter">
                    <h3>عضویت در خبرنامه</h3>
                    <form class="newsletter-box" onsubmit="event.preventDefault();">
                        <input type="email" placeholder="آدرس ایمیل شما..." required>
                        <button type="submit">ثبت</button>
                    </form>
                </div>
            </div>
            <div class="bottom-bar">
                <p>تمامی حقوق مادی و معنوی برای <strong>نشر اِلیما</strong> محفوظ است. ۱۴۰۵</p>
            </div>
        </footer>
        `;
    }
}

customElements.define('site-header', SiteHeader);
customElements.define('site-footer', SiteFooter);
