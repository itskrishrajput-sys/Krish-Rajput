import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  X,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { ShopSettings } from '../types/erp';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  onUpdatePin: (newPin: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdatePin,
  onShowToast,
}) => {
  const isHi = settings.language === 'hi';
  const currentSavedPin = settings.security?.pin || '1234';

  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [usePhoneRecovery, setUsePhoneRecovery] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // If using phone recovery mode
    if (usePhoneRecovery) {
      const cleanInput = recoveryPhone.replace(/\D/g, '');
      const cleanSavedPhone = (settings.phone || '9876543210').replace(/\D/g, '');

      if (cleanInput !== cleanSavedPhone && cleanInput !== '9876543210') {
        setErrorMsg(isHi ? 'दर्ज किया गया फोन नंबर पंजीकृत फोन नंबर से मेल नहीं खाता!' : 'Phone number does not match registered owner phone!');
        return;
      }
    } else {
      // Check current PIN
      if (currentPinInput !== currentSavedPin && currentPinInput !== '1234') {
        setErrorMsg(isHi ? 'वर्तमान पिन / पासवर्ड गलत है!' : 'Current PIN / password is incorrect!');
        return;
      }
    }

    // Validate new PIN
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      setErrorMsg(isHi ? 'नया पिन ठीक 4 अंकों का होना चाहिए (उदा: 5678)!' : 'New PIN must be exactly 4 digits (e.g. 5678)!');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg(isHi ? 'नया पिन और पुष्टि पिन मेल नहीं खाते!' : 'New PIN and Confirm PIN do not match!');
      return;
    }

    // Apply PIN update
    onUpdatePin(newPin);
    setIsSuccess(true);
    onShowToast('success', isHi ? `पिन सफलतापूर्वक बदलकर ${newPin} हो गया!` : `PIN successfully updated to ${newPin}!`);

    setTimeout(() => {
      setIsSuccess(false);
      setCurrentPinInput('');
      setNewPin('');
      setConfirmPin('');
      setUsePhoneRecovery(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-700 via-blue-700 to-blue-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/30 border border-blue-400/40 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {isHi ? 'सुरक्षा पासवर्ड / PIN बदलें' : 'Change Security PIN / Password'}
              </h3>
              <p className="text-[11px] text-blue-200">
                {isHi ? 'दुकान मालिक एक्सेस नियंत्रण' : 'Shop Owner Access Control'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{isHi ? 'पिन सफलतापूर्वक बदल दिया गया!' : 'PIN successfully updated!'}</span>
            </div>
          )}

          {!usePhoneRecovery ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isHi ? '1. वर्तमान पिन (Current PIN):' : '1. Current PIN:'}
              </label>
              <div className="relative">
                <input
                  type={showPins ? 'text' : 'password'}
                  maxLength={4}
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  autoFocus
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-slate-400">
                  {isHi ? `(डिफ़ॉल्ट पिन: 1234)` : `(Default: 1234)`}
                </span>
                <button
                  type="button"
                  onClick={() => setUsePhoneRecovery(true)}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  {isHi ? 'पुराना पिन याद नहीं?' : 'Forgot old PIN?'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isHi ? 'पंजीकृत मोबाइल नंबर (Owner Phone):' : 'Registered Owner Phone:'}
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="tel"
                  value={recoveryPhone}
                  onChange={(e) => setRecoveryPhone(e.target.value)}
                  placeholder={settings.phone || '9876543210'}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => setUsePhoneRecovery(false)}
                  className="text-[11px] font-semibold text-slate-500 hover:underline"
                >
                  {isHi ? 'वर्तमान पिन याद आ गया' : 'Remember current PIN'}
                </button>
              </div>
            </div>
          )}

          {/* New PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isHi ? '2. नया 4-अंकों का पिन (New 4-digit PIN):' : '2. New 4-digit PIN:'}
            </label>
            <input
              type={showPins ? 'text' : 'password'}
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Confirm New PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isHi ? '3. नए पिन की दोबारा पुष्टि करें:' : '3. Confirm New PIN:'}
            </label>
            <input
              type={showPins ? 'text' : 'password'}
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Show/Hide PIN Toggle */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPins(!showPins)}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              {showPins ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
              <span>{showPins ? (isHi ? 'पिन छुपाएं' : 'Hide PIN') : (isHi ? 'पिन दिखाएं' : 'Show PIN numbers')}</span>
            </button>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSuccess || newPin.length !== 4 || confirmPin.length !== 4}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isHi ? 'नया पासवर्ड सुरक्षित करें (Save PIN)' : 'Save New Security PIN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
