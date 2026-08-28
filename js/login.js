// ============================================
// LOGIN JS - Complete Fixed with All Features
// Password Show/Hide + Auto OTP + 28s Timer + 15min Lock
// ============================================

const API_URL = 'https://script.google.com/macros/s/AKfycbxuqhAw1n8h2d434kxB7sUfMeuzCZLArJz_KPN1q2LvOOBaguPRdcgi7WnssWBvFvCc/exec';

let currentUser = { phone: '', name: '', email: '', address: '' };

// OTP State
let loginOtpValue = '';
let registerOtpValue = '';
let forgetOtpValue = '';
let loginOtpTimerInterval = null;
let registerOtpTimerInterval = null;
let forgetOtpTimerInterval = null;
let loginOtpExpired = false;
let registerOtpExpired = false;
let forgetOtpExpired = false;

// OTP Attempts
let loginOtpAttempts = 0;
let registerOtpAttempts = 0;
let loginLocked = false;
let registerLocked = false;
let loginLockTimerInterval = null;
let registerLockTimerInterval = null;

const MAX_OTP_ATTEMPTS = 5;
const OTP_VALID_SECONDS = 28; // 🎯 28 seconds
const LOCK_MINUTES = 15; // 🎯 15 minutes

// ============================================
// PASSWORD HASH FUNCTION
// ============================================
function hashPassword(password) {
    // Google Sheets number format issue solve karne ke liye
    return 'P@ss' + password;
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initDeviceId();
    checkExistingLogin();
    setupPasswordToggle();
    console.log('🔐 Login Page Ready');
});

// ============================================
// PASSWORD SHOW/HIDE TOGGLE
// ============================================
function setupPasswordToggle() {
    // Login password toggle
    const loginPasswordInput = document.getElementById('loginPassword');
    if (loginPasswordInput) {
        const toggleBtn = document.createElement('span');
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '👁️';
        toggleBtn.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:18px;';
        toggleBtn.onclick = () => togglePasswordVisibility(loginPasswordInput, toggleBtn);
        
        const parentDiv = loginPasswordInput.parentElement;
        if (parentDiv) {
            parentDiv.style.position = 'relative';
            parentDiv.appendChild(toggleBtn);
        }
    }
    
    // Register password toggle
    const registerPasswordInput = document.getElementById('registerPassword');
    if (registerPasswordInput) {
        const toggleBtn = document.createElement('span');
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '👁️';
        toggleBtn.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:18px;';
        toggleBtn.onclick = () => togglePasswordVisibility(registerPasswordInput, toggleBtn);
        
        const parentDiv = registerPasswordInput.parentElement;
        if (parentDiv) {
            parentDiv.style.position = 'relative';
            parentDiv.appendChild(toggleBtn);
        }
    }
    
    // Register re-password toggle
    const registerRePasswordInput = document.getElementById('registerRePassword');
    if (registerRePasswordInput) {
        const toggleBtn = document.createElement('span');
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '👁️';
        toggleBtn.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:18px;';
        toggleBtn.onclick = () => togglePasswordVisibility(registerRePasswordInput, toggleBtn);
        
        const parentDiv = registerRePasswordInput.parentElement;
        if (parentDiv) {
            parentDiv.style.position = 'relative';
            parentDiv.appendChild(toggleBtn);
        }
    }
    
    // Forget password toggle
    const forgetPasswordInput = document.getElementById('forgetNewPassword');
    if (forgetPasswordInput) {
        const toggleBtn = document.createElement('span');
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '👁️';
        toggleBtn.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:18px;';
        toggleBtn.onclick = () => togglePasswordVisibility(forgetPasswordInput, toggleBtn);
        
        const parentDiv = forgetPasswordInput.parentElement;
        if (parentDiv) {
            parentDiv.style.position = 'relative';
            parentDiv.appendChild(toggleBtn);
        }
    }
}

function togglePasswordVisibility(inputElement, toggleBtn) {
    if (inputElement.type === 'password') {
        inputElement.type = 'text';
        toggleBtn.innerHTML = '🙈';
    } else {
        inputElement.type = 'password';
        toggleBtn.innerHTML = '👁️';
    }
}

