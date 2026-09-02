// ============================================
// PAYMENT-ONLINE.JS - Complete Online Payment
// UPI + COD | Random Service Charge | Payment Sheet Save
// Updated: Random Charge + COD/UPI Both Save to Sheet
// ============================================

class OnlinePaymentManager {
    constructor() {
        // UPI Details
        this.upiId = '9719495844-2@ybl';
        this.payeeName = 'Quick Dukan';
        this.merchantCode = 'QKDKAN';

        // API URL (Google Apps Script)
        this.API_URL = 'https://script.google.com/macros/s/AKfycbxuqhAw1n8h2d434kxB7sUfMeuzCZLArJz_KPN1q2LvOOBaguPRdcgi7WnssWBvFvCc/exec';

        // Payment Settings
        this.paymentSettings = {
            chargeEnabled: true,
            chargeMin: 1,
            chargeMax: 5
        };

        // Current Payment Data
        this.currentOrder = null;
        this.currentAmount = 0;
        this.currentCharge = 0;
        this.currentTotal = 0;
        this.currentUser = { phone: '', name: '' };
        this.currentLang = 'hi';

        // Callbacks
        this.callbacks = {
            onPaymentSuccess: null,
            onPaymentFailure: null,
            onCODSelected: null,
        };

        // Payment Status
        this.paymentCompleted = false;
        this.paymentMethod = '';
        this.isProcessing = false;

        this.init();
    }

    // ============================================
    // INIT
    // ============================================
    async init() {
        this.detectLanguage();
        await this.loadPaymentSettings();
        document.addEventListener('languageChanged', () => this.detectLanguage());
        console.log('💳 Online Payment Manager Ready');
    }

    detectLanguage() {
        if (window.languageManager?.currentLang) {
            this.currentLang = window.languageManager.currentLang;
        }
    }

    // ============================================
    // LOAD PAYMENT SETTINGS
    // ============================================
    async loadPaymentSettings() {
        try {
            const response = await fetch(`${this.API_URL}?action=getPaymentSettings`);
            const data = await response.json();

            if (data.success) {
                this.paymentSettings = {
                    chargeEnabled: data.chargeEnabled !== false,
                    chargeMin: data.chargeMin || 1,
                    chargeMax: data.chargeMax || 5
                };
                console.log('⚙️ Payment Settings:', this.paymentSettings);
            }
        } catch (error) {
            console.log('⚠️ Settings load error:', error);
        }
    }

    // ============================================
    // CHECK USER LOGIN
    // ============================================
    isUserLoggedIn() {
        const phone = localStorage.getItem('userPhone');
        if (phone) {
            this.currentUser.phone = phone;
            return true;
        }
        return false;
    }

