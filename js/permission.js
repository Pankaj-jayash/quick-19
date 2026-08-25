// ============================================
// PERMISSION.JS - Complete Permission Manager
// Quick Dukan - All Browser Permissions
// ============================================

class PermissionManager {
  constructor() {
    // All permissions status
    this.permissions = {
      notification: 'default',
      location: 'default',
      camera: 'default',
      microphone: 'default',
      geolocation: 'default',
      storage: 'default',
      clipboard: 'default'
    };
    
    this.permissionAsked = {
      notification: false,
      location: false,
      camera: false,
      microphone: false
    };
    
    this.init();
  }

  // ============================================
  // INIT - Check all existing permissions
  // ============================================
  init() {
    this.checkAllPermissions();
    this.loadAskedStatus();
    console.log('🔐 Permission Manager Ready');
    console.log('📊 Current permissions:', this.permissions);
  }

  // ============================================
  // CHECK ALL PERMISSIONS
  // ============================================
  checkAllPermissions() {
    // Notification Permission
    if ('Notification' in window) {
      this.permissions.notification = Notification.permission;
    } else {
      this.permissions.notification = 'unsupported';
    }

    // Geolocation Permission
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(result => {
          this.permissions.location = result.state;
          this.permissions.geolocation = result.state;
        })
        .catch(() => {
          this.permissions.location = 'unknown';
        });
    }

