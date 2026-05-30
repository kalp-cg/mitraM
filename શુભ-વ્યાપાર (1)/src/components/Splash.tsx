import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const [pulse, setPulse] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    const pTimer = setInterval(() => setPulse((p) => !p), 1500);
    const timer = setTimeout(() => {
      onComplete();
    }, 300); // Super fast loader for excellent user experience
    return () => {
      clearTimeout(timer);
      clearInterval(pTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-brand-cream flex flex-col items-center justify-center p-4 overflow-hidden select-none z-50">
      {/* Dynamic Spiritual Sun Background Beams */}
      <div className="absolute inset-0 bg-radial-[radial-gradient(circle_at_center,rgba(179,84,30,0.1)_0%,transparent_70%)] animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center max-w-lg text-center"
      >
        {/* Sacred Traditional India Circular Mandorla Frame containing Lord Hanuman SVG */}
        <div className="relative mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 rounded-full border border-dashed border-brand-orange opacity-40"
          />
          <motion.div
            animate={{ scale: pulse ? 1.05 : 1 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
            className="w-48 h-48 md:w-56 md:h-56 bg-gradient-to-br from-brand-saffron via-brand-orange to-[#9c3610] rounded-full p-2 hover:scale-105 transition-all shadow-[0_12px_40px_rgba(179,84,30,0.30)] flex items-center justify-center border-4 border-white overflow-hidden relative"
          >
            {!imgErr ? (
              <img
                src="/api/image/hanuman-full"
                alt="Lord Hanuman Dada Blessing"
                referrerPolicy="no-referrer"
                onError={() => {
                  console.log("Failed to load hanuman-full, showing SVG fallback");
                  setImgErr(true);
                }}
                className="w-full h-full object-cover object-top rounded-full animate-fade-in"
              />
            ) : (
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
                fill="currentColor"
              >
                <defs>
                  <radialGradient id="halo" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFF" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="45" r="28" fill="url(#halo)" />
                <polygon points="50,12 55,24 45,24" fill="#FBBF24" stroke="#2C1810" strokeWidth="1" />
                <polygon points="50,6 52,14 48,14" fill="#F59E0B" />
                <circle cx="50" cy="18" r="2" fill="#DC2626" />
                <circle cx="50" cy="23" r="1.5" fill="#FFF" />
                <path
                  d="M 38,40 C 38,28 62,28 62,40 C 62,48 58,54 50,54 C 42,54 38,48 38,40 Z"
                  fill="#F97316"
                  stroke="#2C1810"
                  strokeWidth="1.2"
                />
                <path d="M 48,27 C 48,27 50,34 50,34 C 50,34 52,27 52,27 Z" fill="#DC2626" />
                <circle cx="50" cy="35" r="1" fill="#FBBF24" />
                <path d="M 42,38 Q 46,36 48,39" stroke="#2C1810" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M 58,38 Q 54,36 52,39" stroke="#2C1810" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path
                  d="M 45,43 Q 50,47 55,43"
                  stroke="#2C1810"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 43,45 C 43,45 42,52 50,51 C 58,52 57,45 57,45 C 57,48 54,53 50,53 C 46,53 43,48 43,45"
                  fill="#EA580C"
                  stroke="#2C1810"
                  strokeWidth="0.8"
                />
                <path d="M 47,48 Q 50,50 53,48" stroke="#2C1810" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                <circle cx="34" cy="40" r="3.5" fill="#FBBF24" stroke="#2C1810" strokeWidth="0.8" />
                <circle cx="66" cy="40" r="3.5" fill="#FBBF24" stroke="#2C1810" strokeWidth="0.8" />
                <path d="M 38,52 Q 50,66 62,52" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeDasharray="1.5,1.5" />
                <path d="M 40,54 Q 50,64 60,54" fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="1,1" />
                <path d="M 28,68 L 36,54" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
                <circle cx="26" cy="71" r="5" fill="#F1F5F9" stroke="#2C1810" strokeWidth="1" />
                <path
                  d="M 20,78 Q 30,72 50,78 Q 70,72 80,78 Q 85,88 50,88 Q 15,88 20,78 Z"
                  fill="#EF4444"
                  stroke="#B91C1C"
                  strokeWidth="1"
                />
                <path
                  d="M 30,76 Q 50,68 70,76"
                  fill="none"
                  stroke="#FCD34D"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </motion.div>
        </div>

        {/* Dynamic Gilded Border Decoration */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-brand-orange text-xl">✨</span>
          <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-brand-orange to-transparent" />
          <span className="text-xl text-brand-orange font-semibold mb-1">ॐ</span>
          <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-brand-orange to-transparent" />
          <span className="text-brand-orange text-xl">✨</span>
        </div>

        {/* Titles */}
        <h1 className="text-3xl font-bold text-brand-soil font-sans tracking-tight mb-2">
          શુભ વ્યાપાર
        </h1>
        <p className="text-brand-orange font-medium text-lg leading-relaxed px-4">
          ચોપડા પૂજન ડિજિટલ ખાતાવહી
        </p>
        
        <p className="text-brand-soil/80 text-sm mt-3 font-semibold pb-1">
          વડીલો માટે સૌથી સરળ સેન્ટ્રલાઇઝ્ડ હસ્તાંતરણ સિસ્ટમ
        </p>

        {/* Traditional Progress Indicator */}
        <div className="mt-8 flex items-center gap-1.5 justify-center">
          <span className="size-2 bg-brand-orange rounded-full animate-bounce delay-100" />
          <span className="size-2 bg-brand-saffron rounded-full animate-bounce delay-200" />
          <span className="size-2 bg-brand-wheat rounded-full animate-bounce delay-300" />
        </div>
        
        <p className="text-xs text-brand-soil/60 font-mono mt-6">
          પૂજ્ય હનુમાન દાદાના આશીર્વાદ સહ...
        </p>
      </motion.div>
    </div>
  );
}
