// ============================================
// CHECKOUT.JS - Premium Checkout Logic (Final)
// Quick Dukan - Compact Toggle | Multilingual
// Payment Section Removed from Checkout
// Payment Popup Opens After Direct Order
// ============================================

class CheckoutManager {
    constructor() {
        // DOM Elements
        this.checkoutModal = document.getElementById('checkoutModal');
        this.closeCheckoutBtn = document.getElementById('closeCheckout');
        this.confirmOrderBtn = document.getElementById('confirmOrderBtn');
        this.checkoutOverlay = this.checkoutModal?.querySelector('.checkout-overlay') || null;

        // Form fields
        this.customerName = document.getElementById('customerName');
        this.customerPhone = document.getElementById('customerPhone');
        this.villageCity = document.getElementById('villageCity');
        this.landmark = document.getElementById('landmark');
        this.pincode = document.getElementById('pincode');
        this.saveInfo = document.getElementById('saveInfo');

        // Cart total display
        this.checkoutItemCount = document.getElementById('checkoutItemCount');
        this.checkoutTotal = document.getElementById('checkoutTotal');

        // Delivery time
        this.deliveryTimeRadios = document.querySelectorAll('input[name="deliveryTime"]');
        this.manualTimeInput = document.getElementById('manualTime');

        // 🆕 ORDER METHOD BUTTONS (Compact TOP Toggle)
        this.whatsappMethodBtn = document.getElementById('whatsappMethodBtn');
        this.directMethodBtn = document.getElementById('directMethodBtn');
        this.selectedOrderMethod = 'direct'; // ✅ DEFAULT: WhatsApp

        // Confetti
        this.confettiContainer = document.getElementById('checkoutConfetti');

        // Data
        this.cartItems = [];
        this.cartTotal = 0;
        this.cartItemCount = 0;
        this.currentLang = 'hi';
        this.storageKey = 'quick-dukan-user-info';
        this.isSubmitting = false;

        // 🆕 ORDER TRACKING
        this.currentOrderId = null;
        this.orderTrackingInterval = null;
        this.orderStatusPopup = null;

        // 🔥 LOCATION MANAGER
        this.location = null;

        if (!this.checkoutModal) return;
        this.init();
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    init() {
        this.bindEvents();
        this.detectLanguage();
        this.initLocation();
        this.createOrderStatusPopup();
        console.log('✅ Checkout Manager Initialized');
    }

    initLocation() {
        const checkLocation = setInterval(() => {
            if (window.locationManager) {
                clearInterval(checkLocation);
                this.location = window.locationManager;

                const indicator = document.getElementById('locationIndicator');
                if (indicator) {
                    this.location.setIndicator(indicator);
                }

                console.log('📍 LocationManager linked to CheckoutManager');
            }
        }, 100);

        setTimeout(() => clearInterval(checkLocation), 5000);
    }

    detectLanguage() {
        if (window.languageManager?.currentLang) {
            this.currentLang = window.languageManager.currentLang;
        }
        if (this.location) {
            this.location.setLanguage(this.currentLang);
        }
    }

    getMsg(section, key) {
        const messages = {
            header: {
                hi: { title: 'ऑर्डर कन्फर्म करें', subtitle: 'डिलीवरी जानकारी भरें' },
                en: { title: 'Confirm Order', subtitle: 'Fill delivery details' }
            },
            cartTotal: {
                hi: { items: '{count} आइटम', total: 'कुल' },
                en: { items: '{count} items', total: 'Total' }
            },
            form: {
                hi: {
                    namePlaceholder: '👤  पूरा नाम लिखें...',
                    phonePlaceholder: '📱  मोबाइल नंबर',
                    villagePlaceholder: '🏘️  गाँव या शहर',
                    landmarkPlaceholder: '🏠  आस-पास की जगह (वैकल्पिक)',
                    pincodePlaceholder: '📮  पिन कोड (वैकल्पिक)',
                    deliveryTime: '⏱️  डिलीवरी समय',
                    now: 'अभी (30-45 मिनट)',
                    evening1: 'शाम 5-7 बजे',
                    evening2: 'शाम 7-9 बजे',
                    manual: 'अपना समय...',
                    saveInfo: 'जानकारी सेव करें',
                    whatsappMethod: 'WhatsApp',
                    directMethod: 'Direct'
                },
                en: {
                    namePlaceholder: '👤  Enter full name...',
                    phonePlaceholder: '📱  Mobile number',
                    villagePlaceholder: '🏘️  Village or City',
                    landmarkPlaceholder: '🏠  Nearby place (optional)',
                    pincodePlaceholder: '📮  Pincode (optional)',
                    deliveryTime: '⏱️  Delivery Time',
                    now: 'Now (30-45 min)',
                    evening1: 'Evening 5-7 PM',
                    evening2: 'Evening 7-9 PM',
                    manual: 'Custom time...',
                    saveInfo: 'Save information',
                    whatsappMethod: 'WhatsApp',
                    directMethod: 'Direct'
                }
            },
            button: {
                hi: {
                    waiting: '⏳ लोकेशन का इंतज़ार...',
                    gpsoff: '🔒 कृपया GPS चालू करें',
                    readyWhatsapp: '💬 WhatsApp पर भेजें →',
                    readyDirect: '🛒 ऑर्डर कन्फर्म करें →',
                    sending: '⏳ भेज रहे हैं...'
                },
                en: {
                    waiting: '⏳ Waiting for location...',
                    gpsoff: '🔒 Please turn ON GPS',
                    readyWhatsapp: '💬 Send on WhatsApp →',
                    readyDirect: '🛒 Confirm Order →',
                    sending: '⏳ Sending...'
                }
            },
            orderStatus: {
                hi: {
                    pending: '⏳ आपका ऑर्डर पेंडिंग है...',
                    confirmed: '✅ आपका ऑर्डर कन्फर्म हो गया!',
                    cancelled: '❌ आपका ऑर्डर कैंसिल कर दिया गया',
                    delivered: '🚚 आपका ऑर्डर डिलीवर हो गया!'
                },
                en: {
                    pending: '⏳ Your order is pending...',
                    confirmed: '✅ Your order is confirmed!',
                    cancelled: '❌ Your order has been cancelled',
                    delivered: '🚚 Your order has been delivered!'
                }
            },
            toast: {
                hi: {
                    orderSent: '✅ ऑर्डर WhatsApp पर भेज दिया!',
                    orderSentDirect: '✅ ऑर्डर सफलतापूर्वक हो गया!',
                    nameRequired: '⚠️ कृपया नाम लिखें',
                    phoneRequired: '⚠️ सही मोबाइल नंबर डालें',
                    cityRequired: '⚠️ गाँव/शहर लिखें',
                    gpsRequired: '⚠️ कृपया GPS चालू करें और लोकेशन लें',
                    loginRequired: '🔐 कृपया पहले Login करें!',
                    paymentFailed: '❌ पेमेंट फेल - ऑर्डर नहीं हुआ',
                    orderFailed: '⚠️ ऑर्डर फेल हो गया, दोबारा try करें'
                },
                en: {
                    orderSent: '✅ Order sent on WhatsApp!',
                    orderSentDirect: '✅ Order placed successfully!',
                    nameRequired: '⚠️ Please enter name',
                    phoneRequired: '⚠️ Enter valid mobile number',
                    cityRequired: '⚠️ Enter village/city',
                    gpsRequired: '⚠️ Please turn ON GPS and get location',
                    loginRequired: '🔐 Please Login first!',
                    paymentFailed: '❌ Payment failed - Order not placed',
                    orderFailed: '⚠️ Order failed, please try again'
                }
            }
        };

        return messages[section]?.[this.currentLang]?.[key] || 
               messages[section]?.en?.[key] || 
               `[${key}]`;
    }

    // ============================================
    // EVENT BINDING
    // ============================================
    bindEvents() {
        this.closeCheckoutBtn?.addEventListener('click', () => this.close());
        this.checkoutOverlay?.addEventListener('click', () => this.close());
        this.confirmOrderBtn?.addEventListener('click', () => this.handleOrderButton());
        this.customerPhone?.addEventListener('input', () => this.validatePhone());

        this.deliveryTimeRadios?.forEach(radio => {
            radio.addEventListener('change', () => {
                if (this.manualTimeInput) {
                    this.manualTimeInput.value = '';
                }
                this.updateTimeSelection();
            });
        });

        this.manualTimeInput?.addEventListener('input', () => {
            this.deliveryTimeRadios?.forEach(r => r.checked = false);
            this.updateTimeSelection();
        });

        this.whatsappMethodBtn?.addEventListener('click', () => this.selectOrderMethod('whatsapp'));
        this.directMethodBtn?.addEventListener('click', () => this.selectOrderMethod('direct'));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.checkoutModal.classList.contains('hidden')) {
                this.close();
            }
        });

        document.addEventListener('languageChanged', () => {
            this.detectLanguage();
            this.updateAllLabels();
        });
    }

    // ============================================
    // 🆕 SELECT ORDER METHOD (Compact Toggle - No Payment Section)
    // ============================================
    selectOrderMethod(method) {
        this.selectedOrderMethod = method;

        if (this.whatsappMethodBtn && this.directMethodBtn) {
            this.whatsappMethodBtn.classList.remove('selected');
            this.directMethodBtn.classList.remove('selected');

            if (method === 'whatsapp') {
                this.whatsappMethodBtn.classList.add('selected');
            } else {
                this.directMethodBtn.classList.add('selected');
            }
        }

        if (this.confirmOrderBtn?.classList.contains('state-ready')) {
            this.updateConfirmButtonText();
        }

        console.log('📋 Order method selected:', method);
    }

    // ============================================
    // 🆕 UPDATE CONFIRM BUTTON TEXT
    // ============================================
    updateConfirmButtonText() {
        if (!this.confirmOrderBtn) return;

        const btnText = this.confirmOrderBtn.querySelector('span:last-child');
        if (!btnText) return;

        if (this.selectedOrderMethod === 'whatsapp') {
            btnText.textContent = this.getMsg('button', 'readyWhatsapp');
        } else {
            btnText.textContent = this.getMsg('button', 'readyDirect');
        }
    }

    updateTimeSelection() {
        document.querySelectorAll('.time-radio-label').forEach(label => {
            const radio = label.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                label.classList.add('selected');
            } else {
                label.classList.remove('selected');
            }
        });
    }

    // ============================================
    // CREATE ORDER STATUS POPUP
    // ============================================
    createOrderStatusPopup() {
        if (document.getElementById('orderStatusPopup')) return;

        const popupHTML = `
            <div id="orderStatusPopup" class="order-status-popup hidden">
                <div class="order-status-overlay"></div>
                <div class="order-status-content">
                    <div class="order-status-icon" id="orderStatusIcon">⏳</div>
                    <h3 class="order-status-title" id="orderStatusTitle">ऑर्डर पेंडिंग है...</h3>
                    <p class="order-status-message" id="orderStatusMessage">कृपया थोड़ा इंतज़ार करें</p>
                    <div class="order-status-loader">
                        <div class="status-spinner"></div>
                    </div>
                    <button class="order-status-close-btn" id="orderStatusCloseBtn">ठीक है</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', popupHTML);

        document.getElementById('orderStatusCloseBtn')?.addEventListener('click', () => {
            this.hideOrderStatusPopup();
        });

        this.orderStatusPopup = document.getElementById('orderStatusPopup');
    }

    showOrderStatusPopup(status) {
        if (!this.orderStatusPopup) this.createOrderStatusPopup();

        const icon = document.getElementById('orderStatusIcon');
        const title = document.getElementById('orderStatusTitle');
        const message = document.getElementById('orderStatusMessage');
        const loader = document.querySelector('.order-status-loader');

        switch (status) {
            case 'Pending':
                if (icon) icon.textContent = '⏳';
                if (title) title.textContent = this.getMsg('orderStatus', 'pending');
                if (message) message.textContent = this.currentLang === 'hi' ? 
                    'हमारी टीम जल्द ही आपके ऑर्डर को कन्फर्म करेगी' : 
                    'Our team will confirm your order soon';
                if (loader) loader.style.display = 'flex';
                break;

            case 'Confirmed':
                if (icon) icon.textContent = '✅';
                if (title) title.textContent = this.getMsg('orderStatus', 'confirmed');
                if (message) message.textContent = this.currentLang === 'hi' ? 
                    'आपका ऑर्डर कन्फर्म हो गया है! जल्द ही डिलीवर किया जाएगा' : 
                    'Your order is confirmed! Will be delivered soon';
                if (loader) loader.style.display = 'none';
                break;

            case 'Cancelled':
                if (icon) icon.textContent = '❌';
                if (title) title.textContent = this.getMsg('orderStatus', 'cancelled');
                if (message) message.textContent = this.currentLang === 'hi' ? 
                    'माफ़ कीजिए, आपका ऑर्डर कैंसिल कर दिया गया है' : 
                    'Sorry, your order has been cancelled';
                if (loader) loader.style.display = 'none';
                break;

            case 'Delivered':
                if (icon) icon.textContent = '🚚';
                if (title) title.textContent = this.getMsg('orderStatus', 'delivered');
                if (message) message.textContent = this.currentLang === 'hi' ? 
                    'धन्यवाद! आपका ऑर्डर सफलतापूर्वक डिलीवर हो गया' : 
                    'Thank you! Your order has been delivered successfully';
                if (loader) loader.style.display = 'none';
                break;
        }

        this.orderStatusPopup?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        if (status === 'Delivered' || status === 'Cancelled') {
            setTimeout(() => {
                this.hideOrderStatusPopup();
                this.stopOrderTracking();
            }, 3000);
        }
    }

    hideOrderStatusPopup() {
        this.orderStatusPopup?.classList.add('hidden');
        document.body.style.overflow = '';
    }

    startOrderTracking(orderId) {
        this.currentOrderId = orderId;
        this.checkOrderStatusNow();

        this.orderTrackingInterval = setInterval(() => {
            this.checkOrderStatusNow();
        }, 5000);

        console.log('🔄 Order tracking started for:', orderId);
    }

    async checkOrderStatusNow() {
        if (!this.currentOrderId) return;

        try {
            const API_URL = 'https://script.google.com/macros/s/AKfycbxuqhAw1n8h2d434kxB7sUfMeuzCZLArJz_KPN1q2LvOOBaguPRdcgi7WnssWBvFvCc/exec';
            const response = await fetch(`${API_URL}?action=getOrderStatus&orderId=${this.currentOrderId}`);
            const data = await response.json();

            if (data && data.success) {
                console.log('📊 Order Status:', data.status);
                this.showOrderStatusPopup(data.status);

                if (data.status === 'Delivered' || data.status === 'Cancelled') {
                    this.stopOrderTracking();
                }
            }
        } catch (error) {
            console.log('⚠️ Status check error:', error.message);
        }
    }

    stopOrderTracking() {
        if (this.orderTrackingInterval) {
            clearInterval(this.orderTrackingInterval);
            this.orderTrackingInterval = null;
            console.log('🛑 Order tracking stopped');
        }
    }

    // ============================================
    // OPEN / CLOSE
    // ============================================
    open(cartItems, totalPrice, totalItems) {
        if (!this.checkoutModal) return;

        this.cartItems = cartItems || [];
        this.cartTotal = totalPrice || 0;
        this.cartItemCount = totalItems || 0;
        this.isSubmitting = false;

        this.updateCartTotal();
        this.updateAllLabels();
        this.fillSavedData();
        this.resetTimeSelection();

        // ✅ Default WhatsApp select
        this.selectOrderMethod('direct');

        this.checkoutModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        this.setButtonState('waiting');

        if (this.location) {
            this.location.setLanguage(this.currentLang);
            this.location.start(
                (data) => this.onLocationFound(data),
                (error) => this.onLocationError(error)
            );
        }
    }

    close() {
        if (!this.checkoutModal) return;

        if (this.location) {
            this.location.stop();
        }

        this.stopOrderTracking();
        this.clearForm();

        this.checkoutModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    clearForm() {
        if (this.customerName) this.customerName.value = '';
        if (this.customerPhone) this.customerPhone.value = '';
        if (this.villageCity) this.villageCity.value = '';
        if (this.landmark) this.landmark.value = '';
        if (this.pincode) this.pincode.value = '';
        if (this.manualTimeInput) this.manualTimeInput.value = '';

        this.deliveryTimeRadios?.forEach(r => r.checked = false);
        document.querySelectorAll('.time-radio-label').forEach(l => l.classList.remove('selected'));
        document.querySelectorAll('.form-input').forEach(el => {
            el.classList.remove('error', 'valid');
        });

        // ✅ Default WhatsApp select
        this.selectOrderMethod('direct');
    }

    resetTimeSelection() {
        const nowRadio = document.querySelector('input[value="अभी"]') || 
                         document.querySelector('input[value="Now"]');
        if (nowRadio) nowRadio.checked = true;
        if (this.manualTimeInput) this.manualTimeInput.value = '';
        this.updateTimeSelection();
    }

    onLocationFound(data) {
        console.log('📍 Location found!', data);
        this.setButtonState('ready');
    }

    onLocationError(error) {
        console.log('📍 Location error:', error);
        this.setButtonState('gpsoff');
    }

    updateCartTotal() {
        if (this.checkoutItemCount) {
            this.checkoutItemCount.textContent = this.getMsg('cartTotal', 'items').replace('{count}', this.cartItemCount);
        }
        if (this.checkoutTotal) {
            this.checkoutTotal.textContent = `₹${this.cartTotal}`;
        }
    }

    updateAllLabels() {
        const title = document.getElementById('checkoutTitle');
        const subtitle = document.querySelector('.checkout-subtitle');
        if (title) title.textContent = this.getMsg('header', 'title');
        if (subtitle) subtitle.textContent = this.getMsg('header', 'subtitle');

        this.updateCartTotal();

        if (this.customerName) this.customerName.placeholder = this.getMsg('form', 'namePlaceholder');
        if (this.customerPhone) this.customerPhone.placeholder = this.getMsg('form', 'phonePlaceholder');
        if (this.villageCity) this.villageCity.placeholder = this.getMsg('form', 'villagePlaceholder');
        if (this.landmark) this.landmark.placeholder = this.getMsg('form', 'landmarkPlaceholder');
        if (this.pincode) this.pincode.placeholder = this.getMsg('form', 'pincodePlaceholder');

        const timeLabel = document.querySelector('.delivery-time-label span:last-child');
        if (timeLabel) timeLabel.textContent = this.getMsg('form', 'deliveryTime');

        const nowLabel = document.querySelector('label[for="timeNow"] span:last-child');
        const eve1Label = document.querySelector('label[for="timeEve1"] span:last-child');
        const eve2Label = document.querySelector('label[for="timeEve2"] span:last-child');
        if (nowLabel) nowLabel.textContent = this.getMsg('form', 'now');
        if (eve1Label) eve1Label.textContent = this.getMsg('form', 'evening1');
        if (eve2Label) eve2Label.textContent = this.getMsg('form', 'evening2');

        if (this.manualTimeInput) this.manualTimeInput.placeholder = this.getMsg('form', 'manual');

        const saveText = document.querySelector('.checkbox-label span:last-child');
        if (saveText) saveText.textContent = this.getMsg('form', 'saveInfo');

        const whatsappBtnText = document.querySelector('#whatsappMethodBtn .method-btn-text');
        const directBtnText = document.querySelector('#directMethodBtn .method-btn-text');
        if (whatsappBtnText) whatsappBtnText.textContent = this.getMsg('form', 'whatsappMethod');
        if (directBtnText) directBtnText.textContent = this.getMsg('form', 'directMethod');

        if (this.location?.isReady()) {
            this.setButtonState('ready');
        } else if (this.location?.isSearching) {
            this.setButtonState('waiting');
        } else {
            this.setButtonState('gpsoff');
        }
    }

    setButtonState(state) {
        if (!this.confirmOrderBtn) return;

        this.confirmOrderBtn.classList.remove('state-waiting', 'state-gpsoff', 'state-ready', 'state-sending');

        const existingSpinner = this.confirmOrderBtn.querySelector('.btn-spinner');
        if (existingSpinner) existingSpinner.remove();

        const existingWhatsAppIcon = this.confirmOrderBtn.querySelector('.whatsapp-icon');
        if (existingWhatsAppIcon) existingWhatsAppIcon.remove();

        const btnText = this.confirmOrderBtn.querySelector('span:last-child');

        switch (state) {
            case 'waiting':
                this.confirmOrderBtn.classList.add('state-waiting');
                this.confirmOrderBtn.disabled = true;
                if (btnText) btnText.textContent = this.getMsg('button', 'waiting');
                this.confirmOrderBtn.insertAdjacentHTML('afterbegin', '<span class="btn-spinner"></span>');
                break;

            case 'gpsoff':
                this.confirmOrderBtn.classList.add('state-gpsoff');
                this.confirmOrderBtn.disabled = false;
                if (btnText) btnText.textContent = this.getMsg('button', 'gpsoff');
                break;

            case 'ready':
                this.confirmOrderBtn.classList.add('state-ready');
                this.confirmOrderBtn.disabled = false;
                if (this.selectedOrderMethod === 'whatsapp') {
                    if (btnText) btnText.textContent = this.getMsg('button', 'readyWhatsapp');
                    this.confirmOrderBtn.insertAdjacentHTML('afterbegin', '<span class="whatsapp-icon">💬</span>');
                } else {
                    if (btnText) btnText.textContent = this.getMsg('button', 'readyDirect');
                }
                break;

            case 'sending':
                this.confirmOrderBtn.classList.add('state-sending');
                this.confirmOrderBtn.disabled = true;
                if (btnText) btnText.textContent = this.getMsg('button', 'sending');
                this.confirmOrderBtn.insertAdjacentHTML('afterbegin', '<span class="btn-spinner"></span>');
                break;
        }
    }

    handleOrderButton() {
        if (this.confirmOrderBtn.classList.contains('state-gpsoff')) {
            if (this.location) {
                this.location.showPopup();
            }
            return;
        }

        if (this.confirmOrderBtn.classList.contains('state-ready')) {
            this.submitOrder();
            return;
        }
    }

    validatePhone() {
        if (!this.customerPhone) return;

        const phone = this.customerPhone.value.replace(/\D/g, '');

        if (phone.length === 0) {
            this.customerPhone.classList.remove('error', 'valid');
            return;
        }

        if (phone.length === 10 && /^[6-9]/.test(phone)) {
            this.customerPhone.classList.remove('error');
            this.customerPhone.classList.add('valid');
        } else {
            this.customerPhone.classList.remove('valid');
            this.customerPhone.classList.add('error');
            
            this.customerPhone.style.animation = 'none';
            this.customerPhone.offsetHeight;
            this.customerPhone.style.animation = 'shake 0.3s ease';
        }
    }

    // ============================================
    // 🔥 SUBMIT ORDER
    // ============================================
    async submitOrder() {
        if (this.isSubmitting) {
            console.log('⚠️ Order already submitting...');
            return;
        }
        this.isSubmitting = true;

        const name = this.customerName?.value?.trim();
        const phone = this.customerPhone?.value?.replace(/\D/g, '');
        const villageCity = this.villageCity?.value?.trim();

        // Validate Name
        if (!name || name.length < 2) {
            this.showToast(this.getMsg('toast', 'nameRequired'));
            this.customerName?.classList.add('error');
            this.customerName?.focus();
            this.isSubmitting = false;
            return;
        }
        this.customerName?.classList.remove('error');

        // Validate Phone
        if (!phone || phone.length !== 10 || !/^[6-9]/.test(phone)) {
            this.showToast(this.getMsg('toast', 'phoneRequired'));
            this.customerPhone?.classList.add('error');
            this.customerPhone?.focus();
            this.isSubmitting = false;
            return;
        }
        this.customerPhone?.classList.remove('error');

        // Validate Village/City
        if (!villageCity || villageCity.length < 2) {
            this.showToast(this.getMsg('toast', 'cityRequired'));
            this.villageCity?.classList.add('error');
            this.villageCity?.focus();
            this.isSubmitting = false;
            return;
        }
        this.villageCity?.classList.remove('error');

        // USER BLOCK CHECK
        try {
            const apiUrl = 'https://script.google.com/macros/s/AKfycbxuqhAw1n8h2d434kxB7sUfMeuzCZLArJz_KPN1q2LvOOBaguPRdcgi7WnssWBvFvCc/exec';
            const blockResponse = await fetch(`${apiUrl}?action=checkUserBlockedForOrder&phone=${phone}`);
            const blockData = await blockResponse.json();

            if (blockData.success && blockData.blocked) {
                alert('🚫 आपको admin ने block कर दिया है। आप order नहीं कर सकते।\n\nकारण: ' + (blockData.reason || 'नहीं बताया गया'));
                this.close();
                this.isSubmitting = false;
                return;
            }
        } catch (error) {
            console.log('⚠️ Block check error:', error);
        }

        // Get location
        let locationData = { lat: '', lng: '', url: '' };

        if (this.location && this.location.isReady()) {
            locationData = this.location.getData();
        } else {
            const lat = document.getElementById('latitude')?.value;
            const lng = document.getElementById('longitude')?.value;
            const locationUrl = document.getElementById('locationUrl')?.value;

            if (lat && lng && parseFloat(lat) !== 0 && parseFloat(lng) !== 0) {
                locationData = {
                    lat: lat,
                    lng: lng,
                    url: locationUrl || `https://maps.google.com/?q=${lat},${lng}`
                };
            }
        }

        if (!locationData.lat || !locationData.lng || 
            parseFloat(locationData.lat) === 0 || parseFloat(locationData.lng) === 0) {
            this.showToast(this.getMsg('toast', 'gpsRequired'));
            if (this.location) {
                this.location.showPopup();
            }
            this.isSubmitting = false;
            return;
        }

        this.setButtonState('sending');
        this.saveUserInfo();

        const deliveryTime = this.getSelectedDeliveryTime();

        const orderData = {
            customer: {
                name: name,
                phone: '+91 ' + phone,
                villageCity: villageCity,
                landmark: this.landmark?.value?.trim() || '',
                pincode: this.pincode?.value?.trim() || '',
                deliveryTime: deliveryTime,
            },
            items: this.cartItems,
            totals: {
                total: this.cartTotal,
                itemCount: this.cartItemCount,
            },
            location: locationData,
            orderMethod: this.selectedOrderMethod,
        };

        console.log('📦 Final Order Data:', JSON.stringify(orderData, null, 2));

        // ✅ WhatsApp ya Direct order
        if (this.selectedOrderMethod === 'whatsapp') {
            this.submitWhatsAppOrder(orderData);
        } else {
            this.submitDirectOrder(orderData);
        }

        setTimeout(() => {
            this.isSubmitting = false;
        }, 2000);
    }

    // ============================================
    // ✅ SUBMIT WHATSAPP ORDER
    // ============================================
    submitWhatsAppOrder(orderData) {
        if (window.whatsappManager?.sendOrder) {
            window.whatsappManager.sendOrder(orderData);
        } else {
            this.sendDirectWhatsApp(orderData);
        }

        this.saveToOrderHistory(orderData);
        this.triggerConfetti();
        this.showSuccessPopup(orderData);
        this.finalizeOrder('whatsapp');
    }

    // ============================================
    // ✅ SUBMIT DIRECT ORDER - Payment Popup Opens
    // ============================================
    async submitDirectOrder(orderData) {
        console.log('📦 Direct Order - Payment Popup khulega');

        // Login check
        const userPhone = localStorage.getItem('userPhone');
        if (!userPhone) {
            this.showToast(this.getMsg('toast', 'loginRequired'));
            if (typeof openLoginPopup === 'function') {
                openLoginPopup();
            }
            this.setButtonState('ready');
            return;
        }

        // Payment popup open karo
        if (window.onlinePaymentManager) {
            window.onlinePaymentManager.show(orderData, {
                onPaymentSuccess: async (paymentData) => {
                    console.log('✅ Payment successful:', paymentData);
                    await this.saveDirectOrderToSheets(orderData, paymentData);
                },
                onPaymentFailure: (error) => {
                    console.log('❌ Payment failed:', error);
                    this.setButtonState('ready');
                    this.showToast(this.getMsg('toast', 'paymentFailed'));
                },
                onCODSelected: async (paymentData) => {
                    console.log('🏍️ COD selected');
                    await this.saveDirectOrderToSheets(orderData, paymentData);
                }
            });
        } else {
            console.log('⚠️ Payment Manager not loaded');
            this.setButtonState('ready');
            this.showToast('⚠️ Payment system not available');
        }
    }

    // ============================================
    // ✅ SAVE ORDER TO GOOGLE SHEETS
    // ============================================
    async saveDirectOrderToSheets(orderData, paymentData) {
        console.log('📦 Saving order to Google Sheets...');

        try {
            const itemsText = this.formatItemsForSheet(orderData.items);
            const API_URL = 'https://script.google.com/macros/s/AKfycbxuqhAw1n8h2d434kxB7sUfMeuzCZLArJz_KPN1q2LvOOBaguPRdcgi7WnssWBvFvCc/exec';

            const orderParams = new URLSearchParams({
                customerName: orderData.customer.name,
                phone: orderData.customer.phone.replace(/\D/g, ''),
                villageCity: orderData.customer.villageCity,
                landmark: orderData.customer.landmark || '',
                pincode: orderData.customer.pincode || '',
                deliveryTime: orderData.customer.deliveryTime,
                orderDetails: itemsText,
                totalAmount: orderData.totals.total,
                itemCount: orderData.totals.itemCount,
                latitude: orderData.location.lat,
                longitude: orderData.location.lng,
                locationUrl: orderData.location.url || '',
                orderMethod: 'direct',
                paymentMethod: paymentData.method,
                paymentStatus: paymentData.status || 'Pending',
                paymentId: paymentData.transactionId || '',
            });

            const response = await fetch(`${API_URL}?action=saveOrder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: orderParams.toString(),
            });

            const result = await response.json();

            if (result.success && result.orderId) {
                console.log('✅ Order saved! ID:', result.orderId);
                orderData.orderId = result.orderId;

                if (paymentData.method === 'UPI') {
                    await this.savePaymentRecord(result.orderId, orderData, paymentData);
                }

                this.saveToOrderHistory(orderData);
                this.triggerConfetti();
                this.showToast(this.getMsg('toast', 'orderSentDirect'));
                this.startOrderTracking(result.orderId);
                this.finalizeOrder('direct');
            } else {
                this.setButtonState('ready');
                this.showToast(this.getMsg('toast', 'orderFailed'));
            }
        } catch (error) {
            console.error('❌ Error:', error);
            this.setButtonState('ready');
            this.showToast(this.getMsg('toast', 'orderFailed'));
        }
    }

    // ============================================
    // ✅ SAVE PAYMENT RECORD
    // ============================================
    async savePaymentRecord(orderId, orderData, paymentData) {
        try {
            const API_URL = 'https://script.google.com/macros/s/AKfycbxuqhAw1n8h2d434kxB7sUfMeuzCZLArJz_KPN1q2LvOOBaguPRdcgi7WnssWBvFvCc/exec';
            const itemsText = this.formatItemsForSheet(orderData.items);

            const paymentParams = new URLSearchParams({
                orderId: orderId,
                phone: orderData.customer.phone.replace(/\D/g, ''),
                name: orderData.customer.name,
                items: itemsText,
                productAmount: paymentData.amount,
                chargeAmount: paymentData.charge || 0,
                totalAmount: paymentData.total || paymentData.amount,
                method: paymentData.method,
            });

            await fetch(`${API_URL}?action=savePayment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: paymentParams.toString(),
            });
        } catch (error) {
            console.log('⚠️ Payment record error:', error);
        }
    }

    // ============================================
    // ✅ FORMAT ITEMS FOR SHEET
    // ============================================
    formatItemsForSheet(items) {
        if (!items || items.length === 0) return '';

        return items.map(item => {
            const name = typeof item.name === 'object' 
                ? (item.name.hi || item.name.en || '') 
                : (item.name || '');
            const unit = typeof item.unit === 'object' 
                ? (item.unit.hi || item.unit.en || '') 
                : (item.unit || '');
            const qty = item.quantity || 1;
            const price = item.price || 0;
            return `${name} (${unit}) ×${qty} = ₹${price * qty}`;
        }).join('\n');
    }

    // ============================================
    // SAVE TO ORDER HISTORY
    // ============================================
    saveToOrderHistory(orderData) {
        if (window.ordersManager?.saveOrder) {
            window.ordersManager.saveOrder({
                items: this.cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    unit: item.unit,
                    discount: item.discount || 0,
                    quantity: item.quantity || 1,
                })),
                total: this.cartTotal,
                itemCount: this.cartItemCount,
                deliveryTime: orderData.customer.deliveryTime,
                location: orderData.location,
                orderMethod: orderData.orderMethod,
                orderId: orderData.orderId || null,
            });
        }
    }

    showSuccessPopup(orderData) {
        setTimeout(() => {
            if (window.orderPopupManager) {
                window.orderPopupManager.showSuccessPopup({
                    itemCount: this.cartItemCount,
                    total: this.cartTotal,
                    deliveryTime: orderData.customer.deliveryTime,
                });
            }
        }, 6000);
    }

    finalizeOrder(method) {
        setTimeout(() => {
            this.close();

            if (window.cartManager) {
                window.cartManager.cart = [];
                window.cartManager.saveCart();
                window.cartManager.updateBadge();
                if (!document.getElementById('cartModal')?.classList.contains('hidden')) {
                    window.cartManager.closeCart();
                }
            }

            if (method === 'direct') {
                this.showToast(this.getMsg('toast', 'orderSentDirect'));
            } else {
                this.showToast(this.getMsg('toast', 'orderSent'));
            }
        }, 2000);
    }

    getSelectedDeliveryTime() {
        const checkedRadio = document.querySelector('input[name="deliveryTime"]:checked');
        if (checkedRadio) return checkedRadio.value;

        const manualTime = this.manualTimeInput?.value?.trim();
        if (manualTime) return manualTime;

        return this.currentLang === 'hi' ? 'अभी' : 'Now';
    }

    sendDirectWhatsApp(orderData) {
        const isHindi = this.currentLang === 'hi';

        let message = isHindi
            ? '🛒 *Quick Dukan - नया ऑर्डर*\n\n━━━━━━━━━━━━━━━━\n\n'
            : '🛒 *Quick Dukan - New Order*\n\n━━━━━━━━━━━━━━━━\n\n';

        orderData.items.forEach((item, index) => {
            const name = typeof item.name === 'object' 
                ? (item.name[this.currentLang] || item.name.hi || item.name.en) 
                : item.name;
            const unit = typeof item.unit === 'object' 
                ? (item.unit[this.currentLang] || item.unit.hi || item.unit.en) 
                : (item.unit || '');
            message += `${index + 1}. *${name}*\n   ${unit} × ${item.quantity || 1} = ₹${(item.price || 0) * (item.quantity || 1)}\n`;
        });

        message += '\n━━━━━━━━━━━━━━━━\n';
        message += isHindi
            ? `📦 कुल: ${orderData.totals.itemCount} आइटम | 💰 कुल राशि: ₹${orderData.totals.total}\n\n`
            : `📦 Total: ${orderData.totals.itemCount} items | 💰 Total: ₹${orderData.totals.total}\n\n`;

        message += isHindi ? '👤 *ग्राहक जानकारी:*\n' : '👤 *Customer Info:*\n';
        message += `${orderData.customer.name}\n`;
        message += `${orderData.customer.phone}\n`;
        message += `${orderData.customer.villageCity}`;
        if (orderData.customer.landmark) message += `, ${orderData.customer.landmark}`;
        message += '\n';
        if (orderData.customer.deliveryTime) {
            message += isHindi 
                ? `⏱️ डिलीवरी: ${orderData.customer.deliveryTime}\n` 
                : `⏱️ Delivery: ${orderData.customer.deliveryTime}\n`;
        }
        if (orderData.location.url) {
            message += `\n📍 ${orderData.location.url}\n`;
        }
        message += isHindi ? '\n🙏 कृपया ऑर्डर कन्फर्म करें।' : '\n🙏 Please confirm the order.';

        const whatsappNumber = window.CONFIG?.whatsappNumber || '919719312956';
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }

    saveUserInfo() {
        if (!this.saveInfo?.checked) return;

        const data = {
            name: this.customerName?.value || '',
            phone: this.customerPhone?.value || '',
            villageCity: this.villageCity?.value || '',
            landmark: this.landmark?.value || '',
            pincode: this.pincode?.value || '',
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {}
    }

    fillSavedData() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return;

            const data = JSON.parse(saved);

            if (this.customerName && data.name) this.customerName.value = data.name;
            if (this.customerPhone && data.phone) {
                this.customerPhone.value = data.phone;
                this.validatePhone();
            }
            if (this.villageCity && data.villageCity) this.villageCity.value = data.villageCity;
            if (this.landmark && data.landmark) this.landmark.value = data.landmark;
            if (this.pincode && data.pincode) this.pincode.value = data.pincode;
        } catch (e) {}
    }

    triggerConfetti() {
        if (!this.confettiContainer) return;

        this.confettiContainer.innerHTML = '';

        const colors = ['#FF9933', '#138808', '#FFD700', '#FF4444', '#25D366', '#FF6D00'];

        for (let i = 0; i < 40; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 0.5 + 's';
            piece.style.animationDuration = (Math.random() * 1 + 1) + 's';
            this.confettiContainer.appendChild(piece);
            setTimeout(() => piece.remove(), 2000);
        }
    }

    showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = msg;
        toast.classList.remove('hidden');
        toast.style.animation = 'none';
        toast.offsetHeight;
        toast.style.animation = 'slideUp 0.3s ease';

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 2500);
    }

    destroy() {
        if (this.location) {
            this.location.stop();
        }
        this.stopOrderTracking();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.checkoutManager = new CheckoutManager();
});