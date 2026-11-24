import { useCallback, useState } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { AdStudio } from './components/AdStudio';
import { PricingSection } from './components/PricingSection';
import { Footer } from './components/Footer';
import { LockPaywallModal } from './components/LockPaywallModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { ToastContainer, type ToastItem } from './components/ToastContainer';
import type {
  AdminEngineSettings,
  AdminLockoutState,
  TrialState,
} from './types/ads';
import {
  applyActivationCode,
  consumeFreeTrial,
  getRemainingTrials,
  resetFounderTrials,
} from './utils/trials';
import { resetLockout } from './utils/auth';
import {
  loadActivationLockoutState,
  loadEngineSettings,
  loadTrialState,
  saveActivationLockoutState,
  saveEngineSettings,
  saveTrialState,
} from './utils/storage';

export default function App() {
  const [trialState, setTrialState] = useState<TrialState>(() =>
    loadTrialState()
  );
  const [activationLockout, setActivationLockout] =
    useState<AdminLockoutState>(() => loadActivationLockoutState());
  const [engineSettings, setEngineSettings] = useState<AdminEngineSettings>(
    () => loadEngineSettings()
  );

  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-2), { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const scrollToStudio = () => {
    const el = document.getElementById('studio');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTrialConsumed = () => {
    setTrialState((prev) => {
      const next = consumeFreeTrial(prev);
      saveTrialState(next);
      if (!next.isActivated && getRemainingTrials(next) === 0) {
        setTimeout(() => setIsPaywallOpen(true), 600);
      }
      return next;
    });
  };

  const handleActivateCode = (code: string) => {
    const res = applyActivationCode(trialState, code, activationLockout);
    setActivationLockout(res.nextLockout);
    saveActivationLockoutState(res.nextLockout);
    if (res.success) {
      setTrialState(res.nextState);
      saveTrialState(res.nextState);
      showToast('تم تفعيل الاشتراك غير المحدود بنجاح!');
    }
    return { success: res.success, error: res.error };
  };

  const handleResetFounderTrials = () => {
    const fresh = resetFounderTrials();
    const freshLock = resetLockout();
    setTrialState(fresh);
    setActivationLockout(freshLock);
    saveTrialState(fresh);
    saveActivationLockoutState(freshLock);
    showToast('تم تفعيل التجربة المجانية لصاحب الموقع (2 من 2 متاحة الآن).');
  };

  const handleUpdateSettings = (next: AdminEngineSettings) => {
    setEngineSettings(next);
    saveEngineSettings(next);
  };

  const remaining = getRemainingTrials(trialState);
  const remainingLabel = trialState.isActivated
    ? 'عضوية مفعّلة · استخدام غير محدود'
    : `متبقي لديك ${remaining} من 2 محاولات مجانية`;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F4F1EA]">
      <Header
        onSecretTrigger={() => setIsAdminLoginOpen(true)}
        onStartClick={scrollToStudio}
      />

      <main>
        <HeroSection
          onStartStudio={scrollToStudio}
          remainingLabel={remainingLabel}
        />

        <FeaturesSection />

        <AdStudio
          trialState={trialState}
          engineSettings={engineSettings}
          onTrialConsumed={handleTrialConsumed}
          onOpenPaywall={() => setIsPaywallOpen(true)}
          onToast={showToast}
        />

        <PricingSection
          isActivated={trialState.isActivated}
          activatedCode={trialState.activatedCode}
          onActivateCode={handleActivateCode}
        />
      </main>

      <Footer />

      <LockPaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onActivateCode={handleActivateCode}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdminLoginOpen(false);
          setIsAdminDashboardOpen(true);
        }}
      />

      <AdminDashboardModal
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        engineSettings={engineSettings}
        onUpdateSettings={handleUpdateSettings}
        remainingTrialsLabel={remainingLabel}
        onResetTrials={handleResetFounderTrials}
        onToast={showToast}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
