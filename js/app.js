'use strict';

// ============================================
// APP.JS - Main Application File (v5.0)
// Quick Dukan - Complete PWA Initialization
// With Scroll Effects, Offline Support, Auto Update
// ============================================

class App {
    constructor() {
        this.ready = false;
        this.scrollObservers = [];
        this.swRegistration = null;
        this.updateAvailable = false;
        this.init();
    }

    async init() {
        console.log('🚀 Quick Dukan Starting...');
        console.log('🛒 आपकी विश्वसनीय किराना दुकान');

        // Register Service Worker
        await this.registerServiceWorker();

        // Wait for all managers to initialize
        await this.waitForDataLoader();

        // Setup global event listeners
        this.setupGlobalListeners();

        // Setup scroll-based title effects
        this.setupScrollTitleEffects();

        // Setup PWA features
        this.setupPWAFeatures();

        // Setup offline support
        this.setupOfflineSupport();

        // Initial UI setup
        this.initialUISetup();

        // Check for updates
        this.checkForUpdates();

        this.ready = true;
        console.log('✅ Quick Dukan Ready!');
        
        // Dispatch ready event
        document.dispatchEvent(new CustomEvent('appReady'));
    }

    // ============================================
    // REGISTER SERVICE WORKER
    // ============================================
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ Service Worker not supported');
            return;
        }

        try {
            this.swRegistration = await navigator.serviceWorker.register('/Quick-Dukan/js/service-worker.js', {
                scope: '/Quick-Dukan/'
            });
            
            console.log('✅ Service Worker registered:', this.swRegistration.scope);
            
            // Check for updates
            this.swRegistration.addEventListener('updatefound', () => {
                const newWorker = this.swRegistration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.updateAvailable = true;
                        this.showUpdateBanner();
                    }
                });
            });
            
            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event.data);
            });
            
            // Check for controller change
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (this.updateAvailable) {
                    window.location.reload();
                }
            });
            
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    }

    // ============================================
    // HANDLE SERVICE WORKER MESSAGES
    // ============================================
    handleServiceWorkerMessage(data) {
        if (!data) return;
        
        switch (data.type) {
            case 'SW_ACTIVATED':
                console.log('🔄 New Service Worker activated:', data.version);
                break;
                
            case 'UPDATE_AVAILABLE':
                this.updateAvailable = true;
                this.showUpdateBanner(data.version);
                break;
                
            case 'NOTIFICATION_CLICK':
                this.handleNotificationClick(data);
                break;
                
            case 'ORDERS_SYNCED':
                this.showNetworkStatus(`✅ ${data.count} ऑर्डर सिंक हो गए!`, 'success');
                break;
        }
    }

    // ============================================
    // HANDLE NOTIFICATION CLICK
    // ============================================
    handleNotificationClick(data) {
        console.log('Notification clicked:', data);
        
        if (data.action === 'view') {
            this.navigateToOrders();
        } else if (data.action === 'rate') {
            // Open rating modal
            if (window.orderRatingManager) {
                window.orderRatingManager.openRating(data.data?.orderId);
            }
        } else if (data.action === 'reorder') {
            // Reorder items
            if (window.reorderManager) {
                window.reorderManager.reorder(data.data?.orderId);
            }
        }
    }

    // ============================================
    // SETUP PWA FEATURES
    // ============================================
    setupPWAFeatures() {
        // Setup install prompt
        this.setupInstallPrompt();
        
        // Setup push notifications
        this.setupPushNotifications();
        
        // Setup background sync
        this.setupBackgroundSync();
    }

    // ============================================
    // SETUP INSTALL PROMPT
    // ============================================
    setupInstallPrompt() {
        let deferredPrompt = null;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            const installBtn = document.getElementById('installBtn');
            if (installBtn) {
                installBtn.style.display = 'block';
                installBtn.addEventListener('click', async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const result = await deferredPrompt.userChoice;
                        console.log('Install prompt result:', result.outcome);
                        deferredPrompt = null;
                        installBtn.style.display = 'none';
                    }
                });
            }
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA installed successfully');
            this.showNetworkStatus('✅ ऐप इंस्टॉल हो गया!', 'success');
        });
    }

    // ============================================
    // SETUP PUSH NOTIFICATIONS
    // ============================================
    setupPushNotifications() {
        if (!('PushManager' in window) || !this.swRegistration) {
            console.warn('⚠️ Push notifications not supported');
            return;
        }
        
        // Check existing subscription
        this.swRegistration.pushManager.getSubscription()
            .then(subscription => {
                if (subscription) {
                    console.log('✅ Push subscription active');
                } else {
                    console.log('ℹ️ No push subscription yet');
                }
            });
    }

    // ============================================
    // SETUP BACKGROUND SYNC
    // ============================================
    setupBackgroundSync() {
        if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
            console.warn('⚠️ Background sync not supported');
            return;
        }
        
        // Register for sync
        navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('sync-orders')
                .then(() => console.log('✅ Background sync registered'))
                .catch(err => console.warn('Sync registration failed:', err));
        });
    }

    // ============================================
    // SETUP OFFLINE SUPPORT
    // ============================================
    setupOfflineSupport() {
        // Offline indicator elements
        this.offlineIndicator = document.getElementById('offlineIndicator');
        this.updateBanner = document.getElementById('updateBanner');
        
        // Online/Offline listeners
        window.addEventListener('online', () => {
            this.showNetworkStatus('✅ आप ऑनलाइन हैं!', 'success');
            if (this.offlineIndicator) {
                this.offlineIndicator.classList.remove('show');
            }
            
            // Sync offline data
            this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
            this.showNetworkStatus('⚠️ आप ऑफलाइन हैं। कैश्ड डेटा दिखाया जा रहा है।', 'warning');
            if (this.offlineIndicator) {
                this.offlineIndicator.classList.add('show');
            }
        });
        
        // Initial check
        if (!navigator.onLine) {
            if (this.offlineIndicator) {
                this.offlineIndicator.classList.add('show');
            }
        }
    }

    // ============================================
    // SYNC OFFLINE DATA
    // ============================================
    async syncOfflineData() {
        if (!navigator.onLine) return;
        
        console.log('🔄 Syncing offline data...');
        
        // Sync orders
        if (window.ordersManager) {
            await window.ordersManager.syncOrders();
        }
        
        // Sync cart
        if (window.cartManager) {
            await window.cartManager.syncCartToServer();
        }
        
        console.log('✅ Offline data synced');
    }

    // ============================================
    // CHECK FOR UPDATES
    // ============================================
    async checkForUpdates() {
        if (!navigator.onLine) return;
        
        try {
            // Check service worker updates
            if (this.swRegistration) {
                await this.swRegistration.update();
            }
            
            // Check data updates
            if (window.dataLoader) {
                const hasUpdate = await window.dataLoader.checkForUpdates();
                if (hasUpdate) {
                    console.log('📌 New data available');
                    await window.dataLoader.loadAllData(true);
                }
            }
            
        } catch (error) {
            console.warn('Update check failed:', error);
        }
    }

    // ============================================
    // SHOW UPDATE BANNER
    // ============================================
    showUpdateBanner(version) {
        if (this.updateBanner) {
            this.updateBanner.classList.add('show');
            
            const versionText = version ? ` (v${version})` : '';
            this.updateBanner.querySelector('span').textContent = 
                `🔄 नया वर्जन उपलब्ध है${versionText}!`;
        }
    }

    async waitForDataLoader() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.dataLoader && window.dataLoader.isLoaded) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            setTimeout(() => {
                clearInterval(checkInterval);
                console.warn('⚠️ Data loading timeout');
                resolve();
            }, 10000);
        });
    }

    setupGlobalListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !e.ctrlKey && !e.metaKey)) {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            if (e.key === 'Escape') {
                if (window.cartManager) {
                    window.cartManager.closeCart();
                }
            }
        });

        // Window resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateAllScrollStates();
            }, 150);
        });
    }

    // ============================================
    // SCROLL-BASED TITLE EFFECTS
    // ============================================
    setupScrollTitleEffects() {
        setTimeout(() => {
            this.initHorizontalScrollEffects();
            this.initCategoriesScrollEffect();
        }, 500);
    }

    initHorizontalScrollEffects() {
        const recentlyViewedScroll = document.querySelector('#recentlyViewedScroll');
        const recentlyViewedSection = document.getElementById('recentlyViewedSection');

        if (recentlyViewedScroll && recentlyViewedSection) {
            this.addScrollEffect(recentlyViewedScroll, recentlyViewedSection);
        }

        const mostOrdersScroll = document.querySelector('#mostOrdersScroll');
        const mostOrdersSection = document.getElementById('mostOrdersSection');

        if (mostOrdersScroll && mostOrdersSection) {
            this.addScrollEffect(mostOrdersScroll, mostOrdersSection);
        }

        document.querySelectorAll('.horizontal-scroll').forEach(scroll => {
            const section = scroll.closest('section');
            if (section && !section.classList.contains('scroll-effect-added')) {
                this.addScrollEffect(scroll, section);
            }
        });
    }

    addScrollEffect(scrollElement, sectionElement) {
        sectionElement.classList.add('scroll-effect-added');

        const handleScroll = () => {
            const scrollLeft = scrollElement.scrollLeft;

            if (scrollLeft > 15) {
                sectionElement.classList.add('scrolled');
            } else {
                sectionElement.classList.remove('scrolled');
            }

            this.updateScrollArrows(sectionElement, scrollElement);
        };

        scrollElement.addEventListener('scroll', handleScroll, { passive: true });

        scrollElement.addEventListener('touchstart', () => {
            sectionElement.classList.add('scrolling');
        }, { passive: true });

        scrollElement.addEventListener('touchend', () => {
            setTimeout(() => {
                sectionElement.classList.remove('scrolling');
                handleScroll();
            }, 100);
        });

        this.scrollObservers.push({
            element: scrollElement,
            handler: handleScroll,
            section: sectionElement
        });

        handleScroll();
    }

    initCategoriesScrollEffect() {
        const categoriesScroll = document.getElementById('categoriesScroll');
        const categoriesSection = document.getElementById('categoriesSection');

        if (!categoriesScroll || !categoriesSection) return;

        const handleCategoriesScroll = () => {
            const scrollLeft = categoriesScroll.scrollLeft;
            const maxScroll = categoriesScroll.scrollWidth - categoriesScroll.clientWidth;

            if (scrollLeft > 10) {
                categoriesSection.classList.add('categories-scrolled');
            } else {
                categoriesSection.classList.remove('categories-scrolled');
            }

            this.updateCategoryButtonSizes(categoriesScroll, scrollLeft, maxScroll);
        };

        categoriesScroll.addEventListener('scroll', handleCategoriesScroll, { passive: true });

        this.scrollObservers.push({
            element: categoriesScroll,
            handler: handleCategoriesScroll,
            section: categoriesSection
        });
    }

    updateCategoryButtonSizes(scrollElement, scrollLeft, maxScroll) {
        const buttons = scrollElement.querySelectorAll('.category-btn:not(.active)');

        buttons.forEach((btn, index) => {
            const rect = btn.getBoundingClientRect();
            const containerRect = scrollElement.getBoundingClientRect();

            const btnCenter = rect.left + rect.width / 2 - containerRect.left;
            const containerCenter = containerRect.width / 2;

            const distanceFromCenter = Math.abs(btnCenter - containerCenter) / containerCenter;

            const scale = 1 - (distanceFromCenter * 0.15);
            const finalScale = Math.max(0.8, Math.min(1, scale));

            btn.style.transform = `scale(${finalScale})`;
            btn.style.opacity = 1 - (distanceFromCenter * 0.3);
        });
    }

    updateScrollArrows(section, scrollElement) {
        const scrollLeft = section.querySelector('.scroll-left');
        const scrollRight = section.querySelector('.scroll-right');

        if (!scrollLeft && !scrollRight) return;

        const { scrollLeft: sl, scrollWidth, clientWidth } = scrollElement;

        if (scrollLeft) {
            if (sl <= 3) {
                scrollLeft.classList.add('disabled');
            } else {
                scrollLeft.classList.remove('disabled');
            }
        }

        if (scrollRight) {
            if (sl + clientWidth >= scrollWidth - 3) {
                scrollRight.classList.add('disabled');
            } else {
                scrollRight.classList.remove('disabled');
            }
        }
    }

    updateAllScrollStates() {
        this.scrollObservers.forEach(({ handler }) => {
            if (typeof handler === 'function') {
                handler();
            }
        });
    }

    initialUISetup() {
        const categoryProductsSection = document.getElementById('categoryProductsSection');
        if (categoryProductsSection) {
            categoryProductsSection.classList.add('hidden');
        }

        if (window.recentlyViewedManager) {
            window.recentlyViewedManager.checkAndShow();
        }

        if (window.mostOrdersManager) {
            window.mostOrdersManager.checkAndShow();
        }

        if (window.languageManager) {
            window.languageManager.applyLanguage();
        }
    }

    navigateToOrders() {
        window.location.href = '/Quick-Dukan/orders.html';
    }

    showNetworkStatus(message, type) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.style.background = type === 'success' ? '#2E7D32' : '#F57F17';
        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
            toast.style.background = '#333';
        }, 3000);
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Handle errors globally
window.addEventListener('error', (e) => {
    console.error('❌ Global Error:', e.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Unhandled Promise Rejection:', e.reason);
});

// ============================================
// ALTERNATING BADGE - Free Delivery (9s) ↔ Trust (3s)
// ============================================
(function() {
    const deliveryContent = document.getElementById('deliveryContent');
    const trustContent = document.getElementById('trustContent');
    const deliveryText = deliveryContent?.querySelector('.badge-text');
    const trustText = trustContent?.querySelector('.badge-text');

    if (!deliveryContent || !trustContent) return;

    let showingDelivery = true;
    let switchTimeout;
    const DELIVERY_DURATION = 9000;
    const TRUST_DURATION = 3000;

    function switchToTrust() {
        deliveryContent.classList.remove('visible');
        deliveryContent.classList.add('hidden');
        trustContent.classList.remove('hidden');
        trustContent.classList.add('visible');
        showingDelivery = false;

        switchTimeout = setTimeout(switchToDelivery, TRUST_DURATION);
    }

    function switchToDelivery() {
        trustContent.classList.remove('visible');
        trustContent.classList.add('hidden');
        deliveryContent.classList.remove('hidden');
        deliveryContent.classList.add('visible');
        showingDelivery = true;

        switchTimeout = setTimeout(switchToTrust, DELIVERY_DURATION);
    }

    function startSwitching() {
        stopSwitching();
        trustContent.classList.add('hidden');
        trustContent.classList.remove('visible');
        deliveryContent.classList.add('visible');
        deliveryContent.classList.remove('hidden');
        showingDelivery = true;
        switchTimeout = setTimeout(switchToTrust, DELIVERY_DURATION);
    }

    function stopSwitching() {
        if (switchTimeout) {
            clearTimeout(switchTimeout);
            switchTimeout = null;
        }
    }

    startSwitching();

    document.addEventListener('languageChanged', function(e) {
        const lang = e.detail?.language || 'hi';

        if (deliveryText && trustText) {
            if (lang === 'en') {
                deliveryText.textContent = 'Free Delivery';
                trustText.textContent = 'Verified';
            } else {
                deliveryText.textContent = 'फ्री डिलीवरी';
                trustText.textContent = 'Verified';
            }
        }

        startSwitching();
    });

    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            stopSwitching();
        } else {
            startSwitching();
        }
    });
})();