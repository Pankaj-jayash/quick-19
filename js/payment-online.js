// ============================================
// PAYMENT-ONLINE.JS - Premium UPI Payment Only
// Big QR | Any UPI App | No Scan Line | Beautiful
// ============================================

class OnlinePaymentManager {
    constructor() {
        // UPI Details
        this.upiId = '9719495844-2@ybl';
        this.payeeName = 'Quick Dukan';
        this.merchantCode = 'QKDKAN';
        
        // API URL (Google Apps Script)
        this.API_URL = 'https://script.google.com/macros/s/AKfycbxuqhAw1n8h2d434kxB7sUfMeuzCZLArJz_KPN1q2LvOOBaguPRdcgi7WnssWBvFvCc/exec';
        
        // Payment Settings (Google Sheets से)
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
        
        // CALLBACKS
        this.callbacks = {
            onPaymentSuccess: null,
            onPaymentFailure: null,
            onCODSelected: null,
        };
        
        // PAYMENT STATUS
        this.paymentCompleted = false;
        this.paymentMethod = '';
        
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
                    chargeEnabled: data.chargeEnabled,
                    chargeMin: data.chargeMin || 1,
                    chargeMax: data.chargeMax || 5
                };
                console.log('⚙️ Payment Settings Loaded:', this.paymentSettings);
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
    // SHOW PAYMENT POPUP (UPI Only - No Scroll)
    // ============================================
    async show(orderData, callbacks = {}) {
        // Callbacks store karo
        this.callbacks = {
            onPaymentSuccess: callbacks.onPaymentSuccess || null,
            onPaymentFailure: callbacks.onPaymentFailure || null,
            onCODSelected: callbacks.onCODSelected || callbacks.onPaymentSuccess || null,
        };
        
        // Login check
        if (!this.isUserLoggedIn()) {
            alert('🔐 कृपया पहले Login करें!');
            if (window.parent !== window) {
                window.parent.openLoginPopup();
            } else {
                window.location.href = 'login.html';
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
        this.currentAmount = parseFloat(orderData.total || orderData.totals?.total || 0);
        
        // User info
        const userProfile = await this.getUserProfile();
        if (userProfile) {
            this.currentUser.name = userProfile.name || '';
            this.currentUser.phone = userProfile.phone || this.currentUser.phone;
        }
        
        // Service Charge calculate (Random ₹1-5)
        this.calculateCharge();
        
        const hi = this.currentLang === 'hi';
        
        const container = document.createElement('div');
        container.className = 'payment-online-container';
        container.innerHTML = `
            <div class="payment-online-overlay"></div>
            <div class="payment-online-card">
                <!-- Close Button -->
                <button class="payment-close-btn" id="paymentCloseBtn">✕</button>
                
                <!-- Header -->
                <div class="payment-online-header">
                    <span class="payment-header-icon">💳</span>
                    <h3>${hi ? 'UPI भुगतान' : 'UPI Payment'}</h3>
                    <p>${hi ? 'स्कैन करें और भुगतान करें' : 'Scan & Pay'}</p>
                </div>
                
                <!-- Amount Display -->
                <div class="payment-amount-display">
                    <span class="amount-label">${hi ? 'भुगतान राशि' : 'Payable Amount'}</span>
                    <span class="amount-value">₹${this.currentTotal.toFixed(2)}</span>
                    ${this.paymentSettings.chargeEnabled ? `
                    <span class="amount-breakup">₹${this.currentAmount.toFixed(2)} + ₹${this.currentCharge.toFixed(2)} ${hi ? 'सेवा शुल्क' : 'service charge'}</span>
                    ` : ''}
                </div>
                
                <!-- Big QR Code with Beautiful Corners -->
                <div class="payment-qr-big" id="qrSection">
                    <div class="qr-frame">
                        <!-- Corner Decorations -->
                        <span class="qr-corner qr-corner-tl"></span>
                        <span class="qr-corner qr-corner-tr"></span>
                        <span class="qr-corner qr-corner-bl"></span>
                        <span class="qr-corner qr-corner-br"></span>
                        
                        <img id="qrImage" 
                             src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(this.buildUPIUrl(this.currentTotal))}&bgcolor=ffffff&color=1B5E20" 
                             alt="Pay ₹${this.currentTotal}"
                             style="width:200px;height:200px;"
                             title="${hi ? 'टैप करें - UPI ऐप खोलें' : 'Tap to open UPI app'}">
                    </div>
                    <p class="qr-tap-hint">${hi ? '👆 QR पर टैप करें' : '👆 Tap on QR'}</p>
                    <p class="qr-upi-id">UPI: ${this.upiId}</p>
                </div>
                
                <!-- UPI Apps -->
                <div class="payment-apps-row">
                    <button class="upi-app-btn" data-app="gpay">
                        <span class="app-icon-g">G</span>
                        <span>GPay</span>
                    </button>
                    <button class="upi-app-btn" data-app="phonepe">
                        <span class="app-icon-p">पे</span>
                        <span>PhonePe</span>
                    </button>
                    <button class="upi-app-btn" data-app="paytm">
                        <span class="app-icon-pt">₹</span>
                        <span>Paytm</span>
                    </button>
                    <button class="upi-app-btn" data-app="bhim">
                        <span class="app-icon-b">B</span>
                        <span>BHIM</span>
                    </button>
                </div>
                
                <!-- Any UPI App Button -->
                <div class="payment-any-upi-row">
                    <button class="upi-any-btn" id="btnAnyUPI">
                        📱 ${hi ? 'कोई भी UPI ऐप खोलें' : 'Open Any UPI App'}
                    </button>
                </div>
                
                <!-- Action Buttons -->
                <div class="payment-actions">
                    <button class="copy-upi-btn" id="btnCopyUPI">
                        📋 ${hi ? 'UPI ID कॉपी करें' : 'Copy UPI ID'}
                    </button>
                    <button class="payment-done-btn" id="btnPaymentDone">
                        ✅ ${hi ? 'Payment कर दिया' : 'I have paid'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        requestAnimationFrame(() => container.classList.add('show'));
        
        this.bindEvents(container);
    }
    
    // ============================================
    // CALCULATE SERVICE CHARGE (Random ₹1-5)
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
        const note = 'Quick Dukan Payment - Order Amount';
        const upiUrl = this.buildUPIUrl(amount, note);
        
        // Close button
        const closeBtn = container.querySelector('#paymentCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handlePaymentCancel(container);
            });
        }
        
        // Overlay click - band na ho
        const overlay = container.querySelector('.payment-online-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.showToast(hi ? '⚠️ कृपया पहले पेमेंट पूरा करें' : '⚠️ Please complete payment first');
            });
        }
        
        // QR Click
        const qrImage = container.querySelector('#qrImage');
        const qrSection = container.querySelector('#qrSection');
        
        if (qrImage) {
            qrImage.addEventListener('click', () => this.openUPIUrl(upiUrl, amount));
        }
        
        if (qrSection) {
            qrSection.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                this.openUPIUrl(upiUrl, amount);
            });
        }
        
        // Copy UPI
        const copyBtn = container.querySelector('#btnCopyUPI');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(this.upiId).then(() => {
                    this.showToast(hi ? '✅ UPI ID कॉपी!' : '✅ UPI ID Copied!');
                });
            });
        }
        
        // UPI Apps
        container.querySelectorAll('.upi-app-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.openSpecificUPIApp(btn.dataset.app, amount);
            });
        });
        
        // Any UPI App
        const anyUpiBtn = container.querySelector('#btnAnyUPI');
        if (anyUpiBtn) {
            anyUpiBtn.addEventListener('click', () => {
                this.openUPIUrl(upiUrl, amount);
            });
        }
        
        // Payment Done
        const paymentDoneBtn = container.querySelector('#btnPaymentDone');
        if (paymentDoneBtn) {
            paymentDoneBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('✅ Payment Done Button Clicked!');
                this.handlePaymentDone(container);
            });
        }
    }
    
    // ============================================
    // OPEN UPI URL
    // ============================================
    openUPIUrl(upiUrl, amount) {
        console.log('💳 Opening UPI:', upiUrl);
        
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = upiUrl;
        document.body.appendChild(iframe);
        
        setTimeout(() => {
            try {
                window.location.href = upiUrl;
            } catch (e) {
                window.open(upiUrl.replace('upi://', 'https://pay.google.com/gp/v/upi/'), '_blank');
            }
        }, 300);
        
        setTimeout(() => {
            if (iframe.parentNode) iframe.remove();
        }, 5000);
    }
    
    // ============================================
    // OPEN SPECIFIC UPI APP
    // ============================================
    openSpecificUPIApp(app, amount) {
        const note = 'Quick Dukan Payment - Order Amount';
        const upiUrl = this.buildUPIUrl(amount, note);
        
        const apps = {
            gpay: { intent: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end` },
            phonepe: { intent: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=com.phonepe.app;end` },
            paytm: { intent: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=net.one97.paytm;end` },
            bhim: { intent: `intent://pay?pa=${encodeURIComponent(this.upiId)}&pn=${encodeURIComponent(this.payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=in.org.npci.upiapp;end` }
        };
        
        const config = apps[app];
        if (config) {
            try {
                window.location.href = config.intent;
            } catch (e) {
                window.open(upiUrl, '_blank');
            }
        } else {
            this.openUPIUrl(upiUrl, amount);
        }
    }
    
