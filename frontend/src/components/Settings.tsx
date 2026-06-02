import React, { useState } from "react";
import { Member, MasterRow } from "../types";
import { Download, RotateCcw, ShieldCheck, Heart, Sparkles, RefreshCcw } from "lucide-react";

interface SettingsProps {
  members: Member[];
  masterRows: MasterRow[];
  onResetToDefault: () => void;
  onUploadBackup: (members: Member[], masterRows: MasterRow[]) => void;
  currentYear?: string;
}

export default function Settings({ members, masterRows, onResetToDefault, onUploadBackup }: SettingsProps) {
  const [resetSuccess, setResetSuccess] = useState(false);

  const triggerReset = () => {
    if (window.confirm("શું તમે ખરેખર બધો ડેટા મૂળભૂત સભ્યો સાથે રીસેટ કરવા માંગો છો? આનાથી તમારા કરેલા ફેરફારો નીકળી જશે.")) {
      onResetToDefault();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  const handleBackupDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ members, masterRows }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `shubh_vyapar_backup_${new Date().getFullYear()}.json`);
    dlAnchorElem.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.members && parsed.masterRows) {
            onUploadBackup(parsed.members, parsed.masterRows);
            alert("બેકઅપ ફાઈલ સફળતાપૂર્વક અપલોડ થઈ ગઈ છે!");
          } else {
            alert("અમાન્ય ફાઈલ પ્રારૂપ! સાચી બેકઅપ ફાઈલ પસંદ કરો.");
          }
        } catch (err) {
          alert("ફાઈલ વાંચવામાં ભૂલ થઈ છે.");
        }
      };
    }
  };

  return (
    <div className="space-y-6 font-sans select-none">
      <div>
        <h3 className="text-xl font-extrabold text-amber-950">સિસ્ટમ સેટિંગ્સ (System Control Panel)</h3>
        <p className="text-xs text-amber-700/80 mt-1">ખાતાવહી સુરક્ષિત રાખવા માટે બેકઅપ લેવા અને સિસ્ટમને નિયંત્રિત કરવાની વ્યવસ્થા.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup and restore panel */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-6 shadow-sm">
          <h4 className="font-extrabold text-amber-950 text-base border-b border-amber-50 pb-2.5 flex items-center gap-2">
            <span>💾</span> ડેટા બેકઅપ અને સુરક્ષા સહાયક
          </h4>
          <p className="text-xs text-amber-800 leading-relaxed font-semibold">
            લેખિત હિસાબ ખોવાઈ ન જાય તે માટે આખા પ્લેટફોર્મનો ડેટા ગમે ત્યારે કમ્પ્યુટર કે ફોનમાં ડાઉનલોડ કરી સુરક્ષિત રાખી શકાય છે.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={handleBackupDownload}
              className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-shadow shadow-sm active:scale-95"
            >
              <Download className="size-4" />
              <span>બેકઅપ ડાઉનલોડ કરો (Backup Download)</span>
            </button>
            <label className="px-5 py-3 bg-white hover:bg-amber-50/50 text-amber-950 border border-amber-200 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-sm active:scale-95">
              <span>📤</span>
              <span>બેકઅપ ફાઇલ અપલોડ</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Reset / Maintenance Card */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-6 shadow-sm">
          <h4 className="font-extrabold text-amber-950 text-base border-b border-amber-50 pb-2.5 flex items-center gap-2">
            <span>⚙️</span> પ્રારંભિક મુલ્યો રીસેટ કરો
          </h4>
          <p className="text-xs text-amber-800 leading-relaxed font-semibold text-rose-800">
            ધ્યાન આપો! આ બટન દબાવવાથી તમામ રજીસ્ટર આંકડા અને સભ્ય માહિતી તેમના પ્રારંભિક ડેમો સ્વરૂપમાં પાછી આવી જશે.
          </p>
          <div className="pt-2">
            <button
              onClick={triggerReset}
              className="px-5 py-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer border border-red-200"
            >
              <RotateCcw className="size-4" />
              <span>ડેમો ડેટામાં પાછા ફરો (Reset to Defaults)</span>
            </button>
            {resetSuccess && (
              <p className="text-xs text-emerald-700 font-bold mt-3">✓ ડેટા સફળતાપૂર્વક પ્રારંભિક ડેમોમાં રીસેટ થયો છે!</p>
            )}
          </div>
        </div>
      </div>

      {/* Elder User instructions card */}
      <div className="bg-gradient-to-r from-amber-50/20 to-orange-50/20 rounded-2xl border border-amber-100 p-6 md:p-8 space-y-6">
        <h4 className="font-extrabold text-amber-950 text-base flex items-center gap-2">
          <ShieldCheck className="size-5 text-orange-600" />
          <span>શુભ વ્યાપાર ડિજિટલ રજીસ્ટરના નિયમો અને ખાતરીપત્ર</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-amber-950 font-medium leading-relaxed">
          <div className="bg-white/80 p-4 rounded-xl border border-amber-100/50 space-y-2">
            <span className="text-lg block">🔒</span>
            <span className="font-bold text-amber-900 block">એક સુરક્ષિત લોગીન</span>
            <p className="text-amber-800">એક જ યુઝર આઈડી અને પાસવર્ડ વડે ઘરના ૫ સભ્યો અલગ અલગ ફોન કે ટેબલેટનો ઉપયોગ કરીને સાથે કામ કરી શકે છે.</p>
          </div>

          <div className="bg-white/80 p-4 rounded-xl border border-amber-100/50 space-y-2">
            <span className="text-lg block">📡</span>
            <span className="font-bold text-amber-900 block">રીયલ-ટાઇમ હિસાબ સિંક</span>
            <p className="text-amber-800">જ્યારે કોઈ એક સભ્ય આંકડો સુધારે છે, ત્યારે અન્ય તમામ લોગ-ઈન સભ્યોને તે નવો હિસાબ આપોઆપ દેખાઈ આવે છે.</p>
          </div>

          <div className="bg-white/80 p-4 rounded-xl border border-amber-100/50 space-y-2">
            <span className="text-lg block">❤️</span>
            <span className="font-bold text-amber-900 block">આદરણીય સેન્ટ્રલ રજીસ્ટર</span>
            <p className="text-amber-800">અમારા વડીલોની પારંપરિક ચોપડા પૂજન ખાતાવહી ડાયરીને સંપૂર્ણ આદર અને પ્રણામ સાથે ડિજિટલ બનાવીએ.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