// ============================================
// IFRAME POPUP CLOSE
// ============================================
function closeLoginPopupFromIframe() {
    if (window.parent !== window) {
        const parentModal = window.parent.document.getElementById('loginIframeModal');
        if (parentModal) {
            parentModal.classList.add('hidden');
            window.parent.document.body.style.overflow = '';
        }
        
        const loginBtn = window.parent.document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = '<span class="login-icon">👤</span>';
            loginBtn.classList.remove('login-active');
        }
    } else {
        window.location.href = 'index.html';
    }
}

function goHome() {
    closeLoginPopupFromIframe();
}

function closeLogin() {
    closeLoginPopupFromIframe();
}

// ============================================
// DEVICE ID
// ============================================
function initDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = 'DEV-' + generateId();
        localStorage.setItem('deviceId', deviceId);
    }
}

function getDeviceId() {
    return localStorage.getItem('deviceId') || ('DEV-' + generateId());
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================
function isValidPhone(phone) {
    return /^[6-9]\d{9}$/.test(phone);
}

function isValidGmail(email) {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
}

function isValidPassword(password) {
    return password && password.length >= 6 && password.length <= 15;
}

// ============================================
// CHECK EXISTING LOGIN
// ============================================
async function checkExistingLogin() {
    const savedPhone = localStorage.getItem('userPhone');
    if (savedPhone) {
        try {
            const response = await fetch(`${API_URL}?action=getUserProfile&phone=${savedPhone}`);
            const data = await response.json();
            if (data.success && data.profile) {
                showProfile(data.profile);
            }
        } catch (error) {}
    }
}

// ============================================
// TAB SWITCHING
// ============================================
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
    
    if (tab === 'login') {
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('registerSection').classList.add('hidden');
    } else {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('registerSection').classList.remove('hidden');
    }
}

// ============================================
// AUTO OTP GENERATE (Login)
// ============================================
async function autoGenerateLoginOtp(phoneEmail) {
    if (loginLocked) return false;
    
    if (!phoneEmail) {
        showLoginStatus('📱 Phone या Email डालें', 'error');
        return false;
    }
    
    const isPhone = /^\d+$/.test(phoneEmail);
    if (isPhone) {
        if (!isValidPhone(phoneEmail)) {
            showLoginStatus('❌ सही 10 digit mobile number डालें', 'error');
            return false;
        }
    } else {
        if (!isValidGmail(phoneEmail)) {
            showLoginStatus('❌ Email @gmail.com होना चाहिए', 'error');
            return false;
        }
    }
    
    loginOtpValue = Math.floor(100000 + Math.random() * 900000).toString();
    loginOtpExpired = false;
    loginOtpAttempts = 0;
    
    document.getElementById('loginOtpDisplay').classList.remove('hidden');
    document.getElementById('loginOtpValue').textContent = loginOtpValue;
    document.getElementById('loginOtpSection').classList.remove('hidden');
    document.getElementById('loginOtpAttempts').textContent = `Attempts: ${loginOtpAttempts}/${MAX_OTP_ATTEMPTS}`;
    
    startOtpTimer('login', OTP_VALID_SECONDS);
    
    showLoginStatus(`🔐 OTP: ${loginOtpValue} (${OTP_VALID_SECONDS} sec valid)`, 'pending');
    console.log('🔐 Auto Login OTP:', loginOtpValue);
    
    return true;
}

// ============================================
// GENERATE LOGIN OTP (Button)
// ============================================
async function generateLoginOtp() {
    if (loginLocked) {
        showLoginStatus('🔒 OTP locked! 15 मिनट बाद try करें।', 'error');
        return;
    }
    
    const phoneEmail = document.getElementById('loginPhoneEmail')?.value?.trim();
    await autoGenerateLoginOtp(phoneEmail);
}

// ============================================
// AUTO OTP GENERATE (Register)
// ============================================
async function autoGenerateRegisterOtp(phone) {
    if (registerLocked) return false;
    
    if (!isValidPhone(phone)) {
        showRegisterStatus('❌ सही 10 digit mobile number डालें', 'error');
        return false;
    }
    
    registerOtpValue = Math.floor(100000 + Math.random() * 900000).toString();
    registerOtpExpired = false;
    registerOtpAttempts = 0;
    
    document.getElementById('registerOtpDisplay').classList.remove('hidden');
    document.getElementById('registerOtpValue').textContent = registerOtpValue;
    document.getElementById('registerOtpSection').classList.remove('hidden');
    document.getElementById('registerOtpAttempts').textContent = `Attempts: ${registerOtpAttempts}/${MAX_OTP_ATTEMPTS}`;
    
    startOtpTimer('register', OTP_VALID_SECONDS);
    
    showRegisterStatus(`🔐 OTP: ${registerOtpValue} (${OTP_VALID_SECONDS} sec valid)`, 'pending');
    console.log('📝 Auto Register OTP:', registerOtpValue);
    
    return true;
}

