const scriptTag = document.currentScript || document.querySelector('script[src*="layout.js"]');
const src = scriptTag.getAttribute('src');
const basePath = src.split('layout.js')[0];

class SiteHeader extends HTMLElement {
    connectedCallback() {
        const currentUrl = window.location.href;
        
        // تابع کمکی برای بررسی اینکه آیا لینک فعلی با آدرس صفحه تطابق دارد یا خیر
        const isActive = (path) => currentUrl.includes(path) ? 'style="color: var(--primary); font-weight: 800;"' : '';

        this.innerHTML = `
        <header>
            <div class="header-container">
                <div class="header-controls">
                    <button class="theme-switch" id="themeBtn" aria-label="تغییر تم سایت">
                        <img id="themeIconImg" src="${basePath}${localStorage.getItem('elima-theme') === 'dark' ? 'lightmode.png' : 'darkmode.png'}" alt="تغییر تم" width="24" height="24">
                    </button>
                </div>
                <div class="logo-area">
                    <a href="${basePath}index.html"><img src="${basePath}header_logo.png" alt="لوگو نشر الیما" width="130" height="48"></a>
                    <span class="dev-badge">نسخه آزمایشی</span>
                </div>
                <nav class="desktop-nav">
                    <ul class="nav-links">
                        <li><a href="${basePath}index.html">صفحه اصلی</a></li>
                        <li><a href="${basePath}book/index.html" ${isActive('book/index.html')}>کتاب‌ها</a></li>
                        <li><a href="${basePath}index.html#new-books">تازه‌های نشر</a></li>
                        <li><a href="${basePath}index.html#authors">شاعران و نویسندگان</a></li>
                        <li><a href="${basePath}about/index.html" ${isActive('about/index.html')}>درباره ما</a></li>
                        <li><a href="${basePath}index.html#contact">ارتباط با ما</a></li>
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
                <li><a href="${basePath}index.html">صفحه اصلی</a></li>
                <li><a href="${basePath}book/index.html" ${isActive('book/index.html')}>کتاب‌ها</a></li>
                <li><a href="${basePath}index.html#new-books">تازه‌های نشر</a></li>
                <li><a href="${basePath}index.html#authors">شاعران و نویسندگان</a></li>
                <li><a href="${basePath}about/index.html" ${isActive('about/index.html')}>درباره ما</a></li>
                <li><a href="${basePath}index.html#contact">ارتباط با ما</a></li>
            </ul>
        </nav>
        `;
    }
}

class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer id="contact">
            <div class="footer-grid">
                <div class="social-section">
                    <h3>شبکه‌های اجتماعی ما</h3>
                    <p>در شبکه‌های اجتماعی همراه ما باشید و از تازه‌های نشر و تخفیف‌ها مطلع شوید:</p>
                    <div class="social-icons">
                        <a href="#" class="social-btn">اینستاگرام</a>
                        <a href="#" class="social-btn">تلگرام</a>
                    </div>
                </div>
                <div class="quick-links">
                    <h3>لینک‌های سریع</h3>
                    <div class="quick-links-wrapper">
                        <a href="${basePath}index.html#new-books" class="quick-link-item"><span class="arrow">←</span> فروشگاه آنلاین</a>
                        <a href="#" class="quick-link-item"><span class="arrow">←</span> مراحل پذیرش آثار</a>
                    </div>
                </div>
                <div class="newsletter">
                    <h3>عضویت در خبرنامه</h3>
                    <form class="newsletter-box" onsubmit="event.preventDefault();">
                        <input type="email" placeholder="ایمیل شما..." required>
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
