// ================= سیستم هوشمند و سراسری مدیریت خطای تصاویر =================
const DEFAULT_COVER = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300' fill='%23f1f5f9'%3E%3Crect width='200' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='16' fill='%2394a3b8' text-anchor='middle' dominant-baseline='middle'%3Eبدون تصویر%3C/text%3E%3C/svg%3E";

window.handleImgError = function(img) {
    if (!img.dataset.retried) {
        img.dataset.retried = 'true';
        const originalSrc = img.src.split('?')[0];
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        setTimeout(() => { img.src = originalSrc + '?retry=' + Date.now(); }, 1000);
    } else {
        if (img.src !== DEFAULT_COVER) { img.onerror = null; img.src = DEFAULT_COVER; }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_STORAGE_BASE = 'https://dgdxxzwgqlhepvchfigh.supabase.co/storage/v1/object/public/covers/';
    let ALL_MEDIA_FILES = [];

    // ================= پاپ‌آپ اطلاع‌رسانی =================
    function showToast(message, type = 'success', duration = 3000) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div'); container.id = 'toastContainer'; container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div'); toast.className = `toast-msg ${type}`;
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        toast.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-text">${message}</div><div class="toast-progress" style="animation-duration: ${duration}ms;"></div>`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, duration);
    }

    // ================= تاییدیه اختصاصی =================
    const confirmModal = document.getElementById('customConfirmModal');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');

    function showConfirmDialog(title, message, onConfirmCallback) {
        if (!confirmModal) return;
        confirmTitle.innerText = title; confirmMessage.innerText = message; confirmModal.classList.add('active');
        const newOkBtn = confirmOkBtn.cloneNode(true); const newCancelBtn = confirmCancelBtn.cloneNode(true);
        confirmOkBtn.parentNode.replaceChild(newOkBtn, confirmOkBtn); confirmCancelBtn.parentNode.replaceChild(newCancelBtn, confirmCancelBtn);
        newCancelBtn.addEventListener('click', () => confirmModal.classList.remove('active'));
        newOkBtn.addEventListener('click', () => { confirmModal.classList.remove('active'); onConfirmCallback(); });
    }

    // ================= توابع پایه و تم =================
    const themeBtn = document.getElementById('adminThemeBtn');
    const updateThemeIcon = (isDark) => { if(themeBtn) themeBtn.innerText = isDark ? '☀️' : '🌙'; };
    if (themeBtn) {
        updateThemeIcon(document.body.classList.contains('dark-theme'));
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('elima-theme', isDark ? 'dark' : 'light'); updateThemeIcon(isDark);
        });
    }

    function toPersianNum(num) {
        if (num === null || num === undefined) return '';
        const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, x => farsiDigits[x]);
    }
    function toEnglishNum(str) {
        if (!str && str !== 0) return '';
        const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
        let result = str.toString();
        for (let i = 0; i < 10; i++) result = result.replace(persianDigits[i], i);
        return result;
    }
    function getDisplayUrl(rawImg) {
        if (!rawImg || rawImg === 'default.jpg' || rawImg === '') return DEFAULT_COVER;
        return rawImg.startsWith('http') ? rawImg : SUPABASE_STORAGE_BASE + encodeURI(rawImg);
    }

    // ================= تب‌ها و منو =================
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const sections = document.querySelectorAll('.admin-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); const targetId = item.getAttribute('data-target');
            navItems.forEach(nav => nav.classList.remove('active')); item.classList.add('active');
            sections.forEach(sec => {
                if(sec.id === targetId) { sec.style.display = 'block'; if (targetId === 'section-media') loadMediaGallery(); } 
                else { sec.style.display = 'none'; }
            });
        });
    });

    // ================= دکمه‌های رفرش =================
    const refreshBooksBtn = document.getElementById('refreshBooksBtn');
    if(refreshBooksBtn) refreshBooksBtn.addEventListener('click', async () => {
        showToast('در حال تازه‌سازی کتاب‌ها...', 'info', 1500);
        const { data, error } = await supabaseClient.from('books').select('*');
        if (!error && data) { window.BOOKS_DATABASE = data; renderAdminTable(); showToast('کتاب‌ها به‌روز شدند', 'success'); }
    });

    const refreshNewsBtn = document.getElementById('refreshNewsBtn');
    if(refreshNewsBtn) refreshNewsBtn.addEventListener('click', async () => {
        showToast('در حال تازه‌سازی اخبار...', 'info', 1500);
        const { data, error } = await supabaseClient.from('news').select('*').order('created_at', { ascending: false });
        if (!error && data) { window.NEWS_DATABASE = data; renderNewsTable(); showToast('اخبار به‌روز شدند', 'success'); }
    });

    const refreshMediaBtn = document.getElementById('refreshMediaBtn');
    if(refreshMediaBtn) refreshMediaBtn.addEventListener('click', () => { showToast('در حال تازه‌سازی گالری...', 'info', 1500); loadMediaGallery(); });

    // ================= ورود و احراز هویت =================
    const loginOverlay = document.getElementById('loginOverlay');
    const loginForm = document.getElementById('loginForm');
    const mainAdminLayout = document.getElementById('mainAdminLayout');
    const loginBtn = document.getElementById('loginBtn');

    async function checkAuth() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            if(loginOverlay) loginOverlay.style.opacity = '0';
            setTimeout(() => { if(loginOverlay) loginOverlay.style.visibility = 'hidden'; if(mainAdminLayout) { mainAdminLayout.style.opacity = '1'; mainAdminLayout.style.visibility = 'visible'; } }, 300);
            renderAdminTable(); 
            renderNewsTable();
        } else {
            if(loginOverlay) { loginOverlay.style.visibility = 'visible'; loginOverlay.style.opacity = '1'; }
            if(mainAdminLayout) mainAdminLayout.style.opacity = '0';
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value; const password = document.getElementById('adminPassword').value;
            if(loginBtn) { loginBtn.innerText = 'در حال بررسی...'; loginBtn.style.pointerEvents = 'none'; }
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if(loginBtn) { loginBtn.innerText = 'ورود به سیستم'; loginBtn.style.pointerEvents = 'auto'; }
            if (error) { showToast('ایمیل یا رمز عبور اشتباه است!', 'error'); } 
            else { showToast('ورود موفقیت‌آمیز بود', 'success'); checkAuth(); }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', async () => { await supabaseClient.auth.signOut(); window.location.reload(); });

    // ================= گالری تصاویر =================
    async function loadMediaGallery() {
        const grid = document.getElementById('mainMediaGrid');
        if (!grid) return;
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px;">در حال دریافت تصاویر... 🔄</div>';
        try {
            const { data, error } = await supabaseClient.storage.from('covers').list('', { limit: 2000, sortBy: { column: 'created_at', order: 'desc' } });
            if (error) throw error;
            if (!data || data.length === 0 || (data.length === 1 && data[0].name === '.emptyFolderPlaceholder')) {
                grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px;">هیچ عکسی در دیتابیس یافت نشد.</div>'; return;
            }
            ALL_MEDIA_FILES = data.filter(f => f.name !== '.emptyFolderPlaceholder');
            renderCategorizedGallery(); 
        } catch (error) { grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: red;">خطا: ${error.message}</div>`; }
    }

    const mediaSearchInput = document.getElementById('mediaSearchInput');
    const mediaSortSelect = document.getElementById('mediaSortSelect');
    
    function renderCategorizedGallery() {
        const grid = document.getElementById('mainMediaGrid'); if (!grid) return;
        let filteredFiles = [...ALL_MEDIA_FILES];
        const searchTerm = (mediaSearchInput?.value || '').trim().toLowerCase();
        if (searchTerm) filteredFiles = filteredFiles.filter(f => f.name.toLowerCase().includes(searchTerm));
        const sortType = mediaSortSelect?.value || 'newest';
        if (sortType === 'newest') filteredFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        else if (sortType === 'oldest') filteredFiles.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        else if (sortType === 'az') filteredFiles.sort((a, b) => a.name.localeCompare(b.name));

        if (filteredFiles.length === 0) { grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-body);">هیچ تصویری پیدا نشد 🔍</div>'; return; }

        const groupedFiles = {};
        filteredFiles.forEach(f => {
            const formatter = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' });
            const groupName = formatter.format(new Date(f.created_at));
            if (!groupedFiles[groupName]) groupedFiles[groupName] = []; groupedFiles[groupName].push(f);
        });

        let html = '';
        for (const [groupName, files] of Object.entries(groupedFiles)) {
            html += `<div class="media-group">`;
            if(!searchTerm) html += `<div class="media-group-title">📁 آپلودهای ${groupName} <span style="font-size:0.8rem; opacity:0.8;">(${toPersianNum(files.length)} عکس)</span></div>`;
            html += `<div class="media-grid">`;
            html += files.map(file => {
                const publicUrl = SUPABASE_STORAGE_BASE + encodeURI(file.name);
                return `
                    <div class="media-card">
                        <img src="${publicUrl}" loading="lazy" onerror="window.handleImgError(this)">
                        <div class="media-overlay">
                            <span class="media-name">${file.name}</span>
                            <div class="media-actions">
                                <button type="button" class="media-btn" onclick="renameMediaFile('${file.name}')">✏️ تغییر نام</button>
                                <button type="button" class="media-btn btn-danger" onclick="deleteMediaFile('${file.name}')">🗑️ حذف</button>
                            </div>
                        </div>
                    </div>`;
            }).join('');
            html += `</div></div>`;
        }
        grid.innerHTML = html;
    }

    if (mediaSearchInput) mediaSearchInput.addEventListener('input', renderCategorizedGallery);
    if (mediaSortSelect) mediaSortSelect.addEventListener('change', renderCategorizedGallery);

    const uploadInput = document.getElementById('mediaGalleryUploadInput');
    if (uploadInput) uploadInput.addEventListener('change', async (e) => {
        const files = e.target.files; if (files.length === 0) return;
        showToast('در حال آپلود تصاویر... صبور باشید ⏳', 'info', 4000);
        try {
            const uploadPromises = Array.from(files).map(file => {
                const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
                const finalName = `${Date.now()}-${safeName}`;
                return supabaseClient.storage.from('covers').upload(finalName, file);
            });
            const results = await Promise.all(uploadPromises);
            const errorResult = results.find(r => r.error); if (errorResult) throw errorResult.error;
            showToast('آپلود با موفقیت انجام شد! 🚀', 'success'); loadMediaGallery(); 
        } catch (error) { showToast('خطا در آپلود: ' + error.message, 'error'); }
        e.target.value = ''; 
    });

    window.renameMediaFile = async (oldName) => {
        const newName = prompt("نام جدید فایل را بدون پسوند وارد کنید:", oldName.split('.')[0]);
        if (!newName || newName.trim() === '') return;
        const ext = oldName.split('.').pop(); const fullNewName = `${newName.replace(/[^a-zA-Z0-9\-_]/g, '')}.${ext}`;
        if (fullNewName === oldName) return;
        try {
            const { error } = await supabaseClient.storage.from('covers').move(oldName, fullNewName);
            if (error) throw error;
            showToast('تغییر نام انجام شد ✏️', 'success'); loadMediaGallery();
        } catch (error) { showToast('خطا: ' + error.message, 'error'); }
    };

    window.deleteMediaFile = (fileName) => {
        showConfirmDialog('حذف تصویر', `آیا از حذف دائمی تصویر "${fileName}" مطمئن هستید؟`, async () => {
            try {
                const { error } = await supabaseClient.storage.from('covers').remove([fileName]);
                if (error) throw error;
                showToast('تصویر حذف شد 🗑️', 'success'); loadMediaGallery();
            } catch (error) { showToast('خطا در حذف تصویر: ' + error.message, 'error'); }
        });
    };

    // ================= موتور هوشمند انتخابگر تصویر (برای کتاب‌ها و اخبار) =================
    let imageSelectorTarget = 'book'; // 'book' or 'news'
    let currentSelectedBookImages = [];
    let currentSelectedNewsImage = ''; // خبر فقط یک کاور دارد

    const imageSelectorModal = document.getElementById('imageSelectorModal');
    const openImageSelectorBtn = document.getElementById('openImageSelectorBtn'); // برای کتاب
    const openNewsImageSelectorBtn = document.getElementById('openNewsImageSelectorBtn'); // برای خبر
    const closeSelectorBtn = document.getElementById('closeSelectorBtn');
    const selectorMediaGrid = document.getElementById('selectorMediaGrid');
    
    const selectedImagesPreview = document.getElementById('selectedImagesPreview');
    const newsSelectedImagePreview = document.getElementById('newsSelectedImagePreview');

    function updatePreviewUI() {
        if (selectedImagesPreview) {
            if (currentSelectedBookImages.length === 0) {
                selectedImagesPreview.innerHTML = '<span style="color: var(--text-body); font-size: 0.9rem;">هیچ تصویری انتخاب نشده است.</span>';
            } else {
                selectedImagesPreview.innerHTML = currentSelectedBookImages.map((rawUrl, index) => {
                    const displayUrl = getDisplayUrl(rawUrl);
                    return `<div class="preview-img-box"><img src="${displayUrl}" onerror="window.handleImgError(this)"><button type="button" class="remove-img-btn" onclick="removeSelectedBookImage(${index})">✕</button></div>`;
                }).join('');
            }
        }
        
        if (newsSelectedImagePreview) {
            if (!currentSelectedNewsImage) {
                newsSelectedImagePreview.innerHTML = '<span style="color: var(--text-body); font-size: 0.9rem;">کاور خبر انتخاب نشده است.</span>';
            } else {
                const displayUrl = getDisplayUrl(currentSelectedNewsImage);
                newsSelectedImagePreview.innerHTML = `<div class="preview-img-box"><img src="${displayUrl}" onerror="window.handleImgError(this)"><button type="button" class="remove-img-btn" onclick="removeSelectedNewsImage()">✕</button></div>`;
            }
        }
    }

    window.removeSelectedBookImage = (index) => { currentSelectedBookImages.splice(index, 1); updatePreviewUI(); };
    window.removeSelectedNewsImage = () => { currentSelectedNewsImage = ''; updatePreviewUI(); };

    window.toggleImageSelection = (url, element) => {
        if (imageSelectorTarget === 'book') {
            const index = currentSelectedBookImages.indexOf(url);
            if (index === -1) { currentSelectedBookImages.push(url); element.classList.add('selected'); element.querySelector('span').innerText = 'انتخاب شد ✔️'; } 
            else { currentSelectedBookImages.splice(index, 1); element.classList.remove('selected'); element.querySelector('span').innerText = 'انتخاب ➕'; }
            updatePreviewUI();
        } else {
            // برای اخبار (تک عکس)
            currentSelectedNewsImage = url;
            document.querySelectorAll('#selectorMediaGrid .selector-img-box').forEach(box => {
                box.classList.remove('selected'); box.querySelector('span').innerText = 'انتخاب ➕';
            });
            element.classList.add('selected');
            element.querySelector('span').innerText = 'انتخاب شد ✔️';
            updatePreviewUI();
            
            // در حالت انتخاب خبر، مودال خودش بسته میشه تا کاربر اذیت نشه
            setTimeout(() => { if (imageSelectorModal) imageSelectorModal.classList.remove('active'); }, 400);
        }
    };

    const openModalForTarget = async (target) => {
        imageSelectorTarget = target;
        if(imageSelectorModal) imageSelectorModal.classList.add('active');
        if(selectorMediaGrid) selectorMediaGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center;">در حال دریافت تصاویر...</div>';
        try {
            const { data, error } = await supabaseClient.storage.from('covers').list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
            if (error) throw error;
            const validFiles = data.filter(f => f.name !== '.emptyFolderPlaceholder');
            if(selectorMediaGrid) {
                selectorMediaGrid.innerHTML = validFiles.map(file => {
                    const publicUrl = SUPABASE_STORAGE_BASE + encodeURI(file.name);
                    let isSelected = false;
                    if (target === 'book') isSelected = currentSelectedBookImages.includes(publicUrl);
                    else isSelected = (currentSelectedNewsImage === publicUrl);
                    
                    return `
                        <div class="media-card selector-img-box ${isSelected ? 'selected' : ''}" onclick="toggleImageSelection('${publicUrl}', this)">
                            <img src="${publicUrl}" loading="lazy" onerror="window.handleImgError(this)">
                            <div class="media-overlay"><span style="color:white; font-weight:bold; font-size: 1.1rem;">${isSelected ? 'انتخاب شد ✔️' : 'انتخاب ➕'}</span></div>
                        </div>`;
                }).join('');
            }
        } catch (error) { if(selectorMediaGrid) selectorMediaGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: red;">خطا: ${error.message}</div>`; }
    };

    if (openImageSelectorBtn) openImageSelectorBtn.addEventListener('click', (e) => { e.preventDefault(); openModalForTarget('book'); });
    if (openNewsImageSelectorBtn) openNewsImageSelectorBtn.addEventListener('click', (e) => { e.preventDefault(); openModalForTarget('news'); });
    if (closeSelectorBtn) closeSelectorBtn.addEventListener('click', (e) => { e.preventDefault(); if(imageSelectorModal) imageSelectorModal.classList.remove('active'); });


    // ================= فرم مدیریت کتاب =================
    const bookModal = document.getElementById('bookModal');
    const addNewBookBtn = document.getElementById('addNewBookBtn');
    const closeBookModalBtn = document.getElementById('closeModalBtn');
    const bookForm = document.getElementById('bookForm');
    let editingBookId = null;

    if (addNewBookBtn) addNewBookBtn.addEventListener('click', () => {
        editingBookId = null; if(bookForm) bookForm.reset(); currentSelectedBookImages = []; updatePreviewUI();
        document.getElementById('modalMainTitle').innerText = 'افزودن کتاب جدید';
        document.getElementById('newId').readOnly = false; document.getElementById('submitBtn').innerText = 'ذخیره در دیتابیس';
        if(bookModal) bookModal.classList.add('active');
    });

    if (closeBookModalBtn) closeBookModalBtn.addEventListener('click', () => { if(bookModal) bookModal.classList.remove('active'); });

    function renderAdminTable() {
        const tableBody = document.getElementById('adminBooksTableBody');
        const totalBooksCount = document.getElementById('totalBooksCount');
        if (!tableBody) return;
        if (!window.BOOKS_DATABASE || window.BOOKS_DATABASE.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px;">هیچ اثری در دیتابیس یافت نشد.</td></tr>`;
            if(totalBooksCount) totalBooksCount.innerText = toPersianNum(0); return;
        }
        if(totalBooksCount) totalBooksCount.innerText = toPersianNum(window.BOOKS_DATABASE.length);
        tableBody.innerHTML = window.BOOKS_DATABASE.map(book => {
            let parsedImages = []; try { parsedImages = typeof book.images === 'string' ? JSON.parse(book.images) : book.images; } catch(e) {}
            const imageSrc = getDisplayUrl(parsedImages && parsedImages.length > 0 ? parsedImages[0] : 'default.jpg');
            return `
                <tr>
                    <td class="thumb-td"><img src="${imageSrc}" onerror="window.handleImgError(this)"></td>
                    <td><strong>${book.title}</strong></td>
                    <td>${book.author}</td>
                    <td>${toPersianNum(book.price)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action-sm btn-edit" onclick="openEditModal('${book.id}')">ویرایش</button>
                            <button class="btn-action-sm btn-delete" onclick="deleteBookFromCloud('${book.id}')">حذف</button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    }

    window.openEditModal = (id) => {
        const book = window.BOOKS_DATABASE.find(b => b.id === id); if (!book) return;
        editingBookId = id;
        document.getElementById('modalMainTitle').innerText = 'ویرایش اطلاعات کتاب'; document.getElementById('submitBtn').innerText = 'به‌روزرسانی اطلاعات';
        const setVal = (elId, val) => { const el = document.getElementById(elId); if(el) el.value = val; };
        
        setVal('newId', book.id); document.getElementById('newId').readOnly = true; 
        setVal('newTitle', book.title || ''); setVal('newAuthor', book.author || ''); setVal('newPrice', book.price || '');
        setVal('newCategory', book.category || 'literature'); setVal('newPages', book.pages || ''); setVal('newFormat', book.format || '');
        setVal('newCoverType', book.covertype || book.coverType || ''); setVal('newPaperType', book.papertype || book.paperType || '');
        setVal('newYear', book.year || ''); setVal('newIsbn', book.isbn || ''); setVal('newDesc', book.desc || '');
        setVal('newPrintEdition', book.printedition || book.printEdition || '');
        const isBs = document.getElementById('newIsBestseller'); if(isBs) isBs.checked = book.isbestseller || book.isBestseller || false;

        let parsedImages = []; try { parsedImages = typeof book.images === 'string' ? JSON.parse(book.images) : book.images; } catch(e) {}
        currentSelectedBookImages = [...parsedImages]; updatePreviewUI();
        if(bookModal) bookModal.classList.add('active');
    };

    if (bookForm) bookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submitBtn');
        if(submitBtn) { submitBtn.innerText = 'در حال ذخیره‌سازی...'; submitBtn.style.pointerEvents = 'none'; }
        const cleanEnglishPages = parseInt(toEnglishNum(document.getElementById('newPages') ? document.getElementById('newPages').value : '')) || 0;

        try {
            const finalImages = currentSelectedBookImages.length > 0 ? currentSelectedBookImages : ["default.jpg"];
            const getVal = (elId) => document.getElementById(elId) ? document.getElementById(elId).value.trim() : '';

            const bookData = {
                id: getVal('newId'), title: getVal('newTitle'), author: getVal('newAuthor'), price: getVal('newPrice'), category: getVal('newCategory'),
                pages: cleanEnglishPages, format: getVal('newFormat'), covertype: getVal('newCoverType'), papertype: getVal('newPaperType'),
                year: getVal('newYear'), isbn: getVal('newIsbn'), desc: getVal('newDesc'), printedition: getVal('newPrintEdition'),
                isbestseller: document.getElementById('newIsBestseller') ? document.getElementById('newIsBestseller').checked : false, images: JSON.stringify(finalImages) 
            };

            if (editingBookId) {
                const { error } = await supabaseClient.from('books').update(bookData).eq('id', editingBookId); if (error) throw error;
                const index = window.BOOKS_DATABASE.findIndex(b => b.id === editingBookId);
                if(index !== -1) window.BOOKS_DATABASE[index] = { ...window.BOOKS_DATABASE[index], ...bookData };
                showToast('✨ کتاب با موفقیت ویرایش شد.', 'success');
            } else {
                const { error } = await supabaseClient.from('books').insert([bookData]); if (error) throw error;
                window.BOOKS_DATABASE.push(bookData); showToast('🔥 کتاب جدید اضافه شد!', 'success');
            }
            renderAdminTable(); if(bookModal) bookModal.classList.remove('active');
        } catch (error) { showToast('❌ خطا: ' + error.message, 'error'); } 
        finally { if(submitBtn) { submitBtn.innerText = 'ذخیره در دیتابیس'; submitBtn.style.pointerEvents = 'auto'; } }
    });

    window.deleteBookFromCloud = (bookId) => {
        showConfirmDialog('حذف کتاب', 'آیا از حذف کامل اطلاعات این اثر مطمئن هستید؟', async () => {
            try {
                const { error } = await supabaseClient.from('books').delete().eq('id', bookId); if (error) throw error;
                window.BOOKS_DATABASE = window.BOOKS_DATABASE.filter(b => b.id !== bookId);
                renderAdminTable(); showToast('🗑️ کتاب مورد نظر حذف شد.', 'success');
            } catch (error) { showToast('❌ خطا در حذف: ' + error.message, 'error'); }
        });
    };

    // ================= فرم مدیریت اخبار =================
    const newsModal = document.getElementById('newsModal');
    const addNewNewsBtn = document.getElementById('addNewNewsBtn');
    const closeNewsModalBtn = document.getElementById('closeNewsModalBtn');
    const newsForm = document.getElementById('newsForm');
    const submitNewsBtn = document.getElementById('submitNewsBtn');
    let editingNewsId = null;

    if (addNewNewsBtn) addNewNewsBtn.addEventListener('click', () => {
        editingNewsId = null; if(newsForm) newsForm.reset(); currentSelectedNewsImage = ''; updatePreviewUI();
        document.getElementById('newsModalMainTitle').innerText = 'انتشار خبر جدید';
        const newsIdInput = document.getElementById('newsId'); if(newsIdInput) newsIdInput.readOnly = false;
        if(submitNewsBtn) submitNewsBtn.innerText = 'ذخیره خبر در دیتابیس'; if(newsModal) newsModal.classList.add('active');
    });

    if (closeNewsModalBtn) closeNewsModalBtn.addEventListener('click', () => { if(newsModal) newsModal.classList.remove('active'); });

    function renderNewsTable() {
        const tableBody = document.getElementById('adminNewsTableBody');
        const totalNewsCount = document.getElementById('totalNewsCount');
        if (!tableBody) return;
        if (!window.NEWS_DATABASE || window.NEWS_DATABASE.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 30px;">هیچ خبری در دیتابیس یافت نشد.</td></tr>`;
            if(totalNewsCount) totalNewsCount.innerText = toPersianNum(0); return;
        }
        if(totalNewsCount) totalNewsCount.innerText = toPersianNum(window.NEWS_DATABASE.length);
        tableBody.innerHTML = window.NEWS_DATABASE.map(news => {
            const imageSrc = getDisplayUrl(news.image);
            return `
                <tr>
                    <td class="thumb-td"><img src="${imageSrc}" onerror="window.handleImgError(this)"></td>
                    <td><strong>${news.title}</strong></td>
                    <td>${toPersianNum(news.date)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action-sm btn-edit" onclick="openNewsEditModal('${news.id}')">ویرایش</button>
                            <button class="btn-action-sm btn-delete" onclick="deleteNewsFromCloud('${news.id}')">حذف</button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    }

    window.openNewsEditModal = (id) => {
        const news = window.NEWS_DATABASE.find(n => n.id === id); if (!news) return;
        editingNewsId = id;
        document.getElementById('newsModalMainTitle').innerText = 'ویرایش خبر'; if(submitNewsBtn) submitNewsBtn.innerText = 'به‌روزرسانی خبر';
        const setVal = (elId, val) => { const el = document.getElementById(elId); if(el) el.value = val; };
        
        setVal('newsId', news.id); const newsIdInput = document.getElementById('newsId'); if(newsIdInput) newsIdInput.readOnly = true; 
        setVal('newsTitle', news.title || ''); setVal('newsDate', news.date || '');
        setVal('newsExcerpt', news.excerpt || ''); setVal('newsContent', news.content || '');
        
        currentSelectedNewsImage = news.image || ''; updatePreviewUI();
        if(newsModal) newsModal.classList.add('active');
    };

    if (newsForm) newsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(submitNewsBtn) { submitNewsBtn.innerText = 'در حال ذخیره‌سازی...'; submitNewsBtn.style.pointerEvents = 'none'; }

        try {
            const getVal = (elId) => document.getElementById(elId) ? document.getElementById(elId).value.trim() : '';

            const newsData = {
                id: getVal('newsId'), title: getVal('newsTitle'), date: getVal('newsDate'),
                excerpt: getVal('newsExcerpt'), content: getVal('newsContent'), image: currentSelectedNewsImage || ''
            };

            if (editingNewsId) {
                const { error } = await supabaseClient.from('news').update(newsData).eq('id', editingNewsId); if (error) throw error;
                const index = window.NEWS_DATABASE.findIndex(n => n.id === editingNewsId);
                if(index !== -1) window.NEWS_DATABASE[index] = { ...window.NEWS_DATABASE[index], ...newsData };
                showToast('✨ خبر با موفقیت ویرایش شد.', 'success');
            } else {
                const { error } = await supabaseClient.from('news').insert([newsData]); if (error) throw error;
                window.NEWS_DATABASE.unshift(newsData); // اضافه کردن به ابتدای آرایه
                showToast('🔥 خبر جدید با موفقیت منتشر شد!', 'success');
            }
            renderNewsTable(); if(newsModal) newsModal.classList.remove('active');
        } catch (error) { showToast('❌ خطا: ' + error.message, 'error'); } 
        finally { if(submitNewsBtn) { submitNewsBtn.innerText = 'ذخیره خبر در دیتابیس'; submitNewsBtn.style.pointerEvents = 'auto'; } }
    });

    window.deleteNewsFromCloud = (newsId) => {
        showConfirmDialog('حذف خبر', 'آیا از حذف کامل این خبر مطمئن هستید؟', async () => {
            try {
                const { error } = await supabaseClient.from('news').delete().eq('id', newsId); if (error) throw error;
                window.NEWS_DATABASE = window.NEWS_DATABASE.filter(n => n.id !== newsId);
                renderNewsTable(); showToast('🗑️ خبر مورد نظر حذف شد.', 'success');
            } catch (error) { showToast('❌ خطا در حذف: ' + error.message, 'error'); }
        });
    };

    if (window.IS_DATA_READY) { renderAdminTable(); renderNewsTable(); } 
    else { document.addEventListener('cloudDataLoaded', () => { renderAdminTable(); renderNewsTable(); }); }

    checkAuth();
});
