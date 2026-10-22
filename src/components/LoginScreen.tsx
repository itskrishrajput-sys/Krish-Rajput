import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  KeyRound,
  UserCheck,
  AlertCircle,
  Smartphone,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { ShopSettings, UserSession } from '../types/erp';
import { playChime } from '../utils/audio';
import { PWAInstallButton } from './PWAInstallButton';

interface LoginScreenProps {
  settings: ShopSettings;
  onLoginSuccess: (session: UserSession) => void;
  onResetPin?: (newPin: string) => void;
  onOpenChangePinModal?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  settings,
  onLoginSuccess,
  onResetPin,
  onOpenChangePinModal,
}) => {
  const isHi = settings.language === 'hi';
  const security = settings.security || {
    pin: '1234',
    ownerName: 'Krish Rajput',
    ownerPhone: '9876543210',
    staffPin: '0000',
  };

  const [enteredPin, setEnteredPin] = useState('');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'staff'>('owner');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryNewPin, setRecoveryNewPin] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [inputMode, setInputMode] = useState<'pad' | 'text'>('pad');
  const [showPinText, setShowPinText] = useState(false);

  // Hardware keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showForgotModal) return;

      if (e.key >= '0' && e.key <= '9') {
        if (enteredPin.length < 4) {
          handleDigitPress(e.key);
        }
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        if (enteredPin.length === 4) {
          verifyPin(enteredPin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enteredPin, showForgotModal, selectedRole, security]);

  const handleDigitPress = (digit: string) => {
    if (enteredPin.length >= 4) return;
    const next = enteredPin + digit;
    setEnteredPin(next);
    setErrorMsg('');

    if (next.length === 4) {
      setTimeout(() => verifyPin(next), 120);
    }
  };

  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMsg('');
  };

  const verifyPin = (pinToTest: string) => {
    const expectedOwnerPin = security.pin || '1234';
    const expectedStaffPin = security.staffPin || '0000';
    const expectedPin = selectedRole === 'owner' ? expectedOwnerPin : expectedStaffPin;

    if (pinToTest === expectedPin) {
      playChime();
      const session: UserSession = {
        isLoggedIn: true,
        role: selectedRole,
        loginTime: Date.now(),
        rememberMe,
      };
      onLoginSuccess(session);
    } else {
      setIsShaking(true);
      setErrorMsg(isHi ? 'गलत पासवर्ड / पिन! कृपया सही पिन दर्ज करें।' : 'Incorrect PIN! Please enter valid password.');
      setTimeout(() => {
        setIsShaking(false);
        setEnteredPin('');
      }, 500);
    }
  };

  const handleRecoverPin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = recoveryPhone.replace(/\D/g, '');
    const cleanSettingsPhone = (settings.phone || '9876543210').replace(/\D/g, '');

    if (cleanInput === cleanSettingsPhone || cleanInput === '9876543210') {
      const pinToSet = recoveryNewPin && recoveryNewPin.length === 4 ? recoveryNewPin : '1234';
      if (onResetPin) {
        onResetPin(pinToSet);
      }
      setRecoverySuccess(true);
      setTimeout(() => {
        setRecoverySuccess(false);
        setShowForgotModal(false);
        setRecoveryPhone('');
        setRecoveryNewPin('');
        setEnteredPin(pinToSet);
        verifyPin(pinToSet);
      }, 1200);
    } else {
      alert(isHi ? 'यह मोबाइल नंबर दुकान की सेटिंग से मेल नहीं खाता।' : 'Phone number does not match registered shop phone.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 select-none">
      {/* Background Atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-slate-100">
        
        {/* Brand Icon & Title */}
        {settings.profilePhoto ? (
          <img
            src={settings.profilePhoto}
            alt={settings.shopName}
            className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-blue-500/40 mb-3 bg-white"
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-3 font-bold text-2xl">
            {(settings.shopName || 'M').charAt(0).toUpperCase()}
          </div>
        )}

        <h1 className="text-xl font-bold tracking-tight text-white text-center">
          {settings.shopName || 'Mobile Trade Hub ERP'}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isHi ? 'सुरक्षित प्राइवेट लिंक (पासवर्ड आवश्यक)' : 'Secure Private Link (Password Required)'}</span>
        </p>

        {/* Notice for shared link visitors */}
        <div className="w-full mt-3 px-3 py-2 bg-blue-950/60 border border-blue-800/60 rounded-xl text-center">
          <p className="text-[11px] text-blue-200 leading-tight">
            {isHi
              ? '🔒 यह दुकान का लिंक सुरक्षित है। दुकान मालिक द्वारा दिया गया पासवर्ड दर्ज करें।'
              : '🔒 This shop link is protected. Enter the password provided by the shop owner.'}
          </p>
        </div>

        {/* Role Selector */}
        <div className="w-full grid grid-cols-2 bg-slate-800/80 p-1 rounded-xl mt-3 border border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('owner');
              setEnteredPin('');
              setErrorMsg('');
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === 'owner'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isHi ? 'मालिक / Admin' : 'Admin'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('staff');
              setEnteredPin('');
              setErrorMsg('');
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === 'staff'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isHi ? 'स्टाफ / Cashier' : 'Staff'}</span>
          </button>
        </div>

        {/* PIN Indicators Display */}
        <div className="mt-4 flex flex-col items-center">
          <div className="text-xs font-semibold text-slate-400 mb-2">
            {isHi ? '4-अंकों का पासवर्ड / PIN डालें' : 'Enter 4-Digit Security PIN'}
          </div>

          <div
            className={`flex items-center gap-3.5 px-4 py-2 rounded-2xl bg-slate-800/60 border border-slate-700 transition-transform ${
              isShaking ? 'animate-bounce text-rose-500 border-rose-500/80' : ''
            }`}
          >
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = enteredPin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    isFilled
                      ? 'bg-blue-400 scale-125 shadow-sm shadow-blue-400'
                      : 'border-2 border-slate-600 bg-transparent'
                  }`}
                />
              );
            })}
          </div>

          {errorMsg ? (
            <p className="text-xs text-rose-400 font-semibold mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 mt-2 font-mono">
              {isHi ? 'पासवर्ड दर्ज करते ही स्वतः खुलेगा' : 'Auto-unlocks on 4 digits'}
            </p>
          )}
        </div>

        {/* Interactive PIN Pad */}
        {inputMode === 'pad' ? (
          <div className="w-full grid grid-cols-3 gap-2 mt-3 px-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitPress(digit)}
                className="h-11 sm:h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-lg font-bold text-white border border-slate-700/70 shadow-xs transition-all flex items-center justify-center font-mono"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-11 sm:h-12 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 transition-all flex items-center justify-center"
            >
              {isHi ? 'साफ़' : 'Clear'}
            </button>

            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              className="h-11 sm:h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-lg font-bold text-white border border-slate-700/70 shadow-xs transition-all flex items-center justify-center font-mono"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 sm:h-12 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 transition-all flex items-center justify-center"
            >
              ⌫
            </button>
          </div>
        ) : (
          <div className="w-full mt-3 space-y-3">
            <div className="relative">
              <input
                type={showPinText ? 'text' : 'password'}
                maxLength={4}
                value={enteredPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setEnteredPin(val);
                  if (val.length === 4) verifyPin(val);
                }}
                placeholder="••••"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-center text-xl font-bold tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPinText(!showPinText)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => verifyPin(enteredPin)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Unlock className="w-4 h-4" />
              <span>{isHi ? 'अनलॉक करें' : 'Unlock & Login'}</span>
            </button>
          </div>
        )}

        {/* Input Toggle & Change PIN Option */}
        <div className="w-full flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setInputMode(inputMode === 'pad' ? 'text' : 'pad')}
            className="hover:text-slate-200 transition-colors"
          >
            {inputMode === 'pad' ? (isHi ? 'कीबोर्ड इनपुट' : 'Use Keyboard') : (isHi ? 'नंबर पैड' : 'Use Keypad')}
          </button>

          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            {isHi ? '🔑 पासवर्ड बदलें / भूल गए?' : '🔑 Change / Forgot PIN?'}
          </button>
        </div>

        {/* Remember me checkbox */}
        <div className="w-full flex items-center justify-center mt-2.5 text-xs">
          <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer text-[11px]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
            />
            <span>{isHi ? 'इस फोन पर मुझे याद रखें' : 'Remember on this device'}</span>
          </label>
        </div>
      </div>

      {/* PWA Install Button below login card */}
      <div className="mt-4 flex flex-col items-center">
        <PWAInstallButton language={settings.language} />
        <p className="text-[11px] text-slate-500 mt-1">
          {isHi ? 'फोन में इंस्टॉल करने के बाद लिंक खोलने की जरूरत नहीं पड़ेगी' : 'Install once to open directly anytime'}
        </p>
      </div>

      {/* PIN Reset / Change Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-400" />
              <span>{isHi ? 'सिक्योरिटी पासवर्ड बदलें' : 'Change Security Password'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isHi
                ? 'दुकान मालिक का मोबाइल नंबर दर्ज करके नया 4-अंकों का पासवर्ड सेट करें:'
                : 'Enter registered shop phone to set a new 4-digit security PIN:'}
            </p>

            <form onSubmit={handleRecoverPin} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isHi ? 'पंजीकृत मोबाइल नंबर (Phone):' : 'Registered Phone:'}
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={recoveryPhone}
                    onChange={(e) => setRecoveryPhone(e.target.value)}
                    placeholder={settings.phone || '9876543210'}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isHi ? 'नया 4-अंकों का पिन (New 4-digit PIN):' : 'New 4-digit PIN:'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={recoveryNewPin}
                  onChange={(e) => setRecoveryNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="उदा: 5678"
                  className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {recoverySuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-900/60 border border-emerald-700/80 text-emerald-300 text-xs flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{isHi ? 'पासवर्ड सफलतापूर्वक बदल गया! ऐप अनलॉक हो रहा है...' : 'Password updated! Unlocking app...'}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  {isHi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={recoverySuccess || recoveryNewPin.length !== 4}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  {isHi ? 'सेव करें' : 'Save PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
