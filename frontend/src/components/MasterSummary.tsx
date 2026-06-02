import { useState } from "react";
import { MasterRow, FINANCIAL_YEARS } from "../types";
import { Printer, Edit, Check } from "lucide-react";

interface MasterSummaryProps {
  masterRows: MasterRow[];
  onSaveMasterRows: (updated: MasterRow[]) => void;
  currentYear?: string;
}

export default function MasterSummary({ masterRows, onSaveMasterRows }: MasterSummaryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRows, setEditedRows] = useState<MasterRow[]>([]);
  
  // State for single active year selection
  const [selectedYear, setSelectedYear] = useState("year2026");

  const yearConfig = FINANCIAL_YEARS.find(y => y.id === selectedYear) || FINANCIAL_YEARS[1];
  const yearKey = yearConfig.masterKey; // e.g. "year24"

  const startEditing = () => {
    setEditedRows(JSON.parse(JSON.stringify(masterRows)));
    setIsEditing(true);
  };

  const handleCellChange = (rowIndex: number, yearKey: string, val: string) => {
    const clone = [...editedRows];
    clone[rowIndex] = {
      ...clone[rowIndex],
      [yearKey]: parseFloat(val) || 0,
    };
    setEditedRows(clone);
  };

  const handleSave = () => {
    // Recalculate computed fields
    let updated = [...editedRows];
    
    // Find Income and Pending Expense row indices
    const incomeIdx = updated.findIndex(r => r.id === "mr1");
    const expenseIdx = updated.findIndex(r => r.id === "mr2");
    const remainingIdx = updated.findIndex(r => r.id === "mr3");
    const profitIdx = updated.findIndex(r => r.id === "mr4");
    const holdingIdx = updated.findIndex(r => r.id === "mr5");
    const gopiIdx = updated.findIndex(r => r.id === "mr6");
    const grandIdx = updated.findIndex(r => r.id === "mr7");

    // Recalculate computed rows across all years
    FINANCIAL_YEARS.forEach((yf) => {
      const col = yf.masterKey;
      if (incomeIdx !== -1 && expenseIdx !== -1 && remainingIdx !== -1) {
        updated[remainingIdx][col] = (updated[incomeIdx][col] || 0) - (updated[expenseIdx][col] || 0);
      }
      if (grandIdx !== -1) {
        updated[grandIdx][col] = 
          (updated[remainingIdx]?.[col] || 0) + 
          (updated[profitIdx]?.[col] || 0) - 
          (updated[holdingIdx]?.[col] || 0) + 
          (updated[gopiIdx]?.[col] || 0);
      }
    });

    onSaveMasterRows(updated);
    setIsEditing(false);
  };

  const currentRows = isEditing ? editedRows : masterRows;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Top action cards matches reference Image 2 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-amber-100 pb-3">
        <div>
          <h3 className="text-xl font-extrabold text-amber-950">માસ્ટર સમરી ટેબલ (Table 1)</h3>
          <p className="text-xs text-amber-700/80 mt-1">નાણાકીય વર્ષ ૨૦૨૩, ૨૦૨૪ અને ૨૦૨૫ નો એકંદર અહેવાલ અને ખાતાવહી પત્રક</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto self-end">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
            >
              <Check className="size-4" />
              <span>સેવ કરો (Save)</span>
            </button>
          ) : (
            <button
              onClick={startEditing}
              className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-200 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
            >
              <Edit className="size-4" />
              <span>આંકડા સુધારો</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm select-none whitespace-nowrap"
          >
            <Printer className="size-4" />
            <span>પ્રિન્ટ કરો (Print Summary)</span>
          </button>
        </div>
      </div>

      {/* Dynamic Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-1">
        {masterRows.map((row) => {
          if (row.id === "mr1" || row.id === "mr4" || row.id === "mr2" || row.id === "mr5") {
            const isLoss = row.id === "mr2";
            return (
              <div key={row.id} className="bg-white p-4 rounded-xl border border-amber-100/70 shadow-sm relative overflow-hidden">
                <span className="text-[10px] text-amber-900/50 block font-bold">
                  {row.titleGu} ({yearConfig.labelGu.replace("વર્ષ ", "")})
                </span>
                <span className={`text-lg md:text-xl font-extrabold mt-1 block font-mono ${isLoss ? "text-red-700" : "text-amber-950"}`}>
                  ₹{(row[yearKey] || 0).toLocaleString("en-IN")}
                </span>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Main Beautiful Table Container */}
      <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.015)] print:shadow-none print:border-none">
        {/* Table Title Head */}
        <div className="bg-amber-50/25 p-5 border-b border-amber-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:bg-transparent">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span className="font-extrabold text-amber-950 text-sm">મુખ્ય સારાંશ પત્રક (Master Account Summary)</span>
          </div>
          
          {/* Comparative Year Selection Dropdown (Only 1 active year) */}
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

          <span className="text-[11px] font-semibold text-amber-900/40 font-mono">અપડેટ: ૨૦૨૬</span>
        </div>

        {/* Traditional Responsive Table Layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50/40 text-[11px] md:text-xs font-bold text-amber-950 border-b border-amber-100/70">
                <th className="py-4 px-6 text-center w-16">ક્રમ</th>
                <th className="py-4 px-6">વિગત (Particulars)</th>
                <th className="py-4 px-6 text-right">વર્ષ {yearConfig.labelEn} ની રકમ (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/60 text-sm font-sans">
              {currentRows.map((row, idx) => {
                const val = row[yearKey] || 0;
                const isCalculated = row.isCalculated;

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors group ${
                      isCalculated
                        ? "bg-amber-50/15 font-bold"
                        : "hover:bg-amber-50/10"
                    }`}
                  >
                    <td className="py-4 px-6 text-center text-xs font-mono text-amber-900/40 font-semibold">
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td className="py-4 px-6 font-semibold text-amber-950 flex items-center gap-2.5">
                      <span className="text-orange-600 text-[10px] group-hover:scale-125 transition-transform">✦</span>
                      <span>{row.titleGu}</span>
                    </td>
                    
                    {/* Selected Year Volume Edit */}
                    <td className="py-3 px-6 text-right font-mono text-amber-950 font-semibold">
                      {isEditing && !isCalculated ? (
                        <input
                          type="number"
                          value={val}
                          onChange={(e) => handleCellChange(idx, yearKey, e.target.value)}
                          className="w-28 text-right bg-amber-50 border border-amber-300 rounded px-2 py-1 focus:ring-1 focus:ring-orange-500 font-mono text-xs font-bold"
                        />
                      ) : (
                        `₹ ${val.toLocaleString("en-IN")}`
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Verification Traditional Sign Block */}
        <div className="p-8 border-t border-amber-100 bg-[#FFFDF5]/40 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:bg-transparent print:border-amber-200">
          <div className="space-y-2 border-2 border-dashed border-amber-200/50 p-4 rounded-xl bg-white max-w-sm">
            <h5 className="text-xs font-extrabold text-amber-950 flex items-center gap-1">
              <span>✍️</span> ખરાઈ કરનારની સહી:
            </h5>
            <div className="h-10 border-b border-amber-200 w-48 mt-2" />
            <p className="text-xs text-amber-700/80 font-semibold italic mt-1">હિસાબનીશ (Accountant Seal)</p>
          </div>

          <div className="text-right text-xs text-amber-700 space-y-1 font-mono md:self-end">
            <p className="font-semibold">શુભ વ્યાપાર ડિજિટલ પ્લેટફોર્મ દ્વારા જનરેટ કરેલ</p>
            <p>તારીખ: {new Date().toLocaleDateString("gu-IN")} | સમય: {new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