    // Camera Permission
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'camera' })
        .then(result => {
          this.permissions.camera = result.state;
        })
        .catch(() => {
          this.permissions.camera = 'unsupported';
        });
    }

    // Microphone Permission
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'microphone' })
        .then(result => {
          this.permissions.microphone = result.state;
        })
        .catch(() => {
          this.permissions.microphone = 'unsupported';
        });
    }

    // Storage Permission
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted()
        .then(isPersisted => {
          this.permissions.storage = isPersisted ? 'granted' : 'prompt';
        });
    }

    // Clipboard Permission
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'clipboard-read' })
        .then(result => {
          this.permissions.clipboard = result.state;
        })
        .catch(() => {
          this.permissions.clipboard = 'unsupported';
        });
    }
  }

  // ============================================
  // LOAD ASKED STATUS FROM LOCALSTORAGE
  // ============================================
  loadAskedStatus() {
    try {
      const asked = localStorage.getItem('permissionAskedStatus');
      if (asked) {
        this.permissionAsked = JSON.parse(asked);
      }
    } catch (error) {
      console.warn('Permission status load error:', error);
    }
  }

  // ============================================
  // SAVE ASKED STATUS TO LOCALSTORAGE
  // ============================================
  saveAskedStatus() {
    try {
      localStorage.setItem('permissionAskedStatus', JSON.stringify(this.permissionAsked));
    } catch (error) {
      console.warn('Permission status save error:', error);
    }
  }

  // ============================================
  // REQUEST NOTIFICATION PERMISSION
  // ============================================
  async requestNotificationPermission() {
    if (this.permissionAsked.notification) {
      console.log('⚠️ Notification permission already asked');
      return this.permissions.notification;
    }

    if (this.permissions.notification === 'granted') {
      console.log('✅ Notification already granted');
      this.permissionAsked.notification = true;
      this.saveAskedStatus();
      return 'granted';
    }

    if (this.permissions.notification === 'denied') {
      console.log('❌ Notification already denied');
      this.permissionAsked.notification = true;
      this.saveAskedStatus();
      return 'denied';
    }

    if (this.permissions.notification === 'unsupported') {
      console.log('⚠️ Notifications not supported');
      return 'unsupported';
    }

    try {
      console.log('🔔 Requesting notification permission...');
      
      // Show custom permission popup first
      const userChoice = await this.showCustomPermissionPopup('notification');
      
      if (!userChoice) {
        console.log('User declined custom popup');
        return 'declined';
      }

      const result = await Notification.requestPermission();
      this.permissions.notification = result;
      this.permissionAsked.notification = true;
      this.saveAskedStatus();

      console.log('🔔 Notification permission result:', result);

      if (result === 'granted') {
        this.showWelcomeNotification();
        this.requestPushSubscription();
      }

      return result;

    } catch (error) {
      console.error('⚠️ Notification permission error:', error);
      return 'error';
    }
  }

  // ============================================
  // REQUEST LOCATION PERMISSION
  // ============================================
  async requestLocationPermission() {
    if (this.permissionAsked.location) {
      console.log('⚠️ Location permission already asked');
      return this.permissions.location;
    }

    if (this.permissions.location === 'granted') {
      console.log('✅ Location already granted');
      this.permissionAsked.location = true;
      this.saveAskedStatus();
      return 'granted';
    }

    if (!('geolocation' in navigator)) {
      console.log('⚠️ Geolocation not supported');
      this.permissions.location = 'unsupported';
      return 'unsupported';
    }

    try {
      console.log('📍 Requesting location permission...');
      
      // Show custom permission popup
      const userChoice = await this.showCustomPermissionPopup('location');
      
      if (!userChoice) {
        console.log('User declined custom popup');
        return 'declined';
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      this.permissions.location = 'granted';
      this.permissions.geolocation = 'granted';
      this.permissionAsked.location = true;
      this.saveAskedStatus();

      console.log('✅ Location permission granted');
      
      // Save location data
      this.saveLocationData(position);
      
      return 'granted';

    } catch (error) {
      console.error('⚠️ Location permission error:', error);
      this.permissions.location = 'denied';
      this.permissionAsked.location = true;
      this.saveAskedStatus();
      return 'denied';
    }
  }

  // ============================================
  // REQUEST CAMERA PERMISSION
  // ============================================
  async requestCameraPermission() {
    if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
      console.log('⚠️ Camera not supported');
      this.permissions.camera = 'unsupported';
      return 'unsupported';
    }

    try {
      console.log('📷 Requesting camera permission...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Stop all tracks immediately
      stream.getTracks().forEach(track => track.stop());
      
      this.permissions.camera = 'granted';
      console.log('✅ Camera permission granted');
      return 'granted';

    } catch (error) {
      console.error('⚠️ Camera permission error:', error);
      this.permissions.camera = 'denied';
      return 'denied';
    }
  }

  // ============================================
  // REQUEST MICROPHONE PERMISSION
  // ============================================
  async requestMicrophonePermission() {
    if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
      console.log('⚠️ Microphone not supported');
      this.permissions.microphone = 'unsupported';
      return 'unsupported';
    }

    try {
      console.log('🎤 Requesting microphone permission...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop all tracks immediately
      stream.getTracks().forEach(track => track.stop());
      
      this.permissions.microphone = 'granted';
      console.log('✅ Microphone permission granted');
      return 'granted';

    } catch (error) {
      console.error('⚠️ Microphone permission error:', error);
      this.permissions.microphone = 'denied';
      return 'denied';
    }
  }

  // ============================================
  // REQUEST STORAGE PERSISTENCE
  // ============================================
  async requestStoragePersistence() {
    if (!navigator.storage || !navigator.storage.persist) {
      console.log('⚠️ Storage persistence not supported');
      return 'unsupported';
    }

    try {
      const isPersisted = await navigator.storage.persist();
      this.permissions.storage = isPersisted ? 'granted' : 'denied';
      console.log('💾 Storage persistence:', isPersisted ? 'granted' : 'denied');
      return this.permissions.storage;
    } catch (error) {
      console.error('⚠️ Storage persistence error:', error);
      return 'error';
    }
  }

  // ============================================
  // SHOW CUSTOM PERMISSION POPUP
  // ============================================
  showCustomPermissionPopup(type) {
    return new Promise((resolve) => {
      const popupConfig = {
        notification: {
          icon: '🔔',
          title: 'नोटिफिकेशन चालू करें',
          description: 'ऑफर, ऑर्डर अपडेट और डिलीवरी की जानकारी पाने के लिए',
          buttonText: 'अनुमति दें'
        },
        location: {
          icon: '📍',
          title: 'लोकेशन की अनुमति दें',
          description: 'डिलीवरी के लिए आपका सही पता जानने के लिए',
          buttonText: 'लोकेशन दें'
        },
        camera: {
          icon: '📷',
          title: 'कैमरा एक्सेस',
          description: 'बारकोड स्कैन करने के लिए कैमरा चाहिए',
          buttonText: 'कैमरा दें'
        },
        microphone: {
          icon: '🎤',
          title: 'माइक्रोफोन एक्सेस',
          description: 'वॉइस सर्च के लिए माइक्रोफोन चाहिए',
          buttonText: 'माइक दें'
        }
      };

      const config = popupConfig[type];
      
      // Create popup element
      const popup = document.createElement('div');
      popup.className = 'permission-popup';
      popup.innerHTML = `
        <div class="permission-popup-overlay"></div>
        <div class="permission-popup-content">
          <div class="permission-popup-icon">${config.icon}</div>
          <h3 class="permission-popup-title">${config.title}</h3>
          <p class="permission-popup-desc">${config.description}</p>
          <div class="permission-popup-actions">
            <button class="permission-deny-btn" data-action="deny">बाद में</button>
            <button class="permission-allow-btn" data-action="allow">${config.buttonText}</button>
          </div>
        </div>
      `;

      document.body.appendChild(popup);

      // Handle button clicks
      popup.querySelector('[data-action="allow"]').addEventListener('click', () => {
        document.body.removeChild(popup);
        resolve(true);
      });

      popup.querySelector('[data-action="deny"]').addEventListener('click', () => {
        document.body.removeChild(popup);
        resolve(false);
      });

      // Handle overlay click
      popup.querySelector('.permission-popup-overlay').addEventListener('click', () => {
        document.body.removeChild(popup);
        resolve(false);
      });
    });
  }

  // ============================================
  // REQUEST PUSH SUBSCRIPTION
  // ============================================
  async requestPushSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('⚠️ Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(CONFIG.pushNotifications.vapidPublicKey)
      });

      console.log('✅ Push subscription successful:', subscription);
      
      // Send subscription to server
      this.sendSubscriptionToServer(subscription);
      
      return subscription;

    } catch (error) {
      console.error('⚠️ Push subscription error:', error);
      return null;
    }
  }

  // ============================================
  // CONVERT VAPID KEY
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
  // SEND SUBSCRIPTION TO SERVER
  // ============================================
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/save-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription,
          userPhone: localStorage.getItem('userPhone') || 'guest'
        })
      });

      if (response.ok) {
        console.log('✅ Subscription sent to server');
      }
    } catch (error) {
      console.warn('⚠️ Subscription send error:', error);
    }
  }

  // ============================================
  // SAVE LOCATION DATA
  // ============================================
  saveLocationData(position) {
    const locationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('userLocation', JSON.stringify(locationData));
    console.log('📍 Location saved:', locationData);
  }

  // ============================================
  // GET PERMISSION STATUS
  // ============================================
  getPermissionStatus(type) {
    return this.permissions[type] || 'unknown';
  }

  // ============================================
  // CHECK IF GRANTED
  // ============================================
  isGranted(type) {
    return this.permissions[type] === 'granted';
  }

  // ============================================
  // CHECK IF DENIED
  // ============================================
  isDenied(type) {
    return this.permissions[type] === 'denied';
  }

  // ============================================
  // RESET ALL PERMISSIONS
  // ============================================
  resetAllPermissions() {
    this.permissionAsked = {
      notification: false,
      location: false,
      camera: false,
      microphone: false
    };
    localStorage.removeItem('permissionAskedStatus');
    console.log('🔄 All permissions reset');
  }

  // ============================================
  // REQUEST ALL REQUIRED PERMISSIONS
  // ============================================
  async requestAllRequiredPermissions() {
    console.log('🔐 Requesting required permissions...');
    
    const results = {
      notification: await this.requestNotificationPermission(),
      location: await this.requestLocationPermission()
    };

    console.log('📊 Permission results:', results);
    return results;
  }

  // ============================================
  // SHOW WELCOME NOTIFICATION
  // ============================================
  showWelcomeNotification() {
    try {
      const notification = new Notification('🛒 Quick Dukan', {
        body: '✅ Notifications चालू हो गए! अब आपको ऑर्डर की live जानकारी मिलेगी।',
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-72.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        tag: 'welcome-notification'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);

      console.log('🔔 Welcome notification shown');

    } catch (error) {
      console.warn('⚠️ Welcome notification error:', error);
    }
  }
}

// ============================================
// AUTO INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Permission Manager
  window.permissionManager = new PermissionManager();

  // Auto-request notification permission (first time)
  setTimeout(() => {
    if (window.permissionManager && !window.permissionManager.permissionAsked.notification) {
      console.log('🔔 Auto-requesting notification permission (first time)');
      window.permissionManager.requestNotificationPermission();
    }
  }, 5000);

  // Auto-request location permission (first time)
  setTimeout(() => {
    if (window.permissionManager && !window.permissionManager.permissionAsked.location) {
      console.log('📍 Auto-requesting location permission (first time)');
      window.permissionManager.requestLocationPermission();
    }
  }, 8000);
});

// ============================================
// EXPORT FOR MODULES
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PermissionManager;
}