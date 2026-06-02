import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Home, 
  Users2, 
  FileSpreadsheet, 
  Scale, 
  TrendingUp, 
  Settings as SettingsIcon, 
  Sparkles, 
  Plus, 
  Info,
  FlameKindling,
  Notebook
} from "lucide-react";

import { ActiveTab, Member, MasterRow, AppData, IpoTrade, FINANCIAL_YEARS } from "./types";
import Splash from "./components/Splash";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./components/Login";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Members from "./components/Members";
import MasterSummary from "./components/MasterSummary";
import MemberDistribution from "./components/MemberDistribution";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import IpoTracker from "./components/IpoTracker";

const syncMasterRowsWithMembers = (members: Member[], currentMasterRows: MasterRow[], ipoTrades: IpoTrade[] = []): MasterRow[] => {
  const updatedRows = currentMasterRows.map((row) => ({ ...row }));
  
  const incomeIdx = updatedRows.findIndex(r => r.id === "mr1");
  const expenseIdx = updatedRows.findIndex(r => r.id === "mr2");
  const remainingIdx = updatedRows.findIndex(r => r.id === "mr3");
  const profitIdx = updatedRows.findIndex(r => r.id === "mr4");
  const holdingIdx = updatedRows.findIndex(r => r.id === "mr5");
  const gopiIdx = updatedRows.findIndex(r => r.id === "mr6");
  const grandIdx = updatedRows.findIndex(r => r.id === "mr7");

  FINANCIAL_YEARS.forEach((yf) => {
    const col = yf.masterKey;
    const yearKey = yf.id;

    const sumCapital = members.reduce((sum, m) => sum + (m[yearKey]?.capital || 0), 0);
    const sumExpense = members.reduce((sum, m) => sum + (m[yearKey]?.expense || 0), 0);
    const sumProfit = members.reduce((sum, m) => sum + (m[yearKey]?.profit || 0), 0);
    
    // Auto-calculate holdings: Capital - Expense (remaining in mandal pool)
    const sumHolding = members.reduce((sum, m) => {
      const cap = m[yearKey]?.capital || 0;
      const exp = m[yearKey]?.expense || 0;
      return sum + (cap - exp);
    }, 0);
    const sumGopi = members.reduce((sum, m) => sum + (m.gopiMandal || 0), 0);

    // Compute IPO adjustments for this financial year
    const yearTrades = ipoTrades.filter(t => t.year === yearKey);
    const activeInvested = yearTrades.filter(t => t.status === 'holding').reduce((s, t) => s + (t.buyPrice || 0), 0);
    const realizedProfitLoss = yearTrades.filter(t => t.status === 'sold').reduce((s, t) => s + ((t.sellPrice || 0) - (t.buyPrice || 0)), 0);

    if (incomeIdx !== -1) updatedRows[incomeIdx][col] = sumCapital;
    if (expenseIdx !== -1) updatedRows[expenseIdx][col] = sumExpense;
    
    // Profit = Member Profits + realized IPO Profit/Loss
    if (profitIdx !== -1) updatedRows[profitIdx][col] = sumProfit + realizedProfitLoss;
    
    // Holding = Member Holdings - active stock investment (money tied up in shares)
    if (holdingIdx !== -1) updatedRows[holdingIdx][col] = Math.max(0, sumHolding - activeInvested);
    
    if (gopiIdx !== -1) updatedRows[gopiIdx][col] = sumGopi;

    // Remaining Amount (Cash Baki) = Income - Pending Expense - active stock investment
    if (incomeIdx !== -1 && expenseIdx !== -1 && remainingIdx !== -1) {
      updatedRows[remainingIdx][col] = Math.max(0, (updatedRows[incomeIdx][col] || 0) - (updatedRows[expenseIdx][col] || 0) - activeInvested);
    }
    
    if (grandIdx !== -1) {
      updatedRows[grandIdx][col] = 
        (updatedRows[remainingIdx]?.[col] || 0) + 
        (updatedRows[profitIdx]?.[col] || 0) - 
        (updatedRows[holdingIdx]?.[col] || 0) + 
        (updatedRows[gopiIdx]?.[col] || 0);
    }
  });

  return updatedRows;
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState("");

  // Core application data synchronized with server
  const [appData, setAppData] = useState<AppData | null>(null);

  // New Account Entry Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMemberId, setModalMemberId] = useState("");
  const [modalYear, setModalYear] = useState<string>("year2026");
  const [modalType, setModalType] = useState<"capital" | "expense" | "profit">("capital");
  const [modalAmount, setModalAmount] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [modalTargetAccount, setModalTargetAccount] = useState("");
  
  // Custom Transaction Date selector (day-wise calendar tracking)
  const [modalDate, setModalDate] = useState<string>(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localD = new Date(d.getTime() - (offset * 60 * 1000));
    return localD.toISOString().split("T")[0];
  });

  // New Group-wide Expense/Deposit states
  const [modalTab, setModalTab] = useState<"individual" | "group">("individual");
  const [groupExpenseTitle, setGroupExpenseTitle] = useState("");
  const [groupAmount, setGroupAmount] = useState("");
  const [groupTransactionType, setGroupTransactionType] = useState<"capital" | "expense" | "profit">("capital");
  const [groupTargetAccount, setGroupTargetAccount] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);

  // Load auth token on start
  useEffect(() => {
    const token = localStorage.getItem("shubh_vyapar_token");
    if (token) {
      setAuthToken(token);
    }
  }, []);

  // Fetch data from server
  const fetchLatestData = async () => {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const data = await res.json();
        const synchronizedMasterRows = syncMasterRowsWithMembers(data.members || [], data.masterRows || [], data.ipoTrades || []);
        setAppData({
          ...data,
          masterRows: synchronizedMasterRows
        });
        const timeStr = new Date().toLocaleTimeString("gu-IN", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        });
        setLastSyncTime(timeStr);
      }
    } catch (err) {
      console.error("Error fetching ledger data:", err);
    }
  };

  // Continuous pulling loop for multi-device realtime synchronization
  useEffect(() => {
    if (authToken) {
      fetchLatestData();
      // Poll infrequently to keep server load low; fetch on focus for freshness
      const interval = setInterval(() => {
        fetchLatestData();
      }, 1000 * 60 * 5); // Poll every 5 minutes

      const onFocus = () => {
        fetchLatestData();
      };
      window.addEventListener("focus", onFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", onFocus);
      };
    }
  }, [authToken]);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem("shubh_vyapar_token", token);
    setAuthToken(token);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {}
    localStorage.removeItem("shubh_vyapar_token");
    setAuthToken(null);
    setSelectedMemberId(null);
    setActiveTab("dashboard");
  };

  // Save changes to backend
  const saveAppData = async (updated: AppData) => {
    setAppData(updated);
    try {
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error("Error saving updated data to server:", err);
    }
  };

  const handleSaveMembers = (updatedMembers: Member[]) => {
    if (!appData) return;
    const synchronizedMasterRows = syncMasterRowsWithMembers(updatedMembers, appData.masterRows, appData.ipoTrades || []);
    const nextData = { 
      ...appData, 
      members: updatedMembers, 
      masterRows: synchronizedMasterRows 
    };
    saveAppData(nextData);
  };

  const handleSaveMasterRows = (updatedRows: MasterRow[]) => {
    if (!appData) return;
    const nextData = { ...appData, masterRows: updatedRows };
    saveAppData(nextData);
  };

  const handleResetToDefault = async () => {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const data = await res.json();
        // Trigger server default state by reloading empty
        await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            members: data.members.map((m: any) => ({
              ...m,
              year2023: { capital: 0, expense: 0, profit: 0 },
              year2024: { capital: 0, expense: 0, profit: 0 },
              holding2024_25: 0,
              gopiMandal: 0,
              notes: ""
            })),
            masterRows: data.masterRows.map((r: any) => {
              if (r.id === "mr1") return { ...r, year23: 0, year24: 0 };
              if (r.id === "mr2") return { ...r, year23: 0, year24: 0 };
              if (r.id === "mr3") return { ...r, year23: 0, year24: 0 };
              if (r.id === "mr4") return { ...r, year23: 0, year24: 0 };
              if (r.id === "mr5") return { ...r, year23: 0, year24: 0 };
              if (r.id === "mr6") return { ...r, year23: 0, year24: 0 };
              if (r.id === "mr7") return { ...r, year23: 0, year24: 0 };
              return r;
            })
          }),
        });
        fetchLatestData();
      }
    } catch (e) {}
  };

  const handleUploadBackup = (uploadedMembers: Member[], uploadedMasterRows: MasterRow[]) => {
    if (!appData) return;
    const nextData = { ...appData, members: uploadedMembers, masterRows: uploadedMasterRows };
    saveAppData(nextData);
  };

  // IPO Trade Handlers - call backend API directly and refresh data
  const handleAddIpoTrade = async (trade: Omit<IpoTrade, 'id' | 'profitLoss'>) => {
    try {
      await fetch("/api/ipo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trade),
      });
      fetchLatestData(); // Refresh to get updated IPO data
    } catch (err) {
      console.error("Error adding IPO trade:", err);
    }
  };

  const handleUpdateIpoTrade = async (id: string, updates: Partial<IpoTrade>) => {
    try {
      await fetch(`/api/ipo/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      fetchLatestData();
    } catch (err) {
      console.error("Error updating IPO trade:", err);
    }
  };

  const handleDeleteIpoTrade = async (id: string) => {
    try {
      await fetch(`/api/ipo/${id}`, {
        method: "DELETE",
      });
      fetchLatestData();
    } catch (err) {
      console.error("Error deleting IPO trade:", err);
    }
  };

  // Handles adding quick ledger balance entry
  const handleAddNewEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appData || !modalMemberId || !modalAmount) return;

    const amountNum = parseFloat(modalAmount) || 0;
    const targetAccountName = modalTargetAccount.trim();
    const accountTag = targetAccountName ? `[${targetAccountName}]` : '';

    const updatedMembers = appData.members.map((m) => {
      if (m.id === modalMemberId) {
        // Deep clone to prevent nested state mutation
        const updatedMember = JSON.parse(JSON.stringify(m));
        if (!updatedMember[modalYear]) {
          updatedMember[modalYear] = { capital: 0, expense: 0, profit: 0 };
        }
        updatedMember[modalYear][modalType] = (updatedMember[modalYear][modalType] || 0) + amountNum;
        
        let finalNotes = modalNotes.trim();
        if (accountTag) {
          finalNotes = finalNotes ? `${accountTag} ${finalNotes}` : accountTag;
        }
        if (finalNotes) {
          updatedMember.notes = finalNotes;
        }
        return updatedMember;
      }
      return m;
    });

    // Automatically recalculate masterRows using the synchronized helper
    const updatedMasterRows = syncMasterRowsWithMembers(updatedMembers, appData.masterRows, appData.ipoTrades || []);

    const memberObj = appData.members.find((m) => m.id === modalMemberId);
    const yrObj = FINANCIAL_YEARS.find((y) => y.id === modalYear);
    const typeLabel = modalType === "capital" ? "મુડી જમા" : modalType === "expense" ? "ખર્ચ બાદબાકી" : "નફો વિતરણ";
    
    // Parse custom date picker selection for day-wise calendar tracking
    const [dYear, dMonth, dDay] = modalDate.split("-");
    const formattedDate = `${dDay}-${dMonth}-${dYear}`;
    const now = new Date();
    const timePart = now.toLocaleTimeString("gu-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    const tsStr = `${formattedDate} ${timePart}`;

    const logMsg = `[${formattedDate}] ${memberObj ? memberObj.nameGu : modalMemberId} ના ખાતામાં ${accountTag ? `${accountTag} દ્વારા ` : ""}વર્ષ ${yrObj ? yrObj.labelEn : ""} માટે ₹${amountNum.toLocaleString("en-IN")} નું ${typeLabel} ઉમેરાયું.`;

    const newLogItem = {
      id: "log_" + Date.now(),
      timestamp: tsStr,
      user: "હિસાબનીશ",
      actionGu: logMsg
    };
    const currentLogs = appData.recentLogs || [];
    const updatedLogs = [newLogItem, ...currentLogs].slice(0, 8);

    let nextTargetAccounts = appData.targetAccounts || [];
    if (targetAccountName && !nextTargetAccounts.includes(targetAccountName)) {
      nextTargetAccounts = [...nextTargetAccounts, targetAccountName];
    }

    saveAppData({
      ...appData,
      members: updatedMembers,
      masterRows: updatedMasterRows,
      recentLogs: updatedLogs,
      targetAccounts: nextTargetAccounts
    });

    // Reset Form & Close
    setModalAmount("");
    setModalNotes("");
    setModalTargetAccount("");
    setShowAddModal(false);
  };

  // Handles adding group level split transaction (e.g. Charity or Capital Deposit)
  const handleGroupExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appData || !groupAmount || selectedGroupMembers.length === 0) return;

    const totalAmountNum = parseFloat(groupAmount) || 0;
    const shareAmount = Math.round(totalAmountNum / selectedGroupMembers.length);
    const targetAccountName = groupTargetAccount.trim();
    const accountTag = targetAccountName ? `[${targetAccountName}]` : '';

    // 1. Update each selected member's year-specific ledger depending on transaction type
    const updatedMembers = appData.members.map((m) => {
      if (selectedGroupMembers.includes(m.id)) {
        // Deep clone to prevent nested state mutation
        const updatedMember = JSON.parse(JSON.stringify(m));
        if (!updatedMember[modalYear]) {
          updatedMember[modalYear] = { capital: 0, expense: 0, profit: 0 };
        }
        
        if (groupTransactionType === "capital") {
          updatedMember[modalYear].capital = (updatedMember[modalYear].capital || 0) + shareAmount;
        } else if (groupTransactionType === "expense") {
          updatedMember[modalYear].expense = (updatedMember[modalYear].expense || 0) + shareAmount;
        } else if (groupTransactionType === "profit") {
          updatedMember[modalYear].profit = (updatedMember[modalYear].profit || 0) + shareAmount;
        }

        // Append to notes
        const noteStr = groupExpenseTitle.trim() || (groupTransactionType === "capital" ? "સમૂહ મુડી જમા" : groupTransactionType === "expense" ? "સમૂહ ખર્ચ વિભાજન" : "સમૂહ નફો વિતરણ");
        const accountPart = accountTag ? `${accountTag} ` : '';
        updatedMember.notes = updatedMember.notes 
          ? `${updatedMember.notes}, ${accountPart}${noteStr} (₹${shareAmount.toLocaleString("en-IN")})`
          : `${accountPart}${noteStr} (₹${shareAmount.toLocaleString("en-IN")})`;
        return updatedMember;
      }
      return m;
    });

    // 2. Automatically recalculate masterRows using the synchronized helper
    const updatedMasterRows = syncMasterRowsWithMembers(updatedMembers, appData.masterRows, appData.ipoTrades || []);

    const yrObj = FINANCIAL_YEARS.find((y) => y.id === modalYear);
    const typeLabel = groupTransactionType === "capital" ? "મુડી જમા" : groupTransactionType === "expense" ? "ખર્ચ બાદબાકી" : "નફો વિતરણ";

    // Parse custom date picker selection for day-wise calendar tracking
    const [dYear, dMonth, dDay] = modalDate.split("-");
    const formattedDate = `${dDay}-${dMonth}-${dYear}`;
    const now = new Date();
    const timePart = now.toLocaleTimeString("gu-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    const tsStr = `${formattedDate} ${timePart}`;

    const logMsg = `[${formattedDate}] સમૂહ ${typeLabel} "${groupExpenseTitle || "નોંધ"}" ${accountTag ? `${accountTag} દ્વારા ` : ""}વર્ષ ${yrObj ? yrObj.labelEn : ""} હેઠળ ₹${totalAmountNum.toLocaleString("en-IN")} સમાન ગણતરીએ વિતરિત થયો.`;

    const newLogItem = {
      id: "log_" + Date.now(),
      timestamp: tsStr,
      user: "હિસાબનીશ",
      actionGu: logMsg
    };
    const currentLogs = appData.recentLogs || [];
    const updatedLogs = [newLogItem, ...currentLogs].slice(0, 8);

    let nextTargetAccounts = appData.targetAccounts || [];
    if (targetAccountName && !nextTargetAccounts.includes(targetAccountName)) {
      nextTargetAccounts = [...nextTargetAccounts, targetAccountName];
    }

    saveAppData({
      ...appData,
      members: updatedMembers,
      masterRows: updatedMasterRows,
      recentLogs: updatedLogs,
      targetAccounts: nextTargetAccounts
    });

    // Reset Group states & Close
    setGroupAmount("");
    setGroupExpenseTitle("");
    setGroupTargetAccount("");
    setShowAddModal(false);
  };

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  if (!authToken) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  // Active Screen Selector Switch
  const renderTabContent = () => {
    if (!appData) {
      return null;
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            members={appData.members}
            searchTerm={searchTerm}
            recentLogs={appData.recentLogs || []}
            currentYear={appData.currentYear}
            onSelectMember={(id) => {
              setSelectedMemberId(id);
              setActiveTab("members");
            }}
            onNavigate={(tab) => {
              setActiveTab(tab);
            }}
            ipoSummary={appData.ipoSummary}
          />
        );
      case "members":
        return (
          <Members
            members={appData.members}
            onSaveMembers={handleSaveMembers}
            selectedMemberId={selectedMemberId}
            onClearSelection={() => setSelectedMemberId(null)}
            currentYear={appData.currentYear}
          />
        );
      case "master_summary":
        return (
          <MasterSummary
            masterRows={appData.masterRows}
            onSaveMasterRows={handleSaveMasterRows}
            currentYear={appData.currentYear}
            ipoTrades={appData.ipoTrades || []}
          />
        );
      case "profit":
        return (
          <MemberDistribution
            members={appData.members}
            onSaveMembers={handleSaveMembers}
            currentYear={appData.currentYear}
          />
        );
      case "reports":
        return (
          <Reports
            members={appData.members}
            masterRows={appData.masterRows}
            currentYear={appData.currentYear}
          />
        );
      case "settings":
        return (
          <Settings
            members={appData.members}
            masterRows={appData.masterRows}
            onResetToDefault={handleResetToDefault}
            onUploadBackup={handleUploadBackup}
            currentYear={appData.currentYear}
          />
        );
      case "ipo":
        return (
          <IpoTracker
            ipoTrades={appData.ipoTrades || []}
            ipoSummary={appData.ipoSummary || { totalInvested: 0, totalProfitLoss: 0, activeCount: 0, activeInvested: 0, totalTrades: 0 }}
            onAddTrade={handleAddIpoTrade}
            onUpdateTrade={handleUpdateIpoTrade}
            onDeleteTrade={handleDeleteIpoTrade}
            currentYear={appData.currentYear}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-brand-cream flex flex-col md:flex-row font-sans selection:bg-brand-wheat selection:text-brand-soil text-brand-soil overflow-x-hidden">
      
      {/* Sidebar Navigation - Styled identically to Design HTML */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-brand-border flex flex-col justify-between shrink-0 select-none print:hidden">
        <div>
          {/* Spiritual Gilded Cover Badge / Hanuman Banner Accent */}
          <div className="p-6 border-b border-brand-border bg-gradient-to-br from-brand-lightcream to-transparent flex flex-col items-center text-center">
            {/* Spiritual Circular Icon Icon like Design HTML Saffron Banner */}
            <div className="w-24 h-24 bg-brand-saffron rounded-full flex items-center justify-center mb-3 shadow-md border-4 border-white">
              <span className="text-4xl">🚩</span>
            </div>
            <h2 className="text-xl font-bold text-brand-orange text-center tracking-tight">શ્રી હનુમાન દાદા</h2>
            <p className="text-xs text-brand-soil/50 mt-1 font-semibold uppercase tracking-wider">હિસાબ વ્યવસ્થાપન</p>
          </div>

          {/* Nav Items Group */}
          <nav className="flex-1 py-4">
            {/* Dashboard Button */}
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedMemberId(null); }}
              className={`w-full flex items-center px-6 py-3 transition-colors text-sm font-bold cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-brand-wheat border-r-4 border-brand-orange text-brand-soil"
                  : "text-brand-soil hover:bg-brand-lightcream"
              }`}
            >
              <span className="mr-3 text-lg">🏠</span>
              <span>ડેશબોર્ડ</span>
            </button>

            {/* Members List Button */}
            <button
              onClick={() => { setActiveTab("members"); setSelectedMemberId(null); }}
              className={`w-full flex items-center px-6 py-3 transition-colors text-sm font-bold cursor-pointer ${
                activeTab === "members"
                  ? "bg-brand-wheat border-r-4 border-brand-orange text-brand-soil"
                  : "text-brand-soil hover:bg-brand-lightcream"
              }`}
            >
              <span className="mr-3 text-lg">👥</span>
              <span>સભ્યો</span>
            </button>

            {/* Master Summary Button */}
            <button
              onClick={() => { setActiveTab("master_summary"); setSelectedMemberId(null); }}
              className={`w-full flex items-center px-6 py-3 transition-colors text-sm font-bold cursor-pointer ${
                activeTab === "master_summary"
                  ? "bg-brand-wheat border-r-4 border-brand-orange text-brand-soil"
                  : "text-brand-soil hover:bg-brand-lightcream"
              }`}
            >
              <span className="mr-3 text-lg">📊</span>
              <span>મુખ્ય હિસાબ</span>
            </button>

            {/* Member Distribution Button */}
            <button
              onClick={() => { setActiveTab("profit"); setSelectedMemberId(null); }}
              className={`w-full flex items-center px-6 py-3 transition-colors text-sm font-bold cursor-pointer ${
                activeTab === "profit"
                  ? "bg-brand-wheat border-r-4 border-brand-orange text-brand-soil"
                  : "text-brand-soil hover:bg-brand-lightcream"
              }`}
            >
              <span className="mr-3 text-lg">💰</span>
              <span>નફો</span>
            </button>

            {/* Reports Button */}
            <button
              onClick={() => { setActiveTab("reports"); setSelectedMemberId(null); }}
              className={`w-full flex items-center px-6 py-3 transition-colors text-sm font-bold cursor-pointer ${
                activeTab === "reports"
                  ? "bg-brand-wheat border-r-4 border-brand-orange text-brand-soil"
                  : "text-brand-soil hover:bg-brand-lightcream"
              }`}
            >
              <span className="mr-3 text-lg">📄</span>
              <span>રિપોર્ટ્સ</span>
            </button>

            {/* IPO Trading Button */}
            <button
              onClick={() => { setActiveTab("ipo"); setSelectedMemberId(null); }}
              className={`w-full flex items-center px-6 py-3 transition-colors text-sm font-bold cursor-pointer ${
                activeTab === "ipo"
                  ? "bg-brand-wheat border-r-4 border-brand-orange text-brand-soil"
                  : "text-brand-soil hover:bg-brand-lightcream"
              }`}
            >
              <span className="mr-3 text-lg">📈</span>
              <span>IPO ટ્રેડિંગ</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={() => { setActiveTab("settings"); setSelectedMemberId(null); }}
              className={`w-full flex items-center px-6 py-3 transition-colors text-sm font-bold cursor-pointer ${
                activeTab === "settings"
                  ? "bg-brand-wheat border-r-4 border-brand-orange text-brand-soil"
                  : "text-brand-soil hover:bg-brand-lightcream"
              }`}
            >
              <span className="mr-3 text-lg">⚙️</span>
              <span>સેટિંગ્સ</span>
            </button>
          </nav>
        </div>

        {/* Dynamic Plus New Transaction Trigger - Beautiful Saffron Accent */}
        <div className="p-6 border-t border-brand-border">
          <button
            onClick={() => {
              if (appData && appData.members.length > 0) {
                setModalMemberId(appData.members[0].id);
                setSelectedGroupMembers(appData.members.map(m => m.id));
              }
              setModalTab("individual");
              setShowAddModal(true);
            }}
            className="w-full bg-brand-orange hover:bg-opacity-90 active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer font-sans"
          >
            <Plus className="size-4.5 stroke-[3px]" />
            <span>નવો હિસાબ ઉમેરો</span>
          </button>
        </div>
      </aside>

      {/* Main Framework Layout Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          currentYear={(() => {
            const cy = appData?.currentYear;
            const conf = FINANCIAL_YEARS.find(y => y.id === cy);
            return conf ? conf.labelEn : (cy || "2026");
          })()} 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
          onLogout={handleLogout}
          lastSyncTime={lastSyncTime}
        />
        
        {/* Tab content workspace wrapper */}
        <main className="flex-1 p-6 z-10 print:p-0 print:bg-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Global Footer Gilded Seal */}
        <footer className="py-4 border-t border-brand-border text-center text-xs text-brand-soil/60 font-semibold bg-white print:hidden">
          © ૨૦૨૬ શુભ વ્યાપાર હિસાબી રજીસ્ટ્રાર મંડળ • વડીલોની સરળતા અર્થે
        </footer>
      </div>

      {/* Dynamic "+ નવો હિસાબ" Form Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-brand-border max-w-md w-full shadow-2xl overflow-hidden font-sans"
          >
            {/* Modal Head Banner */}
            <div className="bg-gradient-to-r from-brand-orange to-brand-saffron p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FlameKindling className="size-5" />
                <h3 className="font-bold text-sm md:text-base">નવો હિસાબ ઉમેરો</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white hover:text-brand-lightcream font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="grid grid-cols-2 border-b border-brand-border bg-brand-lightcream/25">
              <button
                type="button"
                onClick={() => setModalTab("individual")}
                className={`py-3 text-xs font-bold text-center border-b-2 cursor-pointer transition-colors ${
                  modalTab === "individual"
                    ? "border-brand-orange text-brand-orange bg-white"
                    : "border-transparent text-brand-soil/60 hover:text-brand-soil"
                }`}
              >
                👤 વ્યક્તિગત ખાતામાં નોંધ
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalTab("group");
                  if (appData && selectedGroupMembers.length === 0) {
                    setSelectedGroupMembers(appData.members.map((m) => m.id));
                  }
                }}
                className={`py-3 text-xs font-bold text-center border-b-2 cursor-pointer transition-colors ${
                  modalTab === "group"
                    ? "border-brand-orange text-brand-orange bg-white"
                    : "border-transparent text-brand-soil/60 hover:text-brand-soil"
                }`}
              >
                📢 સમૂહ ખર્ચ વિભાજન (દાન)
              </button>
            </div>

            {modalTab === "individual" ? (
              <form onSubmit={handleAddNewEntry} className="p-6 space-y-4">
                {/* Member Selector Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-soil">સભ્ય પસંદ કરો (Select Member)</label>
                  <select 
                    value={modalMemberId}
                    onChange={(e) => setModalMemberId(e.target.value)}
                    className="w-full bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                  >
                    {appData?.members.map((m) => (
                      <option key={m.id} value={m.id}>{m.nameGu} ({m.nameEn})</option>
                    ))}
                  </select>
                </div>

                {/* Financial Year Selector & Custom Transaction Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-brand-soil">નાણાકીય વર્ષ</label>
                    <select 
                      value={modalYear}
                      onChange={(e) => setModalYear(e.target.value)}
                      className="w-full bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                    >
                      {FINANCIAL_YEARS.map((y) => (
                        <option key={y.id} value={y.id}>{y.labelGu}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-brand-soil">વ્યવહારની તારીખ *</label>
                    <input 
                      type="date"
                      required
                      value={modalDate}
                      onChange={(e) => setModalDate(e.target.value)}
                      className="w-full bg-brand-cream border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-soil font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-soil">પ્રકાર (Transaction Type)</label>
                  <select 
                    value={modalType}
                    onChange={(e) => setModalType(e.target.value as any)}
                    className="w-full bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                  >
                    <option value="capital">મુડી જમા (Capital)</option>
                    <option value="expense">ખર્ચ બાદબાકી (Expense)</option>
                    <option value="profit">નફો વિતરણ (Profit)</option>
                  </select>
                </div>

                {/* Amount Inputs with Quick Multiplier Presets */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-soil">રકમ લખો (Amount in INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="મેળવેલ આંકડો લખો (e.g. 5000)"
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                    className="w-full bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                  />
                  {/* Quick Preset Buttons for Elders */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { l: "+૫,૦૦૦", v: 5000 },
                      { l: "+૧૦,૦૦૦", v: 10000 },
                      { l: "+૨૫,૦૦૦", v: 25000 },
                      { l: "+૫૦,૦૦૦", v: 50000 },
                      { l: "+૧,૦૦,૦૦૦", v: 100000 }
                    ].map((chip) => (
                      <button
                        key={chip.l}
                        type="button"
                        onClick={() => {
                          const curr = parseFloat(modalAmount) || 0;
                          setModalAmount(String(curr + chip.v));
                        }}
                        className="text-[10px] font-bold bg-brand-lightcream border border-brand-border/60 hover:border-brand-orange hover:bg-brand-wheat text-brand-soil px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        {chip.l}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setModalAmount("")}
                      className="text-[10px] font-bold bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      સાફ કરો (Clear)
                    </button>
                  </div>
                </div>

                {/* Target Account */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-soil">વ્યવહાર ખાતું (Select/Add Target Account)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ખાતાનું નામ લખો (e.g. પિતાજીનું ખાતું, દાદીનું ખાતું)"
                      value={modalTargetAccount}
                      onChange={(e) => setModalTargetAccount(e.target.value)}
                      className="flex-1 bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                    />
                    {(appData?.targetAccounts || []).length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setModalTargetAccount(e.target.value);
                          }
                        }}
                        value=""
                        className="bg-brand-wheat border border-brand-border rounded-xl px-2 py-1 text-[11px] font-bold text-brand-soil cursor-pointer outline-none"
                      >
                        <option value="">-- પસંદ કરો --</option>
                        {(appData?.targetAccounts || []).map((acc: string) => (
                          <option key={acc} value={acc}>{acc}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-soil">ટૂંકી વિગત / નોંધ (Optional)</label>
                  <input
                    type="text"
                    placeholder="નોંધ લખો (e.g. રોકડા આપ્યા)"
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="w-full bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-medium"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-white border border-brand-border text-brand-soil font-bold py-2.5 rounded-xl text-xs hover:bg-brand-lightcream"
                  >
                    રદ કરો
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-brand-orange to-brand-saffron text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>નોંધ સેવ કરો</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleGroupExpenseSubmit} className="p-6 space-y-4">
                {/* Expense Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-soil">સમૂહ વ્યવહાર / દાનનું કેન્દ્રશીર્ષક *</label>
                  <input
                    type="text"
                    required
                    placeholder="દાન, જમા અથવા જનરલ ખર્ચનું નામ (e.g., મંદિર પ્રસાદ ભેટ, ગૌશાળા દાન)"
                    value={groupExpenseTitle}
                    onChange={(e) => setGroupExpenseTitle(e.target.value)}
                    className="w-full bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                  />
                </div>

                {/* Financial Year Selector & Custom Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-brand-soil">નાણાકીય વર્ષ</label>
                    <select 
                      value={modalYear}
                      onChange={(e) => setModalYear(e.target.value)}
                      className="w-full bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                    >
                      {FINANCIAL_YEARS.map((y) => (
                        <option key={y.id} value={y.id}>{y.labelGu}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-brand-soil">વ્યવહારની તારીખ *</label>
                    <input 
                      type="date"
                      required
                      value={modalDate}
                      onChange={(e) => setModalDate(e.target.value)}
                      className="w-full bg-brand-cream border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-soil font-bold outline-none"
                    />
                  </div>
                </div>

                {/* Transaction Type & Total Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-brand-soil">વ્યવહારનો પ્રકાર</label>
                    <select 
                      value={groupTransactionType}
                      onChange={(e) => setGroupTransactionType(e.target.value as any)}
                      className="w-full bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                    >
                      <option value="capital">મુડી જમા (Capital)</option>
                      <option value="expense">ખર્ચ બાદબાકી (Expense)</option>
                      <option value="profit">નફો વિતરણ (Profit)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-brand-soil">કુલ સરવાળો રકમ (INR) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="આંકડો ભરો (e.g. 50000)"
                      value={groupAmount}
                      onChange={(e) => setGroupAmount(e.target.value)}
                      className="w-full bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                    />
                  </div>
                </div>

                {/* Quick Preset Buttons for Group Amount */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { l: "+૧૦k", v: 10000 },
                    { l: "+૫૦k", v: 50000 },
                    { l: "+૧L", v: 100000 },
                    { l: "+૨.૫L", v: 250000 },
                    { l: "+૫L", v: 500000 }
                  ].map((chip) => (
                    <button
                      key={chip.l}
                      type="button"
                      onClick={() => {
                        const curr = parseFloat(groupAmount) || 0;
                        setGroupAmount(String(curr + chip.v));
                      }}
                      className="text-[9px] font-bold bg-brand-lightcream border border-brand-border/60 hover:border-brand-orange hover:bg-brand-wheat text-brand-soil px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      {chip.l}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setGroupAmount("")}
                    className="text-[9px] font-bold bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    સાફ (Clear)
                  </button>
                </div>

                {/* Group Target Account */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-soil">વ્યવહાર ખાતું (Select/Add Target Account)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ખાતાનું નામ લખો (e.g. પિતાજીનું ખાતું, પત્નીનું ખાતું)"
                      value={groupTargetAccount}
                      onChange={(e) => setGroupTargetAccount(e.target.value)}
                      className="flex-1 bg-brand-cream border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-soil font-bold"
                    />
                    {(appData?.targetAccounts || []).length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setGroupTargetAccount(e.target.value);
                          }
                        }}
                        value=""
                        className="bg-brand-wheat border border-brand-border rounded-xl px-2 py-1 text-[11px] font-bold text-brand-soil cursor-pointer outline-none"
                      >
                        <option value="">-- પસંદ કરો --</option>
                        {(appData?.targetAccounts || []).map((acc: string) => (
                          <option key={acc} value={acc}>{acc}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Members Selection Checklist */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-soil">સભ્યોની બાગીદારી (પસંદ અથવા રદ કરો):</label>
                  <div className="max-h-36 overflow-y-auto border border-brand-border rounded-xl divide-y divide-amber-100 p-2 bg-brand-lightcream/5">
                    {appData?.members.map((m) => {
                      const isChecked = selectedGroupMembers.includes(m.id);
                      return (
                        <label key={m.id} className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-brand-lightcream/25 rounded-lg cursor-pointer text-xs select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedGroupMembers(selectedGroupMembers.filter((id) => id !== m.id));
                              } else {
                                setSelectedGroupMembers([...selectedGroupMembers, m.id]);
                              }
                            }}
                            className="rounded border-amber-300 text-brand-orange focus:ring-brand-saffron size-4 cursor-pointer"
                          />
                          <img
                            src={m.imageUrl}
                            alt={m.nameEn}
                            referrerPolicy="no-referrer"
                            className="size-5 rounded-full object-cover border border-amber-200"
                          />
                          <span className="font-bold text-brand-soil">{m.nameGu}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Live Dividend Preview */}
                {selectedGroupMembers.length > 0 && groupAmount && (
                  <div className="bg-orange-50/70 border border-orange-200/50 rounded-xl p-3 text-center space-y-1 animate-fade-in">
                    <p className="text-[10px] font-bold text-orange-950">સમાન ભાગ વિતરણ કિંમત:</p>
                    <p className="text-sm font-extrabold text-brand-orange">
                      ₹{(Math.round((parseFloat(groupAmount) || 0) / selectedGroupMembers.length)).toLocaleString("en-IN")}
                      <span className="text-xs font-medium text-brand-soil/70"> / પ્રતિ સભ્ય ભાગે (કુલ {selectedGroupMembers.length} સભ્યો દીઠ)</span>
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-white border border-brand-border text-brand-soil font-bold py-2.5 rounded-xl text-xs hover:bg-brand-lightcream"
                  >
                    રદ કરો
                  </button>
                  <button
                    type="submit"
                    disabled={selectedGroupMembers.length === 0 || !groupAmount}
                    className="flex-1 bg-gradient-to-r from-brand-orange to-brand-saffron text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>સમૂહ વ્યવહાર લાગુ કરો</span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
