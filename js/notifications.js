// ============================================
// NOTIFICATIONS.JS - Complete Notification System
// Quick Dukan - Local + Push + Offline Notifications
// ============================================

class NotificationSystem {
  constructor() {
    this.permission = 'default';
    this.swRegistration = null;
    this.notificationHistory = [];
    this.scheduledNotifications = [];
    this.init();
  }

  // ============================================
  // INIT - Initialize Notification System
  // ============================================
  async init() {
    console.log('🔔 Notification System Initializing...');
    
    // Check notification support
    if (!('Notification' in window)) {
      console.warn('⚠️ Browser notifications supported नहीं हैं');
      this.permission = 'unsupported';
      return;
    }

    this.permission = Notification.permission;
    
    // Initialize service worker for push
    await this.initServiceWorker();
    
    // Load notification history
    this.loadNotificationHistory();
    
    // Load scheduled notifications
    this.loadScheduledNotifications();
    
    // Setup IndexedDB for offline notifications
    await this.setupIndexedDB();
    
    console.log('✅ Notification System Ready');
    console.log('📊 Permission:', this.permission);
  }

  // ============================================
  // INIT SERVICE WORKER
  // ============================================
  async initServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported');
      return;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready for notifications');
    } catch (error) {
      console.warn('⚠️ Service Worker error:', error);
    }
  }

  // ============================================
  // SETUP INDEXEDDB FOR OFFLINE NOTIFICATIONS
  // ============================================
  setupIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('QuickDukanNotifications', 1);
      
      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Notification IndexedDB ready');
        resolve();
      };
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        // Notifications store
        if (!db.objectStoreNames.contains('notifications')) {
          const store = db.createObjectStore('notifications', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('read', 'read', { unique: false });
        }
        
        // Scheduled notifications store
        if (!db.objectStoreNames.contains('scheduled')) {
          const store = db.createObjectStore('scheduled', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('triggerTime', 'triggerTime', { unique: false });
        }
      };
    });
  }

  // ============================================
  // REQUEST PERMISSION
  // ============================================
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('⚠️ Browser notifications not supported');
      return false;
    }

    if (this.permission === 'granted') {
      console.log('✅ Permission already granted');
      return true;
    }

    if (this.permission === 'denied') {
      console.log('❌ Permission already denied');
      return false;
    }

    try {
      // Show custom permission popup
      const userChoice = await this.showPermissionPopup();
      
      if (!userChoice) {
        console.log('User declined permission popup');
        return false;
      }

      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      console.log('🔔 Permission result:', permission);
      
      if (permission === 'granted') {
        await this.showWelcomeNotification();
        await this.requestPushSubscription();
      }
      
      return permission === 'granted';
      
    } catch (error) {
      console.error('⚠️ Permission error:', error);
      return false;
    }
  }

  // ============================================
  // SHOW CUSTOM PERMISSION POPUP
  // ============================================
  showPermissionPopup() {
    return new Promise((resolve) => {
      const popup = document.createElement('div');
      popup.className = 'notification-permission-popup';
      popup.innerHTML = `
        <div class="permission-overlay"></div>
        <div class="permission-content">
          <div class="permission-icon">🔔</div>
          <h3>नोटिफिकेशन चालू करें</h3>
          <p>ऑफर, ऑर्डर अपडेट और डिलीवरी की जानकारी पाने के लिए</p>
          <div class="permission-actions">
            <button class="permission-later" data-action="later">बाद में</button>
            <button class="permission-allow" data-action="allow">अनुमति दें</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(popup);
      
      popup.querySelector('[data-action="allow"]').onclick = () => {
        popup.remove();
        resolve(true);
      };
      
      popup.querySelector('[data-action="later"]').onclick = () => {
        popup.remove();
        resolve(false);
      };
      
      popup.querySelector('.permission-overlay').onclick = () => {
        popup.remove();
        resolve(false);
      };
    });
  }

  // ============================================
  // SHOW NOTIFICATION
  // ============================================
  async show(title, message, options = {}) {
    const {
      icon = '🛒',
      tag = 'default',
      requireInteraction = false,
      silent = false,
      vibrate = [200, 100, 200],
      sound = 'default',
      actions = [],
      data = {},
      timeout = 5000
    } = options;

    // Store notification in history (offline support)
    const notificationData = {
      title,
      message,
      icon,
      tag,
      timestamp: new Date().toISOString(),
      read: false
    };
    await this.saveNotification(notificationData);

    // If permission not granted, show in-app notification
    if (this.permission !== 'granted') {
      this.showInAppNotification(title, message, icon);
      return;
    }

    try {
      const notificationOptions = {
        body: message,
        icon: this.getIconUrl(icon),
        badge: this.getBadgeUrl(),
        vibrate: vibrate,
        requireInteraction: requireInteraction,
        silent: silent,
        tag: tag,
        data: data,
        actions: actions,
        sound: sound,
        renotify: true
      };

      // Show via service worker if available
      if (this.swRegistration) {
        await this.swRegistration.showNotification(title, notificationOptions);
      } else {
        // Fallback to regular notification
        const notification = new Notification(title, notificationOptions);
        this.attachNotificationEvents(notification);
      }

      console.log('🔔 Notification shown:', title);

    } catch (error) {
      console.error('⚠️ Notification error:', error);
      this.showInAppNotification(title, message, icon);
    }
  }

  // ============================================
  // SHOW IN-APP NOTIFICATION (Fallback)
  // ============================================
  showInAppNotification(title, message, icon = '🛒') {
    const toast = document.createElement('div');
    toast.className = 'in-app-notification';
    toast.innerHTML = `
      <div class="in-app-icon">${icon}</div>
      <div class="in-app-content">
        <div class="in-app-title">${title}</div>
        <div class="in-app-message">${message}</div>
      </div>
      <button class="in-app-close">✕</button>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
    
    // Close button
    toast.querySelector('.in-app-close').onclick = () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    };
  }

  // ============================================
  // SHOW WELCOME NOTIFICATION
  // ============================================
  async showWelcomeNotification() {
    await this.show('🛒 Quick Dukan', 
      '✅ Notifications चालू हो गए! अब आपको ऑर्डर की live जानकारी मिलेगी।', 
      {
        icon: '🛒',
        tag: 'welcome',
        vibrate: [200, 100, 200]
      }
    );
  }

  // ============================================
  // ORDER STATUS NOTIFICATIONS
  // ============================================
  async notifyOrderStatus(status, orderId, orderDetails = {}) {
    const notifications = {
      pending: {
        title: '⏳ ऑर्डर पेंडिंग',
        message: `आपका ऑर्डर ${orderId} पेंडिंग है। हम जल्द ही कन्फर्म करेंगे।`,
        icon: '⏳',
        tag: `order-${orderId}-pending`
      },
      confirmed: {
        title: '✅ ऑर्डर कन्फर्म हो गया!',
        message: `आपका ऑर्डर ${orderId} कन्फर्म हो गया है। जल्द ही डिलीवर किया जाएगा।`,
        icon: '✅',
        tag: `order-${orderId}-confirmed`
      },
      preparing: {
        title: '📦 ऑर्डर तैयार हो रहा है',
        message: `आपका ऑर्डर ${orderId} पैक किया जा रहा है।`,
        icon: '📦',
        tag: `order-${orderId}-preparing`
      },
      out_for_delivery: {
        title: '🚚 ऑर्डर रास्ते में है!',
        message: `आपका ऑर्डर ${orderId} डिलीवरी के लिए निकल चुका है।`,
        icon: '🚚',
        tag: `order-${orderId}-delivery`
      },
      delivered: {
        title: '🎉 ऑर्डर डिलीवर हो गया!',
        message: `धन्यवाद! आपका ऑर्डर ${orderId} सफलतापूर्वक डिलीवर हो गया।`,
        icon: '🎉',
        tag: `order-${orderId}-delivered`
      },
      cancelled: {
        title: '❌ ऑर्डर कैंसिल',
        message: `माफ़ कीजिए, आपका ऑर्डर ${orderId} कैंसिल कर दिया गया है।`,
        icon: '❌',
        tag: `order-${orderId}-cancelled`
      }
    };

    const notification = notifications[status];
    if (notification) {
      await this.show(notification.title, notification.message, {
        icon: notification.icon,
        tag: notification.tag,
        data: { orderId, status, orderDetails },
        requireInteraction: status === 'delivered',
        actions: status === 'delivered' ? [
          { action: 'rate', title: '⭐ रेट करें' },
          { action: 'reorder', title: '🔄 दोबारा ऑर्डर' }
        ] : []
      });
    }
  }

  // ============================================
  // OFFLINE NOTIFICATIONS
  // ============================================
  async showOfflineNotification(title, message, icon = '📡') {
    // Save to IndexedDB for offline
    const notification = {
      title,
      message,
      icon,
      timestamp: new Date().toISOString(),
      read: false,
      offline: true
    };
    
    await this.saveNotification(notification);
    
    // Show in-app notification
    this.showInAppNotification(title, message, icon);
  }

  // ============================================
  // SCHEDULED NOTIFICATIONS
  // ============================================
  async scheduleNotification(title, message, triggerTime, options = {}) {
    const scheduledNotification = {
      title,
      message,
      triggerTime: triggerTime instanceof Date ? triggerTime.getTime() : triggerTime,
      options,
      created: Date.now()
    };
    
    // Save to IndexedDB
    await this.saveScheduledNotification(scheduledNotification);
    
    // Schedule if service worker supports
    if (this.swRegistration && 'showNotification' in this.swRegistration) {
      const delay = scheduledNotification.triggerTime - Date.now();
      if (delay > 0) {
        setTimeout(async () => {
          await this.show(title, message, options);
          await this.removeScheduledNotification(scheduledNotification.id);
        }, delay);
      }
    }
    
    console.log('⏰ Notification scheduled:', title);
  }

  // ============================================
  // CART ABANDONMENT NOTIFICATION
  // ============================================
  async scheduleCartReminder(cartItems) {
    const delay = 30 * 60 * 1000; // 30 minutes
    const triggerTime = Date.now() + delay;
    
    await this.scheduleNotification(
      '🛒 कार्ट रिमाइंडर',
      `आपके कार्ट में ${cartItems.length} आइटम हैं। ऑर्डर पूरा करें!`,
      triggerTime,
      {
        icon: '🛒',
        tag: 'cart-reminder',
        requireInteraction: true
      }
    );
  }

  // ============================================
  // DAILY OFFERS NOTIFICATION
  // ============================================
  async scheduleDailyOffer() {
    const now = new Date();
    const offerTime = new Date(now);
    offerTime.setHours(9, 0, 0, 0); // 9 AM
    
    if (offerTime < now) {
      offerTime.setDate(offerTime.getDate() + 1);
    }
    
    await this.scheduleNotification(
      '🎉 आज के ऑफर',
      'आज के खास ऑफर देखें! बड़ी बचत करें।',
      offerTime,
      {
        icon: '🎉',
        tag: 'daily-offer'
      }
    );
  }

  // ============================================
  // SAVE NOTIFICATION TO INDEXEDDB
  // ============================================
  async saveNotification(notification) {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const request = store.add(notification);
      
      request.onsuccess = () => {
        this.notificationHistory.push(notification);
        resolve(request.result);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // SAVE SCHEDULED NOTIFICATION
  // ============================================
  async saveScheduledNotification(notification) {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['scheduled'], 'readwrite');
      const store = transaction.objectStore('scheduled');
      const request = store.add(notification);
      
      request.onsuccess = () => {
        notification.id = request.result;
        this.scheduledNotifications.push(notification);
        resolve(request.result);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // REMOVE SCHEDULED NOTIFICATION
  // ============================================
  async removeScheduledNotification(id) {
    if (!this.db || !id) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['scheduled'], 'readwrite');
      const store = transaction.objectStore('scheduled');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // LOAD NOTIFICATION HISTORY
  // ============================================
  async loadNotificationHistory() {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notifications'], 'readonly');
      const store = transaction.objectStore('notifications');
      const request = store.getAll();
      
      request.onsuccess = () => {
        this.notificationHistory = request.result || [];
        resolve(this.notificationHistory);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // LOAD SCHEDULED NOTIFICATIONS
  // ============================================
  async loadScheduledNotifications() {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['scheduled'], 'readonly');
      const store = transaction.objectStore('scheduled');
      const request = store.getAll();
      
      request.onsuccess = () => {
        this.scheduledNotifications = request.result || [];
        resolve(this.scheduledNotifications);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // MARK NOTIFICATION AS READ
  // ============================================
  async markAsRead(notificationId) {
    if (!this.db || !notificationId) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const request = store.get(notificationId);
      
      request.onsuccess = () => {
        const notification = request.result;
        if (notification) {
          notification.read = true;
          store.put(notification);
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // CLEAR ALL NOTIFICATIONS
  // ============================================
  async clearAllNotifications() {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const request = store.clear();
      
      request.onsuccess = () => {
        this.notificationHistory = [];
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // REQUEST PUSH SUBSCRIPTION
  // ============================================
  async requestPushSubscription() {
    if (!('PushManager' in window) || !this.swRegistration) {
      console.warn('⚠️ Push notifications not supported');
      return null;
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(CONFIG.pushNotifications.vapidPublicKey)
      });

      console.log('✅ Push subscription successful');
      
      // Save subscription to server
      await this.saveSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('⚠️ Push subscription error:', error);
      return null;
    }
  }

  // ============================================
  // URL BASE64 TO UINT8ARRAY
  // ============================================
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // ============================================
  // SAVE SUBSCRIPTION TO SERVER
  // ============================================
  async saveSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userPhone: localStorage.getItem('userPhone') || 'guest',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('✅ Subscription saved to server');
      }
    } catch (error) {
      console.warn('⚠️ Subscription save error:', error);
    }
  }

  // ============================================
  // ATTACH NOTIFICATION EVENTS
  // ============================================
  attachNotificationEvents(notification) {
    notification.onclick = (event) => {
      window.focus();
      notification.close();
      
      // Handle notification actions
      if (event.action) {
        this.handleNotificationAction(event.action, notification.data);
      }
    };
    
    notification.onclose = () => {
      console.log('Notification closed');
    };
    
    notification.onerror = (error) => {
      console.error('Notification error:', error);
    };
  }

  // ============================================
  // HANDLE NOTIFICATION ACTION
  // ============================================
  handleNotificationAction(action, data) {
    console.log('Notification action:', action, data);
    
    switch (action) {
      case 'rate':
        // Open rating modal
        if (typeof openRatingModal === 'function') {
          openRatingModal(data.orderId);
        }
        break;
        
      case 'reorder':
        // Reorder items
        if (typeof reorderItems === 'function') {
          reorderItems(data.orderId);
        }
        break;
        
      case 'view':
        // Navigate to orders
        if (typeof goToOrders === 'function') {
          goToOrders();
        }
        break;
    }
  }

  // ============================================
  // GET ICON URL
  // ============================================
  getIconUrl(icon) {
    // If icon is emoji, create SVG
    if (icon && icon.match(/\p{Emoji}/u)) {
      return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${icon}</text></svg>`;
    }
    // If icon is path, return as is
    if (icon && icon.startsWith('/')) {
      return icon;
    }
    // Default icon
    return CONFIG.pushNotifications.defaultIcon || 'icons/icon-192.png';
  }

  // ============================================
  // GET BADGE URL
  // ============================================
  getBadgeUrl() {
    return CONFIG.pushNotifications.defaultBadge || 'icons/icon-72.png';
  }

  // ============================================
  // CHECK PERMISSION STATUS
  // ============================================
  isGranted() {
    return this.permission === 'granted';
  }

  // ============================================
  // GET UNREAD COUNT
  // ============================================
  getUnreadCount() {
    return this.notificationHistory.filter(n => !n.read).length;
  }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  window.notificationSystem = new NotificationSystem();
});

// ============================================
// EXPORT FOR MODULES
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationSystem;
}