    // ============================================
    // ✅ SHOW PAYMENT POPUP
    // ============================================
    async show(orderData, callbacks = {}) {
        this.callbacks = {
            onPaymentSuccess: callbacks.onPaymentSuccess || null,
            onPaymentFailure: callbacks.onPaymentFailure || null,
            onCODSelected: callbacks.onCODSelected || callbacks.onPaymentSuccess || null,
        };

        // Login check
        if (!this.isUserLoggedIn()) {
            this.showToast('🔐 कृपया पहले Login करें!');
            if (typeof openLoginPopup === 'function') {
                openLoginPopup();
            }
            return;
        }

        // Settings reload
        await this.loadPaymentSettings();

        // Existing popup remove
        const existing = document.querySelector('.payment-online-container');
        if (existing) existing.remove();

        // Order data set
        this.currentOrder = orderData;
        this.currentAmount = parseFloat(orderData.totals?.total || orderData.total || 0);

        // User info
        const userProfile = await this.getUserProfile();
        if (userProfile) {
            this.currentUser.name = userProfile.name || '';
            this.currentUser.phone = userProfile.phone || this.currentUser.phone;
        }

        // ✅ RANDOM Service Charge (₹1-5)
        this.calculateCharge();

        const hi = this.currentLang === 'hi';

        const container = document.createElement('div');
        container.className = 'payment-online-container';
        container.innerHTML = `
            <div class="payment-online-overlay"></div>
            <div class="payment-online-card">
                <!-- Header -->
                <div class="payment-online-header">
                    <div class="payment-header-left">
                        <span class="payment-header-icon">🔒</span>
                        <div>
                            <h3>${hi ? 'सुरक्षित भुगतान' : 'Secure Payment'}</h3>
                            <p class="payment-order-id">${hi ? 'ऑर्डर कन्फर्म करने के लिए' : 'To confirm your order'}</p>
                        </div>
                    </div>
                    <button class="payment-close-btn" id="paymentCloseBtn">✕</button>
                </div>
                
                <!-- Amount Summary -->
                <div class="payment-amount-section">
                    <div class="payment-items-count">
                        📦 ${hi ? orderData.totals?.itemCount + ' आइटम' : orderData.totals?.itemCount + ' items'}
                    </div>
                    <div class="amount-row">
                        <span>${hi ? 'प्रोडक्ट राशि' : 'Product Amount'}</span>
                        <span>₹${this.currentAmount.toFixed(2)}</span>
                    </div>
                    ${this.paymentSettings.chargeEnabled && this.currentCharge > 0 ? `
                    <div class="amount-row charge-row">
                        <span>${hi ? 'ऑनलाइन सेवा शुल्क' : 'Service Charge'}</span>
                        <span>+ ₹${this.currentCharge.toFixed(2)}</span>
                    </div>
                    <div class="charge-message">
                        🛡️ ${hi 
                            ? 'सुरक्षित भुगतान के लिए ₹' + this.paymentSettings.chargeMin + '-₹' + this.paymentSettings.chargeMax + ' का सेवा शुल्क लागू होता है।' 
                            : 'Secure payment service charge of ₹' + this.paymentSettings.chargeMin + '-₹' + this.paymentSettings.chargeMax + ' applies.'}
                    </div>
                    ` : ''}
                    <div class="amount-row total-row">
                        <span>${hi ? 'कुल भुगतान' : 'Total Payable'}</span>
                        <span class="total-amount">₹${this.currentTotal.toFixed(2)}</span>
                    </div>
                </div>
                
                <!-- UPI Section -->
                <div class="payment-upi-section">
                    <p class="upi-title">📱 ${hi ? 'UPI से भुगतान करें' : 'Pay via UPI'}</p>
                    
                    <!-- QR Code -->
                    <div class="qr-container" id="qrContainer">
                        <img id="qrImage" 
                             src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.buildUPIUrl(this.currentTotal))}&bgcolor=ffffff&color=000000" 
                             alt="Pay ₹${this.currentTotal}"
                             style="width:170px;height:170px;cursor:pointer;border-radius:12px;border:2px solid #E0E0E0;"
                             title="${hi ? 'टैप करें - UPI ऐप खोलें' : 'Tap to open UPI app'}">
                        <div class="qr-scan-hint">📷 ${hi ? 'स्कैन करें' : 'Scan QR'}</div>
                    </div>
                    
                    <p class="qr-amount">₹${this.currentTotal.toFixed(2)}</p>
                    <p class="qr-upi-id">UPI: ${this.upiId}</p>
                    
                    <div class="upi-actions">
                        <button class="copy-upi-btn" id="btnCopyUPI">
                            📋 ${hi ? 'UPI ID कॉपी' : 'Copy UPI ID'}
                        </button>
                        <button class="open-upi-btn" id="btnOpenUPI">
                            📱 ${hi ? 'UPI ऐप खोलें' : 'Open UPI App'}
                        </button>
                    </div>
                    
                    <!-- UPI Apps -->
                    <div class="upi-apps-grid">
                        <button class="upi-app-btn" data-app="gpay">
                            <span class="app-icon app-gpay">G</span>
                            <span>GPay</span>
                        </button>
                        <button class="upi-app-btn" data-app="phonepe">
                            <span class="app-icon app-phonepe">पे</span>
                            <span>PhonePe</span>
                        </button>
                        <button class="upi-app-btn" data-app="paytm">
                            <span class="app-icon app-paytm">₹</span>
                            <span>Paytm</span>
                        </button>
                        <button class="upi-app-btn" data-app="bhim">
                            <span class="app-icon app-bhim">B</span>
                            <span>BHIM</span>
                        </button>
                    </div>
                </div>
                
                <!-- Divider -->
                <div class="payment-divider">
                    <span>${hi ? 'या' : 'OR'}</span>
                </div>
                
                <!-- COD Section -->
                <div class="payment-cod-section">
                    <button class="cod-btn" id="btnCOD" type="button">
                        <span class="cod-icon">🏍️</span>
                        <div class="cod-text">
                            <strong>${hi ? 'कैश ऑन डिलीवरी' : 'Cash on Delivery'}</strong>
                            <small>${hi ? 'सामान आने पर ₹' + this.currentAmount + ' दें' : 'Pay ₹' + this.currentAmount + ' on delivery'}</small>
                        </div>
                        <span class="cod-arrow">→</span>
                    </button>
                </div>
                
                <!-- Payment Done -->
                <div class="payment-done-section">
                    <button class="payment-done-btn" id="btnPaymentDone" type="button">
                        ✅ ${hi ? 'मैंने Payment कर दिया' : 'I have paid'}
                        <span class="done-subtext">${hi ? 'ऑर्डर कन्फर्म करें' : 'Confirm Order'}</span>
                    </button>
                </div>
                
                <!-- Secure Note -->
                <div class="payment-secure-note">
                    🔒 ${hi ? '100% सुरक्षित भुगतान' : '100% Secure Payment'}
                </div>
            </div>
        `;

        document.body.appendChild(container);
        requestAnimationFrame(() => container.classList.add('show'));

        this.bindEvents(container);
    }