// ============================================
// GENERATE REGISTER OTP (Button)
// ============================================
async function generateRegisterOtp() {
    if (registerLocked) {
        showRegisterStatus('🔒 OTP locked! 15 मिनट बाद try करें।', 'error');
        return;
    }
    
    const phone = document.getElementById('registerPhone')?.value?.trim();
    await autoGenerateRegisterOtp(phone);
}

// ============================================
// GENERATE FORGET OTP
// ============================================
async function generateForgetOtp() {
    const phone = document.getElementById('forgetPhone')?.value?.trim();
    
    if (!isValidPhone(phone)) {
        alert('❌ सही 10 digit mobile number डालें');
        return;
    }
    
    try {
        const profileResponse = await fetch(`${API_URL}?action=getUserProfile&phone=${phone}`);
        const profileData = await profileResponse.json();
        
        if (profileData.success && profileData.profile) {
            const registeredDeviceId = profileData.profile.deviceId;
            const currentDeviceId = getDeviceId();
            
            if (registeredDeviceId && registeredDeviceId !== currentDeviceId) {
                alert('❌ Password उसी phone से reset करें जिससे account बनाया था');
                return;
            }
        }
    } catch (error) {}
    
    forgetOtpValue = Math.floor(100000 + Math.random() * 900000).toString();
    forgetOtpExpired = false;
    
    document.getElementById('forgetOtpDisplay').classList.remove('hidden');
    document.getElementById('forgetOtpValue').textContent = forgetOtpValue;
    
    startOtpTimer('forget', OTP_VALID_SECONDS);
    
    alert(`🔐 आपका OTP: ${forgetOtpValue} (${OTP_VALID_SECONDS} sec valid)`);
}

// ============================================
// OTP TIMER
// ============================================
function startOtpTimer(type, seconds) {
    const timerId = type === 'login' ? 'loginOtpTimer' : type === 'register' ? 'registerOtpTimer' : 'forgetOtpTimer';
    
    if (type === 'login') clearInterval(loginOtpTimerInterval);
    else if (type === 'register') clearInterval(registerOtpTimerInterval);
    else clearInterval(forgetOtpTimerInterval);
    
    let remaining = seconds;
    
    const interval = setInterval(() => {
        const secs = remaining;
        const timerEl = document.getElementById(timerId);
        
        if (timerEl) {
            timerEl.textContent = `⏱️ 00:${secs.toString().padStart(2, '0')}`;
        }
        
        if (remaining <= 0) {
            clearInterval(interval);
            if (type === 'login') loginOtpExpired = true;
            else if (type === 'register') registerOtpExpired = true;
            else forgetOtpExpired = true;
            
            if (timerEl) timerEl.textContent = '⏱️ Expired';
        }
        
        remaining--;
    }, 1000);
    
    if (type === 'login') loginOtpTimerInterval = interval;
    else if (type === 'register') registerOtpTimerInterval = interval;
    else forgetOtpTimerInterval = interval;
}

// ============================================
// LOCK SYSTEM
// ============================================
function lockOtp(type) {
    if (type === 'login') {
        loginLocked = true;
        document.getElementById('loginLockMessage').classList.remove('hidden');
        document.getElementById('loginOtpSection').classList.add('hidden');
        startLockTimer('login');
    } else {
        registerLocked = true;
        document.getElementById('registerLockMessage').classList.remove('hidden');
        document.getElementById('registerOtpSection').classList.add('hidden');
        startLockTimer('register');
    }
}

function startLockTimer(type) {
    let seconds = LOCK_MINUTES * 60;
    const timerId = type === 'login' ? 'loginLockTimer' : 'registerLockTimer';
    
    const interval = setInterval(() => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        const timerEl = document.getElementById(timerId);
        if (timerEl) timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        if (seconds <= 0) {
            clearInterval(interval);
            if (type === 'login') {
                loginLocked = false;
                loginOtpAttempts = 0;
                document.getElementById('loginLockMessage').classList.add('hidden');
            } else {
                registerLocked = false;
                registerOtpAttempts = 0;
                document.getElementById('registerLockMessage').classList.add('hidden');
            }
        }
        seconds--;
    }, 1000);
}

