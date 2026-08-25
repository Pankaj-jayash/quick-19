// ============================================
// CONFIG.JS - All Settings in One Place
// Updated with PWA, Notifications, Permissions
// ============================================

const CONFIG = {

    // ============ SHOP INFO ============
    shopName: 'Quick Dukan',
    shopNameHi: 'क्विक दुकान',
    shopTagline: 'आपकी विश्वसनीय किराना दुकान',
    shopAddress: 'आपका पता यहाँ',
    shopPhone: '+91 9719312956',
    shopEmail: 'support@quickdukan.com',
    
    // ============ WHATSAPP ============
    whatsappNumber: '919719312956', // CHANGE THIS to your WhatsApp number
    whatsappMessage: 'Quick Dukan से ऑर्डर',
    
    // ============ GOOGLE SHEETS ============
    googleSheets: {
        ordersSheetId: 'YOUR_GOOGLE_SHEET_ID',
        ordersSheetUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
        syncInterval: 300000, // 5 minutes
        autoSync: true
    },
    
    // ============ PUSH NOTIFICATIONS ============
    pushNotifications: {
        enabled: true,
        vapidPublicKey: 'YOUR_VAPID_PUBLIC_KEY_HERE',
        gcmSenderId: '103953800507',
        defaultIcon: 'icons/icon-192.png',
        defaultBadge: 'icons/icon-72.png',
        vibrationPattern: [200, 100, 200],
        sound: 'default',
        notificationTypes: {
            orderUpdate: {
                title: '📦 ऑर्डर अपडेट',
                icon: 'icons/order-icon.png',
                priority: 'high'
            },
            promotional: {
                title: '🎉 नया ऑफर',
                icon: 'icons/offer-icon.png',
                priority: 'normal'
            },
            reminder: {
                title: '⏰ रिमाइंडर',
                icon: 'icons/reminder-icon.png',
                priority: 'normal'
            },
            delivery: {
                title: '🚚 डिलीवरी अपडेट',
                icon: 'icons/delivery-icon.png',
                priority: 'high'
            }
        }
    },
    
    // ============ LOCAL NOTIFICATIONS ============
    localNotifications: {
        enabled: true,
        cartAbandonment: {
            enabled: true,
            delay: 30, // minutes
            message: 'आपका कार्ट आपका इंतज़ार कर रहा है! 🛒'
        },
        dailyOffers: {
            enabled: true,
            time: '09:00', // 9 AM
            message: 'आज के खास ऑफर देखें! 🎉'
        },
        orderReminder: {
            enabled: true,
            message: 'आपका ऑर्डर तैयार है! 📦'
        },
        paymentReminder: {
            enabled: true,
            message: 'पेमेंट पूरा करें 💳'
        }
    },
    
    // ============ PERMISSIONS ============
    permissions: {
        notification: {
            title: '🔔 नोटिफिकेशन',
            description: 'ऑफर और ऑर्डर अपडेट पाने के लिए',
            required: true,
            autoRequest: true,
            requestDelay: 3000 // 3 seconds after page load
        },
        location: {
            title: '📍 लोकेशन',
            description: 'डिलीवरी के लिए आपका पता',
            required: true,
            autoRequest: true,
            requestDelay: 5000
        },
        camera: {
            title: '📷 कैमरा',
            description: 'बारकोड स्कैन करने के लिए',
            required: false,
            autoRequest: false
        },
        microphone: {
            title: '🎤 माइक्रोफोन',
            description: 'वॉइस सर्च के लिए',
            required: false,
            autoRequest: false
        }
    },
    
    // ============ SERVICE WORKER ============
    serviceWorker: {
        enabled: true,
        registrationPath: '/Quick-Dukan/js/service-worker.js',
        cacheVersion: 'v1.0.0',
        cacheName: 'quick-dukan-cache',
        dynamicCacheName: 'quick-dukan-dynamic',
        updateInterval: 3600000, // 1 hour
        autoUpdate: true,
        offlinePage: '/Quick-Dukan/index.html'
    },
    
    // ============ OFFLINE SUPPORT ============
    offline: {
        enabled: true,
        cacheData: true,
        cacheImages: true,
        maxCacheSize: 50, // MB
        offlineMessage: '⚠️ आप ऑफलाइन हैं - कैश्ड डेटा दिखाया जा रहा है',
        syncOnReconnect: true
    },
    
    // ============ INDEXEDDB ============
    indexedDB: {
        dbName: 'QuickDukanDB',
        dbVersion: 1,
        stores: {
            orders: {
                keyPath: 'id',
                autoIncrement: true
            },
            cart: {
                keyPath: 'productId'
            },
            userData: {
                keyPath: 'phone'
            },
            notifications: {
                keyPath: 'id',
                autoIncrement: true
            }
        }
    },

    // ============ COLORS ============
    colors: {
        primary: '#6A1B9A',
        primaryLight: '#8E24AA',
        primaryDark: '#4A148C',
        bgPrimary: '#F5F5DC',
        bgCard: '#FFFFFF',
        gold: '#D4A017',
        success: '#2E7D32',
        error: '#C62828',
        warning: '#F57C00',
        info: '#1976D2',
        whatsapp: '#25D366',
        offline: '#F44336',
        online: '#4CAF50'
    },

    // ============ LANGUAGE ============
    defaultLanguage: 'hi', // 'hi' or 'en'
    supportedLanguages: ['hi', 'en'],
    
    // ============ ANIMATION ============
    animationSpeed: '0.3s',
    animationEasing: 'ease',
    
    // ============ SEARCH ============
    search: {
        minChars: 1,
        maxResults: 10,
        debounceDelay: 300,
        spellCorrection: true,
        voiceSearch: true,
        searchHistory: true,
        maxHistoryItems: 10
    },
    
    searchPlaceholderTexts: {
        hi: [
            'आज क्या चाहिए? 😋',
            'चाय पत्ती भूल गए क्या? ☕',
            'मम्मी ने क्या मँगाया? 🤔',
            'जल्दी बताओ, भूख लगी है! 🍽️',
            'आज कुछ मीठा हो जाए? 🍬',
            'दाल-चावल का स्टॉक खत्म? 🍚',
            'मसालों की महक याद आ रही? 🌿',
            'गरमा-गरम चाय बनानी है? ☕',
        ],
        en: [
            'What do you need today? 😋',
            'Forgot tea leaves? ☕',
            'What did mom order? 🤔',
            'Tell me fast, I\'m hungry! 🍽️',
            'Something sweet today? 🍬',
            'Dal-rice stock finished? 🍚',
            'Missing the aroma of spices? 🌿',
            'Want to make hot tea? ☕',
        ]
    },

    // ============ PRODUCT MESSAGES ============
    noProductMessages: {
        hi: 'अरे! यह सामान अभी नहीं है। हम जल्दी ऐड करेंगे! 😊',
        en: 'Oops! This product is not available yet. We\'ll add it soon! 😊',
    },
    
    // ============ SECTION TITLES ============
    sectionTitles: {
        hi: {
            freeDelivery: 'फ्री डिलीवरी',
            verifiedTrust: 'भरोसेमंद',
            recentlyViewed: '🕐 हाल ही में देखा',
            mostOrders: '🔥 सबसे ज़्यादा मँगाया जाने वाला',
            allProducts: '📦 सभी प्रोडक्ट',
            cart: '🛒 आपका कार्ट',
            emptyCart: 'आपका कार्ट खाली है 😔',
            sendOrder: '📱 WhatsApp पर ऑर्डर भेजें',
            home: 'होम',
            search: 'खोजें',
            myOrders: 'मेरे ऑर्डर',
            top: 'ऊपर',
            allCategory: 'सब',
            searchPlaceholder: 'आज क्या चाहिए? 😋',
            addedToCart: '✅ कार्ट में जोड़ दिया!',
            removedFromCart: '🗑️ कार्ट से हटा दिया',
            orderSent: '✅ ऑर्डर WhatsApp पर भेज दिया!',
            ordersSubtitle: 'आपके सभी ऑर्डर यहाँ हैं',
            allOrders: 'सभी',
            pending: 'पेंडिंग',
            confirmed: 'कन्फर्म',
            delivered: 'डिलीवर्ड',
            noOrders: 'कोई ऑर्डर नहीं है',
            noOrdersDesc: 'अपना पहला ऑर्डर करो! 🛒',
            startShopping: '🏪 खरीदारी शुरू करें',
            checkoutTitle: 'ऑर्डर कन्फर्म करें',
            checkoutSubtitle: 'डिलीवरी के लिए जानकारी भरें',
            fullName: '👤 पूरा नाम',
            phoneNumber: '📱 मोबाइल नंबर',
            deliveryAddress: '📍 डिलीवरी का पता',
            getLocation: 'लोकेशन लें',
            villageCity: 'गाँव या शहर',
            landmark: 'आस-पास की जगह',
            orderNotes: '📝 कोई खास निर्देश',
            notesPlaceholder: 'जैसे: शाम 5 बजे के बाद डिलीवर करें',
            saveInfo: 'यह जानकारी सेव करें (अगली बार ऑटो-फिल होगी)',
            confirmOrder: '💬 WhatsApp पर ऑर्डर भेजें',
            orderSummary: '📋 ऑर्डर समरी',
            nameHint: 'जैसे: रमेश कुमार',
            phoneHint: '10 अंक का मोबाइल नंबर',
            phoneError: '⚠️ कृपया सही 10 अंक का नंबर डालें',
            offlineMessage: '⚠️ आप ऑफलाइन हैं',
            onlineMessage: '✅ आप ऑनलाइन हैं',
            updateAvailable: '🔄 नया अपडेट उपलब्ध है',
            updateNow: 'अभी अपडेट करें',
            installApp: '📱 ऐप इंस्टॉल करें',
            installAppDesc: 'Quick Dukan को होम स्क्रीन पर जोड़ें',
            notificationPermission: '🔔 नोटिफिकेशन अनुमति',
            locationPermission: '📍 लोकेशन अनुमति',
            syncing: '🔄 सिंक हो रहा है...',
            synced: '✅ सिंक हो गया'
        },
        en: {
            freeDelivery: 'Free Delivery',
            verifiedTrust: 'Trusted',
            recentlyViewed: '🕐 Recently Viewed',
            mostOrders: '🔥 Most Ordered',
            allProducts: '📦 All Products',
            cart: '🛒 Your Cart',
            emptyCart: 'Your cart is empty 😔',
            sendOrder: '📱 Send Order on WhatsApp',
            home: 'Home',
            search: 'Search',
            myOrders: 'My Orders',
            top: 'Top',
            allCategory: 'All',
            searchPlaceholder: 'What do you need today? 😋',
            addedToCart: '✅ Added to cart!',
            removedFromCart: '🗑️ Removed from cart',
            orderSent: '✅ Order sent on WhatsApp!',
            ordersSubtitle: 'All your orders are here',
            allOrders: 'All',
            pending: 'Pending',
            confirmed: 'Confirmed',
            delivered: 'Delivered',
            noOrders: 'No Orders Yet',
            noOrdersDesc: 'Place your first order! 🛒',
            startShopping: '🏪 Start Shopping',
            checkoutTitle: 'Confirm Order',
            checkoutSubtitle: 'Fill delivery details',
            fullName: '👤 Full Name',
            phoneNumber: '📱 Phone Number',
            deliveryAddress: '📍 Delivery Address',
            getLocation: 'Get Location',
            villageCity: 'Village or City',
            landmark: 'Nearby Landmark',
            orderNotes: '📝 Special Instructions',
            notesPlaceholder: 'e.g., Deliver after 5 PM',
            saveInfo: 'Save this info (Auto-fill next time)',
            confirmOrder: '💬 Send Order on WhatsApp',
            orderSummary: '📋 Order Summary',
            nameHint: 'e.g., Ramesh Kumar',
            phoneHint: '10 digit mobile number',
            phoneError: '⚠️ Please enter a valid 10 digit number',
            offlineMessage: '⚠️ You are offline',
            onlineMessage: '✅ You are online',
            updateAvailable: '🔄 New update available',
            updateNow: 'Update Now',
            installApp: '📱 Install App',
            installAppDesc: 'Add Quick Dukan to home screen',
            notificationPermission: '🔔 Notification Permission',
            locationPermission: '📍 Location Permission',
            syncing: '🔄 Syncing...',
            synced: '✅ Synced'
        }
    },

    // ============ CATEGORY COLORS ============
    categoryColors: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
        '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
        '#F1948A', '#85929E', '#AED6F1', '#F5B7B1',
        '#A3E4D7', '#FAD7A0', '#D2B4DE', '#A9CCE3',
    ],
    
    // ============ LAYOUT ============
    layout: {
        headerHeight: '60px',
        searchHeight: '50px',
        categoriesHeight: '55px',
        bottomNavHeight: '60px',
        cardWidth: '170px',
        cardImageRatio: '56%',
        mobileBreakpoint: '768px',
        tabletBreakpoint: '1024px'
    },
    
    // ============ FEATURES TOGGLE ============
    features: {
        darkMode: true,
        languageToggle: true,
        recentlyViewed: true,
        mostOrders: true,
        cart: true,
        backToTop: true,
        liveSearch: true,
        spellCorrection: true,
        voiceSearch: true,
        pullToRefresh: true,
        floatingCart: true,
        orderTracking: true,
        paymentOnline: true,
        notifications: true,
        offlineMode: true,
        autoUpdate: true,
        barcodeScanner: false,
        referralSystem: false,
        multiLanguage: true,
        locationTracking: true
    },
    
    // ============ CART SETTINGS ============
    cart: {
        freeDeliveryThreshold: 500,
        deliveryCharge: 20,
        maxQuantityPerItem: 99,
        couponEnabled: true,
        saveForLater: true,
        undoDelete: true,
        confettiEnabled: true
    },
    
    // ============ ORDER SETTINGS ============
    orders: {
        storeOffline: true,
        maxOfflineOrders: 50,
        syncOnOnline: true,
        orderExpiryDays: 30,
        ratingEnabled: true,
        reorderEnabled: true
    },
    
    // ============ API ENDPOINTS ============
    api: {
        baseUrl: '/Quick-Dukan/',
        dataUrl: '/Quick-Dukan/data/index.json',
        productsUrl: '/Quick-Dukan/data/',
        configUrl: '/Quick-Dukan/config/cart-config.json',
        messagesUrl: '/Quick-Dukan/config/cart-messages.json'
    },
    
    // ============ CACHE SETTINGS ============
    cache: {
        staticCache: 'quick-dukan-static-v1',
        dynamicCache: 'quick-dukan-dynamic-v1',
        imageCache: 'quick-dukan-images-v1',
        dataCache: 'quick-dukan-data-v1',
        maxAge: 86400, // 24 hours
        maxEntries: 100
    },
    
    // ============ ERROR MESSAGES ============
    errors: {
        hi: {
            network: '🌐 नेटवर्क समस्या',
            server: '🖥️ सर्वर समस्या',
            timeout: '⏰ समय समाप्त',
            invalidInput: '⚠️ गलत जानकारी',
            permissionDenied: '🚫 अनुमति नहीं मिली',
            notFound: '🔍 नहीं मिला',
            offline: '📡 आप ऑफलाइन हैं'
        },
        en: {
            network: '🌐 Network error',
            server: '🖥️ Server error',
            timeout: '⏰ Timeout',
            invalidInput: '⚠️ Invalid input',
            permissionDenied: '🚫 Permission denied',
            notFound: '🔍 Not found',
            offline: '📡 You are offline'
        }
    }
};

// ============ FREEZE CONFIG ============
Object.freeze(CONFIG);
Object.freeze(CONFIG.sectionTitles);
Object.freeze(CONFIG.sectionTitles.hi);
Object.freeze(CONFIG.sectionTitles.en);
Object.freeze(CONFIG.features);
Object.freeze(CONFIG.layout);
Object.freeze(CONFIG.cart);
Object.freeze(CONFIG.orders);
Object.freeze(CONFIG.api);
Object.freeze(CONFIG.cache);
Object.freeze(CONFIG.colors);

// ============ EXPORT FOR MODULES ============
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}