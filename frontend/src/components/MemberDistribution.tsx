import { useState } from "react";
import { Member, FINANCIAL_YEARS } from "../types";
import { Check, Edit2, Printer, Sparkles } from "lucide-react";

interface MemberDistributionProps {
  members: Member[];
  onSaveMembers: (updated: Member[]) => void;
  currentYear?: string;
}

export default function MemberDistribution({ members, onSaveMembers, currentYear }: MemberDistributionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMembers, setEditedMembers] = useState<Member[]>([]);

  // State for single active year selection
  const [selectedYear, setSelectedYear] = useState(currentYear || "year2026");

  const yearConfig = FINANCIAL_YEARS.find(y => y.id === selectedYear) || FINANCIAL_YEARS[1];
  const yearKey = yearConfig.id; // e.g. "year2024"
  const holdingKey = `holding${yearKey.replace("year", "")}`; // e.g. "holding2024"

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

      // Deep clone the member object to prevent nested mutation
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

  // Auto-calculate holdings: Capital - Expense for each member (remaining in mandal pool)
  const getAutoHolding = (m: Member) => {
    const capVal = m[yearKey]?.capital || 0;
    const expVal = m[yearKey]?.expense || 0;
    return capVal - expVal; // Remaining amount held in the mandal
  };

  // Year-wise sums
  const totalCap = currentMembers.reduce((sum, m) => sum + (m[yearKey]?.capital || 0), 0);
  const totalExp = currentMembers.reduce((sum, m) => sum + (m[yearKey]?.expense || 0), 0);
  const totalProf = currentMembers.reduce((sum, m) => sum + (m[yearKey]?.profit || 0), 0);
  const totalHoldings = currentMembers.reduce((sum, m) => sum + getAutoHolding(m), 0);
  const totalGopiMandal = currentMembers.reduce((sum, m) => sum + (m.gopiMandal || 0), 0);

  // Grand total sum: Cap - Exp + Prof - Holding + Gopi
  const globalGrandTotalOfShare = currentMembers.reduce((sum, m) => {
    const capVal = m[yearKey]?.capital || 0;
    const expVal = m[yearKey]?.expense || 0;
    const profVal = m[yearKey]?.profit || 0;
    const holdVal = getAutoHolding(m);
    const gopiVal = m.gopiMandal || 0;
    const share = capVal - expVal + profVal - holdVal + gopiVal;
    return sum + share;
  }, 0);

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Table header menu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-amber-100 pb-3">
        <div>
          <h3 className="text-xl font-extrabold text-amber-950">સભ્ય વિતરણ પત્રક (Table 2)</h3>
          <p className="text-xs text-amber-700/80 mt-1">સભ્ય વાઇઝ મુડી યોગદાન, ખર્ચ બાદબાકી, નફો, હોલ્ડિંગ અને વાસ્તવિક ભાગની ગણતરી</p>
        </div>

        <div className="flex items-center gap-2 self-end w-full sm:w-auto">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
            >
              <Check className="size-4" />
              <span>ડેટા સેવ કરો</span>
            </button>
          ) : (
            <button
              onClick={startEditing}
              className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm select-none shadow-orange-100"
            >
              <Edit2 className="size-4" />
              <span>કોષ્ટક સુધારો (Edit Cells)</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md select-none whitespace-nowrap"
          >
            <Printer className="size-4" />
            <span>પીડીએફ એક્સપોર્ટ</span>
          </button>
        </div>
      </div>

      {/* Mini overview cards for bottom of table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-lg">💡</div>
          <div>
            <span className="text-[10px] text-amber-900/50 block font-bold uppercase tracking-wider">કુલ રોકાણ મુડી ({yearConfig.labelEn})</span>
            <span className="text-lg md:text-xl font-extrabold text-amber-950 font-mono">
              ₹ {totalCap.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold text-lg">💸</div>
          <div>
            <span className="text-[10px] text-amber-900/50 block font-bold uppercase tracking-wider">વાર્ષિક કુલ ખર્ચ ({yearConfig.labelEn})</span>
            <span className="text-lg md:text-xl font-extrabold text-red-950 font-mono">
              ₹ {totalExp.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-lg">💰</div>
          <div>
            <span className="text-[10px] text-amber-900/50 block font-bold uppercase tracking-wider">ચોખ્ખો નફો ({yearConfig.labelEn})</span>
            <span className="text-lg md:text-xl font-extrabold text-emerald-900 font-mono">
              ₹ {totalProf.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Wide horizontal scrollable spreadsheet container */}
      <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.01)] flex flex-col">
        {/* Table Title Panel */}
        <div className="p-5 border-b border-amber-50 bg-[#FFFDF5]/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <span className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
            <span>📝</span> સભ્ય વિતરણ ગણતરી પત્રક
          </span>
          
          {/* Comparative Year Selection Dropdown (Only 1 active year selector) */}
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              <span className="text-[10px] font-bold text-amber-900/60 uppercase">નાણાકીય વર્ષ પસંદ કરો:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-amber-950 pr-4 outline-none cursor-pointer"
              >
                {FINANCIAL_YEARS.map(y => (
                  <option key={y.id} value={y.id}>{y.labelEn}</option>
                ))}
              </select>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold text-amber-700/60 bg-amber-100 px-2 py-0.5 rounded-md">હસ્તાંતરણ ફોર્મેટ</span>
        </div>

        <div className="overflow-x-auto">
          {/* Custom structured table */}
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              {/* Simplified 1-Row Table Header */}
              <tr className="bg-amber-100/50 border-b border-amber-200/50 text-[11px] md:text-xs font-bold text-amber-950">
                <th className="py-4 px-6 border-r border-amber-200/50 w-44">સભ્ય નામ</th>
                <th className="py-4 px-5 text-right border-r border-amber-100">મુડી (Capital)</th>
                <th className="py-4 px-5 text-right border-r border-amber-100">ખર્ચ (Expense)</th>
                <th className="py-4 px-5 text-right border-r border-amber-100">નફો (Profit)</th>
                <th className="py-4 px-5 text-right border-r border-amber-100">
                  <span className="flex items-center justify-end gap-1">
                    <Sparkles className="size-3 text-amber-500" />
                    હોલ્ડિંગ (Auto)
                  </span>
                </th>
                <th className="py-4 px-5 text-right border-r border-amber-200/50">ગોપી મંડળ</th>
                <th className="py-4 px-6 text-right font-extrabold bg-[#FFF9E6]">કુલ ભાગ (Total Share)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 text-xs md:text-sm font-sans font-semibold text-amber-950">
              {currentMembers.map((m, idx) => {
                const valCap = m[yearKey]?.capital || 0;
                const valExp = m[yearKey]?.expense || 0;
                const valProf = m[yearKey]?.profit || 0;
                const valHold = getAutoHolding(m);
                const valGopi = m.gopiMandal || 0;
                
                // Calculate member grand share: Capital - Expense + Profit - Holding + Gopi
                const mShare = valCap - valExp + valProf - valHold + valGopi;

                return (
                  <tr key={m.id} className="hover:bg-amber-50/10">
                    {/* Member photo and name */}
                    <td className="py-3.5 px-6 font-extrabold text-amber-950 border-r border-amber-100 bg-[#FFFDF7]/60">
                      <div className="flex items-center gap-2">
                        <img src={m.imageUrl} alt={m.nameEn} className="size-7 rounded-md object-cover inline-block" referrerPolicy="no-referrer" />
                        <span>{m.nameGu}</span>
                      </div>
                    </td>

                    {/* Capital Cell */}
                    <td className="py-3 px-5 text-right font-mono border-r border-amber-100/50">
                      {isEditing ? (
                        <input
                          type="number"
                          value={valCap}
                          onChange={(e) => handleCellChange(idx, yearKey, 'capital', e.target.value)}
                          className="w-24 text-right bg-amber-50/80 border border-amber-200 p-1 rounded text-xs font-bold"
                        />
                      ) : (
                        `₹${valCap.toLocaleString("en-IN")}`
                      )}
                    </td>

                    {/* Expense Cell */}
                    <td className="py-3 px-5 text-right font-mono border-r border-amber-100/50 text-red-950">
                      {isEditing ? (
                        <input
                          type="number"
                          value={valExp}
                          onChange={(e) => handleCellChange(idx, yearKey, 'expense', e.target.value)}
                          className="w-24 text-right bg-amber-50/80 border border-amber-200 p-1 rounded text-xs font-bold"
                        />
                      ) : (
                        `₹${valExp.toLocaleString("en-IN")}`
                      )}
                    </td>

                    {/* Profit Cell */}
                    <td className="py-3 px-5 text-right font-mono border-r border-amber-100/50 text-emerald-950">
                      {isEditing ? (
                        <input
                          type="number"
                          value={valProf}
                          onChange={(e) => handleCellChange(idx, yearKey, 'profit', e.target.value)}
                          className="w-24 text-right bg-amber-50/80 border border-amber-200 p-1 rounded text-xs font-bold"
                        />
                      ) : (
                        `₹${valProf.toLocaleString("en-IN")}`
                      )}
                    </td>

                    {/* Holdings Cell - AUTO CALCULATED (Read Only) */}
                    <td className="py-3 px-5 text-right font-mono border-r border-amber-100/50 text-amber-700 bg-amber-50/20">
                      <span className="flex items-center justify-end gap-1">
                        <Sparkles className="size-3 text-amber-400 shrink-0" />
                        ₹{valHold.toLocaleString("en-IN")}
                      </span>
                    </td>

                    {/* Gopi Mandal Cell */}
                    <td className="py-3 px-5 text-right font-mono border-r border-amber-200/50">
                      {isEditing ? (
                        <input
                          type="number"
                          value={valGopi}
                          onChange={(e) => handleCellChange(idx, 'root', 'gopiMandal', e.target.value)}
                          className="w-24 text-right bg-amber-50/80 border border-amber-200 p-1 rounded text-xs font-bold"
                        />
                      ) : (
                        `₹${valGopi.toLocaleString("en-IN")}`
                      )}
                    </td>

                    {/* Member Grand Share Cell */}
                    <td className="py-3.5 px-6 text-right font-mono font-extrabold bg-[#FFFDF0] text-amber-950 text-sm">
                      ₹{mShare.toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}

              {/* Total Summary Row */}
              <tr className="bg-amber-50/35 border-t border-amber-200 font-extrabold text-amber-950">
                <td className="py-4 px-6 border-r border-amber-100">સરવાળો (Total Sum)</td>
                <td className="py-4 px-5 text-right font-mono border-r border-amber-100/50">₹{totalCap.toLocaleString("en-IN")}</td>
                <td className="py-4 px-5 text-right font-mono border-r border-amber-100/50 text-red-950">₹{totalExp.toLocaleString("en-IN")}</td>
                <td className="py-4 px-5 text-right font-mono border-r border-amber-100/50 text-emerald-950">₹{totalProf.toLocaleString("en-IN")}</td>
                <td className="py-4 px-5 text-right font-mono border-r border-amber-100/50 text-red-700">₹{totalHoldings.toLocaleString("en-IN")}</td>
                <td className="py-4 px-5 text-right font-mono border-r border-amber-200/50">₹{totalGopiMandal.toLocaleString("en-IN")}</td>
                <td className="py-4 px-6 text-right font-mono bg-[#FFF9E6] text-amber-900 text-sm">₹{globalGrandTotalOfShare.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