    // ============================================
    // ✅ RANDOM CHARGE (₹1-5) - Pehle jaisa
    // ============================================
    calculateCharge() {
        if (this.paymentSettings.chargeEnabled && this.currentAmount > 0) {
            const min = this.paymentSettings.chargeMin;
            const max = this.paymentSettings.chargeMax;
            this.currentCharge = Math.floor(Math.random() * (max - min + 1)) + min;
        } else {
            this.currentCharge = 0;
        }
        this.currentTotal = this.currentAmount + this.currentCharge;
        console.log('💰 Amount:', this.currentAmount, 'Charge:', this.currentCharge, 'Total:', this.currentTotal);
    }

    // ============================================
    // GET USER PROFILE
    // ============================================
    async getUserProfile() {
        try {
            const phone = this.currentUser.phone;
            const response = await fetch(`${this.API_URL}?action=getUserProfile&phone=${phone}`);
            const data = await response.json();

            if (data.success && data.profile) {
                return data.profile;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    // ============================================
    // BUILD UPI URL
    // ============================================
    buildUPIUrl(amount, note) {
        const params = new URLSearchParams({
            pa: this.upiId,
            pn: this.payeeName,
            am: amount.toFixed(2),
            cu: 'INR',
            mode: '02',
            purpose: '00',
            mc: this.merchantCode,
            tn: note || 'Quick Dukan Payment',
            orgid: '000000'
        });
        return 'upi://pay?' + params.toString();
    }

    // ============================================
    // BIND EVENTS
    // ============================================
    bindEvents(container) {
        const hi = this.currentLang === 'hi';
        const amount = this.currentTotal;
        const note = 'Quick Dukan Payment';
        const upiUrl = this.buildUPIUrl(amount, note);

        // Close button
        container.querySelector('#paymentCloseBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handlePaymentCancel(container);
        });

        // Overlay - band na ho
        container.querySelector('.payment-online-overlay')?.addEventListener('click', () => {
            this.showToast(hi ? '⚠️ कृपया पहले पेमेंट पूरा करें' : '⚠️ Please complete payment first');
        });

        // QR Click
        container.querySelector('#qrImage')?.addEventListener('click', () => {
            this.openUPIUrl(upiUrl, amount);
        });

        container.querySelector('#qrContainer')?.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.openUPIUrl(upiUrl, amount);
            }
        });

        // Copy UPI
        container.querySelector('#btnCopyUPI')?.addEventListener('click', () => {
            navigator.clipboard.writeText(this.upiId).then(() => {
                this.showToast(hi ? '✅ UPI ID कॉपी!' : '✅ UPI ID Copied!');
            });
        });

        // Open UPI
        container.querySelector('#btnOpenUPI')?.addEventListener('click', () => {
            this.openUPIUrl(upiUrl, amount);
        });

