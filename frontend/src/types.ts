export interface YearData {
  capital: number;
  expense: number;
  profit: number;
  remainingAmount?: number;
}

export interface YearConfig {
  id: string; // "year2023_24"
  masterKey: string; // "year23_24"
  labelGu: string; // "વર્ષ ૨૦૨૩/૨૪"
  labelEn: string; // "2023/24"
}

export const FINANCIAL_YEARS: YearConfig[] = [
  { id: "year2023", masterKey: "year23", labelGu: "વર્ષ ૨૦૨૩", labelEn: "2023" },
  { id: "year2024", masterKey: "year24", labelGu: "વર્ષ ૨૦૨૪", labelEn: "2024" },
  { id: "year2025", masterKey: "year25", labelGu: "વર્ષ ૨૦૨૫", labelEn: "2025" },
  { id: "year2026", masterKey: "year26", labelGu: "વર્ષ ૨૦૨૬", labelEn: "2026" },
  { id: "year2027", masterKey: "year27", labelGu: "વર્ષ ૨૦૨૭", labelEn: "2027" },
  { id: "year2028", masterKey: "year28", labelGu: "વર્ષ ૨૦૨૮", labelEn: "2028" },
  { id: "year2029", masterKey: "year29", labelGu: "વર્ષ ૨૦૨૯", labelEn: "2029" },
  { id: "year2030", masterKey: "year30", labelGu: "વર્ષ ૨૦૩૦", labelEn: "2030" },
  { id: "year2031", masterKey: "year31", labelGu: "વર્ષ ૨૦૩૧", labelEn: "2031" },
  { id: "year2032", masterKey: "year32", labelGu: "વર્ષ ૨૦૩૨", labelEn: "2032" },
  { id: "year2033", masterKey: "year33", labelGu: "વર્ષ ૨૦૩૩", labelEn: "2033" },
  { id: "year2034", masterKey: "year34", labelGu: "વર્ષ ૨૦૩૪", labelEn: "2034" },
  { id: "year2035", masterKey: "year35", labelGu: "વર્ષ ૨૦૩૫", labelEn: "2035" }
];

export interface Member {
  id: string;
  nameEn: string;
  nameGu: string;
  status: 'ACTIVE' | 'INACTIVE';
  imageUrl: string;
  // Year wise data
  year2023: YearData;
  year2024: YearData;
  [key: string]: any;
  // Other details
  holding2024: number;
  gopiMandal: number;
  notes?: string;
}

export interface MasterRow {
  id: string;
  titleEn: string;
  titleGu: string;
  year23_24: number;
  year24_25: number;
  [key: string]: any;
  isCalculated: boolean;
  calcType?: 'subtract' | 'add_all' | 'custom';
}

export interface IpoTrade {
  id: string;
  shareName: string;
  buyDate: string;
  sellDate?: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  sellQuantity?: number;
  dematAccount: string;
  status: 'holding' | 'sold';
  profitLoss: number;
  notes?: string;
  year: string;
}

export interface IpoSummary {
  totalInvested: number;
  totalProfitLoss: number;
  activeCount: number;
  activeInvested: number;
  totalTrades: number;
}

export interface AppData {
  members: Member[];
  masterRows: MasterRow[];
  currentYear: string;
  appTitleGu: string;
  appDescriptionGu: string;
  recentLogs?: SystemAudit[];
  targetAccounts?: string[];
  hanumanFace?: string;
  hanumanFull?: string;
  hanumanTurban?: string;
  groupPhoto?: string;
  ipoTrades?: IpoTrade[];
  ipoSummary?: IpoSummary;
}

export interface SystemAudit {
  id: string;
  timestamp: string;
  user: string;
  actionGu: string;
}

// Routes navigation enum
export type ActiveTab = 'dashboard' | 'members' | 'master_summary' | 'profit' | 'reports' | 'settings' | 'ipo';
