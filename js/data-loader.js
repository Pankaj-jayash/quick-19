// ============================================
// DATA-LOADER.JS - Complete Offline Data Loader
// Quick Dukan - Smart Caching + Auto Update
// Version: 3.0
// ============================================

class DataLoader {
    constructor() {
        this.masterData = null;
        this.allProducts = [];
        this.categories = [];
        this.productsByCategory = {};
        this.isLoaded = false;
        this.dataVersion = null;
        this.cacheKey = 'quick-dukan-data-cache';
        this.lastSyncTime = null;
        this.syncInProgress = false;
        this.db = null;
        
        // Initialize IndexedDB
        this.initIndexedDB();
    }

    // ============================================
    // INITIALIZE INDEXEDDB
    // ============================================
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('QuickDukanData', 1);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Data IndexedDB ready');
                resolve();
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                
                // Products store
                if (!db.objectStoreNames.contains('products')) {
                    db.createObjectStore('products', { keyPath: 'id' });
                }
                
                // Categories store
                if (!db.objectStoreNames.contains('categories')) {
                    db.createObjectStore('categories', { keyPath: 'id' });
                }
                
                // Metadata store
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
            };
        });
    }

    // ============================================
    // LOAD ALL DATA
    // ============================================
    async loadAllData(forceReload = false) {
        console.log('📥 Loading data...', forceReload ? '(force reload)' : '');
        
        // Check if already loading
        if (this.syncInProgress) {
            console.log('⚠️ Sync already in progress');
            return true;
        }

        this.syncInProgress = true;

        try {
            // Try to load from cache first (for instant display)
            if (!forceReload && this.allProducts.length === 0) {
                const cachedData = await this.loadFromCache();
                if (cachedData) {
                    this.applyData(cachedData);
                    this.dispatchDataLoaded(true);
                }
            }

            // Check online status
            if (navigator.onLine) {
                // Try to fetch fresh data
                const freshData = await this.fetchFreshData(forceReload);
                
                if (freshData) {
                    this.applyData(freshData);
                    await this.saveToCache(freshData);
                    this.lastSyncTime = new Date().toISOString();
                    
                    this.dispatchDataLoaded(false);
                    console.log('✅ Fresh data loaded from server');
                } else {
                    console.warn('⚠️ Failed to fetch fresh data, using cached');
                    this.dispatchDataLoaded(true);
                }
            } else {
                // Offline - use cached data
                console.log('📡 Offline - using cached data');
                this.dispatchDataLoaded(true);
            }

            return true;

        } catch (error) {
            console.error('❌ Data loading error:', error);
            
            // Try cache as fallback
            if (this.allProducts.length === 0) {
                const cachedData = await this.loadFromCache();
                if (cachedData) {
                    this.applyData(cachedData);
                    this.dispatchDataLoaded(true);
                    return true;
                }
            }
            
            return false;
            
        } finally {
            this.syncInProgress = false;
        }
    }

    // ============================================
    // FETCH FRESH DATA FROM SERVER
    // ============================================
    async fetchFreshData(forceReload = false) {
        try {
            const cacheBuster = forceReload ? Date.now() : (this.dataVersion || Date.now());
            
            // Load master index.json
            console.log('📥 Fetching index.json...');
            const masterResponse = await fetch(`data/index.json?v=${cacheBuster}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (!masterResponse.ok) throw new Error(`Failed to load index.json (${masterResponse.status})`);
            
            const masterData = await masterResponse.json();
            const categories = masterData.categories || [];
            const version = masterData.version || null;

            console.log(`📋 Found ${categories.length} categories`);

            // Load all category files in parallel
            const categoryPromises = categories.map(cat => 
                this.fetchCategoryData(cat, cacheBuster)
            );

            const results = await Promise.allSettled(categoryPromises);
            
            // Process results
            const productsByCategory = {};
            let loadedCount = 0;

            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    const category = categories[index];
                    productsByCategory[category.id] = result.value;
                    loadedCount++;
                }
            });

            if (loadedCount === 0) {
                throw new Error('No categories loaded');
            }

            console.log(`✅ Loaded ${loadedCount}/${categories.length} categories`);

            return {
                categories,
                productsByCategory,
                version,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Fetch fresh data error:', error);
            return null;
        }
    }

    // ============================================
    // FETCH CATEGORY DATA
    // ============================================
    async fetchCategoryData(category, cacheBuster) {
        try {
            const url = `data/${category.file}?v=${cacheBuster}`;
            
            const response = await fetch(url, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load ${category.file} (${response.status})`);
            }

            const data = await response.json();
            const products = data.products || data;

            // Process products with category info
            return products.map(product => ({
                ...product,
                categoryId: category.id,
                categoryName: category.name,
                categoryNameHi: category.nameHi || category.name,
            }));

        } catch (error) {
            console.error(`❌ Failed to fetch ${category.name}:`, error.message);
            return null;
        }
    }

    // ============================================
    // APPLY DATA TO INSTANCE
    // ============================================
    applyData(data) {
        this.masterData = data;
        this.categories = data.categories || [];
        this.productsByCategory = data.productsByCategory || {};
        this.dataVersion = data.version || null;
        
        // Rebuild all products
        this.rebuildAllProducts();
        
        this.isLoaded = true;
        
        console.log(`📦 Total Products: ${this.allProducts.length}`);
        console.log(`📂 Categories: ${this.categories.length}`);
        if (this.dataVersion) {
            console.log(`📌 Version: ${this.dataVersion}`);
        }
    }

    // ============================================
    // SAVE DATA TO CACHE (IndexedDB + localStorage)
    // ============================================
    async saveToCache(data) {
        try {
            // Save to IndexedDB
            if (this.db) {
                await this.saveToIndexedDB(data);
            }
            
            // Save to localStorage (for quick access)
            const cacheData = {
                ...data,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
            
            console.log('💾 Data cached successfully');
            
        } catch (error) {
            console.warn('⚠️ Cache save error:', error);
        }
    }

    // ============================================
    // SAVE TO INDEXEDDB
    // ============================================
    async saveToIndexedDB(data) {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products', 'categories', 'metadata'], 'readwrite');
            
            // Save products
            const productStore = transaction.objectStore('products');
            const allProducts = [];
            Object.values(data.productsByCategory).forEach(products => {
                allProducts.push(...products);
            });
            allProducts.forEach(product => productStore.put(product));
            
            // Save categories
            const categoryStore = transaction.objectStore('categories');
            data.categories.forEach(category => categoryStore.put(category));
            
            // Save metadata
            const metadataStore = transaction.objectStore('metadata');
            metadataStore.put({
                key: 'lastSync',
                value: new Date().toISOString()
            });
            metadataStore.put({
                key: 'version',
                value: data.version
            });
            metadataStore.put({
                key: 'totalProducts',
                value: allProducts.length
            });
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // ============================================
    // LOAD FROM CACHE
    // ============================================
    async loadFromCache() {
        try {
            // Try IndexedDB first
            if (this.db) {
                const indexedData = await this.loadFromIndexedDB();
                if (indexedData && indexedData.categories.length > 0) {
                    console.log('✅ Loaded from IndexedDB cache');
                    return indexedData;
                }
            }
            
            // Fallback to localStorage
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                console.log('✅ Loaded from localStorage cache');
                return data;
            }
            
            return null;
            
        } catch (error) {
            console.warn('⚠️ Cache load error:', error);
            return null;
        }
    }

    // ============================================
    // LOAD FROM INDEXEDDB
    // ============================================
    async loadFromIndexedDB() {
        if (!this.db) return null;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products', 'categories', 'metadata'], 'readonly');
            
            const productStore = transaction.objectStore('products');
            const categoryStore = transaction.objectStore('categories');
            const metadataStore = transaction.objectStore('metadata');
            
            const productsRequest = productStore.getAll();
            const categoriesRequest = categoryStore.getAll();
            const versionRequest = metadataStore.get('version');
            const lastSyncRequest = metadataStore.get('lastSync');
            
            transaction.oncomplete = () => {
                const allProducts = productsRequest.result || [];
                const categories = categoriesRequest.result || [];
                
                if (allProducts.length === 0 && categories.length === 0) {
                    resolve(null);
                    return;
                }
                
                // Rebuild productsByCategory
                const productsByCategory = {};
                categories.forEach(category => {
                    productsByCategory[category.id] = allProducts.filter(
                        product => product.categoryId === category.id
                    );
                });
                
                resolve({
                    categories,
                    productsByCategory,
                    version: versionRequest.result?.value || null,
                    lastSync: lastSyncRequest.result?.value || null
                });
            };
            
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // ============================================
    // REBUILD ALL PRODUCTS
    // ============================================
    rebuildAllProducts() {
        this.allProducts = [];
        Object.values(this.productsByCategory).forEach(products => {
            this.allProducts = [...this.allProducts, ...products];
        });

        // Remove duplicates
        const seen = new Set();
        this.allProducts = this.allProducts.filter(product => {
            if (seen.has(product.id)) return false;
            seen.add(product.id);
            return true;
        });
    }

    // ============================================
    // GET PRODUCTS BY CATEGORY
    // ============================================
    getProductsByCategory(categoryId) {
        if (categoryId === 'all') return this.allProducts;
        return this.productsByCategory[categoryId] || [];
    }

    // ============================================
    // GET PRODUCT BY ID
    // ============================================
    getProductById(productId) {
        return this.allProducts.find(p => p.id === productId) || null;
    }

    // ============================================
    // SEARCH PRODUCTS
    // ============================================
    searchProducts(query) {
        if (!query || query.trim().length === 0) return [];

        const q = query.toLowerCase().trim();

        return this.allProducts.filter(product => {
            const nameHi = (product.name?.hi) ? product.name.hi.toLowerCase() : '';
            const nameEn = (product.name?.en) ? product.name.en.toLowerCase() : '';
            const categoryHi = product.categoryNameHi?.toLowerCase() || '';
            
            return nameHi.includes(q) || 
                   nameEn.includes(q) || 
                   categoryHi.includes(q);
        });
    }

    // ============================================
    // FUZZY SEARCH
    // ============================================
    fuzzySearch(query) {
        const q = query.toLowerCase().trim();
        const results = this.searchProducts(query);

        if (results.length > 0) return results;

        // Try fuzzy matching
        return this.allProducts.filter(product => {
            const nameHi = (product.name?.hi) ? product.name.hi.toLowerCase() : '';
            const nameEn = (product.name?.en) ? product.name.en.toLowerCase() : '';
            const words = [...nameHi.split(' '), ...nameEn.split(' ')];
            
            return words.some(word =>
                word.includes(q) || this.levenshteinDistance(word, q) <= 2
            );
        });
    }

    // ============================================
    // LEVENSHTEIN DISTANCE
    // ============================================
    levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }

    // ============================================
    // GET RANDOM PRODUCTS
    // ============================================
    getRandomProducts(count = 4, excludeIds = []) {
        const available = this.allProducts.filter(p => !excludeIds.includes(p.id));
        const shuffled = available.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    // ============================================
    // GET MOST ORDERED PRODUCTS
    // ============================================
    getMostOrderedProducts() {
        return this.allProducts.filter(p => p.mostOrdered === true);
    }

    // ============================================
    // GET DISCOUNTED PRODUCTS
    // ============================================
    getDiscountedProducts() {
        return this.allProducts.filter(p => 
            p.discount && p.discount > 0
        );
    }

    // ============================================
    // GET DATA INFO
    // ============================================
    getDataInfo() {
        return {
            version: this.dataVersion,
            totalProducts: this.allProducts.length,
            totalCategories: this.categories.length,
            isLoaded: this.isLoaded,
            lastSync: this.lastSyncTime,
            fromCache: !navigator.onLine,
            isOnline: navigator.onLine
        };
    }

    // ============================================
    // DISPATCH DATA LOADED EVENT
    // ============================================
    dispatchDataLoaded(offline = false) {
        document.dispatchEvent(new CustomEvent('dataLoaded', {
            detail: {
                allProducts: this.allProducts,
                categories: this.categories,
                offline: offline,
                version: this.dataVersion,
                timestamp: new Date().toISOString()
            }
        }));
    }

    // ============================================
    // CLEAR CACHE
    // ============================================
    async clearCache() {
        try {
            // Clear localStorage
            localStorage.removeItem(this.cacheKey);
            
            // Clear IndexedDB
            if (this.db) {
                const transaction = this.db.transaction(['products', 'categories', 'metadata'], 'readwrite');
                transaction.objectStore('products').clear();
                transaction.objectStore('categories').clear();
                transaction.objectStore('metadata').clear();
                
                await new Promise((resolve, reject) => {
                    transaction.oncomplete = resolve;
                    transaction.onerror = () => reject(transaction.error);
                });
            }
            
            console.log('🗑️ Data cache cleared');
            
        } catch (error) {
            console.warn('⚠️ Cache clear error:', error);
        }
    }

    // ============================================
    // CHECK FOR UPDATES
    // ============================================
    async checkForUpdates() {
        if (!navigator.onLine) return false;
        
        console.log('🔄 Checking for data updates...');
        
        try {
            const response = await fetch(`data/index.json?v=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (!response.ok) return false;
            
            const data = await response.json();
            const newVersion = data.version || null;
            
            if (newVersion && newVersion !== this.dataVersion) {
                console.log(`📌 New data version available: ${newVersion}`);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.warn('⚠️ Update check error:', error);
            return false;
        }
    }
}

// ============================================
// INITIALIZE ON DOM READY
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing DataLoader...');
    window.dataLoader = new DataLoader();

    // Initial load
    const success = await window.dataLoader.loadAllData();

    if (success) {
        console.log('✅ DataLoader initialized successfully');
    } else {
        console.error('❌ DataLoader initialization failed');
    }

    // Setup online/offline listeners
    window.addEventListener('online', async () => {
        console.log('🌐 Back online - refreshing data...');
        await window.dataLoader.loadAllData(true);
    });

    window.addEventListener('offline', () => {
        console.log('📡 Offline - using cached data');
    });
});

// ============================================
// DEBUG HELPER
// ============================================
window.getDataInfo = () => {
    if (window.dataLoader) {
        console.table(window.dataLoader.getDataInfo());
    }
};

window.clearDataCache = async () => {
    if (window.dataLoader) {
        await window.dataLoader.clearCache();
        console.log('Cache cleared, reloading...');
        await window.dataLoader.loadAllData(true);
    }
};

// ============================================
// EXPORT FOR MODULES
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
}