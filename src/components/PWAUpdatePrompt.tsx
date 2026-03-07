import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-100 flex items-center gap-3 rounded-lg border border-[#2a2a2a] bg-[#151515]/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <p className="text-sm text-[#a1a1aa]">A new version is available</p>
      <button
        onClick={() => void updateServiceWorker(true)}
        className="rounded bg-[#f6821f] px-3 py-1 text-xs font-medium text-white hover:bg-[#f6821f]/90 transition-colors"
      >
        Update
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="rounded border border-[#2a2a2a] bg-transparent px-3 py-1 text-xs font-medium text-[#71717a] hover:border-[#3a3a3a] hover:text-white transition-colors"
      >
        Later
      </button>
    </div>
  );
}