        // UPI Apps
        container.querySelectorAll('.upi-app-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.openSpecificUPIApp(btn.dataset.app, amount);
            });
        });

        // COD
        container.querySelector('#btnCOD')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleCOD(container);
        });

        // Payment Done
        container.querySelector('#btnPaymentDone')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handlePaymentDone(container);
        });
    }

    // ============================================
    // OPEN UPI URL
    // ============================================
    openUPIUrl(upiUrl, amount) {
        console.log('💳 Opening UPI:', upiUrl);

        try {
            window.location.href = upiUrl;
        } catch (e) {
            window.open(upiUrl, '_blank');
        }
    }

    // ============================================
    // OPEN SPECIFIC UPI APP
    // ============================================
    openSpecificUPIApp(app, amount) {
        const note = 'Quick Dukan Payment';
        const upiUrl = this.buildUPIUrl(amount, note);

        const apps = {
            gpay: {
                intent: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`
            },
            phonepe: {
                intent: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=com.phonepe.app;end`
            },
            paytm: {
                intent: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=net.one97.paytm;end`
            },
            bhim: {
                intent: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=in.org.npci.upiapp;end`
            }
        };

        const config = apps[app];
        if (config) {
            try {
                window.location.href = config.intent;
            } catch (e) {
                this.openUPIUrl(upiUrl, amount);
            }
        } else {
            this.openUPIUrl(upiUrl, amount);
        }
    }

    // ============================================
    // ✅ HANDLE COD - Payment Sheet + Order Save
    // ============================================
    async handleCOD(container) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const hi = this.currentLang === 'hi';
        console.log('🏍️ COD Selected - Payment sheet + Order save hoga');

        try {
            // ✅ COD Payment Sheet mein save karo
            await this.savePaymentToSheet('COD', 0, this.currentAmount);

            // ✅ Order save callback
            if (this.callbacks.onCODSelected) {
                await this.callbacks.onCODSelected({
                    method: 'COD',
                    amount: this.currentAmount,
                    charge: 0,
                    total: this.currentAmount,
                    transactionId: 'COD-' + Date.now(),
                    status: 'Pending',
                });
            } else if (this.callbacks.onPaymentSuccess) {
                await this.callbacks.onPaymentSuccess({
                    method: 'COD',
                    amount: this.currentAmount,
                    charge: 0,
                    total: this.currentAmount,
                    transactionId: 'COD-' + Date.now(),
                    status: 'Pending',
                });
            }

            this.showToast(hi ? '✅ ऑर्डर कन्फर्म! सामान आने पर ₹' + this.currentAmount + ' दें।' : '✅ Order confirmed! Pay ₹' + this.currentAmount + ' on delivery.');
            setTimeout(() => this.hide(container), 1500);

        } catch (error) {
            console.error('❌ COD Error:', error);
            this.showToast('⚠️ COD order failed');
        } finally {
            this.isProcessing = false;
        }
    }

    // ============================================
    // ✅ HANDLE PAYMENT DONE (UPI) - Payment Sheet + Order Save
    // ============================================
    async handlePaymentDone(container) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const hi = this.currentLang === 'hi';
        console.log('✅ Payment Done - Payment sheet + Order save hoga');

        try {
            // ✅ UPI Payment Sheet mein save karo
            const paymentId = await this.savePaymentToSheet('UPI', this.currentCharge, this.currentTotal);

            // ✅ Order save callback
            if (this.callbacks.onPaymentSuccess) {
                await this.callbacks.onPaymentSuccess({
                    method: 'UPI',
                    amount: this.currentAmount,
                    charge: this.currentCharge,
                    total: this.currentTotal,
                    transactionId: paymentId || 'UPI-' + Date.now(),
                    status: 'Paid',
                });
            }

            this.showToast(hi ? '✅ ऑर्डर कन्फर्म! Admin verify करेगा।' : '✅ Order confirmed! Admin will verify.');
            setTimeout(() => this.hide(container), 1500);

        } catch (error) {
            console.error('❌ Payment Done Error:', error);
            this.showToast('⚠️ Payment failed');
        } finally {
            this.isProcessing = false;
        }
    }

    // ============================================
    // HANDLE PAYMENT CANCEL
    // ============================================
    handlePaymentCancel(container) {
        const hi = this.currentLang === 'hi';

        if (this.callbacks.onPaymentFailure) {
            this.callbacks.onPaymentFailure({
                message: 'Payment cancelled',
            });
        }

        this.showToast(hi ? '❌ पेमेंट कैंसिल - ऑर्डर नहीं हुआ' : '❌ Payment cancelled');
        this.hide(container);
    }

    // ============================================
    // ✅ SAVE PAYMENT TO GOOGLE SHEETS (COD + UPI dono)
    // ============================================
    async savePaymentToSheet(method, chargeAmount, totalAmount) {
        try {
            const orderData = this.currentOrder;
            const itemsText = this.formatItems(orderData.items || []);

            const params = new URLSearchParams({
                orderId: orderData.orderId || '',
                phone: this.currentUser.phone,
                name: this.currentUser.name,
                items: itemsText,
                productAmount: this.currentAmount,
                chargeAmount: chargeAmount,
                totalAmount: totalAmount,
                method: method,
                status: method === 'COD' ? 'Pending' : 'Paid',
                transactionId: method === 'COD' ? 'COD-' + Date.now() : 'UPI-' + Date.now(),
            });

            const response = await fetch(`${this.API_URL}?action=savePayment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });

            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Payment saved to sheet:', data.paymentId);
                return data.paymentId;
            } else {
                console.log('⚠️ Payment save failed:', data.message);
                return null;
            }
        } catch (error) {
            console.log('⚠️ Payment save error:', error);
            return null;
        }
    }

    // ============================================
    // FORMAT ITEMS
    // ============================================
    formatItems(items) {
        if (!items || items.length === 0) return '';
        return items.map(item => {
            const name = typeof item.name === 'object' ? (item.name.hi || item.name.en || '') : (item.name || '');
            const qty = item.quantity || 1;
            return `${name} ×${qty}`;
        }).join(', ');
    }

    // ============================================
    // HIDE POPUP
    // ============================================
    hide(container) {
        container.classList.remove('show');
        setTimeout(() => {
            if (container.parentNode) container.remove();
        }, 300);
    }

    // ============================================
    // TOAST
    // ============================================
    showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.remove('hidden');
        toast.style.animation = 'none';
        toast.offsetHeight;
        toast.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.onlinePaymentManager = new OnlinePaymentManager();
    }, 1200);
});