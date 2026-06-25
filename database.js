// ================= اتصال به دیتابیس مرکزی و ابری نشر الیما =================

const SUPABASE_URL = 'https://dgdxxzwgqlhepvchfigh.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_9hr00qPKSxxo051rnNVb1g_MGXBl4Cx';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.BOOKS_DATABASE = [];
window.NEWS_DATABASE = []; // حافظه جدید برای ذخیره اخبار
window.IS_DATA_READY = false; 

// سیستم دریافت اطلاعات موازی با قابلیت ۳ بار تلاش مجدد (Retry)
async function fetchAllDataFromCloud(retries = 3) {
    try {
        // دریافت موازی و همزمان کتاب‌ها و اخبار برای سرعت نور!
        const [booksResponse, newsResponse] = await Promise.all([
            supabaseClient.from('books').select('*'),
            supabaseClient.from('news').select('*').order('created_at', { ascending: false }) // اخبار رو از جدید به قدیم مرتب می‌کنه
        ]);

        if (booksResponse.error) throw booksResponse.error;
        if (newsResponse.error) throw newsResponse.error;

        window.BOOKS_DATABASE = booksResponse.data || [];
        window.NEWS_DATABASE = newsResponse.data || [];
        window.IS_DATA_READY = true; 
        
        document.dispatchEvent(new Event('cloudDataLoaded'));
        console.log("🔥 اطلاعات کتاب‌ها و اخبار با موفقیت دریافت شد!");

    } catch (error) {
        console.error("❌ خطا در اتصال به سرور:", error.message);
        if (retries > 0) {
            console.log(`🔄 در حال تلاش مجدد برای دریافت اطلاعات... (${retries} بار باقی‌مانده)`);
            setTimeout(() => fetchAllDataFromCloud(retries - 1), 1000);
        } else {
            // باز کردن قفل سایت حتی در صورت قطعی اینترنت
            window.IS_DATA_READY = true; 
            document.dispatchEvent(new Event('cloudDataLoaded'));
        }
    }
}

fetchAllDataFromCloud();
