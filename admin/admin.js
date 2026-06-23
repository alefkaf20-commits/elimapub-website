document.addEventListener('DOMContentLoaded', () => {
    
    // ================= تغییر تم ادمین =================
    const themeBtn = document.getElementById('adminThemeBtn');
    const updateThemeIcon = (isDark) => { if(themeBtn) themeBtn.innerText = isDark ? '☀️' : '🌙'; };
    if (themeBtn) {
        updateThemeIcon(document.body.classList.contains('dark-theme'));
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('elima-theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
        });
    }

    // ================= توابع کمکی اعدادی =================
    // ۱. نمایش فارسی اعداد در پنل
    const toPersianNum = (num) => {
        if (num === null || num === undefined) return '';
        const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, x => farsiDigits[x]);
    };

    // ۲. تبدیل اعداد فارسی به انگلیسی برای ذخیره در دیتابیس بدون ارور
    const toEnglishNum = (str) => {
        if (!str && str !== 0) return '';
        const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
        let result = str.toString();
        for (let i = 0; i < 10; i++) {
            result = result.replace(persianDigits[i], i);
        }
        return result;
    };

    // ================= ۱. سیستم امنیتی ورود (Supabase Auth) =================
    const loginOverlay = document.getElementById('loginOverlay');
    const loginForm = document.getElementById('loginForm');
    const mainAdminLayout = document.getElementById('mainAdminLayout');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.getElementById('loginBtn'); // مطمئن شو در HTML به دکمه ورود id="loginBtn" داده باشی

    // بررسی وضعیت لاگین از سرور سوپابیس
    const checkAuth = async () => {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (session) {
            // کاربر احراز هویت شده است
            loginOverlay.style.opacity = '0';
            setTimeout(() => {
                loginOverlay.style.visibility = 'hidden';
                mainAdminLayout.style.opacity = '1';
                mainAdminLayout.style.visibility = 'visible';
            }, 300);
            renderAdminTable();
        } else {
            // کاربر لاگین نیست
            loginOverlay.style.visibility = 'visible';
            loginOverlay.style.opacity = '1';
            mainAdminLayout.style.opacity = '0';
        }
    };

    // عملیات ورود واقعی با ایمیل و رمز
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        
        // اگر هنوز در HTML آیدی لاگین باتن رو نذاشتی، اینجا پیداش میکنیم
        const btn = loginBtn || loginForm.querySelector('button[type="submit"]');
        
        btn.innerText = 'در حال بررسی...';
        btn.style.pointerEvents = 'none';

        // ارسال درخواست ورود به سوپابیس
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        btn.innerText = 'ورود به سیستم';
        btn.style.pointerEvents = 'auto';

        if (error) {
            loginError.innerText = 'ایمیل یا رمز عبور اشتباه است!';
            setTimeout(() => loginError.innerText = '', 4000);
        } else {
            // ورود موفق
            checkAuth();
        }
    });

    // عملیات خروج
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.reload();
    });

    // ================= ۲. مدیریت جدول و مودال =================
    const tableBody = document.getElementById('adminBooksTableBody');
    const totalBooksCount = document.getElementById('totalBooksCount');
    
    const modal = document.getElementById('bookModal');
    const addBtn = document.getElementById('addNewBookBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const form = document.getElementById('bookForm');
    const submitBtn = document.getElementById('submitBtn');
    const modalMainTitle = document.getElementById('modalMainTitle');

    let editingBookId = null;

    // باز کردن مودال برای "افزودن"
    addBtn.addEventListener('click', () => {
        editingBookId = null;
        form.reset();
        modalMainTitle.innerText = 'افزودن کتاب جدید';
        document.getElementById('newId').readOnly = false;
        submitBtn.innerText = 'ذخیره در دیتابیس';
        modal.classList.add('active');
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    const renderAdminTable = () => {
        if (!window.BOOKS_DATABASE || window.BOOKS_DATABASE.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px;">هیچ اثری در دیتابیس یافت نشد.</td></tr>`;
            totalBooksCount.innerText = toPersianNum(0);
            return;
        }

        totalBooksCount.innerText = toPersianNum(window.BOOKS_DATABASE.length);

        tableBody.innerHTML = window.BOOKS_DATABASE.map(book => {
            let parsedImages = [];
            try { parsedImages = typeof book.images === 'string' ? JSON.parse(book.images) : book.images; } catch(e) {}
            const coverImg = parsedImages && parsedImages.length > 0 ? parsedImages[0] : 'default.jpg';
            
            return `
                <tr>
                    <td class="thumb-td"><img src="../book/covers/${coverImg}" onerror="this.src='../book/covers/default.jpg'"></td>
                    <td><strong>${book.title}</strong></td>
                    <td>${book.author}</td>
                    <td>${toPersianNum(book.price)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action-sm btn-edit" onclick="openEditModal('${book.id}')">ویرایش</button>
                            <button class="btn-action-sm btn-delete" onclick="deleteBookFromCloud('${book.id}')">حذف</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    if (window.IS_DATA_READY) renderAdminTable();
    else document.addEventListener('cloudDataLoaded', renderAdminTable);

    // آماده‌سازی مودال برای "ویرایش"
    window.openEditModal = (id) => {
        const book = window.BOOKS_DATABASE.find(b => b.id === id);
        if (!book) return;

        editingBookId = id;
        modalMainTitle.innerText = 'ویرایش اطلاعات کتاب';
        submitBtn.innerText = 'به‌روزرسانی اطلاعات';
        
        document.getElementById('newId').value = book.id;
        document.getElementById('newId').readOnly = true; 
        document.getElementById('newTitle').value = book.title || '';
        document.getElementById('newAuthor').value = book.author || '';
        document.getElementById('newPrice').value = book.price || '';
        document.getElementById('newCategory').value = book.category || 'literature';
        document.getElementById('newPages').value = book.pages || '';
        document.getElementById('newFormat').value = book.format || '';
        document.getElementById('newCoverType').value = book.covertype || book.coverType || '';
        document.getElementById('newPaperType').value = book.papertype || book.paperType || '';
        document.getElementById('newYear').value = book.year || '';
        document.getElementById('newIsbn').value = book.isbn || '';
        document.getElementById('newDesc').value = book.desc || '';
        document.getElementById('newPrintEdition').value = book.printedition || book.printEdition || '';
        
        let parsedImages = [];
        try { parsedImages = typeof book.images === 'string' ? JSON.parse(book.images) : book.images; } catch(e) {}
        if (Array.isArray(parsedImages)) {
            document.getElementById('newImage').value = parsedImages.join(', ');
        } else {
            document.getElementById('newImage').value = 'default.jpg';
        }

        document.getElementById('newIsBestseller').checked = book.isbestseller || book.isBestseller || false;

        modal.classList.add('active');
    };

    // ================= ۳. عملیات ثبت نهایی =================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.innerText = 'در حال ذخیره‌سازی...';
        submitBtn.style.pointerEvents = 'none';

        // استخراج و تبدیل صفحات به عدد انگلیسی
        const rawPages = document.getElementById('newPages').value;
        const cleanEnglishPages = parseInt(toEnglishNum(rawPages)) || 0;

        // پردازش هوشمند تصاویر با کاما
        const rawImagesInput = document.getElementById('newImage').value.trim();
        let imagesArray = ["default.jpg"];
        if (rawImagesInput) {
            imagesArray = rawImagesInput.split(',').map(img => img.trim()).filter(img => img !== "");
        }
        const jsonImagesString = JSON.stringify(imagesArray);

        const bookData = {
            id: document.getElementById('newId').value.trim(),
            title: document.getElementById('newTitle').value.trim(),
            author: document.getElementById('newAuthor').value.trim(),
            price: document.getElementById('newPrice').value.trim(), 
            category: document.getElementById('newCategory').value,
            pages: cleanEnglishPages, 
            format: document.getElementById('newFormat').value.trim(),
            covertype: document.getElementById('newCoverType').value.trim(),
            papertype: document.getElementById('newPaperType').value.trim(),
            year: document.getElementById('newYear').value.trim(),
            isbn: document.getElementById('newIsbn').value.trim(),
            desc: document.getElementById('newDesc').value.trim(),
            printedition: document.getElementById('newPrintEdition').value.trim(),
            isbestseller: document.getElementById('newIsBestseller').checked,
            images: jsonImagesString 
        };

        try {
            if (editingBookId) {
                const { error } = await supabaseClient
                    .from('books')
                    .update(bookData)
                    .eq('id', editingBookId);

                if (error) throw error;
                
                const index = window.BOOKS_DATABASE.findIndex(b => b.id === editingBookId);
                if(index !== -1) window.BOOKS_DATABASE[index] = { ...window.BOOKS_DATABASE[index], ...bookData };
                alert('✨ اطلاعات کتاب با موفقیت ویرایش شد.');

            } else {
                const { error } = await supabaseClient.from('books').insert([bookData]);
                if (error) throw error;
                
                window.BOOKS_DATABASE.push(bookData);
                alert('🔥 کتاب جدید با موفقیت اضافه شد!');
            }
            
            renderAdminTable();
            modal.classList.remove('active');
            
        } catch (error) {
            console.error(error);
            alert('❌ خطا: ' + error.message);
        } finally {
            submitBtn.innerText = 'ذخیره در دیتابیس';
            submitBtn.style.pointerEvents = 'auto';
        }
    });

    // ================= ۴. عملیات حذف =================
    window.deleteBookFromCloud = async (bookId) => {
        if (confirm('آیا از حذف کامل این اثر مطمئن هستید؟')) {
            try {
                const { error } = await supabaseClient.from('books').delete().eq('id', bookId);
                if (error) throw error;

                window.BOOKS_DATABASE = window.BOOKS_DATABASE.filter(b => b.id !== bookId);
                renderAdminTable();
                alert('🗑️ کتاب مورد نظر با موفقیت حذف شد.');
            } catch (error) {
                console.error(error);
                alert('❌ خطا در حذف: ' + error.message);
            }
        }
    };

    // بررسی احراز هویت هنگام باز شدن صفحه
    checkAuth();
});