// ============================================
// LOGIN USER (Auto OTP + Password Hash + Attempts)
// ============================================
async function loginUser() {
    if (loginLocked) {
        showLoginStatus('🔒 OTP locked! 15 मिनट बाद try करें।', 'error');
        return;
    }
    
    const phoneEmail = document.getElementById('loginPhoneEmail')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;
    let otp = document.getElementById('loginOtp')?.value?.trim();
    
    if (!phoneEmail) {
        showLoginStatus('📱 Phone या Email डालें', 'error');
        return;
    }
    
    if (!password) {
        showLoginStatus('🔒 Password डालें', 'error');
        return;
    }
    
    // 🎯 FIX: Agar OTP generate nahi hua to auto generate karo
    if (!loginOtpValue || loginOtpExpired) {
        const generated = await autoGenerateLoginOtp(phoneEmail);
        if (!generated) return;
        otp = ''; // OTP field khali karo
        showLoginStatus('🔐 OTP generate हुआ है! OTP डालें और Login दबाएं।', 'pending');
        return;
    }
    
    if (!otp) {
        showLoginStatus('🔑 OTP डालें (ऊपर दिख रहा है)', 'error');
        return;
    }
    
    if (loginOtpExpired) {
        showLoginStatus('⏱️ OTP expired! दोबारा Login दबाएं।', 'error');
        return;
    }
    
    if (otp !== loginOtpValue) {
        loginOtpAttempts++;
        document.getElementById('loginOtpAttempts').textContent = `Attempts: ${loginOtpAttempts}/${MAX_OTP_ATTEMPTS}`;
        
        if (loginOtpAttempts >= MAX_OTP_ATTEMPTS) {
            showLoginStatus('🔒 बहुत ज्यादा गलत OTP! 15 मिनट lock।', 'error');
            lockOtp('login');
            return;
        }
        
        showLoginStatus(`❌ गलत OTP! ${MAX_OTP_ATTEMPTS - loginOtpAttempts} attempts बाकी`, 'error');
        return;
    }
    
    showLoginStatus('🔄 Login हो रहा है...', 'pending');
    
    try {
        const deviceId = getDeviceId();
        
        let cleanPhoneEmail = phoneEmail;
        if (/^\d+$/.test(phoneEmail)) {
            cleanPhoneEmail = phoneEmail.replace(/\D/g, '').slice(-10);
        }
        
        // Password variations
        const passwordVariations = [
            hashPassword(password),
            password,
            password + '.0',
            ' ' + password,
            '  ' + password,
            '   ' + password,
            '    ' + password,
            '     ' + password,
            '      ' + password,
            '       ' + password,
        ];
        
        console.log('🔍 Login try:', cleanPhoneEmail);
        
        let loginSuccess = false;
        let loginData = null;
        
        for (let i = 0; i < passwordVariations.length; i++) {
            const tryPassword = passwordVariations[i];
            
            const url = `${API_URL}?action=userLogin&phoneOrEmail=${encodeURIComponent(cleanPhoneEmail)}&password=${encodeURIComponent(tryPassword)}&otp=${encodeURIComponent(otp)}&deviceId=${deviceId}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Password match! Variation:', i);
                loginSuccess = true;
                loginData = data;
                break;
            }
        }
        
        if (loginSuccess && loginData) {
            localStorage.setItem('userPhone', loginData.phone);
            clearInterval(loginOtpTimerInterval);
            
            document.getElementById('loginOtpDisplay').classList.add('hidden');
            document.getElementById('loginOtpSection').classList.add('hidden');
            document.getElementById('loginOtp').value = '';
            document.getElementById('loginOtpValue').textContent = '------';
            
            showLoginStatus('✅ Login successful!', 'success');
            
            const profileResponse = await fetch(`${API_URL}?action=getUserProfile&phone=${loginData.phone}`);
            const profileData = await profileResponse.json();
            
            if (profileData.success) {
                showProfile(profileData.profile);
                
                if (window.parent !== window) {
                    const loginBtn = window.parent.document.getElementById('loginBtn');
                    if (loginBtn) {
                        loginBtn.innerHTML = '<span class="login-icon">👤</span>';
                        loginBtn.classList.remove('login-active');
                    }
                }
            }
        } else {
            showLoginStatus('❌ गलत password! Password भूल गए?', 'error');
            document.getElementById('forgetPasswordBtn').classList.remove('hidden');
        }
    } catch (error) {
        console.log('🚫 Error:', error);
        showLoginStatus('❌ Login error', 'error');
    }
}

// ============================================
// REGISTER USER (Auto OTP + Password Hash + Attempts)
// ============================================
async function registerUser() {
    if (registerLocked) {
        showRegisterStatus('🔒 OTP locked! 15 मिनट बाद try करें।', 'error');
        return;
    }
    
    const name = document.getElementById('registerName')?.value?.trim();
    const phone = document.getElementById('registerPhone')?.value?.trim();
    const email = document.getElementById('registerEmail')?.value?.trim();
    const password = document.getElementById('registerPassword')?.value;
    const rePassword = document.getElementById('registerRePassword')?.value;
    let otp = document.getElementById('registerOtp')?.value?.trim();
    
    if (!name || name.length < 2) {
        showRegisterStatus('👤 नाम डालें', 'error');
        return;
    }
    
    if (!isValidPhone(phone)) {
        showRegisterStatus('❌ सही 10 digit number डालें', 'error');
        return;
    }
    
    if (email && !isValidGmail(email)) {
        showRegisterStatus('❌ Email @gmail.com होना चाहिए', 'error');
        return;
    }
    
    if (!isValidPassword(password)) {
        showRegisterStatus('🔒 Password 6-15 characters', 'error');
        return;
    }
    
    if (password !== rePassword) {
        showRegisterStatus('❌ Password match नहीं', 'error');
        return;
    }
    
    // 🎯 FIX: Agar OTP generate nahi hua to auto generate karo
    if (!registerOtpValue || registerOtpExpired) {
        const generated = await autoGenerateRegisterOtp(phone);
        if (!generated) return;
        showRegisterStatus('🔐 OTP generate हुआ है! OTP डालें और Register दबाएं।', 'pending');
        return;
    }
    
    if (!otp) {
        showRegisterStatus('🔑 OTP डालें (ऊपर दिख रहा है)', 'error');
        return;
    }
    
    if (registerOtpExpired) {
        showRegisterStatus('⏱️ OTP expired! दोबारा Register दबाएं।', 'error');
        return;
    }
    
    if (otp !== registerOtpValue) {
        registerOtpAttempts++;
        document.getElementById('registerOtpAttempts').textContent = `Attempts: ${registerOtpAttempts}/${MAX_OTP_ATTEMPTS}`;
        
        if (registerOtpAttempts >= MAX_OTP_ATTEMPTS) {
            showRegisterStatus('🔒 बहुत ज्यादा गलत OTP! 15 मिनट lock।', 'error');
            lockOtp('register');
            return;
        }
        
        showRegisterStatus(`❌ गलत OTP! ${MAX_OTP_ATTEMPTS - registerOtpAttempts} attempts बाकी`, 'error');
        return;
    }
    
    showRegisterStatus('🔄 Registration हो रहा है...', 'pending');
    
    try {
        const deviceId = getDeviceId();
        const cleanPhone = phone.replace(/\D/g, '').slice(-10);
        
        const hashedPassword = hashPassword(password);
        
        const response = await fetch(`${API_URL}?action=userRegister&phone=${cleanPhone}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(hashedPassword)}&deviceId=${deviceId}`);
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('userPhone', cleanPhone);
            clearInterval(registerOtpTimerInterval);
            showRegisterStatus('✅ Registration successful!', 'success');
            
            setTimeout(() => {
                switchAuthTab('login');
                document.getElementById('loginPhoneEmail').value = cleanPhone;
                showLoginStatus('✅ अब Login करें!', 'success');
            }, 1000);
        } else {
            if (data.message && data.message.includes('पहले से registered')) {
                showRegisterStatus('⚠️ आप पहले से registered हैं! कृपया Login करें।', 'error');
            } else {
                showRegisterStatus('❌ ' + (data.message || 'Registration failed'), 'error');
            }
        }
    } catch (error) {
        showRegisterStatus('❌ Registration error', 'error');
    }
}

// ============================================
// RESET PASSWORD
// ============================================
async function resetPassword() {
    const phone = document.getElementById('forgetPhone')?.value?.trim();
    const otp = document.getElementById('forgetOtp')?.value?.trim();
    const newPassword = document.getElementById('forgetNewPassword')?.value;
    
    if (!isValidPhone(phone)) {
        alert('❌ सही 10 digit number डालें');
        return;
    }
    
    if (!newPassword || newPassword.length < 6) {
        alert('🔒 Password 6-15 characters');
        return;
    }
    
    if (!otp) {
        alert('🔑 पहले OTP डालें!');
        return;
    }
    
    if (forgetOtpExpired) {
        alert('⏱️ OTP expired! दोबारा generate करें।');
        return;
    }
    
    if (otp !== forgetOtpValue) {
        alert('❌ गलत OTP!');
        return;
    }
    
    try {
        const deviceId = getDeviceId();
        const profileResponse = await fetch(`${API_URL}?action=getUserProfile&phone=${phone}`);
        const profileData = await profileResponse.json();
        
        if (profileData.success && profileData.profile) {
            const registeredDeviceId = profileData.profile.deviceId;
            if (registeredDeviceId && registeredDeviceId !== deviceId) {
                alert('❌ Password उसी phone से reset करें!');
                return;
            }
        }
    } catch (error) {}
    
    try {
        const hashedPassword = hashPassword(newPassword);
        
        const response = await fetch(`${API_URL}?action=forgetUserPassword&phone=${phone}&otp=${otp}&newPassword=${encodeURIComponent(hashedPassword)}`);
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Password reset successful!');
            closeForgetModal();
            clearInterval(forgetOtpTimerInterval);
        } else {
            alert('❌ ' + (data.message || 'Reset failed'));
        }
    } catch (error) {
        alert('❌ Error');
    }
}

// ============================================
// SHOW PROFILE
// ============================================
function showProfile(profile) {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('registerSection').classList.add('hidden');
    const authTabs = document.getElementById('authTabs');
    if (authTabs) authTabs.classList.add('hidden');
    document.getElementById('profileSection').classList.remove('hidden');
    
    document.getElementById('profileName').textContent = profile.name || 'User';
    document.getElementById('profileDetailName').textContent = profile.name || '--';
    document.getElementById('profileDetailPhone').textContent = profile.phone || '--';
    document.getElementById('profileDetailEmail').textContent = profile.email || '--';
    document.getElementById('profileDetailAddress').textContent = profile.address || '--';
    document.getElementById('profileMemberSince').textContent = 'Member since: ' + (profile.lastLogin || 'N/A');
    
    if (profile.status === 'Blocked') {
        document.getElementById('profileBlockedBanner').classList.remove('hidden');
        document.getElementById('profileBlockReason').textContent = 'Reason: ' + (profile.blockReason || 'नहीं बताया गया');
    }
    
    if (window.parent !== window) {
        const loginBtn = window.parent.document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = '<span class="login-icon">👤</span>';
            loginBtn.classList.remove('login-active');
        }
    }
}

// ============================================
// FORGET MODAL
// ============================================
function showForgetPassword() {
    document.getElementById('forgetModal').classList.remove('hidden');
}

function closeForgetModal() {
    document.getElementById('forgetModal').classList.add('hidden');
}

// ============================================
// LOGOUT
// ============================================
function logoutUser() {
    localStorage.removeItem('userPhone');
    
    if (window.parent !== window) {
        const parentModal = window.parent.document.getElementById('loginIframeModal');
        if (parentModal) {
            parentModal.classList.add('hidden');
            window.parent.document.body.style.overflow = '';
        }
        
        const loginBtn = window.parent.document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = '<span class="login-icon">👤</span>';
            loginBtn.classList.remove('login-active');
        }
        
        window.location.reload();
    } else {
        window.location.href = 'index.html';
    }
}

// ============================================
// NAVIGATION
// ============================================
function viewMyOrders() {
    const phone = localStorage.getItem('userPhone');
    if (phone) {
        if (window.parent !== window) {
            window.parent.location.href = `orders.html?phone=${phone}`;
        } else {
            window.location.href = `orders.html?phone=${phone}`;
        }
    }
}

function showEditProfile() { alert('✏️ Edit Profile जल्द आएगा'); }
function showNotifications() { alert('🔔 Notifications जल्द आएगा'); }

// ============================================
// HELPERS
// ============================================
function generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 16; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id;
}

function showLoginStatus(message, type) {
    const status = document.getElementById('loginStatus');
    if (status) { status.textContent = message; status.className = 'auth-status ' + type; }
}

function showRegisterStatus(message, type) {
    const status = document.getElementById('registerStatus');
    if (status) { status.textContent = message; status.className = 'auth-status ' + type; }
}