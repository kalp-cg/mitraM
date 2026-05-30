import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(express.json());
app.use("/assets", express.static(path.join(process.cwd(), "assets")));

const aistudioDir = path.join(process.cwd(), "assets", ".aistudio");
if (fs.existsSync(aistudioDir)) {
  console.log("FILES IN .AISTUDIO:", fs.readdirSync(aistudioDir));
} else {
  console.log(".aistudio directory does not exist");
}

// Helper to provide avatars that match the aesthetic of the references
const DEFAULT_MEMBERS = [
  {
    id: "m1",
    nameEn: "V G RAJPUT",
    nameGu: "વી. જી. રાજપૂત",
    status: "ACTIVE",
    imageUrl: "/api/image/member/0",
    year2023: { capital: 0, expense: 0, profit: 0 },
    year2024: { capital: 0, expense: 0, profit: 0 },
    holding2024: 0,
    gopiMandal: 0,
    notes: ""
  },
  {
    id: "m2",
    nameEn: "A J PATEL",
    nameGu: "એ. જે. પટેલ",
    status: "ACTIVE",
    imageUrl: "/api/image/member/1",
    year2023: { capital: 0, expense: 0, profit: 0 },
    year2024: { capital: 0, expense: 0, profit: 0 },
    holding2024: 0,
    gopiMandal: 0,
    notes: ""
  },
  {
    id: "m3",
    nameEn: "S C MODI",
    nameGu: "એસ. સી. મોદી",
    status: "ACTIVE",
    imageUrl: "/api/image/member/2",
    year2023: { capital: 0, expense: 0, profit: 0 },
    year2024: { capital: 0, expense: 0, profit: 0 },
    holding2024: 0,
    gopiMandal: 0,
    notes: ""
  },
  {
    id: "m4",
    nameEn: "S B PATEL",
    nameGu: "એસ. બી. પટેલ",
    status: "ACTIVE",
    imageUrl: "/api/image/member/3",
    year2023: { capital: 0, expense: 0, profit: 0 },
    year2024: { capital: 0, expense: 0, profit: 0 },
    holding2024: 0,
    gopiMandal: 0,
    notes: ""
  },
  {
    id: "m5",
    nameEn: "P M PRAJAPATI",
    nameGu: "પી. એમ. પ્રજાપતિ",
    status: "ACTIVE",
    imageUrl: "/api/image/member/4",
    year2023: { capital: 0, expense: 0, profit: 0 },
    year2024: { capital: 0, expense: 0, profit: 0 },
    holding2024: 0,
    gopiMandal: 0,
    notes: ""
  }
];

const DEFAULT_MASTER_ROWS = [
  { id: "mr1", titleEn: "Income (આવક)", titleGu: "આવક (Income)", year23: 0, year24: 0, isCalculated: false },
  { id: "mr2", titleEn: "Pending Expense (બાકી ખર્ચ)", titleGu: "બાકી ખર્ચ (Pending Expense)", year23: 0, year24: 0, isCalculated: false },
  { id: "mr3", titleEn: "Remaining Amount (વધેલ રકમ)", titleGu: "વધેલ રકમ (Remaining Amount)", year23: 0, year24: 0, isCalculated: true, calcType: "subtract" }, // Income - Pending Expense
  { id: "mr4", titleEn: "Profit (નફો)", titleGu: "નફો (Profit)", year23: 0, year24: 0, isCalculated: false },
  { id: "mr5", titleEn: "Holding (હોલ્ડિંગ)", titleGu: "હોલ્ડિંગ (Holding)", year23: 0, year24: 0, isCalculated: false },
  { id: "mr6", titleEn: "Gopi Mandal (ગોપી મંડળ)", titleGu: "ગોપી મંડળ", year23: 0, year24: 0, isCalculated: false },
  { id: "mr7", titleEn: "Grand Total (એકંદર કુલ)", titleGu: "એકંદર કુલ (Grand Total)", year23: 0, year24: 0, isCalculated: true, calcType: "add_all" }
];

const DEFAULT_DATA = {
  members: DEFAULT_MEMBERS,
  masterRows: DEFAULT_MASTER_ROWS,
  currentYear: "year2026",
  // default current year set to 2026 per request
  // Note: frontend FINANCIAL_YEARS includes year2026 already
  appTitleGu: "શુભ વ્યાપાર",
  appDescriptionGu: "ચોપડા પૂજન - ડિજિટલ ખાતાવહી",
  recentLogs: [],
  targetAccounts: [
    "પિતૃ પક્ષ ખાતું (પિતાજી)",
    "માતાજીનું ખાતું",
    "પત્નીનું ખાતું",
    "મોટા દાદીનું ખાતું"
  ]
};


