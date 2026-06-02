import { useState } from "react";
import { Member, FINANCIAL_YEARS } from "../types";
import { ArrowLeft, Save, FileEdit } from "lucide-react";

interface MembersProps {
  members: Member[];
  onSaveMembers: (updated: Member[]) => void;
  selectedMemberId: string | null;
  onClearSelection: () => void;
}

interface MembersPropsExtended extends MembersProps {
  currentYear?: string;
}

export default function Members({ members, onSaveMembers, selectedMemberId, onClearSelection, currentYear }: MembersPropsExtended) {
  const [editingId, setEditingId] = useState<string | null>(selectedMemberId);
  const [activeMemberData, setActiveMemberData] = useState<Member | null>(
    selectedMemberId ? members.find((m) => m.id === selectedMemberId) || null : null
  );

  // Year to actively view/edit on the selected member
  const [selectedEditYear, setSelectedEditYear] = useState(currentYear || "year2026");

  const handleSelectMember = (member: Member) => {
    setEditingId(member.id);
    setActiveMemberData(JSON.parse(JSON.stringify(member))); // deep clone
  };

  const handleFieldChange = (section: string, field: string, value: number | string) => {
    if (!activeMemberData) return;
    
    const clone = { ...activeMemberData };
    if (section === 'root') {
      (clone as any)[field] = value;
    } else {
      if (!clone[section]) {
        clone[section] = { capital: 0, expense: 0, profit: 0 };
      }
      (clone[section] as any)[field] = value;
    }
    setActiveMemberData(clone);
  };

  const handleSaveLocal = () => {
    if (!activeMemberData) return;
    const updatedMembersList = members.map((m) =>
      m.id === activeMemberData.id ? activeMemberData : m
    );
    onSaveMembers(updatedMembersList);
    setEditingId(null);
    setActiveMemberData(null);
    onClearSelection();
  };

  const currentActive = editingId ? activeMemberData : null;

  return (
    <div className="space-y-6 select-none font-sans">
      {/* If currently viewing or editing a specific member */}
      {currentActive ? (
        <div className="bg-white rounded-2xl border border-amber-100 p-6 md:p-8 space-y-8 shadow-[0_4px_30px_rgba(0,0,0,0.01)] animate-fade-in">
          {/* Header Action Row */}
          <div className="flex flex-wrap items-center justify-between border-b border-amber-50 pb-4 gap-4">
            <button
              onClick={() => {
                setEditingId(null);
                setActiveMemberData(null);
                onClearSelection();
              }}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-xl flex items-center gap-2 font-semibold text-xs md:text-sm cursor-pointer border border-amber-100 transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span>યાદી પર પાછા જાઓ</span>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg">ID: {currentActive.id}</span>
              <button
                onClick={handleSaveLocal}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-md text-white font-bold rounded-xl flex items-center gap-2 text-xs md:text-sm cursor-pointer shadow-sm active:scale-95 transition-transform"
              >
                <Save className="size-4" />
                <span>ફેરફારો સેવ કરો</span>
              </button>
            </div>
          </div>

          {/* Member Profile Card Summary Details */}
          <div className="flex flex-col md:flex-row items-center gap-6 bg-gradient-to-r from-amber-50/20 via-transparent to-transparent p-4 rounded-xl border border-dotted border-amber-200">
            <img
              src={currentActive.imageUrl}
              alt={currentActive.nameEn}
              className="size-24 rounded-2xl object-cover border-4 border-amber-100 shadow-md"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-4 w-full md:w-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-amber-950/50 mb-1">સભ્ય નામ (ગુજરાતીમાં)</label>
                  <input
                    type="text"
                    value={currentActive.nameGu}
                    onChange={(e) => handleFieldChange('root', 'nameGu', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm text-amber-950 font-bold focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-950/50 mb-1">સભ્ય નામ (ENGLISH)</label>
                  <input
                    type="text"
                    value={currentActive.nameEn}
                    onChange={(e) => handleFieldChange('root', 'nameEn', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm text-amber-950 font-medium focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Year Selector & Interactive Form Box */}
          <div className="bg-amber-50/15 rounded-2xl p-6 border border-amber-100 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-amber-100 pb-3">
              <h4 className="text-base font-bold text-amber-950 flex items-center gap-1.5">
                <span>📅</span> નાણાકીય વર્ષ ચોપડા વિગત (Financial Records)
              </h4>
              
              <div className="flex items-center gap-2 bg-white border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-950">
                <span>ચોપડા વર્ષ પસંદ કરો:</span>
                <select
                  value={selectedEditYear}
                  onChange={(e) => setSelectedEditYear(e.target.value)}
                  className="bg-transparent outline-none border-none cursor-pointer pr-2 text-brand-orange font-bold text-xs"
                >
                  {FINANCIAL_YEARS.map(y => (
                    <option key={y.id} value={y.id}>{y.labelGu}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-amber-900/70 mb-1.5">મુડી યોગદાન (Capital Contribution)</label>
                <input
                  type="number"
                  value={currentActive[selectedEditYear]?.capital || 0}
                  onChange={(e) => handleFieldChange(selectedEditYear, 'capital', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-amber-950 text-sm font-bold focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900/70 mb-1.5">ચૂકવેલા ખર્ચ (Expense Deductions)</label>
                <input
                  type="number"
                  value={currentActive[selectedEditYear]?.expense || 0}
                  onChange={(e) => handleFieldChange(selectedEditYear, 'expense', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-amber-950 text-sm font-bold focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900/70 mb-1.5">ચૂકવેલ નફો (Profit Earned & Disbursed)</label>
                <input
                  type="number"
                  value={currentActive[selectedEditYear]?.profit || 0}
                  onChange={(e) => handleFieldChange(selectedEditYear, 'profit', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-amber-950 text-sm font-bold focus:border-orange-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Additional Holdings, Gopi Mandal, notes sheet */}
          <div className="bg-amber-50/5 rounded-2xl p-6 border border-amber-100 space-y-5">
            <h4 className="text-base font-bold text-amber-950 border-b border-amber-100 pb-2">સ્થિર હોલ્ડિંગ અને સામાજિક વિગત (Holdings & Other Funds)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-amber-900/70 mb-1.5">હોલ્ડિંગ (Final Outstanding Dues)</label>
                <input
                  type="number"
                  value={currentActive[`holding${(selectedEditYear || currentYear || 'year2026').replace('year','')}`] || 0}
                  onChange={(e) => handleFieldChange('root', `holding${(selectedEditYear || currentYear || 'year2026').replace('year','')}`, parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-amber-950 text-sm font-bold focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900/70 mb-1.5">ગોપી મંડળ વિગત (Gopi Mandal Dues)</label>
                <input
                  type="number"
                  value={currentActive.gopiMandal || 0}
                  onChange={(e) => handleFieldChange('root', 'gopiMandal', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-amber-950 text-sm font-bold focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900/70 mb-1.5">કરોડ/શેષ અને નોંધ (Auditor's Remarks)</label>
                <input
                  type="text"
                  value={currentActive.notes || ""}
                  onChange={(e) => handleFieldChange('root', 'notes', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-amber-950 text-sm font-medium focus:border-orange-500"
                  placeholder="નોંધ ઉમેરો..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setEditingId(null);
                setActiveMemberData(null);
                onClearSelection();
              }}
              className="px-6 py-3 bg-white border border-amber-200 text-amber-950 font-semibold rounded-xl text-xs md:text-sm cursor-pointer hover:bg-amber-50"
            >
              รદ કરો
            </button>
            <button
              onClick={handleSaveLocal}
              className="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs md:text-sm flex items-center gap-2 cursor-pointer shadow-md transition-colors"
            >
              <Save className="size-4.5" />
              <span>ડેટા સેવ કરી સિંક કરો</span>
            </button>
          </div>
        </div>
      ) : (
        /* Members Master Grid list screen view */
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
              <h3 className="text-xl font-extrabold text-amber-950">સભ્યોની વાર્ષિક ખાતાવહી ડાયરી</h3>
              <p className="text-xs text-amber-700/80 mt-1">બધા સભ્યોના વાર્ષિક મુડી, ખર્ચ અને સંચિત નફાની વિગતો અહીં જોઈ શકાય છે.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
            <div className="p-6 border-b border-amber-50 flex items-center gap-2">
              <span className="text-lg">📋</span>
              <span className="font-bold text-amber-950 text-sm">કુલ સભ્યો પત્રકો ({members.length})</span>
            </div>
            
            <div className="divide-y divide-amber-50">
              {members.map((member, index) => {
                const yearKeys = FINANCIAL_YEARS.map(y => y.id);
                const totalCap = yearKeys.reduce((sum, key) => sum + (member[key]?.capital || 0), 0);
                const totalExp = yearKeys.reduce((sum, key) => sum + (member[key]?.expense || 0), 0);
                const totalProf = yearKeys.reduce((sum, key) => sum + (member[key]?.profit || 0), 0);

                return (
                  <div
                    key={member.id}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-amber-50/15 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[#D97706] font-bold font-mono text-sm">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <img
                        src={member.imageUrl}
                        alt={member.nameEn}
                        className="size-14 rounded-xl object-cover border border-amber-100"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-base font-extrabold text-amber-950">{member.nameGu}</h4>
                        <p className="text-xs font-semibold text-amber-900/40 uppercase tracking-widest mt-0.5 font-mono">{member.nameEn}</p>
                        {member.notes && (
                          <span className="inline-block text-[11px] text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md mt-1.5 font-medium">
                            📝 {member.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Compact stats overview of column values */}
                    <div className="grid grid-cols-3 gap-6 text-center max-w-sm md:ml-auto w-full md:w-auto">
                      <div className="bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/30">
                        <span className="block text-[10px] text-amber-900/50 font-bold mb-1">કુલ મુડી</span>
                        <span className="font-extrabold text-xs md:text-sm text-amber-950 font-mono">
                          ₹{totalCap.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="bg-red-50/20 p-2.5 rounded-xl border border-red-100/30">
                        <span className="block text-[10px] text-amber-900/50 font-bold mb-1">કુલ ખર્ચ</span>
                        <span className="font-extrabold text-xs md:text-sm text-red-900 font-mono">
                          ₹{totalExp.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="bg-emerald-50/25 p-2.5 rounded-xl border border-emerald-100/30">
                        <span className="block text-[10px] text-amber-900/50 font-bold mb-1">કુલ નફો</span>
                        <span className="font-extrabold text-xs md:text-sm text-emerald-900 font-mono">
                          ₹{totalProf.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectMember(member)}
                      className="px-4 py-2.5 bg-amber-100 hover:bg-orange-600 hover:text-white text-amber-900 font-bold rounded-xl text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 shrink-0 select-none cursor-pointer"
                    >
                      <FileEdit className="size-4" />
                      <span>ખાતું સુધારો</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