    // ============================================
    // HANDLE PAYMENT DONE
    // ============================================
    async handlePaymentDone(container) {
        const hi = this.currentLang === 'hi';
        
        console.log('✅ Payment Done clicked - Ab order save hoga');
        
        try {
            const paymentId = await this.savePaymentToSheet('UPI', this.currentCharge, this.currentTotal);
            
            if (this.callbacks.onPaymentSuccess) {
                console.log('✅ Calling onPaymentSuccess callback');
                await this.callbacks.onPaymentSuccess({
                    method: 'UPI',
                    amount: this.currentAmount,
                    charge: this.currentCharge,
                    total: this.currentTotal,
                    transactionId: paymentId || 'UPI-' + Date.now(),
                    status: 'Paid',
                });
            }
            
            this.showToast(hi ? '✅ ऑर्डर कन्फर्म हो गया! Admin verify करेगा।' : '✅ Order confirmed! Admin will verify.');
            
            setTimeout(() => this.hide(container), 1500);
            
        } catch (error) {
            console.error('❌ Payment Done Error:', error);
            this.showToast('⚠️ Payment failed: ' + error.message);
        }
    }
    
    // ============================================
    // HANDLE PAYMENT CANCEL
    // ============================================
    handlePaymentCancel(container) {
        const hi = this.currentLang === 'hi';
        
        console.log('❌ Payment cancelled by user');
        
        if (this.callbacks.onPaymentFailure) {
            this.callbacks.onPaymentFailure({
                message: 'Payment cancelled',
                method: 'UPI',
            });
        }
        
        this.showToast(hi ? '❌ पेमेंट कैंसिल - ऑर्डर नहीं हुआ' : '❌ Payment cancelled - Order not placed');
        
        this.hide(container);
    }
    
    // ============================================
    // SAVE PAYMENT TO GOOGLE SHEETS
    // ============================================
    async savePaymentToSheet(method, chargeAmount, totalAmount) {
        try {
            const orderData = this.currentOrder;
            const itemsText = this.formatItems(orderData.items || []);
            
            const response = await fetch(
                `${this.API_URL}?action=savePayment` +
                `&orderId=${encodeURIComponent(orderData.orderId || '')}` +
                `&phone=${encodeURIComponent(this.currentUser.phone)}` +
                `&name=${encodeURIComponent(this.currentUser.name)}` +
                `&items=${encodeURIComponent(itemsText)}` +
                `&productAmount=${this.currentAmount}` +
                `&chargeAmount=${chargeAmount}` +
                `&totalAmount=${totalAmount}` +
                `&method=${method}`
            );
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Payment saved:', data.paymentId);
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