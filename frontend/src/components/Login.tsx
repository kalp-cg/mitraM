import React, { useState } from "react";
import { motion } from "motion/react";
import { KeyRound, User, FlameKindling, Info, Sparkles } from "lucide-react";

interface LoginProps {
  onSuccess: (token: string) => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setErrorMsg("કૃપા કરીને બધા ખાના ભરો!");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.token);
      } else {
        setErrorMsg(data.messageGu || "ખોટી વિગત! કૃપા કરીને ફરી પ્રયાસ કરો.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("બીજી કોઈ મુશ્કેલી છે, સર્વર ચાલુ છે તેની તપાસ કરો.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-brand-wheat selection:text-[#2C1810]">
      {/* Background Spiritual Ornamentation */}
      <div className="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-[radial-gradient(ellipse_at_top_left,#B3541E_0%,transparent_60%)] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-[radial-gradient(ellipse_at_bottom_right,#FF9933_0%,transparent_60%)] opacity-20 pointer-events-none" />

      {/* Main Chopda Book Login Case */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-2xl shadow-[0_16px_50px_rgba(44,24,16,0.06)] border border-brand-border overflow-hidden relative"
      >
        {/* Top Ledger Book Header Accent */}
        <div className="bg-gradient-to-r from-[#9c3610] via-brand-orange to-brand-saffron h-3 w-full" />
        
        {/* Sacred Small Icon Header */}
        <div className="flex justify-center mt-5">
          <div className="flex items-center gap-1.5 bg-brand-lightcream px-3.5 py-1.5 rounded-full border border-brand-border shadow-sm text-brand-orange">
            <FlameKindling className="size-4 animate-pulse stroke-brand-orange fill-brand-saffron" />
            <span className="text-xs font-bold tracking-wide text-brand-soil">ૐ શ્રી ગણેશાય નમઃ</span>
          </div>
        </div>

        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brand-soil font-sans">પ્રવેશ દ્વાર (Login)</h2>
            <p className="text-brand-orange text-sm mt-1 font-semibold">ચોપડા પૂજન ડિજિટલ રજીસ્ટરમાં પ્રવેશ મેળવો</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User ID Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-brand-soil" htmlFor="userId">
                યુઝર આઈડી (User ID) <span className="text-brand-orange">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-orange">
                  <User className="size-5" />
                </div>
                <input
                  id="userId"
                  type="text"
                  placeholder="યુઝર આઈડી લખો (e.g. user)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-brand-cream border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-colors placeholder:text-brand-soil/40 text-brand-soil font-medium text-[16px]"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-brand-soil" htmlFor="password">
                પાઠવર્ડ (Password) <span className="text-brand-orange">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-orange">
                  <KeyRound className="size-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="સાચો પાસવર્ડ લખો"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-brand-cream border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-colors placeholder:text-brand-soil/40 text-brand-soil font-medium text-[16px]"
                />
              </div>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex gap-2 items-start"
              >
                <Info className="size-4 shrink-0 mt-0.5 text-red-600" />
                <p className="font-semibold text-xs md:text-sm leading-relaxed">{errorMsg}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-orange to-brand-saffron text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
            >
              {loading ? (
                <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="size-5 stroke-[2px]" />
                  <span>પ્રવેશ કરો</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Help Hints for Elder Users */}
          <div className="mt-8 pt-6 border-t border-brand-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-soil/80 mb-2.5 flex items-center gap-1.5">
              <Info className="size-3.5 text-brand-orange" />
              વડીલો માટે મદદ
            </h4>
            <ul className="space-y-1.5 text-xs text-brand-soil/80 font-semibold leading-relaxed list-disc list-inside">
              <li>રજીસ્ટર્ડ યુઝર આઈડી અને પાસવર્ડ માટે એડમિનનો સંપર્ક કરો.</li>
              <li>એક સાથે પાંચ સભ્યો અલગ ઉપકરણોથી લોગીન કરી શકે છે.</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Bottom Copyright Gilded Accent */}
      <footer className="mt-8 text-center text-xs text-brand-soil/60 font-semibold">
        © ૨૦૨૬ શુભ વ્યાપાર • તમામ હક સ્વાધીન છે.
      </footer>
    </div>
  );
}
