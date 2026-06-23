// ================= اتصال به دیتابیس مرکزی و ابری نشر الیما =================

const SUPABASE_URL = 'https://dgdxxzwgqlhepvchfigh.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_9hr00qPKSxxo051rnNVb1g_MGXBl4Cx'; 

// اسم متغیر رو تغییر دادیم تا با کتابخانه اصلی تداخل نداشته باشه
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.BOOKS_DATABASE = [];
window.IS_DATA_READY = false; 

async function fetchBooksFromCloud() {
    try {
        // اینجا هم از همون اسم جدید استفاده می‌کنیم
        const { data, error } = await supabaseClient.from('books').select('*');

        if (error) throw error;

        // اگر اطلاعات با موفقیت دریافت شد، جایگزین می‌کنیم
        if (data && data.length > 0) {
            window.BOOKS_DATABASE = data;
            console.log("🔥 اطلاعات کتاب‌ها با موفقیت دریافت شد!", window.BOOKS_DATABASE);
        }

    } catch (error) {
        console.error("❌ خطا در اتصال به سرور:", error.message);
    } finally {
        window.IS_DATA_READY = true; 
        document.dispatchEvent(new Event('cloudDataLoaded'));
    }
}

fetchBooksFromCloud();
