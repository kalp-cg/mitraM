import { useState } from "react";
import { Member, FINANCIAL_YEARS, SystemAudit, IpoSummary, IpoTrade } from "../types";
import { Users2, Landmark, ReceiptText, FileSpreadsheet, Eye, BarChart3, TrendingUp } from "lucide-react";

interface DashboardProps {
  members: Member[];
  searchTerm: string;
  recentLogs?: SystemAudit[];
  currentYear?: string;
  onSelectMember: (id: string) => void;
  onNavigate: (tab: 'members' | 'master_summary' | 'profit' | 'reports' | 'ipo') => void;
  ipoSummary?: IpoSummary;
  ipoTrades?: IpoTrade[];
}

export default function Dashboard({ members, searchTerm, recentLogs = [], currentYear, onSelectMember, onNavigate, ipoSummary, ipoTrades = [] }: DashboardProps) {
  const [memberFilter, setMemberFilter] = useState<'all' | 'due' | 'high_capital'>('all');

  const yearKeys = FINANCIAL_YEARS.map(y => y.id);
  const cy = currentYear || 'year2026';
  const holdingKey = `holding${cy.replace("year", "")}`;

  // Filter members on search term + quick filters
  let finalMembers = members.filter(
    (m) =>
      m.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nameGu.includes(searchTerm)
  );

  if (memberFilter === 'due') {
    finalMembers = finalMembers.filter((m) => (m[holdingKey] || 0) > 0);
  } else if (memberFilter === 'high_capital') {
    finalMembers = finalMembers.filter((m) => {
      const tot = yearKeys.reduce((sum, key) => sum + (m[key]?.capital || 0), 0);
      return tot >= 250000;
    });
  }

  // Dynamic status calculations
  const totalMembersCount = members.filter((m) => m.status === "ACTIVE").length;

  // Sum capital across all configured years
  const totalCapitalAllYears = members.reduce(
    (sum, m) => sum + yearKeys.reduce((mSum, key) => mSum + (m[key]?.capital || 0), 0),
    0
  );

  // Sum expense across all configured years
  const totalExpenseAllYears = members.reduce(
    (sum, m) => sum + yearKeys.reduce((mSum, key) => mSum + (m[key]?.expense || 0), 0),
    0
  );

  // Compute percent change vs previous year (if present)
  const cyIndex = FINANCIAL_YEARS.findIndex(y => y.id === cy);
  const prevYearId = cyIndex > 0 ? FINANCIAL_YEARS[cyIndex - 1].id : null;
  const totalCapCurrent = members.reduce((sum, m) => sum + (m[cy]?.capital || 0), 0);
  const totalCapPrev = prevYearId ? members.reduce((sum, m) => sum + (m[prevYearId]?.capital || 0), 0) : 0;
  const pctChange = totalCapPrev === 0 ? (totalCapCurrent === 0 ? 0 : 100) : Math.round(((totalCapCurrent - totalCapPrev) / Math.abs(totalCapPrev)) * 100);
  // Compute year-specific IPO adjustments for Available Capital (Mudi) card
  const cyTrades = (ipoTrades || []).filter(t => t.year === cy);
  const cyActiveInvested = cyTrades.filter(t => t.status === 'holding').reduce((s, t) => s + ((t.buyPrice || 0) * (t.quantity || 1)), 0);
  const cyRealizedProfitLoss = cyTrades.filter(t => t.status === 'sold').reduce((s, t) => s + (((t.sellPrice || 0) - (t.buyPrice || 0)) * (t.quantity || 1)), 0);

  return (
    <div className="space-y-8 select-none font-sans">
      {/* Dynamic Welcome Heading */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 rounded-2xl border border-amber-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-amber-950">નમસ્તે, પ્રણામ! 🙏</h2>
          <p className="text-amber-800 text-sm mt-1">તમારા ચોપડાના વાર્ષિક ખાતા અને સભ્યોના હિસાબનું સંચાન અહીંથી કરો.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl shadow-sm border border-amber-100 italic text-amber-800 font-serif text-sm">
          🏮 "શુભ લાભ અને અનંત સહકાર"
        </div>
      </div>

      {/* KPI Stats Panel - Matches Reference Image 1 exactly */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI Card 1: Total Members */}
        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-blue-500 border border-amber-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <div className="absolute top-2 right-2 text-blue-100 font-bold font-mono text-7xl select-none opacity-40">
            {String(totalMembersCount).padStart(2, "0")}
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-900/60 font-medium text-sm">કુલ સભ્યો</p>
              <h3 className="text-4xl font-bold text-amber-950 mt-2 font-mono">
                {String(totalMembersCount).padStart(2, "0")}
              </h3>
              <p className="text-xs text-blue-600 font-semibold mt-2.5 flex items-center gap-1">
                <span>●</span> સક્રિય અને કાર્યરત સભ્યો
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
              <Users2 className="size-6 stroke-[2px]" />
            </div>
          </div>
        </div>

        {/* KPI Card 2: Total Deposits */}
        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-emerald-500 border border-amber-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <div className="absolute top-2 right-2 text-emerald-100 font-bold font-mono text-5xl select-none opacity-30 mt-2">
            મુડી
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-900/60 font-medium text-sm">કુલ જમા રકમ (તમામ વર્ષ)</p>
              <h3 className="text-3xl font-extrabold text-amber-950 mt-2.5 font-sans tracking-tight">
                ₹ {totalCapitalAllYears.toLocaleString("en-IN")}
              </h3>
              <p className="text-xs text-emerald-600 font-semibold mt-3 flex items-center gap-1">
                <span>📈</span> ગયા વર્ષ કરતા {pctChange}% બદલાવ
              </p>
              {ipoSummary && ipoSummary.activeInvested > 0 && (
                <p className="text-[10px] text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md w-fit mt-2">
                  <span>📦</span> ₹{ipoSummary.activeInvested.toLocaleString("en-IN")} શેર હોલ્ડિંગમાં રોકાયેલ
                </p>
              )}
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 animate-pulse">
              <Landmark className="size-6 stroke-[2px]" />
            </div>
          </div>
        </div>

        {/* KPI Card 3: Total Expenses */}
        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-orange-500 border border-amber-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <div className="absolute top-2 right-2 text-orange-100 font-bold font-mono text-5xl select-none opacity-30 mt-2">
            ખર્ચ
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-900/60 font-medium text-sm">કુલ ખર્ચ (તમામ વર્ષ)</p>
              <h3 className="text-3xl font-extrabold text-orange-700 mt-2.5 font-sans tracking-tight">
                ₹ {totalExpenseAllYears.toLocaleString("en-IN")}
              </h3>
              <p className="text-xs text-orange-600 font-semibold mt-3 flex items-center gap-1">
                <span>▣</span> જમા સામે નોંધાયેલ કુલ ખર્ચ
              </p>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl text-orange-700">
              <ReceiptText className="size-6 stroke-[2px]" />
            </div>
          </div>
        </div>
      </div>

      {/* IPO P&L KPI Card */}
      {ipoSummary && (
        <div
          onClick={() => onNavigate('ipo')}
          className="bg-white p-6 rounded-2xl border border-amber-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] cursor-pointer hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="absolute top-2 right-2 text-violet-100 font-bold font-mono text-5xl select-none opacity-30 mt-2">
            IPO
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-900/60 font-medium text-sm">શેર / IPO P&L</p>
              <h3 className={`text-3xl font-extrabold mt-2.5 font-sans tracking-tight ${(ipoSummary.totalProfitLoss || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}>
                {(ipoSummary.totalProfitLoss || 0) >= 0 ? '+' : ''}₹ {(ipoSummary.totalProfitLoss || 0).toLocaleString("en-IN")}
              </h3>
              <p className="text-xs text-violet-600 font-semibold mt-3 flex items-center gap-1">
                <span>📊</span> {ipoSummary.activeCount || 0} સક્રિય હોલ્ડિંગ • {ipoSummary.totalTrades || 0} કુલ ટ્રેડ્સ
              </p>
            </div>
            <div className="bg-violet-50 p-3 rounded-xl text-violet-600">
              <BarChart3 className="size-6 stroke-[2px]" />
            </div>
          </div>
        </div>
      )}

      {/* Members Section Grid Layout - Matches image cards structure */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-100 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
            <h3 className="text-lg font-bold text-amber-950">સભ્યોની સૂચિ પત્રક</h3>
          </div>

          {/* STATEFUL CATEGORY FILTERS */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMemberFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${memberFilter === 'all'
                  ? 'bg-brand-orange text-white border-brand-orange'
                  : 'bg-white text-amber-900 border-amber-100 hover:bg-brand-cream'
                }`}
            >
              બધા સભ્યો ({members.length})
            </button>
            <button
              onClick={() => setMemberFilter('due')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${memberFilter === 'due'
                  ? 'bg-[#991B1B] text-white border-[#991B1B]'
                  : 'bg-white text-red-700 border-red-100 hover:bg-red-50/50'
                }`}
            >
              બાકી હોલ્ડિંગ વાળા ({members.filter(m => (m[holdingKey] || 0) > 0).length})
            </button>
            <button
              onClick={() => setMemberFilter('high_capital')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${memberFilter === 'high_capital'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white text-emerald-800 border-emerald-100 hover:bg-emerald-50/50'
                }`}
            >
              મોટી મુડી રોકાણકાર ({members.filter(m => yearKeys.reduce((s, k) => s + (m[k]?.capital || 0), 0) >= 250000).length})
            </button>
          </div>

          <button
            onClick={() => onNavigate("members")}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            બધા સભ્યોની વિગત જુઓ →
          </button>
        </div>

        {finalMembers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-amber-50">
            <p className="text-amber-900/50 font-medium">કોઈ સભ્ય ફિલ્ટર શરુઆતમાં મળ્યા નથી! અક્ષર સુધારો.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finalMembers.map((member) => {
              const memberTotalCapital = yearKeys.reduce((sum, key) => sum + (member[key]?.capital || 0), 0);
              return (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.015)] hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {/* Header Profile Line inside Card */}
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={member.imageUrl}
                        alt={member.nameEn}
                        referrerPolicy="no-referrer"
                        className="size-16 rounded-xl object-cover border-2 border-amber-100 shadow-sm"
                      />
                      <div>
                        <h4 className="text-base font-bold text-amber-900 group-hover:text-amber-950 transition-colors">
                          {member.nameGu}
                        </h4>
                        <p className="text-[11px] font-mono text-amber-900/40 font-semibold tracking-wider uppercase mt-0.5">
                          {member.nameEn}
                        </p>
                        <span className="inline-flex mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100">
                          સક્રિય (ACTIVE)
                        </span>
                      </div>
                    </div>

                    {/* Financial Stats Column on individual card */}
                    <div className="mt-5 pt-4 border-t border-amber-50 space-y-2.5 text-xs">
                      <div className="flex justify-between items-center bg-amber-50/20 p-2 rounded-lg">
                        <span className="text-amber-800 font-medium">કુલ યોગદાન (મુડી):</span>
                        <span className="font-bold text-amber-950 font-mono">
                          ₹ {memberTotalCapital.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-red-50/10 p-2 rounded-lg">
                        <span className="text-amber-800 font-medium">અંતિમ બાકી (હોલ્ડિંગ):</span>
                        {(() => {
                          const autoHolding = (member[cy]?.capital || 0) - (member[cy]?.expense || 0);
                          return (
                            <span className={`font-bold ${autoHolding > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                              ₹ {autoHolding.toLocaleString("en-IN")}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Card Action footer button */}
                  <div className="px-6 pb-6 pt-0">
                    <button
                      onClick={() => onSelectMember(member.id)}
                      className="w-full bg-white border border-amber-200 text-amber-900 hover:bg-amber-50 hover:text-amber-950 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="size-4 shrink-0" />
                      <span>વિગતો જુઓ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Grid for Navigation & Audit Trail - High Reliability & Ease of Use */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Main Core Navigation Short-links Bento */}
        <div className="lg:col-span-7 bg-[#FFFDF5] rounded-2xl border border-amber-100/70 p-6 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-amber-950 text-base mb-4 flex items-center gap-1.5">
              <span>⚙️</span> ઝડપી નેવિગેશન કંટ્રોલ
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => onNavigate("master_summary")}
                className="p-4 bg-white hover:bg-orange-50/50 rounded-xl border border-amber-100 text-left transition-all cursor-pointer shadow-sm group"
              >
                <div className="size-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-3">
                  <FileSpreadsheet className="size-5" />
                </div>
                <h5 className="font-bold text-amber-950 text-sm group-hover:text-orange-700">મુખ્ય હિસાબ પત્રક</h5>
                <p className="text-xs text-amber-700 mt-1">માસ્ટર સમરી શિડ્યુલ જુઓ અને ફેરફાર કરો.</p>
              </button>

              <button
                onClick={() => onNavigate("profit")}
                className="p-4 bg-white hover:bg-amber-50/50 rounded-xl border border-amber-100 text-left transition-all cursor-pointer shadow-sm group"
              >
                <div className="size-10 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center mb-3">
                  🏢
                </div>
                <h5 className="font-bold text-amber-950 text-sm group-hover:text-amber-800">સભ્ય ભાગ વિતરણ પત્રક</h5>
                <p className="text-xs text-amber-700 mt-1">બધા સભ્યોની નફો, હોલ્ડિંગ હિસાબ ગણતરી.</p>
              </button>

              <button
                onClick={() => onNavigate("reports")}
                className="p-4 bg-white hover:bg-emerald-50/20 rounded-xl border border-amber-100 text-left transition-all cursor-pointer shadow-sm group"
              >
                <div className="size-10 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center mb-3">
                  📊
                </div>
                <h5 className="font-bold text-amber-950 text-sm group-hover:text-emerald-800">પ્રિન્ટ કરો અને રીપોર્ટ</h5>
                <p className="text-xs text-amber-700 mt-1">વાર્ષિક એકંદર અહેવાલ ડાઉનલોડ.</p>
              </button>

              <button
                onClick={() => onNavigate("ipo")}
                className="p-4 bg-white hover:bg-violet-50/30 rounded-xl border border-amber-100 text-left transition-all cursor-pointer shadow-sm group"
              >
                <div className="size-10 bg-violet-50 text-violet-700 rounded-lg flex items-center justify-center mb-3">
                  <BarChart3 className="size-5" />
                </div>
                <h5 className="font-bold text-amber-950 text-sm group-hover:text-violet-800">શેર / IPO ટ્રેડિંગ</h5>
                <p className="text-xs text-amber-700 mt-1">IPO રોકાણ, ખરીદી-વેચાણ P&L ગણતરી.</p>
              </button>
            </div>
          </div>
        </div>

        {/* Live Audit Log Ledger Timeline - matches Design Principle of Premium Utility */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-amber-100 p-6 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-amber-950 text-base mb-4 flex items-center gap-2">
              <span>📜</span> ચોપડા સુધારણા નોંધણી લૉગ્સ (Audit Trail)
            </h4>

            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
              {recentLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-amber-900/40">
                  હજુ સુધી કોઈ સુધારા લૉગ્સ ઉપલબ્ધ નથી.
                </div>
              ) : (
                recentLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex gap-3 text flex-col border-b border-amber-50 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-amber-900/40 uppercase tracking-widest font-mono">
                      <span>👤 {log.user}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-brand-soil font-medium font-sans leading-normal">
                      🛡️ {log.actionGu}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-amber-50 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
            <span>લાઇવ રિયલ-ટાઇમ રક્ષિત ચોપડા હિસાબ ઓડિટ સિંકિંગ કાર્યરત છે.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