// Helper to serve file by prefix from .aistudio folder or fallback to a URL
function serveAssetByPrefix(prefix: string, fallbackUrl: string, res: any) {
  const aistudioDir = path.join(process.cwd(), "assets", ".aistudio");
  if (fs.existsSync(aistudioDir)) {
    try {
      const files = fs.readdirSync(aistudioDir);
      const match = files.find(f => f.toLowerCase().startsWith(prefix.toLowerCase()));
      if (match) {
        const filePath = path.join(aistudioDir, match);
        return res.sendFile(filePath);
      }
    } catch (e) {
      console.error("Error serving prefix " + prefix, e);
    }
  }
  // redirect to fallback
  res.redirect(fallbackUrl);
}

// Ensure database file exits or create defaults
function readDB() {
  let data;
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      data = JSON.parse(content);
    } else {
      data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      writeDB(data);
    }
  } catch (err) {
    console.error("Error reading db file, falling back to defaults:", err);
    data = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  // Dynamically map members' images to their uploaded files API endpoints
  if (data && data.members) {
    data.members = data.members.map((m: any, idx: number) => {
      return {
        ...m,
        imageUrl: `/api/image/member/${idx}`
      };
    });
  }

  // Dynamically attach specific images to main response
  data.hanumanFace = "/api/image/hanuman-face";
  data.hanumanFull = "/api/image/hanuman-full";
  data.hanumanTurban = "/api/image/hanuman-turban";
  data.groupPhoto = "/api/image/group-photo";

  if (!data.recentLogs || !Array.isArray(data.recentLogs)) {
    data.recentLogs = [
      { id: "l1", timestamp: "૨૮-૦૫-૨૦૨૬ ૧૦:૧૫", user: "હિસાબનીશ", actionGu: "સિસ્ટમ રજીસ્ટર ઓટો-સિંક કનેક્ટ થયું." },
      { id: "l2", timestamp: "૨૮-૦૫-૨૦૨૬ ૧૦:૦૦", user: "હિસાબનીશ", actionGu: "વાર્ષિક હિસાબી ચોપડા પૂજન અહેવાલ ચકાસવામાં આવ્યો." }
    ];
  }

  // Attach live server time to reduce extra time-only API calls from clients
  data.serverTime = new Date().toISOString();

  return data;
}

// Lightweight time endpoint for global/live clock (low-cost)
app.get("/api/time", (req, res) => {
  const now = new Date();
  res.json({
    serverTime: now.toISOString(),
    epochMs: now.getTime(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
});

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to db file:", err);
  }
}

// Global active sessions log
let activeSessionsCount = 0;

// API Endpoints
app.post("/api/login", (req, res) => {
  const { id, password } = req.body;
  if (id === "user" && password === "123456") {
    activeSessionsCount = Math.min(5, activeSessionsCount + 1); // Mock 5 allowed concurrent users
    res.json({ success: true, user: "user", sessions: activeSessionsCount, token: "shubh_vyapar_token_2026" });
  } else {
    res.status(401).json({ success: false, messageGu: "ખોટો યુઝર આઈડી અથવા પાસવર્ડ!" });
  }
});

app.post("/api/logout", (req, res) => {
  activeSessionsCount = Math.max(0, activeSessionsCount - 1);
  res.json({ success: true });
});

// Hanuman and Group uploaded image serving APIs
app.get("/api/image/hanuman-face", (req, res) => {
  serveAssetByPrefix("input_file_6", "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=300&auto=format&fit=crop&q=80", res);
});

app.get("/api/image/hanuman-full", (req, res) => {
  serveAssetByPrefix("input_file_7", "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=80", res);
});

app.get("/api/image/hanuman-turban", (req, res) => {
  serveAssetByPrefix("input_file_8", "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=80", res);
});

app.get("/api/image/group-photo", (req, res) => {
  serveAssetByPrefix("input_file_5", "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1000&auto=format&fit=crop&q=80", res);
});

app.get("/api/image/member/:idx", (req, res) => {
  const idx = parseInt(req.params.idx);
  const prefixes = ["input_file_0", "input_file_1", "input_file_2", "input_file_3", "input_file_4"];
  const prefix = prefixes[idx] || "input_file_0";
  
  // Custom Fallbacks matching the aesthetic
  const fallbacks = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80"
  ];
  const fallbackUrl = fallbacks[idx] || fallbacks[0];
  serveAssetByPrefix(prefix, fallbackUrl, res);
});

app.get("/api/data", (req, res) => {
  const dbData = readDB();
  // Add a Cache-Control to reduce repeated requests from clients and lower server load
  // Align TTL with client polling interval (5 minutes) to minimize unnecessary traffic
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json(dbData);
});

app.post("/api/data", (req, res) => {
  const newData = req.body;
  if (!newData || !newData.members || !newData.masterRows) {
    return res.status(400).json({ error: "ખોટો હિસાબ ડેટા અમાન્ય છે." });
  }
  writeDB(newData);
  res.json({ success: true, data: newData });
});

// Serve compiled client static assets or load Vite dynamic router
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
