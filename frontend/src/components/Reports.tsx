import { Member, MasterRow, FINANCIAL_YEARS } from "../types";
import { Printer, Download, CalendarDays } from "lucide-react";

interface ReportsProps {
  members: Member[];
  masterRows: MasterRow[];
  currentYear?: string;
}

export default function Reports({ members, masterRows, currentYear }: ReportsProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleBackupDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ members, masterRows }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `shubh_vyapar_ahval_${new Date().getFullYear()}.json`);
    dlAnchorElem.click();
  };

  const yearKeys = FINANCIAL_YEARS.map(y => y.id);

  // Dynamic sums for active years
  const activeCapitalSum = members.reduce((sum, m) => {
    return sum + yearKeys.reduce((mSum, key) => mSum + (m[key]?.capital || 0), 0);
  }, 0);

  return (
    <div className="space-y-6 font-sans select-none print:p-0">
      {/* Action Header */}
      <div className="flex justify-between items-center border-b border-amber-100 pb-3 print:hidden">
        <div>
          <h3 className="text-xl font-extrabold text-amber-950">અહેવાલ અને રીપોર્ટ્સ (Reports Module)</h3>
          <p className="text-xs text-amber-700/80 mt-1">પીડીએફ ડાઉનલોડ કરવા અને તમામ ખાતાનો સંપૂર્ણ પ્રિન્ટ અહેવાલ તૈયાર કરો.</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={handleBackupDownload}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="size-4" />
            <span>બેકઅપ લોડ</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Printer className="size-4" />
            <span>રીપોર્ટ પ્રિન્ટ કરો</span>
          </button>
        </div>
      </div>

      {/* Main Print Ready Report */}
      <div className="bg-white rounded-2xl border border-amber-100 p-8 space-y-8 shadow-[0_4px_30px_rgba(0,0,0,0.01)] print:border-none print:shadow-none print:p-0">
        
        {/* Letterhead Design */}
        <div className="text-center border-b-2 border-amber-200 pb-6 space-y-2">
          <span className="text-amber-800 text-xs font-semibold uppercase tracking-widest block">॥ શ્રી હનુમતે નમઃ ॥</span>
          <h2 className="text-2xl md:text-3xl font-black text-amber-950">શુભ વ્યાપાર ભાગીદારી ખાતાવહી મંડળ</h2>
          <p className="text-sm text-amber-700 font-medium font-serif italic">ચોપડા પૂજન અને વાર્ષિક હિસાબ અહેવાલ - એકંદર ડાયરી</p>
          <div className="text-xs text-amber-900/50 font-mono pt-1">
            જનરેટ સમય: {new Date().toLocaleDateString("gu-IN")} • {new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Audit Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
          {/* Quick Recap */}
          <div className="bg-[#FFFDF5] p-5 rounded-xl border border-amber-100/70 space-y-3">
            <h4 className="font-extrabold text-[#78350F] text-sm flex items-center gap-1.5 border-b border-amber-100/60 pb-1.5">
              <span>📊</span> નાણાકીય ટૂંકી વિગત
            </h4>
            <div className="space-y-2 text-xs text-amber-950">
              <div className="flex justify-between font-semibold">
                <span>૧. કુલ સભ્યો સંખ્યા:</span>
                <span className="font-mono font-bold">{members.length} (ACTIVE)</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>૨. તમામ કેલેન્ડર વર્ષ કુલ મૂડી જમા:</span>
                <span className="font-mono font-bold">
                  ₹ {activeCapitalSum.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>૩. કુલ ગોપી મંડળ વિશિષ્ટ ફંડ:</span>
                <span className="font-mono font-bold">
                  ₹ {members.reduce((sum, m) => sum + (m.gopiMandal || 0), 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>૪. કુલ સ્થિર ચૂકવણી હોલ્ડિંગ:</span>
                <span className="font-mono font-bold">
                  ₹ {members.reduce((sum, m) => sum + (m[`holding${(currentYear || 'year2026').replace('year','')}`] || 0), 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Recap 2 */}
          <div className="bg-[#FFFDF5] p-5 rounded-xl border border-amber-100/70 space-y-3">
            <h4 className="font-extrabold text-[#78350F] text-sm flex items-center gap-1.5 border-b border-amber-100/60 pb-1.5">
              <span>✍️</span> ઓડિટ અને પ્રમાણપત્ર
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed font-semibold italic">
              "ઉપરોક્ત ખાતાવહી વિગતો સામાન્ય સભ્યો દ્વારા ચકાસીને મંજુર રાખેલ છે. આ ફાસ્ટ ડિજિટલ રજીસ્ટર ડેટા સિંક કરેલ છે, જેને તમામ ઉપકરણો પર સુરક્ષિત માન્યતા પ્રાપ્ત છે."
            </p>
            <p className="text-[10px] text-amber-800/60 font-medium">સિસ્ટમ ID: shubh_vyapar_auth_sec_2026</p>
          </div>
        </div>

        {/* Dynamic Member Distributions Rows list in report */}
        <div className="space-y-4">
          <h4 className="font-extrabold text-amber-950 text-base flex items-center gap-1.5">
            <CalendarDays className="size-4 text-orange-600" />
            <span>સભ્યવાર ચૂકવણી અહેવાલ વિગતો (Member Outlines)</span>
          </h4>

          <div className="border border-amber-100 rounded-xl overflow-hidden divide-y divide-amber-100 text-xs">
            {members.map((m) => {
              const capSum = yearKeys.reduce((sum, key) => sum + (m[key]?.capital || 0), 0);
              const expSum = yearKeys.reduce((sum, key) => sum + (m[key]?.expense || 0), 0);
              const profSum = yearKeys.reduce((sum, key) => sum + (m[key]?.profit || 0), 0);
              const hk = `holding${(currentYear || 'year2026').replace('year','')}`;
              const finalShare = capSum - expSum + profSum - (m[hk] || 0) + (m.gopiMandal || 0);

              return (
                <div key={m.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white hover:bg-amber-50/5">
                  <div>
                    <span className="font-extrabold font-sans text-amber-950 text-sm block">{m.nameGu}</span>
                    <span className="text-[10px] text-amber-900/40 uppercase font-bold font-mono tracking-widest">{m.nameEn}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[11px]">
                    <div className="text-right">
                      <span className="text-amber-900/55 block">કુલ યોગદાન (મુડી)</span>
                      <span className="font-bold text-amber-950 font-mono">₹{capSum.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-900/55 block">હોલ્ડિંગ બાકી</span>
                      <span className="font-bold text-red-700 font-mono">₹{(m[hk] || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="text-right bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100/50">
                      <span className="text-amber-950 font-extrabold block">ભાગ સરવાળો</span>
                      <span className="font-bold text-amber-900 font-mono text-xs">₹{finalShare.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verification seal and footers */}
        <div className="pt-2">
          <div className="flex justify-between items-center text-xs text-amber-800/70 py-4 border-t border-dotted border-amber-200">
            <span>સિસ્ટમ રીપોર્ટ • PDF પ્રિન્ટ સપોર્ટ</span>
            <span>શુભ વ્યાપાર હિસાબ રજીસ્ટર ૨૦૨૬</span>
          </div>

          <div className="flex justify-between items-end gap-6 pt-6">
            <div className="space-y-1.5 border border-dashed border-amber-200 p-3 rounded-lg bg-[#FFFDF9]">
              <p className="text-[10px] font-bold text-amber-950 uppercase">સાક્ષીની સહી:</p>
              <div className="h-6 border-b border-amber-200 w-36" />
            </div>

            <div className="space-y-1.5 border border-dashed border-amber-200 p-3 rounded-lg bg-[#FFFDF9] text-right">
              <p className="text-[10px] font-bold text-amber-950 uppercase">લી. વ્યવસ્થાપક મંડળ:</p>
              <div className="h-6 border-b border-amber-200 w-36 ml-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
