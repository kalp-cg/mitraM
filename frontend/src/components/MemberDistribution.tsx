import { useState } from "react";
import { Member, FINANCIAL_YEARS, IpoTrade } from "../types";
import { Check, Edit2, Printer, Sparkles, AlertCircle } from "lucide-react";

interface MemberDistributionProps {
  members: Member[];
  onSaveMembers: (updated: Member[]) => void;
  currentYear?: string;
  ipoTrades?: IpoTrade[];
}

export default function MemberDistribution({ members, onSaveMembers, currentYear, ipoTrades = [] }: MemberDistributionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMembers, setEditedMembers] = useState<Member[]>([]);

  // State for Year 2 (Current comparative year)
  const [selectedYear, setSelectedYear] = useState(currentYear || "year2026");

  // Determine Year 1 (Previous year) and Year 2 configurations
  const year2Index = FINANCIAL_YEARS.findIndex(y => y.id === selectedYear);
  const year1Config = year2Index > 0 ? FINANCIAL_YEARS[year2Index - 1] : FINANCIAL_YEARS[0];
  const year2Config = FINANCIAL_YEARS[year2Index] || FINANCIAL_YEARS[1];

  const y1Key = year1Config.id; // e.g. "year2025"
  const y2Key = year2Config.id; // e.g. "year2026"

  const startEditing = () => {
    setEditedMembers(JSON.parse(JSON.stringify(members)));
    setIsEditing(true);
  };

  const handleCellChange = (
    memberIndex: number,
    section: string,
    field: string,
    val: string
  ) => {
    const clone = editedMembers.map((m, idx) => {
      if (idx !== memberIndex) return m;

      const clonedMember = JSON.parse(JSON.stringify(m));
      const numericVal = parseFloat(val) || 0;

      if (section === 'root') {
        clonedMember[field] = numericVal;
      } else {
        if (!clonedMember[section]) {
          clonedMember[section] = { capital: 0, expense: 0, profit: 0 };
        }
        clonedMember[section][field] = numericVal;
      }
      return clonedMember;
    });

    setEditedMembers(clone);
  };

  const handleSave = () => {
    onSaveMembers(editedMembers);
    setIsEditing(false);
  };

  const currentMembers = isEditing ? editedMembers : members;

  // 1. Calculate Mandal's Year 2 active IPO investments (properly multiplied by quantity!)
  const activeInvestedY2 = ipoTrades
    .filter(t => t.year === y2Key && t.status === 'holding')
    .reduce((s, t) => s + ((t.buyPrice || 0) * (t.quantity || 1)), 0);

  // 2. Divided equally among active members
  const memberHoldingY2 = currentMembers.length > 0 ? activeInvestedY2 / currentMembers.length : 0;

  // Gujarati numeral converter for fiscal year labels (e.g. year2023 -> ૨૦૨૩/૨૪)
  const getGujaratiFiscalYearLabel = (yearId: string) => {
    const yearNum = parseInt(yearId.replace("year", ""));
    if (isNaN(yearNum)) return yearId;
    const nextYearShort = String(yearNum + 1).slice(-2);
    
    const guNumMap: { [key: string]: string } = {
      '0': '૦', '1': '૧', '2': '૨', '3': '૩', '4': '૪',
      '5': '૫', '6': '૬', '7': '૭', '8': '૮', '9': '૯'
    };
    
    const convert = (str: string) => str.split('').map(char => guNumMap[char] || char).join('');
    return `${convert(String(yearNum))}/${convert(nextYearShort)}`;
  };

  // Row calculations for rendering and footer summation
  let totalCap1 = 0;
  let totalCap2 = 0;
  let totalMudiCol = 0;
  let totalExp1 = 0;
  let totalExp2 = 0;
  let totalRemMudiCol = 0;
  let totalProf1 = 0;
  let totalProf2 = 0;
  let totalRemMudiProfitCol = 0;
  let totalHoldingCol = 0;
  let totalGopiMandal = 0;
  let totalNetPayout = 0;

  const rows = currentMembers.map((m, idx) => {
    const valCap1 = m[y1Key]?.capital || 0;
    const valCap2 = m[y2Key]?.capital || 0;
    const mudiSum = valCap1 + valCap2;

    const valExp1 = m[y1Key]?.expense || 0;
    const valExp2 = m[y2Key]?.expense || 0;
    const remMudi = mudiSum - (valExp1 + valExp2);

    const valProf1 = m[y1Key]?.profit || 0;
    const valProf2 = m[y2Key]?.profit || 0;
    const remMudiProfit = remMudi + valProf1 + valProf2;

    const valHold = memberHoldingY2;
    const valGopi = m.gopiMandal || 0;
    const netPayout = remMudiProfit - valHold + valGopi;

    // Summing columns for footer
    totalCap1 += valCap1;
    totalCap2 += valCap2;
    totalMudiCol += mudiSum;
    totalExp1 += valExp1;
    totalExp2 += valExp2;
    totalRemMudiCol += remMudi;
    totalProf1 += valProf1;
    totalProf2 += valProf2;
    totalRemMudiProfitCol += remMudiProfit;
    totalHoldingCol += valHold;
    totalGopiMandal += valGopi;
    totalNetPayout += netPayout;

    return {
      member: m,
      valCap1,
      valCap2,
      mudiSum,
      valExp1,
      valExp2,
      remMudi,
      valProf1,
      valProf2,
      remMudiProfit,
      valHold,
      valGopi,
      netPayout
    };
  });

  return (
    <div className="space-y-6 font-sans select-none print:space-y-0">
      {/* Table header menu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-amber-100 pb-3 print:hidden">
        <div>
          <h3 className="text-xl font-extrabold text-amber-950">સભ્ય વિતરણ પત્રક (Comparative Sheet)</h3>
          <p className="text-xs text-amber-700/80 mt-1">બધા વર્ષની મૂડી, ખર્ચ, નફો, શેર હોલ્ડિંગ અને સભ્યવાર ચૂકવણીનો ૧૦૦% કનેક્ટેડ હિસાબ</p>
        </div>

        <div className="flex items-center gap-2 self-end w-full sm:w-auto">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-100"
            >
              <Check className="size-4" />
              <span>ડેટા સેવ કરો</span>
            </button>
          ) : (
            <button
              onClick={startEditing}
              className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-orange-100"
            >
              <Edit2 className="size-4" />
              <span>કોષ્ટક સુધારો (Edit Cells)</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md whitespace-nowrap"
          >
            <Printer className="size-4" />
            <span>પીડીએફ એક્સપોર્ટ</span>
          </button>
        </div>
      </div>

      {/* Dynamic comparative year selector */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-amber-100 shadow-[0_2px_10px_rgba(0,0,0,0.01)] print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
          <Sparkles className="size-4 text-brand-orange animate-pulse" />
          <span>શેર હોલ્ડિંગ ચાલુ લાઈવ કિંમત: ₹{activeInvestedY2.toLocaleString("en-IN")} (દરેક સભ્યના ભાગે સરખે હિસ્સે: ₹{memberHoldingY2.toLocaleString("en-IN")})</span>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
          <span className="text-[10px] font-bold text-amber-900/60 uppercase">સરખામણી વર્ષ પસંદ કરો:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-amber-950 pr-4 outline-none cursor-pointer font-sans"
          >
            {FINANCIAL_YEARS.slice(1).map(y => (
              <option key={y.id} value={y.id}>સરખામણી: {y.labelEn}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Spreadsheet container */}
      <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.01)] flex flex-col print:border-none print:shadow-none">
        <div className="p-4 border-b border-amber-50 bg-[#FFFDF5]/50 flex justify-between items-center print:hidden">
          <span className="text-xs font-extrabold text-amber-950 flex items-center gap-2">
            <span>📋</span> વાર્ષિક સરવાળો અને ભાગીદારી પત્રક (વર્ષ {getGujaratiFiscalYearLabel(y1Key)} અને {getGujaratiFiscalYearLabel(y2Key)})
          </span>
          <span className="text-[9px] font-mono font-bold text-amber-700/60 bg-amber-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
            લાઇવ સિંક કરેલ છે
          </span>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse table-auto text-xs md:text-sm print:text-[10px]">
            <thead>
              {/* Top Banner Category Header */}
              <tr className="bg-amber-100/40 border-b border-amber-200/80 text-[10px] font-extrabold text-amber-900 uppercase tracking-wider text-center select-none print:bg-slate-100 print:border-b-2">
                <th className="py-2.5 px-3 border-r border-amber-200/40 w-8" rowSpan={2}>ક્રમ</th>
                <th className="py-2.5 px-4 border-r border-amber-200/40 text-left w-36" rowSpan={2}>નામ</th>
                <th className="py-1.5 px-3 border-r border-amber-200/40" colSpan={3}>મૂડી (Capital)</th>
                <th className="py-1.5 px-3 border-r border-amber-200/40" colSpan={3}>ખર્ચ (Expense)</th>
                <th className="py-1.5 px-3 border-r border-amber-200/40" colSpan={3}>નફો (Profit)</th>
                <th className="py-2.5 px-3 border-r border-amber-200/40 w-28" rowSpan={2}>હોલ્ડિંગ ({getGujaratiFiscalYearLabel(y2Key)})</th>
                <th className="py-2.5 px-3 border-r border-amber-200/40 w-24" rowSpan={2}>ગોપી મંડળ</th>
                <th className="py-2.5 px-4 bg-amber-50 w-36" rowSpan={2}>સભ્યના ભાગમાં આવતી રકમ</th>
              </tr>
              {/* Detailed Sub Columns Header */}
              <tr className="bg-amber-50 border-b border-amber-200/80 text-[9px] md:text-[10px] font-bold text-amber-950 text-right select-none print:bg-slate-50">
                {/* Capital Sub */}
                <th className="py-2 px-3 border-r border-amber-100 font-extrabold text-center">વર્ષ - {getGujaratiFiscalYearLabel(y1Key)}</th>
                <th className="py-2 px-3 border-r border-amber-100 font-extrabold text-center">વર્ષ - {getGujaratiFiscalYearLabel(y2Key)}</th>
                <th className="py-2 px-3 border-r border-amber-200/40 font-black text-center bg-amber-50/50">કુલ</th>
                
                {/* Expense Sub */}
                <th className="py-2 px-3 border-r border-amber-100 font-extrabold text-center text-red-900">વર્ષ - {getGujaratiFiscalYearLabel(y1Key)}</th>
                <th className="py-2 px-3 border-r border-amber-100 font-extrabold text-center text-red-900">વર્ષ - {getGujaratiFiscalYearLabel(y2Key)}</th>
                <th className="py-2 px-3 border-r border-amber-200/40 font-black text-center text-red-950 bg-red-50/20">વધેલ રકમ</th>
                
                {/* Profit Sub */}
                <th className="py-2 px-3 border-r border-amber-100 font-extrabold text-center text-emerald-900">વર્ષ - {getGujaratiFiscalYearLabel(y1Key)}</th>
                <th className="py-2 px-3 border-r border-amber-100 font-extrabold text-center text-emerald-900">વર્ષ - {getGujaratiFiscalYearLabel(y2Key)}</th>
                <th className="py-2 px-3 border-r border-amber-200/40 font-black text-center text-emerald-950 bg-emerald-50/20">વધેલ રકમ</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-amber-100 text-[11px] md:text-xs font-sans font-semibold text-amber-950 print:text-[9px]">
              {rows.map((row, idx) => (
                <tr key={row.member.id} className="hover:bg-amber-50/20 transition-colors">
                  {/* Serial Number */}
                  <td className="py-3 px-3 text-center font-mono border-r border-amber-100/50 text-amber-700 bg-amber-50/5">{idx + 1}</td>
                  
                  {/* Member Name */}
                  <td className="py-3 px-4 font-extrabold text-amber-950 border-r border-amber-200/30 text-left whitespace-nowrap bg-[#FFFDFB]/60">
                    <div className="flex items-center gap-2">
                      <img src={row.member.imageUrl} alt={row.member.nameEn} className="size-6 rounded object-cover inline-block border border-amber-100 print:hidden" referrerPolicy="no-referrer" />
                      <span>{row.member.nameGu}</span>
                    </div>
                  </td>

                  {/* Year 1 Capital */}
                  <td className="py-2 px-3 text-right font-mono border-r border-amber-100">
                    {isEditing ? (
                      <input
                        type="number"
                        value={row.valCap1 || ""}
                        onChange={(e) => handleCellChange(idx, y1Key, 'capital', e.target.value)}
                        className="w-full text-right bg-amber-50/70 border border-amber-200 px-1 py-0.5 rounded text-[11px] font-bold outline-none font-mono"
                      />
                    ) : (
                      row.valCap1.toLocaleString("en-IN")
                    )}
                  </td>
                  
                  {/* Year 2 Capital */}
                  <td className="py-2 px-3 text-right font-mono border-r border-amber-100">
                    {isEditing ? (
                      <input
                        type="number"
                        value={row.valCap2 || ""}
                        onChange={(e) => handleCellChange(idx, y2Key, 'capital', e.target.value)}
                        className="w-full text-right bg-amber-50/70 border border-amber-200 px-1 py-0.5 rounded text-[11px] font-bold outline-none font-mono"
                      />
                    ) : (
                      row.valCap2.toLocaleString("en-IN")
                    )}
                  </td>
                  
                  {/* Total Capital */}
                  <td className="py-3 px-3 text-right font-mono font-black border-r border-amber-200/30 bg-amber-50/10">
                    {row.mudiSum.toLocaleString("en-IN")}
                  </td>

                  {/* Year 1 Expense */}
                  <td className="py-2 px-3 text-right font-mono border-r border-amber-100 text-red-900/90">
                    {isEditing ? (
                      <input
                        type="number"
                        value={row.valExp1 || ""}
                        onChange={(e) => handleCellChange(idx, y1Key, 'expense', e.target.value)}
                        className="w-full text-right bg-red-50/40 border border-amber-200 px-1 py-0.5 rounded text-[11px] font-bold outline-none text-red-950 font-mono"
                      />
                    ) : (
                      row.valExp1.toLocaleString("en-IN")
                    )}
                  </td>
                  
                  {/* Year 2 Expense */}
                  <td className="py-2 px-3 text-right font-mono border-r border-amber-100 text-red-900/90">
                    {isEditing ? (
                      <input
                        type="number"
                        value={row.valExp2 || ""}
                        onChange={(e) => handleCellChange(idx, y2Key, 'expense', e.target.value)}
                        className="w-full text-right bg-red-50/40 border border-amber-200 px-1 py-0.5 rounded text-[11px] font-bold outline-none text-red-950 font-mono"
                      />
                    ) : (
                      row.valExp2.toLocaleString("en-IN")
                    )}
                  </td>
                  
                  {/* Remaining Mudi */}
                  <td className="py-3 px-3 text-right font-mono font-black border-r border-amber-200/30 text-amber-900 bg-red-50/5">
                    {row.remMudi.toLocaleString("en-IN")}
                  </td>

                  {/* Year 1 Profit */}
                  <td className="py-2 px-3 text-right font-mono border-r border-amber-100 text-emerald-900/90">
                    {isEditing ? (
                      <input
                        type="number"
                        value={row.valProf1 || ""}
                        onChange={(e) => handleCellChange(idx, y1Key, 'profit', e.target.value)}
                        className="w-full text-right bg-emerald-50/40 border border-amber-200 px-1 py-0.5 rounded text-[11px] font-bold outline-none text-emerald-950 font-mono"
                      />
                    ) : (
                      row.valProf1.toLocaleString("en-IN")
                    )}
                  </td>
                  
                  {/* Year 2 Profit */}
                  <td className="py-2 px-3 text-right font-mono border-r border-amber-100 text-emerald-900/90">
                    {isEditing ? (
                      <input
                        type="number"
                        value={row.valProf2 || ""}
                        onChange={(e) => handleCellChange(idx, y2Key, 'profit', e.target.value)}
                        className="w-full text-right bg-emerald-50/40 border border-amber-200 px-1 py-0.5 rounded text-[11px] font-bold outline-none text-emerald-950 font-mono"
                      />
                    ) : (
                      row.valProf2.toLocaleString("en-IN")
                    )}
                  </td>
                  
                  {/* Remaining Mudi + Profit */}
                  <td className="py-3 px-3 text-right font-mono font-black border-r border-amber-200/30 text-emerald-950 bg-emerald-50/5">
                    {row.remMudiProfit.toLocaleString("en-IN")}
                  </td>

                  {/* Year 2 stock holding (Auto calculated from IPO database) */}
                  <td className="py-3 px-3 text-right font-mono border-r border-amber-200/30 text-amber-800 bg-amber-50/15">
                    <span className="flex items-center justify-end gap-0.5 text-amber-700">
                      <Sparkles className="size-2.5 text-amber-400 shrink-0 print:hidden" />
                      <span>{Math.round(row.valHold).toLocaleString("en-IN")}</span>
                    </span>
                  </td>

                  {/* Gopi Mandal */}
                  <td className="py-2 px-3 text-right font-mono border-r border-amber-200/30 text-violet-900">
                    {isEditing ? (
                      <input
                        type="number"
                        value={row.valGopi || ""}
                        onChange={(e) => handleCellChange(idx, 'root', 'gopiMandal', e.target.value)}
                        className="w-full text-right bg-violet-50/40 border border-amber-200 px-1 py-0.5 rounded text-[11px] font-bold outline-none text-violet-950 font-mono"
                      />
                    ) : (
                      row.valGopi.toLocaleString("en-IN")
                    )}
                  </td>

                  {/* Member Net Share (Final Share) */}
                  <td className="py-3.5 px-4 text-right font-mono font-extrabold bg-amber-50/30 text-amber-950 text-xs md:text-sm print:text-[10px] print:bg-slate-100">
                    ₹{Math.round(row.netPayout).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}

              {/* Connected Vertical Footer Summary Row */}
              <tr className="bg-amber-100/50 border-t-2 border-amber-200/90 font-extrabold text-amber-950 text-right select-none print:bg-slate-200 print:text-[9px]">
                <td className="py-4 px-3 border-r border-amber-200/40 text-center" colSpan={2}>કુલ (Total)</td>
                
                {/* Capital Totals */}
                <td className="py-4 px-3 border-r border-amber-100 font-mono">{totalCap1.toLocaleString("en-IN")}</td>
                <td className="py-4 px-3 border-r border-amber-100 font-mono">{totalCap2.toLocaleString("en-IN")}</td>
                <td className="py-4 px-3 border-r border-amber-200/40 font-mono font-black bg-amber-50/20">{totalMudiCol.toLocaleString("en-IN")}</td>
                
                {/* Expense Totals */}
                <td className="py-4 px-3 border-r border-amber-100 font-mono text-red-950">{totalExp1.toLocaleString("en-IN")}</td>
                <td className="py-4 px-3 border-r border-amber-100 font-mono text-red-950">{totalExp2.toLocaleString("en-IN")}</td>
                <td className="py-4 px-3 border-r border-amber-200/40 font-mono font-black text-amber-950 bg-red-50/10">{totalRemMudiCol.toLocaleString("en-IN")}</td>
                
                {/* Profit Totals */}
                <td className="py-4 px-3 border-r border-amber-100 font-mono text-emerald-950">{totalProf1.toLocaleString("en-IN")}</td>
                <td className="py-4 px-3 border-r border-amber-100 font-mono text-emerald-950">{totalProf2.toLocaleString("en-IN")}</td>
                <td className="py-4 px-3 border-r border-amber-200/40 font-mono font-black text-emerald-950 bg-emerald-50/10">{totalRemMudiProfitCol.toLocaleString("en-IN")}</td>
                
                {/* Holding Total */}
                <td className="py-4 px-3 border-r border-amber-200/40 font-mono text-amber-900 bg-amber-50/10">{Math.round(totalHoldingCol).toLocaleString("en-IN")}</td>
                
                {/* Gopi Mandal Total */}
                <td className="py-4 px-3 border-r border-amber-200/40 font-mono text-violet-950">{totalGopiMandal.toLocaleString("en-IN")}</td>
                
                {/* Net Payout Total */}
                <td className="py-4 px-4 font-mono font-black bg-amber-100/50 text-amber-950 text-xs md:text-sm print:text-[10px] print:bg-slate-300">
                  ₹{Math.round(totalNetPayout).toLocaleString("en-IN")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
