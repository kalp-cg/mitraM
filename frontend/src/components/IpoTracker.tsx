import React, { useState } from "react";
import { IpoTrade, IpoSummary, FINANCIAL_YEARS } from "../types";
import { Plus, TrendingUp, TrendingDown, Package, DollarSign, X, Edit2, Trash2, Check, BarChart3 } from "lucide-react";

interface IpoTrackerProps {
  ipoTrades: IpoTrade[];
  ipoSummary: IpoSummary;
  onAddTrade: (trade: Omit<IpoTrade, 'id' | 'profitLoss'>) => void;
  onUpdateTrade: (id: string, updates: Partial<IpoTrade>) => void;
  onDeleteTrade: (id: string) => void;
  currentYear?: string;
}

export default function IpoTracker({ ipoTrades, ipoSummary, onAddTrade, onUpdateTrade, onDeleteTrade, currentYear }: IpoTrackerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellTradeId, setSellTradeId] = useState<string | null>(null);
  const [sellPrice, setSellPrice] = useState("");
  const [sellDate, setSellDate] = useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localD = new Date(d.getTime() - (offset * 60 * 1000));
    return localD.toISOString().split("T")[0];
  });

  const [filter, setFilter] = useState<'all' | 'holding' | 'sold'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  // Form state for adding new trade
  const [formShareName, setFormShareName] = useState("");
  const [formBuyDate, setFormBuyDate] = useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localD = new Date(d.getTime() - (offset * 60 * 1000));
    return localD.toISOString().split("T")[0];
  });
  const [formBuyPrice, setFormBuyPrice] = useState("");
  const [formQuantity, setFormQuantity] = useState("1");
  const [formDematAccount, setFormDematAccount] = useState("NILAM SBI");
  const [formYear, setFormYear] = useState(currentYear || "year2026");
  const [formNotes, setFormNotes] = useState("");

  // Filtered trades
  let filteredTrades = [...ipoTrades];
  if (filter === 'holding') filteredTrades = filteredTrades.filter(t => t.status === 'holding');
  if (filter === 'sold') filteredTrades = filteredTrades.filter(t => t.status === 'sold');
  if (yearFilter !== 'all') filteredTrades = filteredTrades.filter(t => t.year === yearFilter);

  // Running balance
  let runningBalance = 0;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const buyPriceNum = parseFloat(formBuyPrice) || 0;
    const qtyNum = parseInt(formQuantity) || 1;

    onAddTrade({
      shareName: formShareName,
      buyDate: formBuyDate,
      buyPrice: buyPriceNum,
      sellPrice: 0,
      quantity: qtyNum,
      dematAccount: formDematAccount,
      status: 'holding',
      notes: formNotes,
      year: formYear,
    });

    // Reset form
    setFormShareName("");
    setFormBuyPrice("");
    setFormQuantity("1");
    setFormNotes("");
    setShowAddModal(false);
  };

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellTradeId) return;
    const sellPriceNum = parseFloat(sellPrice) || 0;

    onUpdateTrade(sellTradeId, {
      sellPrice: sellPriceNum,
      sellDate: sellDate,
      status: 'sold',
    });

    setSellTradeId(null);
    setSellPrice("");
    setShowSellModal(false);
  };

  const openSellModal = (trade: IpoTrade) => {
    setSellTradeId(trade.id);
    setSellPrice("");
    setShowSellModal(true);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-amber-100 pb-4">
        <div>
          <h3 className="text-xl font-extrabold text-amber-950 flex items-center gap-2">
            <BarChart3 className="size-6 text-brand-orange" />
            IPO / શેર ટ્રેડિંગ ટ્રેકર
          </h3>
          <p className="text-xs text-amber-700/80 mt-1">શેર ખરીદી-વેચાણ, IPO રોકાણ, અને P&L ગણતરી</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-brand-orange to-brand-saffron text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="size-4 stroke-[3px]" />
          <span>નવો ટ્રેડ ઉમેરો</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Invested */}
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <div className="absolute -top-2 -right-2 text-blue-50 text-7xl font-bold opacity-30 select-none">₹</div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-amber-900/60 font-medium text-[11px] uppercase tracking-wider">કુલ રોકાણ</p>
              <h3 className="text-2xl font-extrabold text-amber-950 mt-1.5 font-mono">
                ₹{(ipoSummary.totalInvested || 0).toLocaleString("en-IN")}
              </h3>
              <p className="text-[10px] font-semibold text-blue-600 mt-1.5 flex items-center gap-1">
                <Package className="size-3" /> {ipoSummary.totalTrades || 0} કુલ ટ્રેડ્સ
              </p>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
              <DollarSign className="size-5" />
            </div>
          </div>
        </div>

        {/* Active Holdings */}
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <div className="absolute -top-2 -right-2 text-amber-50 text-6xl font-bold opacity-40 select-none">📦</div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-amber-900/60 font-medium text-[11px] uppercase tracking-wider">સક્રિય હોલ્ડિંગ</p>
              <h3 className="text-2xl font-extrabold text-amber-950 mt-1.5 font-mono">
                ₹{(ipoSummary.activeInvested || 0).toLocaleString("en-IN")}
              </h3>
              <p className="text-[10px] font-semibold text-amber-700 mt-1.5 flex items-center gap-1">
                <Package className="size-3" /> {ipoSummary.activeCount || 0} શેર હોલ્ડિંગ
              </p>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-700">
              <Package className="size-5" />
            </div>
          </div>
        </div>

        {/* Total P&L */}
        <div className={`bg-white p-5 rounded-2xl border shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden ${
          (ipoSummary.totalProfitLoss || 0) >= 0 ? 'border-emerald-100' : 'border-red-100'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-amber-900/60 font-medium text-[11px] uppercase tracking-wider">કુલ P&L (વેચાયેલ)</p>
              <h3 className={`text-2xl font-extrabold mt-1.5 font-mono ${
                (ipoSummary.totalProfitLoss || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'
              }`}>
                {(ipoSummary.totalProfitLoss || 0) >= 0 ? '+' : ''}₹{(ipoSummary.totalProfitLoss || 0).toLocaleString("en-IN")}
              </h3>
              <p className={`text-[10px] font-semibold mt-1.5 flex items-center gap-1 ${
                (ipoSummary.totalProfitLoss || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {(ipoSummary.totalProfitLoss || 0) >= 0
                  ? <><TrendingUp className="size-3" /> નફો (Profit)</>
                  : <><TrendingDown className="size-3" /> નુકસાન (Loss)</>
                }
              </p>
            </div>
            <div className={`p-2.5 rounded-xl ${
              (ipoSummary.totalProfitLoss || 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {(ipoSummary.totalProfitLoss || 0) >= 0 ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
            </div>
          </div>
        </div>

        {/* Sold Count */}
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-amber-900/60 font-medium text-[11px] uppercase tracking-wider">વેચાયેલ ટ્રેડ્સ</p>
              <h3 className="text-2xl font-extrabold text-amber-950 mt-1.5 font-mono">
                {ipoTrades.filter(t => t.status === 'sold').length}
              </h3>
              <p className="text-[10px] font-semibold text-violet-600 mt-1.5 flex items-center gap-1">
                <Check className="size-3" /> સંપૂર્ણ ટ્રેડ (Completed)
              </p>
            </div>
            <div className="bg-violet-50 p-2.5 rounded-xl text-violet-600">
              <Check className="size-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          {(['all', 'holding', 'sold'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                filter === f
                  ? f === 'holding' ? 'bg-amber-700 text-white border-amber-700'
                    : f === 'sold' ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-brand-orange text-white border-brand-orange'
                  : 'bg-white text-amber-900 border-amber-100 hover:bg-brand-cream'
              }`}
            >
              {f === 'all' ? `બધા (${ipoTrades.length})`
                : f === 'holding' ? `હોલ્ડિંગ (${ipoTrades.filter(t => t.status === 'holding').length})`
                : `વેચાયેલ (${ipoTrades.filter(t => t.status === 'sold').length})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
          <span className="text-[10px] font-bold text-amber-900/60 uppercase">વર્ષ:</span>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-amber-950 pr-4 outline-none cursor-pointer"
          >
            <option value="all">બધા વર્ષ</option>
            {FINANCIAL_YEARS.map(y => (
              <option key={y.id} value={y.id}>{y.labelEn}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.01)]">
        <div className="p-5 border-b border-amber-50 bg-[#FFFDF5]/50 flex justify-between items-center">
          <span className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
            📊 IPO / શેર ટ્રેડ લેજર
          </span>
          <span className="text-[10px] font-mono font-bold text-amber-700/60 bg-amber-100 px-2 py-0.5 rounded-md">
            {filteredTrades.length} એન્ટ્રી
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-amber-100/50 border-b border-amber-200/50 text-[11px] md:text-xs font-bold text-amber-950">
                <th className="py-3.5 px-4 border-r border-amber-200/50 w-10">#</th>
                <th className="py-3.5 px-4 border-r border-amber-100">શેર નામ</th>
                <th className="py-3.5 px-4 text-right border-r border-amber-100">ખરીદ તારીખ</th>
                <th className="py-3.5 px-4 text-right border-r border-amber-100">ખરીદ ભાવ (₹)</th>
                <th className="py-3.5 px-4 text-right border-r border-amber-100">Qty</th>
                <th className="py-3.5 px-4 text-right border-r border-amber-100">વેચાણ તારીખ</th>
                <th className="py-3.5 px-4 text-right border-r border-amber-100">વેચાણ ભાવ (₹)</th>
                <th className="py-3.5 px-4 text-right border-r border-amber-100">P&L (₹)</th>
                <th className="py-3.5 px-4 text-center border-r border-amber-100">સ્ટેટસ</th>
                <th className="py-3.5 px-4 text-right border-r border-amber-100">ચાલુ બેલેન્સ</th>
                <th className="py-3.5 px-4 text-center">ક્રિયા</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 text-xs md:text-sm font-sans font-semibold text-amber-950">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-amber-900/40 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <BarChart3 className="size-8 text-amber-300" />
                      <span>હજુ સુધી કોઈ IPO ટ્રેડ નથી. ઉપર "નવો ટ્રેડ ઉમેરો" બટન દબાવો.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade, idx) => {
                  const totalBuy = (trade.buyPrice || 0) * (trade.quantity || 1);
                  const totalSell = (trade.sellPrice || 0) * (trade.quantity || 1);
                  
                  runningBalance += totalBuy;
                  if (trade.status === 'sold') {
                    runningBalance -= totalBuy;
                    runningBalance += totalSell;
                  }

                  const pl = trade.status === 'sold' ? (totalSell - totalBuy) : 0;

                  return (
                    <tr key={trade.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-amber-700 border-r border-amber-100/50">{idx + 1}</td>
                      <td className="py-3 px-4 border-r border-amber-100/50">
                        <div className="font-extrabold text-amber-950">{trade.shareName}</div>
                        {trade.dematAccount && (
                          <div className="text-[10px] text-amber-600 font-medium mt-0.5">{trade.dematAccount}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono border-r border-amber-100/50">{formatDate(trade.buyDate)}</td>
                      <td className="py-3 px-4 text-right font-mono border-r border-amber-100/50">
                        <div className="font-extrabold">₹{(trade.buyPrice || 0).toLocaleString("en-IN")}</div>
                        <div className="text-[10px] text-amber-600/80 font-bold">કુલ: ₹{totalBuy.toLocaleString("en-IN")}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono border-r border-amber-100/50">{trade.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono border-r border-amber-100/50">
                        {trade.status === 'sold' ? formatDate(trade.sellDate) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono border-r border-amber-100/50">
                        {trade.status === 'sold' ? (
                          <>
                            <div className="font-extrabold">₹{(trade.sellPrice || 0).toLocaleString("en-IN")}</div>
                            <div className="text-[10px] text-emerald-600/80 font-bold">કુલ: ₹{totalSell.toLocaleString("en-IN")}</div>
                          </>
                        ) : '—'}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-extrabold border-r border-amber-100/50 ${
                        trade.status !== 'sold' ? 'text-amber-500' : pl >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {trade.status !== 'sold' ? '—' : (
                          <>{pl >= 0 ? '+' : ''}₹{pl.toLocaleString("en-IN")}</>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center border-r border-amber-100/50">
                        {trade.status === 'holding' ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            📦 Holding
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ✅ Sold
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono border-r border-amber-100/50 text-amber-800">
                        ₹{runningBalance.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {trade.status === 'holding' && (
                            <button
                              onClick={() => openSellModal(trade)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg cursor-pointer transition-colors"
                              title="વેચો (Sell)"
                            >
                              <TrendingUp className="size-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm('શું તમે આ ટ્રેડ કાઢી નાખવા માંગો છો?')) {
                                onDeleteTrade(trade.id);
                              }
                            }}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer transition-colors"
                            title="કાઢી નાખો (Delete)"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Totals Row */}
              {filteredTrades.length > 0 && (
                <tr className="bg-amber-50/35 border-t-2 border-amber-200 font-extrabold text-amber-950">
                  <td className="py-4 px-4 border-r border-amber-100" colSpan={3}>સરવાળો (Total)</td>
                  <td className="py-4 px-4 text-right font-mono border-r border-amber-100">
                    ₹{filteredTrades.reduce((s, t) => s + ((t.buyPrice || 0) * (t.quantity || 1)), 0).toLocaleString("en-IN")}
                  </td>
                  <td className="py-4 px-4 text-right font-mono border-r border-amber-100">
                    {filteredTrades.reduce((s, t) => s + (t.quantity || 0), 0)}
                  </td>
                  <td className="py-4 px-4 border-r border-amber-100"></td>
                  <td className="py-4 px-4 text-right font-mono border-r border-amber-100">
                    ₹{filteredTrades.filter(t => t.status === 'sold').reduce((s, t) => s + ((t.sellPrice || 0) * (t.quantity || 1)), 0).toLocaleString("en-IN")}
                  </td>
                  <td className={`py-4 px-4 text-right font-mono border-r border-amber-100 ${
                    filteredTrades.filter(t => t.status === 'sold').reduce((s, t) => s + (t.profitLoss || ((t.sellPrice - t.buyPrice) * t.quantity)), 0) >= 0
                      ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {(() => {
                      const totalPL = filteredTrades.filter(t => t.status === 'sold').reduce((s, t) => s + ((t.sellPrice - t.buyPrice) * t.quantity), 0);
                      return `${totalPL >= 0 ? '+' : ''}₹${totalPL.toLocaleString("en-IN")}`;
                    })()}
                  </td>
                  <td className="py-4 px-4 border-r border-amber-100" colSpan={2}></td>
                  <td className="py-4 px-4"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== ADD TRADE MODAL ===== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-brand-border max-w-lg w-full shadow-2xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-brand-orange to-brand-saffron p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-5" />
                <h3 className="font-bold text-sm md:text-base">નવો IPO / શેર ટ્રેડ ઉમેરો</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white hover:text-brand-lightcream font-bold text-lg cursor-pointer">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {/* Share Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-brand-soil">શેર / IPO નામ *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CUPID STOCK, CDSL, PREMIER ENG..."
                  value={formShareName}
                  onChange={(e) => setFormShareName(e.target.value)}
                  className="w-full bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                />
              </div>

              {/* Buy Date & Year */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-soil">ખરીદ તારીખ *</label>
                  <input
                    type="date"
                    required
                    value={formBuyDate}
                    onChange={(e) => setFormBuyDate(e.target.value)}
                    className="w-full bg-brand-cream border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-soil font-bold outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-soil">નાણાકીય વર્ષ</label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                  >
                    {FINANCIAL_YEARS.map(y => (
                      <option key={y.id} value={y.id}>{y.labelEn}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Buy Price & Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-soil">ખરીદ ભાવ (એક શેરનો ભાવ) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="એક શેરનો ખરીદ ભાવ"
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(e.target.value)}
                    className="w-full bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-soil">Quantity (જથ્થો)</label>
                  <input
                    type="number"
                    min="1"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                  />
                </div>
              </div>

              {/* Dynamic Live Multiplication Helper */}
              {formBuyPrice && (
                <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-amber-950 uppercase tracking-wider">સ્વયં-સંચાલિત ગણતરી (Auto-Calculated Total):</p>
                  <p className="text-xs font-extrabold text-amber-900 mt-1">
                    ₹{(parseFloat(formBuyPrice) || 0).toLocaleString("en-IN")} × {parseInt(formQuantity) || 1} = <span className="text-sm text-brand-orange font-mono font-black">₹{((parseFloat(formBuyPrice) || 0) * (parseInt(formQuantity) || 1)).toLocaleString("en-IN")}</span>
                  </p>
                </div>
              )}

              {/* Quick Price Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { l: "+₹15k", v: 15000 },
                  { l: "+₹30k", v: 30000 },
                  { l: "+₹50k", v: 50000 },
                  { l: "+₹1L", v: 100000 },
                  { l: "+₹2L", v: 200000 },
                ].map((chip) => (
                  <button
                    key={chip.l}
                    type="button"
                    onClick={() => {
                      const curr = parseFloat(formBuyPrice) || 0;
                      setFormBuyPrice(String(curr + chip.v));
                    }}
                    className="text-[10px] font-bold bg-brand-lightcream border border-brand-border/60 hover:border-brand-orange hover:bg-brand-wheat text-brand-soil px-2 py-1 rounded transition-colors cursor-pointer"
                  >
                    {chip.l}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFormBuyPrice("")}
                  className="text-[10px] font-bold bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 px-2 py-1 rounded transition-colors cursor-pointer"
                >
                  સાફ (Clear)
                </button>
              </div>

              {/* Demat Account */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-brand-soil">ડિમેટ એકાઉન્ટ</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. NILAM SBI"
                    value={formDematAccount}
                    onChange={(e) => setFormDematAccount(e.target.value)}
                    className="flex-1 bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                  />
                  <select
                    onChange={(e) => { if (e.target.value) setFormDematAccount(e.target.value); }}
                    value=""
                    className="bg-brand-wheat border border-brand-border rounded-xl px-2 py-1 text-[11px] font-bold text-brand-soil cursor-pointer outline-none"
                  >
                    <option value="">-- પસંદ --</option>
                    <option value="NILAM SBI">NILAM SBI</option>
                    <option value="JAINAM AC">JAINAM AC</option>
                    <option value="NILAM AC">NILAM AC</option>
                    <option value="ANGEL ONE">ANGEL ONE</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-brand-soil">નોંધ (Optional)</label>
                <input
                  type="text"
                  placeholder="વધારાની નોંધ..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-white border border-brand-border text-brand-soil font-bold py-2.5 rounded-xl text-xs hover:bg-brand-lightcream cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-brand-orange to-brand-saffron text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="size-3.5" />
                  <span>ટ્રેડ ઉમેરો</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== SELL MODAL ===== */}
      {showSellModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-brand-border max-w-sm w-full shadow-2xl overflow-hidden font-sans">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5" />
                <h3 className="font-bold text-sm">શેર વેચો (Sell)</h3>
              </div>
              <button onClick={() => setShowSellModal(false)} className="text-white hover:text-emerald-100 font-bold text-lg cursor-pointer">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSellSubmit} className="p-6 space-y-4">
              {/* Show trade info */}
              {sellTradeId && (() => {
                const t = ipoTrades.find(x => x.id === sellTradeId);
                return t ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
                    <p className="font-extrabold text-amber-950">{t.shareName}</p>
                    <p className="text-amber-700">ખરીદ ભાવ: ₹{(t.buyPrice || 0).toLocaleString("en-IN")} | Qty: {t.quantity}</p>
                  </div>
                ) : null;
              })()}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-brand-soil">વેચાણ ભાવ (એક શેરનો ભાવ) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="એક શેરનો વેચાણ ભાવ"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="w-full bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-brand-soil">વેચાણ તારીખ *</label>
                <input
                  type="date"
                  required
                  value={sellDate}
                  onChange={(e) => setSellDate(e.target.value)}
                  className="w-full bg-brand-cream border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-soil font-bold outline-none"
                />
              </div>

              {/* Live P&L Preview */}
              {sellPrice && sellTradeId && (() => {
                const t = ipoTrades.find(x => x.id === sellTradeId);
                if (!t) return null;
                const totalBuy = (t.buyPrice || 0) * (t.quantity || 1);
                const totalSell = (parseFloat(sellPrice) || 0) * (t.quantity || 1);
                const pl = totalSell - totalBuy;
                return (
                  <div className={`rounded-xl p-3 text-center space-y-1 border ${pl >= 0 ? 'bg-emerald-50/70 border-emerald-200/50' : 'bg-red-50/70 border-red-200/50'}`}>
                    <p className="text-[10px] font-bold text-amber-950 uppercase tracking-wider">અંદાજિત હિસાબ (Auto-Calculated P&L):</p>
                    <p className="text-xs text-amber-900 font-bold">કુલ રોકાણ: ₹{totalBuy.toLocaleString("en-IN")} → કુલ વેચાણ: ₹{totalSell.toLocaleString("en-IN")}</p>
                    <p className={`text-base font-extrabold mt-1 ${pl >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {pl >= 0 ? '+' : ''}₹{pl.toLocaleString("en-IN")}
                    </p>
                  </div>
                );
              })()}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSellModal(false)}
                  className="flex-1 bg-white border border-brand-border text-brand-soil font-bold py-2.5 rounded-xl text-xs hover:bg-brand-lightcream cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Check className="size-3.5" />
                  <span>વેચાણ નોંધો</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
