// تشخیص خودکار و هوشمند مسیر ریشه سایت بر اساس محل قرارگیری layout.js
const scriptTag = document.currentScript || document.querySelector('script[src*="layout.js"]');
const src = scriptTag.getAttribute('src');
// با این کار هر چقدر مسیر تو در تو باشد (مثل ../../ یا ../../../) دقیقاً همان استخراج می‌شود
const basePath = src.split('layout.js')[0];
// ================= قالب هدر و منوها =================
class SiteHeader extends HTMLElement {
    connectedCallback() {
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
                        <li><a href="${basePath}book/index.html">کتاب‌ها</a></li>
                        <li><a href="${basePath}index.html#new-books">تازه‌های نشر</a></li>
                        <li><a href="${basePath}index.html#authors">شاعران و نویسندگان</a></li>
                        <li><a href="${basePath}about/index.html">درباره ما</a></li>
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
                <li><a href="${basePath}book/index.html">کتاب‌ها</a></li>
                <li><a href="${basePath}index.html#new-books">تازه‌های نشر</a></li>
                <li><a href="${basePath}index.html#authors">شاعران و نویسندگان</a></li>
                <li><a href="${basePath}about/index.html">درباره ما</a></li>
                <li><a href="${basePath}index.html#contact">ارتباط با ما</a></li>
            </ul>
        </nav>
        `;

        // ================= کدهای جدید: روشن شدن گزینه فعال در منو =================
        const currentUrl = window.location.href;
        const navLinks = this.querySelectorAll('.nav-links a');

        navLinks.forEach(link => {
            const linkHref = link.href;

            // بررسی ۱: آیا کاربر در پوشه کتاب‌ها است؟ (حتی اگر داخل صفحه یک کتاب خاص باشد)
            if (currentUrl.includes('/book/')) {
                if (linkHref.includes('/book/')) {
                    link.style.color = 'var(--primary)';
                }
            }
            // بررسی ۲: آیا کاربر در صفحه درباره ما است؟
            else if (currentUrl.includes('/about/')) {
                if (linkHref.includes('/about/')) {
                    link.style.color = 'var(--primary)';
                }
            }
            // بررسی ۳: آیا کاربر در صفحه اصلی است؟
            else if ((currentUrl.endsWith('/') || currentUrl.endsWith('index.html')) && !currentUrl.includes('/book/') && !currentUrl.includes('/about/')) {
                // فقط گزینه "صفحه اصلی" را رنگی کن
                if (linkHref.endsWith('index.html') && !linkHref.includes('/book/') && !linkHref.includes('/about/')) {
                    link.style.color = 'var(--primary)';
                }
            }
        });
    }
}

// ================= قالب فوتر =================
class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer id="contact">
            <div class="footer-grid">
                <div class="social-section">
                    <h3>شبکه‌های اجتماعی ما</h3>
                    <p>در شبکه‌های اجتماعی همراه ما باشید:</p>
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

// معرفی این تگ‌های جدید به مرورگر
customElements.define('site-header', SiteHeader);
customElements.define('site-footer', SiteFooter);
