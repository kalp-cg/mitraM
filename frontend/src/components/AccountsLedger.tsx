import { useState } from "react";
import { LedgerTransaction } from "../types";
import { Landmark, Search, PlusCircle, ArrowUpRight, ArrowDownRight, Wallet, Printer, FileSpreadsheet, Trash2 } from "lucide-react";

interface AccountsLedgerProps {
  targetAccounts: string[];
  transactions: LedgerTransaction[];
}

export default function AccountsLedger({ targetAccounts, transactions = [] }: AccountsLedgerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  // Extract all unique account names from both presets and actual transactions
  const allAccountNames = Array.from(
    new Set([
      ...targetAccounts,
      ...transactions.map(t => t.targetAccount).filter(Boolean)
    ])
  );

  // Filter accounts based on search query
  const filteredAccounts = allAccountNames.filter(acc => 
    acc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Auto-calculate dynamic balances and counts from transactions
  const getAccountData = (accName: string) => {
    const accTxs = transactions.filter(t => t.targetAccount === accName);
    
    // Balance = Capital + Profit - Expense
    const balance = accTxs.reduce((sum, t) => {
      if (t.type === "capital" || t.type === "profit") {
        return sum + (t.amount || 0);
      } else if (t.type === "expense") {
        return sum - (t.amount || 0);
      }
      return sum;
    }, 0);

    const inflows = accTxs.filter(t => t.type === "capital" || t.type === "profit").length;
    const outflows = accTxs.filter(t => t.type === "expense").length;

    return {
      balance,
      inflows,
      outflows,
      totalCount: accTxs.length,
      txs: accTxs
    };
  };

  // If no account is explicitly selected, default to the first one in the list
  const activeAccount = selectedAccount || (filteredAccounts.length > 0 ? filteredAccounts[0] : null);
  const activeAccountData = activeAccount ? getAccountData(activeAccount) : null;

  // Calculate overall metrics
  const totalAvailableAcrossAll = allAccountNames.reduce((sum, name) => sum + getAccountData(name).balance, 0);

  // Helper for type labels and colors
  const getTypeBadge = (type: 'capital' | 'expense' | 'profit') => {
    switch (type) {
      case 'capital':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <ArrowUpRight className="size-3" /> મૂડી જમા
          </span>
        );
      case 'profit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
            <ArrowUpRight className="size-3" /> નફો વિતરણ
          </span>
        );
      case 'expense':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
            <ArrowDownRight className="size-3" /> ખર્ચ બાદબાકી
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 font-sans select-none print:space-y-0">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-amber-100 pb-3 print:hidden">
        <div>
          <h3 className="text-xl font-extrabold text-amber-950 flex items-center gap-2">
            <Landmark className="size-6 text-brand-orange" />
            વ્યવહાર ખાતા રજીસ્ટર (Accounts Ledger)
          </h3>
          <p className="text-xs text-amber-700/80 mt-1">
            પિતૃ પક્ષ, NILAM SBI, NEELAN ABI વગેરે ખાતાવાર ઉપલબ્ધ બેલેન્સ અને વ્યવહાર પત્રક
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <Printer className="size-4" />
          <span>ખાતાવહી પ્રિન્ટ</span>
        </button>
      </div>

      {/* Global Summary & Search Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 print:hidden">
        {/* Total funds held across all target accounts */}
        <div className="bg-gradient-to-r from-brand-soil to-amber-900 text-white p-5 rounded-2xl border border-amber-850 shadow-md flex items-center gap-4">
          <div className="size-11 rounded-xl bg-white/10 flex items-center justify-center text-lg shadow-inner">🏦</div>
          <div>
            <span className="text-[10px] text-white/60 block font-bold uppercase tracking-wider">તમામ ખાતાઓનું કુલ સંયુક્ત બેલેન્સ</span>
            <span className="text-xl font-extrabold font-mono text-brand-orange-100">
              ₹ {totalAvailableAcrossAll.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Total Active accounts count */}
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex items-center gap-4">
          <div className="size-11 rounded-xl bg-amber-50 text-brand-orange flex items-center justify-center text-lg font-bold">💳</div>
          <div>
            <span className="text-[10px] text-amber-900/50 block font-bold uppercase tracking-wider">કુલ સક્રિય વ્યવહાર ખાતાઓ</span>
            <span className="text-xl font-extrabold font-mono text-amber-950">
              {allAccountNames.length} સક્રિય ખાતા
            </span>
          </div>
        </div>

        {/* Search bar inside summary section */}
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex items-center px-4.5">
          <Search className="size-4.5 text-amber-900/40 mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="ખાતાનું નામ શોધો (e.g. NILAM SBI)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none text-xs font-bold text-amber-950 placeholder-amber-900/30 outline-none"
          />
        </div>
      </div>

      {/* Main Grid: Accounts Cards on Left, Statement/Sub-ledger on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Gilded Accounts Cards List */}
        <div className="lg:col-span-4 space-y-4 print:hidden">
          <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5 px-1">
            <span>💳</span> ખાતાની યાદી (Select to view Ledger)
          </span>

          <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredAccounts.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-amber-100 text-amber-900/40 text-xs font-medium">
                કોઈ વ્યવહાર ખાતું મળ્યું નથી.
              </div>
            ) : (
              filteredAccounts.map(accName => {
                const { balance, totalCount } = getAccountData(accName);
                const isActive = activeAccount === accName;
                
                return (
                  <div
                    key={accName}
                    onClick={() => setSelectedAccount(accName)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all relative overflow-hidden select-none ${
                      isActive
                        ? "bg-gradient-to-br from-brand-lightcream to-brand-wheat border-brand-orange shadow-md"
                        : "bg-white border-amber-100 hover:bg-brand-cream/40"
                    }`}
                  >
                    {/* Background bank watermark */}
                    <div className="absolute -bottom-4 -right-4 text-amber-900/5 text-7xl font-bold opacity-30 select-none">
                      🏦
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="space-y-3">
                        <span className="text-xs font-extrabold text-amber-950 block tracking-tight truncate w-44">{accName}</span>
                        <div>
                          <span className="text-[9px] text-amber-900/50 block font-bold uppercase">ઉપલબ્ધ બેલેન્સ</span>
                          <span className={`text-base font-extrabold font-mono ${balance >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                            ₹ {balance.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`p-2 rounded-xl text-xs font-extrabold ${
                        isActive ? "bg-brand-orange text-white" : "bg-amber-50 text-amber-900/60"
                      }`}>
                        {totalCount} વ્યવહાર
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Statement Ledger (વ્યવહાર પત્રક) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.01)] print:border-none print:shadow-none">
            {/* Header Panel */}
            <div className="p-5 border-b border-amber-50 bg-[#FFFDF5]/50 flex justify-between items-center print:border-b-2 print:pb-2">
              <span className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                📊 વ્યવહાર ખાતાવહી પત્રક: <span className="text-brand-orange">{activeAccount || "અજ્ઞાત"}</span>
              </span>
              {activeAccountData && (
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                  બેલેન્સ: ₹{activeAccountData.balance.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* Sub Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto text-xs md:text-sm">
                <thead>
                  <tr className="bg-amber-100/50 border-b border-amber-200/50 text-[11px] md:text-xs font-bold text-amber-950 print:bg-slate-100">
                    <th className="py-3 px-4 border-r border-amber-200/50 w-10 text-center">#</th>
                    <th className="py-3 px-4 border-r border-amber-100 text-center w-28">તારીખ</th>
                    <th className="py-3 px-4 border-r border-amber-100 w-36">સભ્ય નામ / વિગત</th>
                    <th className="py-3 px-4 border-r border-amber-100 text-center w-28">પ્રકાર</th>
                    <th className="py-3 px-4 border-r border-amber-100 text-right w-28">રકમ (₹)</th>
                    <th className="py-3 px-4">નોંધ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 text-xs font-sans font-semibold text-amber-950">
                  {!activeAccountData || activeAccountData.txs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-amber-900/40 font-medium">
                        <div className="flex flex-col items-center gap-2">
                          <Wallet className="size-8 text-amber-300" />
                          <span>આ ખાતામાં હજુ સુધી કોઈ વ્યવહારો નોંધાયા નથી.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    activeAccountData.txs.map((tx, idx) => (
                      <tr key={tx.id} className="hover:bg-amber-50/10 transition-colors">
                        {/* Index */}
                        <td className="py-3 px-4 font-mono text-amber-700 border-r border-amber-100/50 text-center">{idx + 1}</td>
                        
                        {/* Date */}
                        <td className="py-3 px-4 text-center font-mono border-r border-amber-100/50">{tx.date}</td>
                        
                        {/* Member Name */}
                        <td className="py-3 px-4 border-r border-amber-100/50">
                          <div className="font-extrabold text-amber-950">{tx.memberName}</div>
                        </td>
                        
                        {/* Type Badge */}
                        <td className="py-3 px-4 text-center border-r border-amber-100/50">
                          {getTypeBadge(tx.type)}
                        </td>
                        
                        {/* Amount */}
                        <td className={`py-3 px-4 text-right font-mono font-bold border-r border-amber-100/50 text-xs md:text-sm ${
                          tx.type === "expense" ? "text-rose-700" : "text-emerald-700"
                        }`}>
                          {tx.type === "expense" ? "-" : "+"}₹{tx.amount.toLocaleString("en-IN")}
                        </td>

                        {/* Notes */}
                        <td className="py-3 px-4 text-amber-900/80 text-[11px] truncate max-w-xs" title={tx.notes}>
                          {tx.notes || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Sub Ledger Footer Summary */}
            {activeAccountData && activeAccountData.txs.length > 0 && (
              <div className="p-4.5 bg-amber-50/30 border-t border-amber-100 flex justify-between items-center text-xs font-extrabold text-amber-950 select-none print:bg-slate-200">
                <span className="text-[10px] text-amber-900/60 font-bold uppercase tracking-wider">
                  ખાતાવહી સારાંશ: {activeAccountData.inflows} આવક • {activeAccountData.outflows} જાવક
                </span>
                <span className="text-amber-950">
                  આ ખાતાનું કુલ બેલેન્સ: <span className={`font-mono text-sm font-black ${activeAccountData.balance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    ₹ {activeAccountData.balance.toLocaleString("en-IN")}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
