import { useState, useEffect } from "react";

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

// ── Full-width override for Vite's default index.css ──────────────
(function() {
  var s = document.createElement("style");
  s.textContent = [
    "*, *::before, *::after { box-sizing: border-box; }",
    "html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }",
    "#root { max-width: 100% !important; width: 100% !important; height: 100% !important;",
    "        margin: 0 !important; padding: 0 !important; text-align: left !important; }",
    "",
    "/* ── Responsive / Mobile ────────────────────────── */",
    "@media (max-width: 768px) {",
    "  .wo-sidebar { display: none !important; }",
    "  .wo-sidebar.wo-open { display: flex !important; position: fixed !important; top:0 !important; left:0 !important; bottom:0 !important; z-index: 900 !important; width: 260px !important; box-shadow: 4px 0 24px rgba(0,0,0,0.18) !important; }",
    "  .wo-sidebar-backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 899; }",
    "  .wo-sidebar-backdrop.wo-open { display: block; }",
    "  .wo-hamburger { display: flex !important; }",
    "  .wo-topbar-extras { display: none !important; }",
    "  .wo-topbar-search { max-width: none !important; flex: 1 !important; }",
    "  .wo-summary-grid { grid-template-columns: 1fr 1fr !important; }",
    "  .wo-page-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }",
    "  .wo-drawer-overlay > div:last-child { width: 100vw !important; min-width: 100vw !important; }",
    "  .wo-main-content { padding: 0 14px 24px !important; }",
    "  .wo-main-title { font-size: 20px !important; }",
    "  .wo-default-page { padding: 16px !important; }",
    "  .wo-default-page-inner { max-width: 100% !important; }",
    "  .wo-page-title-row { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }",
    "  .wo-table-scroll { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }",
    "  .wo-table-scroll > div[style*='display'] { min-width: 700px; }",
    "  .wo-modal-content { width: 95vw !important; max-width: 95vw !important; min-width: 0 !important; }",
    "  .wo-default-page h1 { font-size: 20px !important; }",
    "  div[style*='position: fixed'][style*='translate(-50'] { max-width: calc(100vw - 32px) !important; max-height: 90vh !important; overflow-y: auto !important; }",
    "  div[style*='position:fixed'][style*='translate(-50'] { max-width: calc(100vw - 32px) !important; max-height: 90vh !important; overflow-y: auto !important; }",
    "  div[style*='position: fixed'][style*='justify-content: center'] > div[style*='border-radius'] { max-width: calc(100vw - 32px) !important; max-height: 90vh !important; overflow-y: auto !important; }",
    "  div[style*='position: fixed'] div[style*='grid-template-columns: 1fr 1fr 1fr'] { grid-template-columns: 1fr 1fr !important; }",
    "}",
    "@media (max-width: 480px) {",
    "  .wo-summary-grid { grid-template-columns: 1fr !important; }",
    "  .wo-topbar-search { display: none !important; }",
    "}",
  ].join("\n");
  document.head.appendChild(s);
})();


/* ─── Design tokens ────────────────────────────────────────── */
const T = {
  bg: "#FFFFFF",
  sidebar: "#FAFAFA",
  sidebarBorder: "#EBEBEB",
  card: "#FFFFFF",
  cardBorder: "#E4E4E7",
  hover: "#F4F4F5",
  selected: "#18181B",
  selectedText: "#FFFFFF",
  text: "#18181B",
  muted: "#71717A",
  dim: "#A1A1AA",
  border: "#E4E4E7",
  up: "#16A34A",
  upBg: "#F0FDF4",
  down: "#DC2626",
  downBg: "#FEF2F2",
  accent: "#3B82F6",
  accentBg: "#EFF6FF",
  inputBg: "#F4F4F5",
  warn: "#D97706",
  warnBg: "#FFFBEB",
};

/* ─── Reusable primitives ───────────────────────────────────── */
// Compact currency: auto-abbreviates to K / M when digits would overflow
const fmtCompact = (v, prefix = "S$") => {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${prefix}${(v/1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${prefix}${(v/1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${prefix}${(v/1e3).toFixed(1)}K`;
  return `${prefix}${v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
};

const Card = ({ children, style = {}, className }) => (
  <div className={className} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, ...style }}>
    {children}
  </div>
);
const Badge = ({ children, bg, color }) => (
  <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 5, background: bg || T.inputBg, color: color || T.muted, fontWeight: 600 }}>
    {children}
  </span>
);
const Label = ({ children, required }) => (
  <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 6 }}>
    {children}{required && <span style={{ color: T.down, marginLeft: 2 }}>*</span>}
  </div>
);
const Input = ({ placeholder, value, onChange, type = "text", prefix, disabled }) => (
  <div style={{ position: "relative" }}>
    {prefix && <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: T.dim, pointerEvents: "none" }}>{prefix}</span>}
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} disabled={disabled}
      style={{ width: "100%", boxSizing: "border-box", background: disabled ? T.hover : T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: prefix ? "9px 12px 9px 26px" : "9px 12px", fontSize: 13, fontFamily: "inherit", color: disabled ? T.dim : T.text, outline: "none" }} />
  </div>
);
const Sel = ({ value, onChange, options, placeholder }) => (
  <select value={value} onChange={onChange} style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", color: value ? T.text : T.dim, outline: "none", cursor: "pointer" }}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

/* ─── Mobile detection ─────────────────────────────────────── */
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
};

/* ─── Mobile list card — replaces table rows on small screens ── */
const MobileListItem = ({ icon, iconBg, title, subtitle, value, valueSub, valueColor, badge, badgeBg, badgeColor, extra, onClick }) => (
  <div onClick={onClick} style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}`, cursor: onClick ? "pointer" : "default", display:"flex", gap:12, alignItems:"center", background:T.bg }}
    onTouchStart={e => { if (onClick) e.currentTarget.style.background = T.hover; }}
    onTouchEnd={e => { e.currentTarget.style.background = T.bg; }}>
    {icon && (
      <div style={{ width:40, height:40, borderRadius:10, background:iconBg||T.inputBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
    )}
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:14, fontWeight:600, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</div>
      <div style={{ fontSize:12, color:T.muted, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{subtitle}</div>
      {extra && <div style={{ marginTop:4 }}>{extra}</div>}
    </div>
    <div style={{ textAlign:"right", flexShrink:0 }}>
      {value && <div style={{ fontSize:15, fontWeight:700, color:valueColor||T.text }}>{value}</div>}
      {valueSub && <div style={{ fontSize:11, color:T.dim, marginTop:2 }}>{valueSub}</div>}
      {badge && (
        <div style={{ marginTop:4 }}>
          <Badge bg={badgeBg} color={badgeColor}>{badge}</Badge>
        </div>
      )}
    </div>
  </div>
);

/* ─── Mobile posting entry — replaces ledger table on mobile ── */
const MobilePostingsList = ({ journalRows, entryCount, entryLabel }) => {
  // Group rows into transactions (split by _first)
  const groups = [];
  journalRows.forEach(row => {
    if (row._first) groups.push([row]);
    else if (groups.length > 0) groups[groups.length - 1].push(row);
  });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{padding:"12px 16px",background:T.sidebar,borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:13,fontWeight:700}}>Ledger Postings</div>
          <div style={{fontSize:11,color:T.accent,marginTop:2}}>Double-entry · PTA compliant · {entryCount} {entryLabel||"entries"}</div>
        </div>
        <span style={{fontSize:18}}>📒</span>
      </div>
      {groups.map((group, gi) => {
        const header = group.find(r => r._first) || group[0];
        const debits = group.filter(r => r.debit);
        const credits = group.filter(r => !r.debit);
        return (
          <div key={gi} style={{border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden",background:T.bg}}>
            {/* Date + description */}
            <div style={{padding:"10px 14px",background:T.inputBg,borderBottom:`1px solid ${T.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,fontWeight:600,color:T.text}}>{header.date}</span>
                <span style={{fontSize:11,color:T.dim}}>{(() => { if(!header.date)return""; const d=Math.floor((Date.now()-new Date(header.date))/86400000); return d===0?"Today":d===1?"1d ago":d+"d ago"; })()}</span>
              </div>
              {header.desc && <div style={{fontSize:12,color:T.muted,marginTop:3,lineHeight:1.4}}>{header.desc}</div>}
            </div>
            {/* Debit lines */}
            {debits.map((r,i) => (
              <div key={"d"+i} style={{padding:"8px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.border}`}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,color:T.up,fontWeight:600,marginBottom:2}}>DR</div>
                  <div style={{fontSize:12,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.account}</div>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:T.up,flexShrink:0,marginLeft:8}}>{r.amount}</span>
              </div>
            ))}
            {/* Credit lines */}
            {credits.map((r,i) => (
              <div key={"c"+i} style={{padding:"8px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:i<credits.length-1?`1px solid ${T.border}`:"none"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,color:T.down,fontWeight:600,marginBottom:2}}>CR</div>
                  <div style={{fontSize:12,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.account}</div>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:T.down,flexShrink:0,marginLeft:8}}>{r.amount}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

/* ─── Sortable table header ────────────────────────────────── */
const SortHeader = ({ columns, sortKey, sortDir, onSort, gridCols, style }) => (
  <div style={{display:"grid",gridTemplateColumns:gridCols,padding:"9px 20px",background:T.sidebar,borderBottom:`1px solid ${T.border}`,minWidth:700,...style}}>
    {columns.map(([label, align, key, colStyle])=>(
      <div key={label} onClick={key ? ()=>onSort(key) : undefined}
        style={{fontSize:11,color:sortKey===key?T.text:T.muted,fontWeight:sortKey===key?700:500,textAlign:align,cursor:key?"pointer":"default",userSelect:"none",display:"flex",alignItems:"center",gap:3,justifyContent:align==="right"?"flex-end":"flex-start",...(colStyle||{})}}>
        {label}
        {key && <span style={{fontSize:9,color:sortKey===key?T.text:T.dim}}>{sortKey===key?(sortDir==="asc"?"▲":"▼"):"⇅"}</span>}
      </div>
    ))}
  </div>
);

const useSortState = (defaultKey="",defaultDir="asc") => {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);
  const onSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };
  const sortFn = (arr, getVal) => {
    if (!sortKey) return arr;
    const sorted = [...arr].sort((a,b) => {
      const va = getVal(a, sortKey), vb = getVal(b, sortKey);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "string") return va.localeCompare(vb);
      return va - vb;
    });
    return sortDir === "desc" ? sorted.reverse() : sorted;
  };
  return { sortKey, sortDir, onSort, sortFn };
};

/* ─── Mock data ─────────────────────────────────────────────── */
const stockChart = [
  { t: "9:30", c: 186.1 }, { t: "10:00", c: 187.8 }, { t: "10:30", c: 189.1 },
  { t: "11:00", c: 189.5 }, { t: "11:30", c: 188.9 }, { t: "12:00", c: 189.8 },
  { t: "12:30", c: 190.6 }, { t: "13:00", c: 191.0 }, { t: "13:30", c: 190.2 },
  { t: "14:00", c: 189.84 },
];
const portfolioChart = [
  { d: "Apr", v: 84200 }, { d: "May", v: 87500 }, { d: "Jun", v: 83100 },
  { d: "Jul", v: 91400 }, { d: "Aug", v: 89300 }, { d: "Sep", v: 95800 },
  { d: "Oct", v: 102300 }, { d: "Nov", v: 98700 }, { d: "Dec", v: 104500 },
  { d: "Jan", v: 109200 }, { d: "Feb", v: 112800 }, { d: "Mar", v: 118450 },
];
const divData = [
  { m: "Jan", v: 142 }, { m: "Feb", v: 0 }, { m: "Mar", v: 218 }, { m: "Apr", v: 0 },
  { m: "May", v: 0 }, { m: "Jun", v: 198 }, { m: "Jul", v: 142 }, { m: "Aug", v: 0 },
  { m: "Sep", v: 218 }, { m: "Oct", v: 0 }, { m: "Nov", v: 0 }, { m: "Dec", v: 198 },
];
const incomeData = [
  { y: "2020", rev: 274.5, net: 57.4 }, { y: "2021", rev: 365.8, net: 94.7 },
  { y: "2022", rev: 394.3, net: 99.8 }, { y: "2023", rev: 383.3, net: 97.0 },
  { y: "2024", rev: 391.0, net: 101.0 },
];
const HOLDINGS_INIT = [
  { id: 1, sym: "AAPL", name: "Apple Inc.", qty: 45, price: 189.84, cost: 152.30, changeP: +0.66, value: 8542.80, weight: 22.1, sector: "Technology", broker: "Tiger Brokers", addedDate: "Jan 12, 2025", tradeCcy: "USD", exchange: "NASDAQ", marketPrice: 189.84, priceDate: "2026-03-16" },
  { id: 2, sym: "MSFT", name: "Microsoft Corp.", qty: 22, price: 415.60, cost: 310.40, changeP: -0.51, value: 9143.20, weight: 23.7, sector: "Technology", broker: "IBKR", addedDate: "Feb 3, 2025", tradeCcy: "USD", exchange: "NASDAQ", marketPrice: 415.60, priceDate: "2026-03-16" },
  { id: 3, sym: "VOO", name: "Vanguard S&P 500 ETF", qty: 18, price: 498.25, cost: 380.10, changeP: +0.69, value: 8968.50, weight: 23.2, sector: "ETF", broker: "Tiger Brokers", addedDate: "Feb 20, 2025", tradeCcy: "USD", exchange: "NYSE", marketPrice: 498.25, priceDate: "2026-03-16" },
  { id: 4, sym: "NVDA", name: "NVIDIA Corp.", qty: 12, price: 875.40, cost: 420.00, changeP: +1.77, value: 10504.80, weight: 27.2, sector: "Technology", broker: "Moomoo", addedDate: "Mar 1, 2025", tradeCcy: "USD", exchange: "NASDAQ", marketPrice: 875.40, priceDate: "2026-03-16" },
  { id: 5, sym: "JNJ", name: "Johnson & Johnson", qty: 30, price: 152.30, cost: 161.80, changeP: -0.30, value: 4569.00, weight: 11.8, sector: "Healthcare", broker: "IBKR", addedDate: "Mar 8, 2025", tradeCcy: "USD", exchange: "NYSE", marketPrice: 152.30, priceDate: "2026-03-16" },
  { id: 6, sym: "AMZN", name: "Amazon.com Inc.", qty: 8, price: 182.50, cost: 140.20, changeP: +0.92, value: 1460.00, weight: 3.8, sector: "Technology", broker: "Tiger Brokers", addedDate: "Mar 10, 2025", tradeCcy: "USD", exchange: "NASDAQ", marketPrice: 182.50, priceDate: "2026-03-16" },
  { id: 7, sym: "GOOGL", name: "Alphabet Inc.", qty: 15, price: 165.30, cost: 130.80, changeP: -0.44, value: 2479.50, weight: 6.4, sector: "Technology", broker: "IBKR", addedDate: "Mar 12, 2025", tradeCcy: "USD", exchange: "NASDAQ", marketPrice: 165.30, priceDate: "2026-03-16" },
  { id: 8, sym: "META", name: "Meta Platforms Inc.", qty: 10, price: 512.40, cost: 320.00, changeP: +1.21, value: 5124.00, weight: 13.3, sector: "Technology", broker: "Moomoo", addedDate: "Mar 15, 2025", tradeCcy: "USD", exchange: "NASDAQ", marketPrice: 512.40, priceDate: "2026-03-16" },
  { id: 9, sym: "BRK.B", name: "Berkshire Hathaway B", qty: 20, price: 410.10, cost: 360.50, changeP: +0.18, value: 8202.00, weight: 21.2, sector: "Financials", broker: "IBKR", addedDate: "Mar 18, 2025", tradeCcy: "USD", exchange: "NYSE", marketPrice: 410.10, priceDate: "2026-03-16" },
  { id: 10, sym: "VTI", name: "Vanguard Total Market ETF", qty: 25, price: 240.80, cost: 210.40, changeP: +0.55, value: 6020.00, weight: 15.6, sector: "ETF", broker: "Tiger Brokers", addedDate: "Mar 20, 2025", tradeCcy: "USD", exchange: "NYSE", marketPrice: 240.80, priceDate: "2026-03-16" },
];
const allocData = [
  { name: "Technology", value: 73, color: T.accent },
  { name: "ETF", value: 23.2, color: "#8B5CF6" },
  { name: "Healthcare", value: 11.8, color: T.up },
];
const newsItems = [
  { sym: "AAPL", headline: "Apple Vision Pro sales exceed Q2 analyst expectations by 23%", time: "2h ago", sentiment: "bull", source: "Bloomberg" },
  { sym: "NVDA", headline: "NVIDIA announces next-gen Blackwell Ultra GPUs at GTC 2026", time: "4h ago", sentiment: "bull", source: "Reuters" },
  { sym: "MSFT", headline: "Microsoft Azure growth slows to 29% amid cloud market saturation", time: "6h ago", sentiment: "bear", source: "WSJ" },
  { sym: "JNJ", headline: "J&J talc lawsuit settlement approved — $6.5B set aside for claimants", time: "1d ago", sentiment: "neut", source: "FT" },
];
const TICKER_DB = {
  AAPL: "Apple Inc.", MSFT: "Microsoft Corp.", NVDA: "NVIDIA Corp.",
  AMZN: "Amazon.com Inc.", GOOG: "Alphabet Inc.", META: "Meta Platforms",
  TSLA: "Tesla Inc.", VOO: "Vanguard S&P 500 ETF", QQQ: "Invesco QQQ Trust",
  JNJ: "Johnson & Johnson", DIS: "The Walt Disney Co.", VTI: "Vanguard Total Market ETF",
  SPY: "SPDR S&P 500 ETF", BABA: "Alibaba Group",
};
const CURRENCIES = ["SGD", "USD", "HKD", "GBP", "EUR", "AUD"];
const BROKERS = ["Tiger Brokers", "Moomoo", "IBKR", "eToro", "Fidelity", "Schwab", "Other"];
const TX_TYPES = ["Buy", "Sell", "Dividend", "Transfer In", "Transfer Out", "Stock Split"];

/* ─── Toast ─────────────────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  const bg = type === "success" ? T.upBg : type === "error" ? T.downBg : T.warnBg;
  const color = type === "success" ? T.up : type === "error" ? T.down : T.warn;
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 999, background: bg, border: `1px solid ${color}40`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.10)", minWidth: 280 }}>
      <span style={{ color, fontWeight: 700 }}>{type === "success" ? "✓" : type === "error" ? "✕" : "!"}</span>
      <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{msg}</span>
      <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: T.dim, cursor: "pointer", fontSize: 18 }}>×</button>
    </div>
  );
}

/* ─── Ticker search ──────────────────────────────────────────── */
function TickerSearch({ value, onChange, onSelect }) {
  const [open, setOpen] = useState(false);
  const results = value.length > 0
    ? Object.entries(TICKER_DB).filter(([s, n]) => s.startsWith(value.toUpperCase()) || n.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
    : [];
  return (
    <div style={{ position: "relative" }}>
      <input value={value} onChange={e => { onChange(e.target.value.toUpperCase()); setOpen(true); }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="e.g. AAPL"
        style={{ width: "100%", boxSizing: "border-box", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none" }} />
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: 9, boxShadow: "0 6px 20px rgba(0,0,0,0.10)", zIndex: 50, overflow: "hidden" }}>
          {results.map(([sym, name]) => (
            <div key={sym} onMouseDown={() => { onSelect(sym, name); setOpen(false); }}
              style={{ padding: "9px 14px", cursor: "pointer", display: "flex", gap: 10, alignItems: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = T.hover}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: T.inputBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.muted }}>{sym.slice(0, 2)}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{sym}</div>
                <div style={{ fontSize: 11, color: T.dim }}>{name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCREEN COMPONENTS
═══════════════════════════════════════════════════════════════ */

/* ── Overview ───────────────────────────────────────────────── */
function OverviewScreen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="wo-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {[
          { label: "Total Holdings Value", val: "S$118,450.32", sub: "All positions" },
          { label: "Unrealised P&L", val: "+S$22,840", sub: "All-time gain", green: true },
          { label: "Day Change", val: "+S$1,240", sub: "+1.06% today", green: true },
          { label: "Asset Categories", val: "3", sub: "Active categories" },
        ].map((c, i) => (
          <Card key={i} style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 13, color: T.muted }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: T.text, marginTop: 10, letterSpacing: "-0.02em" }}>{c.val}</div>
            <div style={{ fontSize: 12, color: c.green ? T.up : T.muted, marginTop: 4 }}>{c.sub}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <Card style={{ padding: "20px 20px 12px" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Net Worth Trends (12 Months)</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Monthly portfolio value in SGD</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={portfolioChart} barSize={26}>
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: T.dim }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.dim }} axisLine={false} tickLine={false} width={46} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} formatter={v => [`S$${v.toLocaleString()}`, "Value"]} />
              <Bar dataKey="v" fill={T.selected} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Top Movers</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Today's performance</div>
          {HOLDINGS_INIT.map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < HOLDINGS_INIT.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: T.inputBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.muted }}>{h.sym.slice(0, 2)}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{h.sym}</div>
                  <div style={{ fontSize: 10, color: T.dim }}>{h.qty} shares</div>
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: h.changeP >= 0 ? T.up : T.down }}>{h.changeP >= 0 ? "+" : ""}{h.changeP.toFixed(2)}%</span>
            </div>
          ))}
        </Card>
      </div>
      <Card style={{ padding: "20px 22px" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Allocation</div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Portfolio distribution by sector</div>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <PieChart width={120} height={120}>
            <Pie data={allocData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={58} strokeWidth={0}>
              {allocData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
          </PieChart>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            {allocData.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: a.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: T.muted, flex: 1 }}>{a.name}</span>
                <div style={{ flex: 2, height: 5, background: T.inputBg, borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${a.value}%`, background: a.color, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, minWidth: 38, textAlign: "right" }}>{a.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ── Holdings Panel (collapsible) ───────────────────────────── */
function HoldingsPanel() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState("All Categories");
  const [period, setPeriod] = useState("All");
  const totalValue = HOLDINGS_INIT.reduce((s, h) => s + h.value, 0);

  return (
    <Card style={{ padding: 0, overflowX: "auto" }}>
      {/* Collapsible header */}
      <div onClick={() => setOpen(o => !o)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", cursor: "pointer", borderBottom: open ? `1px solid ${T.border}` : "none" }}
        onMouseEnter={e => e.currentTarget.style.background = T.hover}
        onMouseLeave={e => e.currentTarget.style.background = ""}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.inputBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📈</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Stock Holdings</div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>{HOLDINGS_INIT.length} positions · 3 sectors</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>S${totalValue.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div style={{ fontSize: 11, color: T.dim }}>Total market value</div>
          </div>
          <span style={{ fontSize: 16, color: T.dim, display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>⌄</span>
        </div>
      </div>

      {open && (
        <div>
          {/* Filter bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 6 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All Categories", "Technology", "ETF", "Healthcare"].map(f => (
                <button key={f} onClick={e => { e.stopPropagation(); setFilter(f); }} style={{ background: filter === f ? T.selected : "transparent", color: filter === f ? T.selectedText : T.muted, border: `1px solid ${filter === f ? T.selected : T.border}`, borderRadius: 7, padding: "5px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: filter === f ? 600 : 400 }}>{f}</button>
              ))}
            </div>
            {!isMobile && (
            <div style={{ display: "flex", gap: 5 }}>
              {["1M", "3M", "1Y", "All"].map(t => (
                <button key={t} onClick={e => { e.stopPropagation(); setPeriod(t); }} style={{ background: period === t ? T.selected : "transparent", color: period === t ? T.selectedText : T.muted, border: `1px solid ${period === t ? T.selected : T.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>{t}</button>
              ))}
            </div>
            )}
          </div>

          {/* Mobile card list */}
          {isMobile ? (
            HOLDINGS_INIT.filter(h => filter === "All Categories" || h.sector === filter).map((h, i, arr) => {
              const mp = h.marketPrice || h.price || 0;
              const plVal = (mp - h.cost) * h.qty;
              const plPct = h.cost > 0 ? ((mp - h.cost) / h.cost * 100) : 0;
              const plPos = plVal >= 0;
              return <MobileListItem key={i}
                icon={h.sym.slice(0,2)} iconBg={T.inputBg}
                title={h.name} subtitle={`${h.sym} · ${h.exchange} · ${h.qty} shares`}
                value={`S$${toSGD(h.value, h.tradeCcy).toLocaleString(undefined,{maximumFractionDigits:0})}`}
                valueColor={T.text}
                valueSub={`${plPos?"+":""}${plPct.toFixed(1)}%`}
                badge={h.sector} badgeBg={T.inputBg} badgeColor={T.muted}
                extra={<span style={{fontSize:12,fontWeight:600,color:plPos?T.up:T.down}}>{plPos?"+":""}S${Math.abs(toSGD(plVal,h.tradeCcy)).toLocaleString(undefined,{maximumFractionDigits:0})}</span>}
              />;
            })
          ) : (
          <>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 0.6fr 0.7fr 0.9fr 0.9fr 1fr 0.9fr", padding: "9px 20px", background: T.sidebar, borderBottom: `1px solid ${T.border}` }}>
            {[["Assets","left"],["Qty","left"],["Type","left"],["Avg. Cost","right"],["Mkt. Price","right"],["Unrealized P/L","right"],["Value","right"]].map(([h, align]) => (
              <div key={h} style={{ fontSize: 11, color: T.muted, fontWeight: 500, textAlign: align }}>{h}</div>
            ))}
          </div>
          {/* Rows */}
          {HOLDINGS_INIT.filter(h => filter === "All Categories" || h.sector === filter).map((h, i, arr) => {
            const mp     = h.marketPrice || h.price || 0;
            const plVal  = (mp - h.cost) * h.qty;
            const plPct  = h.cost > 0 ? ((mp - h.cost) / h.cost * 100) : 0;
            const plPos  = plVal >= 0;
            return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 0.6fr 0.7fr 0.9fr 0.9fr 1fr 0.9fr", padding: "13px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = T.hover}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: T.inputBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: T.muted }}>{h.sym.slice(0, 2)}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{h.name}</div>
                  <div style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: T.dim }}>{h.sym}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: T.dim, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "1px 5px", letterSpacing: "0.02em" }}>{h.exchange}</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{h.qty}<div style={{ fontSize: 11, color: T.dim, fontWeight: 400 }}>shares</div></div>
              <div><Badge>{h.sector}</Badge></div>
              {/* Avg. Cost */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{h.tradeCcy} {h.cost.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: T.dim }}>avg cost</div>
              </div>
              {/* Market Price */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{h.tradeCcy} {mp.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: T.dim }}>{h.priceDate || "—"}</div>
              </div>
              {/* Unrealized P/L */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: plPos ? T.up : T.down }}>
                  {plPos ? "+" : ""}S${Math.abs(toSGD(plVal, h.tradeCcy)).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: plPos ? T.up : T.down, marginTop: 1 }}>
                  {plPos ? "+" : ""}{plPct.toFixed(2)}%
                </div>
              </div>
              {/* Value */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>S${toSGD(h.value, h.tradeCcy).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                <div style={{ fontSize: 11, color: T.dim }}>{h.tradeCcy !== "SGD" ? `${h.tradeCcy} ${h.value.toLocaleString()}` : ""}</div>
              </div>
            </div>
            );
          })}
          </>
          )}
          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", background: T.sidebar, borderTop: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 11, color: T.dim }}>Prices delayed · FX indicative</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Total S${totalValue.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ── Holdings ───────────────────────────────────────────────── */
const CASH_ACCOUNTS_INIT = [
  { id: 1, name: "POSB Everyday", type: "Checking", currency: "SGD", balance: 8300.00, flag: "🇸🇬", color: "#DC2626" },
  { id: 2, name: "DBS Endowment", type: "Savings", currency: "SGD", balance: 1200.00, flag: "🇸🇬", color: "#DC2626" },
  { id: 3, name: "Tiger Brokers", type: "Brokerage Cash", currency: "USD", balance: 4250.80, flag: "🇺🇸", color: "#3B82F6" },
  { id: 4, name: "IBKR Cash", type: "Brokerage Cash", currency: "USD", balance: 1820.50, flag: "🇺🇸", color: "#3B82F6" },
  { id: 5, name: "Revolut", type: "Multi-currency", currency: "GBP", balance: 620.00, flag: "🇬🇧", color: "#6366F1" },
  { id: 6, name: "Wise", type: "Multi-currency", currency: "EUR", balance: 340.00, flag: "🇪🇺", color: "#0EA5E9" },
];
const FX = { SGD: 1, USD: 1.345, GBP: 1.705, EUR: 1.455, HKD: 0.172, AUD: 0.875 };
const toSGD = (amount, ccy) => amount * (FX[ccy] || 1);

function HoldingsScreen() {
  const isMobile = useIsMobile();
  const [cashOpen, setCashOpen] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [accounts, setAccounts] = useState(CASH_ACCOUNTS_INIT);

  const totalCashSGD = accounts.reduce((s, a) => s + toSGD(a.balance, a.currency), 0);
  const startEdit = (acc) => { setEditId(acc.id); setEditVal(String(acc.balance)); };
  const saveEdit = (id) => {
    const val = parseFloat(editVal);
    if (!isNaN(val) && val >= 0) setAccounts(prev => prev.map(a => a.id === id ? { ...a, balance: val } : a));
    setEditId(null);
  };
  const byCcy = accounts.reduce((m, a) => { (m[a.currency] = m[a.currency] || []).push(a); return m; }, {});

  const totalMarketSGD = HOLDINGS_INIT.reduce((s, h) => s + toSGD((h.marketPrice||h.price)*h.qty, h.tradeCcy), 0);
  const totalCostSGD   = HOLDINGS_INIT.reduce((s, h) => s + toSGD(h.cost * h.qty, h.tradeCcy), 0);
  const totalPL        = totalMarketSGD - totalCostSGD;
  const totalPLPct     = totalCostSGD > 0 ? (totalPL / totalCostSGD * 100) : 0;
  const plPos          = totalPL >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="wo-summary-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card style={{ padding: "22px 24px" }}>
          <div style={{ fontSize: 13, color: T.muted }}>Stocks & Shares Value</div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 6 }}>S$118,450.32</div>
          <div style={{ height: 4, background: T.inputBg, borderRadius: 2, marginTop: 12 }}>
            <div style={{ height: "100%", width: "100%", background: T.accent, borderRadius: 2 }} />
          </div>
          <div style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent }} />
            <span style={{ fontSize: 12, color: T.muted }}>Stocks & Shares</span>
          </div>
        </Card>
        <Card style={{ padding: "22px 24px" }}>
          <div style={{ fontSize: 13, color: T.muted }}>Unrealised P&amp;L</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: plPos ? T.up : T.down, letterSpacing: "-0.03em", marginTop: 6 }}>
            {plPos ? "+" : ""}S${Math.abs(totalPL).toLocaleString("en-SG",{minimumFractionDigits:2,maximumFractionDigits:2})}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: plPos ? T.up : T.down }}>
              {plPos ? "+" : ""}{totalPLPct.toFixed(2)}%
            </span>
            <span style={{ fontSize: 12, color: T.muted }}>· Cost basis: S${totalCostSGD.toLocaleString("en-SG",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
          </div>
        </Card>
      </div>

      {/* ── Cash Accounts ── */}
      <Card style={{ padding: 0, overflowX: "auto" }}>
        <div onClick={() => setCashOpen(o => !o)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", cursor: "pointer", borderBottom: cashOpen ? `1px solid ${T.border}` : "none" }}
          onMouseEnter={e => e.currentTarget.style.background = T.hover}
          onMouseLeave={e => e.currentTarget.style.background = ""}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: T.inputBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>💵</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Cash Accounts</div>
              <div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>{accounts.length} accounts · {Object.keys(byCcy).length} currencies</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>S${totalCashSGD.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style={{ fontSize: 11, color: T.dim }}>Total in SGD equiv.</div>
            </div>
            <span style={{ fontSize: 16, color: T.dim, display: "inline-block", transform: cashOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>⌄</span>
          </div>
        </div>
        {cashOpen && (
          <div>
            {/* Currency balance rows */}
            {Object.entries(byCcy).map(([ccy, accs], i, arr) => {
              const total = accs.reduce((s, a) => s + a.balance, 0);
              const sgd = toSGD(total, ccy);
              const pct = (sgd / (Object.entries(byCcy).reduce((s, [c, as]) => s + toSGD(as.reduce((x, a) => x + a.balance, 0), c), 0))) * 100;
              return isMobile ? (
                <MobileListItem key={ccy}
                  icon={accs[0].flag} iconBg={T.inputBg} title={ccy} subtitle={`${accs.length} account${accs.length!==1?"s":""} · ${pct.toFixed(1)}%`}
                  value={`${ccy} ${total.toLocaleString("en",{minimumFractionDigits:2})}`} valueColor={T.text}
                  valueSub={`≈ S$${sgd.toLocaleString("en-SG",{minimumFractionDigits:2})}`}
                />
              ) : (
                <div key={ccy} style={{ display: "flex", alignItems: "center", padding: "13px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", width: 100 }}>
                    <span style={{ fontSize: 20 }}>{accs[0].flag}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{ccy}</span>
                  </div>
                  <div style={{ flex: 1, margin: "0 20px" }}>
                    <div style={{ height: 5, background: T.inputBg, borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: T.selected, borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 240, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14 }}>
                    <span style={{ fontSize: 12, color: T.dim, fontWeight: 500 }}>{pct.toFixed(1)}%</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{ccy} {total.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>≈ S${sgd.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", background: T.sidebar, borderTop: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 11, color: T.dim }}>FX rates are indicative</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Total ≈ S${totalCashSGD.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}
      </Card>
      {/* ── Holdings collapsible panel ── */}
      <HoldingsPanel />
    </div>
  );
}

/* ── Stock Chart ─────────────────────────────────────────────── */
function ChartScreen({ holdings }) {
  const isMobile = useIsMobile();
  const list = holdings && holdings.length > 0 ? holdings : HOLDINGS_INIT;
  const [tf, setTf] = useState("1D");
  const [ticker, setTicker] = useState((list[0] && list[0].sym) || "AAPL");
  const [search, setSearch] = useState("");
  const [dropOpen, setDropOpen] = useState(false);

  // keep ticker valid if holdings change
  const h = list.find(x => x.sym === ticker) || list[0] || HOLDINGS_INIT[0];

  const SHOW_PILLS = 6; // max pills before switching to dropdown
  const usePills = list.length <= SHOW_PILLS;
  const filtered = list.filter(x => x.sym.toLowerCase().includes(search.toLowerCase()) || x.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Ticker selector — pills for ≤6, searchable dropdown for >6 */}
      {usePills ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {list.map(hh => (
            <button key={hh.sym} onClick={() => setTicker(hh.sym)} style={{ background: ticker === hh.sym ? T.selected : "transparent", color: ticker === hh.sym ? T.selectedText : T.muted, border: `1px solid ${ticker === hh.sym ? T.selected : T.border}`, borderRadius: 8, padding: "6px 18px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>{hh.sym}</button>
          ))}
        </div>
      ) : (
        <div style={{ position: "relative", maxWidth: 320 }}>
          <div onClick={() => setDropOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.inputBg, border: `1px solid ${dropOpen ? T.selected : T.border}`, borderRadius: 9, padding: "9px 14px", cursor: "pointer", userSelect: "none" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: T.card, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.muted }}>{h.sym.slice(0,2)}</div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{h.sym}</span>
                <span style={{ fontSize: 12, color: T.dim, marginLeft: 7 }}>{h.name}</span>
              </div>
            </div>
            <span style={{ fontSize: 12, color: T.dim, marginLeft: 12 }}>▾</span>
          </div>
          {dropOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 50, overflow: "hidden" }}>
              <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}` }}>
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search holdings…"
                  style={{ width: "100%", boxSizing: "border-box", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 10px", fontSize: 12, fontFamily: "inherit", color: T.text, outline: "none" }} />
              </div>
              <div style={{ maxHeight: 220, overflowY: "auto" }}>
                {filtered.length === 0 && <div style={{ padding: "14px", textAlign: "center", fontSize: 12, color: T.dim }}>No match</div>}
                {filtered.map(hh => (
                  <div key={hh.sym} onClick={() => { setTicker(hh.sym); setDropOpen(false); setSearch(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: ticker === hh.sym ? T.hover : "transparent" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.hover}
                    onMouseLeave={e => e.currentTarget.style.background = ticker === hh.sym ? T.hover : ""}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: T.inputBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.muted }}>{hh.sym.slice(0,2)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{hh.sym}</div>
                      <div style={{ fontSize: 11, color: T.dim }}>{hh.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: hh.changeP >= 0 ? T.up : T.down }}>{hh.changeP >= 0 ? "+" : ""}{hh.changeP.toFixed(2)}%</div>
                      <div style={{ fontSize: 10, color: T.dim }}>{hh.qty} shares</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "8px 14px", borderTop: `1px solid ${T.border}`, background: T.sidebar }}>
                <span style={{ fontSize: 11, color: T.dim }}>{list.length} holdings</span>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Stock header card */}
      <Card style={{ padding: "22px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: T.inputBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: T.muted }}>{h.sym.slice(0, 2)}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{h.name}</div>
            <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>{h.sym} · {h.exchange || "—"} · {h.sector}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em" }}>S${h.price.toFixed(2)}</div>
          <div style={{ fontSize: 13, color: h.changeP >= 0 ? T.up : T.down, marginTop: 2, fontWeight: 600 }}>
            {h.changeP >= 0 ? "+" : ""}S${Math.abs(((h.price - h.cost) / h.cost * h.price * 0.01)).toFixed(2)} ({h.changeP >= 0 ? "+" : ""}{h.changeP.toFixed(2)}%) today
          </div>
        </div>
      </Card>
      {/* Chart card */}
      <Card style={{ padding: "20px 20px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 5 }}>
            {["1D", "5D", "1M", "3M", "1Y", "MAX"].map(t => (
              <button key={t} onClick={() => setTf(t)} style={{ background: tf === t ? T.selected : "transparent", color: tf === t ? T.selectedText : T.muted, border: `1px solid ${tf === t ? T.selected : T.border}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: tf === t ? 600 : 400 }}>{t}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {["Line", "Candle", "Area"].map((v, i) => (
              <button key={v} style={{ background: i === 0 ? T.inputBg : "transparent", color: i === 0 ? T.text : T.dim, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{v}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={stockChart}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.accent} stopOpacity={0.15} />
                <stop offset="100%" stopColor={T.accent} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" tick={{ fontSize: 11, fill: T.dim }} axisLine={false} tickLine={false} />
            <YAxis domain={[184, 192]} tick={{ fontSize: 11, fill: T.dim }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="c" stroke={T.accent} strokeWidth={2} fill="url(#cg)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      {/* Stats grid */}
      {isMobile ? (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            {[
              { l: "Open", v: "S$188.60" }, { l: "52W High", v: "S$199.62" }, { l: "Market Cap", v: "S$2.94T" }, { l: "P/E Ratio", v: "31.2×" },
              { l: "Volume", v: "97.2M" }, { l: "52W Low", v: "S$164.08" }, { l: "Avg Volume", v: "54.8M" }, { l: "Dividend Yield", v: "0.53%" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "10px 14px", borderBottom: i < 6 ? `1px solid ${T.border}` : "none", borderRight: i % 2 === 0 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ fontSize: 11, color: T.muted }}>{s.l}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="wo-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { l: "Open", v: "S$188.60" }, { l: "52W High", v: "S$199.62" }, { l: "Market Cap", v: "S$2.94T" }, { l: "P/E Ratio", v: "31.2×" },
            { l: "Volume", v: "97.2M" }, { l: "52W Low", v: "S$164.08" }, { l: "Avg Volume", v: "54.8M" }, { l: "Dividend Yield", v: "0.53%" },
          ].map((s, i) => (
            <Card key={i} style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 5 }}>{s.l}</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{s.v}</div>
            </Card>
          ))}
        </div>
      )}
      {/* Analyst consensus */}
      <Card style={{ padding: "18px 22px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Analyst Consensus</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Badge bg={T.upBg} color={T.up}>BUY</Badge>
            <span style={{ fontSize: 13, color: T.muted }}>32 analysts · avg target</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>S$215.40 <span style={{ color: T.up, fontSize: 13 }}>+13.5%</span></div>
        </div>
        <div style={{ height: 6, background: T.inputBg, borderRadius: 3 }}>
          <div style={{ height: "100%", width: "73%", background: T.up, borderRadius: 3 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: T.muted }}>
          <span style={{ color: T.up }}>23 Buy</span><span>7 Hold</span><span style={{ color: T.down }}>2 Sell</span>
        </div>
      </Card>
    </div>
  );
}

/* ── Fundamentals ────────────────────────────────────────────── */
function FundamentalsScreen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
        {["Income Statement", "Balance Sheet", "Cash Flow", "Key Ratios"].map((t, i) => (
          <button key={t} style={{ background: i === 0 ? T.selected : T.inputBg, color: i === 0 ? T.selectedText : T.muted, border: "none", borderRadius: 8, padding: "6px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: i === 0 ? 600 : 400 }}>{t}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { l: "P/E Ratio", v: "31.2×", note: "vs 25.4× sector", up: false },
          { l: "Gross Margin", v: "46.2%", note: "↑ from 43.3%", up: true },
          { l: "Net Margin", v: "25.8%", note: "↑ from 24.6%", up: true },
          { l: "ROE", v: "171.9%", note: "Top quartile", up: true },
          { l: "EV/EBITDA", v: "24.1×", note: "vs 18.6× sector", up: false },
          { l: "Debt/Equity", v: "1.81×", note: "Manageable", up: true },
        ].map((r, i) => (
          <Card key={i} style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: T.dim, marginBottom: 7 }}>{r.l}</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>{r.v}</div>
            <div style={{ fontSize: 11, color: r.up ? T.up : T.down, marginTop: 5 }}>{r.note}</div>
          </Card>
        ))}
      </div>
      <Card style={{ padding: "20px 20px 12px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Income Statement (USD Billions)</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={incomeData} barGap={4}>
            <XAxis dataKey="y" tick={{ fontSize: 11, fill: T.dim }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: T.dim }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="rev" fill={T.selected} radius={[3, 3, 0, 0]} />
            <Bar dataKey="net" fill={T.accent} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* ── Dividends ───────────────────────────────────────────────── */
/* ── Add Dividend Modal ──────────────────────────────────────── */
const US_EXCHANGES = ["NASDAQ", "NYSE", "AMEX"];
const WITHHOLD_RATE = 0.30;

function AddDividendModal({ onClose, onAdd }) {
  const [sym, setSym] = useState("");
  const [payDate, setPayDate] = useState("");
  const [eps, setEps] = useState("");
  const [symOpen, setSymOpen] = useState(false);

  const holding = HOLDINGS_INIT.find(h => h.sym === sym);
  const qty = holding ? holding.qty : 0;
  const autoUS = holding ? US_EXCHANGES.includes(holding.exchange) : false;
  const [isUS, setIsUS] = useState(false);

  // auto-tick when holding changes
  useEffect(() => { setIsUS(autoUS); }, [sym]);

  const gross = qty && eps ? parseFloat(eps) * qty * 1.345 : 0;  // USD->SGD
  const withhold = isUS ? gross * WITHHOLD_RATE : 0;
  const net = gross - withhold;
  const canSubmit = sym && payDate && eps && parseFloat(eps) > 0;

  const filtered = HOLDINGS_INIT.filter(h =>
    h.sym.toLowerCase().includes(sym.toLowerCase()) || h.name.toLowerCase().includes(sym.toLowerCase())
  );

  const handleAdd = () => {
    onAdd({ sym, payDate, perShare: parseFloat(eps), qty, gross, withhold, net, isUS, exchange: holding ? holding.exchange : undefined });
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      {/* Modal */}
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 201, background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, width: 480, maxWidth: "calc(100vw - 32px)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Add Dividend Manually</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Record a dividend not shown in the calendar</div>
          </div>
          <button onClick={onClose} style={{ background: T.inputBg, border: "none", borderRadius: 7, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: T.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Form */}
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Ticker */}
          <div>
            <Label required>Stock / Ticker</Label>
            <div style={{ position: "relative" }}>
              <input value={sym} onChange={e => { setSym(e.target.value.toUpperCase()); setSymOpen(true); }} onFocus={() => setSymOpen(true)} onBlur={() => setTimeout(() => setSymOpen(false), 150)}
                placeholder="e.g. AAPL"
                style={{ width: "100%", boxSizing: "border-box", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none" }} />
              {symOpen && filtered.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: 9, boxShadow: "0 6px 20px rgba(0,0,0,0.10)", zIndex: 10, overflow: "hidden" }}>
                  {filtered.map(h => (
                    <div key={h.sym} onMouseDown={() => { setSym(h.sym); setSymOpen(false); }}
                      style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 14px", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.hover}
                      onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: T.inputBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.muted }}>{h.sym.slice(0,2)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{h.sym}</div>
                        <div style={{ fontSize: 11, color: T.dim }}>{h.name} · {h.qty} shares</div>
                      </div>
                      <Badge>{h.exchange}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {holding && (
              <div style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>
                You hold <strong>{qty} shares</strong> · traded on <strong>{holding.exchange}</strong>
              </div>
            )}
          </div>

          {/* Date + EPS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Label required>Payout Date</Label>
              <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
            </div>
            <div>
              <Label required>Earnings Per Share (USD)</Label>
              <Input type="number" placeholder="0.00" prefix="$" value={eps} onChange={e => setEps(e.target.value)} />
            </div>
          </div>

          {/* US withholding tax checkbox */}
          <div onClick={() => setIsUS(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: isUS ? T.downBg : T.inputBg, border: `1px solid ${isUS ? T.down + "40" : T.border}`, borderRadius: 10, cursor: "pointer", userSelect: "none", transition: "all 0.15s" }}>
            {/* Custom checkbox */}
            <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${isUS ? T.down : T.dim}`, background: isUS ? T.down : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
              {isUS && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1 }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: isUS ? T.down : T.text }}>US Stock Market (Apply 30% Withholding Tax)</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                {isUS ? "A 30% withholding tax will be deducted from your gross dividend under IRS rules." : "No withholding tax deduction — full gross amount paid out."}
              </div>
            </div>
            {isUS && <Badge bg={T.downBg} color={T.down}>−30%</Badge>}
          </div>

          {/* Calculation summary */}
          {canSubmit && (
            <div style={{ background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 2 }}>Payout Breakdown</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: T.muted }}>Gross ({qty} shares × USD {parseFloat(eps).toFixed(2)})</span>
                <span style={{ fontWeight: 500 }}>S${gross.toFixed(2)}</span>
              </div>
              {isUS && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: T.down }}>US Withholding Tax (30%)</span>
                  <span style={{ fontWeight: 500, color: T.down }}>− S${withhold.toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ fontWeight: 600 }}>Net Received</span>
                <span style={{ fontWeight: 700, color: T.up }}>S${net.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, padding: "14px 22px", borderTop: `1px solid ${T.border}`, background: T.sidebar }}>
          <button onClick={handleAdd} disabled={!canSubmit}
            style={{ flex: 1, background: canSubmit ? T.selected : T.inputBg, color: canSubmit ? T.selectedText : T.dim, border: "none", borderRadius: 9, padding: "11px", fontSize: 13, fontWeight: 600, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            + Add to Dividend Log
          </button>
          <button onClick={onClose} style={{ background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: 9, padding: "11px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
        </div>
      </div>
    </>
  );
}

// Dividend schedule: payDate as "YYYY-MM-DD", perShare in USD
const DIVIDEND_SCHEDULE = [
  { sym: "AAPL",  payDate: "2026-03-10", perShare: 0.25,  color: T.accent },
  { sym: "JNJ",   payDate: "2026-03-10", perShare: 1.24,  color: T.up },
  { sym: "MSFT",  payDate: "2026-03-15", perShare: 0.75,  color: "#8B5CF6" },
  { sym: "VOO",   payDate: "2026-03-21", perShare: 1.65,  color: T.accent },
  { sym: "VTI",   payDate: "2026-03-21", perShare: 0.88,  color: "#0EA5E9" },
  { sym: "BRK.B", payDate: "2026-03-28", perShare: 0.00,  color: T.muted },
];

function DividendsScreen({ manualDivs = [] }) {
  const isMobile = useIsMobile();
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const todayDay = new Date().getDate();

  // Notifications: dividends due today, keyed by sym
  const todayDivs = DIVIDEND_SCHEDULE.filter(d => d.payDate === today);

  // confirmation state: { [sym]: "yes" | "no" | null }
  const initConfirm = Object.fromEntries(todayDivs.map(d => [d.sym, null]));
  const [confirmed, setConfirmed] = useState(initConfirm);

  // Build calendar events from schedule for current month (March 2026)
  const calEvents = {};
  DIVIDEND_SCHEDULE.forEach(d => {
    const day = parseInt(d.payDate.slice(8));
    const month = d.payDate.slice(0, 7);
    if (month === "2026-03") {
      if (!calEvents[day]) calEvents[day] = [];
      calEvents[day].push({ sym: d.sym, color: d.color });
    }
  });

  // Holdings lookup for qty
  const holdingQty = HOLDINGS_INIT.reduce((m, h) => { m[h.sym] = h.qty; return m; }, {});

  const pendingCount = todayDivs.filter(d => confirmed[d.sym] === null).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Today's Dividend Notifications ── */}
      {todayDivs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Today's Dividend Payouts</div>
            {pendingCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: T.warnBg, color: T.warn, borderRadius: 20, padding: "2px 9px" }}>
                {pendingCount} awaiting confirmation
              </span>
            )}
          </div>
          {todayDivs.map(d => {
            const qty = holdingQty[d.sym] || 0;
            const total = (d.perShare * qty * 1.345).toFixed(2); // convert USD→SGD
            const status = confirmed[d.sym];
            return (
              <div key={d.sym} style={{
                border: `1px solid ${status === "yes" ? T.up + "50" : status === "no" ? T.down + "40" : T.warn + "60"}`,
                borderRadius: 12,
                background: status === "yes" ? T.upBg : status === "no" ? T.downBg : T.warnBg,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}>
                {/* Stock badge */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: d.color + "20", border: `1px solid ${d.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: d.color, flexShrink: 0 }}>
                  {d.sym.slice(0, 2)}
                </div>
                {/* Message */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                    {status === null
                      ? <>Did you receive your <strong>{d.sym}</strong> dividend today?</>
                      : status === "yes"
                      ? <><strong>{d.sym}</strong> dividend confirmed as received ✓</>
                      : <><strong>{d.sym}</strong> dividend marked as not yet received</>}
                  </div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
                    {qty} shares × {d.perShare > 0 ? `USD ${d.perShare.toFixed(2)}/share` : "no dividend issued"} = <strong>S${total}</strong> expected
                  </div>
                </div>
                {/* Action buttons or status */}
                {status === null ? (
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => setConfirmed(c => ({ ...c, [d.sym]: "yes" }))}
                      style={{ background: T.up, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      ✓ Yes
                    </button>
                    <button onClick={() => setConfirmed(c => ({ ...c, [d.sym]: "no" }))}
                      style={{ background: T.card, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                      ✗ No
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                    <span style={{ fontSize: 20 }}>{status === "yes" ? "💰" : "⏳"}</span>
                    <button onClick={() => setConfirmed(c => ({ ...c, [d.sym]: null }))}
                      style={{ background: "transparent", color: T.dim, border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      Undo
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isMobile ? (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            {[{ l: "Projected Annual Income", v: "S$1,916" }, { l: "YTD Received", v: "S$360.00" }, { l: "Yield on Cost", v: "2.14%" }].map((s, i) => (
              <div key={i} style={{ padding: "12px 14px", borderBottom: i < 2 ? `1px solid ${T.border}` : "none", borderRight: i % 2 === 0 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ fontSize: 11, color: T.muted }}>{s.l}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 3 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="wo-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {[{ l: "Projected Annual Income", v: "S$1,916" }, { l: "YTD Received", v: "S$360.00" }, { l: "Yield on Cost", v: "2.14%" }].map((s, i) => (
            <Card key={i} style={{ padding: "20px 22px" }}>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>{s.l}</div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{s.v}</div>
            </Card>
          ))}
        </div>
      )}
      <Card style={{ padding: "20px 22px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Dividend Calendar · March 2026</div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Ex-div and payment dates across your holdings</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, color: T.dim, paddingBottom: 4, fontWeight: 500 }}>{d}</div>
          ))}
          {[null, null, null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((d, idx) => {
            const evs = d ? calEvents[d] : null;
            const isToday = d === todayDay;
            return (
              <div key={idx} style={{ height: 38, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 7, background: isToday ? T.selected : evs ? evs[0].color + "15" : d ? T.inputBg : "transparent", border: `2px solid ${isToday ? T.selected : evs ? evs[0].color + "50" : "transparent"}` }}>
                {d && <span style={{ fontSize: 11, color: isToday ? T.selectedText : evs ? evs[0].color : T.muted, fontWeight: isToday || evs ? 700 : 400 }}>{d}</span>}
                {evs && !isToday && <span style={{ fontSize: 8, color: evs[0].color, fontWeight: 700, lineHeight: 1 }}>{evs.map(e => e.sym).join(" ")}</span>}
                {isToday && <span style={{ fontSize: 7, color: T.selectedText, fontWeight: 700, lineHeight: 1 }}>TODAY</span>}
              </div>
            );
          })}
        </div>
        {/* Calendar legend */}
        <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
          {DIVIDEND_SCHEDULE.filter(d => d.payDate.startsWith("2026-03")).map(d => (
            <div key={d.sym} style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
              <span style={{ fontSize: 11, color: T.muted }}>{d.sym} — {new Date(d.payDate).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card style={{ padding: "20px 20px 12px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Monthly Dividend Income (SGD)</div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={divData}>
            <XAxis dataKey="m" tick={{ fontSize: 11, fill: T.dim }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: T.dim }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} formatter={v => [`S$${v}`, "Dividend"]} />
            <Bar dataKey="v" fill={T.selected} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Manual Dividend Log ── */}
      {manualDivs.length > 0 && (
        <Card style={{ padding: 0, overflowX: "auto" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Manually Added Dividends</span>
            <Badge bg={T.accentBg} color={T.accent}>{manualDivs.length}</Badge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", padding: "8px 20px", background: T.sidebar, borderBottom: `1px solid ${T.border}` }}>
            {["Stock", "Payout Date", "Exchange", "Per Share", "Net (SGD)"].map((h, i) => (
              <div key={i} style={{ fontSize: 11, color: T.muted, fontWeight: 500, textAlign: i > 1 ? "right" : "left" }}>{h}</div>
            ))}
          </div>
          {manualDivs.map((d, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", padding: "12px 20px", borderBottom: i < manualDivs.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{d.sym}<div style={{ fontSize: 11, color: T.dim, fontWeight: 400 }}>{d.qty} shares</div></div>
              <div style={{ fontSize: 13, color: T.muted }}>{new Date(d.payDate).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</div>
              <div style={{ textAlign: "right" }}><Badge bg={d.isUS ? T.downBg : T.upBg} color={d.isUS ? T.down : T.up}>{d.exchange}</Badge></div>
              <div style={{ textAlign: "right", fontSize: 13 }}>USD {parseFloat(d.perShare).toFixed(4)}</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.up }}>S${d.net.toFixed(2)}</div>
                {d.isUS && <div style={{ fontSize: 10, color: T.down }}>−S${d.withhold.toFixed(2)} withheld</div>}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ── News & Sentiment ────────────────────────────────────────── */
function NewsScreen() {
  const sc = { bull: T.up, bear: T.down, neut: T.warn };
  const sb = { bull: T.upBg, bear: T.downBg, neut: T.warnBg };
  const sl = { bull: "Bullish", bear: "Bearish", neut: "Neutral" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card style={{ padding: 0, overflowX: "auto" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 14, fontWeight: 600 }}>Latest News</div>
        {newsItems.map((n, i) => (
          <div key={i} style={{ padding: "15px 20px", borderBottom: i < newsItems.length - 1 ? `1px solid ${T.border}` : "none", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = T.hover}
            onMouseLeave={e => e.currentTarget.style.background = ""}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7 }}>
                <Badge bg={sb[n.sentiment]} color={sc[n.sentiment]}>{sl[n.sentiment]}</Badge>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{n.sym}</span>
                <span style={{ fontSize: 11, color: T.dim }}>· {n.source}</span>
              </div>
              <span style={{ fontSize: 11, color: T.dim, marginLeft: 16, flexShrink: 0 }}>{n.time}</span>
            </div>
            <div style={{ fontSize: 13, color: T.text, lineHeight: 1.55, fontWeight: 500 }}>{n.headline}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ── AI Agent ────────────────────────────────────────────────── */
function AIScreen() {
  const [input, setInput] = useState("");
  const msgs = [
    { role: "ai", text: "Good morning, Dilwyn! Your portfolio is up +S$1,240 (+1.06%) today. NVDA is your top performer at +1.77%. Want a breakdown?" },
    { role: "user", text: "Why is my tech weighting so high?" },
    { role: "ai", text: "Your tech exposure is 73% (AAPL + MSFT + NVDA), above the recommended 30–40%. NVDA alone is 27.2%. Consider trimming NVDA by ~10% and redeploying into healthcare or consumer staples." },
  ];
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        <Card style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14, minHeight: 340 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
              {m.role === "ai" && <div style={{ width: 28, height: 28, borderRadius: 7, background: T.selected, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: T.selectedText, fontWeight: 700, flexShrink: 0 }}>AI</div>}
              <div style={{ maxWidth: "78%", background: m.role === "user" ? T.selected : T.inputBg, color: m.role === "user" ? T.selectedText : T.text, borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "3px 12px 12px 12px", padding: "11px 14px", fontSize: 13, lineHeight: 1.55 }}>{m.text}</div>
            </div>
          ))}
        </Card>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything about your portfolio…"
            style={{ flex: 1, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none" }} />
          <button style={{ background: T.selected, color: T.selectedText, border: "none", borderRadius: 9, padding: "10px 22px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Send</button>
        </div>
      </div>
      <div style={{ width: 210, display: "flex", flexDirection: "column", gap: 12 }}>
        <Card style={{ padding: "18px" }}>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>AI Portfolio Score</div>
          <div style={{ fontSize: 44, fontWeight: 800, textAlign: "center", letterSpacing: "-0.04em" }}>74</div>
          <div style={{ fontSize: 11, color: T.dim, textAlign: "center", marginBottom: 14 }}>/100 — Good</div>
          {[{ l: "Diversification", v: 45, c: T.down }, { l: "Cost efficiency", v: 82, c: T.up }, { l: "Risk profile", v: 68, c: T.warn }].map((r, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, marginBottom: 3 }}>
                <span>{r.l}</span><span style={{ color: r.c, fontWeight: 600 }}>{r.v}</span>
              </div>
              <div style={{ height: 4, background: T.inputBg, borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${r.v}%`, background: r.c, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MANAGE STOCKS SCREEN — ADD / REMOVE / HISTORY / API TABS
══════════════════════════════════════════════════════════════ */
function ManageScreen({ holdings, setHoldings, transactions, setTransactions, showToast }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("add");
  const [divWithhold, setDivWithhold] = useState(false);
  const [histSearch, setHistSearch] = useState("");
  const [histTypeFilter, setHistTypeFilter] = useState("All");
  const [histSort, setHistSort] = useState({ col: "date", dir: "desc" });

  /* ── Add form state ── */
  const EMPTY = { sym: "", name: "", txType: "Buy", date: "", qty: "", price: "", fees: "", currency: "SGD", broker: "", notes: "" };
  const [form, setForm] = useState(EMPTY);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const total = form.qty && form.price ? (parseFloat(form.qty) * parseFloat(form.price) + parseFloat(form.fees || 0)).toFixed(2) : null;

  const handleAdd = () => {
    if (!form.sym || !form.qty || !form.price || !form.date) return;
    const existing = holdings.find(h => h.sym === form.sym);
    if (existing && (form.txType === "Buy" || form.txType === "Transfer In")) {
      const totalCost = existing.cost * existing.qty + parseFloat(form.price) * parseFloat(form.qty);
      const totalQty = existing.qty + parseFloat(form.qty);
      setHoldings(prev => prev.map(h => h.sym === form.sym ? { ...h, qty: totalQty, cost: totalCost / totalQty } : h));
    } else if (form.txType === "Buy" || form.txType === "Transfer In") {
      setHoldings(prev => [...prev, { id: Date.now(), sym: form.sym, name: form.name || form.sym, qty: parseFloat(form.qty), price: parseFloat(form.price), cost: parseFloat(form.price), changeP: 0, value: parseFloat(form.qty) * parseFloat(form.price), weight: 0, sector: "Other", broker: form.broker || "Manual", addedDate: form.date }]);
    }
    setTransactions(prev => [...prev, { ...form, id: Date.now() }]);
    showToast(`${form.txType} recorded — ${form.qty} shares of ${form.sym}`, "success");
    setForm(EMPTY);
    setTab("history");
  };

  /* ── Remove / sell state ── */
  const [confirmId, setConfirmId] = useState(null);
  const [partialId, setPartialId] = useState(null);
  const [sellF, setSellF] = useState({ qty: "", price: "", date: "", fees: "" });
  const [priceF, setPriceF] = useState({ price: "" });
  const [updatePriceId, setUpdatePriceId] = useState(null);
  const [search, setSearch] = useState("");

  const handleRemove = (id) => {
    const h = holdings.find(x => x.id === id);
    setHoldings(prev => prev.filter(x => x.id !== id));
    setConfirmId(null);
    showToast(`${h.sym} removed from portfolio`, "error");
  };
  const handleSell = (h) => {
    const qty = parseFloat(sellF.qty);
    if (!qty || qty <= 0 || qty > h.qty || !sellF.price || !sellF.date) return;
    if (qty >= h.qty) {
      setHoldings(prev => prev.filter(x => x.id !== h.id));
    } else {
      setHoldings(prev => prev.map(x => x.id === h.id ? { ...x, qty: x.qty - qty } : x));
    }
    setTransactions(prev => [...prev, { id: Date.now(), sym: h.sym, txType: "Sell", qty: sellF.qty, price: sellF.price, fees: sellF.fees, date: sellF.date, broker: h.broker, currency: "SGD" }]);
    setPartialId(null);
    setSellF({ qty: "", price: "", date: "", fees: "" });
    showToast(`Sold ${sellF.qty} shares of ${h.sym}`, "success");
  };

  const filtered = holdings.filter(h => h.sym.toLowerCase().includes(search.toLowerCase()) || h.name.toLowerCase().includes(search.toLowerCase()));

  const TABS = [
    { id: "add",      label: "Add Stock",         icon: "+" },
    { id: "remove",   label: `Holdings (${holdings.length})`,    icon: "⊟" },
    { id: "history",  label: `Transactions (${transactions.length})`, icon: "☰" },
    { id: "postings", label: "Postings",           icon: "" },
    { id: "api",      label: "Integrations",       icon: "🔗", badge: "Soon" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Inner tab bar */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: 22, marginLeft: -32, marginRight: -32, paddingLeft: 32, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "transparent", color: tab === t.id ? T.text : T.muted, border: "none", borderBottom: `2px solid ${tab === t.id ? T.selected : "transparent"}`, padding: "10px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: tab === t.id ? 600 : 400, display: "flex", alignItems: "center", gap: 5, marginBottom: -1, whiteSpace: "nowrap", flexShrink: 0 }}>
            <span style={{ fontSize: 13 }}>{t.icon}</span>{t.label}
            {t.badge && <Badge bg={T.warnBg} color={T.warn}>{t.badge}</Badge>}
          </button>
        ))}
      </div>

      {/* ── ADD TAB ── */}
      {tab === "add" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Transaction Type</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TX_TYPES.map(t => {
                const disabled = ["Transfer In", "Transfer Out", "Stock Split"].includes(t);
                const active = form.txType === t;
                return (
                  <div key={t} style={{ position: "relative" }}>
                    <button
                      onClick={() => !disabled && setF("txType", t)}
                      style={{
                        background: disabled ? T.sidebar : active ? T.selected : T.inputBg,
                        color: disabled ? T.dim : active ? T.selectedText : T.muted,
                        border: `1px solid ${disabled ? T.border : active ? T.selected : T.border}`,
                        borderRadius: 8, padding: "7px 16px", fontSize: 12,
                        cursor: disabled ? "not-allowed" : "pointer",
                        fontFamily: "inherit", fontWeight: active ? 600 : 400,
                        opacity: disabled ? 0.6 : 1,
                      }}>
                      {t}
                    </button>
                    {disabled && (
                      <span style={{ position: "absolute", top: -7, right: -4, fontSize: 9, fontWeight: 700, background: T.warnBg, color: T.warn, borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap", pointerEvents: "none" }}>Soon</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card style={{ padding: "22px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 18 }}>Stock Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Ticker — restricted to holdings for Sell & Dividend */}
              <div>
                <Label required>Ticker Symbol</Label>
                {form.txType === "Sell" || form.txType === "Dividend" ? (
                  <div>
                    <select value={form.sym} onChange={e => {
                        const h = holdings.find(x => x.sym === e.target.value);
                        setF("sym", e.target.value);
                        setF("name", h ? h.name : "");
                      }}
                      style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", color: form.sym ? T.text : T.dim, outline: "none", cursor: "pointer" }}>
                      <option value="">Select a holding…</option>
                      {holdings.map(h => (
                        <option key={h.sym} value={h.sym}>{h.sym} — {h.name} ({h.qty} shares)</option>
                      ))}
                    </select>
                    {form.sym && (() => {
                      const h = holdings.find(x => x.sym === form.sym);
                      return h ? (
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 5, display: "flex", gap: 6, alignItems: "center" }}>
                          <span>Holding: <strong>{h.qty} shares</strong></span>
                          <Badge>{h.exchange}</Badge>
                        </div>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <TickerSearch value={form.sym} onChange={v => setF("sym", v)} onSelect={(sym, name) => { setF("sym", sym); setF("name", name); }} />
                )}
              </div>
              <div>
                <Label>Company / Fund Name</Label>
                <Input placeholder="Auto-filled from ticker" value={form.name} onChange={e => setF("name", e.target.value)} disabled={!!form.name} />
              </div>
              <div>
                <Label required>Transaction Date</Label>
                <Input type="date" value={form.date} onChange={e => setF("date", e.target.value)} />
              </div>
              <div>
                <Label required>Currency</Label>
                <Sel value={form.currency} onChange={e => setF("currency", e.target.value)} options={CURRENCIES} />
              </div>
              <div>
                <Label required>{form.txType === "Dividend" ? "Earnings Per Share" : "Number of Shares"}</Label>
                <Input type="number" placeholder="0.00" value={form.qty} onChange={e => setF("qty", e.target.value)} />
              </div>
              {form.txType !== "Dividend" && (
                <>
                  <div>
                    <Label required>Price per Share</Label>
                    <Input type="number" placeholder="0.00" prefix="$" value={form.price} onChange={e => setF("price", e.target.value)} />
                  </div>
                  <div>
                    <Label>Fees & Commission</Label>
                    <Input type="number" placeholder="0.00" prefix="$" value={form.fees} onChange={e => setF("fees", e.target.value)} />
                  </div>
                </>
              )}
              <div>
                <Label>Broker / Platform</Label>
                <Sel value={form.broker} onChange={e => setF("broker", e.target.value)} options={BROKERS} placeholder="Select broker" />
              </div>
            </div>

            {/* ── US Withholding Tax checkbox (Dividend only) ── */}
            {form.txType === "Dividend" && (
              <div onClick={() => setDivWithhold(v => !v)}
                style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: divWithhold ? T.downBg : T.inputBg, border: `1px solid ${divWithhold ? T.down + "40" : T.border}`, borderRadius: 10, cursor: "pointer", userSelect: "none" }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${divWithhold ? T.down : T.dim}`, background: divWithhold ? T.down : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {divWithhold && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: divWithhold ? T.down : T.text }}>US Stock Market (Apply 30% Withholding Tax)</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                    {divWithhold ? "30% withholding tax deducted under IRS rules." : "No withholding tax — full gross dividend paid out."}
                  </div>
                </div>
                {divWithhold && <Badge bg={T.downBg} color={T.down}>−30%</Badge>}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <Label>Notes (optional)</Label>
              <textarea placeholder="Add any notes…" value={form.notes} onChange={e => setF("notes", e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none", resize: "vertical", minHeight: 64 }} />
            </div>

            {/* ── Calculation summary ── */}
            {total && form.txType !== "Dividend" && (
              <div style={{ marginTop: 14, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: T.muted }}>{form.qty} shares × {form.currency} ${parseFloat(form.price || 0).toFixed(2)}{form.fees ? ` + $${parseFloat(form.fees).toFixed(2)} fees` : ""}</div>
                <div><span style={{ fontSize: 11, color: T.dim, marginRight: 8 }}>Total</span><span style={{ fontSize: 16, fontWeight: 700 }}>{form.currency} ${total}</span></div>
              </div>
            )}

            {/* ── Dividend payout breakdown ── */}
            {form.txType === "Dividend" && form.sym && form.qty && (() => {
              const h = holdings.find(x => x.sym === form.sym);
              const qty = h ? h.qty : 0;
              const eps = parseFloat(form.qty) || 0;
              const gross = eps * qty * (FX[form.currency] || 1);
              const withhold = divWithhold ? gross * 0.30 : 0;
              const net = gross - withhold;
              return (
                <div style={{ marginTop: 16, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 2 }}>Dividend Payout Breakdown</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: T.muted }}>Gross ({qty} shares × {form.currency} {eps.toFixed(4)} EPS)</span>
                    <span style={{ fontWeight: 500 }}>S${gross.toFixed(2)}</span>
                  </div>
                  {divWithhold && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: T.down }}>US Withholding Tax (30%)</span>
                      <span style={{ fontWeight: 500, color: T.down }}>− S${withhold.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>Net Received</span>
                    <span style={{ fontWeight: 700, color: T.up }}>S${net.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={handleAdd} disabled={!form.sym || !form.qty || !form.date || (form.txType !== "Dividend" && !form.price)}
                style={{ flex: 1, background: (!form.sym || !form.qty || !form.date || (form.txType !== "Dividend" && !form.price)) ? T.inputBg : T.selected, color: (!form.sym || !form.qty || !form.date || (form.txType !== "Dividend" && !form.price)) ? T.dim : T.selectedText, border: "none", borderRadius: 8, padding: "11px", fontSize: 13, cursor: (!form.sym || !form.qty || !form.date || (form.txType !== "Dividend" && !form.price)) ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                + Add Transaction
              </button>
              <button onClick={() => { setForm(EMPTY); setDivWithhold(false); }} style={{ background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: 8, padding: "11px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Clear</button>
            </div>
          </Card>
        </div>
      )}

      {/* ── MANAGE / REMOVE TAB ── */}
      {tab === "remove" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: T.dim }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search holdings…"
              style={{ width: "100%", boxSizing: "border-box", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 14px 9px 36px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none" }} />
          </div>
          <Card style={{ padding: 0, overflowX: "auto" }}>
            {filtered.length === 0 && <div style={{ padding: "36px 20px", textAlign: "center", fontSize: 13, color: T.dim }}>No holdings found.</div>}
            {isMobile ? filtered.map(h => {
              const mp = h.marketPrice || h.price || 0;
              const plVal = (mp - h.cost) * h.qty;
              const plPct = h.cost > 0 ? ((mp - h.cost) / h.cost * 100) : 0;
              const plPos = plVal >= 0;
              return <MobileListItem key={h.id}
                icon={h.sym.slice(0,2)} iconBg={T.inputBg} title={h.name} subtitle={`${h.sym} · ${h.qty} shares · ${h.broker}`}
                value={`$${mp.toFixed(2)}`} valueColor={T.text}
                valueSub={`${plPos?"+":""}${plPct.toFixed(1)}%`}
                extra={<span style={{fontSize:12,fontWeight:600,color:plPos?T.up:T.down}}>{plPos?"+":""}${Math.abs(plVal).toLocaleString(undefined,{maximumFractionDigits:0})}</span>}
              />;
            }) : (
            <>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 0.7fr 1fr 1fr 1.4fr 190px", padding: "9px 20px", background: T.sidebar, borderBottom: `1px solid ${T.border}` }}>
              {["Stock / ETF", "Shares", "Avg. Cost", "Market Price", "Unrealized P/L", ""].map((h, i) => (
                <div key={i} style={{ fontSize: 11, color: T.muted, fontWeight: 500, textAlign: i >= 3 && i <= 4 ? "right" : "left" }}>{h}</div>
              ))}
            </div>
            {filtered.map((h) => {
              const mp    = h.marketPrice || h.price || 0;
              const plVal = (mp - h.cost) * h.qty;
              const plPct = h.cost > 0 ? ((mp - h.cost) / h.cost * 100) : 0;
              const plPos = plVal >= 0;
              return (
              <div key={h.id}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 0.7fr 1fr 1fr 1.4fr 190px", padding: "13px 20px", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: T.inputBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: T.muted }}>{h.sym.slice(0, 2)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{h.name}</div>
                      <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{h.sym} · <span style={{ background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "1px 5px", fontSize: 10 }}>{h.broker}</span></div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{h.qty}</div>
                  <div style={{ fontSize: 13, color: T.muted }}>${h.cost.toFixed(2)}</div>
                  {/* Market Price */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>${mp.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{h.priceDate || "—"}</div>
                  </div>
                  {/* Unrealized P/L */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: plPos ? T.up : T.down }}>
                      {plPos ? "+" : ""}${Math.abs(plVal).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: plPos ? T.up : T.down, marginTop: 2 }}>
                      {plPos ? "+" : ""}{plPct.toFixed(2)}%
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", padding: "0 4px" }}>
                    <button onClick={() => { setUpdatePriceId(updatePriceId === h.id ? null : h.id); setPriceF({ price: String(mp) }); setPartialId(null); setConfirmId(null); }}
                      style={{ background: updatePriceId === h.id ? T.accentBg : T.inputBg, color: updatePriceId === h.id ? T.accent : T.muted, border: `1px solid ${updatePriceId === h.id ? T.accent + "60" : T.border}`, borderRadius: 7, padding: "5px 9px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>$ Price</button>
                    <button onClick={() => { setPartialId(partialId === h.id ? null : h.id); setConfirmId(null); setUpdatePriceId(null); setSellF({ qty: "", price: "", date: "", fees: "" }); }}
                      style={{ background: partialId === h.id ? T.selected : T.inputBg, color: partialId === h.id ? T.selectedText : T.muted, border: `1px solid ${partialId === h.id ? T.selected : T.border}`, borderRadius: 7, padding: "5px 9px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Sell</button>
                    <button onClick={() => {
                        setPartialId(null); setConfirmId(null); setUpdatePriceId(null);
                        setForm({ ...EMPTY, sym: h.sym, name: h.name, txType: "Buy", broker: h.broker || "" });
                        setTab("add");
                      }}
                      style={{ background: T.upBg, color: T.up, border: `1px solid #BBF7D0`, borderRadius: 7, padding: "5px 9px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Buy</button>
                  </div>
                </div>

                {/* Update Price inline panel */}
                {updatePriceId === h.id && (
                  <div style={{ padding: "14px 20px 14px 64px", borderBottom: `1px solid ${T.border}`, background: T.accentBg }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.accent, marginBottom: 12 }}>Update Market Price — {h.sym}</div>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                      <div style={{ flex: "0 0 180px" }}>
                        <Label>New Market Price ($)</Label>
                        <Input type="number" step="0.01" placeholder={String(mp)} value={priceF.price} onChange={e => setPriceF({ price: e.target.value })} />
                      </div>
                      {priceF.price && parseFloat(priceF.price) > 0 && (() => {
                        const newMp  = parseFloat(priceF.price);
                        const newPl  = (newMp - h.cost) * h.qty;
                        const newPct = h.cost > 0 ? ((newMp - h.cost) / h.cost * 100) : 0;
                        const pos    = newPl >= 0;
                        return (
                          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 14px", display: "flex", gap: 20 }}>
                            <div><div style={{ fontSize: 10, color: T.dim, marginBottom: 2 }}>New P/L Value</div><div style={{ fontSize: 13, fontWeight: 700, color: pos ? T.up : T.down }}>{pos?"+":""}${Math.abs(newPl).toFixed(2)}</div></div>
                            <div><div style={{ fontSize: 10, color: T.dim, marginBottom: 2 }}>New P/L %</div><div style={{ fontSize: 13, fontWeight: 700, color: pos ? T.up : T.down }}>{pos?"+":""}{newPct.toFixed(2)}%</div></div>
                          </div>
                        );
                      })()}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button onClick={() => {
                        const newMp = parseFloat(priceF.price);
                        if (!newMp || newMp <= 0) return;
                        const today = new Date().toISOString().slice(0,10);
                        setHoldings(prev => prev.map(x => x.id === h.id
                          ? { ...x, marketPrice: newMp, priceDate: today, price: newMp, value: newMp * x.qty }
                          : x));
                        setUpdatePriceId(null);
                        showToast(`${h.sym} price updated to $${newMp.toFixed(2)}`, "success");
                      }}
                        style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 7, padding: "8px 20px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                        Update Price
                      </button>
                      <button onClick={() => setUpdatePriceId(null)} style={{ background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: 7, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Sell inline panel */}
                {partialId === h.id && (
                  <div style={{ padding: "16px 20px 16px 64px", borderBottom: `1px solid ${T.border}`, background: T.inputBg }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 14 }}>Record Sale — {h.sym}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                      <div><Label required>Shares to Sell</Label><Input type="number" placeholder={`Max ${h.qty}`} value={sellF.qty} onChange={e => setSellF(f => ({ ...f, qty: e.target.value }))} /></div>
                      <div><Label required>Sell Price / Share</Label><Input type="number" placeholder="0.00" prefix="$" value={sellF.price} onChange={e => setSellF(f => ({ ...f, price: e.target.value }))} /></div>
                      <div><Label required>Sell Date</Label><Input type="date" value={sellF.date} onChange={e => setSellF(f => ({ ...f, date: e.target.value }))} /></div>
                      <div><Label>Fees</Label><Input type="number" placeholder="0.00" prefix="$" value={sellF.fees} onChange={e => setSellF(f => ({ ...f, fees: e.target.value }))} /></div>
                    </div>
                    {sellF.qty && sellF.price && parseFloat(sellF.qty) <= h.qty && (
                      <div style={{ marginTop: 12, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", display: "flex", gap: 24 }}>
                        <div><div style={{ fontSize: 10, color: T.dim, marginBottom: 3 }}>Proceeds</div><div style={{ fontSize: 14, fontWeight: 700 }}>S${(parseFloat(sellF.qty) * parseFloat(sellF.price) - parseFloat(sellF.fees || 0)).toFixed(2)}</div></div>
                        <div><div style={{ fontSize: 10, color: T.dim, marginBottom: 3 }}>Realised P&L</div><div style={{ fontSize: 14, fontWeight: 700, color: ((parseFloat(sellF.price) - h.cost) * parseFloat(sellF.qty)) >= 0 ? T.up : T.down }}>{((parseFloat(sellF.price) - h.cost) * parseFloat(sellF.qty)) >= 0 ? "+" : ""}S${((parseFloat(sellF.price) - h.cost) * parseFloat(sellF.qty)).toFixed(2)}</div></div>
                        <div><div style={{ fontSize: 10, color: T.dim, marginBottom: 3 }}>Remaining</div><div style={{ fontSize: 14, fontWeight: 700 }}>{h.qty - parseFloat(sellF.qty)} shares</div></div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button onClick={() => handleSell(h)} style={{ background: T.selected, color: T.selectedText, border: "none", borderRadius: 7, padding: "8px 20px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Confirm Sale</button>
                      <button onClick={() => setPartialId(null)} style={{ background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: 7, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                    </div>
                  </div>
                )}
                {/* Confirm remove */}
                {confirmId === h.id && (
                  <div style={{ padding: "14px 20px 14px 64px", borderBottom: `1px solid ${T.border}`, background: T.downBg }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Remove <strong>{h.sym}</strong> entirely? This deletes the position without recording a sale.</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleRemove(h.id)} style={{ background: T.down, color: "#fff", border: "none", borderRadius: 7, padding: "7px 18px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Yes, Remove</button>
                      <button onClick={() => setConfirmId(null)} style={{ background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ); })}
            </>
            )}
          </Card>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* ── Search & Filter toolbar ── */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Text search */}
            <div style={{ position: "relative", flex: "1 1 180px", minWidth: 160 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: T.dim, pointerEvents: "none" }}>🔍</span>
              <input value={histSearch} onChange={e => setHistSearch(e.target.value)} placeholder="Search ticker…"
                style={{ width: "100%", boxSizing: "border-box", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px 8px 34px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none" }} />
            </div>
            {/* Type filter pills */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All", "Buy", "Sell", "Dividend"].map(f => (
                <button key={f} onClick={() => setHistTypeFilter(f)}
                  style={{ background: histTypeFilter === f ? T.selected : T.inputBg, color: histTypeFilter === f ? T.selectedText : T.muted, border: `1px solid ${histTypeFilter === f ? T.selected : T.border}`, borderRadius: 7, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: histTypeFilter === f ? 600 : 400 }}>
                  {f}
                </button>
              ))}
            </div>
            {/* Sort selector */}
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: "auto" }}>
              <span style={{ fontSize: 12, color: T.muted, whiteSpace: "nowrap" }}>Sort by</span>
              <select value={histSort.col} onChange={e => setHistSort(s => ({ ...s, col: e.target.value }))}
                style={{ background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 10px", fontSize: 12, fontFamily: "inherit", color: T.text, cursor: "pointer", outline: "none" }}>
                <option value="date">Date</option>
                <option value="sym">Ticker</option>
                <option value="txType">Type</option>
                <option value="qty">Quantity</option>
                <option value="total">Total</option>
              </select>
              <button onClick={() => setHistSort(s => ({ ...s, dir: s.dir === "desc" ? "asc" : "desc" }))}
                style={{ background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 10px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: T.text, minWidth: 36 }}>
                {histSort.dir === "desc" ? "↓" : "↑"}
              </button>
            </div>
          </div>

          {transactions.length === 0 ? (
            <Card style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No transactions yet</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Add your first stock using the Add Stock tab</div>
            </Card>
          ) : (() => {
            // Filter
            const filtered = transactions.filter(tx => {
              const matchSearch = !histSearch || tx.sym.toLowerCase().includes(histSearch.toLowerCase());
              const matchType = histTypeFilter === "All" || tx.txType === histTypeFilter;
              return matchSearch && matchType;
            });
            // Sort
            const sorted = [...filtered].sort((a, b) => {
              let va, vb;
              if (histSort.col === "date") { va = a.date; vb = b.date; }
              else if (histSort.col === "sym") { va = a.sym; vb = b.sym; }
              else if (histSort.col === "txType") { va = a.txType; vb = b.txType; }
              else if (histSort.col === "qty") { va = parseFloat(a.qty); vb = parseFloat(b.qty); }
              else if (histSort.col === "total") {
                va = parseFloat(a.qty) * parseFloat(a.price);
                vb = parseFloat(b.qty) * parseFloat(b.price);
              }
              if (va < vb) return histSort.dir === "asc" ? -1 : 1;
              if (va > vb) return histSort.dir === "asc" ? 1 : -1;
              return 0;
            });

            if (sorted.length === 0) return (
              <Card style={{ padding: "36px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>No results found</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Try adjusting your search or filter</div>
              </Card>
            );

            return (
            <Card style={{ padding: 0, overflowX: "auto" }}>
              {/* Result count */}
              <div style={{ padding: "10px 20px", borderBottom: `1px solid ${T.border}`, background: T.sidebar, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: T.muted }}>{sorted.length} of {transactions.length} transactions</span>
                {(histSearch || histTypeFilter !== "All") && (
                  <button onClick={() => { setHistSearch(""); setHistTypeFilter("All"); }} style={{ fontSize: 11, color: T.accent, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Clear filters</button>
                )}
              </div>
              {isMobile ? sorted.map((tx, i) => {
                const holding = HOLDINGS_INIT.find(h => h.sym === tx.sym);
                const tradeCcy = holding ? holding.tradeCcy || "USD" : "USD";
                const tot = (parseFloat(tx.qty) * parseFloat(tx.price) * (FX[tradeCcy] || 1) + parseFloat(tx.fees || 0)).toFixed(2);
                const isCredit = ["Dividend","Sell"].includes(tx.txType);
                return <MobileListItem key={tx.id}
                  icon={tx.sym.slice(0,2)} iconBg={T.inputBg} title={tx.sym} subtitle={`${tx.date} · ${tx.qty} shares @ $${parseFloat(tx.price).toFixed(2)}`}
                  value={`${isCredit?"+":"-"}S$${Math.abs(parseFloat(tot)).toLocaleString()}`} valueColor={isCredit?T.up:T.down}
                  badge={tx.txType} badgeBg={tx.txType==="Buy"?T.upBg:tx.txType==="Sell"?T.downBg:T.warnBg} badgeColor={tx.txType==="Buy"?T.up:tx.txType==="Sell"?T.down:T.warn}
                />;
              }) : (
              <>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.4fr 1fr 1.1fr 1.1fr", padding: "9px 20px", background: T.sidebar, borderBottom: `1px solid ${T.border}` }}>
                {[["Stock","left"],["Type","left"],["Date","left"],["Quantity","right"],["Price","right"],["Total","right"]].map(([h, align]) => (
                  <div key={h} style={{ fontSize: 11, color: T.muted, fontWeight: 500, textAlign: align }}>{h}</div>
                ))}
              </div>
              {sorted.map((tx, i) => {
                const holding = HOLDINGS_INIT.find(h => h.sym === tx.sym);
                const tradeCcy = holding ? holding.tradeCcy || "USD" : "USD";
                const priceNum = parseFloat(tx.price);
                const priceSGD = (priceNum * (FX[tradeCcy] || 1)).toFixed(2);
                const tot = (parseFloat(tx.qty) * priceNum * (FX[tradeCcy] || 1) + parseFloat(tx.fees || 0)).toFixed(2);
                const isCredit = ["Dividend", "Sell", "Transfer In"].includes(tx.txType);
                // Format date + mock time based on index for variety
                const times = ["09:32 AM","10:15 AM","11:48 AM","02:03 PM","03:22 PM","09:45 AM","01:17 PM","03:58 PM","10:30 AM","02:44 PM"];
                const timeStr = times[i % times.length];
                const dateObj = new Date(tx.date);
                const dateFormatted = dateObj.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
                return (
                  <div key={tx.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.4fr 1fr 1.1fr 1.1fr", padding: "12px 20px", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {tx.sym}
                      <div style={{ fontSize: 11, color: T.dim, fontWeight: 400, marginTop: 2 }}>
                        {(holding || {}).exchange || "—"}
                      </div>
                    </div>
                    <div><Badge bg={tx.txType === "Buy" ? T.upBg : tx.txType === "Sell" ? T.downBg : T.warnBg} color={tx.txType === "Buy" ? T.up : tx.txType === "Sell" ? T.down : T.warn}>{tx.txType}</Badge></div>
                    <div>
                      <div style={{ fontSize: 13, color: T.text }}>{dateFormatted}</div>
                      <div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>{timeStr}</div>
                    </div>
                    <div style={{ fontSize: 13, textAlign: "right", fontWeight: 500 }}>
                      {parseFloat(tx.qty).toFixed(2)}
                      <div style={{ fontSize: 11, color: T.dim, fontWeight: 400 }}>shares</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{tradeCcy} {priceNum.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: T.dim }}>(S${priceSGD})</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isCredit ? T.up : T.text }}>{isCredit ? "+" : "−"}S${tot}</div>
                    </div>
                  </div>
                );
              })}
              </>
              )}
            </Card>
            );
          })()}
        </div>
      )}

      {/* ── POSTINGS TAB ── */}
      {tab === "postings" && (() => {
        const inter = "'Inter','Segoe UI',system-ui,sans-serif";
        const mono  = "'Courier New',Courier,monospace";
        const sorted = [...transactions].sort((a,b) => a.date.localeCompare(b.date));

        const daysAgo = (d) => {
          if (!d) return "";
          const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
          return diff === 0 ? "Today" : diff === 1 ? "1 day ago" : diff + " days ago";
        };

        const fmtAmt = (v, ccy) => {
          const sym = ccy === "USD" ? "US$" : ccy === "GBP" ? "£" : ccy === "EUR" ? "€" : "S$";
          return sym + Math.abs(parseFloat(v)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
        };

        const tableRows = sorted.flatMap(tx => {
          const qty   = parseFloat(tx.qty)   || 0;
          const price = parseFloat(tx.price) || 0;
          const fees  = parseFloat(tx.fees)  || 0;
          const gross = qty * price;
          const total = gross + (tx.txType === "Buy" ? fees : -fees);
          const ccy   = tx.currency || "SGD";
          const stockAcct  = `Assets:Investments:Equities:${tx.sym}`;
          const cashAcct   = `Assets:Bank:Cash`;
          const feeAcct    = `Expenses:Brokerage:Fees`;
          const divAcct    = `Income:Dividends:${tx.sym}`;

          if (tx.txType === "Buy" || tx.txType === "Transfer In") {
            const rows = [
              { date: tx.date, desc: `${tx.txType} ${qty} × ${tx.sym} @ ${fmtAmt(price,ccy)}`, account: stockAcct, amount: fmtAmt(gross,ccy), debit: true,  _first: true  },
              { date: null,    desc: "",                                                          account: cashAcct,  amount: fmtAmt(total,ccy), debit: false, _first: false },
            ];
            if (fees > 0) rows.push({ date: null, desc: `Brokerage fee — ${tx.broker||"Broker"}`, account: feeAcct, amount: fmtAmt(fees,ccy), debit: true, _first: false },
                                     { date: null, desc: "",                                        account: cashAcct, amount: fmtAmt(fees,ccy), debit: false, _first: false });
            return rows;
          }
          if (tx.txType === "Sell" || tx.txType === "Transfer Out") {
            const rows = [
              { date: tx.date, desc: `${tx.txType} ${qty} × ${tx.sym} @ ${fmtAmt(price,ccy)}`, account: cashAcct,  amount: fmtAmt(Math.abs(total),ccy), debit: true,  _first: true  },
              { date: null,    desc: "",                                                          account: stockAcct, amount: fmtAmt(gross,ccy),            debit: false, _first: false },
            ];
            if (fees > 0) rows.push({ date: null, desc: `Brokerage fee — ${tx.broker||"Broker"}`, account: feeAcct,  amount: fmtAmt(fees,ccy), debit: true,  _first: false },
                                     { date: null, desc: "",                                        account: cashAcct, amount: fmtAmt(fees,ccy), debit: false, _first: false });
            return rows;
          }
          if (tx.txType === "Dividend") {
            const divAmt = qty * price;
            return [
              { date: tx.date, desc: `Dividend — ${tx.sym} (${qty} shares × ${fmtAmt(price,ccy)})`, account: cashAcct, amount: fmtAmt(divAmt,ccy), debit: true,  _first: true  },
              { date: null,    desc: "",                                                               account: divAcct,  amount: fmtAmt(divAmt,ccy), debit: false, _first: false },
            ];
          }
          return [];
        });

        if (isMobile && tableRows.length > 0) return <MobilePostingsList journalRows={tableRows} entryCount={sorted.length} entryLabel="transactions"/>;
        if (tableRows.length === 0) {
          return (
            <div style={{ textAlign: "center", padding: "60px 20px", color: T.muted }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📒</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No transactions to post</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Add stock transactions to see ledger postings</div>
            </div>
          );
        }

        return (
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", background: T.bg }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: inter }}>Ledger Postings</div>
              <div style={{ fontSize: 12, color: T.accent, marginTop: 3, fontFamily: inter }}>Double-entry bookkeeping · PTA compliant · {sorted.length} transactions</div>
            </div>
            <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 560 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: "9px 16px", textAlign: "left", width: 148, fontSize: 11, fontWeight: 500, color: T.muted, fontFamily: inter, whiteSpace: "nowrap" }}>Date</th>
                    <th style={{ padding: "9px 16px", textAlign: "left", fontSize: 11, fontWeight: 500, color: T.muted, fontFamily: inter }}>Account</th>
                    <th style={{ padding: "9px 16px", textAlign: "left", fontSize: 11, fontWeight: 500, color: T.muted, fontFamily: inter }}>Description</th>
                    <th style={{ padding: "9px 16px", textAlign: "right", width: 160, fontSize: 11, fontWeight: 500, color: T.muted, fontFamily: inter }}>Debit</th>
                    <th style={{ padding: "9px 16px", textAlign: "right", width: 160, fontSize: 11, fontWeight: 500, color: T.muted, fontFamily: inter }}>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "11px 16px", verticalAlign: "top", width: 148 }}>
                        {row._first ? (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 400, color: T.text, fontFamily: inter, whiteSpace: "nowrap" }}>{row.date}</div>
                            <div style={{ fontSize: 11, color: T.dim, marginTop: 2, fontFamily: inter }}>{daysAgo(row.date)}</div>
                          </>
                        ) : null}
                      </td>
                      <td style={{ padding: "11px 16px", verticalAlign: "top" }}>
                        <span style={{ fontFamily: mono, fontSize: 12, color: T.text }}>{row.account}</span>
                      </td>
                      <td style={{ padding: "11px 16px", verticalAlign: "top", fontSize: 12, color: T.muted, fontFamily: inter }}>{row.desc}</td>
                      <td style={{ padding: "11px 16px", verticalAlign: "top", textAlign: "right", whiteSpace: "nowrap" }}>
                        {row.debit
                          ? <span style={{ fontSize: 13, fontWeight: 700, color: T.up, fontFamily: inter }}>{row.amount}</span>
                          : <span style={{ fontSize: 13, color: T.dim, fontFamily: inter }}>—</span>}
                      </td>
                      <td style={{ padding: "11px 16px", verticalAlign: "top", textAlign: "right", whiteSpace: "nowrap" }}>
                        {!row.debit
                          ? <span style={{ fontSize: 13, fontWeight: 700, color: T.down, fontFamily: inter }}>{row.amount}</span>
                          : <span style={{ fontSize: 13, color: T.dim, fontFamily: inter }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}`, background: T.sidebar }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 6, fontFamily: inter }}>Double-Entry Accounting</div>
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.8, fontFamily: inter }}>
                <div>• <span style={{ color: T.up, fontWeight: 600 }}>Debit (Dr):</span> Buy → increases Assets:Investments; Sell / Dividend → increases Assets:Bank:Cash</div>
                <div>• <span style={{ color: T.down, fontWeight: 600 }}>Credit (Cr):</span> Buy → reduces cash; Sell → reduces equity position; Dividend → records income</div>
              </div>
              <div style={{ fontSize: 11, color: T.dim, marginTop: 8, fontFamily: inter }}>Every transaction has equal debits and credits (sum = 0)</div>
            </div>
          </div>
        );
      })()}

      {/* ── API TAB ── */}
      {tab === "api" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 22px", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ fontSize: 26 }}>🔗</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5 }}>Broker API Integrations — Coming Post-MVP</div>
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>We're building direct broker connections via Open Banking and official APIs. Your portfolio will sync automatically once live. Vote for which broker to prioritise below.</div>
            </div>
            <Badge bg={T.warnBg} color={T.warn}>Phase 2</Badge>
          </div>
          <Card style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>How It'll Work</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[
                { icon: "🔐", step: "1", t: "Connect Your Broker", b: "Log in securely via OAuth — we never store your credentials." },
                { icon: "⇄", step: "2", t: "Auto-Sync Trades", b: "Buys, sells, dividends and corporate actions sync automatically." },
                { icon: "📊", step: "3", t: "Real-Time Portfolio", b: "Live prices and positions always up to date." },
              ].map((s, i) => (
                <div key={i} style={{ background: T.inputBg, borderRadius: 10, padding: "16px" }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Step {s.step}: {s.t}</div>
                  <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{s.b}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ padding: 0, overflowX: "auto" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Planned Brokers</div>
              <Badge>12 planned</Badge>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
              {["Tiger Brokers", "Moomoo (Futu)", "Interactive Brokers", "eToro", "Fidelity", "Charles Schwab", "DBS Vickers", "Phillip Securities", "FSMOne", "Revolut", "Trading 212", "Saxo Bank"].map((b, i) => (
                <div key={i} style={{ padding: "14px 18px", borderBottom: i < 9 ? `1px solid ${T.border}` : "none", borderRight: (i + 1) % 3 !== 0 ? `1px solid ${T.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: T.inputBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.muted }}>{b.slice(0, 2).toUpperCase()}</div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{b}</span>
                  </div>
                  <button style={{ background: T.inputBg, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>👍 Vote</button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ── Import Data Screen ─────────────────────────────────────── */
function ImportDataScreen() {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [importTab, setImportTab] = useState("csv");

  const sampleCSV = `Ticker,Date,Type,Quantity,Price,Currency,Fees,Exchange
AAPL,2025-01-12,Buy,45,152.30,USD,1.50,NASDAQ
MSFT,2025-02-03,Buy,22,310.40,USD,1.20,NASDAQ
VOO,2025-02-20,Buy,18,380.10,USD,0.00,NYSE`;

  const recentImports = [
    { name: "portfolio_jan2025.csv", date: "12 Jan 2025", rows: 8, status: "success" },
    { name: "transactions_q4.csv", date: "28 Dec 2024", rows: 15, status: "success" },
    { name: "holdings_export.csv", date: "10 Nov 2024", rows: 3, status: "error", error: "2 rows had unknown tickers" },
  ];

  const sources = [
    { name: "Tiger Brokers", icon: "🐯", desc: "Export via Account → Reports → Trade History", format: "CSV", steps: ["Login to Tiger Brokers app", "Go to Account → Reports", "Select Trade History → Export CSV", "Upload the file here"] },
    { name: "Interactive Brokers", icon: "🏦", desc: "Export via Statements → Activity Statement", format: "CSV / FLEX", steps: ["Login to IBKR Client Portal", "Go to Reports → Statements", "Select Activity Statement", "Download as CSV and upload here"] },
    { name: "Moomoo", icon: "🐄", desc: "Export via Me → Assets → Transaction History", format: "CSV", steps: ["Open Moomoo app", "Go to Me → Assets", "Tap Transaction History → Export", "Upload the CSV here"] },
    { name: "DBS Vickers", icon: "🏛️", desc: "Export via Internet Banking → Investment → History", format: "XLS", steps: ["Login to DBS iBanking", "Go to Invest → DBS Vickers", "Transaction History → Download", "Upload the XLS file here"] },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* ── Method tabs ── */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.border}` }}>
        {[["csv","📄 CSV / Excel Upload"],["manual","✏️ Manual Entry Guide"],["history","🕐 Import History"]].map(([id, label]) => (
          <button key={id} onClick={() => setImportTab(id)}
            style={{ background: "transparent", border: "none", borderBottom: `2px solid ${importTab === id ? T.selected : "transparent"}`, padding: "10px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: importTab === id ? 600 : 400, color: importTab === id ? T.text : T.muted, marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── CSV Upload Tab ── */}
      {importTab === "csv" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setUploadedFile(f); }}
            style={{ border: `2px dashed ${dragOver ? T.accent : T.border}`, borderRadius: 14, padding: "40px 24px", textAlign: "center", background: dragOver ? T.accentBg : T.inputBg, transition: "all 0.15s", cursor: "pointer" }}
            onClick={() => document.getElementById("csv-file-input").click()}>
            <input id="csv-file-input" type="file" accept=".csv,.xls,.xlsx" style={{ display: "none" }} onChange={e => setUploadedFile(e.target.files[0])} />
            <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
            {uploadedFile ? (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.up }}>✓ {uploadedFile.name}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>File ready — click Import to proceed</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Drop your CSV or Excel file here</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>or click to browse · Supports .csv, .xls, .xlsx</div>
              </div>
            )}
          </div>

          {uploadedFile && (
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ flex: 1, background: T.selected, color: T.selectedText, border: "none", borderRadius: 9, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                ↑ Import {uploadedFile.name}
              </button>
              <button onClick={() => setUploadedFile(null)} style={{ background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: 9, padding: "11px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
            </div>
          )}

          {/* Expected format */}
          <Card style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Expected CSV Format</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Your file should include these columns. Extra columns will be ignored.</div>
            <div className="wo-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
              {[
                { col: "Ticker", req: true, eg: "AAPL" },
                { col: "Date", req: true, eg: "2025-01-12" },
                { col: "Type", req: true, eg: "Buy / Sell / Dividend" },
                { col: "Quantity", req: true, eg: "45" },
                { col: "Price", req: true, eg: "152.30" },
                { col: "Currency", req: false, eg: "USD" },
                { col: "Fees", req: false, eg: "1.50" },
                { col: "Exchange", req: false, eg: "NASDAQ" },
              ].map(c => (
                <div key={c.col} style={{ background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{c.col}</span>
                    {c.req && <span style={{ fontSize: 9, fontWeight: 700, color: T.down, background: T.downBg, borderRadius: 3, padding: "1px 5px" }}>Required</span>}
                  </div>
                  <div style={{ fontSize: 11, color: T.dim }}>e.g. {c.eg}</div>
                </div>
              ))}
            </div>
            {/* Sample CSV preview */}
            <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 8 }}>Sample CSV Preview</div>
            <pre style={{ background: T.sidebar, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", fontSize: 11, color: T.text, overflowX: "auto", margin: 0, fontFamily: "monospace", lineHeight: 1.7 }}>{sampleCSV}</pre>
            <button onClick={() => {
              const blob = new Blob([sampleCSV], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "wealthos_sample.csv"; a.click();
            }} style={{ marginTop: 12, background: "transparent", color: T.accent, border: `1px solid ${T.accent}40`, borderRadius: 7, padding: "7px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
              ↓ Download Sample CSV
            </button>
          </Card>

          {/* Broker-specific guides */}
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Broker Export Guides</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {sources.map((s, i) => (
              <Card key={i} style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: T.dim }}>{s.desc}</div>
                  </div>
                  <Badge style={{ marginLeft: "auto" }}>{s.format}</Badge>
                </div>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  {s.steps.map((step, j) => (
                    <li key={j} style={{ fontSize: 12, color: T.muted, marginBottom: 4, lineHeight: 1.5 }}>{step}</li>
                  ))}
                </ol>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Manual Entry Guide ── */}
      {importTab === "manual" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card style={{ padding: "22px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Adding Transactions Manually</div>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, marginBottom: 20 }}>
              Use the <strong>Manage Stocks → Add Stock</strong> tab to record each transaction individually. This is ideal if you have a small number of trades or prefer full control over each entry.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: "1️⃣", t: "Select Transaction Type", b: "Choose Buy, Sell, or Dividend. Transfer and Split options are coming soon." },
                { icon: "2️⃣", t: "Search for the Ticker", b: "Type the ticker symbol (e.g. AAPL) to auto-fill the company name." },
                { icon: "3️⃣", t: "Fill in Trade Details", b: "Enter the date, quantity, price per share, fees, and broker." },
                { icon: "4️⃣", t: "Review & Confirm", b: "Check the total cost preview at the bottom, then click Add Transaction." },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px", background: T.inputBg, borderRadius: 10 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{s.t}</div>
                    <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{s.b}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18 }}>
              <button style={{ background: T.selected, color: T.selectedText, border: "none", borderRadius: 9, padding: "10px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                → Go to Add Stock
              </button>
            </div>
          </Card>
          <Card style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Tips for Accurate Tracking</div>
            {[
              { icon: "💱", t: "Use the original trade currency", b: "Record prices in USD for US stocks — WealthOS converts to SGD automatically using live FX rates." },
              { icon: "📅", t: "Use the trade date, not settlement", b: "Enter the actual execution date of the trade for accurate P&L calculations." },
              { icon: "🧾", t: "Include fees", b: "Adding brokerage fees ensures your cost basis and net return are accurate." },
              { icon: "🏷️", t: "Tag the exchange", b: "Make sure each stock has the correct exchange so withholding tax rules apply correctly." },
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none", alignItems: "flex-start" }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{tip.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{tip.t}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 3, lineHeight: 1.5 }}>{tip.b}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── Import History ── */}
      {importTab === "history" && (
        <Card style={{ padding: 0, overflowX: "auto" }}>
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Recent Imports</span>
            <Badge>{recentImports.length} files</Badge>
          </div>
          {recentImports.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < recentImports.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: r.status === "success" ? T.upBg : T.downBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                {r.status === "success" ? "✅" : "⚠️"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{r.date} · {r.rows} rows{r.error ? ` · ${r.error}` : ""}</div>
              </div>
              <Badge bg={r.status === "success" ? T.upBg : T.downBg} color={r.status === "success" ? T.up : T.down}>
                {r.status === "success" ? "Imported" : "Partial"}
              </Badge>
            </div>
          ))}
          {recentImports.length === 0 && (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>No imports yet</div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}


/* ── Insurance Type Config ───────────────────────────────────── */
const INS_TYPES = {
  "Term Life":        { icon: "🛡️", group: "Life", color: "#2563EB", bg: "#DBEAFE" },
  "Whole Life":       { icon: "💎", group: "Life", color: "#7C3AED", bg: "#EDE9FE" },
  "Universal Life":   { icon: "🌐", group: "Life", color: "#0D9488", bg: "#CCFBF1" },
  "Endowment":        { icon: "🏦", group: "Life", color: "#D97706", bg: "#FEF3C7" },
  "ILP":              { icon: "📈", group: "Investment", color: "#059669", bg: "#D1FAE5" },
  "Hospital Plan":    { icon: "🏥", group: "Health", color: "#DC2626", bg: "#FEE2E2" },
  "Critical Illness": { icon: "❤️", group: "Health", color: "#DB2777", bg: "#FCE7F3" },
  "Disability":       { icon: "♿", group: "Health", color: "#7C3AED", bg: "#EDE9FE" },
  "Long-Term Care":   { icon: "🧓", group: "Health", color: "#2563EB", bg: "#DBEAFE" },
  "Personal Accident":{ icon: "🩹", group: "Accident", color: "#EA580C", bg: "#FFEDD5" },
  "Home":             { icon: "🏠", group: "General", color: "#16A34A", bg: "#DCFCE7" },
  "Motor":            { icon: "🚗", group: "General", color: "#64748B", bg: "#F1F5F9" },
  "Travel":           { icon: "✈️", group: "General", color: "#0284C7", bg: "#E0F2FE" },
  "Maid / FDW":       { icon: "🧹", group: "General", color: "#D97706", bg: "#FEF3C7" },
  "Business":         { icon: "💼", group: "General", color: "#374151", bg: "#F3F4F6" },
  "Other":            { icon: "📋", group: "General", color: "#71717A", bg: "#F4F4F5" },
};
const INS_TYPE_KEYS = Object.keys(INS_TYPES);
const INSURERS = ["AIA","Great Eastern","Prudential","Manulife","NTUC Income","Tokio Marine","Aviva","Zurich","FWD","HSBC Life","Etiqa","Chubb","AXA","Singlife","Other"];
const PREMIUM_FREQ = ["Monthly","Quarterly","Half-Yearly","Yearly","Single Premium","N/A"];
const STATUS_OPTS = ["Active","Lapsed","Surrendered","Matured","Pending","Cancelled"];

const POLICIES_INIT = [
  { id: 1, type: "Term Life", insurer: "AIA", policyNo: "L-2021-00841", planName: "AIA Term Protect", status: "Active", sumAssured: 500000, cashValue: 0, surrenderValue: 0, ilpFundValue: 0, currency: "SGD", premium: 980, premFreq: "Yearly", totalPremPaid: 3920, startDate: "2021-03-15", endDate: "2051-03-15", nextPremDue: "2026-03-15", insuredName: "Dilwyn", dob: "1988-05-10", beneficiary: "Spouse — Jane Doe", riders: ["Total & Permanent Disability", "Critical Illness Accelerated"], exclusions: ["Suicide within first 2 years", "Pre-existing conditions declared at application"], notes: "20-year term covering mortgage liability.", reminderEnabled: true, reminderDays: 14,
    premiumTransactions: [
      { id: "PT001", date: "2021-03-15", amount: 980, method: "GIRO", ref: "AIA-2021-001", status: "Paid", notes: "Inception premium" },
      { id: "PT002", date: "2022-03-15", amount: 980, method: "GIRO", ref: "AIA-2022-001", status: "Paid", notes: "" },
      { id: "PT003", date: "2023-03-15", amount: 980, method: "GIRO", ref: "AIA-2023-001", status: "Paid", notes: "" },
      { id: "PT004", date: "2024-03-15", amount: 980, method: "GIRO", ref: "AIA-2024-001", status: "Paid", notes: "" },
      { id: "PT005", date: "2025-03-15", amount: 980, method: "GIRO", ref: "AIA-2025-001", status: "Paid", notes: "" },
      { id: "PT006", date: "2026-03-15", amount: 980, method: "GIRO", ref: "AIA-2026-001", status: "Pending", notes: "Due today" },
    ],
    claims: [], documents: [{ name: "Policy Document.pdf", date: "2021-03-16", type: "Policy" }, { name: "Premium Notice 2026.pdf", date: "2026-02-01", type: "Premium Notice" }] },
  { id: 2, type: "Whole Life", insurer: "Great Eastern", policyNo: "WL-2015-44210", planName: "GREAT Life Advantage", status: "Active", sumAssured: 200000, cashValue: 38400, surrenderValue: 34200, ilpFundValue: 0, currency: "SGD", premium: 3200, premFreq: "Yearly", totalPremPaid: 35200, startDate: "2015-06-01", endDate: "2099-06-01", nextPremDue: "2026-06-01", insuredName: "Dilwyn", dob: "1988-05-10", beneficiary: "Spouse — Jane Doe", riders: ["Dread Disease Rider", "Payor Premium Waiver"], exclusions: ["War and terrorism", "Professional sports activities"], notes: "Par policy. Participating in bonus pool.", reminderEnabled: true, reminderDays: 14,
    premiumTransactions: [
      { id: "PT101", date: "2015-06-01", amount: 3200, method: "Cheque", ref: "GE-2015-101", status: "Paid", notes: "Inception premium" },
      { id: "PT102", date: "2016-06-01", amount: 3200, method: "GIRO", ref: "GE-2016-101", status: "Paid", notes: "" },
      { id: "PT103", date: "2017-06-01", amount: 3200, method: "GIRO", ref: "GE-2017-101", status: "Paid", notes: "" },
      { id: "PT104", date: "2018-06-01", amount: 3200, method: "GIRO", ref: "GE-2018-101", status: "Paid", notes: "" },
      { id: "PT105", date: "2019-06-01", amount: 3200, method: "GIRO", ref: "GE-2019-101", status: "Paid", notes: "" },
      { id: "PT106", date: "2020-06-01", amount: 3200, method: "GIRO", ref: "GE-2020-101", status: "Paid", notes: "" },
      { id: "PT107", date: "2021-06-01", amount: 3200, method: "GIRO", ref: "GE-2021-101", status: "Paid", notes: "" },
      { id: "PT108", date: "2022-06-01", amount: 3200, method: "GIRO", ref: "GE-2022-101", status: "Paid", notes: "" },
      { id: "PT109", date: "2023-06-01", amount: 3200, method: "GIRO", ref: "GE-2023-101", status: "Paid", notes: "" },
      { id: "PT110", date: "2024-06-01", amount: 3200, method: "GIRO", ref: "GE-2024-101", status: "Paid", notes: "" },
      { id: "PT111", date: "2025-06-01", amount: 3200, method: "GIRO", ref: "GE-2025-101", status: "Paid", notes: "" },
    ],
    claims: [{ id: "C001", type: "Dread Disease", date: "2023-08-10", amount: 50000, status: "Approved", notes: "Early-stage cancer diagnosis. Claim approved within 30 days." }], documents: [{ name: "Policy Schedule.pdf", date: "2015-06-02", type: "Policy" }, { name: "Bonus Statement 2025.pdf", date: "2025-01-15", type: "Statement" }] },
  { id: 3, type: "Hospital Plan", insurer: "NTUC Income", policyNo: "HP-2019-77231", planName: "Enhanced IncomeShield Preferred", status: "Active", sumAssured: 0, cashValue: 0, surrenderValue: 0, ilpFundValue: 0, currency: "SGD", premium: 1480, premFreq: "Yearly", totalPremPaid: 10360, startDate: "2019-01-10", endDate: null, nextPremDue: "2026-01-10", insuredName: "Dilwyn", dob: "1988-05-10", beneficiary: "—", riders: ["Enhanced Care Rider (Cashless)"], exclusions: ["Cosmetic procedures", "Dental treatment", "HIV/AIDS", "Pre-existing conditions (3yr wait)"], notes: "Integrated Shield Plan. MediShield Life base + private hospital rider.", reminderEnabled: true, reminderDays: 7,
    premiumTransactions: [
      { id: "PT201", date: "2019-01-10", amount: 1480, method: "Cheque", ref: "NTUC-2019-201", status: "Paid", notes: "Inception" },
      { id: "PT202", date: "2020-01-10", amount: 1480, method: "GIRO", ref: "NTUC-2020-201", status: "Paid", notes: "" },
      { id: "PT203", date: "2021-01-10", amount: 1480, method: "GIRO", ref: "NTUC-2021-201", status: "Paid", notes: "" },
      { id: "PT204", date: "2022-01-10", amount: 1520, method: "GIRO", ref: "NTUC-2022-201", status: "Paid", notes: "Premium revised upward" },
      { id: "PT205", date: "2023-01-10", amount: 1520, method: "GIRO", ref: "NTUC-2023-201", status: "Paid", notes: "" },
      { id: "PT206", date: "2024-01-10", amount: 1560, method: "GIRO", ref: "NTUC-2024-201", status: "Paid", notes: "Age-band increase" },
      { id: "PT207", date: "2025-01-10", amount: 1560, method: "GIRO", ref: "NTUC-2025-201", status: "Paid", notes: "" },
      { id: "PT208", date: "2026-01-10", amount: 0,    method: "GIRO", ref: "NTUC-2026-201", status: "Overdue", notes: "Unpaid — 59 days overdue" },
    ],
    claims: [{ id: "C002", type: "Hospitalisation", date: "2024-04-05", amount: 6800, status: "Approved", notes: "Appendectomy at Mt Elizabeth. Fully covered minus deductible." }], documents: [{ name: "Policy Certificate.pdf", date: "2019-01-11", type: "Policy" }] },
  { id: 4, type: "Critical Illness", insurer: "Prudential", policyNo: "CI-2020-12003", planName: "PRUActive Protect", status: "Active", sumAssured: 300000, cashValue: 0, surrenderValue: 0, ilpFundValue: 0, currency: "SGD", premium: 2100, premFreq: "Yearly", totalPremPaid: 12600, startDate: "2020-09-01", endDate: "2060-09-01", nextPremDue: "2026-09-01", insuredName: "Dilwyn", dob: "1988-05-10", beneficiary: "N/A", riders: [], exclusions: ["Stage 1 cancer", "Pre-existing conditions", "Congenital conditions"], notes: "Multi-pay CI covering 37 conditions across early, intermediate, advanced stages.", reminderEnabled: true, reminderDays: 14,
    premiumTransactions: [
      { id: "PT301", date: "2020-09-01", amount: 2100, method: "Credit Card", ref: "PRU-2020-301", status: "Paid", notes: "Inception" },
      { id: "PT302", date: "2021-09-01", amount: 2100, method: "GIRO", ref: "PRU-2021-301", status: "Paid", notes: "" },
      { id: "PT303", date: "2022-09-01", amount: 2100, method: "GIRO", ref: "PRU-2022-301", status: "Paid", notes: "" },
      { id: "PT304", date: "2023-09-01", amount: 2100, method: "GIRO", ref: "PRU-2023-301", status: "Paid", notes: "" },
      { id: "PT305", date: "2024-09-01", amount: 2100, method: "GIRO", ref: "PRU-2024-301", status: "Paid", notes: "" },
      { id: "PT306", date: "2025-09-01", amount: 2100, method: "GIRO", ref: "PRU-2025-301", status: "Paid", notes: "" },
    ],
    claims: [], documents: [{ name: "Policy Booklet.pdf", date: "2020-09-02", type: "Policy" }] },
  { id: 5, type: "ILP", insurer: "Manulife", policyNo: "ILP-2018-55801", planName: "Manulife InvestReady Wealth II", status: "Active", sumAssured: 100000, cashValue: 0, surrenderValue: 62400, ilpFundValue: 88600, currency: "SGD", premium: 800, premFreq: "Monthly", totalPremPaid: 76800, startDate: "2018-04-01", endDate: null, nextPremDue: "2026-04-01", insuredName: "Dilwyn", dob: "1988-05-10", beneficiary: "Spouse — Jane Doe", riders: [], exclusions: ["Market risk — fund value not guaranteed", "Surrender charges within first 3 years"], notes: "Invested in Manulife Asia Pacific REIT Fund (60%) + Equity Fund (40%).", reminderEnabled: true, reminderDays: 30,
    premiumTransactions: (() => {
      const txs = [];
      let d = new Date("2018-04-01");
      const end = new Date("2026-03-01");
      let seq = 1;
      while (d <= end) {
        txs.push({ id: `PT4${String(seq).padStart(2,"0")}`, date: d.toISOString().slice(0,10), amount: 800, method: "GIRO", ref: `MNL-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}-${seq}`, status: d <= new Date("2026-03-10") ? "Paid" : "Pending", notes: "" });
        d.setMonth(d.getMonth()+1); seq++;
      }
      return txs;
    })(),
    claims: [], documents: [{ name: "Policy Document.pdf", date: "2018-04-02", type: "Policy" }, { name: "Fund Statement Q4 2025.pdf", date: "2026-01-10", type: "Statement" }] },
  { id: 6, type: "Personal Accident", insurer: "Tokio Marine", policyNo: "PA-2023-00321", planName: "PA Pro Plus", status: "Active", sumAssured: 500000, cashValue: 0, surrenderValue: 0, ilpFundValue: 0, currency: "SGD", premium: 380, premFreq: "Yearly", totalPremPaid: 760, startDate: "2023-07-01", endDate: "2024-07-01", nextPremDue: "2026-07-01", insuredName: "Dilwyn", dob: "1988-05-10", beneficiary: "Spouse — Jane Doe", riders: ["Medical Expenses Extension", "Infectious Disease Cover"], exclusions: ["Self-inflicted injury", "Extreme sports", "War"], notes: "Renewed annually. Covers worldwide 24h accidental death, disability, and medical.", reminderEnabled: true, reminderDays: 14,
    premiumTransactions: [
      { id: "PT501", date: "2023-07-01", amount: 380, method: "Credit Card", ref: "TM-2023-501", status: "Paid", notes: "Inception" },
      { id: "PT502", date: "2024-07-01", amount: 388, method: "Credit Card", ref: "TM-2024-501", status: "Paid", notes: "Renewal — slight premium increase" },
      { id: "PT503", date: "2025-07-01", amount: 388, method: "Credit Card", ref: "TM-2025-501", status: "Paid", notes: "Renewed" },
    ],
    claims: [], documents: [{ name: "PA Certificate 2025.pdf", date: "2025-07-01", type: "Policy" }] },
  { id: 7, type: "Home", insurer: "FWD", policyNo: "HM-2024-88410", planName: "FWD Home Protection", status: "Active", sumAssured: 850000, cashValue: 0, surrenderValue: 0, ilpFundValue: 0, currency: "SGD", premium: 620, premFreq: "Yearly", totalPremPaid: 620, startDate: "2024-02-01", endDate: "2025-02-01", nextPremDue: "2026-02-01", insuredName: "Dilwyn", dob: "1988-05-10", beneficiary: "—", riders: ["Domestic Helper Cover", "Accidental Damage"], exclusions: ["Flood (standard)", "Wear and tear", "Valuables above S$5,000 each"], notes: "Covers building + contents + liability. HDB BTO at Tampines.", reminderEnabled: true, reminderDays: 14,
    premiumTransactions: [
      { id: "PT601", date: "2024-02-01", amount: 620, method: "PayNow", ref: "FWD-2024-601", status: "Paid", notes: "First year" },
      { id: "PT602", date: "2025-02-01", amount: 635, method: "PayNow", ref: "FWD-2025-601", status: "Paid", notes: "Renewal" },
      { id: "PT603", date: "2026-02-01", amount: 635, method: "PayNow", ref: "FWD-2026-601", status: "Overdue", notes: "37 days overdue — renewal pending" },
    ],
    claims: [], documents: [{ name: "Home Policy 2024.pdf", date: "2024-02-02", type: "Policy" }] },
];


/* ═══════════════════════════════════════════════════════════════
   BONDS & T-BILLS MODULE
═══════════════════════════════════════════════════════════════ */

const BOND_TYPES = ["Singapore Savings Bond","SGS Bond","T-Bill","Corporate Bond","Bond ETF","Fixed Deposit"];

const BOND_TYPE_CONFIG = {
  "Singapore Savings Bond": {icon:"🇸🇬",color:"#DC2626",bg:"#FEF2F2"},
  "SGS Bond":               {icon:"🏛️",color:"#1D4ED8",bg:"#EFF6FF"},
  "T-Bill":                 {icon:"📄",color:"#059669",bg:"#F0FDF4"},
  "Corporate Bond":         {icon:"🏢",color:"#D97706",bg:"#FFFBEB"},
  "Bond ETF":               {icon:"📊",color:"#9333EA",bg:"#FDF4FF"},
  "Fixed Deposit":          {icon:"🏦",color:"#0891B2",bg:"#ECFEFF"},
};

const BOND_STATUS_OPTS = ["Active","Matured","Redeemed","Called"];

const EMPTY_BOND = {
  id:"",productType:"Singapore Savings Bond",name:"",issuer:"",issueCode:"",
  faceValue:0,purchasePrice:0,currentValue:0,couponRate:0,yieldToMaturity:0,
  maturityDate:"",issueDate:"",nextPaymentDate:"",couponFrequency:"Semi-Annual",
  creditRating:"",currency:"SGD",tenure:"",status:"Active",notes:"",
  transactions:[],
};

const BONDS_INIT = [
  {
    id:"BD001",productType:"Singapore Savings Bond",name:"SSB GX24010Z",issuer:"MAS",issueCode:"GX24010Z",
    faceValue:20000,purchasePrice:20000,currentValue:20000,couponRate:3.07,yieldToMaturity:3.07,
    maturityDate:"2034-02-01",issueDate:"2024-02-01",nextPaymentDate:"2026-08-01",couponFrequency:"Semi-Annual",
    creditRating:"AAA",currency:"SGD",tenure:"10Y",status:"Active",
    notes:"10-year step-up. Year 1: 2.87%, Year 5: 3.07%, Year 10: 3.34%. Redeemable any month with no penalty.",
    transactions:[
      {id:"BTX001",date:"2026-02-01",type:"Coupon",amount:307,method:"CDP Credit",ref:"SSB-CPN-FEB26",status:"Paid",notes:"Semi-annual coupon — Year 2"},
      {id:"BTX002",date:"2025-08-01",type:"Coupon",amount:293,method:"CDP Credit",ref:"SSB-CPN-AUG25",status:"Paid",notes:"Semi-annual coupon — Year 1"},
    ],
  },
  {
    id:"BD002",productType:"SGS Bond",name:"SGS 3.0% 2034",issuer:"Singapore Government",issueCode:"NX24100W",
    faceValue:15000,purchasePrice:14850,currentValue:15120,couponRate:3.0,yieldToMaturity:3.12,
    maturityDate:"2034-10-01",issueDate:"2024-10-01",nextPaymentDate:"2026-04-01",couponFrequency:"Semi-Annual",
    creditRating:"AAA",currency:"SGD",tenure:"10Y",status:"Active",
    notes:"Benchmark 10-year SGS. Bought at slight discount on SGX. Tradeable.",
    transactions:[
      {id:"BTX003",date:"2025-10-01",type:"Coupon",amount:225,method:"CDP Credit",ref:"SGS-CPN-OCT25",status:"Paid",notes:"Semi-annual coupon 3.0%/2 on $15K face"},
      {id:"BTX004",date:"2025-04-01",type:"Coupon",amount:225,method:"CDP Credit",ref:"SGS-CPN-APR25",status:"Paid",notes:"Semi-annual coupon"},
    ],
  },
  {
    id:"BD003",productType:"T-Bill",name:"T-Bill BS25020W (6M)",issuer:"MAS",issueCode:"BS25020W",
    faceValue:50000,purchasePrice:48910,currentValue:50000,couponRate:0,yieldToMaturity:3.54,
    maturityDate:"2026-08-14",issueDate:"2026-02-14",nextPaymentDate:"",couponFrequency:"Zero-Coupon",
    creditRating:"AAA",currency:"SGD",tenure:"6M",status:"Active",
    notes:"6-month T-bill. Non-competitive bid. Discount price $97.82 per $100 face. Yield 3.54%.",
    transactions:[
      {id:"BTX005",date:"2026-02-14",type:"Purchase",amount:48910,method:"Bank Transfer",ref:"TBILL-BID-FEB26",status:"Paid",notes:"Non-competitive bid — 6M T-bill at 3.54% cut-off yield"},
    ],
  },
  {
    id:"BD004",productType:"T-Bill",name:"T-Bill BS25010Z (1Y)",issuer:"MAS",issueCode:"BS25010Z",
    faceValue:30000,purchasePrice:29070,currentValue:30000,couponRate:0,yieldToMaturity:3.20,
    maturityDate:"2026-01-15",issueDate:"2025-01-15",nextPaymentDate:"",couponFrequency:"Zero-Coupon",
    creditRating:"AAA",currency:"SGD",tenure:"1Y",status:"Matured",
    notes:"1-year T-bill. Matured Jan 2026. Received full face value $30,000.",
    transactions:[
      {id:"BTX006",date:"2025-01-15",type:"Purchase",amount:29070,method:"Bank Transfer",ref:"TBILL-BID-JAN25",status:"Paid",notes:"Non-competitive bid — 1Y T-bill"},
      {id:"BTX007",date:"2026-01-15",type:"Redemption",amount:30000,method:"CDP Credit",ref:"TBILL-MAT-JAN26",status:"Paid",notes:"Maturity redemption — profit $930"},
    ],
  },
  {
    id:"BD005",productType:"Corporate Bond",name:"Astrea 8 Class A-1 4.35%",issuer:"Azalea Asset Management",issueCode:"ASTREA8A1",
    faceValue:10000,purchasePrice:10000,currentValue:10150,couponRate:4.35,yieldToMaturity:4.20,
    maturityDate:"2029-06-15",issueDate:"2024-06-15",nextPaymentDate:"2026-06-15",couponFrequency:"Semi-Annual",
    creditRating:"A+",currency:"SGD",tenure:"5Y",status:"Active",
    notes:"Astrea PE-backed bond. Rated A+ by Fitch. Semi-annual coupon. SGX-listed.",
    transactions:[
      {id:"BTX008",date:"2025-12-15",type:"Coupon",amount:217.50,method:"CDP Credit",ref:"ASTREA-CPN-DEC25",status:"Paid",notes:"Semi-annual coupon 4.35%/2"},
      {id:"BTX009",date:"2025-06-15",type:"Coupon",amount:217.50,method:"CDP Credit",ref:"ASTREA-CPN-JUN25",status:"Paid",notes:"Semi-annual coupon"},
    ],
  },
  {
    id:"BD006",productType:"Bond ETF",name:"ABF SG Bond ETF (A35)",issuer:"State Street",issueCode:"A35",
    faceValue:8000,purchasePrice:8000,currentValue:8240,couponRate:0,yieldToMaturity:2.85,
    maturityDate:"",issueDate:"2024-03-01",nextPaymentDate:"2026-07-01",couponFrequency:"Semi-Annual",
    creditRating:"",currency:"SGD",tenure:"",status:"Active",
    units:7200,purchasePricePerUnit:1.111,currentPricePerUnit:1.144,distributionYield:2.85,
    notes:"ABF Singapore Bond Index Fund. Tracks iBoxx ABF SG Bond Index. SGS + quasi-govt bonds. Expense ratio 0.24%.",
    transactions:[
      {id:"BTX010",date:"2026-01-15",type:"Distribution",amount:114,method:"CDP Credit",ref:"A35-DIST-JAN26",status:"Paid",notes:"Semi-annual distribution $0.01583/unit"},
      {id:"BTX011",date:"2025-07-15",type:"Distribution",amount:110,method:"CDP Credit",ref:"A35-DIST-JUL25",status:"Paid",notes:"Semi-annual distribution"},
    ],
  },
  {
    id:"BD007",productType:"Fixed Deposit",name:"DBS 12M Fixed Deposit",issuer:"DBS Bank",issueCode:"",
    faceValue:50000,purchasePrice:50000,currentValue:51500,couponRate:3.0,yieldToMaturity:3.0,
    maturityDate:"2026-06-01",issueDate:"2025-06-01",nextPaymentDate:"2026-06-01",couponFrequency:"At Maturity",
    creditRating:"",currency:"SGD",tenure:"12M",status:"Active",
    autoRenewal:true,sdicInsured:true,
    notes:"12-month FD at 3.0%. Auto-renewal enabled. SDIC insured up to $100K.",
    transactions:[
      {id:"BTX012",date:"2025-06-01",type:"Purchase",amount:50000,method:"Bank Transfer",ref:"DBS-FD-JUN25",status:"Paid",notes:"Placed $50K into 12M FD at 3.0%"},
    ],
  },
];

// ── Bond Transaction Modal ────────────────────────────────────
function BondTxModalInner({ bond, onSave, onClose }) {
  const txTypes = bond.productType === "T-Bill" ? ["Purchase","Redemption"]
    : bond.productType === "Bond ETF" ? ["Purchase","Sale","Distribution"]
    : bond.productType === "Fixed Deposit" ? ["Purchase","Redemption","Interest"]
    : ["Purchase","Sale","Coupon","Redemption"];
  const txTypeIcon = {Purchase:"📥",Sale:"📤",Coupon:"🎁",Distribution:"🎁",Interest:"🏦",Redemption:"📤"};

  const [f, setF] = useState({
    type: txTypes.includes("Coupon") ? "Coupon" : txTypes.includes("Distribution") ? "Distribution" : txTypes[0],
    date: new Date().toISOString().slice(0,10),
    amount: 0, method: "CDP Credit", ref: "", notes: "",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const isOut = ["Sale","Redemption"].includes(f.type);
  const isIn = ["Coupon","Distribution","Interest"].includes(f.type);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:16,width:480,maxHeight:"85vh",overflow:"auto",padding:"28px 28px 20px",border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:6}}>Record Transaction</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:20}}>{bond.name} · {bond.issuer}</div>
        <div style={{marginBottom:14}}>
          <Label required>Transaction Type</Label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {txTypes.map(t=>(
              <button key={t} onClick={()=>set("type",t)}
                style={{flex:"1 1 auto",padding:"10px 14px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:f.type===t?700:400,
                  border:`1px solid ${f.type===t?T.selected:T.border}`,background:f.type===t?T.selected:T.bg,color:f.type===t?T.selectedText:T.muted}}>
                {txTypeIcon[t]||"💰"} {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Date</Label><Input type="date" value={f.date} onChange={e=>set("date",e.target.value)}/></div>
          <div><Label required>Amount</Label><Input type="number" prefix="S$" value={f.amount} onChange={e=>set("amount",+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Method</Label><Sel value={f.method} onChange={e=>set("method",e.target.value)} options={["CDP Credit","Bank Transfer","GIRO","Cash"]}/></div>
          <div><Label>Reference</Label><Input value={f.ref} onChange={e=>set("ref",e.target.value)}/></div>
        </div>
        <div style={{marginBottom:14}}>
          <Label>Notes</Label>
          <textarea value={f.notes} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="e.g. Semi-annual coupon, maturity redemption…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none",resize:"vertical"}}/>
        </div>
        <div style={{background:isOut?T.downBg:T.upBg,borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:isOut?T.down:T.up,fontWeight:600}}>{f.type==="Purchase"?"📥 Capital deployed":isOut?"📤 Capital returned":"📥 Income received"}</span>
          <span style={{fontWeight:700,color:isOut?T.down:T.up}}>{isOut||f.type==="Purchase"?"-":"+"} S${(f.amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Cancel</button>
          <button onClick={()=>onSave(f)} disabled={!f.date||f.amount<=0}
            style={{padding:"9px 20px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,opacity:(!f.date||f.amount<=0)?0.4:1}}>
            Record {f.type}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bond/T-Bill Add/Edit Modal ────────────────────────────────
function BondModal({ bond, onSave, onClose }) {
  const [f, setF] = useState({ ...bond });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:16,width:540,maxHeight:"85vh",overflow:"auto",padding:"28px 28px 20px",border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:20}}>{f.id ? "Edit Holding" : "Add Bond / T-Bill"}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Product Type</Label><Sel value={f.productType} onChange={e=>set("productType",e.target.value)} options={BOND_TYPES}/></div>
          <div><Label required>Issuer</Label><Input value={f.issuer} onChange={e=>set("issuer",e.target.value)} placeholder="e.g. MAS, DBS, Azalea"/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Name</Label><Input value={f.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. SSB GX24010Z, DBS 12M FD"/></div>
          <div><Label>Issue Code / Ticker</Label><Input value={f.issueCode} onChange={e=>set("issueCode",e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Face Value</Label><Input type="number" prefix="S$" value={f.faceValue} onChange={e=>set("faceValue",+e.target.value)}/></div>
          <div><Label>Purchase Price</Label><Input type="number" prefix="S$" value={f.purchasePrice} onChange={e=>set("purchasePrice",+e.target.value)}/></div>
          <div><Label>Current Value</Label><Input type="number" prefix="S$" value={f.currentValue} onChange={e=>set("currentValue",+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Coupon / Interest Rate (%)</Label><Input type="number" value={f.couponRate} onChange={e=>set("couponRate",+e.target.value)}/></div>
          <div><Label>Yield to Maturity (%)</Label><Input type="number" value={f.yieldToMaturity} onChange={e=>set("yieldToMaturity",+e.target.value)}/></div>
          <div><Label>Credit Rating</Label><Input value={f.creditRating} onChange={e=>set("creditRating",e.target.value)} placeholder="e.g. AAA, A+"/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Issue Date</Label><Input type="date" value={f.issueDate} onChange={e=>set("issueDate",e.target.value)}/></div>
          <div><Label>Maturity Date</Label><Input type="date" value={f.maturityDate} onChange={e=>set("maturityDate",e.target.value)}/></div>
          <div><Label>Tenure</Label><Input value={f.tenure} onChange={e=>set("tenure",e.target.value)} placeholder="e.g. 6M, 1Y, 10Y"/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Coupon Frequency</Label><Sel value={f.couponFrequency} onChange={e=>set("couponFrequency",e.target.value)} options={["Semi-Annual","Annual","Quarterly","At Maturity","Zero-Coupon"]}/></div>
          <div><Label>Currency</Label><Sel value={f.currency} onChange={e=>set("currency",e.target.value)} options={["SGD","USD"]}/></div>
          <div><Label>Status</Label><Sel value={f.status} onChange={e=>set("status",e.target.value)} options={BOND_STATUS_OPTS}/></div>
        </div>
        <div style={{marginBottom:20}}>
          <Label>Notes</Label>
          <textarea value={f.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="Additional notes…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none",resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Cancel</button>
          <button onClick={()=>onSave(f)} disabled={!f.productType||!f.name||!f.issuer}
            style={{padding:"9px 20px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,opacity:(!f.productType||!f.name||!f.issuer)?0.4:1}}>
            {f.id ? "Save Changes" : "Add Holding"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bonds & T-Bills Screen ────────────────────────────────────
function BondsScreen({ bonds, setBonds, showToast }) {
  const isMobile = useIsMobile();
  const [selectedBond, setSelectedBond] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editBond, setEditBond] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [drawerTab, setDrawerTab] = useState("overview");
  const [showTxModal, setShowTxModal] = useState(false);
  const bdSort = useSortState();

  const activeHoldings = bonds.filter(b => b.status === "Active");
  const totalFaceValue = activeHoldings.reduce((s, b) => s + (b.faceValue||0), 0);
  const totalCurrentValue = activeHoldings.reduce((s, b) => s + (b.currentValue||0), 0);
  const totalCost = activeHoldings.reduce((s, b) => s + (b.purchasePrice||0), 0);
  const totalUnrealizedPnL = totalCurrentValue - totalCost;
  const totalCoupons = bonds.flatMap(b=>(b.transactions||[])).filter(t=>["Coupon","Distribution","Interest"].includes(t.type)&&t.status==="Paid").reduce((s,t)=>s+(t.amount||0),0);
  const avgYield = activeHoldings.length > 0 ? activeHoldings.reduce((s,b)=>s+(b.yieldToMaturity||0),0)/activeHoldings.length : 0;

  // Type breakdown
  const typeBreakdown = {};
  activeHoldings.forEach(b => { typeBreakdown[b.productType] = (typeBreakdown[b.productType]||0) + (b.currentValue||0); });

  const filtered = bonds.filter(b => {
    if (filterType !== "All" && b.productType !== filterType) return false;
    if (filterStatus !== "All" && b.status !== filterStatus) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!(b.name||"").toLowerCase().includes(q) && !(b.issuer||"").toLowerCase().includes(q) && !(b.issueCode||"").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleSave = (f) => {
    if (f.id) {
      setBonds(prev => prev.map(b => b.id === f.id ? { ...b, ...f } : b));
      showToast("Holding updated", "success");
    } else {
      setBonds(prev => [...prev, { ...f, id:"BD"+Date.now(), transactions:[] }]);
      showToast("Holding added", "success");
    }
    setShowModal(false);
    setEditBond(null);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {/* Page header */}
      <div className="wo-page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:700}}>Fixed Income Portfolio</div>
          <div style={{fontSize:13,color:T.muted,marginTop:2}}>{activeHoldings.length} active holding{activeHoldings.length!==1?"s":""} · {bonds.length} total</div>
        </div>
        <button onClick={()=>{setEditBond({...EMPTY_BOND,id:""});setShowModal(true);}}
          style={{background:T.selected,color:T.selectedText,border:"none",borderRadius:9,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
          + Add Holding
        </button>
      </div>

      {/* Summary cards */}
      <div className="wo-summary-grid" style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12,marginBottom:18}}>
        {[
          {label:"Total Market Value",value:fmtCompact(totalCurrentValue),sub:`Cost basis: ${fmtCompact(totalCost)}`,icon:"📊",color:T.text},
          {label:"Unrealised P&L",value:(totalUnrealizedPnL>=0?"+":"")+fmtCompact(totalUnrealizedPnL),sub:`${totalCost>0?((totalUnrealizedPnL/totalCost)*100).toFixed(1):0}% return`,icon:"📈",color:totalUnrealizedPnL>=0?T.up:T.down},
          {label:"Total Income Received",value:fmtCompact(totalCoupons),sub:"Coupons + distributions + interest",icon:"🎁",color:T.up},
          {label:"Avg Yield to Maturity",value:`${avgYield.toFixed(2)}%`,sub:`${activeHoldings.length} active holdings`,icon:"🎯",color:T.accent},
        ].map((c,i)=>(
          <Card key={i} style={{padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{fontSize:12,color:T.muted,fontWeight:500}}>{c.label}</div>
              <span style={{fontSize:20}}>{c.icon}</span>
            </div>
            <div style={{fontSize:22,fontWeight:700,marginTop:8,color:T.text}}>{c.value}</div>
            <div style={{fontSize:11,color:T.dim,marginTop:4}}>{c.sub}</div>
          </Card>
        ))}
      </div>

      {/* Breakdown bar */}
      {Object.keys(typeBreakdown).length > 0 && (
        <Card style={{padding:"16px 20px",marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Holdings by Product Type</div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
            {Object.entries(typeBreakdown).map(([type, val])=>{
              const pct = totalCurrentValue > 0 ? (val/totalCurrentValue*100).toFixed(0) : 0;
              const tc = BOND_TYPE_CONFIG[type] || {icon:"📋",color:T.muted,bg:T.inputBg};
              return (
                <div key={type} style={{flex:"1 1 140px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:12,color:T.muted,fontWeight:500}}>{tc.icon} {type}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{pct}%</span>
                  </div>
                  <div style={{height:6,background:T.inputBg,borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:tc.color,borderRadius:3}}/>
                  </div>
                  <div style={{fontSize:11,color:T.dim,marginTop:4}}>{fmtCompact(val)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filter toolbar */}
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:"1 1 200px"}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.dim,pointerEvents:"none"}}>🔍</span>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search name, issuer, issue code…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px 8px 34px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["All",...BOND_STATUS_OPTS].map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)}
              style={{background:filterStatus===s?T.selected:T.inputBg,color:filterStatus===s?T.selectedText:T.muted,border:`1px solid ${filterStatus===s?T.selected:T.border}`,borderRadius:7,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:filterStatus===s?600:400}}>
              {s}
            </button>
          ))}
        </div>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)}
          style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 12px",fontSize:12,fontFamily:"inherit",color:T.text,cursor:"pointer",outline:"none"}}>
          {["All",...BOND_TYPES].map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{fontSize:12,color:T.muted,marginLeft:"auto"}}>{filtered.length} of {bonds.length}</span>
      </div>

      {/* Table / Mobile cards */}
      {filtered.length === 0 ? (
        <Card style={{padding:"48px 24px",textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>📊</div>
          <div style={{fontSize:14,fontWeight:600}}>No holdings found</div>
          <div style={{fontSize:12,color:T.muted,marginTop:4}}>Try adjusting filters or add a new holding</div>
        </Card>
      ) : isMobile ? (
        <Card style={{padding:0,overflow:"hidden"}}>
          {filtered.map(bond => {
            const tc = BOND_TYPE_CONFIG[bond.productType] || {icon:"📋",color:T.muted,bg:T.inputBg};
            const pnl = (bond.currentValue||0) - (bond.purchasePrice||0);
            return <MobileListItem key={bond.id} onClick={()=>{setSelectedBond(bond);setDrawerTab("overview");}}
              icon={tc.icon} iconBg={tc.bg} title={bond.name} subtitle={`${bond.issuer} · ${bond.productType}`}
              value={fmtCompact(bond.currentValue)} valueColor={T.text} valueSub={`YTM ${bond.yieldToMaturity}%`}
              badge={bond.status} badgeBg={bond.status==="Active"?T.upBg:T.inputBg} badgeColor={bond.status==="Active"?T.up:T.muted}
              extra={pnl !== 0 ? <span style={{fontSize:11,fontWeight:600,color:pnl>=0?T.up:T.down}}>{pnl>=0?"+":""}{fmtCompact(pnl)}</span> : null}
            />;
          })}
        </Card>
      ) : (
        <Card style={{padding:0,overflowX:"auto"}} className="wo-table-scroll">
          <SortHeader gridCols="2.2fr 1fr 1.1fr 1fr 1fr 1fr 0.8fr" sortKey={bdSort.sortKey} sortDir={bdSort.sortDir} onSort={bdSort.onSort}
            columns={[["Name / Issuer","left","name"],["Type","left","type"],["Value","right","value"],["Coupon / Yield","right","yield"],["Maturity","left","maturity"],["P&L","right","pnl"],["Status","left","status"]]}/>
          {bdSort.sortFn(filtered, (b, k) => {
            if (k==="name") return (b.name||"").toLowerCase();
            if (k==="type") return (b.productType||"").toLowerCase();
            if (k==="value") return b.currentValue||0;
            if (k==="yield") return b.yieldToMaturity||0;
            if (k==="maturity") return b.maturityDate ? new Date(b.maturityDate).getTime() : Infinity;
            if (k==="pnl") return (b.currentValue||0)-(b.purchasePrice||0);
            if (k==="status") return b.status;
            return 0;
          }).map((bond, i) => {
            const tc = BOND_TYPE_CONFIG[bond.productType] || {icon:"📋",color:T.muted,bg:T.inputBg};
            const pnl = (bond.currentValue||0) - (bond.purchasePrice||0);
            const daysToMat = bond.maturityDate ? Math.ceil((new Date(bond.maturityDate) - new Date()) / 86400000) : null;
            return (
              <div key={bond.id} onClick={()=>{setSelectedBond(bond);setDrawerTab("overview");}}
                style={{display:"grid",gridTemplateColumns:"2.2fr 1fr 1.1fr 1fr 1fr 1fr 0.8fr",padding:"13px 20px",borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none",alignItems:"center",cursor:"pointer",
                  opacity:bond.status==="Matured"||bond.status==="Redeemed"?0.55:1,background:bond.status==="Matured"||bond.status==="Redeemed"?T.sidebar:""}}
                onMouseEnter={e=>e.currentTarget.style.background=T.hover}
                onMouseLeave={e=>e.currentTarget.style.background=(bond.status==="Matured"||bond.status==="Redeemed"?T.sidebar:"")}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{width:34,height:34,borderRadius:9,background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{tc.icon}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{bond.name}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:1}}>{bond.issuer} · {bond.issueCode||"—"}</div>
                  </div>
                </div>
                <div style={{fontSize:12,color:T.muted}}>{bond.productType}</div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,fontWeight:700}}>{fmtCompact(bond.currentValue)}</div>
                  <div style={{fontSize:10,color:T.dim,marginTop:1}}>Face: {fmtCompact(bond.faceValue)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  {bond.couponRate > 0 ? <div style={{fontSize:12,color:T.text}}>{bond.couponRate}%</div> : <div style={{fontSize:12,color:T.dim}}>—</div>}
                  <div style={{fontSize:10,color:T.accent,marginTop:1}}>YTM {bond.yieldToMaturity}%</div>
                </div>
                <div>
                  {bond.maturityDate ? (
                    <>
                      <div style={{fontSize:12,color:T.text}}>{bond.maturityDate}</div>
                      {daysToMat !== null && daysToMat > 0 && <div style={{fontSize:10,color:T.dim}}>{daysToMat}d</div>}
                      {daysToMat !== null && daysToMat <= 0 && <div style={{fontSize:10,color:T.up,fontWeight:600}}>Matured</div>}
                    </>
                  ) : <span style={{fontSize:12,color:T.dim}}>Perpetual</span>}
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,fontWeight:600,color:pnl>=0?T.up:T.down}}>{pnl>=0?"+":""}{fmtCompact(pnl)}</div>
                </div>
                <div>
                  <Badge bg={bond.status==="Active"?T.upBg:bond.status==="Matured"?T.inputBg:T.warnBg}
                    color={bond.status==="Active"?T.up:bond.status==="Matured"?T.muted:T.warn}>
                    {bond.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ══ BOND DETAIL DRAWER ══ */}
      {selectedBond && (() => {
        const bond = bonds.find(b => b.id === selectedBond.id) || selectedBond;
        const tc = BOND_TYPE_CONFIG[bond.productType] || {icon:"📋",color:T.muted,bg:T.inputBg};
        const txs = (bond.transactions || []).slice().sort((a,b)=>b.date.localeCompare(a.date));
        const pnl = (bond.currentValue||0) - (bond.purchasePrice||0);
        const inter = "'Inter','Segoe UI',system-ui,sans-serif";
        const mono  = "'Courier New',Courier,monospace";
        const fmtA  = (v) => "S$" + Math.abs(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
        const cashAcct = "Assets:Bank:Cash";
        const bondAcct = `Assets:FixedIncome:${bond.productType.replace(/ /g,"").replace(/&/g,"")}:${(bond.issuer||"").replace(/ /g,"")}`;
        const incAcct  = `Income:FixedIncome:${bond.productType.replace(/ /g,"").replace(/&/g,"")}`;
        const daysAgo = (d) => { if (!d) return ""; const diff = Math.floor((Date.now() - new Date(d)) / 86400000); return diff === 0 ? "Today" : diff === 1 ? "1 day ago" : diff + " days ago"; };

        return (
          <div className="wo-drawer-overlay" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}
            onClick={e=>{if(e.target===e.currentTarget) setSelectedBond(null);}}>
            <div style={{width:"min(960px, 95vw)",height:"100vh",background:T.bg,overflow:"hidden",boxShadow:"-4px 0 32px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column"}}>
              {/* Header */}
              <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,flexShrink:0}}>
                <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
                  <div style={{width:44,height:44,borderRadius:12,background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{tc.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:16,fontWeight:700}}>{bond.name}</div>
                    <div style={{fontSize:12,color:T.muted,marginTop:2}}>{bond.issuer} · {bond.issueCode||"—"}</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <Badge bg={bond.status==="Active"?T.upBg:T.inputBg} color={bond.status==="Active"?T.up:T.muted}>{bond.status}</Badge>
                    <button onClick={()=>{setEditBond(bond);setShowModal(true);}} style={{background:T.inputBg,border:"none",borderRadius:7,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",color:T.text}}>Edit</button>
                    <button onClick={()=>setSelectedBond(null)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16,color:T.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:10,marginBottom:14}}>
                  {[
                    {l:"Current Value",v:fmtCompact(bond.currentValue)},
                    {l:"Yield to Maturity",v:`${bond.yieldToMaturity}%`},
                    {l:"Unrealised P&L",v:(pnl>=0?"+":"")+fmtCompact(pnl)},
                  ].map(s=>(
                    <div key={s.l} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px"}}>
                      <div style={{fontSize:11,color:T.muted}}>{s.l}</div>
                      <div style={{fontSize:15,fontWeight:700,marginTop:4}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:4}}>
                  {[{id:"overview",label:"Overview"},{id:"transactions",label:`Transactions${txs.length>0?" ("+txs.length+")":""}`},{id:"postings",label:"Postings"}].map(dt=>(
                    <button key={dt.id} onClick={()=>setDrawerTab(dt.id)}
                      style={{padding:"6px 14px",borderRadius:8,border:"none",background:drawerTab===dt.id?T.selected:T.inputBg,
                        color:drawerTab===dt.id?T.selectedText:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:drawerTab===dt.id?700:400}}>
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Body */}
              <div style={{flex:1,padding:"20px 24px",overflowY:"auto",minHeight:0}}>
                {drawerTab === "overview" && (
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📋 Holding Details</div>
                      {[
                        ["Product Type",bond.productType],["Issuer",bond.issuer],
                        bond.issueCode?["Issue Code / Ticker",bond.issueCode]:null,
                        bond.creditRating?["Credit Rating",bond.creditRating]:null,
                        bond.couponRate>0?["Coupon Rate",`${bond.couponRate}% p.a.`]:null,
                        ["Yield to Maturity",`${bond.yieldToMaturity}%`],
                        ["Coupon Frequency",bond.couponFrequency],
                        bond.tenure?["Tenure",bond.tenure]:null,
                        bond.issueDate?["Issue Date",bond.issueDate]:null,
                        bond.maturityDate?["Maturity Date",bond.maturityDate]:null,
                        bond.nextPaymentDate?["Next Payment Date",bond.nextPaymentDate]:null,
                        ["Currency",bond.currency],
                        bond.autoRenewal!=null?["Auto-Renewal",bond.autoRenewal?"Yes":"No"]:null,
                        bond.sdicInsured!=null?["SDIC Insured",bond.sdicInsured?"Yes (up to S$100K)":"No"]:null,
                      ].filter(Boolean).map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                          <span style={{fontSize:12,color:T.muted}}>{k}</span>
                          <span style={{fontSize:12,fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>💰 Financial Summary</div>
                      {[
                        ["Face Value",`S$${(bond.faceValue||0).toLocaleString()}`],
                        ["Purchase Price",`S$${(bond.purchasePrice||0).toLocaleString()}`],
                        ["Current Value",`S$${(bond.currentValue||0).toLocaleString()}`],
                        ["Unrealised P&L",`${pnl>=0?"+":""}S$${pnl.toLocaleString()}`],
                        bond.units?["Units Held",bond.units.toLocaleString()]:null,
                        bond.currentPricePerUnit?["Price per Unit",`S$${bond.currentPricePerUnit.toFixed(3)}`]:null,
                      ].filter(Boolean).map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                          <span style={{fontSize:12,color:T.muted}}>{k}</span>
                          <span style={{fontSize:12,fontWeight:600,textAlign:"right"}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    {bond.notes && (
                      <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                        <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📝 Notes</div>
                        <div style={{padding:"12px 16px",fontSize:13,color:T.muted,lineHeight:1.6}}>{bond.notes}</div>
                      </div>
                    )}
                  </div>
                )}
                {drawerTab === "transactions" && (
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      {(()=>{
                        const income=txs.filter(t=>["Coupon","Distribution","Interest"].includes(t.type));
                        const purchases=txs.filter(t=>t.type==="Purchase");
                        return [
                          {label:"Total Income",value:`S$${income.reduce((s,t)=>s+(t.amount||0),0).toLocaleString()}`,sub:`${income.length} payments`,color:T.up},
                          {label:"Capital Deployed",value:`S$${purchases.reduce((s,t)=>s+(t.amount||0),0).toLocaleString()}`,sub:`${purchases.length} purchases`,color:T.text},
                          {label:"Transactions",value:String(txs.length),sub:"Total recorded",color:T.accent},
                        ];
                      })().map(s=>(
                        <div key={s.label} style={{background:T.inputBg,borderRadius:9,padding:"10px 12px"}}>
                          <div style={{fontSize:11,color:T.muted}}>{s.label}</div>
                          <div style={{fontSize:14,fontWeight:700,color:s.color,marginTop:4}}>{s.value}</div>
                          <div style={{fontSize:11,color:T.dim,marginTop:2}}>{s.sub}</div>
                        </div>
                      ))}
                    </div>
                    {bond.status !== "Matured" && bond.status !== "Redeemed" && (
                      <div style={{display:"flex",justifyContent:"flex-end"}}>
                        <button onClick={()=>setShowTxModal(true)} style={{padding:"7px 16px",borderRadius:7,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>+ Record Transaction</button>
                      </div>
                    )}
                    {txs.length===0?(
                      <div style={{textAlign:"center",padding:"32px 20px",color:T.muted}}><div style={{fontSize:28,marginBottom:8}}>📒</div><div style={{fontSize:13,fontWeight:600}}>No transactions yet</div></div>
                    ):(
                      <div style={{display:"flex",flexDirection:"column",gap:1,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                        {txs.map((tx,i)=>{
                          const isOut=["Sale","Redemption","Purchase"].includes(tx.type);
                          const isIncome=["Coupon","Distribution","Interest"].includes(tx.type);
                          return (
                            <div key={tx.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",background:i%2===0?T.bg:T.inputBg,borderTop:i>0?`1px solid ${T.border}`:"none"}}>
                              <div style={{width:34,height:34,borderRadius:8,background:isIncome?T.upBg:T.accentBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                                {{Purchase:"📥",Sale:"📤",Coupon:"🎁",Distribution:"🎁",Interest:"🏦",Redemption:"📤"}[tx.type]||"💰"}
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:600}}>{tx.type}{tx.notes?` — ${tx.notes}`:""}</div>
                                <div style={{fontSize:11,color:T.muted,marginTop:1,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                                  <span>{tx.date}</span>
                                  {tx.method&&<span style={{fontSize:10,background:T.inputBg,borderRadius:4,padding:"1px 6px"}}>{tx.method}</span>}
                                  {tx.ref&&<span style={{fontSize:10,color:T.dim,fontFamily:"monospace"}}>{tx.ref}</span>}
                                </div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div style={{fontSize:13,fontWeight:700,color:isIncome?T.up:tx.type==="Redemption"?T.up:T.down}}>
                                  {isIncome||tx.type==="Redemption"?"+":"-"} S${tx.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
                                </div>
                                <div style={{fontSize:10,color:T.dim,marginTop:1}}>{tx.type}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {drawerTab === "postings" && (() => {
                  const sortedTxs = (bond.transactions||[]).filter(t=>t.status==="Paid").slice().sort((a,b)=>a.date.localeCompare(b.date));
                  const journalRows = [];
                  sortedTxs.forEach(tx => {
                    if (tx.type==="Purchase") {
                      journalRows.push(
                        {date:tx.date,desc:`Purchase — ${tx.notes||bond.name}`,account:bondAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:cashAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else if (tx.type==="Sale"||tx.type==="Redemption") {
                      journalRows.push(
                        {date:tx.date,desc:`${tx.type} — ${tx.notes||bond.name}`,account:cashAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:bondAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else {
                      journalRows.push(
                        {date:tx.date,desc:`${tx.type} — ${tx.notes||bond.name}`,account:cashAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:incAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    }
                  });
                  if (isMobile && journalRows.length > 0) return <MobilePostingsList journalRows={journalRows} entryCount={sortedTxs.length} entryLabel="transactions"/>;
                  if (journalRows.length===0) return (
                    <div style={{textAlign:"center",padding:"48px 20px",color:T.muted}}><div style={{fontSize:32,marginBottom:10}}>📒</div><div style={{fontSize:13,fontWeight:600}}>No entries to post yet</div></div>
                  );
                  return (
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",background:T.bg}}>
                      <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:inter}}>Ledger Postings</div>
                        <div style={{fontSize:12,color:T.accent,marginTop:3,fontFamily:inter}}>Double-entry bookkeeping · PTA compliant · {sortedTxs.length} transaction{sortedTxs.length!==1?"s":""}</div>
                      </div>
                      <div style={{overflowX:"auto",overflowY:"auto",maxHeight:460}}>
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
                            {["Date","Account","Description","Debit","Credit"].map((h,hi)=>(
                              <th key={h} style={{padding:"9px 16px",textAlign:hi>=3?"right":"left",width:hi===0||hi>=3?148:undefined,fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,whiteSpace:"nowrap"}}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {journalRows.map((row,ri)=>(
                              <tr key={ri} style={{borderBottom:`1px solid ${T.border}`}}>
                                <td style={{padding:"11px 16px",verticalAlign:"top",width:148}}>
                                  {row._first?(<><div style={{fontSize:13,fontFamily:inter,whiteSpace:"nowrap"}}>{row.date}</div><div style={{fontSize:11,color:T.dim,marginTop:2,fontFamily:inter}}>{daysAgo(row.date)}</div></>):null}
                                </td>
                                <td style={{padding:"11px 16px",verticalAlign:"top"}}><span style={{fontFamily:mono,fontSize:12,color:T.text}}>{row.account}</span></td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",fontSize:12,color:T.muted,fontFamily:inter}}>{row.desc}</td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                                  {row.debit?<span style={{fontSize:13,fontWeight:700,color:T.up,fontFamily:inter}}>{row.amount}</span>:<span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                                </td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                                  {!row.debit?<span style={{fontSize:13,fontWeight:700,color:T.down,fontFamily:inter}}>{row.amount}</span>:<span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{padding:"12px 18px",borderTop:`1px solid ${T.border}`,background:T.sidebar}}>
                        <div style={{fontSize:12,fontWeight:700,marginBottom:6,fontFamily:inter}}>Double-Entry Accounting</div>
                        <div style={{fontSize:11,color:T.muted,lineHeight:1.8,fontFamily:inter}}>
                          <div>• <span style={{color:T.up,fontWeight:600}}>Debit (Dr):</span> Purchase → increases bond holdings; Coupon/Redemption → increases cash</div>
                          <div>• <span style={{color:T.down,fontWeight:600}}>Credit (Cr):</span> Purchase → reduces cash; Sale/Redemption → reduces holdings; Coupon → income recognised</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Transaction modal */}
      {showTxModal && selectedBond && (() => {
        const bond = bonds.find(b => b.id === selectedBond.id) || selectedBond;
        return <BondTxModalInner bond={bond} onSave={(tx) => {
          const newTx = {...tx, id:"BTX"+Date.now(), status:"Paid"};
          setBonds(prev => prev.map(b => b.id === bond.id ? { ...b, transactions: [...(b.transactions||[]), newTx] } : b));
          setShowTxModal(false);
          showToast(`${tx.type} recorded`, "success");
        }} onClose={()=>setShowTxModal(false)}/>;
      })()}

      {/* Add/Edit modal */}
      {showModal && editBond && (
        <BondModal bond={editBond} onSave={handleSave} onClose={()=>{setShowModal(false);setEditBond(null);}}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RETIREMENT MODULE
═══════════════════════════════════════════════════════════════ */

const RET_PLAN_TYPES = ["CPF LIFE","SRS Account","Retirement Income Plan","Legacy / Endowment Plan","Cash Reserve","CPF Balances"];

const RET_TYPE_CONFIG = {
  "CPF LIFE":                 { icon:"🏛️", color:"#1D4ED8", bg:"#EFF6FF" },
  "SRS Account":              { icon:"🏦", color:"#059669", bg:"#F0FDF4" },
  "Retirement Income Plan":   { icon:"📈", color:"#D97706", bg:"#FFFBEB" },
  "Legacy / Endowment Plan":  { icon:"🛡️", color:"#9333EA", bg:"#FDF4FF" },
  "Cash Reserve":             { icon:"💵", color:"#16A34A", bg:"#F0FDF4" },
  "CPF Balances":             { icon:"🇸🇬", color:"#DC2626", bg:"#FEF2F2" },
};

const RET_STATUS_OPTS = ["Active","In Payout","Matured","Surrendered","Pending"];

const EMPTY_RET_PLAN = {
  id:"", planType:"CPF LIFE", planName:"", provider:"", accountNumber:"",
  balance:0, monthlyPayout:0, payoutStartAge:65, payoutStartDate:"",
  payoutPlan:"Standard", payoutPeriod:"Lifetime",
  annualContribution:0, totalContributed:0,
  interestRate:0, maturityDate:"", surrenderValue:0, deathBenefit:0,
  fundingSource:"Cash", status:"Active", notes:"",
};

const RETIREMENT_INIT = [
  {
    id:"RT001", planType:"CPF LIFE", planName:"CPF LIFE Standard Plan", provider:"CPF Board", accountNumber:"S****567A",
    balance:198800, monthlyPayout:1520, payoutStartAge:65, payoutStartDate:"",
    payoutPlan:"Standard", payoutPeriod:"Lifetime",
    annualContribution:0, totalContributed:198800,
    interestRate:4.0, maturityDate:"", surrenderValue:0, deathBenefit:42000,
    fundingSource:"CPF", status:"Active",
    retirementSum:"FRS", raBalance:198800,
    notes:"Full Retirement Sum. Standard plan chosen for higher monthly payouts. Payout starts at 65.",
    transactions:[
      {id:"RTX001",date:"2026-03-01",type:"Payout",amount:1520,method:"CPF LIFE",ref:"CPFLIFE-MAR26",status:"Paid",notes:"Mar 2026 monthly payout"},
      {id:"RTX002",date:"2026-02-01",type:"Payout",amount:1520,method:"CPF LIFE",ref:"CPFLIFE-FEB26",status:"Paid",notes:"Feb 2026 monthly payout"},
      {id:"RTX003",date:"2026-01-01",type:"Payout",amount:1520,method:"CPF LIFE",ref:"CPFLIFE-JAN26",status:"Paid",notes:"Jan 2026 monthly payout"},
    ],
  },
  {
    id:"RT002", planType:"SRS Account", planName:"DBS SRS Account", provider:"DBS Bank", accountNumber:"SRS-8821",
    balance:86400, monthlyPayout:0, payoutStartAge:63, payoutStartDate:"",
    payoutPlan:"", payoutPeriod:"10-year withdrawal",
    annualContribution:15300, totalContributed:76500,
    interestRate:0.05, maturityDate:"", surrenderValue:86400, deathBenefit:0,
    fundingSource:"Cash", status:"Active",
    investedBalance:62000, cashBalance:24400,
    notes:"Max annual contribution $15,300. Invested in Syfe REIT+ and Endowus. Penalty-free withdrawal from age 63.",
    transactions:[
      {id:"RTX004",date:"2026-01-02",type:"Top-Up",amount:15300,method:"Bank Transfer",ref:"SRS-2026",status:"Paid",notes:"2026 annual SRS contribution — max $15,300"},
      {id:"RTX005",date:"2025-01-05",type:"Top-Up",amount:15300,method:"Bank Transfer",ref:"SRS-2025",status:"Paid",notes:"2025 annual SRS contribution"},
    ],
  },
  {
    id:"RT003", planType:"Retirement Income Plan", planName:"NTUC Gro Retire Flex", provider:"NTUC Income", accountNumber:"GRF-2019-88421",
    balance:45000, monthlyPayout:850, payoutStartAge:65, payoutStartDate:"2053-01-01",
    payoutPlan:"", payoutPeriod:"20 years",
    annualContribution:3600, totalContributed:18000,
    interestRate:3.25, maturityDate:"2073-01-01", surrenderValue:12800, deathBenefit:52000,
    fundingSource:"Cash", status:"Active",
    guaranteedPayout:620, projectedPayout:850,
    premiumPaymentTerm:20, premiumEndDate:"2039-01-01",
    notes:"Regular premium plan. Guaranteed $620/mo + projected non-guaranteed bonus. 20-year payout period from age 65.",
    transactions:[
      {id:"RTX006",date:"2026-03-01",type:"Premium",amount:300,method:"GIRO",ref:"GRF-MAR26",status:"Paid",notes:"Mar 2026 monthly premium"},
      {id:"RTX007",date:"2026-02-01",type:"Premium",amount:300,method:"GIRO",ref:"GRF-FEB26",status:"Paid",notes:"Feb 2026 monthly premium"},
      {id:"RTX008",date:"2026-01-01",type:"Premium",amount:300,method:"GIRO",ref:"GRF-JAN26",status:"Paid",notes:"Jan 2026 monthly premium"},
    ],
  },
  {
    id:"RT004", planType:"Legacy / Endowment Plan", planName:"Manulife Wealth Builder", provider:"Manulife", accountNumber:"MWB-2021-44190",
    balance:38000, monthlyPayout:0, payoutStartAge:0, payoutStartDate:"",
    payoutPlan:"", payoutPeriod:"Whole Life",
    annualContribution:6000, totalContributed:18000,
    interestRate:0, maturityDate:"", surrenderValue:14200, deathBenefit:120000,
    fundingSource:"Cash", status:"Active",
    annualCouponGuaranteed:1200, annualCouponProjected:2400, accumulatedCoupons:3600,
    premiumPaymentTerm:15, premiumEndDate:"2036-01-01",
    notes:"15-year premium term. 2% guaranteed annual coupon + non-guaranteed. Death benefit 120K. Coupons accumulating.",
    transactions:[
      {id:"RTX009",date:"2026-01-15",type:"Premium",amount:6000,method:"Bank Transfer",ref:"MWB-2026",status:"Paid",notes:"2026 annual premium"},
      {id:"RTX010",date:"2025-12-01",type:"Coupon",amount:1200,method:"Insurer Credit",ref:"MWB-COUP-2025",status:"Paid",notes:"2025 guaranteed annual coupon — accumulated with insurer"},
      {id:"RTX011",date:"2025-01-15",type:"Premium",amount:6000,method:"Bank Transfer",ref:"MWB-2025",status:"Paid",notes:"2025 annual premium"},
    ],
  },
  {
    id:"RT005", planType:"Cash Reserve", planName:"Retirement Buffer — OCBC 360", provider:"OCBC", accountNumber:"360-5567",
    balance:42000, monthlyPayout:0, payoutStartAge:0, payoutStartDate:"",
    payoutPlan:"", payoutPeriod:"",
    annualContribution:12000, totalContributed:42000,
    interestRate:2.5, maturityDate:"", surrenderValue:42000, deathBenefit:0,
    fundingSource:"Cash", status:"Active",
    accountType:"Savings", isLiquid:true,
    notes:"Liquid emergency + retirement buffer. Target 2-3 years of expenses. OCBC 360 bonus interest tiers.",
    transactions:[
      {id:"RTX012",date:"2026-03-01",type:"Top-Up",amount:1000,method:"Bank Transfer",ref:"OCBC-MAR26",status:"Paid",notes:"Mar 2026 monthly savings"},
      {id:"RTX013",date:"2026-02-01",type:"Top-Up",amount:1000,method:"Bank Transfer",ref:"OCBC-FEB26",status:"Paid",notes:"Feb 2026 monthly savings"},
      {id:"RTX014",date:"2025-12-15",type:"Interest",amount:87.50,method:"Bank Credit",ref:"OCBC-INT-Q4",status:"Paid",notes:"Q4 2025 interest credited"},
    ],
  },
  {
    id:"RT006", planType:"CPF Balances", planName:"CPF OA + SA", provider:"CPF Board", accountNumber:"S****567A",
    balance:185000, monthlyPayout:0, payoutStartAge:55, payoutStartDate:"",
    payoutPlan:"", payoutPeriod:"",
    annualContribution:22440, totalContributed:185000,
    interestRate:3.5, maturityDate:"", surrenderValue:0, deathBenefit:185000,
    fundingSource:"CPF", status:"Active",
    oaBalance:98000, saBalance:87000, maBalance:52000,
    monthlyContribution:1870, employerContribution:1020, employeeContribution:850,
    notes:"OA 2.5% + SA 4% + extra interest on first $60K. SA will merge into RA at 55 for CPF LIFE.",
    transactions:[
      {id:"RTX015",date:"2026-03-01",type:"Contribution",amount:1870,method:"Employer + Employee",ref:"CPF-MAR26",status:"Paid",notes:"Mar 2026 CPF contribution (OA $1,081 + SA $354 + MA $435)"},
      {id:"RTX016",date:"2026-02-01",type:"Contribution",amount:1870,method:"Employer + Employee",ref:"CPF-FEB26",status:"Paid",notes:"Feb 2026 CPF contribution"},
      {id:"RTX017",date:"2026-01-01",type:"Interest",amount:612,method:"CPF Board",ref:"CPF-INT-2025",status:"Paid",notes:"2025 annual interest credited — OA 2.5% + SA 4%"},
    ],
  },
  {
    id:"RT007", planType:"Retirement Income Plan", planName:"AIA Retirement Saver III", provider:"AIA", accountNumber:"ARS3-2022-10032",
    balance:22000, monthlyPayout:500, payoutStartAge:60, payoutStartDate:"2048-07-01",
    payoutPlan:"", payoutPeriod:"Lifetime",
    annualContribution:2400, totalContributed:7200,
    interestRate:3.0, maturityDate:"", surrenderValue:5800, deathBenefit:35000,
    fundingSource:"SRS", status:"Active",
    guaranteedPayout:380, projectedPayout:500,
    premiumPaymentTerm:25, premiumEndDate:"2047-07-01",
    notes:"Funded from SRS for tax efficiency. Lifetime payout option. Guaranteed $380/mo + projected bonuses.",
    transactions:[
      {id:"RTX018",date:"2026-01-01",type:"Premium",amount:2400,method:"SRS",ref:"ARS3-2026",status:"Paid",notes:"2026 annual premium — funded from SRS account"},
      {id:"RTX019",date:"2025-01-01",type:"Premium",amount:2400,method:"SRS",ref:"ARS3-2025",status:"Paid",notes:"2025 annual premium — funded from SRS account"},
    ],
  },
];

// ── Retirement Plan Modal ─────────────────────────────────────
function RetirementPlanModal({ plan, onSave, onClose }) {
  const [f, setF] = useState({ ...plan });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const isCpfLife = f.planType === "CPF LIFE";
  const isSrs = f.planType === "SRS Account";
  const isCpfBal = f.planType === "CPF Balances";
  const isIncome = f.planType === "Retirement Income Plan";
  const isLegacy = f.planType === "Legacy / Endowment Plan";
  const isCash = f.planType === "Cash Reserve";

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:16,width:540,maxHeight:"85vh",overflow:"auto",padding:"28px 28px 20px",border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:20}}>{f.id ? "Edit Plan" : "Add Retirement Plan"}</div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Plan Type</Label><Sel value={f.planType} onChange={e=>{set("planType",e.target.value);}} options={RET_PLAN_TYPES}/></div>
          <div><Label required>Provider / Institution</Label><Input value={f.provider} onChange={e=>set("provider",e.target.value)} placeholder="e.g. CPF Board, DBS, NTUC Income"/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Plan Name</Label><Input value={f.planName} onChange={e=>set("planName",e.target.value)} placeholder="e.g. CPF LIFE Standard, DBS SRS Account"/></div>
          <div><Label>Account / Policy No.</Label><Input value={f.accountNumber} onChange={e=>set("accountNumber",e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Balance / Value</Label><Input type="number" prefix="S$" value={f.balance} onChange={e=>set("balance",+e.target.value)}/></div>
          <div><Label>Total Contributed</Label><Input type="number" prefix="S$" value={f.totalContributed} onChange={e=>set("totalContributed",+e.target.value)}/></div>
          <div><Label>Annual Contribution</Label><Input type="number" prefix="S$" value={f.annualContribution} onChange={e=>set("annualContribution",+e.target.value)}/></div>
        </div>

        {/* Payout fields */}
        {(isCpfLife || isIncome || isLegacy) && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
            <div><Label>Monthly Payout</Label><Input type="number" prefix="S$" value={f.monthlyPayout} onChange={e=>set("monthlyPayout",+e.target.value)}/></div>
            <div><Label>Payout Start Age</Label><Input type="number" value={f.payoutStartAge} onChange={e=>set("payoutStartAge",+e.target.value)}/></div>
            <div><Label>Payout Period</Label><Input value={f.payoutPeriod} onChange={e=>set("payoutPeriod",e.target.value)} placeholder="Lifetime / 20 years"/></div>
          </div>
        )}
        {isCpfLife && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div><Label>CPF LIFE Plan</Label><Sel value={f.payoutPlan||"Standard"} onChange={e=>set("payoutPlan",e.target.value)} options={["Basic","Standard","Escalating"]}/></div>
            <div><Label>Retirement Sum Tier</Label><Sel value={f.retirementSum||"FRS"} onChange={e=>set("retirementSum",e.target.value)} options={["BRS","FRS","ERS"]}/></div>
          </div>
        )}
        {isSrs && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div><Label>Cash (Uninvested)</Label><Input type="number" prefix="S$" value={f.cashBalance||0} onChange={e=>set("cashBalance",+e.target.value)}/></div>
            <div><Label>Invested Amount</Label><Input type="number" prefix="S$" value={f.investedBalance||0} onChange={e=>set("investedBalance",+e.target.value)}/></div>
          </div>
        )}
        {isCpfBal && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
            <div><Label>OA Balance</Label><Input type="number" prefix="S$" value={f.oaBalance||0} onChange={e=>set("oaBalance",+e.target.value)}/></div>
            <div><Label>SA Balance</Label><Input type="number" prefix="S$" value={f.saBalance||0} onChange={e=>set("saBalance",+e.target.value)}/></div>
            <div><Label>MA Balance</Label><Input type="number" prefix="S$" value={f.maBalance||0} onChange={e=>set("maBalance",+e.target.value)}/></div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Interest / Return Rate (%)</Label><Input type="number" value={f.interestRate} onChange={e=>set("interestRate",+e.target.value)}/></div>
          <div><Label>Funding Source</Label><Sel value={f.fundingSource} onChange={e=>set("fundingSource",e.target.value)} options={["Cash","CPF","SRS"]}/></div>
          <div><Label>Status</Label><Sel value={f.status} onChange={e=>set("status",e.target.value)} options={RET_STATUS_OPTS}/></div>
        </div>
        {(isIncome || isLegacy) && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div><Label>Surrender Value</Label><Input type="number" prefix="S$" value={f.surrenderValue} onChange={e=>set("surrenderValue",+e.target.value)}/></div>
            <div><Label>Death Benefit</Label><Input type="number" prefix="S$" value={f.deathBenefit} onChange={e=>set("deathBenefit",+e.target.value)}/></div>
          </div>
        )}
        <div style={{marginBottom:20}}>
          <Label>Notes</Label>
          <textarea value={f.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="Additional notes…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none",resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Cancel</button>
          <button onClick={()=>onSave(f)} disabled={!f.planType||!f.planName||!f.provider}
            style={{padding:"9px 20px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,opacity:(!f.planType||!f.planName||!f.provider)?0.4:1}}>
            {f.id ? "Save Changes" : "Add Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Retirement Transaction Modal ──────────────────────────────
function RetirementTxModalInner({ plan, txTypes, txTypeIcon, onSave, onClose }) {
  const [f, setF] = useState({
    type: txTypes[0] || "Top-Up",
    date: new Date().toISOString().slice(0,10),
    amount: ["Payout"].includes(txTypes[0]) ? (plan.monthlyPayout||0) : 0,
    method: plan.fundingSource === "SRS" ? "SRS" : plan.fundingSource === "CPF" ? "CPF Board" : "Bank Transfer",
    ref: "",
    notes: "",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const isOut = ["Payout","Withdrawal"].includes(f.type);

  const handleTypeChange = (type) => {
    set("type", type);
    if (type === "Payout") set("amount", plan.monthlyPayout || 0);
    else if (type === "Premium") set("amount", plan.annualContribution ? plan.annualContribution / 12 : 0);
    else set("amount", 0);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:16,width:480,maxHeight:"85vh",overflow:"auto",padding:"28px 28px 20px",border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:6}}>Record Transaction</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:20}}>{plan.planName} · {plan.provider}</div>

        {/* Transaction type selector */}
        <div style={{marginBottom:14}}>
          <Label required>Transaction Type</Label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {txTypes.map(t=>(
              <button key={t} onClick={()=>handleTypeChange(t)}
                style={{flex:"1 1 auto",padding:"10px 14px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:f.type===t?700:400,
                  border:`1px solid ${f.type===t?T.selected:T.border}`,background:f.type===t?T.selected:T.bg,color:f.type===t?T.selectedText:T.muted}}>
                {txTypeIcon[t]||"💰"} {t}
              </button>
            ))}
          </div>
          <div style={{fontSize:11,color:T.dim,marginTop:6}}>
            {isOut ? "Money flowing OUT of this plan (reduces balance)" : f.type==="Interest"||f.type==="Coupon" ? "Passive income credited to this plan" : "Money flowing INTO this plan (increases balance)"}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Date</Label><Input type="date" value={f.date} onChange={e=>set("date",e.target.value)}/></div>
          <div><Label required>Amount</Label><Input type="number" prefix="S$" value={f.amount} onChange={e=>set("amount",+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Method</Label><Sel value={f.method} onChange={e=>set("method",e.target.value)} options={["Bank Transfer","GIRO","PayNow","CPF Board","SRS","Insurer Credit","Cash","Cheque"]}/></div>
          <div><Label>Reference</Label><Input value={f.ref} onChange={e=>set("ref",e.target.value)} placeholder="e.g. REF-123456"/></div>
        </div>
        <div style={{marginBottom:14}}>
          <Label>Notes</Label>
          <textarea value={f.notes} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="e.g. Mar 2026 monthly payout, annual SRS top-up…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none",resize:"vertical"}}/>
        </div>

        {/* Summary */}
        <div style={{background:isOut?T.downBg:T.upBg,borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:isOut?T.down:T.up,fontWeight:600}}>{isOut?"📤 Outflow — reduces plan balance":"📥 Inflow — increases plan balance"}</span>
          <span style={{fontWeight:700,color:isOut?T.down:T.up}}>{isOut?"-":"+"} S${(f.amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Cancel</button>
          <button onClick={()=>onSave(f)} disabled={!f.date||f.amount<=0}
            style={{padding:"9px 20px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,opacity:(!f.date||f.amount<=0)?0.4:1}}>
            Record {f.type}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Retirement Screen ─────────────────────────────────────────
function RetirementScreen({ plans, setPlans, showToast }) {
  const isMobile = useIsMobile();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [drawerTab, setDrawerTab] = useState("overview");
  const [showTxModal, setShowTxModal] = useState(false);
  const rtSort = useSortState();

  const activePlans = plans.filter(p => p.status === "Active" || p.status === "In Payout");
  const totalAssets = activePlans.reduce((s, p) => s + (p.balance||0), 0);
  const totalMonthlyIncome = activePlans.reduce((s, p) => s + (p.monthlyPayout||0), 0);
  const totalAnnualContrib = activePlans.reduce((s, p) => s + (p.annualContribution||0), 0);
  const plansInPayout = plans.filter(p => p.status === "In Payout").length;

  // Type breakdown
  const typeBreakdown = {};
  activePlans.forEach(p => { typeBreakdown[p.planType] = (typeBreakdown[p.planType]||0) + (p.balance||0); });

  const filtered = plans.filter(p => {
    if (filterType !== "All" && p.planType !== filterType) return false;
    if (filterStatus !== "All" && p.status !== filterStatus) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!(p.planName||"").toLowerCase().includes(q) && !(p.provider||"").toLowerCase().includes(q) && !(p.accountNumber||"").toLowerCase().includes(q) && !(p.planType||"").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleSave = (f) => {
    if (f.id) {
      setPlans(prev => prev.map(p => p.id === f.id ? { ...p, ...f } : p));
      showToast("Plan updated", "success");
    } else {
      setPlans(prev => [...prev, { ...f, id:"RT"+Date.now() }]);
      showToast("Plan added", "success");
    }
    setShowModal(false);
    setEditPlan(null);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>

      {/* ── Page header ── */}
      <div className="wo-page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:700}}>Retirement Portfolio</div>
          <div style={{fontSize:13,color:T.muted,marginTop:2}}>{activePlans.length} active plan{activePlans.length!==1?"s":""} · {plans.length} total</div>
        </div>
        <button onClick={()=>{setEditPlan({...EMPTY_RET_PLAN,id:""});setShowModal(true);}}
          style={{background:T.selected,color:T.selectedText,border:"none",borderRadius:9,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
          + Add Plan
        </button>
      </div>

      {/* ── Summary cards — 4 col ── */}
      <div className="wo-summary-grid" style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12,marginBottom:18}}>
        {[
          {label:"Total Retirement Assets",value:fmtCompact(totalAssets),sub:`${activePlans.length} active plans`,icon:"🏛️",color:T.text},
          {label:"Projected Monthly Income",value:totalMonthlyIncome>0?fmtCompact(totalMonthlyIncome):"—",sub:totalMonthlyIncome>0?"Combined CPF LIFE + insurance payouts":"No payouts configured yet",icon:"📈",color:T.up},
          {label:"Annual Contributions",value:fmtCompact(totalAnnualContrib),sub:"Yearly savings across all plans",icon:"💳",color:T.warn},
          {label:"Plans In Payout",value:String(plansInPayout),sub:plansInPayout>0?`${plansInPayout} plan${plansInPayout!==1?"s":""} currently paying out`:"No plans in payout phase yet",icon:"🎯",color:plansInPayout>0?T.up:T.muted},
        ].map((c,i)=>(
          <Card key={i} style={{padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{fontSize:12,color:T.muted,fontWeight:500}}>{c.label}</div>
              <span style={{fontSize:20}}>{c.icon}</span>
            </div>
            <div style={{fontSize:22,fontWeight:700,marginTop:8,color:T.text}}>{c.value}</div>
            <div style={{fontSize:11,color:T.dim,marginTop:4}}>{c.sub}</div>
          </Card>
        ))}
      </div>

      {/* ── Assets by plan type — breakdown bar ── */}
      {Object.keys(typeBreakdown).length > 0 && (
        <Card style={{padding:"16px 20px",marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Retirement Assets by Plan Type</div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
            {Object.entries(typeBreakdown).map(([type, val])=>{
              const pct = totalAssets > 0 ? (val/totalAssets*100).toFixed(0) : 0;
              const tc = RET_TYPE_CONFIG[type] || {icon:"📋",color:T.muted,bg:T.inputBg};
              return (
                <div key={type} style={{flex:"1 1 140px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:12,color:T.muted,fontWeight:500}}>{tc.icon} {type}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{pct}%</span>
                  </div>
                  <div style={{height:6,background:T.inputBg,borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:tc.color,borderRadius:3}}/>
                  </div>
                  <div style={{fontSize:11,color:T.dim,marginTop:4}}>{fmtCompact(val)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Filter toolbar ── */}
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:"1 1 200px"}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.dim,pointerEvents:"none"}}>🔍</span>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search plan name, provider, account no…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px 8px 34px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["All",...RET_STATUS_OPTS].map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)}
              style={{background:filterStatus===s?T.selected:T.inputBg,color:filterStatus===s?T.selectedText:T.muted,border:`1px solid ${filterStatus===s?T.selected:T.border}`,borderRadius:7,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:filterStatus===s?600:400}}>
              {s}
            </button>
          ))}
        </div>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)}
          style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 12px",fontSize:12,fontFamily:"inherit",color:T.text,cursor:"pointer",outline:"none"}}>
          {["All",...RET_PLAN_TYPES].map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{fontSize:12,color:T.muted,marginLeft:"auto"}}>{filtered.length} of {plans.length}</span>
      </div>

      {/* ── Plan table / mobile cards ── */}
      {filtered.length === 0 ? (
        <Card style={{padding:"48px 24px",textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>🏛️</div>
          <div style={{fontSize:14,fontWeight:600}}>No retirement plans found</div>
          <div style={{fontSize:12,color:T.muted,marginTop:4}}>Try adjusting filters or add a new plan</div>
        </Card>
      ) : isMobile ? (
        <Card style={{padding:0,overflow:"hidden"}}>
          {filtered.map(plan => {
            const tc = RET_TYPE_CONFIG[plan.planType] || {icon:"📋",color:T.muted,bg:T.inputBg};
            return <MobileListItem key={plan.id} onClick={()=>{setSelectedPlan(plan);setDrawerTab("overview");}}
              icon={tc.icon} iconBg={tc.bg} title={plan.planName} subtitle={`${plan.provider} · ${plan.planType}`}
              value={fmtCompact(plan.balance)} valueSub={plan.monthlyPayout>0?`+${fmtCompact(plan.monthlyPayout)}/mo`:plan.annualContribution>0?`${fmtCompact(plan.annualContribution)}/yr`:""}
              badge={plan.status} badgeBg={plan.status==="Active"?T.upBg:plan.status==="In Payout"?T.accentBg:T.inputBg} badgeColor={plan.status==="Active"?T.up:plan.status==="In Payout"?T.accent:T.muted}
            />;
          })}
        </Card>
      ) : (
        <Card style={{padding:0,overflowX:"auto"}} className="wo-table-scroll">
          <SortHeader gridCols="2.2fr 1fr 1.1fr 1.1fr 1fr 1fr 0.8fr" sortKey={rtSort.sortKey} sortDir={rtSort.sortDir} onSort={rtSort.onSort}
            columns={[["Plan / Provider","left","planName"],["Type","left","planType"],["Balance","right","balance"],["Monthly Payout","right","payout"],["Contribution","right","contrib"],["Payout Age","left","payoutAge"],["Status","left","status"]]}/>
          {rtSort.sortFn(filtered, (p, k) => {
            if (k==="planName") return (p.planName||"").toLowerCase();
            if (k==="planType") return (p.planType||"").toLowerCase();
            if (k==="balance") return p.balance||0;
            if (k==="payout") return p.monthlyPayout||0;
            if (k==="contrib") return p.annualContribution||0;
            if (k==="payoutAge") return p.payoutStartAge||99;
            if (k==="status") return p.status;
            return 0;
          }).map((plan, i) => {
            const tc = RET_TYPE_CONFIG[plan.planType] || {icon:"📋",color:T.muted,bg:T.inputBg};
            return (
              <div key={plan.id} onClick={()=>{setSelectedPlan(plan);setDrawerTab("overview");}}
                style={{display:"grid",gridTemplateColumns:"2.2fr 1fr 1.1fr 1.1fr 1fr 1fr 0.8fr",padding:"13px 20px",borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none",alignItems:"center",cursor:"pointer",
                  opacity:plan.status==="Matured"||plan.status==="Surrendered"?0.55:1,
                  background:plan.status==="Matured"||plan.status==="Surrendered"?T.sidebar:""}}
                onMouseEnter={e=>e.currentTarget.style.background=T.hover}
                onMouseLeave={e=>e.currentTarget.style.background=(plan.status==="Matured"||plan.status==="Surrendered"?T.sidebar:"")}>
                {/* Plan / Provider */}
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{width:34,height:34,borderRadius:9,background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{tc.icon}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{plan.planName}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:1}}>{plan.provider} · {plan.accountNumber||"—"}</div>
                  </div>
                </div>
                {/* Type */}
                <div style={{fontSize:12,color:T.muted}}>{plan.planType}</div>
                {/* Balance */}
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,fontWeight:700}}>{fmtCompact(plan.balance)}</div>
                  {plan.totalContributed>0 && <div style={{fontSize:10,color:T.dim,marginTop:1}}>of {fmtCompact(plan.totalContributed)} contributed</div>}
                </div>
                {/* Monthly Payout */}
                <div style={{textAlign:"right"}}>
                  {plan.monthlyPayout > 0 ? (
                    <div style={{fontSize:13,fontWeight:700,color:T.up}}>+{fmtCompact(plan.monthlyPayout)}/mo</div>
                  ) : <span style={{fontSize:12,color:T.dim}}>—</span>}
                </div>
                {/* Contribution */}
                <div style={{textAlign:"right"}}>
                  {plan.annualContribution > 0 ? (
                    <div style={{fontSize:12,color:T.text}}>{fmtCompact(plan.annualContribution)}/yr</div>
                  ) : <span style={{fontSize:12,color:T.dim}}>—</span>}
                </div>
                {/* Payout Age */}
                <div>
                  {plan.payoutStartAge > 0 ? (
                    <div style={{fontSize:12,color:T.text}}>Age {plan.payoutStartAge}</div>
                  ) : <span style={{fontSize:12,color:T.dim}}>—</span>}
                </div>
                {/* Status */}
                <div>
                  <Badge bg={plan.status==="Active"?T.upBg:plan.status==="In Payout"?T.accentBg:plan.status==="Matured"?T.inputBg:T.warnBg}
                    color={plan.status==="Active"?T.up:plan.status==="In Payout"?T.accent:plan.status==="Matured"?T.muted:T.warn}>
                    {plan.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ══ PLAN DETAIL DRAWER — slide-in overlay ══ */}
      {selectedPlan && (() => {
        const plan = plans.find(p => p.id === selectedPlan.id) || selectedPlan;
        const tc = RET_TYPE_CONFIG[plan.planType] || {icon:"📋",color:T.muted,bg:T.inputBg};
        const txs = (plan.transactions || []).slice().sort((a,b)=>b.date.localeCompare(a.date));
        const isPayoutPlan = plan.status === "In Payout" || plan.monthlyPayout > 0;
        const txTypeIcon = {Payout:"📤",Premium:"💳",["Top-Up"]:"📥",Contribution:"📥",Interest:"🏦",Coupon:"🎁",Withdrawal:"📤"};

        // Determine available tx types based on plan
        const getTxTypes = () => {
          if (plan.status === "In Payout" || plan.planType === "CPF LIFE") return ["Payout","Withdrawal"];
          if (plan.planType === "SRS Account") return ["Top-Up","Withdrawal","Interest"];
          if (plan.planType === "CPF Balances") return ["Contribution","Interest","Withdrawal"];
          if (plan.planType === "Cash Reserve") return ["Top-Up","Withdrawal","Interest"];
          if (plan.planType === "Retirement Income Plan" || plan.planType === "Legacy / Endowment Plan") return ["Premium","Coupon","Withdrawal"];
          return ["Top-Up","Withdrawal"];
        };

        // Postings logic
        const inter = "'Inter','Segoe UI',system-ui,sans-serif";
        const mono  = "'Courier New',Courier,monospace";
        const fmtA  = (v) => "S$" + Math.abs(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
        const cashAcct = "Assets:Bank:Cash";
        const planAcct = `Assets:Retirement:${plan.provider.replace(/ /g,"")}:${plan.planType.replace(/ /g,"").replace(/\//g,"")}`;
        const expAcct  = `Expenses:Retirement:${plan.planType.replace(/ /g,"").replace(/\//g,"")}`;
        const incAcct  = `Income:Retirement:${plan.planType.replace(/ /g,"").replace(/\//g,"")}`;

        const daysAgo = (d) => {
          if (!d) return "";
          const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
          return diff === 0 ? "Today" : diff === 1 ? "1 day ago" : diff + " days ago";
        };

        return (
          <div className="wo-drawer-overlay" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}
            onClick={e=>{if(e.target===e.currentTarget) setSelectedPlan(null);}}>
            <div style={{width:"min(960px, 95vw)",height:"100vh",background:T.bg,overflow:"hidden",boxShadow:"-4px 0 32px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column"}}>
              {/* Header */}
              <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,flexShrink:0}}>
                <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
                  <div style={{width:44,height:44,borderRadius:12,background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{tc.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:16,fontWeight:700}}>{plan.planName}</div>
                    <div style={{fontSize:12,color:T.muted,marginTop:2}}>{plan.provider} · {plan.accountNumber||"—"}</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <Badge bg={plan.status==="Active"?T.upBg:plan.status==="In Payout"?T.accentBg:T.inputBg}
                      color={plan.status==="Active"?T.up:plan.status==="In Payout"?T.accent:T.muted}>
                      {plan.status}
                    </Badge>
                    <button onClick={()=>{setEditPlan(plan);setShowModal(true);}} style={{background:T.inputBg,border:"none",borderRadius:7,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",color:T.text}}>Edit</button>
                    <button onClick={()=>setSelectedPlan(null)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16,color:T.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                  </div>
                </div>
                {/* Quick stats */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:10,marginBottom:14}}>
                  {[
                    {l:"Balance / Value",v:fmtCompact(plan.balance)},
                    {l:"Monthly Payout",v:plan.monthlyPayout>0?`+S$${plan.monthlyPayout.toLocaleString()}/mo`:"—"},
                    {l:plan.deathBenefit>0?"Death Benefit":plan.surrenderValue>0?"Surrender Value":"Total Contributed",
                     v:plan.deathBenefit>0?fmtCompact(plan.deathBenefit):plan.surrenderValue>0?fmtCompact(plan.surrenderValue):fmtCompact(plan.totalContributed)},
                  ].map(s=>(
                    <div key={s.l} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px"}}>
                      <div style={{fontSize:11,color:T.muted}}>{s.l}</div>
                      <div style={{fontSize:15,fontWeight:700,marginTop:4}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                {/* Pill tabs — same style as Loans/CC drawer */}
                <div style={{display:"flex",gap:4}}>
                  {[{id:"overview",label:"Overview"},{id:"transactions",label:`Transactions${txs.length>0?" ("+txs.length+")":""}`},{id:"postings",label:"Postings"}].map(dt=>(
                    <button key={dt.id} onClick={()=>setDrawerTab(dt.id)}
                      style={{padding:"6px 14px",borderRadius:8,border:"none",background:drawerTab===dt.id?T.selected:T.inputBg,
                        color:drawerTab===dt.id?T.selectedText:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:drawerTab===dt.id?700:400}}>
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Body */}
              <div style={{flex:1,padding:"20px 24px",overflowY:"auto",minHeight:0}}>

                {/* ── OVERVIEW TAB ── */}
                {drawerTab === "overview" && (
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    {/* Plan Details */}
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📋 Plan Details</div>
                      {[
                        ["Plan Type", plan.planType],
                        ["Provider", plan.provider],
                        plan.accountNumber ? ["Account / Policy No.", plan.accountNumber] : null,
                        ["Funding Source", plan.fundingSource],
                        plan.interestRate > 0 ? ["Interest / Return Rate", `${plan.interestRate}% p.a.`] : null,
                        plan.payoutStartAge > 0 ? ["Payout Start Age", `Age ${plan.payoutStartAge}`] : null,
                        plan.payoutPlan ? ["Payout Plan", plan.payoutPlan] : null,
                        plan.payoutPeriod ? ["Payout Period", plan.payoutPeriod] : null,
                        plan.payoutStartDate ? ["Payout Start Date", plan.payoutStartDate] : null,
                        plan.retirementSum ? ["Retirement Sum Tier", plan.retirementSum] : null,
                        plan.premiumPaymentTerm ? ["Premium Payment Term", `${plan.premiumPaymentTerm} years`] : null,
                        plan.premiumEndDate ? ["Premium End Date", plan.premiumEndDate] : null,
                        plan.maturityDate ? ["Maturity Date", plan.maturityDate] : null,
                      ].filter(Boolean).map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                          <span style={{fontSize:12,color:T.muted}}>{k}</span>
                          <span style={{fontSize:12,fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>💰 Financial Summary</div>
                      {[
                        ["Current Balance / Value", `S$${(plan.balance||0).toLocaleString()}`],
                        ["Total Contributed", `S$${(plan.totalContributed||0).toLocaleString()}`],
                        plan.annualContribution > 0 ? ["Annual Contribution", `S$${plan.annualContribution.toLocaleString()}/yr`] : null,
                        plan.monthlyPayout > 0 ? ["Monthly Payout", `S$${plan.monthlyPayout.toLocaleString()}/mo`] : null,
                        plan.guaranteedPayout > 0 ? ["Guaranteed Payout", `S$${plan.guaranteedPayout.toLocaleString()}/mo`] : null,
                        plan.projectedPayout > 0 ? ["Projected Payout (incl. bonuses)", `S$${plan.projectedPayout.toLocaleString()}/mo`] : null,
                        plan.surrenderValue > 0 ? ["Surrender Value", `S$${plan.surrenderValue.toLocaleString()}`] : null,
                        plan.deathBenefit > 0 ? ["Death Benefit", `S$${plan.deathBenefit.toLocaleString()}`] : null,
                        plan.annualCouponGuaranteed > 0 ? ["Annual Coupon (Guaranteed)", `S$${plan.annualCouponGuaranteed.toLocaleString()}`] : null,
                        plan.annualCouponProjected > 0 ? ["Annual Coupon (Projected)", `S$${plan.annualCouponProjected.toLocaleString()}`] : null,
                        plan.accumulatedCoupons > 0 ? ["Accumulated Coupons", `S$${plan.accumulatedCoupons.toLocaleString()}`] : null,
                        plan.oaBalance != null ? ["CPF OA Balance", `S$${(plan.oaBalance||0).toLocaleString()}`] : null,
                        plan.saBalance != null ? ["CPF SA Balance", `S$${(plan.saBalance||0).toLocaleString()}`] : null,
                        plan.maBalance != null ? ["CPF MA Balance", `S$${(plan.maBalance||0).toLocaleString()}`] : null,
                        plan.cashBalance != null ? ["Cash (Uninvested)", `S$${(plan.cashBalance||0).toLocaleString()}`] : null,
                        plan.investedBalance != null ? ["Invested Amount", `S$${(plan.investedBalance||0).toLocaleString()}`] : null,
                      ].filter(Boolean).map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                          <span style={{fontSize:12,color:T.muted}}>{k}</span>
                          <span style={{fontSize:12,fontWeight:600,textAlign:"right"}}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    {plan.notes && (
                      <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                        <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📝 Notes</div>
                        <div style={{padding:"12px 16px",fontSize:13,color:T.muted,lineHeight:1.6}}>{plan.notes}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TRANSACTIONS TAB ── */}
                {drawerTab === "transactions" && (
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {/* Summary strip */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      {(() => {
                        const inflows = txs.filter(t=>["Top-Up","Contribution","Premium","Interest","Coupon"].includes(t.type));
                        const outflows = txs.filter(t=>["Payout","Withdrawal"].includes(t.type));
                        const totalIn = inflows.reduce((s,t)=>s+(t.amount||0),0);
                        const totalOut = outflows.reduce((s,t)=>s+(t.amount||0),0);
                        return [
                          {label:"Total Inflows",value:`S$${totalIn.toLocaleString()}`,sub:`${inflows.length} transactions`,color:T.up},
                          {label:"Total Outflows",value:`S$${totalOut.toLocaleString()}`,sub:`${outflows.length} transactions`,color:T.down},
                          {label:"Net Flow",value:`S$${(totalIn-totalOut).toLocaleString()}`,sub:`${txs.length} total`,color:totalIn>=totalOut?T.up:T.down},
                        ];
                      })().map(s=>(
                        <div key={s.label} style={{background:T.inputBg,borderRadius:9,padding:"10px 12px"}}>
                          <div style={{fontSize:11,color:T.muted}}>{s.label}</div>
                          <div style={{fontSize:14,fontWeight:700,color:s.color,marginTop:4}}>{s.value}</div>
                          <div style={{fontSize:11,color:T.dim,marginTop:2}}>{s.sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* + Record button */}
                    {plan.status !== "Matured" && plan.status !== "Surrendered" && (
                      <div style={{display:"flex",justifyContent:"flex-end"}}>
                        <button onClick={()=>setShowTxModal(true)}
                          style={{padding:"7px 16px",borderRadius:7,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>
                          + Record Transaction
                        </button>
                      </div>
                    )}

                    {/* Transaction list */}
                    {txs.length === 0 ? (
                      <div style={{textAlign:"center",padding:"32px 20px",color:T.muted}}>
                        <div style={{fontSize:28,marginBottom:8}}>📒</div>
                        <div style={{fontSize:13,fontWeight:600}}>No transactions yet</div>
                        <div style={{fontSize:12,marginTop:4}}>Record a {isPayoutPlan?"payout":"premium or top-up"} to get started</div>
                      </div>
                    ) : (
                      <div style={{display:"flex",flexDirection:"column",gap:1,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                        {txs.map((tx,i)=>{
                          const isOut = ["Payout","Withdrawal"].includes(tx.type);
                          const isIn = ["Premium","Top-Up","Contribution"].includes(tx.type);
                          const isPassive = ["Interest","Coupon"].includes(tx.type);
                          return (
                            <div key={tx.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",background:i%2===0?T.bg:T.inputBg,borderTop:i>0?`1px solid ${T.border}`:"none"}}>
                              <div style={{width:34,height:34,borderRadius:8,background:isOut?T.downBg:isPassive?T.accentBg:T.upBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                                {txTypeIcon[tx.type]||"💰"}
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.type}{tx.notes?` — ${tx.notes}`:""}</div>
                                <div style={{fontSize:11,color:T.muted,marginTop:1,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                                  <span>{tx.date}</span>
                                  {tx.method && <span style={{fontSize:10,background:T.inputBg,borderRadius:4,padding:"1px 6px"}}>{tx.method}</span>}
                                  {tx.ref && <span style={{fontSize:10,color:T.dim,fontFamily:"monospace"}}>{tx.ref}</span>}
                                </div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div style={{fontSize:13,fontWeight:700,color:isOut?T.down:T.up}}>
                                  {isOut?"-":"+"} S${tx.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
                                </div>
                                <div style={{fontSize:10,color:T.dim,marginTop:1}}>{tx.type}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── POSTINGS TAB ── */}
                {drawerTab === "postings" && (() => {
                  const sortedTxs = (plan.transactions || []).filter(t=>t.status==="Paid").slice().sort((a,b)=>a.date.localeCompare(b.date));
                  const journalRows = [];

                  sortedTxs.forEach(tx => {
                    const isOut = ["Payout","Withdrawal"].includes(tx.type);
                    const isPassive = ["Interest","Coupon"].includes(tx.type);
                    const isPremium = tx.type === "Premium";

                    if (isOut) {
                      // Payout/Withdrawal: Dr Cash (receive), Cr Plan (reduce)
                      journalRows.push(
                        {date:tx.date,desc:`${tx.type} — ${tx.notes||plan.planName}`,account:cashAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:planAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else if (isPremium) {
                      // Premium: Dr Expense (insurance cost), Cr Cash (money out)
                      journalRows.push(
                        {date:tx.date,desc:`Premium — ${tx.notes||plan.planName}`,account:expAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:tx.method==="SRS"?"Assets:SRS:"+plan.provider.replace(/ /g,""):cashAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else if (isPassive) {
                      // Interest/Coupon: Dr Plan (value increases), Cr Income
                      journalRows.push(
                        {date:tx.date,desc:`${tx.type} — ${tx.notes||plan.planName}`,account:planAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:incAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else {
                      // Top-Up/Contribution: Dr Plan (value increases), Cr Cash (money out)
                      journalRows.push(
                        {date:tx.date,desc:`${tx.type} — ${tx.notes||plan.planName}`,account:planAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:cashAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    }
                  });

                  if (isMobile && journalRows.length > 0) return <MobilePostingsList journalRows={journalRows} entryCount={sortedTxs.length} entryLabel="transactions"/>;
                  if (journalRows.length === 0) {
                    return (
                      <div style={{textAlign:"center",padding:"48px 20px",color:T.muted}}>
                        <div style={{fontSize:32,marginBottom:10}}>📒</div>
                        <div style={{fontSize:13,fontWeight:600}}>No entries to post yet</div>
                        <div style={{fontSize:12,marginTop:4}}>Record a transaction to see ledger postings</div>
                      </div>
                    );
                  }

                  return (
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",background:T.bg}}>
                      <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:inter}}>Ledger Postings</div>
                        <div style={{fontSize:12,color:T.accent,marginTop:3,fontFamily:inter}}>Double-entry bookkeeping · PTA compliant · {sortedTxs.length} transaction{sortedTxs.length!==1?"s":""}</div>
                      </div>
                      <div style={{overflowX:"auto",overflowY:"auto",maxHeight:460}}>
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead>
                            <tr style={{borderBottom:`1px solid ${T.border}`}}>
                              <th style={{padding:"9px 16px",textAlign:"left",width:148,fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,whiteSpace:"nowrap"}}>Date</th>
                              <th style={{padding:"9px 16px",textAlign:"left",fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter}}>Account</th>
                              <th style={{padding:"9px 16px",textAlign:"left",fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter}}>Description</th>
                              <th style={{padding:"9px 16px",textAlign:"right",width:148,fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter}}>Debit</th>
                              <th style={{padding:"9px 16px",textAlign:"right",width:148,fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter}}>Credit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {journalRows.map((row,ri)=>(
                              <tr key={ri} style={{borderBottom:`1px solid ${T.border}`}}>
                                <td style={{padding:"11px 16px",verticalAlign:"top",width:148}}>
                                  {row._first ? (<><div style={{fontSize:13,fontWeight:400,color:T.text,fontFamily:inter,whiteSpace:"nowrap"}}>{row.date}</div><div style={{fontSize:11,color:T.dim,marginTop:2,fontFamily:inter}}>{daysAgo(row.date)}</div></>) : null}
                                </td>
                                <td style={{padding:"11px 16px",verticalAlign:"top"}}><span style={{fontFamily:mono,fontSize:12,color:T.text}}>{row.account}</span></td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",fontSize:12,color:T.muted,fontFamily:inter}}>{row.desc}</td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                                  {row.debit ? <span style={{fontSize:13,fontWeight:700,color:T.up,fontFamily:inter}}>{row.amount}</span> : <span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                                </td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                                  {!row.debit ? <span style={{fontSize:13,fontWeight:700,color:T.down,fontFamily:inter}}>{row.amount}</span> : <span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{padding:"12px 18px",borderTop:`1px solid ${T.border}`,background:T.sidebar}}>
                        <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:6,fontFamily:inter}}>Double-Entry Accounting</div>
                        <div style={{fontSize:11,color:T.muted,lineHeight:1.8,fontFamily:inter}}>
                          <div>• <span style={{color:T.up,fontWeight:600}}>Debit (Dr):</span> Payout/Withdrawal → increases cash; Premium → expenses; Top-up/Interest → increases plan value</div>
                          <div>• <span style={{color:T.down,fontWeight:600}}>Credit (Cr):</span> Payout/Withdrawal → reduces plan; Premium/Top-up → reduces cash; Interest/Coupon → income recognised</div>
                        </div>
                        <div style={{fontSize:11,color:T.dim,marginTop:8,fontFamily:inter}}>Every transaction has equal debits and credits (sum = 0)</div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>
        );
      })()}

      {/* Record Transaction Modal */}
      {showTxModal && selectedPlan && (() => {
        const plan = plans.find(p => p.id === selectedPlan.id) || selectedPlan;
        const isPayoutPlan = plan.status === "In Payout" || plan.monthlyPayout > 0;
        const getTxTypes = () => {
          if (plan.status === "In Payout" || plan.planType === "CPF LIFE") return ["Payout","Withdrawal"];
          if (plan.planType === "SRS Account") return ["Top-Up","Withdrawal","Interest"];
          if (plan.planType === "CPF Balances") return ["Contribution","Interest","Withdrawal"];
          if (plan.planType === "Cash Reserve") return ["Top-Up","Withdrawal","Interest"];
          if (plan.planType === "Retirement Income Plan" || plan.planType === "Legacy / Endowment Plan") return ["Premium","Coupon","Withdrawal"];
          return ["Top-Up","Withdrawal"];
        };
        const txTypes = getTxTypes();
        const txTypeIcon = {Payout:"📤",Premium:"💳",["Top-Up"]:"📥",Contribution:"📥",Interest:"🏦",Coupon:"🎁",Withdrawal:"📤"};

        return (
          <RetirementTxModalInner plan={plan} txTypes={txTypes} txTypeIcon={txTypeIcon}
            onSave={(tx) => {
              const newTx = {...tx, id:"RTX"+Date.now(), status:"Paid"};
              const isOut = ["Payout","Withdrawal"].includes(tx.type);
              setPlans(prev => prev.map(p => p.id === plan.id ? {
                ...p,
                transactions: [...(p.transactions||[]), newTx],
                balance: isOut ? Math.max(0, p.balance - tx.amount) : p.balance + tx.amount,
                totalContributed: !isOut && tx.type !== "Interest" && tx.type !== "Coupon" ? p.totalContributed + tx.amount : p.totalContributed,
              } : p));
              setShowTxModal(false);
              showToast(`${tx.type} recorded`, "success");
            }}
            onClose={()=>setShowTxModal(false)}
          />
        );
      })()}

      {/* Modal */}
      {showModal && editPlan && (
        <RetirementPlanModal plan={editPlan} onSave={handleSave} onClose={()=>{setShowModal(false);setEditPlan(null);}}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CRYPTOCURRENCIES MODULE
═══════════════════════════════════════════════════════════════ */

const CRYPTO_TYPES = ["Spot Crypto","Stablecoin","Staked","Lending / DeFi"];

const CRYPTO_TYPE_CONFIG = {
  "Spot Crypto":     { icon:"🪙", color:"#F59E0B", bg:"#FFFBEB" },
  "Stablecoin":      { icon:"💵", color:"#16A34A", bg:"#F0FDF4" },
  "Staked":          { icon:"🔒", color:"#9333EA", bg:"#FDF4FF" },
  "Lending / DeFi":  { icon:"🌾", color:"#0891B2", bg:"#ECFEFF" },
};

const CRYPTO_STATUS_OPTS = ["Active","Sold","Transferred Out","Lost"];

const CRYPTO_CHAINS = ["Bitcoin","Ethereum","Solana","BNB Chain","Polygon","Arbitrum","Avalanche","Polkadot","Cosmos","Other"];

const CRYPTO_WALLET_TYPES = ["Exchange","Hardware Wallet","Hot Wallet","Custody","DeFi Protocol"];

const EMPTY_CRYPTO = {
  id:"", holdingType:"Spot Crypto", symbol:"", name:"", chain:"Bitcoin",
  wallet:"", walletType:"Exchange", walletAddress:"",
  quantity:0, avgCostPrice:0, currentPrice:0,
  stakingYield:0, lendingProtocol:"",
  acquisitionDate:"", currency:"SGD", status:"Active", notes:"",
  transactions:[],
};

const CRYPTO_INIT = [
  {
    id:"CR001", holdingType:"Spot Crypto", symbol:"BTC", name:"Bitcoin", chain:"Bitcoin",
    wallet:"Ledger Nano X", walletType:"Hardware Wallet", walletAddress:"bc1q...4m7x",
    quantity:0.5842, avgCostPrice:48200, currentPrice:88750,
    stakingYield:0, lendingProtocol:"",
    acquisitionDate:"2024-03-12", currency:"SGD", status:"Active",
    notes:"Long-term hold. Self-custody on hardware wallet. DCA over 6 months.",
    transactions:[
      {id:"CTX001",date:"2024-03-12",type:"Buy",qty:0.25,price:42800,amount:10700,method:"Coinhako",ref:"CH-BTC-MAR24",status:"Complete",notes:"Initial DCA buy"},
      {id:"CTX002",date:"2024-06-20",type:"Buy",qty:0.15,price:51200,amount:7680,method:"Coinhako",ref:"CH-BTC-JUN24",status:"Complete",notes:"DCA continuation"},
      {id:"CTX003",date:"2024-09-05",type:"Buy",qty:0.18,price:54800,amount:9864,method:"Coinhako",ref:"CH-BTC-SEP24",status:"Complete",notes:"DCA final tranche"},
      {id:"CTX004",date:"2024-10-15",type:"Transfer Out",qty:0.5842,price:0,amount:0,method:"Self-custody",ref:"TX-TO-LEDGER",status:"Complete",notes:"Moved to Ledger Nano X for cold storage"},
    ],
  },
  {
    id:"CR002", holdingType:"Spot Crypto", symbol:"ETH", name:"Ethereum", chain:"Ethereum",
    wallet:"MetaMask", walletType:"Hot Wallet", walletAddress:"0x742d...38a1",
    quantity:4.25, avgCostPrice:3240, currentPrice:4820,
    stakingYield:0, lendingProtocol:"",
    acquisitionDate:"2024-05-08", currency:"SGD", status:"Active",
    notes:"Used for DeFi interactions and NFT minting. Kept in MetaMask for convenience.",
    transactions:[
      {id:"CTX005",date:"2024-05-08",type:"Buy",qty:2.5,price:3100,amount:7750,method:"Binance",ref:"BN-ETH-MAY24",status:"Complete",notes:"Initial purchase"},
      {id:"CTX006",date:"2024-07-22",type:"Buy",qty:1.75,price:3440,amount:6020,method:"Binance",ref:"BN-ETH-JUL24",status:"Complete",notes:"Added on dip"},
    ],
  },
  {
    id:"CR003", holdingType:"Stablecoin", symbol:"USDC", name:"USD Coin", chain:"Ethereum",
    wallet:"Binance", walletType:"Exchange", walletAddress:"",
    quantity:12500, avgCostPrice:1.35, currentPrice:1.34,
    stakingYield:0, lendingProtocol:"",
    acquisitionDate:"2025-01-10", currency:"SGD", status:"Active",
    notes:"Dry powder for buying dips. Kept on exchange for quick deployment.",
    transactions:[
      {id:"CTX007",date:"2025-01-10",type:"Buy",qty:12500,price:1.35,amount:16875,method:"Bank Transfer",ref:"BN-USDC-JAN25",status:"Complete",notes:"Converted SGD to USDC for crypto allocation"},
    ],
  },
  {
    id:"CR004", holdingType:"Lending / DeFi", symbol:"USDT", name:"Tether USD", chain:"BNB Chain",
    wallet:"Crypto.com Earn", walletType:"DeFi Protocol", walletAddress:"",
    quantity:8000, avgCostPrice:1.34, currentPrice:1.34,
    stakingYield:6.5, lendingProtocol:"Crypto.com Earn",
    acquisitionDate:"2024-11-20", currency:"SGD", status:"Active",
    notes:"Fixed 3-month term. 6.5% APY on stablecoin. Auto-renewing.",
    transactions:[
      {id:"CTX008",date:"2024-11-20",type:"Deposit",qty:8000,price:1.34,amount:10720,method:"Crypto.com Earn",ref:"CR-USDT-NOV24",status:"Complete",notes:"3-month term deposit"},
      {id:"CTX009",date:"2025-02-20",type:"Interest",qty:130,price:1.34,amount:174,method:"Auto-credit",ref:"CR-INT-FEB25",status:"Complete",notes:"Quarterly interest payout"},
      {id:"CTX010",date:"2025-05-20",type:"Interest",qty:132,price:1.34,amount:177,method:"Auto-credit",ref:"CR-INT-MAY25",status:"Complete",notes:"Quarterly interest payout"},
      {id:"CTX011",date:"2025-08-20",type:"Interest",qty:134,price:1.34,amount:180,method:"Auto-credit",ref:"CR-INT-AUG25",status:"Complete",notes:"Quarterly interest payout"},
      {id:"CTX012",date:"2025-11-20",type:"Interest",qty:136,price:1.34,amount:182,method:"Auto-credit",ref:"CR-INT-NOV25",status:"Complete",notes:"Quarterly interest payout"},
    ],
  },
  {
    id:"CR005", holdingType:"Staked", symbol:"ETH", name:"Ethereum (Staked via Lido)", chain:"Ethereum",
    wallet:"Lido — stETH", walletType:"DeFi Protocol", walletAddress:"0x742d...38a1",
    quantity:2.0, avgCostPrice:3350, currentPrice:4820,
    stakingYield:3.2, lendingProtocol:"Lido",
    acquisitionDate:"2024-08-15", currency:"SGD", status:"Active",
    notes:"Liquid staking via Lido. Receives stETH. ~3.2% APY on ETH. Can unstake anytime.",
    transactions:[
      {id:"CTX013",date:"2024-08-15",type:"Stake",qty:2.0,price:3350,amount:6700,method:"Lido",ref:"LIDO-STAKE-AUG24",status:"Complete",notes:"Staked 2 ETH via Lido for stETH"},
      {id:"CTX014",date:"2025-02-15",type:"Staking Reward",qty:0.032,price:4100,amount:131.20,method:"Auto-rebase",ref:"LIDO-RWD-FEB25",status:"Complete",notes:"H1 staking reward (accrued via rebase)"},
      {id:"CTX015",date:"2025-08-15",type:"Staking Reward",qty:0.033,price:4620,amount:152.46,method:"Auto-rebase",ref:"LIDO-RWD-AUG25",status:"Complete",notes:"H2 staking reward"},
    ],
  },
  {
    id:"CR006", holdingType:"Staked", symbol:"SOL", name:"Solana", chain:"Solana",
    wallet:"Phantom", walletType:"Hot Wallet", walletAddress:"7xKw...9mP2",
    quantity:62.5, avgCostPrice:180, currentPrice:310,
    stakingYield:7.1, lendingProtocol:"Marinade Finance",
    acquisitionDate:"2024-09-03", currency:"SGD", status:"Active",
    notes:"Native SOL staking via Marinade. ~7.1% APY. Liquid staking with mSOL.",
    transactions:[
      {id:"CTX016",date:"2024-09-03",type:"Buy",qty:62.5,price:180,amount:11250,method:"Binance",ref:"BN-SOL-SEP24",status:"Complete",notes:"Purchased SOL for staking"},
      {id:"CTX017",date:"2024-09-10",type:"Stake",qty:62.5,price:0,amount:0,method:"Marinade",ref:"MNDE-STAKE-SEP24",status:"Complete",notes:"Delegated to Marinade validator"},
      {id:"CTX018",date:"2025-03-10",type:"Staking Reward",qty:2.2,price:265,amount:583,method:"Auto-restake",ref:"MNDE-RWD-MAR25",status:"Complete",notes:"H1 rewards"},
      {id:"CTX019",date:"2025-09-10",type:"Staking Reward",qty:2.1,price:290,amount:609,method:"Auto-restake",ref:"MNDE-RWD-SEP25",status:"Complete",notes:"H2 rewards"},
    ],
  },
  {
    id:"CR007", holdingType:"Spot Crypto", symbol:"AVAX", name:"Avalanche", chain:"Avalanche",
    wallet:"Coinbase", walletType:"Exchange", walletAddress:"",
    quantity:85, avgCostPrice:42, currentPrice:38.50,
    stakingYield:0, lendingProtocol:"",
    acquisitionDate:"2025-02-28", currency:"SGD", status:"Active",
    notes:"Speculative position. Waiting for ecosystem growth.",
    transactions:[
      {id:"CTX020",date:"2025-02-28",type:"Buy",qty:85,price:42,amount:3570,method:"Coinbase",ref:"CB-AVAX-FEB25",status:"Complete",notes:"Alt allocation"},
    ],
  },
];

// ── Crypto Transaction Modal ──────────────────────────────────
function CryptoTxModalInner({ crypto, onSave, onClose }) {
  const txTypes = crypto.holdingType === "Staked" ? ["Stake","Unstake","Staking Reward","Transfer In","Transfer Out"]
    : crypto.holdingType === "Lending / DeFi" ? ["Deposit","Withdraw","Interest"]
    : crypto.holdingType === "Stablecoin" ? ["Buy","Sell","Transfer In","Transfer Out","Interest"]
    : ["Buy","Sell","Transfer In","Transfer Out","Airdrop","Fee"];
  const txTypeIcon = {Buy:"📥",Sell:"📤","Transfer In":"⬇",  "Transfer Out":"⬆",Stake:"🔒",Unstake:"🔓","Staking Reward":"🎁",Deposit:"📥",Withdraw:"📤",Interest:"💰",Airdrop:"🎉",Fee:"⚠️"};

  const [f, setF] = useState({
    type: txTypes[0],
    date: new Date().toISOString().slice(0,10),
    qty: 0, price: crypto.currentPrice || 0, amount: 0,
    method: crypto.wallet || "", ref: "", notes: "",
  });
  const set = (k, v) => {
    setF(p => {
      const next = { ...p, [k]: v };
      if (k === "qty" || k === "price") {
        next.amount = +((+next.qty || 0) * (+next.price || 0)).toFixed(2);
      }
      return next;
    });
  };
  const isOut = ["Sell","Transfer Out","Unstake","Withdraw","Fee"].includes(f.type);
  const isIn = ["Staking Reward","Interest","Airdrop"].includes(f.type);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:16,width:480,maxHeight:"85vh",overflow:"auto",padding:"28px 28px 20px",border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:6}}>Record Transaction</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:20}}>{crypto.symbol} · {crypto.name} · {crypto.wallet}</div>
        <div style={{marginBottom:14}}>
          <Label required>Transaction Type</Label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {txTypes.map(t=>(
              <button key={t} onClick={()=>set("type",t)}
                style={{flex:"1 1 auto",padding:"10px 14px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:f.type===t?700:400,
                  border:`1px solid ${f.type===t?T.selected:T.border}`,background:f.type===t?T.selected:T.bg,color:f.type===t?T.selectedText:T.muted}}>
                {txTypeIcon[t]||"💰"} {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Date</Label><Input type="date" value={f.date} onChange={e=>set("date",e.target.value)}/></div>
          <div><Label>Quantity ({crypto.symbol})</Label><Input type="number" value={f.qty} onChange={e=>set("qty",+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Price per Unit</Label><Input type="number" prefix="S$" value={f.price} onChange={e=>set("price",+e.target.value)}/></div>
          <div><Label required>Amount (SGD)</Label><Input type="number" prefix="S$" value={f.amount} onChange={e=>set("amount",+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Method / Venue</Label><Input value={f.method} onChange={e=>set("method",e.target.value)} placeholder="e.g. Binance, Ledger, Lido"/></div>
          <div><Label>Reference / Tx Hash</Label><Input value={f.ref} onChange={e=>set("ref",e.target.value)} placeholder="0x... or exchange ref"/></div>
        </div>
        <div style={{marginBottom:14}}>
          <Label>Notes</Label>
          <textarea value={f.notes} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="e.g. DCA buy, staking reward, moved to cold storage…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none",resize:"vertical"}}/>
        </div>
        <div style={{background:isOut?T.downBg:T.upBg,borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:isOut?T.down:T.up,fontWeight:600}}>
            {f.type==="Buy"||f.type==="Deposit"||f.type==="Stake"?"📥 Capital deployed":isOut?"📤 Capital returned":isIn?"🎁 Income received":"🔄 Transfer"}
          </span>
          <span style={{fontWeight:700,color:isOut?T.down:T.up}}>{isOut?"-":"+"} S${(f.amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Cancel</button>
          <button onClick={()=>onSave(f)} disabled={!f.date}
            style={{padding:"9px 20px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,opacity:(!f.date)?0.4:1}}>
            Record {f.type}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Crypto Add/Edit Modal ─────────────────────────────────────
function CryptoModal({ crypto, onSave, onClose }) {
  const [f, setF] = useState({ ...crypto });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:16,width:560,maxHeight:"85vh",overflow:"auto",padding:"28px 28px 20px",border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:20}}>{f.id ? "Edit Holding" : "Add Crypto Holding"}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Holding Type</Label><Sel value={f.holdingType} onChange={e=>set("holdingType",e.target.value)} options={CRYPTO_TYPES}/></div>
          <div><Label required>Chain / Network</Label><Sel value={f.chain} onChange={e=>set("chain",e.target.value)} options={CRYPTO_CHAINS}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:14,marginBottom:14}}>
          <div><Label required>Symbol</Label><Input value={f.symbol} onChange={e=>set("symbol",e.target.value.toUpperCase())} placeholder="BTC, ETH, SOL"/></div>
          <div><Label required>Name</Label><Input value={f.name} onChange={e=>set("name",e.target.value)} placeholder="Bitcoin, Ethereum"/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Wallet / Venue</Label><Input value={f.wallet} onChange={e=>set("wallet",e.target.value)} placeholder="Binance, Ledger, MetaMask"/></div>
          <div><Label>Wallet Type</Label><Sel value={f.walletType} onChange={e=>set("walletType",e.target.value)} options={CRYPTO_WALLET_TYPES}/></div>
        </div>
        <div style={{marginBottom:14}}>
          <Label>Wallet Address (optional)</Label>
          <Input value={f.walletAddress} onChange={e=>set("walletAddress",e.target.value)} placeholder="0x... or bc1q..."/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Quantity</Label><Input type="number" value={f.quantity} onChange={e=>set("quantity",+e.target.value)}/></div>
          <div><Label>Avg Cost (SGD)</Label><Input type="number" prefix="S$" value={f.avgCostPrice} onChange={e=>set("avgCostPrice",+e.target.value)}/></div>
          <div><Label>Current Price (SGD)</Label><Input type="number" prefix="S$" value={f.currentPrice} onChange={e=>set("currentPrice",+e.target.value)}/></div>
        </div>
        {(f.holdingType === "Staked" || f.holdingType === "Lending / DeFi") && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div><Label>Yield / APY (%)</Label><Input type="number" value={f.stakingYield} onChange={e=>set("stakingYield",+e.target.value)}/></div>
            <div><Label>Protocol</Label><Input value={f.lendingProtocol} onChange={e=>set("lendingProtocol",e.target.value)} placeholder="Lido, Aave, Marinade"/></div>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Acquisition Date</Label><Input type="date" value={f.acquisitionDate} onChange={e=>set("acquisitionDate",e.target.value)}/></div>
          <div><Label>Currency</Label><Sel value={f.currency} onChange={e=>set("currency",e.target.value)} options={["SGD","USD"]}/></div>
          <div><Label>Status</Label><Sel value={f.status} onChange={e=>set("status",e.target.value)} options={CRYPTO_STATUS_OPTS}/></div>
        </div>
        <div style={{marginBottom:20}}>
          <Label>Notes</Label>
          <textarea value={f.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="Strategy, storage notes…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none",resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Cancel</button>
          <button onClick={()=>onSave(f)} disabled={!f.symbol||!f.name||!f.wallet}
            style={{padding:"9px 20px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,opacity:(!f.symbol||!f.name||!f.wallet)?0.4:1}}>
            {f.id ? "Save Changes" : "Add Holding"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cryptocurrencies Screen ───────────────────────────────────
function CryptoScreen({ cryptos, setCryptos, showToast }) {
  const isMobile = useIsMobile();
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editCrypto, setEditCrypto] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [drawerTab, setDrawerTab] = useState("overview");
  const [showTxModal, setShowTxModal] = useState(false);
  const crSort = useSortState();

  const activeHoldings = cryptos.filter(c => c.status === "Active");
  const totalCurrentValue = activeHoldings.reduce((s,c) => s + ((c.quantity||0)*(c.currentPrice||0)), 0);
  const totalCost = activeHoldings.reduce((s,c) => s + ((c.quantity||0)*(c.avgCostPrice||0)), 0);
  const totalUnrealizedPnL = totalCurrentValue - totalCost;
  const totalIncome = cryptos.flatMap(c=>(c.transactions||[])).filter(t=>["Staking Reward","Interest","Airdrop"].includes(t.type)&&t.status==="Complete").reduce((s,t)=>s+(t.amount||0),0);
  const yieldingHoldings = activeHoldings.filter(c => (c.stakingYield||0) > 0);
  const avgYield = yieldingHoldings.length > 0 ? yieldingHoldings.reduce((s,c)=>s+(c.stakingYield||0),0)/yieldingHoldings.length : 0;

  // Type breakdown
  const typeBreakdown = {};
  activeHoldings.forEach(c => {
    const val = (c.quantity||0)*(c.currentPrice||0);
    typeBreakdown[c.holdingType] = (typeBreakdown[c.holdingType]||0) + val;
  });

  const filtered = cryptos.filter(c => {
    if (filterType !== "All" && c.holdingType !== filterType) return false;
    if (filterStatus !== "All" && c.status !== filterStatus) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!(c.symbol||"").toLowerCase().includes(q) && !(c.name||"").toLowerCase().includes(q) && !(c.wallet||"").toLowerCase().includes(q) && !(c.chain||"").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleSave = (f) => {
    if (f.id) {
      setCryptos(prev => prev.map(c => c.id === f.id ? { ...c, ...f } : c));
      showToast("Holding updated", "success");
    } else {
      setCryptos(prev => [...prev, { ...f, id:"CR"+Date.now(), transactions:[] }]);
      showToast("Holding added", "success");
    }
    setShowModal(false);
    setEditCrypto(null);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {/* Page header */}
      <div className="wo-page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:700}}>Crypto Portfolio</div>
          <div style={{fontSize:13,color:T.muted,marginTop:2}}>{activeHoldings.length} active holding{activeHoldings.length!==1?"s":""} · {cryptos.length} total</div>
        </div>
        <button onClick={()=>{setEditCrypto({...EMPTY_CRYPTO,id:""});setShowModal(true);}}
          style={{background:T.selected,color:T.selectedText,border:"none",borderRadius:9,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
          + Add Holding
        </button>
      </div>

      {/* Summary cards */}
      <div className="wo-summary-grid" style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12,marginBottom:18}}>
        {[
          {label:"Total Portfolio Value",value:fmtCompact(totalCurrentValue),sub:`Cost basis: ${fmtCompact(totalCost)}`,icon:"💎",color:T.text},
          {label:"Unrealised P&L",value:(totalUnrealizedPnL>=0?"+":"")+fmtCompact(totalUnrealizedPnL),sub:`${totalCost>0?((totalUnrealizedPnL/totalCost)*100).toFixed(1):0}% return`,icon:"📈",color:totalUnrealizedPnL>=0?T.up:T.down},
          {label:"Yield Earned",value:fmtCompact(totalIncome),sub:"Staking + lending + airdrops",icon:"🎁",color:T.up},
          {label:"Avg Staking/Yield APY",value:`${avgYield.toFixed(2)}%`,sub:`${yieldingHoldings.length} yielding position${yieldingHoldings.length!==1?"s":""}`,icon:"🔒",color:T.accent},
        ].map((c,i)=>(
          <Card key={i} style={{padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{fontSize:12,color:T.muted,fontWeight:500}}>{c.label}</div>
              <span style={{fontSize:20}}>{c.icon}</span>
            </div>
            <div style={{fontSize:22,fontWeight:700,marginTop:8,color:c.color}}>{c.value}</div>
            <div style={{fontSize:11,color:T.dim,marginTop:4}}>{c.sub}</div>
          </Card>
        ))}
      </div>

      {/* Breakdown bar */}
      {Object.keys(typeBreakdown).length > 0 && (
        <Card style={{padding:"16px 20px",marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Allocation by Holding Type</div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
            {Object.entries(typeBreakdown).map(([type, val])=>{
              const pct = totalCurrentValue > 0 ? (val/totalCurrentValue*100).toFixed(0) : 0;
              const tc = CRYPTO_TYPE_CONFIG[type] || {icon:"🪙",color:T.muted,bg:T.inputBg};
              return (
                <div key={type} style={{flex:"1 1 140px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:12,color:T.muted,fontWeight:500}}>{tc.icon} {type}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{pct}%</span>
                  </div>
                  <div style={{height:6,background:T.inputBg,borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:tc.color,borderRadius:3}}/>
                  </div>
                  <div style={{fontSize:11,color:T.dim,marginTop:4}}>{fmtCompact(val)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filter toolbar */}
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:"1 1 200px"}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.dim,pointerEvents:"none"}}>🔍</span>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search symbol, name, wallet, chain…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px 8px 34px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["All",...CRYPTO_STATUS_OPTS].map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)}
              style={{background:filterStatus===s?T.selected:T.inputBg,color:filterStatus===s?T.selectedText:T.muted,border:`1px solid ${filterStatus===s?T.selected:T.border}`,borderRadius:7,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:filterStatus===s?600:400}}>
              {s}
            </button>
          ))}
        </div>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)}
          style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 12px",fontSize:12,fontFamily:"inherit",color:T.text,cursor:"pointer",outline:"none"}}>
          {["All",...CRYPTO_TYPES].map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{fontSize:12,color:T.muted,marginLeft:"auto"}}>{filtered.length} of {cryptos.length}</span>
      </div>

      {/* Table / Mobile cards */}
      {filtered.length === 0 ? (
        <Card style={{padding:"48px 24px",textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>🪙</div>
          <div style={{fontSize:14,fontWeight:600}}>No holdings found</div>
          <div style={{fontSize:12,color:T.muted,marginTop:4}}>Try adjusting filters or add a new holding</div>
        </Card>
      ) : isMobile ? (
        <Card style={{padding:0,overflow:"hidden"}}>
          {filtered.map(c => {
            const tc = CRYPTO_TYPE_CONFIG[c.holdingType] || {icon:"🪙",color:T.muted,bg:T.inputBg};
            const value = (c.quantity||0)*(c.currentPrice||0);
            const cost = (c.quantity||0)*(c.avgCostPrice||0);
            const pnl = value - cost;
            return <MobileListItem key={c.id} onClick={()=>{setSelectedCrypto(c);setDrawerTab("overview");}}
              icon={tc.icon} iconBg={tc.bg} title={`${c.symbol} · ${c.name}`} subtitle={`${c.wallet} · ${c.chain}`}
              value={fmtCompact(value)} valueColor={T.text} valueSub={`${(+c.quantity).toLocaleString(undefined,{maximumFractionDigits:6})} ${c.symbol}`}
              badge={c.status} badgeBg={c.status==="Active"?T.upBg:T.inputBg} badgeColor={c.status==="Active"?T.up:T.muted}
              extra={pnl !== 0 ? <span style={{fontSize:11,fontWeight:600,color:pnl>=0?T.up:T.down}}>{pnl>=0?"+":""}{fmtCompact(pnl)}</span> : null}
            />;
          })}
        </Card>
      ) : (
        <Card style={{padding:0,overflowX:"auto"}} className="wo-table-scroll">
          <SortHeader gridCols="2.2fr 1fr 1.2fr 1.1fr 1fr 1fr 0.8fr" sortKey={crSort.sortKey} sortDir={crSort.sortDir} onSort={crSort.onSort}
            columns={[["Asset / Wallet","left","name"],["Type","left","type"],["Holdings","right","value"],["Avg / Current","right","price"],["APY","right","yield"],["P&L","right","pnl"],["Status","left","status"]]}/>
          {crSort.sortFn(filtered, (c, k) => {
            const value = (c.quantity||0)*(c.currentPrice||0);
            const cost = (c.quantity||0)*(c.avgCostPrice||0);
            if (k==="name") return (c.symbol||"").toLowerCase();
            if (k==="type") return (c.holdingType||"").toLowerCase();
            if (k==="value") return value;
            if (k==="price") return c.currentPrice||0;
            if (k==="yield") return c.stakingYield||0;
            if (k==="pnl") return value - cost;
            if (k==="status") return c.status;
            return 0;
          }).map((c, i) => {
            const tc = CRYPTO_TYPE_CONFIG[c.holdingType] || {icon:"🪙",color:T.muted,bg:T.inputBg};
            const value = (c.quantity||0)*(c.currentPrice||0);
            const cost = (c.quantity||0)*(c.avgCostPrice||0);
            const pnl = value - cost;
            const pnlPct = cost > 0 ? (pnl/cost*100) : 0;
            return (
              <div key={c.id} onClick={()=>{setSelectedCrypto(c);setDrawerTab("overview");}}
                style={{display:"grid",gridTemplateColumns:"2.2fr 1fr 1.2fr 1.1fr 1fr 1fr 0.8fr",padding:"13px 20px",borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none",alignItems:"center",cursor:"pointer",
                  opacity:c.status!=="Active"?0.55:1,background:c.status!=="Active"?T.sidebar:""}}
                onMouseEnter={e=>e.currentTarget.style.background=T.hover}
                onMouseLeave={e=>e.currentTarget.style.background=(c.status!=="Active"?T.sidebar:"")}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{width:34,height:34,borderRadius:9,background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{tc.icon}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{c.symbol} · {c.name}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:1}}>{c.wallet} · {c.chain}</div>
                  </div>
                </div>
                <div style={{fontSize:12,color:T.muted}}>{c.holdingType}</div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,fontWeight:700}}>{fmtCompact(value)}</div>
                  <div style={{fontSize:10,color:T.dim,marginTop:1}}>{(+c.quantity).toLocaleString(undefined,{maximumFractionDigits:6})} {c.symbol}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,color:T.text}}>S${(+c.currentPrice).toLocaleString(undefined,{maximumFractionDigits:2})}</div>
                  <div style={{fontSize:10,color:T.dim,marginTop:1}}>Avg S${(+c.avgCostPrice).toLocaleString(undefined,{maximumFractionDigits:2})}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  {c.stakingYield > 0 ? <div style={{fontSize:12,fontWeight:600,color:T.accent}}>{c.stakingYield}%</div> : <div style={{fontSize:12,color:T.dim}}>—</div>}
                  {c.lendingProtocol && <div style={{fontSize:10,color:T.dim,marginTop:1}}>{c.lendingProtocol}</div>}
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,fontWeight:600,color:pnl>=0?T.up:T.down}}>{pnl>=0?"+":""}{fmtCompact(pnl)}</div>
                  <div style={{fontSize:10,color:pnl>=0?T.up:T.down,marginTop:1}}>{pnl>=0?"+":""}{pnlPct.toFixed(1)}%</div>
                </div>
                <div>
                  <Badge bg={c.status==="Active"?T.upBg:T.inputBg}
                    color={c.status==="Active"?T.up:T.muted}>
                    {c.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ══ CRYPTO DETAIL DRAWER ══ */}
      {selectedCrypto && (() => {
        const crypto = cryptos.find(c => c.id === selectedCrypto.id) || selectedCrypto;
        const tc = CRYPTO_TYPE_CONFIG[crypto.holdingType] || {icon:"🪙",color:T.muted,bg:T.inputBg};
        const txs = (crypto.transactions || []).slice().sort((a,b)=>b.date.localeCompare(a.date));
        const value = (crypto.quantity||0)*(crypto.currentPrice||0);
        const cost = (crypto.quantity||0)*(crypto.avgCostPrice||0);
        const pnl = value - cost;
        const pnlPct = cost > 0 ? (pnl/cost*100) : 0;
        const inter = "'Inter','Segoe UI',system-ui,sans-serif";
        const mono  = "'Courier New',Courier,monospace";
        const fmtA  = (v) => "S$" + Math.abs(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
        const cashAcct = "Assets:Bank:Cash";
        const cryptoAcct = `Assets:Crypto:${(crypto.chain||"Other").replace(/ /g,"")}:${crypto.symbol}`;
        const incomeAcct = `Income:Crypto:${crypto.holdingType==="Staked"?"Staking":crypto.holdingType==="Lending / DeFi"?"Lending":"Other"}`;
        const daysAgo = (d) => { if (!d) return ""; const diff = Math.floor((Date.now() - new Date(d)) / 86400000); return diff === 0 ? "Today" : diff === 1 ? "1 day ago" : diff + " days ago"; };

        return (
          <div className="wo-drawer-overlay" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}
            onClick={e=>{if(e.target===e.currentTarget) setSelectedCrypto(null);}}>
            <div style={{width:"min(960px, 95vw)",height:"100vh",background:T.bg,overflow:"hidden",boxShadow:"-4px 0 32px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column"}}>
              {/* Header */}
              <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,flexShrink:0}}>
                <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
                  <div style={{width:44,height:44,borderRadius:12,background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{tc.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:16,fontWeight:700}}>{crypto.symbol} · {crypto.name}</div>
                    <div style={{fontSize:12,color:T.muted,marginTop:2}}>{crypto.wallet} · {crypto.chain}{crypto.walletAddress?` · ${crypto.walletAddress}`:""}</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <Badge bg={crypto.status==="Active"?T.upBg:T.inputBg} color={crypto.status==="Active"?T.up:T.muted}>{crypto.status}</Badge>
                    <button onClick={()=>{setEditCrypto(crypto);setShowModal(true);}} style={{background:T.inputBg,border:"none",borderRadius:7,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",color:T.text}}>Edit</button>
                    <button onClick={()=>setSelectedCrypto(null)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16,color:T.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:10,marginBottom:14}}>
                  {[
                    {l:"Current Value",v:fmtCompact(value)},
                    {l:"Holdings",v:`${(+crypto.quantity).toLocaleString(undefined,{maximumFractionDigits:6})} ${crypto.symbol}`},
                    {l:"Unrealised P&L",v:`${pnl>=0?"+":""}${fmtCompact(pnl)} (${pnl>=0?"+":""}${pnlPct.toFixed(1)}%)`},
                  ].map(s=>(
                    <div key={s.l} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px"}}>
                      <div style={{fontSize:11,color:T.muted}}>{s.l}</div>
                      <div style={{fontSize:15,fontWeight:700,marginTop:4}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:4}}>
                  {[{id:"overview",label:"Overview"},{id:"transactions",label:`Transactions${txs.length>0?" ("+txs.length+")":""}`},{id:"postings",label:"Postings"}].map(dt=>(
                    <button key={dt.id} onClick={()=>setDrawerTab(dt.id)}
                      style={{padding:"6px 14px",borderRadius:8,border:"none",background:drawerTab===dt.id?T.selected:T.inputBg,
                        color:drawerTab===dt.id?T.selectedText:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:drawerTab===dt.id?700:400}}>
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Body */}
              <div style={{flex:1,padding:"20px 24px",overflowY:"auto",minHeight:0}}>
                {drawerTab === "overview" && (
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📋 Holding Details</div>
                      {[
                        ["Symbol / Name",`${crypto.symbol} · ${crypto.name}`],
                        ["Holding Type",crypto.holdingType],
                        ["Chain / Network",crypto.chain],
                        ["Wallet / Venue",crypto.wallet],
                        ["Wallet Type",crypto.walletType],
                        crypto.walletAddress?["Wallet Address",crypto.walletAddress]:null,
                        crypto.lendingProtocol?["Protocol",crypto.lendingProtocol]:null,
                        crypto.stakingYield>0?["Yield / APY",`${crypto.stakingYield}%`]:null,
                        crypto.acquisitionDate?["First Acquired",crypto.acquisitionDate]:null,
                        ["Currency",crypto.currency],
                      ].filter(Boolean).map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`,gap:12}}>
                          <span style={{fontSize:12,color:T.muted,flexShrink:0}}>{k}</span>
                          <span style={{fontSize:12,fontWeight:600,textAlign:"right",fontFamily:k==="Wallet Address"?mono:inter,wordBreak:"break-all"}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>💰 Financial Summary</div>
                      {[
                        ["Quantity Held",`${(+crypto.quantity).toLocaleString(undefined,{maximumFractionDigits:6})} ${crypto.symbol}`],
                        ["Avg Cost / Unit",`S$${(+crypto.avgCostPrice).toLocaleString(undefined,{maximumFractionDigits:2})}`],
                        ["Current Price / Unit",`S$${(+crypto.currentPrice).toLocaleString(undefined,{maximumFractionDigits:2})}`],
                        ["Cost Basis",`S$${cost.toLocaleString(undefined,{maximumFractionDigits:2})}`],
                        ["Current Value",`S$${value.toLocaleString(undefined,{maximumFractionDigits:2})}`],
                        ["Unrealised P&L",`${pnl>=0?"+":""}S$${pnl.toLocaleString(undefined,{maximumFractionDigits:2})} (${pnl>=0?"+":""}${pnlPct.toFixed(2)}%)`],
                      ].map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                          <span style={{fontSize:12,color:T.muted}}>{k}</span>
                          <span style={{fontSize:12,fontWeight:600,textAlign:"right",color:k==="Unrealised P&L"?(pnl>=0?T.up:T.down):T.text}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    {crypto.notes && (
                      <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                        <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📝 Notes</div>
                        <div style={{padding:"12px 16px",fontSize:13,color:T.muted,lineHeight:1.6}}>{crypto.notes}</div>
                      </div>
                    )}
                  </div>
                )}
                {drawerTab === "transactions" && (
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      {(()=>{
                        const income = txs.filter(t=>["Staking Reward","Interest","Airdrop"].includes(t.type));
                        const purchases = txs.filter(t=>["Buy","Deposit","Stake"].includes(t.type));
                        return [
                          {label:"Total Income",value:`S$${income.reduce((s,t)=>s+(t.amount||0),0).toLocaleString(undefined,{maximumFractionDigits:2})}`,sub:`${income.length} payment${income.length!==1?"s":""}`,color:T.up},
                          {label:"Capital Deployed",value:`S$${purchases.reduce((s,t)=>s+(t.amount||0),0).toLocaleString(undefined,{maximumFractionDigits:2})}`,sub:`${purchases.length} buy${purchases.length!==1?"s":""}`,color:T.text},
                          {label:"Transactions",value:String(txs.length),sub:"Total recorded",color:T.accent},
                        ];
                      })().map(s=>(
                        <div key={s.label} style={{background:T.inputBg,borderRadius:9,padding:"10px 12px"}}>
                          <div style={{fontSize:11,color:T.muted}}>{s.label}</div>
                          <div style={{fontSize:14,fontWeight:700,color:s.color,marginTop:4}}>{s.value}</div>
                          <div style={{fontSize:11,color:T.dim,marginTop:2}}>{s.sub}</div>
                        </div>
                      ))}
                    </div>
                    {crypto.status === "Active" && (
                      <div style={{display:"flex",justifyContent:"flex-end"}}>
                        <button onClick={()=>setShowTxModal(true)} style={{padding:"7px 16px",borderRadius:7,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>+ Record Transaction</button>
                      </div>
                    )}
                    {txs.length===0?(
                      <div style={{textAlign:"center",padding:"32px 20px",color:T.muted}}><div style={{fontSize:28,marginBottom:8}}>📒</div><div style={{fontSize:13,fontWeight:600}}>No transactions yet</div></div>
                    ):(
                      <div style={{display:"flex",flexDirection:"column",gap:1,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                        {txs.map((tx,i)=>{
                          const isOut = ["Sell","Transfer Out","Unstake","Withdraw","Fee"].includes(tx.type);
                          const isIncome = ["Staking Reward","Interest","Airdrop"].includes(tx.type);
                          const icon = {Buy:"📥",Sell:"📤","Transfer In":"⬇","Transfer Out":"⬆",Stake:"🔒",Unstake:"🔓","Staking Reward":"🎁",Deposit:"📥",Withdraw:"📤",Interest:"💰",Airdrop:"🎉",Fee:"⚠️"}[tx.type]||"💰";
                          return (
                            <div key={tx.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",background:i%2===0?T.bg:T.inputBg,borderTop:i>0?`1px solid ${T.border}`:"none"}}>
                              <div style={{width:34,height:34,borderRadius:8,background:isIncome?T.upBg:T.accentBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{icon}</div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:600}}>{tx.type}{tx.qty>0?` · ${(+tx.qty).toLocaleString(undefined,{maximumFractionDigits:6})} ${crypto.symbol}`:""}{tx.notes?` — ${tx.notes}`:""}</div>
                                <div style={{fontSize:11,color:T.muted,marginTop:1,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                                  <span>{tx.date}</span>
                                  {tx.method&&<span style={{fontSize:10,background:T.inputBg,borderRadius:4,padding:"1px 6px"}}>{tx.method}</span>}
                                  {tx.ref&&<span style={{fontSize:10,color:T.dim,fontFamily:"monospace"}}>{tx.ref}</span>}
                                </div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div style={{fontSize:13,fontWeight:700,color:isIncome?T.up:isOut?T.down:T.text}}>
                                  {tx.amount>0?(isIncome?"+":isOut?"-":"")+"S$"+tx.amount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):"—"}
                                </div>
                                <div style={{fontSize:10,color:T.dim,marginTop:1}}>{tx.type}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {drawerTab === "postings" && (() => {
                  const sortedTxs = (crypto.transactions||[]).filter(t=>t.status==="Complete"&&t.amount>0).slice().sort((a,b)=>a.date.localeCompare(b.date));
                  const journalRows = [];
                  sortedTxs.forEach(tx => {
                    if (["Buy","Deposit","Stake"].includes(tx.type)) {
                      journalRows.push(
                        {date:tx.date,desc:`${tx.type} — ${tx.notes||crypto.symbol}`,account:cryptoAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:cashAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else if (["Sell","Withdraw","Unstake"].includes(tx.type)) {
                      journalRows.push(
                        {date:tx.date,desc:`${tx.type} — ${tx.notes||crypto.symbol}`,account:cashAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:cryptoAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else if (["Staking Reward","Interest","Airdrop"].includes(tx.type)) {
                      journalRows.push(
                        {date:tx.date,desc:`${tx.type} — ${tx.notes||crypto.symbol}`,account:cryptoAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:incomeAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    }
                  });
                  if (isMobile && journalRows.length > 0) return <MobilePostingsList journalRows={journalRows} entryCount={sortedTxs.length} entryLabel="transactions"/>;
                  if (journalRows.length===0) return (
                    <div style={{textAlign:"center",padding:"48px 20px",color:T.muted}}><div style={{fontSize:32,marginBottom:10}}>📒</div><div style={{fontSize:13,fontWeight:600}}>No entries to post yet</div></div>
                  );
                  return (
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",background:T.bg}}>
                      <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:inter}}>Ledger Postings</div>
                        <div style={{fontSize:12,color:T.accent,marginTop:3,fontFamily:inter}}>Double-entry bookkeeping · PTA compliant · {sortedTxs.length} transaction{sortedTxs.length!==1?"s":""}</div>
                      </div>
                      <div style={{overflowX:"auto",overflowY:"auto",maxHeight:460}}>
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
                            {["Date","Account","Description","Debit","Credit"].map((h,hi)=>(
                              <th key={h} style={{padding:"9px 16px",textAlign:hi>=3?"right":"left",width:hi===0||hi>=3?148:undefined,fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,whiteSpace:"nowrap"}}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {journalRows.map((row,ri)=>(
                              <tr key={ri} style={{borderBottom:`1px solid ${T.border}`}}>
                                <td style={{padding:"11px 16px",verticalAlign:"top",width:148}}>
                                  {row._first?(<><div style={{fontSize:13,fontFamily:inter,whiteSpace:"nowrap"}}>{row.date}</div><div style={{fontSize:11,color:T.dim,marginTop:2,fontFamily:inter}}>{daysAgo(row.date)}</div></>):null}
                                </td>
                                <td style={{padding:"11px 16px",verticalAlign:"top"}}><span style={{fontFamily:mono,fontSize:12,color:T.text}}>{row.account}</span></td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",fontSize:12,color:T.muted,fontFamily:inter}}>{row.desc}</td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                                  {row.debit?<span style={{fontSize:13,fontWeight:700,color:T.up,fontFamily:inter}}>{row.amount}</span>:<span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                                </td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                                  {!row.debit?<span style={{fontSize:13,fontWeight:700,color:T.down,fontFamily:inter}}>{row.amount}</span>:<span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{padding:"12px 18px",borderTop:`1px solid ${T.border}`,background:T.sidebar}}>
                        <div style={{fontSize:12,fontWeight:700,marginBottom:6,fontFamily:inter}}>Double-Entry Accounting</div>
                        <div style={{fontSize:11,color:T.muted,lineHeight:1.8,fontFamily:inter}}>
                          <div>• <span style={{color:T.up,fontWeight:600}}>Debit (Dr):</span> Buy / Stake / Deposit → increases crypto holdings; Sell / Withdraw → increases cash; Rewards → increase holdings</div>
                          <div>• <span style={{color:T.down,fontWeight:600}}>Credit (Cr):</span> Buy → reduces cash; Sell / Unstake → reduces holdings; Staking Reward / Interest / Airdrop → income recognised</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Transaction modal */}
      {showTxModal && selectedCrypto && (() => {
        const crypto = cryptos.find(c => c.id === selectedCrypto.id) || selectedCrypto;
        return <CryptoTxModalInner crypto={crypto} onSave={(tx) => {
          const newTx = {...tx, id:"CTX"+Date.now(), status:"Complete"};
          setCryptos(prev => prev.map(c => {
            if (c.id !== crypto.id) return c;
            const nextTxs = [...(c.transactions||[]), newTx];
            let nextQty = c.quantity;
            if (["Buy","Transfer In","Staking Reward","Airdrop","Deposit"].includes(tx.type)) nextQty = (+c.quantity||0) + (+tx.qty||0);
            else if (["Sell","Transfer Out","Withdraw","Unstake","Fee"].includes(tx.type)) nextQty = Math.max(0, (+c.quantity||0) - (+tx.qty||0));
            return { ...c, transactions: nextTxs, quantity: nextQty };
          }));
          setShowTxModal(false);
          showToast(`${tx.type} recorded`, "success");
        }} onClose={()=>setShowTxModal(false)}/>;
      })()}

      {/* Add/Edit modal */}
      {showModal && editCrypto && (
        <CryptoModal crypto={editCrypto} onSave={handleSave} onClose={()=>{setShowModal(false);setEditCrypto(null);}}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VC/PE INVESTMENTS MODULE
═══════════════════════════════════════════════════════════════ */

const PE_TYPES = ["VC Fund","PE Fund","Direct Equity","SAFE / Convertible Note","Secondary"];

const PE_TYPE_CONFIG = {
  "VC Fund":                  { icon:"🚀", color:"#2563EB", bg:"#EFF6FF" },
  "PE Fund":                  { icon:"🏢", color:"#7C3AED", bg:"#F5F3FF" },
  "Direct Equity":            { icon:"📈", color:"#059669", bg:"#F0FDF4" },
  "SAFE / Convertible Note":  { icon:"📝", color:"#D97706", bg:"#FFFBEB" },
  "Secondary":                { icon:"🔄", color:"#0891B2", bg:"#ECFEFF" },
};

const PE_STATUS_OPTS = ["Active","Realised","Partially Realised","Written Off","Pending Commitment"];

const PE_STAGES = ["Pre-Seed","Seed","Series A","Series B","Series C","Series D+","Growth","Pre-IPO","Buyout","N/A"];

const PE_SECTORS = ["Technology","Fintech","Healthcare","Consumer","SaaS","Biotech","Real Estate","Infrastructure","Energy","Diversified","Other"];

const EMPTY_PE = {
  id:"", investmentType:"VC Fund", name:"", manager:"", vintageYear:new Date().getFullYear(),
  stage:"N/A", sector:"Technology", geography:"Southeast Asia",
  commitment:0, calledCapital:0, distributionsReceived:0, nav:0,
  ownershipPct:0, irr:0,
  investmentDate:"", exitDate:"",
  currency:"SGD", fundSize:0, gpCommit:0,
  status:"Active", notes:"",
  transactions:[],
};

const PE_INIT = [
  {
    id:"PE001", investmentType:"VC Fund", name:"Sequoia Capital Southeast Asia VI",
    manager:"Sequoia Capital", vintageYear:2022, stage:"N/A", sector:"Technology", geography:"Southeast Asia",
    commitment:250000, calledCapital:175000, distributionsReceived:22000, nav:218000,
    ownershipPct:0, irr:14.2,
    investmentDate:"2022-06-01", exitDate:"",
    currency:"SGD", fundSize:850000000, gpCommit:2.0,
    status:"Active",
    notes:"Early-stage SEA tech fund. 10-year term. 2% mgmt fee / 20% carry above 8% hurdle. J-curve still in effect.",
    transactions:[
      {id:"PTX001",date:"2022-06-15",type:"Capital Call",amount:50000,method:"Wire Transfer",ref:"SEQ-CC-01",status:"Complete",notes:"Initial capital call — 20% of commitment"},
      {id:"PTX002",date:"2023-01-20",type:"Capital Call",amount:45000,method:"Wire Transfer",ref:"SEQ-CC-02",status:"Complete",notes:"Second call — follow-on into portfolio co"},
      {id:"PTX003",date:"2023-09-10",type:"Capital Call",amount:40000,method:"Wire Transfer",ref:"SEQ-CC-03",status:"Complete",notes:"Third call — new investments + reserves"},
      {id:"PTX004",date:"2024-05-08",type:"Capital Call",amount:40000,method:"Wire Transfer",ref:"SEQ-CC-04",status:"Complete",notes:"Fourth call"},
      {id:"PTX005",date:"2024-11-22",type:"Distribution",amount:22000,method:"Wire Transfer",ref:"SEQ-DIST-01",status:"Complete",notes:"Partial exit — portfolio co acquired"},
      {id:"PTX006",date:"2025-03-31",type:"Management Fee",amount:3500,method:"Netting",ref:"SEQ-MF-Q1",status:"Complete",notes:"Q1 management fee (2% annualised on committed)"},
    ],
  },
  {
    id:"PE002", investmentType:"PE Fund", name:"KKR Asian Fund V",
    manager:"KKR & Co.", vintageYear:2023, stage:"N/A", sector:"Diversified", geography:"Asia Pacific",
    commitment:500000, calledCapital:225000, distributionsReceived:0, nav:238000,
    ownershipPct:0, irr:8.5,
    investmentDate:"2023-03-15", exitDate:"",
    currency:"SGD", fundSize:15000000000, gpCommit:3.0,
    status:"Active",
    notes:"Asia Pacific buyout fund. 10+2 year term. Target 20%+ IRR. Focus on corporate carve-outs and growth buyouts.",
    transactions:[
      {id:"PTX007",date:"2023-04-01",type:"Capital Call",amount:100000,method:"Wire Transfer",ref:"KKR-CC-01",status:"Complete",notes:"Initial capital call — 20% of commitment"},
      {id:"PTX008",date:"2024-02-15",type:"Capital Call",amount:75000,method:"Wire Transfer",ref:"KKR-CC-02",status:"Complete",notes:"Second call — large buyout deal"},
      {id:"PTX009",date:"2024-10-08",type:"Capital Call",amount:50000,method:"Wire Transfer",ref:"KKR-CC-03",status:"Complete",notes:"Third call"},
    ],
  },
  {
    id:"PE003", investmentType:"Direct Equity", name:"Carousell Group Pte Ltd",
    manager:"Self-directed", vintageYear:2023, stage:"Series D+", sector:"Consumer", geography:"Singapore",
    commitment:50000, calledCapital:50000, distributionsReceived:0, nav:58000,
    ownershipPct:0.04, irr:11.8,
    investmentDate:"2023-08-20", exitDate:"",
    currency:"SGD", fundSize:0, gpCommit:0,
    status:"Active",
    notes:"Direct secondary purchase of Carousell shares. 4bps ownership. Pre-IPO anticipated 2027.",
    transactions:[
      {id:"PTX010",date:"2023-08-20",type:"Capital Call",amount:50000,method:"Wire Transfer",ref:"CAR-BUY-01",status:"Complete",notes:"Secondary purchase from departing employee"},
    ],
  },
  {
    id:"PE004", investmentType:"VC Fund", name:"Vertex Ventures SEA & India VI",
    manager:"Vertex Holdings (Temasek)", vintageYear:2023, stage:"N/A", sector:"Technology", geography:"Southeast Asia & India",
    commitment:200000, calledCapital:80000, distributionsReceived:0, nav:82000,
    ownershipPct:0, irr:3.2,
    investmentDate:"2023-10-01", exitDate:"",
    currency:"SGD", fundSize:540000000, gpCommit:2.0,
    status:"Active",
    notes:"Temasek-backed early-stage fund. Focus on AI, B2B SaaS, climate tech. Still deploying.",
    transactions:[
      {id:"PTX011",date:"2023-10-15",type:"Capital Call",amount:40000,method:"Wire Transfer",ref:"VTX-CC-01",status:"Complete",notes:"Initial call"},
      {id:"PTX012",date:"2024-08-05",type:"Capital Call",amount:40000,method:"Wire Transfer",ref:"VTX-CC-02",status:"Complete",notes:"Second call"},
    ],
  },
  {
    id:"PE005", investmentType:"SAFE / Convertible Note", name:"Atomos AI (Seed SAFE)",
    manager:"Self-directed", vintageYear:2024, stage:"Seed", sector:"SaaS", geography:"Singapore",
    commitment:25000, calledCapital:25000, distributionsReceived:0, nav:35000,
    ownershipPct:1.2, irr:0,
    investmentDate:"2024-04-15", exitDate:"",
    currency:"SGD", fundSize:0, gpCommit:0,
    status:"Active",
    notes:"SAFE note with $8M post-money cap, 20% discount. Founders ex-Meta. AI workflow automation for SMBs.",
    transactions:[
      {id:"PTX013",date:"2024-04-15",type:"Capital Call",amount:25000,method:"Wire Transfer",ref:"ATOMOS-SAFE",status:"Complete",notes:"SAFE subscription — $8M cap, 20% discount"},
    ],
  },
  {
    id:"PE006", investmentType:"Secondary", name:"Stripe Inc. (Secondary)",
    manager:"Self-directed via Forge Global", vintageYear:2024, stage:"Pre-IPO", sector:"Fintech", geography:"US",
    commitment:75000, calledCapital:75000, distributionsReceived:0, nav:92000,
    ownershipPct:0, irr:18.5,
    investmentDate:"2024-01-30", exitDate:"",
    currency:"SGD", fundSize:0, gpCommit:0,
    status:"Active",
    notes:"Secondary purchase via Forge Global at $60B valuation. Waiting for IPO.",
    transactions:[
      {id:"PTX014",date:"2024-01-30",type:"Capital Call",amount:75000,method:"Wire Transfer",ref:"STR-SEC-01",status:"Complete",notes:"Secondary purchase — 1.3 shares at $60B val"},
      {id:"PTX015",date:"2024-12-15",type:"Management Fee",amount:1125,method:"Netting",ref:"FRG-FEE",status:"Complete",notes:"Forge platform / custody fee 1.5%"},
    ],
  },
  {
    id:"PE007", investmentType:"PE Fund", name:"Blackstone Real Estate Asia III",
    manager:"Blackstone", vintageYear:2020, stage:"N/A", sector:"Real Estate", geography:"Asia Pacific",
    commitment:150000, calledCapital:150000, distributionsReceived:168000, nav:45000,
    ownershipPct:0, irr:22.4,
    investmentDate:"2020-09-01", exitDate:"",
    currency:"SGD", fundSize:7300000000, gpCommit:3.0,
    status:"Partially Realised",
    notes:"Asian real estate fund. Fully called. In harvest phase — returned 112% of capital. Residual NAV $45K.",
    transactions:[
      {id:"PTX016",date:"2020-10-01",type:"Capital Call",amount:50000,method:"Wire Transfer",ref:"BX-CC-01",status:"Complete",notes:"Initial capital call"},
      {id:"PTX017",date:"2021-06-15",type:"Capital Call",amount:50000,method:"Wire Transfer",ref:"BX-CC-02",status:"Complete",notes:"Second call"},
      {id:"PTX018",date:"2022-04-20",type:"Capital Call",amount:50000,method:"Wire Transfer",ref:"BX-CC-03",status:"Complete",notes:"Final call — fully drawn"},
      {id:"PTX019",date:"2023-12-10",type:"Distribution",amount:48000,method:"Wire Transfer",ref:"BX-DIST-01",status:"Complete",notes:"First realisation — office complex sale"},
      {id:"PTX020",date:"2024-08-15",type:"Distribution",amount:72000,method:"Wire Transfer",ref:"BX-DIST-02",status:"Complete",notes:"Second realisation — logistics portfolio exit"},
      {id:"PTX021",date:"2025-07-10",type:"Distribution",amount:48000,method:"Wire Transfer",ref:"BX-DIST-03",status:"Complete",notes:"Third distribution — data centre exit"},
    ],
  },
];

// ── VC/PE Transaction Modal ───────────────────────────────────
function PETxModalInner({ inv, onSave, onClose }) {
  const txTypes = ["Capital Call","Distribution","Income / Gain","Management Fee","Valuation Update","Exit / Realisation"];
  const txTypeIcon = {"Capital Call":"📤","Distribution":"📥","Income / Gain":"🎁","Management Fee":"⚠️","Valuation Update":"📊","Exit / Realisation":"🏁"};

  const [f, setF] = useState({
    type: "Capital Call",
    date: new Date().toISOString().slice(0,10),
    amount: 0, method: "Wire Transfer", ref: "", notes: "",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const isOut = ["Capital Call","Management Fee"].includes(f.type);
  const isValOnly = f.type === "Valuation Update";

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:16,width:480,maxHeight:"85vh",overflow:"auto",padding:"28px 28px 20px",border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:6}}>Record Transaction</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:20}}>{inv.name} · {inv.manager}</div>
        <div style={{marginBottom:14}}>
          <Label required>Transaction Type</Label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {txTypes.map(t=>(
              <button key={t} onClick={()=>set("type",t)}
                style={{flex:"1 1 140px",padding:"10px 14px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:f.type===t?700:400,
                  border:`1px solid ${f.type===t?T.selected:T.border}`,background:f.type===t?T.selected:T.bg,color:f.type===t?T.selectedText:T.muted}}>
                {txTypeIcon[t]||"💰"} {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Date</Label><Input type="date" value={f.date} onChange={e=>set("date",e.target.value)}/></div>
          <div><Label required>{isValOnly?"New NAV (SGD)":"Amount (SGD)"}</Label><Input type="number" prefix="S$" value={f.amount} onChange={e=>set("amount",+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Method</Label><Sel value={f.method} onChange={e=>set("method",e.target.value)} options={["Wire Transfer","Netting","Bank Transfer","In-Kind","Check"]}/></div>
          <div><Label>Reference</Label><Input value={f.ref} onChange={e=>set("ref",e.target.value)} placeholder="e.g. SEQ-CC-01"/></div>
        </div>
        <div style={{marginBottom:14}}>
          <Label>Notes</Label>
          <textarea value={f.notes} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="e.g. Capital call 20% of commitment, portfolio co exit…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none",resize:"vertical"}}/>
        </div>
        <div style={{background:isValOnly?T.accentBg:isOut?T.downBg:T.upBg,borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:isValOnly?T.accent:isOut?T.down:T.up,fontWeight:600}}>
            {isValOnly?"📊 NAV marked":isOut?"📤 Capital called / fee paid":"📥 Distribution / income received"}
          </span>
          <span style={{fontWeight:700,color:isValOnly?T.accent:isOut?T.down:T.up}}>{isValOnly?"":(isOut?"-":"+")} S${(f.amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Cancel</button>
          <button onClick={()=>onSave(f)} disabled={!f.date||f.amount<=0}
            style={{padding:"9px 20px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,opacity:(!f.date||f.amount<=0)?0.4:1}}>
            Record {f.type}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── VC/PE Add/Edit Modal ──────────────────────────────────────
function PEModal({ inv, onSave, onClose }) {
  const [f, setF] = useState({ ...inv });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const isFund = f.investmentType === "VC Fund" || f.investmentType === "PE Fund";
  const isDirect = f.investmentType === "Direct Equity" || f.investmentType === "SAFE / Convertible Note" || f.investmentType === "Secondary";
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:16,width:580,maxHeight:"85vh",overflow:"auto",padding:"28px 28px 20px",border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:20}}>{f.id ? "Edit Investment" : "Add VC/PE Investment"}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Investment Type</Label><Sel value={f.investmentType} onChange={e=>set("investmentType",e.target.value)} options={PE_TYPES}/></div>
          <div><Label required>{isFund?"Fund Name":"Company Name"}</Label><Input value={f.name} onChange={e=>set("name",e.target.value)} placeholder={isFund?"e.g. Sequoia Capital SEA VI":"e.g. Carousell Pte Ltd"}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>{isFund?"GP / Manager":"Investment Channel"}</Label><Input value={f.manager} onChange={e=>set("manager",e.target.value)} placeholder={isFund?"e.g. Sequoia Capital, KKR":"e.g. Forge Global, Self-directed"}/></div>
          <div><Label>{isFund?"Vintage Year":"Investment Year"}</Label><Input type="number" value={f.vintageYear} onChange={e=>set("vintageYear",+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Sector</Label><Sel value={f.sector} onChange={e=>set("sector",e.target.value)} options={PE_SECTORS}/></div>
          <div><Label>Geography</Label><Input value={f.geography} onChange={e=>set("geography",e.target.value)} placeholder="e.g. SEA, US, Global"/></div>
          {isDirect && <div><Label>Stage</Label><Sel value={f.stage} onChange={e=>set("stage",e.target.value)} options={PE_STAGES}/></div>}
          {!isDirect && <div><Label>Currency</Label><Sel value={f.currency} onChange={e=>set("currency",e.target.value)} options={["SGD","USD","EUR"]}/></div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Commitment</Label><Input type="number" prefix="S$" value={f.commitment} onChange={e=>set("commitment",+e.target.value)}/></div>
          <div><Label>Called Capital</Label><Input type="number" prefix="S$" value={f.calledCapital} onChange={e=>set("calledCapital",+e.target.value)}/></div>
          <div><Label>Distributions Received</Label><Input type="number" prefix="S$" value={f.distributionsReceived} onChange={e=>set("distributionsReceived",+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Current NAV</Label><Input type="number" prefix="S$" value={f.nav} onChange={e=>set("nav",+e.target.value)}/></div>
          <div><Label>IRR (%)</Label><Input type="number" value={f.irr} onChange={e=>set("irr",+e.target.value)}/></div>
          {isDirect?<div><Label>Ownership (%)</Label><Input type="number" value={f.ownershipPct} onChange={e=>set("ownershipPct",+e.target.value)}/></div>:<div><Label>Fund Size</Label><Input type="number" prefix="S$" value={f.fundSize} onChange={e=>set("fundSize",+e.target.value)}/></div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Investment Date</Label><Input type="date" value={f.investmentDate} onChange={e=>set("investmentDate",e.target.value)}/></div>
          <div><Label>Exit Date (if any)</Label><Input type="date" value={f.exitDate} onChange={e=>set("exitDate",e.target.value)}/></div>
          <div><Label>Status</Label><Sel value={f.status} onChange={e=>set("status",e.target.value)} options={PE_STATUS_OPTS}/></div>
        </div>
        <div style={{marginBottom:20}}>
          <Label>Notes</Label>
          <textarea value={f.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="Fund terms, thesis, valuation cap, discount…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none",resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Cancel</button>
          <button onClick={()=>onSave(f)} disabled={!f.name||!f.manager||!f.commitment}
            style={{padding:"9px 20px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,opacity:(!f.name||!f.manager||!f.commitment)?0.4:1}}>
            {f.id ? "Save Changes" : "Add Investment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── VC/PE Investments Screen ──────────────────────────────────
function PEScreen({ investments, setInvestments, showToast }) {
  const isMobile = useIsMobile();
  const [selectedInv, setSelectedInv] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editInv, setEditInv] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [drawerTab, setDrawerTab] = useState("overview");
  const [showTxModal, setShowTxModal] = useState(false);
  const peSort = useSortState();

  const activeInvs = investments.filter(i => i.status !== "Written Off");
  const totalCommitment = activeInvs.reduce((s,i) => s + (i.commitment||0), 0);
  const totalCalled = activeInvs.reduce((s,i) => s + (i.calledCapital||0), 0);
  const totalUnfunded = totalCommitment - totalCalled;
  const totalDistributions = activeInvs.reduce((s,i) => s + (i.distributionsReceived||0), 0);
  const totalNAV = activeInvs.reduce((s,i) => s + (i.nav||0), 0);
  const totalValue = totalNAV + totalDistributions;
  const overallTVPI = totalCalled > 0 ? totalValue / totalCalled : 0;
  const overallDPI = totalCalled > 0 ? totalDistributions / totalCalled : 0;
  const avgIRR = activeInvs.length > 0 ? activeInvs.reduce((s,i)=>s+(i.irr||0),0)/activeInvs.length : 0;

  // Type breakdown
  const typeBreakdown = {};
  activeInvs.forEach(i => { typeBreakdown[i.investmentType] = (typeBreakdown[i.investmentType]||0) + (i.nav||0); });

  const filtered = investments.filter(i => {
    if (filterType !== "All" && i.investmentType !== filterType) return false;
    if (filterStatus !== "All" && i.status !== filterStatus) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!(i.name||"").toLowerCase().includes(q) && !(i.manager||"").toLowerCase().includes(q) && !(i.sector||"").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleSave = (f) => {
    if (f.id) {
      setInvestments(prev => prev.map(i => i.id === f.id ? { ...i, ...f } : i));
      showToast("Investment updated", "success");
    } else {
      setInvestments(prev => [...prev, { ...f, id:"PE"+Date.now(), transactions:[] }]);
      showToast("Investment added", "success");
    }
    setShowModal(false);
    setEditInv(null);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {/* Page header */}
      <div className="wo-page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:700}}>VC/PE Investment Portfolio</div>
          <div style={{fontSize:13,color:T.muted,marginTop:2}}>{activeInvs.length} active investment{activeInvs.length!==1?"s":""} · {investments.length} total</div>
        </div>
        <button onClick={()=>{setEditInv({...EMPTY_PE,id:""});setShowModal(true);}}
          style={{background:T.selected,color:T.selectedText,border:"none",borderRadius:9,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
          + Add Investment
        </button>
      </div>

      {/* Summary cards */}
      <div className="wo-summary-grid" style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12,marginBottom:18}}>
        {[
          {label:"Total NAV",value:fmtCompact(totalNAV),sub:`${activeInvs.length} positions`,icon:"💼",color:T.text},
          {label:"Commitment / Called",value:`${fmtCompact(totalCalled)} / ${fmtCompact(totalCommitment)}`,sub:`Unfunded: ${fmtCompact(totalUnfunded)}`,icon:"📥",color:T.accent},
          {label:"Distributions Received",value:fmtCompact(totalDistributions),sub:`DPI: ${overallDPI.toFixed(2)}x`,icon:"📤",color:T.up},
          {label:"TVPI / Avg IRR",value:`${overallTVPI.toFixed(2)}x`,sub:`IRR: ${avgIRR.toFixed(1)}%`,icon:"📈",color:overallTVPI>=1?T.up:T.down},
        ].map((c,i)=>(
          <Card key={i} style={{padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{fontSize:12,color:T.muted,fontWeight:500}}>{c.label}</div>
              <span style={{fontSize:20}}>{c.icon}</span>
            </div>
            <div style={{fontSize:22,fontWeight:700,marginTop:8,color:c.color}}>{c.value}</div>
            <div style={{fontSize:11,color:T.dim,marginTop:4}}>{c.sub}</div>
          </Card>
        ))}
      </div>

      {/* Breakdown bar */}
      {Object.keys(typeBreakdown).length > 0 && (
        <Card style={{padding:"16px 20px",marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>NAV by Investment Type</div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
            {Object.entries(typeBreakdown).map(([type, val])=>{
              const pct = totalNAV > 0 ? (val/totalNAV*100).toFixed(0) : 0;
              const tc = PE_TYPE_CONFIG[type] || {icon:"📋",color:T.muted,bg:T.inputBg};
              return (
                <div key={type} style={{flex:"1 1 140px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:12,color:T.muted,fontWeight:500}}>{tc.icon} {type}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{pct}%</span>
                  </div>
                  <div style={{height:6,background:T.inputBg,borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:tc.color,borderRadius:3}}/>
                  </div>
                  <div style={{fontSize:11,color:T.dim,marginTop:4}}>{fmtCompact(val)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Unfunded commitments alert */}
      {totalUnfunded > 0 && (
        <Card style={{padding:"12px 16px",marginBottom:14,background:T.warnBg,border:`1px solid ${T.warn}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>⚠️</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:T.warn}}>{fmtCompact(totalUnfunded)} unfunded commitment</div>
              <div style={{fontSize:11,color:T.muted,marginTop:1}}>Keep liquidity available — GPs may call capital on short notice</div>
            </div>
          </div>
        </Card>
      )}

      {/* Filter toolbar */}
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:"1 1 200px"}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.dim,pointerEvents:"none"}}>🔍</span>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search fund, GP, company, sector…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px 8px 34px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["All",...PE_STATUS_OPTS].map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)}
              style={{background:filterStatus===s?T.selected:T.inputBg,color:filterStatus===s?T.selectedText:T.muted,border:`1px solid ${filterStatus===s?T.selected:T.border}`,borderRadius:7,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:filterStatus===s?600:400}}>
              {s}
            </button>
          ))}
        </div>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)}
          style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 12px",fontSize:12,fontFamily:"inherit",color:T.text,cursor:"pointer",outline:"none"}}>
          {["All",...PE_TYPES].map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{fontSize:12,color:T.muted,marginLeft:"auto"}}>{filtered.length} of {investments.length}</span>
      </div>

      {/* Table / Mobile cards */}
      {filtered.length === 0 ? (
        <Card style={{padding:"48px 24px",textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>💼</div>
          <div style={{fontSize:14,fontWeight:600}}>No investments found</div>
          <div style={{fontSize:12,color:T.muted,marginTop:4}}>Try adjusting filters or add a new investment</div>
        </Card>
      ) : isMobile ? (
        <Card style={{padding:0,overflow:"hidden"}}>
          {filtered.map(inv => {
            const tc = PE_TYPE_CONFIG[inv.investmentType] || {icon:"📋",color:T.muted,bg:T.inputBg};
            const tvpi = inv.calledCapital > 0 ? (inv.nav + inv.distributionsReceived) / inv.calledCapital : 0;
            return <MobileListItem key={inv.id} onClick={()=>{setSelectedInv(inv);setDrawerTab("overview");}}
              icon={tc.icon} iconBg={tc.bg} title={inv.name} subtitle={`${inv.manager} · ${inv.investmentType}`}
              value={fmtCompact(inv.nav)} valueColor={T.text} valueSub={`TVPI ${tvpi.toFixed(2)}x · IRR ${inv.irr}%`}
              badge={inv.status} badgeBg={inv.status==="Active"?T.upBg:inv.status==="Realised"?T.inputBg:T.warnBg} badgeColor={inv.status==="Active"?T.up:inv.status==="Realised"?T.muted:T.warn}
              extra={<span style={{fontSize:11,color:T.dim}}>Called {fmtCompact(inv.calledCapital)} / {fmtCompact(inv.commitment)}</span>}
            />;
          })}
        </Card>
      ) : (
        <Card style={{padding:0,overflowX:"auto"}} className="wo-table-scroll">
          <SortHeader gridCols="2.2fr 1fr 1.1fr 1.2fr 1fr 0.9fr 0.8fr" sortKey={peSort.sortKey} sortDir={peSort.sortDir} onSort={peSort.onSort}
            columns={[["Investment / Manager","left","name"],["Type","left","type"],["NAV","right","nav"],["Commit / Called","right","committed"],["Dist / TVPI","right","tvpi"],["IRR","right","irr"],["Status","left","status"]]}/>
          {peSort.sortFn(filtered, (i, k) => {
            const tvpi = i.calledCapital > 0 ? (i.nav + i.distributionsReceived) / i.calledCapital : 0;
            if (k==="name") return (i.name||"").toLowerCase();
            if (k==="type") return (i.investmentType||"").toLowerCase();
            if (k==="nav") return i.nav||0;
            if (k==="committed") return i.commitment||0;
            if (k==="tvpi") return tvpi;
            if (k==="irr") return i.irr||0;
            if (k==="status") return i.status;
            return 0;
          }).map((inv, idx) => {
            const tc = PE_TYPE_CONFIG[inv.investmentType] || {icon:"📋",color:T.muted,bg:T.inputBg};
            const tvpi = inv.calledCapital > 0 ? (inv.nav + inv.distributionsReceived) / inv.calledCapital : 0;
            const isDim = inv.status === "Written Off" || inv.status === "Realised";
            return (
              <div key={inv.id} onClick={()=>{setSelectedInv(inv);setDrawerTab("overview");}}
                style={{display:"grid",gridTemplateColumns:"2.2fr 1fr 1.1fr 1.2fr 1fr 0.9fr 0.8fr",padding:"13px 20px",borderBottom:idx<filtered.length-1?`1px solid ${T.border}`:"none",alignItems:"center",cursor:"pointer",
                  opacity:isDim?0.55:1,background:isDim?T.sidebar:""}}
                onMouseEnter={e=>e.currentTarget.style.background=T.hover}
                onMouseLeave={e=>e.currentTarget.style.background=(isDim?T.sidebar:"")}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{width:34,height:34,borderRadius:9,background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{tc.icon}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{inv.name}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:1}}>{inv.manager} · {inv.vintageYear}{inv.sector?` · ${inv.sector}`:""}</div>
                  </div>
                </div>
                <div style={{fontSize:12,color:T.muted}}>{inv.investmentType}</div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,fontWeight:700}}>{fmtCompact(inv.nav)}</div>
                  {inv.ownershipPct > 0 && <div style={{fontSize:10,color:T.dim,marginTop:1}}>{inv.ownershipPct}% owned</div>}
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12}}>{fmtCompact(inv.calledCapital)} / {fmtCompact(inv.commitment)}</div>
                  <div style={{fontSize:10,color:T.dim,marginTop:1}}>{inv.commitment > 0 ? ((inv.calledCapital/inv.commitment)*100).toFixed(0) : 0}% called</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,color:T.up}}>{fmtCompact(inv.distributionsReceived)}</div>
                  <div style={{fontSize:10,color:tvpi>=1?T.up:T.down,marginTop:1,fontWeight:600}}>{tvpi.toFixed(2)}x TVPI</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,fontWeight:600,color:inv.irr>=0?T.up:T.down}}>{inv.irr>=0?"+":""}{inv.irr}%</div>
                </div>
                <div>
                  <Badge bg={inv.status==="Active"?T.upBg:inv.status==="Realised"?T.inputBg:inv.status==="Written Off"?T.downBg:T.warnBg}
                    color={inv.status==="Active"?T.up:inv.status==="Realised"?T.muted:inv.status==="Written Off"?T.down:T.warn}>
                    {inv.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ══ INVESTMENT DETAIL DRAWER ══ */}
      {selectedInv && (() => {
        const inv = investments.find(i => i.id === selectedInv.id) || selectedInv;
        const tc = PE_TYPE_CONFIG[inv.investmentType] || {icon:"📋",color:T.muted,bg:T.inputBg};
        const txs = (inv.transactions || []).slice().sort((a,b)=>b.date.localeCompare(a.date));
        const tvpi = inv.calledCapital > 0 ? (inv.nav + inv.distributionsReceived) / inv.calledCapital : 0;
        const dpi = inv.calledCapital > 0 ? inv.distributionsReceived / inv.calledCapital : 0;
        const rvpi = inv.calledCapital > 0 ? inv.nav / inv.calledCapital : 0;
        const unfunded = (inv.commitment||0) - (inv.calledCapital||0);
        const inter = "'Inter','Segoe UI',system-ui,sans-serif";
        const mono  = "'Courier New',Courier,monospace";
        const fmtA  = (v) => "S$" + Math.abs(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
        const cashAcct = "Assets:Bank:Cash";
        const invAcct = `Assets:PrivateEquity:${inv.investmentType.replace(/[ /]/g,"")}:${(inv.name||"").replace(/[ /]/g,"").slice(0,24)}`;
        const incAcct = `Income:PrivateEquity:${inv.investmentType.replace(/[ /]/g,"")}`;
        const feeAcct = "Expense:PrivateEquity:ManagementFees";
        const daysAgo = (d) => { if (!d) return ""; const diff = Math.floor((Date.now() - new Date(d)) / 86400000); return diff === 0 ? "Today" : diff === 1 ? "1 day ago" : diff + " days ago"; };

        return (
          <div className="wo-drawer-overlay" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}
            onClick={e=>{if(e.target===e.currentTarget) setSelectedInv(null);}}>
            <div style={{width:"min(960px, 95vw)",height:"100vh",background:T.bg,overflow:"hidden",boxShadow:"-4px 0 32px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column"}}>
              {/* Header */}
              <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,flexShrink:0}}>
                <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
                  <div style={{width:44,height:44,borderRadius:12,background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{tc.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:16,fontWeight:700}}>{inv.name}</div>
                    <div style={{fontSize:12,color:T.muted,marginTop:2}}>{inv.manager} · {inv.investmentType} · Vintage {inv.vintageYear}</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <Badge bg={inv.status==="Active"?T.upBg:inv.status==="Realised"?T.inputBg:T.warnBg} color={inv.status==="Active"?T.up:inv.status==="Realised"?T.muted:T.warn}>{inv.status}</Badge>
                    <button onClick={()=>{setEditInv(inv);setShowModal(true);}} style={{background:T.inputBg,border:"none",borderRadius:7,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",color:T.text}}>Edit</button>
                    <button onClick={()=>setSelectedInv(null)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16,color:T.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:10,marginBottom:14}}>
                  {[
                    {l:"Current NAV",v:fmtCompact(inv.nav)},
                    {l:"TVPI",v:`${tvpi.toFixed(2)}x`},
                    {l:"DPI",v:`${dpi.toFixed(2)}x`},
                    {l:"IRR",v:`${inv.irr>=0?"+":""}${inv.irr}%`},
                  ].map(s=>(
                    <div key={s.l} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px"}}>
                      <div style={{fontSize:11,color:T.muted}}>{s.l}</div>
                      <div style={{fontSize:15,fontWeight:700,marginTop:4}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:4}}>
                  {[{id:"overview",label:"Overview"},{id:"transactions",label:`Transactions${txs.length>0?" ("+txs.length+")":""}`},{id:"postings",label:"Postings"}].map(dt=>(
                    <button key={dt.id} onClick={()=>setDrawerTab(dt.id)}
                      style={{padding:"6px 14px",borderRadius:8,border:"none",background:drawerTab===dt.id?T.selected:T.inputBg,
                        color:drawerTab===dt.id?T.selectedText:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:drawerTab===dt.id?700:400}}>
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Body */}
              <div style={{flex:1,padding:"20px 24px",overflowY:"auto",minHeight:0}}>
                {drawerTab === "overview" && (
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    {/* Capital Deployment Progress */}
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 18px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{fontSize:13,fontWeight:700}}>💸 Capital Deployment</div>
                        <div style={{fontSize:12,color:T.muted}}>{inv.commitment > 0 ? ((inv.calledCapital/inv.commitment)*100).toFixed(0) : 0}% called</div>
                      </div>
                      <div style={{height:8,background:T.inputBg,borderRadius:4,overflow:"hidden",marginBottom:10}}>
                        <div style={{width:`${inv.commitment > 0 ? (inv.calledCapital/inv.commitment)*100 : 0}%`,height:"100%",background:tc.color,borderRadius:4}}/>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                        <div><div style={{fontSize:11,color:T.muted}}>Commitment</div><div style={{fontSize:13,fontWeight:600,marginTop:2}}>{fmtCompact(inv.commitment)}</div></div>
                        <div><div style={{fontSize:11,color:T.muted}}>Called</div><div style={{fontSize:13,fontWeight:600,marginTop:2,color:tc.color}}>{fmtCompact(inv.calledCapital)}</div></div>
                        <div><div style={{fontSize:11,color:T.muted}}>Unfunded</div><div style={{fontSize:13,fontWeight:600,marginTop:2,color:unfunded>0?T.warn:T.dim}}>{fmtCompact(unfunded)}</div></div>
                      </div>
                    </div>
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📋 Investment Details</div>
                      {[
                        ["Investment Type",inv.investmentType],
                        [inv.investmentType.includes("Fund")?"GP / Manager":"Investment Channel",inv.manager],
                        [inv.investmentType.includes("Fund")?"Vintage Year":"Investment Year",String(inv.vintageYear)],
                        inv.stage&&inv.stage!=="N/A"?["Stage",inv.stage]:null,
                        ["Sector",inv.sector],
                        ["Geography",inv.geography],
                        inv.ownershipPct>0?["Ownership",`${inv.ownershipPct}%`]:null,
                        inv.fundSize>0?["Fund Size",fmtCompact(inv.fundSize)]:null,
                        inv.gpCommit>0?["GP Commitment",`${inv.gpCommit}%`]:null,
                        inv.investmentDate?["Investment Date",inv.investmentDate]:null,
                        inv.exitDate?["Exit Date",inv.exitDate]:null,
                        ["Currency",inv.currency],
                      ].filter(Boolean).map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                          <span style={{fontSize:12,color:T.muted}}>{k}</span>
                          <span style={{fontSize:12,fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📊 Performance</div>
                      {[
                        ["Commitment",fmtCompact(inv.commitment)],
                        ["Called Capital",fmtCompact(inv.calledCapital)],
                        ["Unfunded Commitment",fmtCompact(unfunded)],
                        ["Distributions Received",fmtCompact(inv.distributionsReceived)],
                        ["Current NAV",fmtCompact(inv.nav)],
                        ["Total Value (NAV + Distributions)",fmtCompact((inv.nav||0)+(inv.distributionsReceived||0))],
                        ["TVPI (Total Value / Paid-In)",`${tvpi.toFixed(2)}x`],
                        ["DPI (Distributions / Paid-In)",`${dpi.toFixed(2)}x`],
                        ["RVPI (Residual / Paid-In)",`${rvpi.toFixed(2)}x`],
                        ["IRR",`${inv.irr>=0?"+":""}${inv.irr}%`],
                      ].map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                          <span style={{fontSize:12,color:T.muted}}>{k}</span>
                          <span style={{fontSize:12,fontWeight:600,textAlign:"right"}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    {inv.notes && (
                      <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                        <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📝 Notes</div>
                        <div style={{padding:"12px 16px",fontSize:13,color:T.muted,lineHeight:1.6}}>{inv.notes}</div>
                      </div>
                    )}
                  </div>
                )}
                {drawerTab === "transactions" && (
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      {(()=>{
                        const calls=txs.filter(t=>t.type==="Capital Call");
                        const dists=txs.filter(t=>t.type==="Distribution");
                        const fees=txs.filter(t=>t.type==="Management Fee");
                        return [
                          {label:"Total Called",value:`S$${calls.reduce((s,t)=>s+(t.amount||0),0).toLocaleString()}`,sub:`${calls.length} calls`,color:T.text},
                          {label:"Total Distributed",value:`S$${dists.reduce((s,t)=>s+(t.amount||0),0).toLocaleString()}`,sub:`${dists.length} distributions`,color:T.up},
                          {label:"Management Fees",value:`S$${fees.reduce((s,t)=>s+(t.amount||0),0).toLocaleString()}`,sub:`${fees.length} fee payments`,color:T.down},
                        ];
                      })().map(s=>(
                        <div key={s.label} style={{background:T.inputBg,borderRadius:9,padding:"10px 12px"}}>
                          <div style={{fontSize:11,color:T.muted}}>{s.label}</div>
                          <div style={{fontSize:14,fontWeight:700,color:s.color,marginTop:4}}>{s.value}</div>
                          <div style={{fontSize:11,color:T.dim,marginTop:2}}>{s.sub}</div>
                        </div>
                      ))}
                    </div>
                    {inv.status !== "Written Off" && inv.status !== "Realised" && (
                      <div style={{display:"flex",justifyContent:"flex-end"}}>
                        <button onClick={()=>setShowTxModal(true)} style={{padding:"7px 16px",borderRadius:7,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>+ Record Transaction</button>
                      </div>
                    )}
                    {txs.length===0?(
                      <div style={{textAlign:"center",padding:"32px 20px",color:T.muted}}><div style={{fontSize:28,marginBottom:8}}>📒</div><div style={{fontSize:13,fontWeight:600}}>No transactions yet</div></div>
                    ):(
                      <div style={{display:"flex",flexDirection:"column",gap:1,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                        {txs.map((tx,i)=>{
                          const isOut = ["Capital Call","Management Fee"].includes(tx.type);
                          const isIncome = ["Distribution","Income / Gain","Exit / Realisation"].includes(tx.type);
                          const icon = {"Capital Call":"📤","Distribution":"📥","Income / Gain":"🎁","Management Fee":"⚠️","Valuation Update":"📊","Exit / Realisation":"🏁"}[tx.type]||"💰";
                          return (
                            <div key={tx.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",background:i%2===0?T.bg:T.inputBg,borderTop:i>0?`1px solid ${T.border}`:"none"}}>
                              <div style={{width:34,height:34,borderRadius:8,background:isIncome?T.upBg:isOut?T.downBg:T.accentBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{icon}</div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:600}}>{tx.type}{tx.notes?` — ${tx.notes}`:""}</div>
                                <div style={{fontSize:11,color:T.muted,marginTop:1,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                                  <span>{tx.date}</span>
                                  {tx.method&&<span style={{fontSize:10,background:T.inputBg,borderRadius:4,padding:"1px 6px"}}>{tx.method}</span>}
                                  {tx.ref&&<span style={{fontSize:10,color:T.dim,fontFamily:"monospace"}}>{tx.ref}</span>}
                                </div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div style={{fontSize:13,fontWeight:700,color:isIncome?T.up:isOut?T.down:T.text}}>
                                  {isIncome?"+":isOut?"-":""} S${tx.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
                                </div>
                                <div style={{fontSize:10,color:T.dim,marginTop:1}}>{tx.type}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {drawerTab === "postings" && (() => {
                  const sortedTxs = (inv.transactions||[]).filter(t=>t.status==="Complete"&&t.type!=="Valuation Update").slice().sort((a,b)=>a.date.localeCompare(b.date));
                  const journalRows = [];
                  sortedTxs.forEach(tx => {
                    if (tx.type==="Capital Call") {
                      journalRows.push(
                        {date:tx.date,desc:`Capital Call — ${tx.notes||inv.name}`,account:invAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:cashAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else if (tx.type==="Distribution") {
                      journalRows.push(
                        {date:tx.date,desc:`Distribution — ${tx.notes||inv.name}`,account:cashAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:invAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else if (tx.type==="Income / Gain"||tx.type==="Exit / Realisation") {
                      journalRows.push(
                        {date:tx.date,desc:`${tx.type} — ${tx.notes||inv.name}`,account:cashAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:incAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else if (tx.type==="Management Fee") {
                      journalRows.push(
                        {date:tx.date,desc:`Management Fee — ${tx.notes||inv.name}`,account:feeAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:cashAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    }
                  });
                  if (isMobile && journalRows.length > 0) return <MobilePostingsList journalRows={journalRows} entryCount={sortedTxs.length} entryLabel="transactions"/>;
                  if (journalRows.length===0) return (
                    <div style={{textAlign:"center",padding:"48px 20px",color:T.muted}}><div style={{fontSize:32,marginBottom:10}}>📒</div><div style={{fontSize:13,fontWeight:600}}>No entries to post yet</div></div>
                  );
                  return (
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",background:T.bg}}>
                      <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:inter}}>Ledger Postings</div>
                        <div style={{fontSize:12,color:T.accent,marginTop:3,fontFamily:inter}}>Double-entry bookkeeping · PTA compliant · {sortedTxs.length} transaction{sortedTxs.length!==1?"s":""}</div>
                      </div>
                      <div style={{overflowX:"auto",overflowY:"auto",maxHeight:460}}>
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
                            {["Date","Account","Description","Debit","Credit"].map((h,hi)=>(
                              <th key={h} style={{padding:"9px 16px",textAlign:hi>=3?"right":"left",width:hi===0||hi>=3?148:undefined,fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,whiteSpace:"nowrap"}}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {journalRows.map((row,ri)=>(
                              <tr key={ri} style={{borderBottom:`1px solid ${T.border}`}}>
                                <td style={{padding:"11px 16px",verticalAlign:"top",width:148}}>
                                  {row._first?(<><div style={{fontSize:13,fontFamily:inter,whiteSpace:"nowrap"}}>{row.date}</div><div style={{fontSize:11,color:T.dim,marginTop:2,fontFamily:inter}}>{daysAgo(row.date)}</div></>):null}
                                </td>
                                <td style={{padding:"11px 16px",verticalAlign:"top"}}><span style={{fontFamily:mono,fontSize:12,color:T.text}}>{row.account}</span></td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",fontSize:12,color:T.muted,fontFamily:inter}}>{row.desc}</td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                                  {row.debit?<span style={{fontSize:13,fontWeight:700,color:T.up,fontFamily:inter}}>{row.amount}</span>:<span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                                </td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                                  {!row.debit?<span style={{fontSize:13,fontWeight:700,color:T.down,fontFamily:inter}}>{row.amount}</span>:<span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{padding:"12px 18px",borderTop:`1px solid ${T.border}`,background:T.sidebar}}>
                        <div style={{fontSize:12,fontWeight:700,marginBottom:6,fontFamily:inter}}>Double-Entry Accounting</div>
                        <div style={{fontSize:11,color:T.muted,lineHeight:1.8,fontFamily:inter}}>
                          <div>• <span style={{color:T.up,fontWeight:600}}>Debit (Dr):</span> Capital Call → increases investment; Distribution / Exit → increases cash; Mgmt Fee → expense recognised</div>
                          <div>• <span style={{color:T.down,fontWeight:600}}>Credit (Cr):</span> Capital Call → reduces cash; Distribution → reduces investment (return of capital); Exit → realised gain income</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Transaction modal */}
      {showTxModal && selectedInv && (() => {
        const inv = investments.find(i => i.id === selectedInv.id) || selectedInv;
        return <PETxModalInner inv={inv} onSave={(tx) => {
          const newTx = {...tx, id:"PTX"+Date.now(), status:"Complete"};
          setInvestments(prev => prev.map(i => {
            if (i.id !== inv.id) return i;
            const nextTxs = [...(i.transactions||[]), newTx];
            let patch = { transactions: nextTxs };
            if (tx.type === "Capital Call") patch.calledCapital = (+i.calledCapital||0) + (+tx.amount||0);
            else if (tx.type === "Distribution") patch.distributionsReceived = (+i.distributionsReceived||0) + (+tx.amount||0);
            else if (tx.type === "Valuation Update") patch.nav = +tx.amount;
            else if (tx.type === "Exit / Realisation") { patch.distributionsReceived = (+i.distributionsReceived||0) + (+tx.amount||0); patch.nav = 0; patch.status = "Realised"; patch.exitDate = tx.date; }
            return { ...i, ...patch };
          }));
          setShowTxModal(false);
          showToast(`${tx.type} recorded`, "success");
        }} onClose={()=>setShowTxModal(false)}/>;
      })()}

      {/* Add/Edit modal */}
      {showModal && editInv && (
        <PEModal inv={editInv} onSave={handleSave} onClose={()=>{setShowModal(false);setEditInv(null);}}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BUSINESS PARTNERSHIP VENTURES MODULE
═══════════════════════════════════════════════════════════════ */

const BP_TYPES = ["LLP","General Partnership","Limited Partnership","Private Limited (Pte Ltd)","Joint Venture","Sole Proprietorship"];

const BP_TYPE_CONFIG = {
  "LLP":                        { icon:"🤝", color:"#2563EB", bg:"#EFF6FF" },
  "General Partnership":        { icon:"👥", color:"#7C3AED", bg:"#F5F3FF" },
  "Limited Partnership":        { icon:"📋", color:"#0891B2", bg:"#ECFEFF" },
  "Private Limited (Pte Ltd)":  { icon:"🏢", color:"#059669", bg:"#F0FDF4" },
  "Joint Venture":              { icon:"🔗", color:"#D97706", bg:"#FFFBEB" },
  "Sole Proprietorship":        { icon:"👤", color:"#DC2626", bg:"#FEF2F2" },
};

const BP_STATUS_OPTS = ["Active","Dormant","In Dispute","Exited","Closed","Pending Formation"];

const BP_ROLES = ["Managing Partner","Active Partner","Silent Partner","Limited Partner","Director / Shareholder","Board Observer","Consultant"];

const BP_INDUSTRIES = ["F&B","Retail","Technology","SaaS","Professional Services","Real Estate","Manufacturing","E-commerce","Logistics","Healthcare","Education","Media","Consulting","Other"];

const EMPTY_BP = {
  id:"", businessName:"", partnershipType:"LLP", industry:"F&B", role:"Active Partner",
  ownershipPct:0, totalPartners:2,
  capitalContributed:0, partnerLoans:0, distributionsReceived:0, salaryDrawings:0,
  bookValue:0, estimatedMarketValue:0,
  annualRevenue:0, annualProfit:0,
  startDate:"", expiryDate:"",
  registrationNo:"", country:"Singapore", currency:"SGD",
  status:"Active", notes:"",
  transactions:[],
};

const BP_INIT = [
  {
    id:"BP001", businessName:"Sunset Café LLP", partnershipType:"LLP", industry:"F&B", role:"Managing Partner",
    ownershipPct:40, totalPartners:3,
    capitalContributed:80000, partnerLoans:20000, distributionsReceived:32000, salaryDrawings:48000,
    bookValue:96000, estimatedMarketValue:140000,
    annualRevenue:680000, annualProfit:95000,
    startDate:"2022-05-01", expiryDate:"",
    registrationNo:"T22LL1234A", country:"Singapore", currency:"SGD",
    status:"Active",
    notes:"3-partner café near Joo Chiat. Operating for 4 years. Considering second outlet. Partner loan at 4% p.a.",
    transactions:[
      {id:"BTX001",date:"2022-05-15",type:"Capital Contribution",amount:60000,method:"Bank Transfer",ref:"SUN-CAP-INIT",status:"Complete",notes:"Initial capital injection — fit-out and working capital"},
      {id:"BTX002",date:"2023-02-10",type:"Capital Contribution",amount:20000,method:"Bank Transfer",ref:"SUN-CAP-Y2",status:"Complete",notes:"Top-up for espresso machine upgrade"},
      {id:"BTX003",date:"2023-08-20",type:"Partner Loan",amount:20000,method:"Bank Transfer",ref:"SUN-LOAN-01",status:"Complete",notes:"Partner loan at 4% p.a. — renovation"},
      {id:"BTX004",date:"2023-12-20",type:"Profit Distribution",amount:10000,method:"Bank Transfer",ref:"SUN-PD-2023",status:"Complete",notes:"FY2023 year-end profit share (40% of $25K)"},
      {id:"BTX005",date:"2024-12-20",type:"Profit Distribution",amount:14000,method:"Bank Transfer",ref:"SUN-PD-2024",status:"Complete",notes:"FY2024 profit share"},
      {id:"BTX006",date:"2025-06-30",type:"Salary / Drawings",amount:24000,method:"GIRO",ref:"SUN-DRAW-H1-25",status:"Complete",notes:"H1 2025 managing partner drawings"},
      {id:"BTX007",date:"2025-12-20",type:"Profit Distribution",amount:8000,method:"Bank Transfer",ref:"SUN-PD-2025",status:"Complete",notes:"FY2025 interim profit share"},
      {id:"BTX008",date:"2025-12-31",type:"Salary / Drawings",amount:24000,method:"GIRO",ref:"SUN-DRAW-H2-25",status:"Complete",notes:"H2 2025 managing partner drawings"},
    ],
  },
  {
    id:"BP002", businessName:"GreenTech Solutions Pte Ltd", partnershipType:"Private Limited (Pte Ltd)", industry:"Technology", role:"Director / Shareholder",
    ownershipPct:25, totalPartners:4,
    capitalContributed:120000, partnerLoans:0, distributionsReceived:18000, salaryDrawings:0,
    bookValue:180000, estimatedMarketValue:320000,
    annualRevenue:1200000, annualProfit:220000,
    startDate:"2021-09-01", expiryDate:"",
    registrationNo:"202112345K", country:"Singapore", currency:"SGD",
    status:"Active",
    notes:"IoT and building automation company. Co-founded with 3 partners. Director role, not drawing salary (receive dividends instead).",
    transactions:[
      {id:"BTX009",date:"2021-09-15",type:"Capital Contribution",amount:100000,method:"Bank Transfer",ref:"GT-FNDR-CAP",status:"Complete",notes:"Founder capital — 100,000 ordinary shares at S$1"},
      {id:"BTX010",date:"2023-03-20",type:"Capital Contribution",amount:20000,method:"Bank Transfer",ref:"GT-RND-A",status:"Complete",notes:"Pro-rata in Series A bridge — anti-dilution"},
      {id:"BTX011",date:"2024-06-30",type:"Dividend",amount:10000,method:"Bank Transfer",ref:"GT-DIV-2024",status:"Complete",notes:"FY2024 dividend declared"},
      {id:"BTX012",date:"2025-06-30",type:"Dividend",amount:8000,method:"Bank Transfer",ref:"GT-DIV-2025",status:"Complete",notes:"FY2025 dividend declared"},
    ],
  },
  {
    id:"BP003", businessName:"Urban Logistics JV", partnershipType:"Joint Venture", industry:"Logistics", role:"Silent Partner",
    ownershipPct:20, totalPartners:3,
    capitalContributed:50000, partnerLoans:0, distributionsReceived:15000, salaryDrawings:0,
    bookValue:65000, estimatedMarketValue:85000,
    annualRevenue:420000, annualProfit:72000,
    startDate:"2023-02-15", expiryDate:"2028-02-14",
    registrationNo:"—", country:"Singapore", currency:"SGD",
    status:"Active",
    notes:"Last-mile delivery JV with an operational partner. 5-year JV agreement with renewal option. Silent partner role.",
    transactions:[
      {id:"BTX013",date:"2023-02-20",type:"Capital Contribution",amount:50000,method:"Bank Transfer",ref:"ULJV-CAP-01",status:"Complete",notes:"Initial JV capital — 20% stake"},
      {id:"BTX014",date:"2024-03-15",type:"Profit Distribution",amount:6000,method:"Bank Transfer",ref:"ULJV-PD-2023",status:"Complete",notes:"FY2023 profit share"},
      {id:"BTX015",date:"2025-03-15",type:"Profit Distribution",amount:9000,method:"Bank Transfer",ref:"ULJV-PD-2024",status:"Complete",notes:"FY2024 profit share"},
    ],
  },
  {
    id:"BP004", businessName:"Two-Hearts Wedding Studio", partnershipType:"LLP", industry:"Professional Services", role:"Managing Partner",
    ownershipPct:50, totalPartners:2,
    capitalContributed:30000, partnerLoans:0, distributionsReceived:85000, salaryDrawings:0,
    bookValue:0, estimatedMarketValue:0,
    annualRevenue:0, annualProfit:0,
    startDate:"2019-01-15", expiryDate:"2024-08-31",
    registrationNo:"T19LL5678B", country:"Singapore", currency:"SGD",
    status:"Exited",
    notes:"Co-owned wedding photography & planning studio. Exited in Aug 2024 — partner bought out my stake for $120K total (incl. $85K distributions).",
    transactions:[
      {id:"BTX016",date:"2019-01-20",type:"Capital Contribution",amount:30000,method:"Bank Transfer",ref:"2H-CAP-INIT",status:"Complete",notes:"Initial capital"},
      {id:"BTX017",date:"2022-12-31",type:"Profit Distribution",amount:25000,method:"Bank Transfer",ref:"2H-PD-2022",status:"Complete",notes:"FY2022 profit share (50%)"},
      {id:"BTX018",date:"2023-12-31",type:"Profit Distribution",amount:30000,method:"Bank Transfer",ref:"2H-PD-2023",status:"Complete",notes:"FY2023 profit share"},
      {id:"BTX019",date:"2024-07-15",type:"Profit Distribution",amount:30000,method:"Bank Transfer",ref:"2H-PD-2024-H1",status:"Complete",notes:"H1 2024 profit share"},
      {id:"BTX020",date:"2024-08-31",type:"Exit / Buyout",amount:85000,method:"Bank Transfer",ref:"2H-BUYOUT",status:"Complete",notes:"Partner buyout — 50% stake for $85K (goodwill + equity)"},
    ],
  },
  {
    id:"BP005", businessName:"Axis Property Trust", partnershipType:"Limited Partnership", industry:"Real Estate", role:"Limited Partner",
    ownershipPct:15, totalPartners:8,
    capitalContributed:75000, partnerLoans:0, distributionsReceived:9000, salaryDrawings:0,
    bookValue:82000, estimatedMarketValue:95000,
    annualRevenue:180000, annualProfit:45000,
    startDate:"2023-11-01", expiryDate:"",
    registrationNo:"T23LP9012C", country:"Singapore", currency:"SGD",
    status:"Active",
    notes:"Limited partnership holding a small commercial unit at Paya Lebar. 8 LPs + 1 GP. LPs receive rental income pro-rata.",
    transactions:[
      {id:"BTX021",date:"2023-11-10",type:"Capital Contribution",amount:75000,method:"Bank Transfer",ref:"AXIS-LP-01",status:"Complete",notes:"LP capital — 15% of $500K raise"},
      {id:"BTX022",date:"2024-12-31",type:"Profit Distribution",amount:4500,method:"Bank Transfer",ref:"AXIS-PD-2024",status:"Complete",notes:"FY2024 net rental income distribution"},
      {id:"BTX023",date:"2025-12-31",type:"Profit Distribution",amount:4500,method:"Bank Transfer",ref:"AXIS-PD-2025",status:"Complete",notes:"FY2025 net rental income distribution"},
    ],
  },
  {
    id:"BP006", businessName:"Nova Coffee Roasters Pte Ltd", partnershipType:"Private Limited (Pte Ltd)", industry:"F&B", role:"Board Observer",
    ownershipPct:8, totalPartners:5,
    capitalContributed:40000, partnerLoans:0, distributionsReceived:0, salaryDrawings:0,
    bookValue:40000, estimatedMarketValue:55000,
    annualRevenue:850000, annualProfit:15000,
    startDate:"2024-03-20", expiryDate:"",
    registrationNo:"202412345D", country:"Singapore", currency:"SGD",
    status:"Active",
    notes:"Angel investment in coffee roaster/distributor. Board observer rights. No dividends yet — reinvesting for growth.",
    transactions:[
      {id:"BTX024",date:"2024-03-25",type:"Capital Contribution",amount:40000,method:"Bank Transfer",ref:"NOVA-ANG-01",status:"Complete",notes:"Angel round — 8% stake at $500K post-money"},
    ],
  },
  {
    id:"BP007", businessName:"Harborfront E-comm", partnershipType:"General Partnership", industry:"E-commerce", role:"Silent Partner",
    ownershipPct:30, totalPartners:2,
    capitalContributed:25000, partnerLoans:0, distributionsReceived:8500, salaryDrawings:0,
    bookValue:25000, estimatedMarketValue:20000,
    annualRevenue:0, annualProfit:0,
    startDate:"2022-08-01", expiryDate:"",
    registrationNo:"53401234E", country:"Singapore", currency:"SGD",
    status:"Dormant",
    notes:"Dropshipping partnership that went dormant in mid-2024. Active partner moved overseas. Considering winding up.",
    transactions:[
      {id:"BTX025",date:"2022-08-10",type:"Capital Contribution",amount:25000,method:"Bank Transfer",ref:"HBF-CAP-01",status:"Complete",notes:"Initial 30% stake"},
      {id:"BTX026",date:"2023-06-30",type:"Profit Distribution",amount:5000,method:"Bank Transfer",ref:"HBF-PD-2023",status:"Complete",notes:"H1 2023 profit share"},
      {id:"BTX027",date:"2024-03-31",type:"Profit Distribution",amount:3500,method:"Bank Transfer",ref:"HBF-PD-2024",status:"Complete",notes:"Final distribution before dormancy"},
    ],
  },
];

// ── Business Partnership Transaction Modal ────────────────────
function BPTxModalInner({ venture, onSave, onClose }) {
  const isPteLtd = venture.partnershipType === "Private Limited (Pte Ltd)";
  const txTypes = isPteLtd
    ? ["Capital Contribution","Dividend","Salary / Drawings","Partner Loan","Loan Repayment","Valuation Update","Exit / Buyout"]
    : ["Capital Contribution","Profit Distribution","Salary / Drawings","Partner Loan","Loan Repayment","Capital Withdrawal","Valuation Update","Exit / Buyout"];
  const txTypeIcon = {"Capital Contribution":"📤","Profit Distribution":"💰","Dividend":"💰","Salary / Drawings":"💵","Partner Loan":"📤","Loan Repayment":"📥","Capital Withdrawal":"📥","Valuation Update":"📊","Exit / Buyout":"🏁"};

  const [f, setF] = useState({
    type: "Capital Contribution",
    date: new Date().toISOString().slice(0,10),
    amount: 0, method: "Bank Transfer", ref: "", notes: "",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const isOut = ["Capital Contribution","Partner Loan"].includes(f.type);
  const isValOnly = f.type === "Valuation Update";

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:16,width:480,maxHeight:"85vh",overflow:"auto",padding:"28px 28px 20px",border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:6}}>Record Transaction</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:20}}>{venture.businessName} · {venture.partnershipType}</div>
        <div style={{marginBottom:14}}>
          <Label required>Transaction Type</Label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {txTypes.map(t=>(
              <button key={t} onClick={()=>set("type",t)}
                style={{flex:"1 1 140px",padding:"10px 14px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:f.type===t?700:400,
                  border:`1px solid ${f.type===t?T.selected:T.border}`,background:f.type===t?T.selected:T.bg,color:f.type===t?T.selectedText:T.muted}}>
                {txTypeIcon[t]||"💰"} {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Date</Label><Input type="date" value={f.date} onChange={e=>set("date",e.target.value)}/></div>
          <div><Label required>{isValOnly?"New Market Value":"Amount"}</Label><Input type="number" prefix="S$" value={f.amount} onChange={e=>set("amount",+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Method</Label><Sel value={f.method} onChange={e=>set("method",e.target.value)} options={["Bank Transfer","GIRO","Cheque","Cash","Netting","In-Kind"]}/></div>
          <div><Label>Reference</Label><Input value={f.ref} onChange={e=>set("ref",e.target.value)} placeholder="e.g. SUN-CAP-01"/></div>
        </div>
        <div style={{marginBottom:14}}>
          <Label>Notes</Label>
          <textarea value={f.notes} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="e.g. Year-end profit share, renovation loan…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none",resize:"vertical"}}/>
        </div>
        <div style={{background:isValOnly?T.accentBg:isOut?T.downBg:T.upBg,borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:isValOnly?T.accent:isOut?T.down:T.up,fontWeight:600}}>
            {isValOnly?"📊 Market value updated":isOut?"📤 Capital deployed to business":"📥 Income received from business"}
          </span>
          <span style={{fontWeight:700,color:isValOnly?T.accent:isOut?T.down:T.up}}>{isValOnly?"":(isOut?"-":"+")} S${(f.amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Cancel</button>
          <button onClick={()=>onSave(f)} disabled={!f.date||f.amount<=0}
            style={{padding:"9px 20px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,opacity:(!f.date||f.amount<=0)?0.4:1}}>
            Record {f.type}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Business Partnership Add/Edit Modal ───────────────────────
function BPModal({ venture, onSave, onClose }) {
  const [f, setF] = useState({ ...venture });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:16,width:580,maxHeight:"85vh",overflow:"auto",padding:"28px 28px 20px",border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:20}}>{f.id ? "Edit Venture" : "Add Business Partnership"}</div>
        <div style={{marginBottom:14}}>
          <Label required>Business Name</Label>
          <Input value={f.businessName} onChange={e=>set("businessName",e.target.value)} placeholder="e.g. Sunset Café LLP"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Partnership Type</Label><Sel value={f.partnershipType} onChange={e=>set("partnershipType",e.target.value)} options={BP_TYPES}/></div>
          <div><Label required>Industry</Label><Sel value={f.industry} onChange={e=>set("industry",e.target.value)} options={BP_INDUSTRIES}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Your Role</Label><Sel value={f.role} onChange={e=>set("role",e.target.value)} options={BP_ROLES}/></div>
          <div><Label>Ownership (%)</Label><Input type="number" value={f.ownershipPct} onChange={e=>set("ownershipPct",+e.target.value)}/></div>
          <div><Label>Total Partners</Label><Input type="number" value={f.totalPartners} onChange={e=>set("totalPartners",+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Capital Contributed</Label><Input type="number" prefix="S$" value={f.capitalContributed} onChange={e=>set("capitalContributed",+e.target.value)}/></div>
          <div><Label>Partner Loans Outstanding</Label><Input type="number" prefix="S$" value={f.partnerLoans} onChange={e=>set("partnerLoans",+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Book Value (your stake)</Label><Input type="number" prefix="S$" value={f.bookValue} onChange={e=>set("bookValue",+e.target.value)}/></div>
          <div><Label>Estimated Market Value</Label><Input type="number" prefix="S$" value={f.estimatedMarketValue} onChange={e=>set("estimatedMarketValue",+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Annual Revenue (business)</Label><Input type="number" prefix="S$" value={f.annualRevenue} onChange={e=>set("annualRevenue",+e.target.value)}/></div>
          <div><Label>Annual Profit (business)</Label><Input type="number" prefix="S$" value={f.annualProfit} onChange={e=>set("annualProfit",+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Start Date</Label><Input type="date" value={f.startDate} onChange={e=>set("startDate",e.target.value)}/></div>
          <div><Label>Expiry Date</Label><Input type="date" value={f.expiryDate} onChange={e=>set("expiryDate",e.target.value)}/></div>
          <div><Label>Registration No.</Label><Input value={f.registrationNo} onChange={e=>set("registrationNo",e.target.value)} placeholder="UEN"/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Country</Label><Input value={f.country} onChange={e=>set("country",e.target.value)}/></div>
          <div><Label>Currency</Label><Sel value={f.currency} onChange={e=>set("currency",e.target.value)} options={["SGD","USD","EUR","MYR","HKD"]}/></div>
          <div><Label>Status</Label><Sel value={f.status} onChange={e=>set("status",e.target.value)} options={BP_STATUS_OPTS}/></div>
        </div>
        <div style={{marginBottom:20}}>
          <Label>Notes</Label>
          <textarea value={f.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="Partnership terms, agreements, thesis…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none",resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Cancel</button>
          <button onClick={()=>onSave(f)} disabled={!f.businessName||!f.partnershipType}
            style={{padding:"9px 20px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,opacity:(!f.businessName||!f.partnershipType)?0.4:1}}>
            {f.id ? "Save Changes" : "Add Venture"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Business Partnership Ventures Screen ──────────────────────
function BPScreen({ ventures, setVentures, showToast }) {
  const isMobile = useIsMobile();
  const [selectedVenture, setSelectedVenture] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editVenture, setEditVenture] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [drawerTab, setDrawerTab] = useState("overview");
  const [showTxModal, setShowTxModal] = useState(false);
  const bpSort = useSortState();

  const activeVentures = ventures.filter(v => v.status === "Active" || v.status === "Dormant" || v.status === "In Dispute");
  const totalCapital = activeVentures.reduce((s,v) => s + (v.capitalContributed||0) + (v.partnerLoans||0), 0);
  const totalBookValue = activeVentures.reduce((s,v) => s + (v.bookValue||0), 0);
  const totalMarketValue = activeVentures.reduce((s,v) => s + (v.estimatedMarketValue||0), 0);
  const totalDistributions = ventures.reduce((s,v) => s + (v.distributionsReceived||0) + (v.salaryDrawings||0), 0);
  const currentYearTxs = ventures.flatMap(v=>(v.transactions||[])).filter(t=>t.date && t.date.startsWith("2025") && ["Profit Distribution","Dividend","Salary / Drawings"].includes(t.type));
  const ytdIncome = currentYearTxs.reduce((s,t)=>s+(t.amount||0),0);
  const unrealizedGain = totalMarketValue - totalBookValue;

  // Industry breakdown
  const industryBreakdown = {};
  activeVentures.forEach(v => { industryBreakdown[v.industry] = (industryBreakdown[v.industry]||0) + (v.estimatedMarketValue||v.bookValue||0); });

  const filtered = ventures.filter(v => {
    if (filterType !== "All" && v.partnershipType !== filterType) return false;
    if (filterStatus !== "All" && v.status !== filterStatus) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!(v.businessName||"").toLowerCase().includes(q) && !(v.industry||"").toLowerCase().includes(q) && !(v.role||"").toLowerCase().includes(q) && !(v.registrationNo||"").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleSave = (f) => {
    if (f.id) {
      setVentures(prev => prev.map(v => v.id === f.id ? { ...v, ...f } : v));
      showToast("Venture updated", "success");
    } else {
      setVentures(prev => [...prev, { ...f, id:"BP"+Date.now(), transactions:[] }]);
      showToast("Venture added", "success");
    }
    setShowModal(false);
    setEditVenture(null);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {/* Page header */}
      <div className="wo-page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:700}}>Business Partnership Portfolio</div>
          <div style={{fontSize:13,color:T.muted,marginTop:2}}>{activeVentures.length} active venture{activeVentures.length!==1?"s":""} · {ventures.length} total</div>
        </div>
        <button onClick={()=>{setEditVenture({...EMPTY_BP,id:""});setShowModal(true);}}
          style={{background:T.selected,color:T.selectedText,border:"none",borderRadius:9,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
          + Add Venture
        </button>
      </div>

      {/* Summary cards */}
      <div className="wo-summary-grid" style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12,marginBottom:18}}>
        {[
          {label:"Total Market Value",value:fmtCompact(totalMarketValue),sub:`Book: ${fmtCompact(totalBookValue)}`,icon:"🏢",color:T.text},
          {label:"Capital Deployed",value:fmtCompact(totalCapital),sub:`${activeVentures.length} active ventures`,icon:"📤",color:T.accent},
          {label:"Lifetime Income",value:fmtCompact(totalDistributions),sub:`Distributions + drawings`,icon:"📥",color:T.up},
          {label:"YTD 2025 Income",value:fmtCompact(ytdIncome),sub:`${currentYearTxs.length} distribution${currentYearTxs.length!==1?"s":""}`,icon:"📈",color:ytdIncome>0?T.up:T.dim},
        ].map((c,i)=>(
          <Card key={i} style={{padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{fontSize:12,color:T.muted,fontWeight:500}}>{c.label}</div>
              <span style={{fontSize:20}}>{c.icon}</span>
            </div>
            <div style={{fontSize:22,fontWeight:700,marginTop:8,color:c.color}}>{c.value}</div>
            <div style={{fontSize:11,color:T.dim,marginTop:4}}>{c.sub}</div>
          </Card>
        ))}
      </div>

      {/* Breakdown bar */}
      {Object.keys(industryBreakdown).length > 0 && (
        <Card style={{padding:"16px 20px",marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Value by Industry</div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
            {Object.entries(industryBreakdown).sort(([,a],[,b])=>b-a).map(([industry, val], idx)=>{
              const totalInd = Object.values(industryBreakdown).reduce((a,b)=>a+b,0);
              const pct = totalInd > 0 ? (val/totalInd*100).toFixed(0) : 0;
              const colors = ["#2563EB","#7C3AED","#059669","#D97706","#DC2626","#0891B2","#9333EA"];
              const color = colors[idx % colors.length];
              return (
                <div key={industry} style={{flex:"1 1 140px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:12,color:T.muted,fontWeight:500}}>{industry}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{pct}%</span>
                  </div>
                  <div style={{height:6,background:T.inputBg,borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:3}}/>
                  </div>
                  <div style={{fontSize:11,color:T.dim,marginTop:4}}>{fmtCompact(val)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Unrealized gain banner */}
      {unrealizedGain !== 0 && (
        <Card style={{padding:"12px 16px",marginBottom:14,background:unrealizedGain>=0?T.upBg:T.downBg,border:`1px solid ${unrealizedGain>=0?T.up:T.down}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>{unrealizedGain>=0?"📈":"📉"}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:unrealizedGain>=0?T.up:T.down}}>
                {unrealizedGain>=0?"+":""}{fmtCompact(unrealizedGain)} unrealised {unrealizedGain>=0?"gain":"loss"} on market value vs book
              </div>
              <div style={{fontSize:11,color:T.muted,marginTop:1}}>Market valuations are estimates — refresh during audit / revaluation cycles</div>
            </div>
          </div>
        </Card>
      )}

      {/* Filter toolbar */}
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:"1 1 200px"}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.dim,pointerEvents:"none"}}>🔍</span>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search business, industry, role, UEN…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px 8px 34px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["All",...BP_STATUS_OPTS].map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)}
              style={{background:filterStatus===s?T.selected:T.inputBg,color:filterStatus===s?T.selectedText:T.muted,border:`1px solid ${filterStatus===s?T.selected:T.border}`,borderRadius:7,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:filterStatus===s?600:400}}>
              {s}
            </button>
          ))}
        </div>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)}
          style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 12px",fontSize:12,fontFamily:"inherit",color:T.text,cursor:"pointer",outline:"none"}}>
          {["All",...BP_TYPES].map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{fontSize:12,color:T.muted,marginLeft:"auto"}}>{filtered.length} of {ventures.length}</span>
      </div>

      {/* Table / Mobile cards */}
      {filtered.length === 0 ? (
        <Card style={{padding:"48px 24px",textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>🤝</div>
          <div style={{fontSize:14,fontWeight:600}}>No ventures found</div>
          <div style={{fontSize:12,color:T.muted,marginTop:4}}>Try adjusting filters or add a new venture</div>
        </Card>
      ) : isMobile ? (
        <Card style={{padding:0,overflow:"hidden"}}>
          {filtered.map(v => {
            const tc = BP_TYPE_CONFIG[v.partnershipType] || {icon:"🤝",color:T.muted,bg:T.inputBg};
            const value = v.estimatedMarketValue || v.bookValue || 0;
            const capital = (v.capitalContributed||0) + (v.partnerLoans||0);
            const gain = value - capital;
            return <MobileListItem key={v.id} onClick={()=>{setSelectedVenture(v);setDrawerTab("overview");}}
              icon={tc.icon} iconBg={tc.bg} title={v.businessName} subtitle={`${v.role} · ${v.ownershipPct}% · ${v.industry}`}
              value={fmtCompact(value)} valueColor={T.text} valueSub={`Capital: ${fmtCompact(capital)}`}
              badge={v.status} badgeBg={v.status==="Active"?T.upBg:v.status==="Dormant"?T.warnBg:T.inputBg} badgeColor={v.status==="Active"?T.up:v.status==="Dormant"?T.warn:T.muted}
              extra={gain !== 0 ? <span style={{fontSize:11,fontWeight:600,color:gain>=0?T.up:T.down}}>{gain>=0?"+":""}{fmtCompact(gain)}</span> : null}
            />;
          })}
        </Card>
      ) : (
        <Card style={{padding:0,overflowX:"auto"}} className="wo-table-scroll">
          <SortHeader gridCols="2.2fr 1fr 0.8fr 1.1fr 1.1fr 1fr 0.8fr" sortKey={bpSort.sortKey} sortDir={bpSort.sortDir} onSort={bpSort.onSort}
            columns={[["Business / Role","left","name"],["Type","left","type"],["Stake","right","stake"],["Capital / Book","right","capital"],["Market Value","right","value"],["Income","right","income"],["Status","left","status"]]}/>
          {bpSort.sortFn(filtered, (v, k) => {
            if (k==="name") return (v.businessName||"").toLowerCase();
            if (k==="type") return (v.partnershipType||"").toLowerCase();
            if (k==="stake") return v.ownershipPct||0;
            if (k==="capital") return (v.capitalContributed||0) + (v.partnerLoans||0);
            if (k==="value") return v.estimatedMarketValue||v.bookValue||0;
            if (k==="income") return (v.distributionsReceived||0) + (v.salaryDrawings||0);
            if (k==="status") return v.status;
            return 0;
          }).map((v, idx) => {
            const tc = BP_TYPE_CONFIG[v.partnershipType] || {icon:"🤝",color:T.muted,bg:T.inputBg};
            const capital = (v.capitalContributed||0) + (v.partnerLoans||0);
            const value = v.estimatedMarketValue || v.bookValue || 0;
            const income = (v.distributionsReceived||0) + (v.salaryDrawings||0);
            const gain = value - capital;
            const isDim = v.status === "Exited" || v.status === "Closed";
            return (
              <div key={v.id} onClick={()=>{setSelectedVenture(v);setDrawerTab("overview");}}
                style={{display:"grid",gridTemplateColumns:"2.2fr 1fr 0.8fr 1.1fr 1.1fr 1fr 0.8fr",padding:"13px 20px",borderBottom:idx<filtered.length-1?`1px solid ${T.border}`:"none",alignItems:"center",cursor:"pointer",
                  opacity:isDim?0.55:1,background:isDim?T.sidebar:""}}
                onMouseEnter={e=>e.currentTarget.style.background=T.hover}
                onMouseLeave={e=>e.currentTarget.style.background=(isDim?T.sidebar:"")}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{width:34,height:34,borderRadius:9,background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{tc.icon}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{v.businessName}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:1}}>{v.role} · {v.industry}{v.registrationNo&&v.registrationNo!=="—"?` · ${v.registrationNo}`:""}</div>
                  </div>
                </div>
                <div style={{fontSize:12,color:T.muted}}>{v.partnershipType}</div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.accent}}>{v.ownershipPct}%</div>
                  <div style={{fontSize:10,color:T.dim,marginTop:1}}>of {v.totalPartners} partners</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12}}>{fmtCompact(capital)}</div>
                  <div style={{fontSize:10,color:T.dim,marginTop:1}}>Book: {fmtCompact(v.bookValue)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,fontWeight:700}}>{fmtCompact(value)}</div>
                  {gain !== 0 && <div style={{fontSize:10,color:gain>=0?T.up:T.down,marginTop:1,fontWeight:600}}>{gain>=0?"+":""}{fmtCompact(gain)}</div>}
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,color:T.up,fontWeight:600}}>{fmtCompact(income)}</div>
                  <div style={{fontSize:10,color:T.dim,marginTop:1}}>lifetime</div>
                </div>
                <div>
                  <Badge bg={v.status==="Active"?T.upBg:v.status==="Dormant"?T.warnBg:v.status==="Exited"||v.status==="Closed"?T.inputBg:T.downBg}
                    color={v.status==="Active"?T.up:v.status==="Dormant"?T.warn:v.status==="Exited"||v.status==="Closed"?T.muted:T.down}>
                    {v.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ══ VENTURE DETAIL DRAWER ══ */}
      {selectedVenture && (() => {
        const venture = ventures.find(v => v.id === selectedVenture.id) || selectedVenture;
        const tc = BP_TYPE_CONFIG[venture.partnershipType] || {icon:"🤝",color:T.muted,bg:T.inputBg};
        const txs = (venture.transactions || []).slice().sort((a,b)=>b.date.localeCompare(a.date));
        const capital = (venture.capitalContributed||0) + (venture.partnerLoans||0);
        const value = venture.estimatedMarketValue || venture.bookValue || 0;
        const income = (venture.distributionsReceived||0) + (venture.salaryDrawings||0);
        const totalReturn = income + value - capital;
        const returnPct = capital > 0 ? (totalReturn/capital*100) : 0;
        const inter = "'Inter','Segoe UI',system-ui,sans-serif";
        const mono  = "'Courier New',Courier,monospace";
        const fmtA  = (v) => "S$" + Math.abs(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
        const cashAcct = "Assets:Bank:Cash";
        const equityAcct = `Assets:Partnerships:${venture.partnershipType.replace(/[ /()]/g,"")}:${(venture.businessName||"").replace(/[ /]/g,"").slice(0,24)}`;
        const loanAcct = `Assets:Partnerships:LoansReceivable:${(venture.businessName||"").replace(/[ /]/g,"").slice(0,24)}`;
        const incAcct = `Income:Partnerships:${venture.partnershipType==="Private Limited (Pte Ltd)"?"Dividends":"ProfitShare"}`;
        const salaryAcct = "Income:Partnerships:PartnerDrawings";
        const daysAgo = (d) => { if (!d) return ""; const diff = Math.floor((Date.now() - new Date(d)) / 86400000); return diff === 0 ? "Today" : diff === 1 ? "1 day ago" : diff + " days ago"; };

        return (
          <div className="wo-drawer-overlay" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}
            onClick={e=>{if(e.target===e.currentTarget) setSelectedVenture(null);}}>
            <div style={{width:"min(960px, 95vw)",height:"100vh",background:T.bg,overflow:"hidden",boxShadow:"-4px 0 32px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column"}}>
              {/* Header */}
              <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,flexShrink:0}}>
                <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
                  <div style={{width:44,height:44,borderRadius:12,background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{tc.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:16,fontWeight:700}}>{venture.businessName}</div>
                    <div style={{fontSize:12,color:T.muted,marginTop:2}}>{venture.partnershipType} · {venture.role} · {venture.ownershipPct}% stake</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <Badge bg={venture.status==="Active"?T.upBg:venture.status==="Dormant"?T.warnBg:T.inputBg} color={venture.status==="Active"?T.up:venture.status==="Dormant"?T.warn:T.muted}>{venture.status}</Badge>
                    <button onClick={()=>{setEditVenture(venture);setShowModal(true);}} style={{background:T.inputBg,border:"none",borderRadius:7,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",color:T.text}}>Edit</button>
                    <button onClick={()=>setSelectedVenture(null)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16,color:T.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:10,marginBottom:14}}>
                  {[
                    {l:"Market Value",v:fmtCompact(value)},
                    {l:"Capital Deployed",v:fmtCompact(capital)},
                    {l:"Lifetime Income",v:fmtCompact(income)},
                    {l:"Total Return",v:`${totalReturn>=0?"+":""}${fmtCompact(totalReturn)} (${returnPct>=0?"+":""}${returnPct.toFixed(0)}%)`},
                  ].map(s=>(
                    <div key={s.l} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px"}}>
                      <div style={{fontSize:11,color:T.muted}}>{s.l}</div>
                      <div style={{fontSize:14,fontWeight:700,marginTop:4}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:4}}>
                  {[{id:"overview",label:"Overview"},{id:"transactions",label:`Transactions${txs.length>0?" ("+txs.length+")":""}`},{id:"postings",label:"Postings"}].map(dt=>(
                    <button key={dt.id} onClick={()=>setDrawerTab(dt.id)}
                      style={{padding:"6px 14px",borderRadius:8,border:"none",background:drawerTab===dt.id?T.selected:T.inputBg,
                        color:drawerTab===dt.id?T.selectedText:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:drawerTab===dt.id?700:400}}>
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Body */}
              <div style={{flex:1,padding:"20px 24px",overflowY:"auto",minHeight:0}}>
                {drawerTab === "overview" && (
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📋 Partnership Details</div>
                      {[
                        ["Business Name",venture.businessName],
                        ["Partnership Type",venture.partnershipType],
                        ["Industry",venture.industry],
                        ["Your Role",venture.role],
                        ["Ownership",`${venture.ownershipPct}% of ${venture.totalPartners} partner${venture.totalPartners!==1?"s":""}`],
                        venture.registrationNo&&venture.registrationNo!=="—"?["Registration No. (UEN)",venture.registrationNo]:null,
                        ["Country",venture.country],
                        ["Currency",venture.currency],
                        venture.startDate?["Start Date",venture.startDate]:null,
                        venture.expiryDate?["Expiry / Exit Date",venture.expiryDate]:null,
                      ].filter(Boolean).map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                          <span style={{fontSize:12,color:T.muted}}>{k}</span>
                          <span style={{fontSize:12,fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>💰 Your Position</div>
                      {[
                        ["Capital Contributed",fmtCompact(venture.capitalContributed)],
                        venture.partnerLoans>0?["Partner Loan Outstanding",fmtCompact(venture.partnerLoans)]:null,
                        ["Total Capital Deployed",fmtCompact(capital)],
                        ["Book Value of Stake",fmtCompact(venture.bookValue)],
                        ["Estimated Market Value",fmtCompact(venture.estimatedMarketValue)],
                        ["Distributions Received (lifetime)",fmtCompact(venture.distributionsReceived)],
                        venture.salaryDrawings>0?["Salary / Drawings (lifetime)",fmtCompact(venture.salaryDrawings)]:null,
                        ["Total Income Received",fmtCompact(income)],
                        ["Total Return",`${totalReturn>=0?"+":""}${fmtCompact(totalReturn)} (${returnPct>=0?"+":""}${returnPct.toFixed(1)}%)`],
                      ].filter(Boolean).map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                          <span style={{fontSize:12,color:T.muted}}>{k}</span>
                          <span style={{fontSize:12,fontWeight:600,textAlign:"right",color:k==="Total Return"?(totalReturn>=0?T.up:T.down):T.text}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    {(venture.annualRevenue > 0 || venture.annualProfit > 0) && (
                      <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                        <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>🏢 Business Performance (100%)</div>
                        {[
                          ["Annual Revenue",fmtCompact(venture.annualRevenue)],
                          ["Annual Profit",fmtCompact(venture.annualProfit)],
                          venture.annualRevenue>0?["Profit Margin",`${(venture.annualProfit/venture.annualRevenue*100).toFixed(1)}%`]:null,
                          ["Your Share of Profit",fmtCompact(venture.annualProfit * venture.ownershipPct / 100)],
                        ].filter(Boolean).map(([k,v])=>(
                          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                            <span style={{fontSize:12,color:T.muted}}>{k}</span>
                            <span style={{fontSize:12,fontWeight:600,textAlign:"right"}}>{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {venture.notes && (
                      <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                        <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📝 Notes</div>
                        <div style={{padding:"12px 16px",fontSize:13,color:T.muted,lineHeight:1.6}}>{venture.notes}</div>
                      </div>
                    )}
                  </div>
                )}
                {drawerTab === "transactions" && (
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      {(()=>{
                        const caps=txs.filter(t=>t.type==="Capital Contribution"||t.type==="Partner Loan");
                        const ins=txs.filter(t=>["Profit Distribution","Dividend","Salary / Drawings","Loan Repayment"].includes(t.type));
                        const exits=txs.filter(t=>t.type==="Exit / Buyout"||t.type==="Capital Withdrawal");
                        return [
                          {label:"Capital In",value:`S$${caps.reduce((s,t)=>s+(t.amount||0),0).toLocaleString()}`,sub:`${caps.length} contribution${caps.length!==1?"s":""}`,color:T.text},
                          {label:"Income Received",value:`S$${ins.reduce((s,t)=>s+(t.amount||0),0).toLocaleString()}`,sub:`${ins.length} payment${ins.length!==1?"s":""}`,color:T.up},
                          {label:"Capital Out / Exits",value:`S$${exits.reduce((s,t)=>s+(t.amount||0),0).toLocaleString()}`,sub:`${exits.length} exit${exits.length!==1?"s":""}`,color:T.accent},
                        ];
                      })().map(s=>(
                        <div key={s.label} style={{background:T.inputBg,borderRadius:9,padding:"10px 12px"}}>
                          <div style={{fontSize:11,color:T.muted}}>{s.label}</div>
                          <div style={{fontSize:14,fontWeight:700,color:s.color,marginTop:4}}>{s.value}</div>
                          <div style={{fontSize:11,color:T.dim,marginTop:2}}>{s.sub}</div>
                        </div>
                      ))}
                    </div>
                    {venture.status !== "Exited" && venture.status !== "Closed" && (
                      <div style={{display:"flex",justifyContent:"flex-end"}}>
                        <button onClick={()=>setShowTxModal(true)} style={{padding:"7px 16px",borderRadius:7,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>+ Record Transaction</button>
                      </div>
                    )}
                    {txs.length===0?(
                      <div style={{textAlign:"center",padding:"32px 20px",color:T.muted}}><div style={{fontSize:28,marginBottom:8}}>📒</div><div style={{fontSize:13,fontWeight:600}}>No transactions yet</div></div>
                    ):(
                      <div style={{display:"flex",flexDirection:"column",gap:1,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                        {txs.map((tx,i)=>{
                          const isOut = ["Capital Contribution","Partner Loan"].includes(tx.type);
                          const isIncome = ["Profit Distribution","Dividend","Salary / Drawings","Loan Repayment"].includes(tx.type);
                          const icon = {"Capital Contribution":"📤","Profit Distribution":"💰","Dividend":"💰","Salary / Drawings":"💵","Partner Loan":"📤","Loan Repayment":"📥","Capital Withdrawal":"📥","Valuation Update":"📊","Exit / Buyout":"🏁"}[tx.type]||"💰";
                          return (
                            <div key={tx.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",background:i%2===0?T.bg:T.inputBg,borderTop:i>0?`1px solid ${T.border}`:"none"}}>
                              <div style={{width:34,height:34,borderRadius:8,background:isIncome?T.upBg:isOut?T.downBg:T.accentBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{icon}</div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:600}}>{tx.type}{tx.notes?` — ${tx.notes}`:""}</div>
                                <div style={{fontSize:11,color:T.muted,marginTop:1,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                                  <span>{tx.date}</span>
                                  {tx.method&&<span style={{fontSize:10,background:T.inputBg,borderRadius:4,padding:"1px 6px"}}>{tx.method}</span>}
                                  {tx.ref&&<span style={{fontSize:10,color:T.dim,fontFamily:"monospace"}}>{tx.ref}</span>}
                                </div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div style={{fontSize:13,fontWeight:700,color:isIncome?T.up:isOut?T.down:T.text}}>
                                  {isIncome?"+":isOut?"-":""} S${tx.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
                                </div>
                                <div style={{fontSize:10,color:T.dim,marginTop:1}}>{tx.type}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {drawerTab === "postings" && (() => {
                  const sortedTxs = (venture.transactions||[]).filter(t=>t.status==="Complete"&&t.type!=="Valuation Update").slice().sort((a,b)=>a.date.localeCompare(b.date));
                  const journalRows = [];
                  sortedTxs.forEach(tx => {
                    if (tx.type==="Capital Contribution") {
                      journalRows.push(
                        {date:tx.date,desc:`Capital Contribution — ${tx.notes||venture.businessName}`,account:equityAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:cashAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else if (tx.type==="Partner Loan") {
                      journalRows.push(
                        {date:tx.date,desc:`Partner Loan — ${tx.notes||venture.businessName}`,account:loanAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:cashAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else if (tx.type==="Loan Repayment") {
                      journalRows.push(
                        {date:tx.date,desc:`Loan Repayment — ${tx.notes||venture.businessName}`,account:cashAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:loanAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else if (tx.type==="Profit Distribution"||tx.type==="Dividend") {
                      journalRows.push(
                        {date:tx.date,desc:`${tx.type} — ${tx.notes||venture.businessName}`,account:cashAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:incAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else if (tx.type==="Salary / Drawings") {
                      journalRows.push(
                        {date:tx.date,desc:`Salary / Drawings — ${tx.notes||venture.businessName}`,account:cashAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:salaryAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else if (tx.type==="Capital Withdrawal"||tx.type==="Exit / Buyout") {
                      journalRows.push(
                        {date:tx.date,desc:`${tx.type} — ${tx.notes||venture.businessName}`,account:cashAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:equityAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    }
                  });
                  if (isMobile && journalRows.length > 0) return <MobilePostingsList journalRows={journalRows} entryCount={sortedTxs.length} entryLabel="transactions"/>;
                  if (journalRows.length===0) return (
                    <div style={{textAlign:"center",padding:"48px 20px",color:T.muted}}><div style={{fontSize:32,marginBottom:10}}>📒</div><div style={{fontSize:13,fontWeight:600}}>No entries to post yet</div></div>
                  );
                  return (
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",background:T.bg}}>
                      <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:inter}}>Ledger Postings</div>
                        <div style={{fontSize:12,color:T.accent,marginTop:3,fontFamily:inter}}>Double-entry bookkeeping · PTA compliant · {sortedTxs.length} transaction{sortedTxs.length!==1?"s":""}</div>
                      </div>
                      <div style={{overflowX:"auto",overflowY:"auto",maxHeight:460}}>
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
                            {["Date","Account","Description","Debit","Credit"].map((h,hi)=>(
                              <th key={h} style={{padding:"9px 16px",textAlign:hi>=3?"right":"left",width:hi===0||hi>=3?148:undefined,fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,whiteSpace:"nowrap"}}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {journalRows.map((row,ri)=>(
                              <tr key={ri} style={{borderBottom:`1px solid ${T.border}`}}>
                                <td style={{padding:"11px 16px",verticalAlign:"top",width:148}}>
                                  {row._first?(<><div style={{fontSize:13,fontFamily:inter,whiteSpace:"nowrap"}}>{row.date}</div><div style={{fontSize:11,color:T.dim,marginTop:2,fontFamily:inter}}>{daysAgo(row.date)}</div></>):null}
                                </td>
                                <td style={{padding:"11px 16px",verticalAlign:"top"}}><span style={{fontFamily:mono,fontSize:12,color:T.text}}>{row.account}</span></td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",fontSize:12,color:T.muted,fontFamily:inter}}>{row.desc}</td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                                  {row.debit?<span style={{fontSize:13,fontWeight:700,color:T.up,fontFamily:inter}}>{row.amount}</span>:<span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                                </td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                                  {!row.debit?<span style={{fontSize:13,fontWeight:700,color:T.down,fontFamily:inter}}>{row.amount}</span>:<span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{padding:"12px 18px",borderTop:`1px solid ${T.border}`,background:T.sidebar}}>
                        <div style={{fontSize:12,fontWeight:700,marginBottom:6,fontFamily:inter}}>Double-Entry Accounting</div>
                        <div style={{fontSize:11,color:T.muted,lineHeight:1.8,fontFamily:inter}}>
                          <div>• <span style={{color:T.up,fontWeight:600}}>Debit (Dr):</span> Capital Contribution → partnership equity; Partner Loan → loans receivable; Distribution / Salary / Buyout → cash</div>
                          <div>• <span style={{color:T.down,fontWeight:600}}>Credit (Cr):</span> Capital / Loan → reduces cash; Distribution / Dividend → income; Drawings → partner drawings income; Exit → reduces partnership equity</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Transaction modal */}
      {showTxModal && selectedVenture && (() => {
        const venture = ventures.find(v => v.id === selectedVenture.id) || selectedVenture;
        return <BPTxModalInner venture={venture} onSave={(tx) => {
          const newTx = {...tx, id:"BTX"+Date.now(), status:"Complete"};
          setVentures(prev => prev.map(v => {
            if (v.id !== venture.id) return v;
            const nextTxs = [...(v.transactions||[]), newTx];
            let patch = { transactions: nextTxs };
            if (tx.type === "Capital Contribution") patch.capitalContributed = (+v.capitalContributed||0) + (+tx.amount||0);
            else if (tx.type === "Partner Loan") patch.partnerLoans = (+v.partnerLoans||0) + (+tx.amount||0);
            else if (tx.type === "Loan Repayment") patch.partnerLoans = Math.max(0, (+v.partnerLoans||0) - (+tx.amount||0));
            else if (tx.type === "Profit Distribution" || tx.type === "Dividend") patch.distributionsReceived = (+v.distributionsReceived||0) + (+tx.amount||0);
            else if (tx.type === "Salary / Drawings") patch.salaryDrawings = (+v.salaryDrawings||0) + (+tx.amount||0);
            else if (tx.type === "Valuation Update") patch.estimatedMarketValue = +tx.amount;
            else if (tx.type === "Capital Withdrawal") patch.capitalContributed = Math.max(0, (+v.capitalContributed||0) - (+tx.amount||0));
            else if (tx.type === "Exit / Buyout") { patch.status = "Exited"; patch.expiryDate = tx.date; patch.bookValue = 0; patch.estimatedMarketValue = 0; }
            return { ...v, ...patch };
          }));
          setShowTxModal(false);
          showToast(`${tx.type} recorded`, "success");
        }} onClose={()=>setShowTxModal(false)}/>;
      })()}

      {/* Add/Edit modal */}
      {showModal && editVenture && (
        <BPModal venture={editVenture} onSave={handleSave} onClose={()=>{setShowModal(false);setEditVenture(null);}}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COLLECTIBLES MODULE
═══════════════════════════════════════════════════════════════ */

const COL_CATEGORIES = ["Watches","Art","Wine & Spirits","Classic Cars","Jewellery","Luxury Bags","Sneakers & Streetwear","Trading Cards","Coins & Stamps","Memorabilia","Antiques","Other"];

const COL_CATEGORY_CONFIG = {
  "Watches":               { icon:"⌚", color:"#1D4ED8", bg:"#EFF6FF" },
  "Art":                   { icon:"🎨", color:"#9333EA", bg:"#FDF4FF" },
  "Wine & Spirits":        { icon:"🍷", color:"#991B1B", bg:"#FEF2F2" },
  "Classic Cars":          { icon:"🏎️", color:"#D97706", bg:"#FFFBEB" },
  "Jewellery":             { icon:"💎", color:"#EC4899", bg:"#FDF2F8" },
  "Luxury Bags":           { icon:"👜", color:"#7C3AED", bg:"#F5F3FF" },
  "Sneakers & Streetwear": { icon:"👟", color:"#059669", bg:"#F0FDF4" },
  "Trading Cards":         { icon:"🃏", color:"#0891B2", bg:"#ECFEFF" },
  "Coins & Stamps":        { icon:"🪙", color:"#B45309", bg:"#FEF3C7" },
  "Memorabilia":           { icon:"🏆", color:"#CA8A04", bg:"#FEFCE8" },
  "Antiques":              { icon:"🏺", color:"#78716C", bg:"#F5F5F4" },
  "Other":                 { icon:"📦", color:"#6B7280", bg:"#F3F4F6" },
};

const COL_STATUS_OPTS = ["Active","In Consignment","Sold","Lost / Stolen","Damaged"];

const COL_CONDITION_OPTS = ["Mint","Excellent","Very Good","Good","Fair","Poor","N/A"];

const COL_STORAGE_OPTS = ["Home Safe","Home Display","Bank Safe Deposit","Storage Facility","With Dealer","With Consignee","In Transit","Wine Cellar","Other"];

const EMPTY_COL = {
  id:"", category:"Watches", name:"", brand:"", modelRef:"", serialNo:"",
  year:new Date().getFullYear(), condition:"Excellent",
  quantity:1,
  acquisitionDate:"", acquisitionPrice:0, acquisitionSource:"",
  currentValue:0, valuationDate:"", valuerSource:"",
  storageLocation:"Home Safe", specificStorage:"",
  insuredValue:0, insurancePolicyRef:"",
  authenticated:false, certificateRef:"",
  provenance:"",
  currency:"SGD", status:"Active", notes:"",
  transactions:[],
};

const COL_INIT = [
  {
    id:"CL001", category:"Watches", name:"Rolex Submariner Date", brand:"Rolex", modelRef:"126610LN", serialNo:"N2******",
    year:2022, condition:"Excellent", quantity:1,
    acquisitionDate:"2022-08-15", acquisitionPrice:12800, acquisitionSource:"Official AD — The Hour Glass",
    currentValue:16500, valuationDate:"2026-02-01", valuerSource:"Chrono24 market aggregate",
    storageLocation:"Home Safe", specificStorage:"Study room — Burton safe",
    insuredValue:17000, insurancePolicyRef:"INS-VAL-2026",
    authenticated:true, certificateRef:"Rolex warranty card + box",
    provenance:"Single owner, purchased new at AD",
    currency:"SGD", status:"Active",
    notes:"Black dial, stainless steel. Full set (box, papers, tags). Serviced 2025.",
    transactions:[
      {id:"CTX001",date:"2022-08-15",type:"Purchase",amount:12800,method:"Credit Card",ref:"RLX-SUB-AD",status:"Complete",notes:"Official AD purchase — waited 14 months"},
      {id:"CTX002",date:"2024-03-20",type:"Insurance Premium",amount:320,method:"GIRO",ref:"INS-Y24",status:"Complete",notes:"Annual valuables insurance"},
      {id:"CTX003",date:"2025-06-15",type:"Maintenance",amount:780,method:"Credit Card",ref:"RLX-SERVICE-25",status:"Complete",notes:"Full service — Rolex Singapore Service Centre"},
      {id:"CTX004",date:"2026-02-01",type:"Valuation Update",amount:16500,method:"Market Data",ref:"CH24-FEB26",status:"Complete",notes:"Chrono24 + Hour Glass pre-owned quote"},
    ],
  },
  {
    id:"CL002", category:"Luxury Bags", name:"Birkin 30 Togo Noir PHW", brand:"Hermès", modelRef:"Birkin 30", serialNo:"Y-stamp 2023",
    year:2023, condition:"Mint", quantity:1,
    acquisitionDate:"2023-04-10", acquisitionPrice:15200, acquisitionSource:"Hermès Liat Towers boutique",
    currentValue:22000, valuationDate:"2025-12-10", valuerSource:"Collector Square reseller quote",
    storageLocation:"Home Safe", specificStorage:"Walk-in closet — cedar box",
    insuredValue:22000, insurancePolicyRef:"INS-VAL-2026",
    authenticated:true, certificateRef:"Hermès receipt + dust bag + box",
    provenance:"Offered after 3 years of relationship shopping",
    currency:"SGD", status:"Active",
    notes:"Togo leather, palladium hardware. Rarely carried, kept in dust bag.",
    transactions:[
      {id:"CTX005",date:"2023-04-10",type:"Purchase",amount:15200,method:"Credit Card",ref:"HRM-BIR-30",status:"Complete",notes:"Hermès Liat Towers — Birkin 30 offer"},
      {id:"CTX006",date:"2025-12-10",type:"Valuation Update",amount:22000,method:"Market Data",ref:"CS-DEC25",status:"Complete",notes:"Collector Square reseller market"},
    ],
  },
  {
    id:"CL003", category:"Art", name:"\"Quiet Harbor #7\" by Lim Wei Cheng", brand:"Lim Wei Cheng", modelRef:"Oil on canvas, 80x120cm", serialNo:"",
    year:2020, condition:"Excellent", quantity:1,
    acquisitionDate:"2021-05-20", acquisitionPrice:8500, acquisitionSource:"Chan Hampe Galleries",
    currentValue:14000, valuationDate:"2025-09-15", valuerSource:"Gallery estimate",
    storageLocation:"Home Display", specificStorage:"Living room feature wall",
    insuredValue:15000, insurancePolicyRef:"INS-VAL-2026",
    authenticated:true, certificateRef:"Certificate of Authenticity from gallery",
    provenance:"Primary market purchase — artist's solo show 2021",
    currency:"SGD", status:"Active",
    notes:"Artist's prices have risen ~3x since purchase. Featured in 2024 Straits Times article.",
    transactions:[
      {id:"CTX007",date:"2021-05-20",type:"Purchase",amount:8500,method:"Bank Transfer",ref:"CHG-LWC-07",status:"Complete",notes:"Solo show acquisition — 10% gallery discount"},
      {id:"CTX008",date:"2025-09-15",type:"Valuation Update",amount:14000,method:"Gallery Assessment",ref:"CHG-VAL-25",status:"Complete",notes:"Gallery's current primary market range for artist"},
    ],
  },
  {
    id:"CL004", category:"Wine & Spirits", name:"Château Margaux 2015", brand:"Château Margaux", modelRef:"Grand Cru Classé, Margaux", serialNo:"6 bottles (OCB)",
    year:2015, condition:"Mint", quantity:6,
    acquisitionDate:"2020-11-08", acquisitionPrice:4800, acquisitionSource:"Crystal Wines en primeur",
    currentValue:7200, valuationDate:"2025-10-20", valuerSource:"Liv-ex market",
    storageLocation:"Wine Cellar", specificStorage:"Temperature-controlled cellar — The Wine Company storage",
    insuredValue:8000, insurancePolicyRef:"INS-VAL-2026",
    authenticated:true, certificateRef:"OCB provenance from Crystal Wines",
    provenance:"En primeur via Crystal Wines, stored continuously",
    currency:"SGD", status:"Active",
    notes:"6 bottles, OCB (original case). 95+ pts Parker. Hold until 2030+ for drinking window.",
    transactions:[
      {id:"CTX009",date:"2020-11-08",type:"Purchase",amount:4800,method:"Bank Transfer",ref:"CW-MAR15-6",status:"Complete",notes:"En primeur 6-bottle case"},
      {id:"CTX010",date:"2022-01-15",type:"Storage Cost",amount:180,method:"GIRO",ref:"TWC-STOR-22",status:"Complete",notes:"Annual cellar storage fee"},
      {id:"CTX011",date:"2023-01-15",type:"Storage Cost",amount:180,method:"GIRO",ref:"TWC-STOR-23",status:"Complete",notes:"Annual cellar storage fee"},
      {id:"CTX012",date:"2024-01-15",type:"Storage Cost",amount:200,method:"GIRO",ref:"TWC-STOR-24",status:"Complete",notes:"Annual cellar storage fee"},
      {id:"CTX013",date:"2025-01-15",type:"Storage Cost",amount:200,method:"GIRO",ref:"TWC-STOR-25",status:"Complete",notes:"Annual cellar storage fee"},
      {id:"CTX014",date:"2025-10-20",type:"Valuation Update",amount:7200,method:"Market Data",ref:"LIVEX-OCT25",status:"Complete",notes:"Liv-ex Fine Wine 100 index tracking"},
    ],
  },
  {
    id:"CL005", category:"Classic Cars", name:"Porsche 911T Coupé", brand:"Porsche", modelRef:"911T (2.2L)", serialNo:"911xxxxxx",
    year:1971, condition:"Very Good", quantity:1,
    acquisitionDate:"2022-11-30", acquisitionPrice:158000, acquisitionSource:"Private sale — UK import",
    currentValue:185000, valuationDate:"2025-11-15", valuerSource:"Classic Car Auctions Singapore",
    storageLocation:"Storage Facility", specificStorage:"Autobahn Garage, Loyang — climate-controlled",
    insuredValue:200000, insurancePolicyRef:"INS-CLASSIC-2026",
    authenticated:true, certificateRef:"Porsche Certificate of Authenticity + UK V5C",
    provenance:"UK barn find 2018, restored 2019-2021, imported to SG 2022",
    currency:"SGD", status:"Active",
    notes:"Matching numbers. Gemini Blue over black leather. COE extended to 2032 via classic scheme. Concours-level interior.",
    transactions:[
      {id:"CTX015",date:"2022-11-30",type:"Purchase",amount:158000,method:"Bank Transfer",ref:"911T-IMPORT",status:"Complete",notes:"Private import from UK — shipping and duties included"},
      {id:"CTX016",date:"2023-03-20",type:"Maintenance",amount:4200,method:"Credit Card",ref:"911-SERV-23",status:"Complete",notes:"Post-import full service and roadworthy check"},
      {id:"CTX017",date:"2024-06-10",type:"Maintenance",amount:2800,method:"Credit Card",ref:"911-SERV-24",status:"Complete",notes:"Annual service + carb tune"},
      {id:"CTX018",date:"2025-01-15",type:"Insurance Premium",amount:1850,method:"GIRO",ref:"CLS-INS-25",status:"Complete",notes:"Annual classic car insurance"},
      {id:"CTX019",date:"2025-07-20",type:"Storage Cost",amount:1440,method:"GIRO",ref:"AGB-STOR-25",status:"Complete",notes:"Annual storage — Autobahn Garage"},
      {id:"CTX020",date:"2025-11-15",type:"Valuation Update",amount:185000,method:"Auction Estimate",ref:"CCA-NOV25",status:"Complete",notes:"Pre-sale estimate from Classic Car Auctions SG"},
    ],
  },
  {
    id:"CL006", category:"Trading Cards", name:"Charizard Base Set Unlimited (PSA 10)", brand:"Pokémon (WOTC)", modelRef:"1999 Base Set #4/102", serialNo:"PSA cert 12345678",
    year:1999, condition:"Mint", quantity:1,
    acquisitionDate:"2024-01-20", acquisitionPrice:5200, acquisitionSource:"PWCC auction",
    currentValue:4800, valuationDate:"2025-12-01", valuerSource:"PSA Auction Prices Realized",
    storageLocation:"Bank Safe Deposit", specificStorage:"OCBC safe deposit box",
    insuredValue:6000, insurancePolicyRef:"INS-VAL-2026",
    authenticated:true, certificateRef:"PSA 10 Gem Mint graded",
    provenance:"PWCC Weekly Auction #142 - January 2024",
    currency:"SGD", status:"Active",
    notes:"Unlimited print (non-shadowless). Market has softened ~8% from 2024 peak. Hold long-term.",
    transactions:[
      {id:"CTX021",date:"2024-01-20",type:"Purchase",amount:5200,method:"Bank Transfer",ref:"PWCC-WK142",status:"Complete",notes:"PWCC winning bid + buyer's premium + shipping/tax"},
      {id:"CTX022",date:"2025-12-01",type:"Valuation Update",amount:4800,method:"Market Data",ref:"PSA-APR-NOV25",status:"Complete",notes:"PSA 10 6-month average selling price"},
    ],
  },
  {
    id:"CL007", category:"Watches", name:"Royal Oak 41 Stainless", brand:"Audemars Piguet", modelRef:"15500ST.OO.1220ST.01", serialNo:"H-series",
    year:2021, condition:"Excellent", quantity:1,
    acquisitionDate:"2023-02-14", acquisitionPrice:42000, acquisitionSource:"Pre-owned — Watch Century",
    currentValue:46500, valuationDate:"2026-01-20", valuerSource:"Consignee mid-quote",
    storageLocation:"With Consignee", specificStorage:"Watch Century consignment",
    insuredValue:48000, insurancePolicyRef:"INS-VAL-2026",
    authenticated:true, certificateRef:"AP warranty card (2021) + extract from archives",
    provenance:"2nd owner, full set",
    currency:"SGD", status:"In Consignment",
    notes:"Blue dial. Consigned at Watch Century since Dec 2025 — asking $49K, expected net ~$46-47K after 8% commission.",
    transactions:[
      {id:"CTX023",date:"2023-02-14",type:"Purchase",amount:42000,method:"Bank Transfer",ref:"AP-RO-15500",status:"Complete",notes:"Pre-owned purchase from dealer"},
      {id:"CTX024",date:"2024-07-10",type:"Maintenance",amount:1100,method:"Credit Card",ref:"AP-SERV-24",status:"Complete",notes:"Pressure test + polish (AP Service Centre)"},
      {id:"CTX025",date:"2025-12-05",type:"Consignment Fee",amount:0,method:"Netting",ref:"WC-CONSIGN-01",status:"Complete",notes:"Consigned — fee 8% of sale price, deducted on sale"},
      {id:"CTX026",date:"2026-01-20",type:"Valuation Update",amount:46500,method:"Consignee Quote",ref:"WC-QTE-JAN26",status:"Complete",notes:"Expected net after consignment commission"},
    ],
  },
  {
    id:"CL008", category:"Jewellery", name:"Tiffany Solitaire Diamond Ring", brand:"Tiffany & Co.", modelRef:"The Tiffany Setting 1.5ct", serialNo:"GIA 2345678901",
    year:2024, condition:"Mint", quantity:1,
    acquisitionDate:"2024-11-22", acquisitionPrice:28500, acquisitionSource:"Tiffany ION Orchard",
    currentValue:28500, valuationDate:"2024-11-22", valuerSource:"Retail (at purchase)",
    storageLocation:"Home Safe", specificStorage:"Jewellery drawer — Stockinger safe",
    insuredValue:32000, insurancePolicyRef:"INS-VAL-2026",
    authenticated:true, certificateRef:"Tiffany certificate + GIA report (G, VS1, Ex/Ex/Ex)",
    provenance:"New from Tiffany flagship",
    currency:"SGD", status:"Active",
    notes:"Anniversary gift. Not for resale consideration — sentimental.",
    transactions:[
      {id:"CTX027",date:"2024-11-22",type:"Purchase",amount:28500,method:"Credit Card",ref:"TIF-SOL-15",status:"Complete",notes:"Tiffany ION — 10th anniversary"},
    ],
  },
];

// ── Collectible Transaction Modal ─────────────────────────────
function ColTxModalInner({ item, onSave, onClose }) {
  const txTypes = ["Purchase","Sale","Valuation Update","Appraisal Fee","Insurance Premium","Maintenance","Storage Cost","Consignment Fee","Restoration"];
  const txTypeIcon = {"Purchase":"📥","Sale":"📤","Valuation Update":"📊","Appraisal Fee":"🔍","Insurance Premium":"🛡","Maintenance":"🔧","Storage Cost":"📦","Consignment Fee":"🤝","Restoration":"🎨"};

  const [f, setF] = useState({
    type: "Valuation Update",
    date: new Date().toISOString().slice(0,10),
    amount: 0, method: "Credit Card", ref: "", notes: "",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const isOut = ["Purchase","Appraisal Fee","Insurance Premium","Maintenance","Storage Cost","Consignment Fee","Restoration"].includes(f.type);
  const isIn = f.type === "Sale";
  const isValOnly = f.type === "Valuation Update";

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:16,width:480,maxHeight:"85vh",overflow:"auto",padding:"28px 28px 20px",border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:6}}>Record Transaction</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:20}}>{item.name} · {item.category}</div>
        <div style={{marginBottom:14}}>
          <Label required>Transaction Type</Label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {txTypes.map(t=>(
              <button key={t} onClick={()=>set("type",t)}
                style={{flex:"1 1 140px",padding:"10px 14px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:f.type===t?700:400,
                  border:`1px solid ${f.type===t?T.selected:T.border}`,background:f.type===t?T.selected:T.bg,color:f.type===t?T.selectedText:T.muted}}>
                {txTypeIcon[t]||"💰"} {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label required>Date</Label><Input type="date" value={f.date} onChange={e=>set("date",e.target.value)}/></div>
          <div><Label required>{isValOnly?"New Market Value":"Amount"}</Label><Input type="number" prefix="S$" value={f.amount} onChange={e=>set("amount",+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Method</Label><Sel value={f.method} onChange={e=>set("method",e.target.value)} options={["Credit Card","Bank Transfer","GIRO","Cash","Cheque","Market Data","Auction Estimate","Netting"]}/></div>
          <div><Label>Reference</Label><Input value={f.ref} onChange={e=>set("ref",e.target.value)} placeholder="e.g. RLX-SERV-25"/></div>
        </div>
        <div style={{marginBottom:14}}>
          <Label>Notes</Label>
          <textarea value={f.notes} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="e.g. Annual service, consignment listing, revaluation…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none",resize:"vertical"}}/>
        </div>
        <div style={{background:isValOnly?T.accentBg:isOut?T.downBg:T.upBg,borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:isValOnly?T.accent:isOut?T.down:T.up,fontWeight:600}}>
            {isValOnly?"📊 Market value updated":isIn?"📥 Proceeds from sale":"📤 Expense / acquisition cost"}
          </span>
          <span style={{fontWeight:700,color:isValOnly?T.accent:isOut?T.down:T.up}}>{isValOnly?"":(isOut?"-":"+")} S${(f.amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Cancel</button>
          <button onClick={()=>onSave(f)} disabled={!f.date||f.amount<=0}
            style={{padding:"9px 20px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,opacity:(!f.date||f.amount<=0)?0.4:1}}>
            Record {f.type}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Collectible Add/Edit Modal ────────────────────────────────
function ColModal({ item, onSave, onClose }) {
  const [f, setF] = useState({ ...item });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:16,width:580,maxHeight:"85vh",overflow:"auto",padding:"28px 28px 20px",border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:20}}>{f.id ? "Edit Item" : "Add Collectible"}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:14,marginBottom:14}}>
          <div><Label required>Category</Label><Sel value={f.category} onChange={e=>set("category",e.target.value)} options={COL_CATEGORIES}/></div>
          <div><Label required>Item Name</Label><Input value={f.name} onChange={e=>set("name",e.target.value)} placeholder='e.g. Rolex Submariner, "Harbour #3" by X'/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Brand / Maker / Artist</Label><Input value={f.brand} onChange={e=>set("brand",e.target.value)}/></div>
          <div><Label>Model / Ref / Medium</Label><Input value={f.modelRef} onChange={e=>set("modelRef",e.target.value)}/></div>
          <div><Label>Serial / Edition No.</Label><Input value={f.serialNo} onChange={e=>set("serialNo",e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Year</Label><Input type="number" value={f.year} onChange={e=>set("year",+e.target.value)}/></div>
          <div><Label>Condition</Label><Sel value={f.condition} onChange={e=>set("condition",e.target.value)} options={COL_CONDITION_OPTS}/></div>
          <div><Label>Quantity</Label><Input type="number" value={f.quantity} onChange={e=>set("quantity",+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Acquisition Date</Label><Input type="date" value={f.acquisitionDate} onChange={e=>set("acquisitionDate",e.target.value)}/></div>
          <div><Label required>Acquisition Price</Label><Input type="number" prefix="S$" value={f.acquisitionPrice} onChange={e=>set("acquisitionPrice",+e.target.value)}/></div>
          <div><Label>Source</Label><Input value={f.acquisitionSource} onChange={e=>set("acquisitionSource",e.target.value)} placeholder="Dealer, auction, AD…"/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Current Value</Label><Input type="number" prefix="S$" value={f.currentValue} onChange={e=>set("currentValue",+e.target.value)}/></div>
          <div><Label>Valuation Date</Label><Input type="date" value={f.valuationDate} onChange={e=>set("valuationDate",e.target.value)}/></div>
          <div><Label>Valuer / Source</Label><Input value={f.valuerSource} onChange={e=>set("valuerSource",e.target.value)} placeholder="e.g. Chrono24, gallery"/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:14,marginBottom:14}}>
          <div><Label>Storage Location</Label><Sel value={f.storageLocation} onChange={e=>set("storageLocation",e.target.value)} options={COL_STORAGE_OPTS}/></div>
          <div><Label>Specific Storage</Label><Input value={f.specificStorage} onChange={e=>set("specificStorage",e.target.value)} placeholder="e.g. Study room safe, OCBC box #xxxx"/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Insured Value</Label><Input type="number" prefix="S$" value={f.insuredValue} onChange={e=>set("insuredValue",+e.target.value)}/></div>
          <div><Label>Insurance Policy Ref</Label><Input value={f.insurancePolicyRef} onChange={e=>set("insurancePolicyRef",e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:14,marginBottom:14,alignItems:"center"}}>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13}}>
            <input type="checkbox" checked={!!f.authenticated} onChange={e=>set("authenticated",e.target.checked)}/> Authenticated
          </label>
          <Input value={f.certificateRef} onChange={e=>set("certificateRef",e.target.value)} placeholder="Certificate / papers reference"/>
        </div>
        <div style={{marginBottom:14}}>
          <Label>Provenance</Label>
          <Input value={f.provenance} onChange={e=>set("provenance",e.target.value)} placeholder="Ownership history, acquisition lineage…"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><Label>Currency</Label><Sel value={f.currency} onChange={e=>set("currency",e.target.value)} options={["SGD","USD","EUR","GBP","HKD","JPY"]}/></div>
          <div><Label>Status</Label><Sel value={f.status} onChange={e=>set("status",e.target.value)} options={COL_STATUS_OPTS}/></div>
        </div>
        <div style={{marginBottom:20}}>
          <Label>Notes</Label>
          <textarea value={f.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="Additional notes, stories, sentimental value…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none",resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Cancel</button>
          <button onClick={()=>onSave(f)} disabled={!f.name||!f.category}
            style={{padding:"9px 20px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,opacity:(!f.name||!f.category)?0.4:1}}>
            {f.id ? "Save Changes" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Collectibles Screen ───────────────────────────────────────
function CollectiblesScreen({ items, setItems, showToast }) {
  const isMobile = useIsMobile();
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [drawerTab, setDrawerTab] = useState("overview");
  const [showTxModal, setShowTxModal] = useState(false);
  const colSort = useSortState();

  const activeItems = items.filter(i => i.status === "Active" || i.status === "In Consignment");
  const totalMarketValue = activeItems.reduce((s,i) => s + (i.currentValue||0), 0);
  const totalCost = activeItems.reduce((s,i) => s + (i.acquisitionPrice||0), 0);
  const totalUnrealised = totalMarketValue - totalCost;
  const totalInsured = activeItems.reduce((s,i) => s + (i.insuredValue||0), 0);
  const insuranceCoverage = totalMarketValue > 0 ? (totalInsured / totalMarketValue * 100) : 0;
  const underInsured = activeItems.filter(i => (i.insuredValue||0) < (i.currentValue||0));

  // Category breakdown
  const categoryBreakdown = {};
  activeItems.forEach(i => { categoryBreakdown[i.category] = (categoryBreakdown[i.category]||0) + (i.currentValue||0); });

  const filtered = items.filter(i => {
    if (filterCategory !== "All" && i.category !== filterCategory) return false;
    if (filterStatus !== "All" && i.status !== filterStatus) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!(i.name||"").toLowerCase().includes(q) && !(i.brand||"").toLowerCase().includes(q) && !(i.modelRef||"").toLowerCase().includes(q) && !(i.category||"").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleSave = (f) => {
    if (f.id) {
      setItems(prev => prev.map(i => i.id === f.id ? { ...i, ...f } : i));
      showToast("Item updated", "success");
    } else {
      setItems(prev => [...prev, { ...f, id:"CL"+Date.now(), transactions:[] }]);
      showToast("Item added", "success");
    }
    setShowModal(false);
    setEditItem(null);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {/* Page header */}
      <div className="wo-page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:700}}>Collectibles Portfolio</div>
          <div style={{fontSize:13,color:T.muted,marginTop:2}}>{activeItems.length} item{activeItems.length!==1?"s":""} · {items.length} total</div>
        </div>
        <button onClick={()=>{setEditItem({...EMPTY_COL,id:""});setShowModal(true);}}
          style={{background:T.selected,color:T.selectedText,border:"none",borderRadius:9,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
          + Add Item
        </button>
      </div>

      {/* Summary cards */}
      <div className="wo-summary-grid" style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12,marginBottom:18}}>
        {[
          {label:"Total Market Value",value:fmtCompact(totalMarketValue),sub:`Cost: ${fmtCompact(totalCost)}`,icon:"💎",color:T.text},
          {label:"Unrealised P&L",value:(totalUnrealised>=0?"+":"")+fmtCompact(totalUnrealised),sub:`${totalCost>0?((totalUnrealised/totalCost)*100).toFixed(1):0}% return`,icon:"📈",color:totalUnrealised>=0?T.up:T.down},
          {label:"Insurance Coverage",value:`${insuranceCoverage.toFixed(0)}%`,sub:`${fmtCompact(totalInsured)} insured`,icon:"🛡",color:insuranceCoverage>=100?T.up:T.warn},
          {label:"Items Tracked",value:String(activeItems.length),sub:`Across ${Object.keys(categoryBreakdown).length} categor${Object.keys(categoryBreakdown).length!==1?"ies":"y"}`,icon:"📦",color:T.accent},
        ].map((c,i)=>(
          <Card key={i} style={{padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{fontSize:12,color:T.muted,fontWeight:500}}>{c.label}</div>
              <span style={{fontSize:20}}>{c.icon}</span>
            </div>
            <div style={{fontSize:22,fontWeight:700,marginTop:8,color:c.color}}>{c.value}</div>
            <div style={{fontSize:11,color:T.dim,marginTop:4}}>{c.sub}</div>
          </Card>
        ))}
      </div>

      {/* Breakdown bar */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <Card style={{padding:"16px 20px",marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Value by Category</div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
            {Object.entries(categoryBreakdown).sort(([,a],[,b])=>b-a).map(([cat, val])=>{
              const pct = totalMarketValue > 0 ? (val/totalMarketValue*100).toFixed(0) : 0;
              const tc = COL_CATEGORY_CONFIG[cat] || {icon:"📦",color:T.muted,bg:T.inputBg};
              return (
                <div key={cat} style={{flex:"1 1 140px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:12,color:T.muted,fontWeight:500}}>{tc.icon} {cat}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{pct}%</span>
                  </div>
                  <div style={{height:6,background:T.inputBg,borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:tc.color,borderRadius:3}}/>
                  </div>
                  <div style={{fontSize:11,color:T.dim,marginTop:4}}>{fmtCompact(val)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Underinsured alert */}
      {underInsured.length > 0 && (
        <Card style={{padding:"12px 16px",marginBottom:14,background:T.warnBg,border:`1px solid ${T.warn}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>⚠️</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:T.warn}}>{underInsured.length} item{underInsured.length!==1?"s":""} under-insured</div>
              <div style={{fontSize:11,color:T.muted,marginTop:1}}>Current market value exceeds insured value on {underInsured.map(u=>u.name).slice(0,3).join(", ")}{underInsured.length>3?` and ${underInsured.length-3} more`:""} — review your valuables policy</div>
            </div>
          </div>
        </Card>
      )}

      {/* Filter toolbar */}
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:"1 1 200px"}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.dim,pointerEvents:"none"}}>🔍</span>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search name, brand, reference, category…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px 8px 34px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["All",...COL_STATUS_OPTS].map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)}
              style={{background:filterStatus===s?T.selected:T.inputBg,color:filterStatus===s?T.selectedText:T.muted,border:`1px solid ${filterStatus===s?T.selected:T.border}`,borderRadius:7,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:filterStatus===s?600:400}}>
              {s}
            </button>
          ))}
        </div>
        <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}
          style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 12px",fontSize:12,fontFamily:"inherit",color:T.text,cursor:"pointer",outline:"none"}}>
          {["All",...COL_CATEGORIES].map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{fontSize:12,color:T.muted,marginLeft:"auto"}}>{filtered.length} of {items.length}</span>
      </div>

      {/* Table / Mobile cards */}
      {filtered.length === 0 ? (
        <Card style={{padding:"48px 24px",textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>💎</div>
          <div style={{fontSize:14,fontWeight:600}}>No items found</div>
          <div style={{fontSize:12,color:T.muted,marginTop:4}}>Try adjusting filters or add a new item</div>
        </Card>
      ) : isMobile ? (
        <Card style={{padding:0,overflow:"hidden"}}>
          {filtered.map(it => {
            const tc = COL_CATEGORY_CONFIG[it.category] || {icon:"📦",color:T.muted,bg:T.inputBg};
            const pnl = (it.currentValue||0) - (it.acquisitionPrice||0);
            return <MobileListItem key={it.id} onClick={()=>{setSelectedItem(it);setDrawerTab("overview");}}
              icon={tc.icon} iconBg={tc.bg} title={it.name} subtitle={`${it.brand||it.category}${it.year?` · ${it.year}`:""}${it.quantity>1?` · ${it.quantity} pcs`:""}`}
              value={fmtCompact(it.currentValue)} valueColor={T.text} valueSub={`Cost: ${fmtCompact(it.acquisitionPrice)}`}
              badge={it.status} badgeBg={it.status==="Active"?T.upBg:it.status==="In Consignment"?T.accentBg:T.inputBg} badgeColor={it.status==="Active"?T.up:it.status==="In Consignment"?T.accent:T.muted}
              extra={pnl !== 0 ? <span style={{fontSize:11,fontWeight:600,color:pnl>=0?T.up:T.down}}>{pnl>=0?"+":""}{fmtCompact(pnl)}</span> : null}
            />;
          })}
        </Card>
      ) : (
        <Card style={{padding:0,overflowX:"auto"}} className="wo-table-scroll">
          <SortHeader gridCols="2.4fr 1fr 1fr 1.1fr 1fr 1fr 0.9fr" sortKey={colSort.sortKey} sortDir={colSort.sortDir} onSort={colSort.onSort}
            columns={[["Item / Brand","left","name"],["Category","left","category"],["Condition","left","condition"],["Cost / Value","right","value"],["P&L","right","pnl"],["Storage","left","storage",{paddingLeft:20}],["Status","left","status"]]}/>
          {colSort.sortFn(filtered, (it, k) => {
            if (k==="name") return (it.name||"").toLowerCase();
            if (k==="category") return (it.category||"").toLowerCase();
            if (k==="condition") return (it.condition||"").toLowerCase();
            if (k==="value") return it.currentValue||0;
            if (k==="pnl") return (it.currentValue||0) - (it.acquisitionPrice||0);
            if (k==="storage") return (it.storageLocation||"").toLowerCase();
            if (k==="status") return it.status;
            return 0;
          }).map((it, idx) => {
            const tc = COL_CATEGORY_CONFIG[it.category] || {icon:"📦",color:T.muted,bg:T.inputBg};
            const pnl = (it.currentValue||0) - (it.acquisitionPrice||0);
            const pnlPct = it.acquisitionPrice > 0 ? (pnl/it.acquisitionPrice*100) : 0;
            const isDim = it.status === "Sold" || it.status === "Lost / Stolen" || it.status === "Damaged";
            const underIns = (it.insuredValue||0) < (it.currentValue||0);
            return (
              <div key={it.id} onClick={()=>{setSelectedItem(it);setDrawerTab("overview");}}
                style={{display:"grid",gridTemplateColumns:"2.4fr 1fr 1fr 1.1fr 1fr 1fr 0.9fr",padding:"13px 20px",borderBottom:idx<filtered.length-1?`1px solid ${T.border}`:"none",alignItems:"center",cursor:"pointer",
                  opacity:isDim?0.55:1,background:isDim?T.sidebar:""}}
                onMouseEnter={e=>e.currentTarget.style.background=T.hover}
                onMouseLeave={e=>e.currentTarget.style.background=(isDim?T.sidebar:"")}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{width:34,height:34,borderRadius:9,background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{tc.icon}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,display:"flex",gap:6,alignItems:"center"}}>
                      {it.name}
                      {underIns && it.status === "Active" && <span title="Under-insured" style={{fontSize:11,color:T.warn}}>⚠</span>}
                      {it.authenticated && <span title="Authenticated" style={{fontSize:11,color:T.up}}>✓</span>}
                    </div>
                    <div style={{fontSize:11,color:T.muted,marginTop:1}}>{it.brand||"—"}{it.modelRef?` · ${it.modelRef}`:""}{it.year?` · ${it.year}`:""}{it.quantity>1?` · ${it.quantity} pcs`:""}</div>
                  </div>
                </div>
                <div style={{fontSize:12,color:T.muted}}>{it.category}</div>
                <div style={{fontSize:12,color:T.muted}}>{it.condition}</div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,fontWeight:700}}>{fmtCompact(it.currentValue)}</div>
                  <div style={{fontSize:10,color:T.dim,marginTop:1}}>Cost: {fmtCompact(it.acquisitionPrice)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,fontWeight:600,color:pnl>=0?T.up:T.down}}>{pnl>=0?"+":""}{fmtCompact(pnl)}</div>
                  <div style={{fontSize:10,color:pnl>=0?T.up:T.down,marginTop:1}}>{pnl>=0?"+":""}{pnlPct.toFixed(1)}%</div>
                </div>
                <div style={{fontSize:12,color:T.muted,paddingLeft:20}}>{it.storageLocation}</div>
                <div>
                  <Badge bg={it.status==="Active"?T.upBg:it.status==="In Consignment"?T.accentBg:it.status==="Sold"?T.inputBg:T.downBg}
                    color={it.status==="Active"?T.up:it.status==="In Consignment"?T.accent:it.status==="Sold"?T.muted:T.down}>
                    {it.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ══ ITEM DETAIL DRAWER ══ */}
      {selectedItem && (() => {
        const item = items.find(i => i.id === selectedItem.id) || selectedItem;
        const tc = COL_CATEGORY_CONFIG[item.category] || {icon:"📦",color:T.muted,bg:T.inputBg};
        const txs = (item.transactions || []).slice().sort((a,b)=>b.date.localeCompare(a.date));
        const pnl = (item.currentValue||0) - (item.acquisitionPrice||0);
        const pnlPct = item.acquisitionPrice > 0 ? (pnl/item.acquisitionPrice*100) : 0;
        const holdingYears = item.acquisitionDate ? ((Date.now() - new Date(item.acquisitionDate))/31557600000).toFixed(1) : null;
        const totalCostsIncurred = (item.transactions||[]).filter(t=>["Maintenance","Insurance Premium","Storage Cost","Appraisal Fee","Restoration","Consignment Fee"].includes(t.type)).reduce((s,t)=>s+(t.amount||0),0);
        const underIns = (item.insuredValue||0) < (item.currentValue||0);
        const inter = "'Inter','Segoe UI',system-ui,sans-serif";
        const mono  = "'Courier New',Courier,monospace";
        const fmtA  = (v) => "S$" + Math.abs(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
        const cashAcct = "Assets:Bank:Cash";
        const itemAcct = `Assets:Collectibles:${item.category.replace(/[ &/]/g,"")}:${(item.name||"").replace(/[ /"]/g,"").slice(0,24)}`;
        const incAcct = "Income:Collectibles:RealisedGain";
        const feeAcct = (type) => `Expense:Collectibles:${type.replace(/ /g,"")}`;
        const daysAgo = (d) => { if (!d) return ""; const diff = Math.floor((Date.now() - new Date(d)) / 86400000); return diff === 0 ? "Today" : diff === 1 ? "1 day ago" : diff + " days ago"; };

        return (
          <div className="wo-drawer-overlay" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}
            onClick={e=>{if(e.target===e.currentTarget) setSelectedItem(null);}}>
            <div style={{width:"min(960px, 95vw)",height:"100vh",background:T.bg,overflow:"hidden",boxShadow:"-4px 0 32px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column"}}>
              {/* Header */}
              <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,flexShrink:0}}>
                <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
                  <div style={{width:44,height:44,borderRadius:12,background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{tc.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:16,fontWeight:700,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      {item.name}
                      {item.authenticated && <span style={{fontSize:10,background:T.upBg,color:T.up,borderRadius:4,padding:"1px 6px",fontWeight:700}}>✓ AUTHENTICATED</span>}
                    </div>
                    <div style={{fontSize:12,color:T.muted,marginTop:2}}>{item.brand||item.category}{item.modelRef?` · ${item.modelRef}`:""}{item.year?` · ${item.year}`:""}</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <Badge bg={item.status==="Active"?T.upBg:item.status==="In Consignment"?T.accentBg:T.inputBg} color={item.status==="Active"?T.up:item.status==="In Consignment"?T.accent:T.muted}>{item.status}</Badge>
                    <button onClick={()=>{setEditItem(item);setShowModal(true);}} style={{background:T.inputBg,border:"none",borderRadius:7,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",color:T.text}}>Edit</button>
                    <button onClick={()=>setSelectedItem(null)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16,color:T.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:10,marginBottom:14}}>
                  {[
                    {l:"Market Value",v:fmtCompact(item.currentValue)},
                    {l:"Cost Basis",v:fmtCompact(item.acquisitionPrice)},
                    {l:"Unrealised P&L",v:`${pnl>=0?"+":""}${fmtCompact(pnl)} (${pnl>=0?"+":""}${pnlPct.toFixed(0)}%)`},
                    {l:"Held for",v:holdingYears?`${holdingYears} yr${holdingYears!=="1.0"?"s":""}`:"—"},
                  ].map(s=>(
                    <div key={s.l} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px"}}>
                      <div style={{fontSize:11,color:T.muted}}>{s.l}</div>
                      <div style={{fontSize:14,fontWeight:700,marginTop:4}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:4}}>
                  {[{id:"overview",label:"Overview"},{id:"transactions",label:`Transactions${txs.length>0?" ("+txs.length+")":""}`},{id:"postings",label:"Postings"}].map(dt=>(
                    <button key={dt.id} onClick={()=>setDrawerTab(dt.id)}
                      style={{padding:"6px 14px",borderRadius:8,border:"none",background:drawerTab===dt.id?T.selected:T.inputBg,
                        color:drawerTab===dt.id?T.selectedText:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:drawerTab===dt.id?700:400}}>
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Body */}
              <div style={{flex:1,padding:"20px 24px",overflowY:"auto",minHeight:0}}>
                {drawerTab === "overview" && (
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    {underIns && item.status === "Active" && (
                      <Card style={{padding:"10px 14px",background:T.warnBg,border:`1px solid ${T.warn}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:16}}>⚠️</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:600,color:T.warn}}>Under-insured by {fmtCompact((item.currentValue||0) - (item.insuredValue||0))}</div>
                            <div style={{fontSize:11,color:T.muted,marginTop:1}}>Insured at {fmtCompact(item.insuredValue)} vs current value {fmtCompact(item.currentValue)} — request a valuables policy top-up</div>
                          </div>
                        </div>
                      </Card>
                    )}
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📋 Item Details</div>
                      {[
                        ["Category",item.category],
                        item.brand?["Brand / Maker",item.brand]:null,
                        item.modelRef?["Model / Reference",item.modelRef]:null,
                        item.serialNo?["Serial / Edition",item.serialNo]:null,
                        item.year?["Year",String(item.year)]:null,
                        ["Condition",item.condition],
                        item.quantity>1?["Quantity",`${item.quantity} pieces`]:null,
                        ["Authenticated",item.authenticated?"Yes":"No"],
                        item.certificateRef?["Certificate / Papers",item.certificateRef]:null,
                        item.provenance?["Provenance",item.provenance]:null,
                      ].filter(Boolean).map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                          <span style={{fontSize:12,color:T.muted,flexShrink:0}}>{k}</span>
                          <span style={{fontSize:12,fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>💰 Acquisition & Valuation</div>
                      {[
                        item.acquisitionDate?["Acquisition Date",item.acquisitionDate]:null,
                        ["Acquisition Price",fmtCompact(item.acquisitionPrice)],
                        item.acquisitionSource?["Source",item.acquisitionSource]:null,
                        ["Current Market Value",fmtCompact(item.currentValue)],
                        ["Unrealised P&L",`${pnl>=0?"+":""}${fmtCompact(pnl)} (${pnl>=0?"+":""}${pnlPct.toFixed(1)}%)`],
                        item.valuationDate?["Last Valued",item.valuationDate]:null,
                        item.valuerSource?["Valuation Source",item.valuerSource]:null,
                        totalCostsIncurred>0?["Holding Costs (lifetime)",fmtCompact(totalCostsIncurred)]:null,
                      ].filter(Boolean).map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                          <span style={{fontSize:12,color:T.muted}}>{k}</span>
                          <span style={{fontSize:12,fontWeight:600,textAlign:"right",color:k==="Unrealised P&L"?(pnl>=0?T.up:T.down):T.text}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>🛡 Storage & Insurance</div>
                      {[
                        ["Storage Location",item.storageLocation],
                        item.specificStorage?["Specific Storage",item.specificStorage]:null,
                        ["Insured Value",fmtCompact(item.insuredValue)],
                        item.insurancePolicyRef?["Policy Reference",item.insurancePolicyRef]:null,
                        ["Coverage vs Value",`${item.currentValue>0?((item.insuredValue/item.currentValue)*100).toFixed(0):0}%`],
                      ].filter(Boolean).map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                          <span style={{fontSize:12,color:T.muted}}>{k}</span>
                          <span style={{fontSize:12,fontWeight:600,textAlign:"right",color:k==="Coverage vs Value"?(item.insuredValue>=item.currentValue?T.up:T.warn):T.text}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    {item.notes && (
                      <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                        <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📝 Notes</div>
                        <div style={{padding:"12px 16px",fontSize:13,color:T.muted,lineHeight:1.6}}>{item.notes}</div>
                      </div>
                    )}
                  </div>
                )}
                {drawerTab === "transactions" && (
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      {(()=>{
                        const acquired = txs.filter(t=>t.type==="Purchase");
                        const costs = txs.filter(t=>["Maintenance","Insurance Premium","Storage Cost","Appraisal Fee","Restoration","Consignment Fee"].includes(t.type));
                        const sales = txs.filter(t=>t.type==="Sale");
                        return [
                          {label:"Acquisition Cost",value:`S$${acquired.reduce((s,t)=>s+(t.amount||0),0).toLocaleString()}`,sub:`${acquired.length} purchase${acquired.length!==1?"s":""}`,color:T.text},
                          {label:"Holding Costs",value:`S$${costs.reduce((s,t)=>s+(t.amount||0),0).toLocaleString()}`,sub:`${costs.length} expense${costs.length!==1?"s":""}`,color:T.down},
                          {label:"Sale Proceeds",value:sales.length>0?`S$${sales.reduce((s,t)=>s+(t.amount||0),0).toLocaleString()}`:"—",sub:`${sales.length} sale${sales.length!==1?"s":""}`,color:T.up},
                        ];
                      })().map(s=>(
                        <div key={s.label} style={{background:T.inputBg,borderRadius:9,padding:"10px 12px"}}>
                          <div style={{fontSize:11,color:T.muted}}>{s.label}</div>
                          <div style={{fontSize:14,fontWeight:700,color:s.color,marginTop:4}}>{s.value}</div>
                          <div style={{fontSize:11,color:T.dim,marginTop:2}}>{s.sub}</div>
                        </div>
                      ))}
                    </div>
                    {item.status !== "Sold" && item.status !== "Lost / Stolen" && (
                      <div style={{display:"flex",justifyContent:"flex-end"}}>
                        <button onClick={()=>setShowTxModal(true)} style={{padding:"7px 16px",borderRadius:7,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>+ Record Transaction</button>
                      </div>
                    )}
                    {txs.length===0?(
                      <div style={{textAlign:"center",padding:"32px 20px",color:T.muted}}><div style={{fontSize:28,marginBottom:8}}>📒</div><div style={{fontSize:13,fontWeight:600}}>No transactions yet</div></div>
                    ):(
                      <div style={{display:"flex",flexDirection:"column",gap:1,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                        {txs.map((tx,i)=>{
                          const isOut = ["Purchase","Appraisal Fee","Insurance Premium","Maintenance","Storage Cost","Consignment Fee","Restoration"].includes(tx.type);
                          const isIn = tx.type === "Sale";
                          const isVal = tx.type === "Valuation Update";
                          const icon = {"Purchase":"📥","Sale":"📤","Valuation Update":"📊","Appraisal Fee":"🔍","Insurance Premium":"🛡","Maintenance":"🔧","Storage Cost":"📦","Consignment Fee":"🤝","Restoration":"🎨"}[tx.type]||"💰";
                          return (
                            <div key={tx.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",background:i%2===0?T.bg:T.inputBg,borderTop:i>0?`1px solid ${T.border}`:"none"}}>
                              <div style={{width:34,height:34,borderRadius:8,background:isIn?T.upBg:isOut?T.downBg:T.accentBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{icon}</div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:600}}>{tx.type}{tx.notes?` — ${tx.notes}`:""}</div>
                                <div style={{fontSize:11,color:T.muted,marginTop:1,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                                  <span>{tx.date}</span>
                                  {tx.method&&<span style={{fontSize:10,background:T.inputBg,borderRadius:4,padding:"1px 6px"}}>{tx.method}</span>}
                                  {tx.ref&&<span style={{fontSize:10,color:T.dim,fontFamily:"monospace"}}>{tx.ref}</span>}
                                </div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div style={{fontSize:13,fontWeight:700,color:isIn?T.up:isOut?T.down:T.accent}}>
                                  {isVal?"→":(isIn?"+":"-")} S${tx.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
                                </div>
                                <div style={{fontSize:10,color:T.dim,marginTop:1}}>{tx.type}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {drawerTab === "postings" && (() => {
                  const sortedTxs = (item.transactions||[]).filter(t=>t.status==="Complete"&&t.type!=="Valuation Update"&&t.amount>0).slice().sort((a,b)=>a.date.localeCompare(b.date));
                  const journalRows = [];
                  sortedTxs.forEach(tx => {
                    if (tx.type==="Purchase") {
                      journalRows.push(
                        {date:tx.date,desc:`Purchase — ${tx.notes||item.name}`,account:itemAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:cashAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else if (tx.type==="Sale") {
                      journalRows.push(
                        {date:tx.date,desc:`Sale — ${tx.notes||item.name}`,account:cashAcct,amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:itemAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    } else {
                      journalRows.push(
                        {date:tx.date,desc:`${tx.type} — ${tx.notes||item.name}`,account:feeAcct(tx.type),amount:fmtA(tx.amount),debit:true,_first:true},
                        {date:null,desc:"",account:cashAcct,amount:fmtA(tx.amount),debit:false,_first:false},
                      );
                    }
                  });
                  if (isMobile && journalRows.length > 0) return <MobilePostingsList journalRows={journalRows} entryCount={sortedTxs.length} entryLabel="transactions"/>;
                  if (journalRows.length===0) return (
                    <div style={{textAlign:"center",padding:"48px 20px",color:T.muted}}><div style={{fontSize:32,marginBottom:10}}>📒</div><div style={{fontSize:13,fontWeight:600}}>No entries to post yet</div></div>
                  );
                  return (
                    <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",background:T.bg}}>
                      <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:inter}}>Ledger Postings</div>
                        <div style={{fontSize:12,color:T.accent,marginTop:3,fontFamily:inter}}>Double-entry bookkeeping · PTA compliant · {sortedTxs.length} transaction{sortedTxs.length!==1?"s":""}</div>
                      </div>
                      <div style={{overflowX:"auto",overflowY:"auto",maxHeight:460}}>
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
                            {["Date","Account","Description","Debit","Credit"].map((h,hi)=>(
                              <th key={h} style={{padding:"9px 16px",textAlign:hi>=3?"right":"left",width:hi===0||hi>=3?148:undefined,fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,whiteSpace:"nowrap"}}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {journalRows.map((row,ri)=>(
                              <tr key={ri} style={{borderBottom:`1px solid ${T.border}`}}>
                                <td style={{padding:"11px 16px",verticalAlign:"top",width:148}}>
                                  {row._first?(<><div style={{fontSize:13,fontFamily:inter,whiteSpace:"nowrap"}}>{row.date}</div><div style={{fontSize:11,color:T.dim,marginTop:2,fontFamily:inter}}>{daysAgo(row.date)}</div></>):null}
                                </td>
                                <td style={{padding:"11px 16px",verticalAlign:"top"}}><span style={{fontFamily:mono,fontSize:12,color:T.text}}>{row.account}</span></td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",fontSize:12,color:T.muted,fontFamily:inter}}>{row.desc}</td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                                  {row.debit?<span style={{fontSize:13,fontWeight:700,color:T.up,fontFamily:inter}}>{row.amount}</span>:<span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                                </td>
                                <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                                  {!row.debit?<span style={{fontSize:13,fontWeight:700,color:T.down,fontFamily:inter}}>{row.amount}</span>:<span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{padding:"12px 18px",borderTop:`1px solid ${T.border}`,background:T.sidebar}}>
                        <div style={{fontSize:12,fontWeight:700,marginBottom:6,fontFamily:inter}}>Double-Entry Accounting</div>
                        <div style={{fontSize:11,color:T.muted,lineHeight:1.8,fontFamily:inter}}>
                          <div>• <span style={{color:T.up,fontWeight:600}}>Debit (Dr):</span> Purchase → increases collectible asset; Sale → increases cash; Expenses → recorded as holding cost</div>
                          <div>• <span style={{color:T.down,fontWeight:600}}>Credit (Cr):</span> Purchase / expenses → reduce cash; Sale → reduces asset (gain/loss booked on disposal)</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Transaction modal */}
      {showTxModal && selectedItem && (() => {
        const item = items.find(i => i.id === selectedItem.id) || selectedItem;
        return <ColTxModalInner item={item} onSave={(tx) => {
          const newTx = {...tx, id:"CTX"+Date.now(), status:"Complete"};
          setItems(prev => prev.map(i => {
            if (i.id !== item.id) return i;
            const nextTxs = [...(i.transactions||[]), newTx];
            let patch = { transactions: nextTxs };
            if (tx.type === "Valuation Update") { patch.currentValue = +tx.amount; patch.valuationDate = tx.date; patch.valuerSource = tx.method||""; }
            else if (tx.type === "Sale") { patch.status = "Sold"; patch.currentValue = +tx.amount; patch.valuationDate = tx.date; }
            return { ...i, ...patch };
          }));
          setShowTxModal(false);
          showToast(`${tx.type} recorded`, "success");
        }} onClose={()=>setShowTxModal(false)}/>;
      })()}

      {/* Add/Edit modal */}
      {showModal && editItem && (
        <ColModal item={editItem} onSave={handleSave} onClose={()=>{setShowModal(false);setEditItem(null);}}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REAL ESTATE MODULE  —  Multi-Country Simplified
═══════════════════════════════════════════════════════════════ */

const RE_COUNTRIES = {
  Singapore:   { flag:"🇸🇬", currency:"SGD", symbol:"S$",  stampLabel:"BSD + ABSD",  loanLabel:"HDB / Bank Loan",    taxLabel:"Property Tax (IRAS)",     avgYield:3.5 },
  Malaysia:    { flag:"🇲🇾", currency:"MYR", symbol:"RM",  stampLabel:"RPGT + Stamp", loanLabel:"Margin of Finance",  taxLabel:"Assessment Tax (Cukai)",   avgYield:4.2 },
  UK:          { flag:"🇬🇧", currency:"GBP", symbol:"£",   stampLabel:"SDLT",         loanLabel:"Mortgage",           taxLabel:"Council Tax",              avgYield:4.0 },
  Dubai:       { flag:"🇦🇪", currency:"AED", symbol:"AED", stampLabel:"DLD Fee (4%)", loanLabel:"Mortgage",           taxLabel:"Service Charge",           avgYield:6.5 },
  US:          { flag:"🇺🇸", currency:"USD", symbol:"$",   stampLabel:"Transfer Tax",  loanLabel:"Mortgage",           taxLabel:"Property Tax",             avgYield:4.5 },
  Japan:       { flag:"🇯🇵", currency:"JPY", symbol:"¥",   stampLabel:"Registration",  loanLabel:"Housing Loan",       taxLabel:"Fixed Asset Tax",          avgYield:5.5 },
  Australia:   { flag:"🇦🇺", currency:"AUD", symbol:"A$",  stampLabel:"Stamp Duty",    loanLabel:"Home Loan",          taxLabel:"Council Rates",            avgYield:3.8 },
  "New Zealand":{ flag:"🇳🇿", currency:"NZD", symbol:"NZ$",stampLabel:"NZLS Fee",      loanLabel:"Home Loan",          taxLabel:"Rates",                    avgYield:3.2 },
};

const RE_PROPERTY_TYPES = {
  Singapore:    ["HDB — BTO","HDB — Resale","Executive Condo","Private Condo","Terrace House","Semi-Detached","Bungalow / GCB","Shophouse","Office / Commercial"],
  Malaysia:     ["Condo / Serviced Apt","Terrace House","Semi-D / Bungalow","Townhouse","SOHO / SOVO","Shop-Office","Industrial"],
  UK:           ["Flat / Apartment","Terraced House","Semi-Detached","Detached House","Maisonette","Commercial"],
  Dubai:        ["Apartment","Villa / Townhouse","Penthouse","Studio","Commercial Unit"],
  US:           ["Single Family Home","Condo / Apartment","Townhouse","Multi-Family","Commercial"],
  Japan:        ["Mansion (Condo)","Detached House (Ikkodate)","Apartment (Apato)","Commercial"],
  Australia:    ["Apartment / Unit","Terrace / Townhouse","House","Duplex","Rural / Acreage","Commercial"],
  "New Zealand":["House","Unit / Apartment","Townhouse","Section (Land)","Commercial"],
};

const RE_TENURES = {
  Singapore:    ["99-Year Leasehold","999-Year Leasehold","Freehold"],
  Malaysia:     ["Freehold","99-Year Leasehold","Leasehold (varies)","Malay Reserve"],
  UK:           ["Freehold","Leasehold","Commonhold"],
  Dubai:        ["Freehold","Leasehold (99yr)"],
  US:           ["Fee Simple (Freehold)","Leasehold","Cooperative"],
  Japan:        ["Freehold","Fixed-Term Leasehold (Teichi)","Borrowing Rights (Shakuya)"],
  Australia:    ["Freehold (Torrens)","Strata Title","Leasehold","Company Title"],
  "New Zealand":["Freehold","Leasehold","Cross Lease","Unit Title","Stratum Estate"],
};

const RE_PURPOSE = ["Own Stay","Investment / Rental","Vacant","Under Construction","Holiday / Short-term"];

const RE_STATUS_COLORS = {
  "Own Stay":           { bg:"#EFF6FF", color:"#1D4ED8", border:"#BFDBFE" },
  "Investment / Rental":{ bg:"#F0FDF4", color:"#15803D", border:"#BBF7D0" },
  "Vacant":             { bg:"#F9FAFB", color:"#6B7280", border:"#E5E7EB" },
  "Under Construction": { bg:"#FFFBEB", color:"#D97706", border:"#FDE68A" },
  "Holiday / Short-term":{ bg:"#FDF4FF", color:"#9333EA", border:"#E9D5FF" },
  "Sold":               { bg:"#FEF2F2", color:"#DC2626", border:"#FECACA" },
};

const EMPTY_PROP = {
  id:"", name:"", country:"Singapore", type:"", tenure:"", address:"", postalCode:"",
  sizeSqft:0, purchasePrice:0, purchaseDate:"", currentValuation:0,
  isRented:false, monthlyRent:0, tenantName:"", leaseStart:"", leaseEnd:"",
  loanAmount:0, interestRate:0, loanTenureYears:25, monthlyPayment:0,
  purpose:"Own Stay", annualTax:0, mcstFee:0, maintenanceFee:0,
  stampDuty:0, agentFee:0, otherFees:0, notes:"",
  linkedInsuranceId: null,
  tags: [],
  loanContracts: [],
  loanRepayments: [],
};

function calcMonthly(principal, annualRate, years) {
  if (!principal || !annualRate || !years) return 0;
  const r = annualRate / 100 / 12, n = years * 12;
  return Math.round(principal * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1));
}

const COUNTRIES_LIST = Object.keys(RE_COUNTRIES);

// ── Loan eligibility rules ────────────────────────────────────
const HDB_TYPES = ["HDB — BTO","HDB — Resale"];
const PRIVATE_RESIDENTIAL_TYPES = ["Executive Condo","Private Condo","Terrace House","Semi-Detached","Bungalow / GCB"];
const COMMERCIAL_TYPES = ["Shophouse","Office / Commercial"];

const getLoanTypes = (propType) => {
  if (HDB_TYPES.includes(propType)) return ["HDB Loan","Bank Loan"];
  return ["Bank Loan"];  // Private residential, commercial, overseas — bank only
};

const isCPFEligible = (propType, country) => {
  if (country !== "Singapore") return false;
  return HDB_TYPES.includes(propType) || PRIVATE_RESIDENTIAL_TYPES.includes(propType);
};

/* ── Real Estate: Sub-components (defined OUTSIDE RealEstateScreen to avoid remount) ── */

function RESummaryCard({ l, v, sub, c }) {
  return (
    <div style={{background:T.inputBg,borderRadius:12,padding:"16px 18px"}}>
      <div style={{fontSize:11,color:T.muted,fontWeight:500}}>{l}</div>
      <div style={{fontSize:20,fontWeight:800,color:c||T.text,marginTop:4}}>{v}</div>
      {sub && <div style={{fontSize:11,color:T.dim,marginTop:3}}>{sub}</div>}
    </div>
  );
}

function REPropCard({ p, selPropId, onSelect, insured }) {
  const ctry = RE_COUNTRIES[p.country] || RE_COUNTRIES.Singapore;
  const gain = (p.currentValuation||0) - (p.purchasePrice||0);
  const sc = RE_STATUS_COLORS[p.purpose] || RE_STATUS_COLORS["Vacant"];
  const grossYield = p.isRented && p.currentValuation ? ((p.monthlyRent*12)/p.currentValuation*100).toFixed(1) : null;
  const isSelected = selPropId === p.id;
  return (
    <div onClick={()=>onSelect(p)}
      style={{background:T.bg,border:`1px solid ${isSelected?T.selected:T.border}`,borderRadius:14,padding:"16px 18px",cursor:"pointer",transition:"border-color 0.15s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <span style={{fontSize:18}}>{ctry.flag}</span>
            <span style={{fontSize:14,fontWeight:700,color:T.text}}>{p.name}</span>
          </div>
          <div style={{fontSize:11,color:T.muted}}>{p.type} · {p.tenure||"—"} · {p.country}</div>
          {p.address && <div style={{fontSize:11,color:T.dim,marginTop:2}}>{p.address}</div>}
          {(p.tags||[]).length > 0 && (
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
              {(p.tags||[]).map(tag=>(
                <span key={tag} style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,background:T.accentBg,color:T.accent,border:`1px solid ${T.accent}40`}}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end",marginLeft:10}}>
          {p.sold ? (
            <span style={{fontSize:10,fontWeight:600,color:"#DC2626",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:6,padding:"3px 8px",whiteSpace:"nowrap"}}>
              Sold
            </span>
          ) : (
            <span style={{fontSize:10,fontWeight:600,color:sc.color,background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:6,padding:"3px 8px",whiteSpace:"nowrap"}}>
              {p.purpose}
            </span>
          )}
          {insured && (
            <span style={{fontSize:10,fontWeight:600,color:"#15803D",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:6,padding:"2px 7px",whiteSpace:"nowrap"}}>
              🛡 Insured
            </span>
          )}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        <div>
          <div style={{fontSize:10,color:T.muted}}>Current Value</div>
          <div style={{fontSize:13,fontWeight:700}}>{ctry.symbol}{(p.currentValuation||p.purchasePrice||0).toLocaleString()}</div>
        </div>
        <div>
          <div style={{fontSize:10,color:T.muted}}>Gain / Loss</div>
          <div style={{fontSize:13,fontWeight:700,color:gain>=0?T.up:T.down}}>{gain>=0?"+":""}{ctry.symbol}{Math.abs(gain).toLocaleString()}</div>
        </div>
        <div>
          {p.isRented && grossYield ? (
            <>
              <div style={{fontSize:10,color:T.muted}}>Gross Yield</div>
              <div style={{fontSize:13,fontWeight:700,color:T.up}}>{grossYield}%</div>
            </>
          ) : p.loanAmount > 0 ? (
            <>
              <div style={{fontSize:10,color:T.muted}}>Loan Balance</div>
              <div style={{fontSize:13,fontWeight:700,color:T.down}}>{ctry.symbol}{(p.loanAmount||0).toLocaleString()}</div>
            </>
          ) : (
            <>
              <div style={{fontSize:10,color:T.muted}}>Equity</div>
              <div style={{fontSize:13,fontWeight:700}}>{ctry.symbol}{((p.currentValuation||p.purchasePrice||0)-(p.loanAmount||0)).toLocaleString()}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function REDrawer({ p, properties, setProperties, policies, propTab, setPropTab, showToast, onClose }) {
  const isMobile = useIsMobile();
  const [editing, setEditing] = useState(false);
  const [ef, setEFState] = useState(null);
  const setEF = (k, v) => setEFState(f => ({...f, [k]: v}));
  const [finTab, setFinTab] = useState("contracts");
  const [showAddContract, setShowAddContract] = useState(false);
  const [showAddRepay, setShowAddRepay] = useState(false);
  const [showSold, setShowSold] = useState(false);

  const ctry = RE_COUNTRIES[p.country] || RE_COUNTRIES.Singapore;
  const sym = ctry.symbol;
  const gain = (p.currentValuation||0) - (p.purchasePrice||0);
  const gainPct = p.purchasePrice ? ((gain/p.purchasePrice)*100).toFixed(1) : "0.0";
  const monthly = p.monthlyPayment || calcMonthly(p.loanAmount, p.interestRate, p.loanTenureYears);
  const update = (fields) => setProperties(prev => prev.map(pr => pr.id === p.id ? {...pr,...fields} : pr));


  // ── Add Contract Modal ─────────────────────────────
  const AddContractModal = ({ onClose }) => {
    const _lc   = p.loanContracts || [];
    const _alt  = getLoanTypes(p.type);
    const [f, setFL] = useState({
      loanType: _alt[0], lender:"", loanAmount: p.purchasePrice * 0.75 || 0,
      interestRate:2.6, rateType:"Floating", tenureYears:25,
      monthlyPayment:0, startDate: p.purchaseDate||"", maturityDate:"",
      isActive: _lc.length === 0, notes:"",
    });
    const upd = (k,v) => setFL(prev=>({...prev,[k]:v}));
    const calc = calcMonthly(parseFloat(f.loanAmount)||0, parseFloat(f.interestRate)||0, parseInt(f.tenureYears)||25);
    const iStyle = {width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 10px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"};
    return (
      <>
        <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:400}}/>
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:401,background:T.bg,border:`1px solid ${T.border}`,borderRadius:14,width:480,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:T.bg,zIndex:1}}>
            <div><div style={{fontSize:14,fontWeight:700}}>Add Loan Contract</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>
              {_alt.length === 1 ? "Bank loan only for this property type" : "HDB or Bank loan available"}
            </div></div>
            <button onClick={onClose} style={{background:T.inputBg,border:"none",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:15,color:T.muted}}>×</button>
          </div>
          <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><Label>Loan Type</Label>
                <select value={f.loanType} onChange={e=>upd("loanType",e.target.value)} style={iStyle}>
                  {_alt.map(t=><option key={t}>{t}</option>)}
                </select></div>
              <div><Label>Lender / Bank</Label>
                <input value={f.lender} onChange={e=>upd("lender",e.target.value)} placeholder={f.loanType==="HDB Loan"?"HDB":"e.g. DBS Bank"} style={iStyle}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><Label>Loan Amount ({sym})</Label>
                <input type="number" value={f.loanAmount} onChange={e=>upd("loanAmount",parseFloat(e.target.value)||0)} style={iStyle}/></div>
              <div><Label>Interest Rate (% p.a.)</Label>
                <input type="number" step="0.01" value={f.interestRate} onChange={e=>upd("interestRate",parseFloat(e.target.value)||0)} style={iStyle}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><Label>Rate Type</Label>
                <select value={f.rateType} onChange={e=>upd("rateType",e.target.value)} style={iStyle}>
                  <option>Fixed</option><option>Floating</option><option>Hybrid</option>
                </select></div>
              <div><Label>Tenure (years)</Label>
                <input type="number" value={f.tenureYears} onChange={e=>upd("tenureYears",parseInt(e.target.value)||25)} style={iStyle}/></div>
            </div>
            {calc > 0 && (
              <div style={{background:T.accentBg,border:`1px solid ${T.accent}30`,borderRadius:8,padding:"9px 12px",fontSize:12,color:T.accent}}>
                Estimated monthly: <strong>{sym}{calc.toLocaleString()}</strong>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><Label>Start Date</Label>
                <input type="date" value={f.startDate} onChange={e=>upd("startDate",e.target.value)} style={iStyle}/></div>
              <div><Label>Maturity Date</Label>
                <input type="date" value={f.maturityDate} onChange={e=>upd("maturityDate",e.target.value)} style={iStyle}/></div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:T.inputBg,borderRadius:8}}>
              <input type="checkbox" id="isActiveCb" checked={f.isActive} onChange={e=>upd("isActive",e.target.checked)} style={{width:16,height:16,cursor:"pointer"}}/>
              <label htmlFor="isActiveCb" style={{fontSize:13,cursor:"pointer",color:T.text}}>Mark as active/current loan contract</label>
            </div>
            <div><Label>Notes</Label>
              <textarea value={f.notes} onChange={e=>upd("notes",e.target.value)} rows={2} style={{...iStyle,resize:"vertical"}}/></div>
          </div>
          <div style={{padding:"12px 20px",borderTop:`1px solid ${T.border}`,background:T.sidebar,display:"flex",gap:10,position:"sticky",bottom:0}}>
            <button onClick={()=>{
              const newC = {...f, id:"LC"+Date.now(), monthlyPayment: f.monthlyPayment||calc};
              const existingActive = _lc.find(c => c.isActive);
              const updContracts = f.isActive
                ? [..._lc.map(c=>({...c,isActive:false})), newC]
                : [..._lc, newC];
              const settlementRepays = (f.isActive && existingActive) ? [{
                id: "LR"+Date.now(),
                contractId: existingActive.id,
                date: f.startDate || new Date().toISOString().slice(0,10),
                totalAmount: p.loanAmount || existingActive.loanAmount,
                cashAmount: p.loanAmount || existingActive.loanAmount,
                cpfAmount: 0, fees: 0, paymentType: "settlement",
                notes: `Full settlement of ${existingActive.lender} loan upon refinancing to ${f.lender || newC.loanType}`,
              }] : [];
              update({
                loanContracts: updContracts,
                loanRepayments: [...(p.loanRepayments||[]), ...settlementRepays],
                loanAmount: f.isActive ? parseFloat(f.loanAmount)||0 : p.loanAmount,
                interestRate: f.isActive ? parseFloat(f.interestRate)||0 : p.interestRate,
                loanTenureYears: f.isActive ? parseInt(f.tenureYears)||25 : p.loanTenureYears,
                monthlyPayment: f.isActive ? (f.monthlyPayment||calc) : p.monthlyPayment,
              });
              onClose();
              showToast(f.isActive && existingActive
                ? `New contract added · ${existingActive.lender} loan marked settled`
                : "Loan contract added", "success");
            }}
              style={{flex:1,background:T.selected,color:T.selectedText,border:"none",borderRadius:9,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              Add Contract
            </button>
            <button onClick={onClose} style={{background:"transparent",color:T.muted,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 16px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          </div>
        </div>
      </>
    );
  };
  // ── Add Repayment Modal ────────────────────────────
  const AddRepayModal = ({ onClose }) => {
    const _lc = p.loanContracts || [];
    const _ac = _lc.find(c => c.isActive) || _lc[0];
    const _cpfOK = isCPFEligible(p.type, p.country);
    const [f, setFL] = useState({
      contractId: _ac ? _ac.id : "",
      date: new Date().toISOString().slice(0,10),
      totalAmount: _ac ? _ac.monthlyPayment : 0,
      cashAmount: _ac ? _ac.monthlyPayment : 0,
      cpfAmount:0, fees:0, notes:"",
      useCPF: false,
      paymentType: "monthly",
    });
    const upd = (k,v) => setFL(prev=>({...prev,[k]:v}));
    const iStyle = {width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 10px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"};
    const cpfAmt = parseFloat(f.cpfAmount)||0;
    const cashAmt = parseFloat(f.cashAmount)||0;
    const total = parseFloat(f.totalAmount)||0;
    const splitMatch = !f.useCPF || Math.abs((cashAmt + cpfAmt) - total) < 0.01;
    const selectedContract = _lc.find(c=>c.id===f.contractId);
    const scheduledMonthly = selectedContract ? selectedContract.monthlyPayment : 0;
    return (
      <>
        <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:400}}/>
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:401,background:T.bg,border:`1px solid ${T.border}`,borderRadius:14,width:480,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:T.bg,zIndex:1}}>
            <div><div style={{fontSize:14,fontWeight:700}}>Record Loan Repayment</div>
            {_cpfOK && <div style={{fontSize:11,color:T.accent,marginTop:2}}>CPF-OA repayment available for this property</div>}</div>
            <button onClick={onClose} style={{background:T.inputBg,border:"none",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:15,color:T.muted}}>×</button>
          </div>
          <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:12}}>
            {_lc.length > 1 && (
              <div><Label>Loan Contract</Label>
                <select value={f.contractId} onChange={e=>{
                  const c = _lc.find(lc=>lc.id===e.target.value);
                  upd("contractId",e.target.value);
                  if(c){ upd("totalAmount",c.monthlyPayment); if(!f.useCPF) upd("cashAmount",c.monthlyPayment); }
                }} style={iStyle}>
                  {_lc.map(c=><option key={c.id} value={c.id}>{c.lender} — {sym}{c.loanAmount.toLocaleString()} @ {c.interestRate}% {c.isActive?"(Active)":""}</option>)}
                </select></div>
            )}
            {/* Payment type selector */}
            <div style={{display:"flex",gap:6}}>
              {[{id:"monthly",label:"Monthly Payment"},{id:"partial",label:"Partial Payment"}].map(t=>(
                <button key={t.id} onClick={()=>{
                  upd("paymentType",t.id);
                  if(t.id==="monthly"){
                    upd("totalAmount",scheduledMonthly);
                    if(!f.useCPF) upd("cashAmount",scheduledMonthly);
                    else upd("cashAmount",Math.max(0,Math.round((scheduledMonthly-(parseFloat(f.cpfAmount)||0))*100)/100));
                  }
                }}
                  style={{flex:1,padding:"8px 10px",borderRadius:8,border:`1.5px solid ${(f.paymentType||"monthly")===t.id?T.selected:T.border}`,
                    background:(f.paymentType||"monthly")===t.id?T.selected:"transparent",
                    color:(f.paymentType||"monthly")===t.id?T.selectedText:T.muted,
                    cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,textAlign:"center"}}>
                  {t.id==="monthly"?"📅 "+t.label:"✂️ "+t.label}
                </button>
              ))}
            </div>
            {(f.paymentType||"monthly")==="partial" && (
              <div style={{background:T.warnBg,border:`1px solid #FDE68A`,borderRadius:8,padding:"8px 12px",fontSize:12,color:T.warn}}>
                Partial payment — enter any amount less than or different from the scheduled monthly. This will be recorded separately and does not replace the scheduled payment.
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><Label>Payment Date</Label>
                <input type="date" value={f.date} onChange={e=>upd("date",e.target.value)} style={iStyle}/></div>
              <div>
                <Label required>Total Amount ({sym})</Label>
                <input type="number" value={f.totalAmount}
                  readOnly={(f.paymentType||"monthly")==="monthly"}
                  onChange={e=>{
                    if((f.paymentType||"monthly")==="monthly") return;
                    const newTotal = parseFloat(e.target.value)||0;
                    upd("totalAmount", e.target.value);
                    if(!f.useCPF) {
                      upd("cashAmount", newTotal);
                    } else {
                      const cpf = parseFloat(f.cpfAmount)||0;
                      upd("cashAmount", Math.max(0, Math.round((newTotal - cpf)*100)/100));
                    }
                  }}
                  style={{...iStyle,
                    background:(f.paymentType||"monthly")==="monthly"?T.inputBg:T.bg,
                    borderColor:(f.paymentType||"monthly")==="partial"?T.accent:T.border,
                    color:(f.paymentType||"monthly")==="monthly"?T.muted:T.text}}/>
                {scheduledMonthly > 0 && (
                  <div style={{fontSize:11,color:T.muted,marginTop:4}}>
                    Scheduled: <span style={{fontWeight:700,color:T.text}}>{sym}{scheduledMonthly.toLocaleString(undefined,{minimumFractionDigits:2})}</span> / month
                    {(f.paymentType||"monthly")==="partial" && parseFloat(f.totalAmount)>0 && parseFloat(f.totalAmount) !== scheduledMonthly && (
                      <span style={{marginLeft:6,color:T.warn,fontWeight:600}}>
                        ({parseFloat(f.totalAmount)<scheduledMonthly?"underpaying by ":"overpaying by "}{sym}{Math.abs(parseFloat(f.totalAmount)-scheduledMonthly).toLocaleString(undefined,{minimumFractionDigits:2})})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {_cpfOK && (
              <div style={{padding:"10px 12px",background:f.useCPF?T.accentBg:T.inputBg,border:`1px solid ${f.useCPF?T.accent+"40":T.border}`,borderRadius:9}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:f.useCPF?10:0}}>
                  <input type="checkbox" id="cpfToggle" checked={f.useCPF} onChange={e=>{
                    upd("useCPF",e.target.checked);
                    if(!e.target.checked){upd("cpfAmount",0);upd("cashAmount",parseFloat(f.totalAmount)||0);}
                  }} style={{width:16,height:16,cursor:"pointer"}}/>
                  <label htmlFor="cpfToggle" style={{fontSize:13,cursor:"pointer",fontWeight:600,color:f.useCPF?T.accent:T.text}}>
                    Include CPF-OA payment (optional)
                  </label>
                </div>
                {f.useCPF && (
                  <>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div><Label>Cash Amount ({sym})</Label>
                        <input type="number" value={f.cashAmount}
                          onChange={e=>{
                            const cash = parseFloat(e.target.value)||0;
                            upd("cashAmount", cash);
                            upd("cpfAmount", Math.max(0, Math.round((total - cash)*100)/100));
                          }} style={iStyle}/></div>
                      <div><Label>CPF-OA Amount ({sym})</Label>
                        <input type="number" value={f.cpfAmount}
                          onChange={e=>{
                            const cpf = parseFloat(e.target.value)||0;
                            upd("cpfAmount", cpf);
                            upd("cashAmount", Math.max(0, Math.round((total - cpf)*100)/100));
                          }} style={iStyle}/></div>
                    </div>
                    <div style={{marginTop:8,padding:"7px 10px",borderRadius:7,fontSize:12,
                      background:splitMatch?T.upBg:T.downBg, border:`1px solid ${splitMatch?"#BBF7D0":"#FECACA"}`,
                      color:splitMatch?T.up:T.down, fontWeight:600}}>
                      {splitMatch
                        ? `✅ Split: ${sym}${cashAmt.toLocaleString(undefined,{minimumFractionDigits:2})} cash + ${sym}${cpfAmt.toLocaleString(undefined,{minimumFractionDigits:2})} CPF = ${sym}${(cashAmt+cpfAmt).toLocaleString(undefined,{minimumFractionDigits:2})}`
                        : `❌ Cash + CPF (${sym}${(cashAmt+cpfAmt).toLocaleString(undefined,{minimumFractionDigits:2})}) ≠ Total (${sym}${total.toLocaleString(undefined,{minimumFractionDigits:2})})`
                      }
                    </div>
                  </>
                )}
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><Label>Fees (optional, {sym})</Label>
                <input type="number" value={f.fees} onChange={e=>upd("fees",parseFloat(e.target.value)||0)} placeholder="0.00" style={iStyle}/></div>
              <div></div>
            </div>
            <div><Label>Notes (optional)</Label>
              <textarea value={f.notes} onChange={e=>upd("notes",e.target.value)} rows={2}
                style={{...iStyle,resize:"vertical"}} placeholder="e.g. Partial capital repayment"/></div>
          </div>
          <div style={{padding:"12px 20px",borderTop:`1px solid ${T.border}`,background:T.sidebar,display:"flex",gap:10,position:"sticky",bottom:0}}>
            <button disabled={!f.totalAmount||!f.date||(f.useCPF&&!splitMatch)}
              onClick={()=>{
                const repay = { id:"LR"+Date.now(), contractId:f.contractId, date:f.date,
                  totalAmount:total, cashAmount:f.useCPF?cashAmt:total, cpfAmount:f.useCPF?cpfAmt:0,
                  fees:parseFloat(f.fees)||0, notes:f.notes, paymentType: f.paymentType||"monthly" };
                update({ loanRepayments:[...(p.loanRepayments||[]), repay] });
                onClose(); showToast("Repayment recorded","success");
              }}
              style={{flex:1, background:(!f.totalAmount||!f.date||(f.useCPF&&!splitMatch))?T.inputBg:T.selected,
                color:(!f.totalAmount||!f.date||(f.useCPF&&!splitMatch))?T.dim:T.selectedText,
                border:"none",borderRadius:9,padding:"10px",fontSize:13,fontWeight:600,
                cursor:(!f.totalAmount||!f.date||(f.useCPF&&!splitMatch))?"not-allowed":"pointer",fontFamily:"inherit"}}>
              Record Repayment
            </button>
            <button onClick={onClose} style={{background:"transparent",color:T.muted,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 16px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          </div>
        </div>
      </>
    );
  };

  // ── Sold Modal ──────────────────────────────────────
  const SoldModal = ({ onClose }) => {
    const [f, setFL] = useState({ soldPrice: "", soldDate: new Date().toISOString().slice(0,10), buyerName: "" });
    const upd = (k,v) => setFL(prev=>({...prev,[k]:v}));
    const iStyle = {width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 10px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"};
    const canSave = parseFloat(f.soldPrice) > 0 && f.soldDate && f.buyerName.trim();
    return (
      <>
        <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:400}}/>
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:401,background:T.bg,border:`1px solid ${T.border}`,borderRadius:14,width:420,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:14,fontWeight:700}}>Mark as Sold</div>
              <div style={{fontSize:11,color:T.muted,marginTop:2}}>{p.name}</div>
            </div>
            <button onClick={onClose} style={{background:T.inputBg,border:"none",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:15,color:T.muted}}>×</button>
          </div>
          <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:12}}>
            <div><Label>Sold Price ({sym})</Label>
              <input type="number" value={f.soldPrice} onChange={e=>upd("soldPrice",e.target.value)} placeholder="0" style={iStyle}/></div>
            <div><Label>Sold Date</Label>
              <input type="date" value={f.soldDate} onChange={e=>upd("soldDate",e.target.value)} style={iStyle}/></div>
            <div><Label>Buyer Name</Label>
              <input value={f.buyerName} onChange={e=>upd("buyerName",e.target.value)} placeholder="Name of the buyer" style={iStyle}/></div>
          </div>
          <div style={{padding:"12px 20px",borderTop:`1px solid ${T.border}`,background:T.sidebar,display:"flex",gap:10}}>
            <button disabled={!canSave}
              onClick={()=>{
                update({ sold: true, soldPrice: parseFloat(f.soldPrice)||0, soldDate: f.soldDate, buyerName: f.buyerName.trim() });
                onClose();
                showToast("Property marked as sold","success");
              }}
              style={{flex:1, background:canSave?"#DC2626":T.inputBg, color:canSave?"#fff":T.dim,
                border:"none",borderRadius:9,padding:"10px",fontSize:13,fontWeight:600,
                cursor:canSave?"pointer":"not-allowed",fontFamily:"inherit"}}>
              Confirm Sale
            </button>
            <button onClick={onClose} style={{background:"transparent",color:T.muted,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 16px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          </div>
        </div>
      </>
    );
  };

  const TABS = ["overview","financials","rental","costs","insurance","postings"];
  const tabLabel = {overview:"Overview",financials:"Loan & Finance",rental:"Rental",costs:"Costs & Fees",insurance:"Insurance",postings:"Postings"};

  const handleSave = () => {
    update(ef);
    setEditing(false);
    showToast("Property updated", "success");
  };
  const handleEdit = () => {
    setEFState({
      name:p.name, address:p.address||"", postalCode:p.postalCode||"", type:p.type,
      tenure:p.tenure||"", sizeSqft:p.sizeSqft||0, purchasePrice:p.purchasePrice||0,
      purchaseDate:p.purchaseDate||"", currentValuation:p.currentValuation||0,
      purpose:p.purpose, isRented:p.isRented, monthlyRent:p.monthlyRent||0,
      tenantName:p.tenantName||"", leaseStart:p.leaseStart||"", leaseEnd:p.leaseEnd||"",
      loanAmount:p.loanAmount||0, interestRate:p.interestRate||0,
      loanTenureYears:p.loanTenureYears||25, monthlyPayment:p.monthlyPayment||0,
      annualTax:p.annualTax||0, mcstFee:p.mcstFee||0, maintenanceFee:p.maintenanceFee||0,
      stampDuty:p.stampDuty||0, agentFee:p.agentFee||0, otherFees:p.otherFees||0,
      notes:p.notes||"",
      linkedInsuranceId:p.linkedInsuranceId||null,
      tags: p.tags||[], tagInput: "",
    });
    setEditing(true);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Header */}
      <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22}}>{ctry.flag}</span>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:15,fontWeight:800}}>{p.name}</span>
                {p.sold && <span style={{fontSize:10,fontWeight:700,color:"#DC2626",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:6,padding:"2px 8px"}}>SOLD</span>}
              </div>
              <div style={{fontSize:11,color:T.muted}}>{p.type} · {p.country}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:6}}>
            {!p.sold && propTab !== "insurance" && propTab !== "financials" && propTab !== "postings" && (
              <>
                <button onClick={editing ? handleSave : handleEdit}
                  style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${editing?T.up:T.border}`,background:editing?T.upBg:T.bg,color:editing?T.up:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>
                  {editing ? "💾 Save" : "✏️ Edit"}
                </button>
                {editing && (
                  <button onClick={()=>setEditing(false)}
                    style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>
                    Cancel
                  </button>
                )}
              </>
            )}
            {!p.sold && (
              <button onClick={()=>setShowSold(true)}
                style={{padding:"6px 14px",borderRadius:8,border:"1px solid #FECACA",background:"#FEF2F2",color:"#DC2626",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>
                Sold
              </button>
            )}
            <button onClick={onClose}
              style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>
              ✕
            </button>
          </div>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {TABS.filter(t => t !== "rental" || p.isRented).map(t => (
            <button key={t} onClick={()=>setPropTab(t)}
              style={{padding:"6px 14px",borderRadius:8,border:"none",background:propTab===t?T.selected:T.inputBg,color:propTab===t?T.selectedText:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:propTab===t?700:400}}>
              {tabLabel[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",minHeight:0}}><div style={{padding:"18px 20px 32px",display:"flex",flexDirection:"column",gap:14}}>

        {/* ── OVERVIEW ── */}
        {propTab === "overview" && (
          <>
            <div style={{background:T.selected,borderRadius:14,padding:"18px 20px"}}>
              <div style={{fontSize:11,color:"#9CA3AF",marginBottom:12,fontWeight:600}}>PROPERTY VALUE</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {[
                  {l:"Purchase Price",    v:`${sym}${(p.purchasePrice||0).toLocaleString()}`,                   c:"white"},
                  {l:"Current Valuation", v:`${sym}${(p.currentValuation||p.purchasePrice||0).toLocaleString()}`, c:"white"},
                  {l:"Capital Gain",      v:`${gain>=0?"+":""}${sym}${Math.abs(gain).toLocaleString()} (${gainPct}%)`, c:gain>=0?"#86EFAC":"#FCA5A5"},
                ].map(s => (
                  <div key={s.l}>
                    <div style={{fontSize:10,color:"#9CA3AF"}}>{s.l}</div>
                    <div style={{fontSize:14,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {editing && ef ? (
                <>
                  <div style={{gridColumn:"span 2"}}><Label>Property Name</Label><Input value={ef.name} onChange={e=>setEF("name",e.target.value)}/></div>
                  <div style={{gridColumn:"span 2"}}><Label>Address</Label><Input value={ef.address} onChange={e=>setEF("address",e.target.value)}/></div>
                  <div>
                    <Label>Type</Label>
                    <select value={ef.type} onChange={e=>setEF("type",e.target.value)}
                      style={{width:"100%",padding:"9px 10px",borderRadius:8,border:`1px solid ${T.border}`,background:T.inputBg,fontFamily:"inherit",fontSize:13,color:T.text,outline:"none"}}>
                      {(RE_PROPERTY_TYPES[p.country]||[]).map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Tenure</Label>
                    <select value={ef.tenure} onChange={e=>setEF("tenure",e.target.value)}
                      style={{width:"100%",padding:"9px 10px",borderRadius:8,border:`1px solid ${T.border}`,background:T.inputBg,fontFamily:"inherit",fontSize:13,color:T.text,outline:"none"}}>
                      {(RE_TENURES[p.country]||[]).map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Purpose</Label>
                    <select value={ef.purpose} onChange={e=>{setEF("purpose",e.target.value);setEF("isRented",e.target.value==="Investment / Rental");}}
                      style={{width:"100%",padding:"9px 10px",borderRadius:8,border:`1px solid ${T.border}`,background:T.inputBg,fontFamily:"inherit",fontSize:13,color:T.text,outline:"none"}}>
                      {RE_PURPOSE.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><Label>Size (sqft)</Label><Input type="number" value={ef.sizeSqft} onChange={e=>setEF("sizeSqft",e.target.value)}/></div>
                  <div><Label>Purchase Date</Label><Input type="date" value={ef.purchaseDate} onChange={e=>setEF("purchaseDate",e.target.value)}/></div>
                  <div><Label>Current Valuation ({sym})</Label><Input type="number" value={ef.currentValuation} onChange={e=>setEF("currentValuation",parseFloat(e.target.value)||0)}/></div>
                </>
              ) : (
                [
                  ["Country",       `${ctry.flag} ${p.country}`],
                  ["Type",          p.type||"—"],
                  ["Tenure",        p.tenure||"—"],
                  ["Purpose",       p.purpose],
                  ["Size",          p.sizeSqft>0?`${Number(p.sizeSqft).toLocaleString()} sqft`:"—"],
                  ["Purchase Date", p.purchaseDate||"—"],
                  ["Address",       p.address||"—"],
                  ["Postal / ZIP",  p.postalCode||"—"],
                ].map(([k,v]) => (
                  <div key={k} style={{background:T.inputBg,borderRadius:9,padding:"10px 14px"}}>
                    <div style={{fontSize:10,color:T.muted}}>{k}</div>
                    <div style={{fontSize:13,fontWeight:600,marginTop:3}}>{v}</div>
                  </div>
                ))
              )}
            </div>

            <div>
              <div style={{fontSize:11,color:T.muted,marginBottom:6}}>📝 Notes</div>
              {editing && ef ? (
                <textarea value={ef.notes} onChange={e=>setEF("notes",e.target.value)}
                  style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none",resize:"vertical",minHeight:68,lineHeight:1.6}}/>
              ) : (
                <div style={{background:T.inputBg,borderRadius:8,padding:"10px 14px",fontSize:13,color:p.notes?T.text:T.dim,lineHeight:1.6}}>
                  {p.notes||"No notes"}
                </div>
              )}
            </div>

            {/* ── TAGS ── */}
            <div>
              <div style={{fontSize:11,color:T.muted,marginBottom:8}}>🏷 Name Tags</div>
              {editing && ef ? (
                <div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                    {(ef.tags||[]).map(tag => (
                      <span key={tag} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:20,background:T.accentBg,color:T.accent,border:`1px solid ${T.accent}40`}}>
                        {tag}
                        <span onClick={()=>setEF("tags",(ef.tags||[]).filter(t=>t!==tag))}
                          style={{cursor:"pointer",fontSize:14,lineHeight:1,color:T.muted,fontWeight:400}}>×</span>
                      </span>
                    ))}
                  </div>
                  {(ef.tags||[]).length < 3 && (
                    <div style={{display:"flex",gap:8}}>
                      <input value={ef.tagInput||""} onChange={e=>setEF("tagInput",e.target.value)}
                        onKeyDown={e=>{
                          if((e.key==="Enter"||e.key===",")&&(ef.tagInput||"").trim()){
                            e.preventDefault();
                            const t=(ef.tagInput||"").trim();
                            if(t&&!(ef.tags||[]).includes(t)&&(ef.tags||[]).length<3){
                              setEF("tags",[...(ef.tags||[]),t]);
                              setEF("tagInput","");
                            }
                          }
                        }}
                        placeholder={`Add tag (${3-(ef.tags||[]).length} left) — press Enter`}
                        style={{flex:1,background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 12px",fontSize:12,fontFamily:"inherit",color:T.text,outline:"none"}}/>
                      <button onClick={()=>{
                          const t=(ef.tagInput||"").trim();
                          if(t&&!(ef.tags||[]).includes(t)&&(ef.tags||[]).length<3){
                            setEF("tags",[...(ef.tags||[]),t]);
                            setEF("tagInput","");
                          }
                        }}
                        style={{padding:"7px 14px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>
                        Add
                      </button>
                    </div>
                  )}
                  {(ef.tags||[]).length >= 3 && (
                    <div style={{fontSize:11,color:T.muted}}>Maximum 3 tags reached.</div>
                  )}
                </div>
              ) : (
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {(p.tags||[]).length === 0
                    ? <span style={{fontSize:12,color:T.dim}}>No tags</span>
                    : (p.tags||[]).map(tag => (
                        <span key={tag} style={{fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:20,background:T.accentBg,color:T.accent,border:`1px solid ${T.accent}40`}}>
                          {tag}
                        </span>
                      ))
                  }
                </div>
              )}
            </div>
          </>
        )}

        {/* ── FINANCIALS ── */}
        {propTab === "financials" && (() => {
          const loanContracts = p.loanContracts || [];
          const loanRepayments = p.loanRepayments || [];
          const activeContract = loanContracts.find(c => c.isActive) || loanContracts[0];
          const cpfOK = isCPFEligible(p.type, p.country);
          const allowedLoanTypes = getLoanTypes(p.type);

          return (
            <>
              {/* Equity snapshot */}
              <div style={{background:T.selected,borderRadius:14,padding:"18px 20px"}}>
                <div style={{fontSize:11,color:"#9CA3AF",marginBottom:12,fontWeight:600}}>EQUITY SNAPSHOT</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                  {[
                    {l:"Property Value", v:`${sym}${(p.currentValuation||p.purchasePrice||0).toLocaleString()}`, c:"white"},
                    {l:"Loan Balance",   v:p.loanAmount>0?`-${sym}${p.loanAmount.toLocaleString()}`:"No loan",  c:p.loanAmount>0?"#FCA5A5":"#86EFAC"},
                    {l:"Equity",         v:`${sym}${((p.currentValuation||p.purchasePrice||0)-(p.loanAmount||0)).toLocaleString()}`, c:"#86EFAC"},
                  ].map(s=>(
                    <div key={s.l}>
                      <div style={{fontSize:10,color:"#9CA3AF"}}>{s.l}</div>
                      <div style={{fontSize:14,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-tabs */}
              <div style={{display:"flex",gap:4,borderBottom:`1px solid ${T.border}`,paddingBottom:0}}>
                {[
                  {id:"contracts",  label:`Contracts (${loanContracts.length})`},
                  {id:"repayments", label:`Repayments (${loanRepayments.length})`},
                ].map(t=>(
                  <button key={t.id} onClick={()=>setFinTab(t.id)}
                    style={{padding:"8px 14px",border:"none",borderBottom:`2px solid ${finTab===t.id?T.selected:"transparent"}`,
                      background:"transparent",color:finTab===t.id?T.text:T.muted,cursor:"pointer",
                      fontFamily:"inherit",fontSize:12,fontWeight:finTab===t.id?700:400,marginBottom:-1}}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── CONTRACTS sub-tab ── */}
              {finTab === "contracts" && (
                <>
                  {loanContracts.length === 0 ? (
                    <div style={{textAlign:"center",padding:"32px 20px",color:T.muted}}>
                      <div style={{fontSize:28,marginBottom:8}}>🏦</div>
                      <div style={{fontSize:13,fontWeight:600}}>No loan contracts yet</div>
                      <div style={{fontSize:12,marginTop:4}}>Add a contract to track your loan details and history.</div>
                    </div>
                  ) : loanContracts.map((c,i) => (
                    <div key={c.id} style={{border:`1.5px solid ${c.isActive?T.accent:T.border}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{padding:"11px 16px",background:c.isActive?T.accentBg:T.inputBg,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:13,fontWeight:700}}>{c.lender||c.loanType}</span>
                          <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:4,
                            background:c.loanType==="HDB Loan"?"#FEF9C3":"#EFF6FF",
                            color:c.loanType==="HDB Loan"?"#854D0E":T.accent}}>
                            {c.loanType}
                          </span>
                          {c.isActive && <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:4,background:T.upBg,color:T.up}}>Active</span>}
                        </div>
                      </div>
                      {[
                        ["Loan Amount",    `${sym}${c.loanAmount.toLocaleString()}`],
                        ["Interest Rate",  `${c.interestRate}% p.a. (${c.rateType})`],
                        ["Tenure",         `${c.tenureYears} years`],
                        ["Monthly Payment",`${sym}${(c.monthlyPayment||0).toLocaleString()}`],
                        ["Start Date",     c.startDate||"—"],
                        ["Maturity Date",  c.maturityDate||"—"],
                        c.notes ? ["Notes", c.notes] : null,
                      ].filter(Boolean).map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 16px",borderTop:`1px solid ${T.border}`}}>
                          <span style={{fontSize:12,color:T.muted}}>{k}</span>
                          <span style={{fontSize:12,fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {!p.sold && (
                    <button onClick={()=>setShowAddContract(true)}
                      style={{width:"100%",padding:"10px",borderRadius:10,border:`1px dashed ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600}}>
                      + Add Loan Contract
                    </button>
                  )}
                </>
              )}

              {/* ── REPAYMENTS sub-tab ── */}
              {finTab === "repayments" && (
                <>
                  {/* Summary */}
                  {loanRepayments.length > 0 && (() => {
                    const totalRepaid = loanRepayments.reduce((s,r)=>s+r.totalAmount,0);
                    const totalCPF = loanRepayments.reduce((s,r)=>s+(r.cpfAmount||0),0);
                    const totalCash = loanRepayments.reduce((s,r)=>s+(r.cashAmount||0),0);
                    return (
                      <div style={{display:"grid",gridTemplateColumns:`1fr 1fr${cpfOK?" 1fr":""}`,gap:10}}>
                        {[
                          {l:"Total Repaid",   v:`${sym}${totalRepaid.toLocaleString(undefined,{minimumFractionDigits:2})}`, c:T.up},
                          {l:"Cash Payments",  v:`${sym}${totalCash.toLocaleString(undefined,{minimumFractionDigits:2})}`,   c:T.text},
                          cpfOK ? {l:"CPF-OA Used",  v:`${sym}${totalCPF.toLocaleString(undefined,{minimumFractionDigits:2})}`, c:T.accent} : null,
                        ].filter(Boolean).map(s=>(
                          <div key={s.l} style={{background:T.inputBg,borderRadius:10,padding:"12px 14px"}}>
                            <div style={{fontSize:10,color:T.muted,marginBottom:3}}>{s.l}</div>
                            <div style={{fontSize:14,fontWeight:800,color:s.c}}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {loanRepayments.length === 0 ? (
                    <div style={{textAlign:"center",padding:"32px 20px",color:T.muted}}>
                      <div style={{fontSize:28,marginBottom:8}}>💰</div>
                      <div style={{fontSize:13,fontWeight:600}}>No repayments recorded yet</div>
                    </div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:1,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                      {[...loanRepayments].sort((a,b)=>b.date.localeCompare(a.date)).map((r,i)=>{
                        const contract = loanContracts.find(c=>c.id===r.contractId);
                        const hasCPF = (r.cpfAmount||0) > 0;
                        return (
                          <div key={r.id} style={{padding:"11px 16px",background:i%2===0?T.bg:T.inputBg,borderTop:i>0?`1px solid ${T.border}`:"none"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:hasCPF?6:0}}>
                              <div>
                                <div style={{fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                                  {r.date}
                                  {r.paymentType === "partial" && (
                                    <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:4,background:T.warnBg,color:T.warn,border:`1px solid #FDE68A`}}>Partial</span>
                                  )}
                                  {r.paymentType === "settlement" && (
                                    <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:4,background:T.downBg,color:T.down,border:`1px solid #FECACA`}}>Settlement</span>
                                  )}
                                </div>
                                <div style={{fontSize:11,color:T.muted,marginTop:1}}>
                                  {contract ? `${contract.lender} · ${contract.loanType}` : "Loan repayment"}
                                </div>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <div style={{fontSize:14,fontWeight:800,color:T.up}}>{sym}{r.totalAmount.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                                {r.fees > 0 && <div style={{fontSize:10,color:T.warn}}>+ {sym}{r.fees} fees</div>}
                              </div>
                            </div>
                            {hasCPF && (
                              <div style={{display:"flex",gap:6,marginTop:4}}>
                                <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:T.inputBg,color:T.muted}}>💵 Cash: {sym}{(r.cashAmount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
                                <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:T.accentBg,color:T.accent}}>🏛 CPF-OA: {sym}{(r.cpfAmount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
                              </div>
                            )}
                            {r.notes && <div style={{fontSize:11,color:T.dim,fontStyle:"italic",marginTop:4}}>{r.notes}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button onClick={()=>setShowAddRepay(true)}
                    style={{width:"100%",padding:"10px",borderRadius:10,border:`1px dashed ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600}}>
                    + Record Repayment
                  </button>
                </>
              )}


            </>
          );
        })()}
{/* ── POSTINGS sub-tab ── */}
        {propTab === "postings" && (() => {
          const loanContracts  = p.loanContracts  || [];
          const loanRepayments = p.loanRepayments || [];
          const activeContract = loanContracts.find(c => c.isActive) || loanContracts[0];
          const purchasePrice  = p.purchasePrice  || 0;
          const loanAmt        = activeContract ? activeContract.loanAmount : (p.loanAmount || 0);
          const equity         = purchasePrice - loanAmt;
          const stampDuty      = p.stampDuty  || 0;
          const agentFee       = p.agentFee   || 0;
          const otherFees      = p.otherFees  || 0;
          const annualTax      = p.annualTax  || 0;
          const mcstFee        = p.mcstFee    || 0;
          const propertyName   = (p.name || "Property").replace(/ /g, "");
          const purchaseDateFmt = p.purchaseDate || "????-??-??";

          // ── PTA formatters ────────────────────────────────
          const fmtV = (v, neg) => {
            const abs = Math.abs(v).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
            return (neg ? "-" : "") + sym + abs;
          };
          const ptaLine = (account, amount, isCredit) => ({account, amount, isCredit});

          // ── Build journal transactions ────────────────────
          const journal = [];

          // 1. Property purchase
          const purchaseLines = [
            ptaLine(`Assets:Fixed:Property:${propertyName}`, fmtV(purchasePrice, false), false),
            stampDuty > 0 ? ptaLine(`Expenses:Property:StampDuty`, fmtV(stampDuty, false), false) : null,
            agentFee  > 0 ? ptaLine(`Expenses:Property:LegalFees`, fmtV(agentFee,  false), false) : null,
            otherFees > 0 ? ptaLine(`Expenses:Property:OtherFees`, fmtV(otherFees, false), false) : null,
            loanAmt   > 0 ? ptaLine(`Liabilities:Mortgage:${activeContract ? activeContract.lender.replace(/ /g,"") : "Bank"}`, fmtV(loanAmt, true), true) : null,
            ptaLine(`Assets:Bank:Cash`, fmtV(equity + stampDuty + agentFee + otherFees, true), true),
          ].filter(Boolean);
          journal.push({ date: purchaseDateFmt, desc: `Purchase ${propertyName}`, _order:0, lines: purchaseLines });

          // 2. Each loan contract (refinancing)
          loanContracts.forEach((c, ci) => {
            if (ci === 0) return;
            const prev = loanContracts[ci - 1];
            journal.push({
              date: c.startDate || purchaseDateFmt,
              desc: `Refinance ${prev.lender.replace(/ /g,"")} into ${c.lender.replace(/ /g,"")}`,
              _order: 1,
              lines: [
                ptaLine(`Liabilities:Mortgage:${prev.lender.replace(/ /g,"")}`, fmtV(p.loanAmount || prev.loanAmount, false), false),
                ptaLine(`Liabilities:Mortgage:${c.lender.replace(/ /g,"")}`, fmtV(c.loanAmount, true), true),
              ],
            });
          });

          // 3. Loan repayments
          loanRepayments
            .slice().sort((a, b) => a.date.localeCompare(b.date))
            .forEach((r, ri) => {
              const contract = loanContracts.find(c => c.id === r.contractId) || activeContract;
              const cLender  = (contract ? contract.lender : "Bank").replace(/ /g, "");
              const cRate    = contract ? contract.interestRate : (p.interestRate || 0);
              const cLoan    = contract ? contract.loanAmount  : loanAmt;
              const cMonthly = contract ? contract.monthlyPayment : (p.monthlyPayment || 0);
              const isSettlement = r.paymentType === "settlement";

              if (isSettlement) {
                journal.push({
                  date: r.date, desc: `${cLender} full settlement`, _order: 1,
                  lines: [
                    ptaLine(`Liabilities:Mortgage:${cLender}`, fmtV(r.totalAmount, false), false),
                    ptaLine(`Assets:Bank:Cash`, fmtV(r.totalAmount, true), true),
                  ],
                });
                return;
              }

              const rr = cRate / 100 / 12;
              const paysBefore = loanRepayments.filter(x => x.contractId === r.contractId && x.date < r.date && x.paymentType !== "settlement").length;
              const outstandingBal = rr > 0
                ? cLoan * Math.pow(1+rr, paysBefore) - cMonthly * (Math.pow(1+rr, paysBefore)-1) / rr
                : cLoan;
              const interestAmt  = rr > 0 ? Math.max(0, Math.round(outstandingBal * rr * 100) / 100) : 0;
              const principalAmt = Math.max(0, r.totalAmount - interestAmt);
              const cashAmt      = r.cashAmount || r.totalAmount;
              const cpfAmt       = r.cpfAmount  || 0;
              const label        = r.paymentType === "partial" ? " partial payment" : ` repayment month ${paysBefore+1}`;

              const repayLines = [
                ptaLine(`Liabilities:Mortgage:${cLender}`, fmtV(principalAmt, false), false),
                ptaLine(`Expenses:Interest:Mortgage`, fmtV(interestAmt, false), false),
                cpfAmt > 0 ? ptaLine(`Assets:CPF:OA`, fmtV(cpfAmt, true), true) : null,
                ptaLine(`Assets:Bank:Cash`, fmtV(cashAmt + (r.fees||0), true), true),
                r.fees > 0 ? ptaLine(`Expenses:Mortgage:AdminFees`, fmtV(r.fees, false), false) : null,
              ].filter(Boolean);

              journal.push({ date: r.date, desc: `${cLender}${label}`, _order: 1, lines: repayLines });
            });

          // 4. Recurring costs — dated to end of purchase year, sort chronologically with everything else
          if (annualTax > 0) {
            journal.push({
              date: purchaseDateFmt.slice(0,4) + "-12-31",
              desc: "Property tax payment",
              _order: 1,
              lines: [
                ptaLine(`Expenses:Property:Tax`,  fmtV(annualTax, false), false),
                ptaLine(`Assets:Bank:Cash`,        fmtV(annualTax, true),  true),
              ],
            });
          }
          if (mcstFee > 0) {
            journal.push({
              date: purchaseDateFmt.slice(0,4) + "-12-31",
              desc: "MCST / maintenance fee",
              _order: 1,
              lines: [
                ptaLine(`Expenses:Property:MCST`, fmtV(mcstFee, false), false),
                ptaLine(`Assets:Bank:Cash`,        fmtV(mcstFee, true),  true),
              ],
            });
          }

          // Sort: purchase always first, then everything else strictly by date
          journal.sort((a, b) => {
            if (a._order === 0) return -1;
            if (b._order === 0) return 1;
            return a.date.localeCompare(b.date);
          });

          // Flatten journal into table rows
          const tableRows = journal.flatMap(txn =>
            txn.lines.map((ln, li) => ({
              date: li === 0 ? txn.date : null,
              desc: li === 0 ? txn.desc : "",
              account: ln.account,
              amount: ln.amount,
              isCredit: ln.isCredit,
            }))
          );

          const daysAgo = (d) => {
            if (!d || d.includes("?")) return "";
            const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
            return diff === 0 ? "Today" : diff === 1 ? "1 day ago" : diff + " days ago";
          };

          const inter = "'Inter','Segoe UI',system-ui,sans-serif";
          const mono  = "'Courier New',Courier,monospace";

          if (isMobile && tableRows.length > 0) {
            const adapted = tableRows.map(r => ({...r, debit:!r.isCredit, _first:!!r.date}));
            return <MobilePostingsList journalRows={adapted} entryCount={journal.length} entryLabel="entries"/>;
          }

          return (
                  <div style={{border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden",background:T.bg}}>
                    {/* Header */}
                    <div style={{padding:"18px 22px",borderBottom:`1px solid ${T.border}`}}>
                      <div style={{fontSize:15,fontWeight:700,color:T.text,fontFamily:inter}}>Ledger Postings</div>
                      <div style={{fontSize:12,color:T.accent,marginTop:4,fontFamily:inter}}>Double-entry bookkeeping postings for this asset (PTA compliant)</div>
                    </div>

                    {/* Table */}
                    <div style={{overflowX:"auto"}}>
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead>
                          <tr style={{borderBottom:`1px solid ${T.border}`}}>
                            <th style={{padding:"10px 18px",textAlign:"left",width:156,fontSize:12,fontWeight:500,color:T.muted,fontFamily:inter,letterSpacing:"0.01em",whiteSpace:"nowrap"}}>Date</th>
                            <th style={{padding:"10px 18px",textAlign:"left",fontSize:12,fontWeight:500,color:T.muted,fontFamily:inter,letterSpacing:"0.01em"}}>Account</th>
                            <th style={{padding:"10px 18px",textAlign:"left",fontSize:12,fontWeight:500,color:T.muted,fontFamily:inter,letterSpacing:"0.01em"}}>Description</th>
                            <th style={{padding:"10px 18px",textAlign:"right",width:170,fontSize:12,fontWeight:500,color:T.muted,fontFamily:inter,letterSpacing:"0.01em"}}>Debit</th>
                            <th style={{padding:"10px 18px",textAlign:"right",width:170,fontSize:12,fontWeight:500,color:T.muted,fontFamily:inter,letterSpacing:"0.01em"}}>Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableRows.map((row, ri) => (
                            <tr key={ri} style={{borderBottom:`1px solid ${T.border}`}}>
                              {/* Date col — two-line when first row of txn */}
                              <td style={{padding:"12px 18px",verticalAlign:"top",width:156}}>
                                {row.date ? (
                                  <>
                                    <div style={{fontSize:13,fontWeight:400,color:T.text,fontFamily:inter,whiteSpace:"nowrap"}}>{row.date}</div>
                                    <div style={{fontSize:11,color:T.dim,marginTop:2,fontFamily:inter}}>{daysAgo(row.date)}</div>
                                  </>
                                ) : null}
                              </td>
                              {/* Account — monospace */}
                              <td style={{padding:"12px 18px",verticalAlign:"top"}}>
                                <span style={{fontFamily:mono,fontSize:13,color:T.text,fontWeight:400}}>{row.account}</span>
                              </td>
                              {/* Description — Inter muted */}
                              <td style={{padding:"12px 18px",verticalAlign:"top",fontSize:13,color:T.muted,fontFamily:inter}}>
                                {row.desc}
                              </td>
                              {/* Debit */}
                              <td style={{padding:"12px 18px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                                {!row.isCredit
                                  ? <span style={{fontSize:13,fontWeight:700,color:T.up,fontFamily:inter}}>{row.amount}</span>
                                  : <span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                              </td>
                              {/* Credit */}
                              <td style={{padding:"12px 18px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                                {row.isCredit
                                  ? <span style={{fontSize:13,fontWeight:700,color:T.down,fontFamily:inter}}>{row.amount}</span>
                                  : <span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Legend */}
                    <div style={{padding:"16px 22px",borderTop:`1px solid ${T.border}`,background:T.sidebar}}>
                      <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:8,fontFamily:inter}}>Double-Entry Accounting</div>
                      <div style={{display:"flex",flexDirection:"column",gap:3}}>
                        <div style={{fontSize:12,color:T.muted,fontFamily:inter}}>
                          • <span style={{color:T.up,fontWeight:600}}>Debit (Dr):</span> Increases asset accounts, shown in green
                        </div>
                        <div style={{fontSize:12,color:T.muted,fontFamily:inter}}>
                          • <span style={{color:T.down,fontWeight:600}}>Credit (Cr):</span> Decreases asset accounts, shown in red
                        </div>
                      </div>
                      <div style={{fontSize:11,color:T.dim,marginTop:10,fontFamily:inter}}>Every transaction has equal debits and credits (sum = 0)</div>
                    </div>
                  </div>
                );
        })()}
        {propTab === "rental" && p.isRented && (
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              {[
                {l:"Monthly Rent",  v:`${sym}${(p.monthlyRent||0).toLocaleString()}`,            c:T.accent},
                {l:"Annual Rent",   v:`${sym}${((p.monthlyRent||0)*12).toLocaleString()}`,        c:T.text},
                {l:"Gross Yield",   v:p.currentValuation?`${((p.monthlyRent*12)/p.currentValuation*100).toFixed(2)}%`:"—", c:T.up},
              ].map(s => (
                <div key={s.l} style={{background:T.inputBg,borderRadius:10,padding:"14px 16px"}}>
                  <div style={{fontSize:11,color:T.muted}}>{s.l}</div>
                  <div style={{fontSize:17,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div>
                </div>
              ))}
            </div>

            <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"11px 16px",background:T.accentBg,fontSize:13,fontWeight:700,color:T.accent}}>👤 Tenant</div>
              {editing && ef ? (
                <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
                  <div><Label>Tenant Name</Label><Input value={ef.tenantName} onChange={e=>setEF("tenantName",e.target.value)}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div><Label>Monthly Rent ({sym})</Label><Input type="number" value={ef.monthlyRent} onChange={e=>setEF("monthlyRent",parseFloat(e.target.value)||0)}/></div>
                    <div></div>
                    <div><Label>Lease Start</Label><Input type="date" value={ef.leaseStart} onChange={e=>setEF("leaseStart",e.target.value)}/></div>
                    <div><Label>Lease End</Label><Input type="date" value={ef.leaseEnd} onChange={e=>setEF("leaseEnd",e.target.value)}/></div>
                  </div>
                  <button onClick={()=>{
                    setEF("isRented", false);
                    setEF("purpose", "Vacant");
                    setEF("monthlyRent", 0);
                    setEF("tenantName", "");
                    setEF("leaseStart", "");
                    setEF("leaseEnd", "");
                  }}
                    style={{padding:"9px 14px",borderRadius:8,border:"1px solid #FDE68A",background:"#FFFBEB",color:"#D97706",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,textAlign:"left"}}>
                    🏚 Mark as Vacant
                  </button>
                </div>
              ) : (
                [
                  ["Tenant Name",  p.tenantName||"—"],
                  ["Monthly Rent", `${sym}${(p.monthlyRent||0).toLocaleString()}`],
                  ["Lease Start",  p.leaseStart||"—"],
                  ["Lease End",    p.leaseEnd||"—"],
                ].map(([k,v]) => (
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                    <span style={{fontSize:12,color:T.muted}}>{k}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{v}</span>
                  </div>
                ))
              )}
            </div>

            {!editing && (
              <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"11px 16px",background:T.inputBg,fontSize:13,fontWeight:700}}>📊 Monthly Cash Flow</div>
                {[
                  ["Rental Income", "in",  p.monthlyRent||0],
                  ["Mortgage",      "out", monthly],
                  ["MCST / Strata", "out", p.mcstFee||0],
                  ["Maintenance",   "out", p.maintenanceFee||0],
                ].filter(r => r[2] > 0).map(([lbl,dir,amt]) => (
                  <div key={lbl} style={{display:"flex",justifyContent:"space-between",padding:"9px 16px",borderTop:`1px solid ${T.border}`}}>
                    <span style={{fontSize:12,color:T.muted}}>{lbl}</span>
                    <span style={{fontSize:12,fontWeight:600,color:dir==="in"?T.up:T.down}}>{dir==="in"?"+":"-"}{sym}{amt.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",padding:"11px 16px",borderTop:`2px solid ${T.border}`,
                  background:((p.monthlyRent||0)-monthly-(p.mcstFee||0)-(p.maintenanceFee||0))>=0?T.upBg:T.downBg}}>
                  <span style={{fontSize:13,fontWeight:700}}>Net Monthly</span>
                  <span style={{fontSize:14,fontWeight:800,
                    color:((p.monthlyRent||0)-monthly-(p.mcstFee||0)-(p.maintenanceFee||0))>=0?T.up:T.down}}>
                    {((p.monthlyRent||0)-monthly-(p.mcstFee||0)-(p.maintenanceFee||0))>=0?"+":"-"}
                    {sym}{Math.abs((p.monthlyRent||0)-monthly-(p.mcstFee||0)-(p.maintenanceFee||0)).toLocaleString()}
                  </span>
                </div>
                {p.annualTax>0 && (
                  <div style={{display:"flex",justifyContent:"space-between",padding:"8px 16px",borderTop:`1px solid ${T.border}`,background:T.warnBg}}>
                    <span style={{fontSize:11,color:T.warn}}>⚠️ {ctry.taxLabel} (annual — not in monthly calc)</span>
                    <span style={{fontSize:11,fontWeight:700,color:T.warn}}>{sym}{(p.annualTax).toLocaleString()}/yr</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── COSTS ── */}
        {propTab === "costs" && (
          <>
            <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"11px 16px",background:T.inputBg,fontSize:13,fontWeight:700}}>💸 Acquisition Costs</div>
              {editing && ef ? (
                <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div><Label>{ctry.stampLabel} ({sym})</Label><Input type="number" value={ef.stampDuty} onChange={e=>setEF("stampDuty",parseFloat(e.target.value)||0)}/></div>
                    <div><Label>Agent Fee ({sym})</Label><Input type="number" value={ef.agentFee} onChange={e=>setEF("agentFee",parseFloat(e.target.value)||0)}/></div>
                    <div><Label>Other Fees ({sym})</Label><Input type="number" value={ef.otherFees} onChange={e=>setEF("otherFees",parseFloat(e.target.value)||0)}/></div>
                  </div>
                </div>
              ) : (
                [
                  [ctry.stampLabel,        p.stampDuty>0?`${sym}${p.stampDuty.toLocaleString()}`:"—"],
                  ["Agent / Legal Fee",    p.agentFee>0?`${sym}${p.agentFee.toLocaleString()}`:"—"],
                  ["Other Fees",           p.otherFees>0?`${sym}${p.otherFees.toLocaleString()}`:"—"],
                  ["Total Acquisition",    `${sym}${((p.purchasePrice||0)+(p.stampDuty||0)+(p.agentFee||0)+(p.otherFees||0)).toLocaleString()}`],
                ].map(([k,v],i) => (
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`${i===3?"2":"1"}px solid ${T.border}`,background:i===3?T.inputBg:T.bg}}>
                    <span style={{fontSize:12,color:i===3?T.text:T.muted,fontWeight:i===3?700:400}}>{k}</span>
                    <span style={{fontSize:12,fontWeight:700}}>{v}</span>
                  </div>
                ))
              )}
            </div>

            <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"11px 16px",background:T.inputBg,fontSize:13,fontWeight:700}}>🔄 Ongoing Costs</div>
              {editing && ef ? (
                <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div><Label>{ctry.taxLabel} /yr ({sym})</Label><Input type="number" value={ef.annualTax} onChange={e=>setEF("annualTax",parseFloat(e.target.value)||0)}/></div>
                    <div><Label>MCST / Strata /mo ({sym})</Label><Input type="number" value={ef.mcstFee} onChange={e=>setEF("mcstFee",parseFloat(e.target.value)||0)}/></div>
                    <div><Label>Maintenance /mo ({sym})</Label><Input type="number" value={ef.maintenanceFee} onChange={e=>setEF("maintenanceFee",parseFloat(e.target.value)||0)}/></div>
                  </div>
                </div>
              ) : (
                [
                  [ctry.taxLabel+" (annual)", p.annualTax>0?`${sym}${p.annualTax.toLocaleString()}/yr`:"—"],
                  ["MCST / Strata Fee",       p.mcstFee>0?`${sym}${p.mcstFee.toLocaleString()}/mo`:"—"],
                  ["Maintenance",             p.maintenanceFee>0?`${sym}${p.maintenanceFee.toLocaleString()}/mo`:"—"],
                  ["Total Annual Ongoing",    `${sym}${((p.annualTax||0)+(p.mcstFee||0)*12+(p.maintenanceFee||0)*12).toLocaleString()}/yr`],
                ].map(([k,v],i) => (
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`${i===3?"2":"1"}px solid ${T.border}`,background:i===3?T.inputBg:T.bg}}>
                    <span style={{fontSize:12,color:i===3?T.text:T.muted,fontWeight:i===3?700:400}}>{k}</span>
                    <span style={{fontSize:12,fontWeight:700}}>{v}</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ── INSURANCE ── */}
        {propTab === "insurance" && (() => {
          const homePolicies = (policies||[]).filter(pol =>
            pol.type === "Home" || pol.type === "Fire" || pol.type === "Mortgage Protection"
          );
          const linked = homePolicies.find(pol => pol.id === p.linkedInsuranceId);
          const STATUS_COLOR = {
            Active:  { bg:"#F0FDF4", color:"#15803D", border:"#BBF7D0" },
            Expired: { bg:"#FEF2F2", color:"#DC2626", border:"#FECACA" },
            Lapsed:  { bg:"#FEF2F2", color:"#DC2626", border:"#FECACA" },
            Pending: { bg:"#FFFBEB", color:"#D97706", border:"#FDE68A" },
            Overdue: { bg:"#FFF7ED", color:"#EA580C", border:"#FED7AA" },
          };
          const linkPolicy = (polId) => {
            setProperties(prev => prev.map(pr => pr.id === p.id ? {...pr, linkedInsuranceId: polId} : pr));
            showToast("Insurance policy linked", "success");
          };
          const unlinkPolicy = () => {
            setProperties(prev => prev.map(pr => pr.id === p.id ? {...pr, linkedInsuranceId: null} : pr));
            showToast("Insurance link removed", "success");
          };
          return (
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {linked ? (
                <>
                  <div style={{background:T.selected,borderRadius:14,padding:"18px 20px"}}>
                    <div style={{fontSize:11,color:"#9CA3AF",fontWeight:600,marginBottom:12}}>LINKED HOME INSURANCE</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontSize:15,fontWeight:800,color:"white"}}>{linked.planName}</div>
                        <div style={{fontSize:12,color:"#9CA3AF",marginTop:3}}>{linked.insurer} · {linked.policyNo}</div>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:6,
                        background:linked.status==="Active"?"#16A34A":"#DC2626",color:"white"}}>
                        {linked.status}
                      </span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginTop:14}}>
                      {[
                        {l:"Sum Assured", v:`${linked.currency} ${(linked.sumAssured||0).toLocaleString()}`},
                        {l:"Premium",     v:`${linked.currency} ${(linked.premium||0).toLocaleString()} / ${linked.premFreq}`},
                        {l:"Next Due",    v:linked.nextPremDue||"—"},
                      ].map(s=>(
                        <div key={s.l}>
                          <div style={{fontSize:10,color:"#9CA3AF"}}>{s.l}</div>
                          <div style={{fontSize:13,fontWeight:700,color:"white",marginTop:3}}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                    <div style={{padding:"11px 16px",background:T.inputBg,fontSize:13,fontWeight:700}}>📋 Policy Details</div>
                    {[
                      ["Policy Type",     linked.type],
                      ["Insured Name",    linked.insuredName||"—"],
                      ["Policy Period",   linked.startDate&&linked.endDate?`${linked.startDate} → ${linked.endDate}`:"—"],
                      ["Total Prem Paid", `${linked.currency} ${(linked.totalPremPaid||0).toLocaleString()}`],
                    ].map(([k,v])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                        <span style={{fontSize:12,color:T.muted}}>{k}</span>
                        <span style={{fontSize:12,fontWeight:600}}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {((linked.riders||[]).length>0||(linked.exclusions||[]).length>0) && (
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      {(linked.riders||[]).length>0 && (
                        <div style={{background:T.upBg,border:`1px solid #BBF7D0`,borderRadius:10,padding:"12px 14px"}}>
                          <div style={{fontSize:11,fontWeight:700,color:T.up,marginBottom:8}}>✅ Coverage / Riders</div>
                          {linked.riders.map(r=><div key={r} style={{fontSize:12,color:T.text,padding:"2px 0"}}>{r}</div>)}
                        </div>
                      )}
                      {(linked.exclusions||[]).length>0 && (
                        <div style={{background:T.downBg,border:`1px solid #FECACA`,borderRadius:10,padding:"12px 14px"}}>
                          <div style={{fontSize:11,fontWeight:700,color:T.down,marginBottom:8}}>⛔ Exclusions</div>
                          {linked.exclusions.map(e=><div key={e} style={{fontSize:12,color:T.text,padding:"2px 0"}}>{e}</div>)}
                        </div>
                      )}
                    </div>
                  )}

                  {linked.notes && (
                    <div style={{background:T.inputBg,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.muted,lineHeight:1.6}}>
                      📝 {linked.notes}
                    </div>
                  )}

                  <button onClick={unlinkPolicy}
                    style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,width:"100%",textAlign:"center"}}>
                    🔗 Unlink this policy
                  </button>
                </>
              ) : (
                <>
                  <div style={{background:T.warnBg,border:`1px solid #FDE68A`,borderRadius:10,padding:"14px 16px",fontSize:13,color:T.warn}}>
                    ⚠️ No home insurance linked. Link a policy below to track coverage here.
                  </div>
                  {homePolicies.length===0 ? (
                    <div style={{textAlign:"center",padding:"32px 20px",color:T.muted}}>
                      <div style={{fontSize:28,marginBottom:8}}>🏠</div>
                      <div style={{fontSize:14,fontWeight:600}}>No Home policies found</div>
                      <div style={{fontSize:12,marginTop:6}}>Add a Home or Fire policy in the Insurance tab first.</div>
                    </div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      <div style={{fontSize:12,fontWeight:600,color:T.muted}}>Available Home / Fire Policies</div>
                      {homePolicies.map(pol=>{
                        const sc = STATUS_COLOR[pol.status]||STATUS_COLOR.Pending;
                        return (
                          <div key={pol.id} style={{border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <div style={{fontSize:13,fontWeight:700}}>{pol.planName}</div>
                              <div style={{fontSize:11,color:T.muted,marginTop:2}}>{pol.insurer} · {pol.policyNo}</div>
                              <div style={{display:"flex",gap:8,marginTop:6,alignItems:"center"}}>
                                <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:5,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>{pol.status}</span>
                                <span style={{fontSize:11,color:T.muted}}>Assured: {pol.currency} {(pol.sumAssured||0).toLocaleString()}</span>
                              </div>
                            </div>
                            <button onClick={()=>linkPolicy(pol.id)}
                              style={{padding:"7px 16px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,whiteSpace:"nowrap",marginLeft:12}}>
                              Link
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}
      </div></div>
      {showAddContract && <AddContractModal onClose={()=>setShowAddContract(false)}/>}
      {showAddRepay && <AddRepayModal onClose={()=>setShowAddRepay(false)}/>}
      {showSold && <SoldModal onClose={()=>setShowSold(false)}/>}
    </div>
  );
}

/* ── Real Estate Screen ─────────────────────────────────────────── */
function RealEstateScreen({ properties, setProperties, policies, showToast }) {
  const isMobile = useIsMobile();
  const [selectedProp, setSelectedProp] = useState(null);
  const [propTab,    setPropTab]    = useState("overview");
  const [showAdd,    setShowAdd]    = useState(false);
  const [filterCtry, setFilterCtry] = useState("All");
  const [filterPurp, setFilterPurp] = useState("All");
  const [searchQ,    setSearchQ]    = useState("");
  const reSort = useSortState();
  const [addForm,    setAddForm]    = useState({...EMPTY_PROP});
  const setF = (k, v) => setAddForm(f => ({...f, [k]: v}));

  const filtered = properties.filter(p => {
    if (filterCtry !== "All" && p.country !== filterCtry) return false;
    if (filterPurp !== "All" && p.purpose !== filterPurp) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      const name = (p.name||"").toLowerCase();
      const addr = (p.address||"").toLowerCase();
      if (!name.includes(q) && !addr.includes(q)) return false;
    }
    return true;
  });

  const totalValue = properties.reduce((s,p) => s + (p.currentValuation||p.purchasePrice||0), 0);
  const totalLoan  = properties.reduce((s,p) => s + (p.loanAmount||0), 0);
  const totalRent  = properties.filter(p=>p.isRented).reduce((s,p) => s + (p.monthlyRent||0), 0);
  const equity     = totalValue - totalLoan;
  const rentedCount = properties.filter(p=>p.isRented).length;

  const cp = RE_COUNTRIES[addForm.country] || RE_COUNTRIES.Singapore;
  const previewMonthly = calcMonthly(parseFloat(addForm.loanAmount)||0, parseFloat(addForm.interestRate)||0, parseInt(addForm.loanTenureYears)||25);

  const selPropData = selectedProp ? properties.find(x => x.id === selectedProp.id) : null;

  // Value by country breakdown
  const countryBreakdown = {};
  properties.forEach(p => {
    const val = p.currentValuation || p.purchasePrice || 0;
    countryBreakdown[p.country] = (countryBreakdown[p.country]||0) + val;
  });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>

      {/* ── Page header ── */}
      <div className="wo-page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:700}}>Property Portfolio</div>
          <div style={{fontSize:13,color:T.muted,marginTop:2}}>{properties.length} propert{properties.length!==1?"ies":"y"} · {rentedCount} rented</div>
        </div>
        <button onClick={()=>{setAddForm({...EMPTY_PROP,id:`P${Date.now()}`});setShowAdd(true);}}
          style={{background:T.selected,color:T.selectedText,border:"none",borderRadius:9,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
          + Add Property
        </button>
      </div>

      {/* ── Summary cards — 4 col grid ── */}
      <div className="wo-summary-grid" style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12,marginBottom:18}}>
        {[
          {label:"Total Valuation",value:fmtCompact(totalValue),sub:`${properties.length} properties`,icon:"🏠",color:T.text},
          {label:"Total Equity",value:fmtCompact(equity),sub:`${totalLoan>0?(equity/totalValue*100).toFixed(0)+"% equity ratio":"Fully owned"}`,icon:"📈",color:T.up},
          {label:"Outstanding Loans",value:fmtCompact(totalLoan),sub:`${properties.filter(p=>p.loanAmount>0).length} mortgaged`,icon:"🏦",color:totalLoan>0?T.down:T.muted},
          {label:"Monthly Rental",value:totalRent>0?fmtCompact(totalRent):"—",sub:totalRent>0?`${rentedCount} tenanted propert${rentedCount!==1?"ies":"y"}`:"No rental income",icon:"🔑",color:totalRent>0?T.up:T.muted},
        ].map((c,i)=>(
          <Card key={i} style={{padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{fontSize:12,color:T.muted,fontWeight:500}}>{c.label}</div>
              <span style={{fontSize:20}}>{c.icon}</span>
            </div>
            <div style={{fontSize:22,fontWeight:700,marginTop:8,color:T.text}}>{c.value}</div>
            <div style={{fontSize:11,color:T.dim,marginTop:4}}>{c.sub}</div>
          </Card>
        ))}
      </div>

      {/* ── Value by country — like insurance coverage bar ── */}
      {Object.keys(countryBreakdown).length > 0 && (
        <Card style={{padding:"16px 20px",marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Portfolio Value by Country</div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
            {Object.entries(countryBreakdown).map(([country, val])=>{
              const pct = totalValue > 0 ? (val/totalValue*100).toFixed(0) : 0;
              const ctry = RE_COUNTRIES[country] || RE_COUNTRIES.Singapore;
              const countryColors = {"Singapore":"#E31837","Malaysia":"#003B95","Australia":"#FFB81C","United Kingdom":"#003DA5","Japan":"#BC002D","New Zealand":"#00247D"};
              const cc = countryColors[country] || T.muted;
              return (
                <div key={country} style={{flex:"1 1 140px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:12,color:T.muted,fontWeight:500}}>{ctry.flag} {country}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{pct}%</span>
                  </div>
                  <div style={{height:6,background:T.inputBg,borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:cc,borderRadius:3}}/>
                  </div>
                  <div style={{fontSize:11,color:T.dim,marginTop:4}}>{fmtCompact(val)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Filter toolbar ── */}
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:"1 1 200px"}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.dim,pointerEvents:"none"}}>🔍</span>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search name, address…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px 8px 34px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["All",...COUNTRIES_LIST].map(c=>(
            <button key={c} onClick={()=>setFilterCtry(c)}
              style={{background:filterCtry===c?T.selected:T.inputBg,color:filterCtry===c?T.selectedText:T.muted,border:`1px solid ${filterCtry===c?T.selected:T.border}`,borderRadius:7,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:filterCtry===c?600:400}}>
              {c==="All"?"All":RE_COUNTRIES[c].flag+" "+c}
            </button>
          ))}
        </div>
        <select value={filterPurp} onChange={e=>setFilterPurp(e.target.value)}
          style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 12px",fontSize:12,fontFamily:"inherit",color:T.text,cursor:"pointer",outline:"none"}}>
          {["All",...RE_PURPOSE].map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <span style={{fontSize:12,color:T.muted,marginLeft:"auto"}}>{filtered.length} of {properties.length}</span>
      </div>

      {/* ── Property table / mobile cards ── */}
      {filtered.length === 0 ? (
        <Card style={{padding:"48px 24px",textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>🏠</div>
          <div style={{fontSize:14,fontWeight:600}}>No properties found</div>
          <div style={{fontSize:12,color:T.muted,marginTop:4}}>Try adjusting filters or add a new property</div>
        </Card>
      ) : isMobile ? (
        <Card style={{padding:0,overflow:"hidden"}}>
          {filtered.map(p => {
            const ctry = RE_COUNTRIES[p.country] || RE_COUNTRIES.Singapore;
            const sc = RE_STATUS_COLORS[p.purpose] || RE_STATUS_COLORS["Vacant"];
            return <MobileListItem key={p.id} onClick={()=>{setSelectedProp(p);setPropTab("overview");}}
              icon={ctry.flag} iconBg={T.inputBg} title={p.name} subtitle={`${p.type||"—"} · ${p.country}`}
              value={fmtCompact(p.currentValuation||p.purchasePrice||0)} valueColor={T.text}
              valueSub={p.isRented?`+${fmtCompact(p.monthlyRent)}/mo`:(p.loanAmount>0?`Loan: ${fmtCompact(p.loanAmount)}`:"")}
              badge={p.sold?"Sold":p.purpose} badgeBg={p.sold?T.downBg:sc.bg} badgeColor={p.sold?T.down:sc.color}
            />;
          })}
        </Card>
      ) : (
        <Card style={{padding:0,overflowX:"auto"}} className="wo-table-scroll">
          <SortHeader gridCols="2.2fr 1fr 1.2fr 1fr 1fr 0.8fr" sortKey={reSort.sortKey} sortDir={reSort.sortDir} onSort={reSort.onSort}
            columns={[["Property","left","name"],["Type / Tenure","left","type"],["Valuation","right","valuation"],["Loan / Equity","right","loan"],["Rental","right","rental"],["Status","left","purpose"]]}/>
          {reSort.sortFn(filtered, (p, k) => {
            if (k==="name") return (p.name||"").toLowerCase();
            if (k==="type") return (p.type||"").toLowerCase();
            if (k==="valuation") return p.currentValuation||p.purchasePrice||0;
            if (k==="loan") return p.loanAmount||0;
            if (k==="rental") return p.isRented ? (p.monthlyRent||0) : 0;
            if (k==="purpose") return p.sold ? "zzz" : (p.purpose||"");
            return 0;
          }).map((p,i)=>{
            const ctry = RE_COUNTRIES[p.country] || RE_COUNTRIES.Singapore;
            const gain = (p.currentValuation||0) - (p.purchasePrice||0);
            const sc = RE_STATUS_COLORS[p.purpose] || RE_STATUS_COLORS["Vacant"];
            const propEquity = (p.currentValuation||p.purchasePrice||0) - (p.loanAmount||0);
            const insured = !!(policies||[]).find(pol=>pol.id===p.linkedInsuranceId);
            return (
              <div key={p.id} onClick={()=>{setSelectedProp(p);setPropTab("overview");}}
                style={{display:"grid",gridTemplateColumns:"2.2fr 1fr 1.2fr 1fr 1fr 0.8fr",padding:"13px 20px",borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none",alignItems:"center",cursor:"pointer",
                  opacity:p.sold?0.55:1,background:p.sold?T.sidebar:""}}
                onMouseEnter={e=>e.currentTarget.style.background=T.hover}
                onMouseLeave={e=>e.currentTarget.style.background=(p.sold?T.sidebar:"")}>
                {/* Property */}
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{width:34,height:34,borderRadius:9,background:T.inputBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{ctry.flag}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{p.name}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:1}}>{p.address ? (p.address.length>35 ? p.address.slice(0,35)+"…" : p.address) : p.country}</div>
                  </div>
                </div>
                {/* Type / Tenure */}
                <div>
                  <div style={{fontSize:12,color:T.text}}>{p.type || "—"}</div>
                  <div style={{fontSize:10,color:T.dim,marginTop:1}}>{p.tenure || "—"}</div>
                </div>
                {/* Valuation */}
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,fontWeight:700}}>{fmtCompact(p.currentValuation||p.purchasePrice||0)}</div>
                  <div style={{fontSize:10,color:gain>=0?T.up:T.down,marginTop:1}}>{gain>=0?"+":""}{fmtCompact(gain)}</div>
                </div>
                {/* Loan / Equity */}
                <div style={{textAlign:"right"}}>
                  {p.loanAmount > 0 ? (
                    <>
                      <div style={{fontSize:12,color:T.down}}>Loan: {fmtCompact(p.loanAmount)}</div>
                      <div style={{fontSize:10,color:T.up,marginTop:1}}>Eq: {fmtCompact(propEquity)}</div>
                    </>
                  ) : (
                    <div style={{fontSize:12,fontWeight:600,color:T.up}}>Fully owned</div>
                  )}
                </div>
                {/* Rental */}
                <div style={{textAlign:"right"}}>
                  {p.isRented ? (
                    <div style={{fontSize:13,fontWeight:600,color:T.up}}>+{fmtCompact(p.monthlyRent)}/mo</div>
                  ) : <span style={{fontSize:12,color:T.dim}}>—</span>}
                </div>
                {/* Status */}
                <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
                  {p.sold ? (
                    <Badge bg={T.downBg} color={T.down}>Sold</Badge>
                  ) : (
                    <Badge bg={sc.bg} color={sc.color}>{p.purpose.length>12?p.purpose.slice(0,12)+"…":p.purpose}</Badge>
                  )}
                  {insured && <span style={{width:7,height:7,borderRadius:"50%",background:T.up,display:"inline-block"}} title="Insured"/>}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ══ PROPERTY DETAIL DRAWER — slide-in overlay ══ */}
      {selPropData && (
        <div className="wo-drawer-overlay" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}
          onClick={e=>{if(e.target===e.currentTarget){setSelectedProp(null);}}}>
          <div style={{width:"min(960px, 95vw)",height:"100vh",background:T.bg,overflow:"hidden",boxShadow:"-4px 0 32px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column"}}>
            <REDrawer
              key={selPropData.id}
              p={selPropData}
              properties={properties}
              setProperties={setProperties}
              policies={policies}
              propTab={propTab}
              setPropTab={setPropTab}
              showToast={showToast}
              onClose={()=>setSelectedProp(null)}
            />
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      {showAdd && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
          onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false);}}>
          <div style={{background:T.bg,borderRadius:16,width:"100%",maxWidth:560,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>

            <div style={{padding:"18px 24px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,borderRadius:"16px 16px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:15,fontWeight:700}}>Add Property {RE_COUNTRIES[addForm.country] && RE_COUNTRIES[addForm.country].flag}</div>
              <button onClick={()=>setShowAdd(false)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 12px",fontSize:13,cursor:"pointer",color:T.muted}}>Cancel</button>
            </div>

            <div style={{padding:"22px 24px",display:"flex",flexDirection:"column",gap:16}}>

              <div>
                <Label>Country</Label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {COUNTRIES_LIST.map(c => (
                    <button key={c} onClick={()=>{setF("country",c);setF("type","");setF("tenure","");}}
                      style={{padding:"7px 12px",borderRadius:8,border:`1px solid ${addForm.country===c?T.selected:T.border}`,background:addForm.country===c?T.selected:T.inputBg,color:addForm.country===c?T.selectedText:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:addForm.country===c?700:400}}>
                      {RE_COUNTRIES[c].flag} {c}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{gridColumn:"span 2"}}><Label>Property Name / Label</Label><Input placeholder="e.g. Tampines HDB, London Flat" value={addForm.name} onChange={e=>setF("name",e.target.value)}/></div>
                <div style={{gridColumn:"span 2"}}><Label>Address</Label><Input placeholder="Street address" value={addForm.address} onChange={e=>setF("address",e.target.value)}/></div>
                <div><Label>Postal / ZIP Code</Label><Input value={addForm.postalCode} onChange={e=>setF("postalCode",e.target.value)}/></div>
                <div>
                  <Label>Purpose</Label>
                  <select value={addForm.purpose} onChange={e=>{setF("purpose",e.target.value);setF("isRented",e.target.value==="Investment / Rental");}}
                    style={{width:"100%",padding:"9px 10px",borderRadius:8,border:`1px solid ${T.border}`,background:T.inputBg,fontFamily:"inherit",fontSize:13,color:T.text,outline:"none"}}>
                    {RE_PURPOSE.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <Label>Property Type</Label>
                  <select value={addForm.type} onChange={e=>setF("type",e.target.value)}
                    style={{width:"100%",padding:"9px 10px",borderRadius:8,border:`1px solid ${addForm.type?T.selected:T.border}`,background:T.inputBg,fontFamily:"inherit",fontSize:13,color:addForm.type?T.text:T.muted,outline:"none"}}>
                    <option value="" disabled>Select type…</option>
                    {(RE_PROPERTY_TYPES[addForm.country]||[]).map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Tenure</Label>
                  <select value={addForm.tenure} onChange={e=>setF("tenure",e.target.value)}
                    style={{width:"100%",padding:"9px 10px",borderRadius:8,border:`1px solid ${T.border}`,background:T.inputBg,fontFamily:"inherit",fontSize:13,color:T.text,outline:"none"}}>
                    <option value="">Select tenure…</option>
                    {(RE_TENURES[addForm.country]||[]).map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><Label>Size (sqft)</Label><Input type="number" placeholder="0" value={addForm.sizeSqft||""} onChange={e=>setF("sizeSqft",e.target.value)}/></div>
                <div><Label>Purchase Date</Label><Input type="date" value={addForm.purchaseDate} onChange={e=>setF("purchaseDate",e.target.value)}/></div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><Label>Purchase Price ({cp.symbol})</Label><Input type="number" prefix={cp.symbol} placeholder="0" value={addForm.purchasePrice||""} onChange={e=>setF("purchasePrice",parseFloat(e.target.value)||0)}/></div>
                <div><Label>Current Valuation ({cp.symbol})</Label><Input type="number" prefix={cp.symbol} placeholder="Same as purchase" value={addForm.currentValuation||""} onChange={e=>setF("currentValuation",parseFloat(e.target.value)||0)}/></div>
              </div>

              <div style={{background:T.inputBg,borderRadius:12,padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
                <div style={{fontSize:12,fontWeight:700,color:T.muted}}>🏦 Loan (optional)</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                  <div><Label>Loan Amount</Label><Input type="number" placeholder="0" value={addForm.loanAmount||""} onChange={e=>setF("loanAmount",parseFloat(e.target.value)||0)}/></div>
                  <div><Label>Rate (% p.a.)</Label><Input type="number" step="0.01" placeholder="0.00" value={addForm.interestRate||""} onChange={e=>setF("interestRate",parseFloat(e.target.value)||0)}/></div>
                  <div><Label>Tenure (yrs)</Label><Input type="number" placeholder="25" value={addForm.loanTenureYears||""} onChange={e=>setF("loanTenureYears",parseInt(e.target.value)||25)}/></div>
                </div>
                {previewMonthly > 0 && (
                  <div style={{background:T.bg,borderRadius:8,padding:"9px 13px",fontSize:12,color:T.muted}}>
                    Est. monthly: <strong style={{color:T.text}}>{cp.symbol}{previewMonthly.toLocaleString()}</strong>
                  </div>
                )}
              </div>

              {addForm.purpose === "Investment / Rental" && (
                <div style={{background:T.inputBg,borderRadius:12,padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.muted}}>🏘 Rental Info</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div><Label>Monthly Rent ({cp.symbol})</Label><Input type="number" placeholder="0" value={addForm.monthlyRent||""} onChange={e=>setF("monthlyRent",parseFloat(e.target.value)||0)}/></div>
                    <div><Label>Tenant Name</Label><Input placeholder="Tenant or company" value={addForm.tenantName} onChange={e=>setF("tenantName",e.target.value)}/></div>
                    <div><Label>Lease Start</Label><Input type="date" value={addForm.leaseStart} onChange={e=>setF("leaseStart",e.target.value)}/></div>
                    <div><Label>Lease End</Label><Input type="date" value={addForm.leaseEnd} onChange={e=>setF("leaseEnd",e.target.value)}/></div>
                  </div>
                </div>
              )}

              <div style={{background:T.inputBg,borderRadius:12,padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
                <div style={{fontSize:12,fontWeight:700,color:T.muted}}>💸 Costs & Fees (optional)</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div><Label>{cp.stampLabel} ({cp.symbol})</Label><Input type="number" placeholder="0" value={addForm.stampDuty||""} onChange={e=>setF("stampDuty",parseFloat(e.target.value)||0)}/></div>
                  <div><Label>Agent / Legal Fee</Label><Input type="number" placeholder="0" value={addForm.agentFee||""} onChange={e=>setF("agentFee",parseFloat(e.target.value)||0)}/></div>
                  <div><Label>{cp.taxLabel} /yr</Label><Input type="number" placeholder="0" value={addForm.annualTax||""} onChange={e=>setF("annualTax",parseFloat(e.target.value)||0)}/></div>
                  <div><Label>MCST / Strata /mo</Label><Input type="number" placeholder="0" value={addForm.mcstFee||""} onChange={e=>setF("mcstFee",parseFloat(e.target.value)||0)}/></div>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <textarea value={addForm.notes} onChange={e=>setF("notes",e.target.value)} placeholder="Any additional notes…"
                  style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none",resize:"vertical",minHeight:64,lineHeight:1.6}}/>
              </div>

              <button onClick={()=>{
                if (!addForm.country || !addForm.name || !addForm.purchasePrice) {
                  showToast("Country, Name and Purchase Price are required","error");
                  return;
                }
                setProperties(prev=>[...prev,{
                  ...addForm,
                  currentValuation: addForm.currentValuation || addForm.purchasePrice,
                  loanTenureYears: parseInt(addForm.loanTenureYears)||25,
                  isRented: addForm.purpose==="Investment / Rental",
                }]);
                setShowAdd(false);
                showToast("Property added","success");
              }}
                style={{padding:"13px",borderRadius:10,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700}}>
                Add Property
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InsuranceScreen({ policies, setPolicies, accounts, setAccounts, showToast }) {
  const isMobile = useIsMobile();
  const [insTab, setInsTab] = useState("overview");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const insSort = useSortState();
  const [detailTab, setDetailTab] = useState("overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimTarget, setClaimTarget] = useState(null);
  const [txSearch, setTxSearch] = useState("");
  const [txFilter, setTxFilter] = useState("All");
  const [txSort, setTxSort] = useState("desc");
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [closureTarget, setClosureTarget] = useState(null);

  // ── Empty form
  const EMPTY_POLICY = {
    type: "", insurer: "", policyNo: "", planName: "", status: "Active",
    sumAssured: "", cashValue: "", surrenderValue: "", ilpFundValue: "",
    currency: "SGD", premium: "", premFreq: "Yearly", totalPremPaid: "",
    startDate: "", endDate: "", nextPremDue: "", insuredName: "Dilwyn",
    reminderEnabled: true, reminderDays: 14,
    dob: "", beneficiary: "", riders: [], exclusions: [], notes: "",
    claims: [], documents: [],
    riderInput: "", exclusionInput: "",
  };
  const EMPTY_CLAIM = { type: "", date: "", amount: "", status: "Pending", notes: "" };
  const [form, setForm] = useState(EMPTY_POLICY);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [claimForm, setClaimForm] = useState(EMPTY_CLAIM);
  const setCF = (k, v) => setClaimForm(f => ({ ...f, [k]: v }));

  // ── Summary stats
  const active = policies.filter(p => p.status === "Active");
  const totalSumAssured = active.reduce((s, p) => s + (p.sumAssured || 0), 0);
  const totalPremPerYear = active.reduce((s, p) => {
    const mult = { Monthly: 12, Quarterly: 4, "Half-Yearly": 2, Yearly: 1, "Single Premium": 0, "N/A": 0 }[p.premFreq] || 1;
    return s + (parseFloat(p.premium) || 0) * mult;
  }, 0);
  const totalFundValue = active.reduce((s, p) => s + (p.ilpFundValue || 0), 0);
  const totalCashValue = active.reduce((s, p) => s + (p.cashValue || 0), 0);
  const pendingClaims = policies.flatMap(p => p.claims).filter(c => c.status === "Pending").length;

  // Group coverage breakdown
  const groupTotals = {};
  active.forEach(p => {
    const g = INS_TYPES[p.type] && INS_TYPES[p.type].group || "Other";
    groupTotals[g] = (groupTotals[g] || 0) + (p.sumAssured || 0);
  });

  // Filtered list
  const filtered = policies.filter(p => {
    const matchType = filterType === "All" || INS_TYPES[p.type] && INS_TYPES[p.type].group === filterType || p.type === filterType;
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    const matchSearch = !searchQ || p.planName.toLowerCase().includes(searchQ.toLowerCase()) || p.insurer.toLowerCase().includes(searchQ.toLowerCase()) || p.policyNo.toLowerCase().includes(searchQ.toLowerCase()) || p.type.toLowerCase().includes(searchQ.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  // Add policy submit
  const handleAddPolicy = () => {
    if (!form.type || !form.insurer || !form.policyNo) return;
    const newP = { ...form, id: Date.now(), riders: form.riders || [], exclusions: form.exclusions || [], claims: [], documents: [], riderInput: undefined, exclusionInput: undefined };
    setPolicies(prev => [...prev, newP]);
    setForm(EMPTY_POLICY);
    setShowAddModal(false);
    showToast("Policy added successfully", "success");
  };

  // Add claim
  const handleAddClaim = () => {
    if (!claimForm.type || !claimForm.date) return;
    const claim = { id: `C${Date.now()}`, ...claimForm, amount: parseFloat(claimForm.amount) || 0 };
    setPolicies(prev => prev.map(p => p.id === claimTarget.id ? { ...p, claims: [...(p.claims || []), claim] } : p));
    if (selectedPolicy && selectedPolicy.id === claimTarget.id) setSelectedPolicy(prev => ({ ...prev, claims: [...(prev.claims || []), claim] }));
    setClaimForm(EMPTY_CLAIM);
    setShowClaimModal(false);
    showToast("Claim recorded", "success");
  };

  const fmtCcy = (v) => v >= 1e6 ? `S$${(v/1e6).toFixed(2)}M` : `S$${v.toLocaleString()}`;
  const typeConf = (type) => INS_TYPES[type] || { icon: "📋", color: T.muted, bg: T.inputBg };

  // ── Tab groups for type filter
  const typeGroups = ["All", "Life", "Investment", "Health", "Accident", "General"];

  // ── Policy row chip
  const StatusChip = ({ status }) => {
    const cfg = { Active: [T.upBg, T.up], Lapsed: [T.downBg, T.down], Surrendered: [T.warnBg, T.warn], Matured: [T.accentBg, T.accent], Pending: [T.warnBg, T.warn], Cancelled: [T.downBg, T.down] }[status] || [T.inputBg, T.muted];
    return <Badge bg={cfg[0]} color={cfg[1]}>{status}</Badge>;
  };

  // ── Add premium transaction handler ──────────────────────────
  const handleAddPremiumTx = (polId, tx) => {
    setPolicies(prev => prev.map(p => p.id === polId
      ? { ...p,
          premiumTransactions: [...(p.premiumTransactions || []), tx],
          totalPremPaid: (p.totalPremPaid || 0) + (tx.status === "Paid" ? parseFloat(tx.amount) || 0 : 0),
        }
      : p
    ));
    if (tx.linkedAccountId && tx.status === "Paid" && setAccounts) {
      const totalDeducted = parseFloat(tx.amount || 0) + parseFloat(tx.fees || 0);
      setAccounts(prev => prev.map(a =>
        a.id === tx.linkedAccountId ? { ...a, balance: Math.max(0, a.balance - totalDeducted) } : a
      ));
    }
    setShowAddTxModal(false);
    showToast("Premium payment recorded", "success");
  };

  // ── Add Premium Transaction Modal ────────────────────────────
  const AddPremiumTxModal = ({ polId, premium, onClose }) => {
    const [f, setFLocal] = useState({
      date: new Date().toISOString().slice(0,10),
      amount: premium || "",
      fees: "",
      method: "GIRO",
      linkedAccountId: "",
      ref: "REF-" + Date.now().toString().slice(-6),
      status: "Paid",
      notes: "",
    });
    const upd = (k, v) => setFLocal(prev => ({...prev, [k]: v}));
    const selectedAcc = (accounts || []).find(a => a.id === f.linkedAccountId);
    const totalCost = (parseFloat(f.amount)||0) + (parseFloat(f.fees)||0);
    const hasSufficientFunds = !selectedAcc || selectedAcc.balance >= totalCost;
    const useAccount = f.method === "From Account";
    const iStyle = { width:"100%", boxSizing:"border-box", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"inherit", color:T.text, outline:"none" };
    const canSubmit = f.amount && f.date && (!useAccount || (f.linkedAccountId && hasSufficientFunds));

    return (
      <>
        <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:500}}/>
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:501,background:T.bg,border:`1px solid ${T.border}`,borderRadius:16,width:480,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.22)"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:T.bg,zIndex:1}}>
            <div style={{fontSize:15,fontWeight:700}}>Record Premium Payment</div>
            <button onClick={onClose} style={{background:T.inputBg,border:"none",borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16,color:T.muted}}>×</button>
          </div>
          <div style={{padding:"18px 20px",display:"flex",flexDirection:"column",gap:13}}>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><Label>Payment Date</Label>
                <input type="date" value={f.date} onChange={e=>upd("date",e.target.value)} style={iStyle}/></div>
              <div><Label>Status</Label>
                <select value={f.status} onChange={e=>upd("status",e.target.value)} style={iStyle}>
                  <option>Paid</option><option>Pending</option><option>Overdue</option><option>Waived</option>
                </select></div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><Label required>Premium Amount (S$)</Label>
                <input type="number" value={f.amount} onChange={e=>upd("amount",e.target.value)} placeholder="0.00" style={iStyle}/></div>
              <div><Label>Fees (optional, S$)</Label>
                <input type="number" value={f.fees} onChange={e=>upd("fees",e.target.value)} placeholder="e.g. 2.50 service fee" style={iStyle}/></div>
            </div>

            {parseFloat(f.fees) > 0 && (
              <div style={{background:T.warnBg,border:`1px solid #FDE68A`,borderRadius:8,padding:"8px 12px",fontSize:12,color:T.warn}}>
                Total deducted: S${totalCost.toLocaleString(undefined,{minimumFractionDigits:2})} (premium S${parseFloat(f.amount||0).toLocaleString(undefined,{minimumFractionDigits:2})} + fees S${parseFloat(f.fees||0).toLocaleString(undefined,{minimumFractionDigits:2})})
              </div>
            )}

            <div><Label>Payment Method</Label>
              <select value={f.method} onChange={e=>upd("method",e.target.value)} style={iStyle}>
                {["GIRO","Bank Transfer","PayNow","Credit Card","Cheque","Cash","From Account"].map(m=><option key={m}>{m}</option>)}
              </select></div>

            {useAccount && (
              <div>
                <Label required>Select Account</Label>
                <select value={f.linkedAccountId} onChange={e=>upd("linkedAccountId",e.target.value)}
                  style={{...iStyle, borderColor: f.linkedAccountId ? T.border : "#FECACA"}}>
                  <option value="">— Choose savings or checking account —</option>
                  {(accounts||[]).map(a=>(
                    <option key={a.id} value={a.id}>
                      {a.bank} {a.accountName} ({a.accountType} ••{a.last4}) — {a.currency} {a.balance.toLocaleString(undefined,{minimumFractionDigits:2})} available
                    </option>
                  ))}
                </select>
                {selectedAcc && (
                  <div style={{marginTop:6,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,padding:"8px 12px",borderRadius:8,
                    background: hasSufficientFunds ? T.upBg : T.downBg,
                    border: `1px solid ${hasSufficientFunds ? "#BBF7D0" : "#FECACA"}`}}>
                    <span style={{fontWeight:600, color: hasSufficientFunds ? T.up : T.down}}>
                      {hasSufficientFunds ? "✅ Sufficient funds" : "❌ Insufficient funds"}
                    </span>
                    <span style={{color:T.muted}}>
                      Balance: S${selectedAcc.balance.toLocaleString(undefined,{minimumFractionDigits:2})} → After: S${Math.max(0, selectedAcc.balance - totalCost).toLocaleString(undefined,{minimumFractionDigits:2})}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div><Label>Reference No.</Label>
              <input value={f.ref} onChange={e=>upd("ref",e.target.value)} placeholder="e.g. REF-123456" style={iStyle}/></div>

            <div><Label>Notes (optional)</Label>
              <textarea value={f.notes} onChange={e=>upd("notes",e.target.value)} rows={2}
                placeholder="e.g. Annual renewal, includes rider premium"
                style={{...iStyle, resize:"vertical"}}/></div>

          </div>
          <div style={{padding:"14px 20px",borderTop:`1px solid ${T.border}`,background:T.sidebar,display:"flex",gap:10,position:"sticky",bottom:0}}>
            <button
              disabled={!canSubmit}
              onClick={()=>handleAddPremiumTx(polId, {
                id:"TX"+Date.now(), date:f.date,
                amount: parseFloat(f.amount)||0,
                fees: parseFloat(f.fees)||0,
                method: useAccount ? ("From Account (" + (selectedAcc ? selectedAcc.bank+" "+selectedAcc.accountName : "") + ")") : f.method,
                linkedAccountId: useAccount ? f.linkedAccountId : null,
                ref: f.ref, status: f.status, notes: f.notes,
              })}
              style={{flex:1, background:canSubmit?T.selected:T.inputBg, color:canSubmit?T.selectedText:T.dim,
                border:"none",borderRadius:9,padding:"11px",fontSize:13,fontWeight:600,
                cursor:canSubmit?"pointer":"not-allowed",fontFamily:"inherit"}}>
              Record Payment
            </button>
            <button onClick={onClose} style={{background:"transparent",color:T.muted,border:`1px solid ${T.border}`,borderRadius:9,padding:"11px 20px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── Page header ── */}
      <div className="wo-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Insurance Portfolio</div>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{active.length} active {active.length === 1 ? "policy" : "policies"} · {policies.length} total</div>
        </div>
        <button onClick={() => { setShowAddModal(true); setForm(EMPTY_POLICY); }}
          style={{ background: T.selected, color: T.selectedText, border: "none", borderRadius: 9, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          + Add Policy
        </button>
      </div>

      {/* ── Summary cards ── */}
      <div className="wo-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total Sum Assured", value: fmtCcy(totalSumAssured), sub: `${active.length} active policies`, icon: "🛡️", color: T.accent },
          { label: "Annual Premium", value: `S$${totalPremPerYear.toLocaleString(undefined,{maximumFractionDigits:0})}`, sub: "Total yearly outflow", icon: "💳", color: T.warn },
          { label: "ILP Fund Value", value: fmtCcy(totalFundValue + totalCashValue), sub: totalFundValue > 0 ? `ILP S$${totalFundValue.toLocaleString()} · CV S$${totalCashValue.toLocaleString()}` : "Cash & surrender value", icon: "📈", color: T.up },
          { label: "Pending Claims", value: pendingClaims.toString(), sub: `${policies.flatMap(p=>p.claims).length} total claims`, icon: "📋", color: pendingClaims > 0 ? T.down : T.muted },
        ].map((c, i) => (
          <Card key={i} style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{c.label}</div>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8, color: T.text }}>{c.value}</div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 4 }}>{c.sub}</div>
          </Card>
        ))}
      </div>

      {/* ── Coverage breakdown bar ── */}
      <Card style={{ padding: "16px 20px", marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Coverage by Category</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          {Object.entries(groupTotals).map(([g, v]) => {
            const pct = totalSumAssured > 0 ? (v / totalSumAssured * 100).toFixed(0) : 0;
            const gColors = { Life: "#2563EB", Investment: "#059669", Health: "#DC2626", Accident: "#EA580C", General: "#16A34A" };
            const gc = gColors[g] || T.muted;
            return (
              <div key={g} style={{ flex: "1 1 120px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{g}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: T.inputBg, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: gc, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 11, color: T.dim, marginTop: 4 }}>{fmtCcy(v)}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Premium reminder alerts ── */}
      {(() => {
        const TODAY = new Date("2026-03-10");
        const upcoming = policies.filter(p => {
          if (!p.reminderEnabled || !p.nextPremDue || p.status !== "Active") return false;
          const due = new Date(p.nextPremDue);
          const daysUntil = Math.ceil((due - TODAY) / 86400000);
          return daysUntil >= 0 && daysUntil <= (p.reminderDays || 14);
        }).sort((a, b) => new Date(a.nextPremDue) - new Date(b.nextPremDue));
        const overdue = policies.filter(p => {
          if (!p.nextPremDue || p.status !== "Active") return false;
          return new Date(p.nextPremDue) < TODAY;
        });
        const alerts = [
          ...overdue.map(p => ({ pol: p, type: "overdue" })),
          ...upcoming.map(p => ({ pol: p, type: "upcoming" })),
        ];
        if (alerts.length === 0) return null;
        return (
          <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {alerts.map(({ pol, type }, i) => {
              const due = new Date(pol.nextPremDue);
              const daysUntil = Math.ceil((due - TODAY) / 86400000);
              const tc = INS_TYPES[pol.type] || { icon: "📋", color: T.muted, bg: T.inputBg };
              const isOverdue = type === "overdue";
              const bgColor = isOverdue ? T.downBg : T.warnBg;
              const borderColor = isOverdue ? T.down + "40" : T.warn + "40";
              const textColor = isOverdue ? T.down : T.warn;
              const annualPrem = (parseFloat(pol.premium)||0) * ({ Monthly:12, Quarterly:4, "Half-Yearly":2, Yearly:1, "Single Premium":0, "N/A":0 }[pol.premFreq]||1);
              const dueAmount = (parseFloat(pol.premium)||0);
              return (
                <div key={i} style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 10, padding: "12px 16px", display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{isOverdue ? "⚠️" : "🔔"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                      {isOverdue ? "Overdue:" : "Due soon:"}{" "}
                      <span style={{ color: textColor }}>{pol.planName}</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                      {pol.insurer} · {pol.policyNo} · {pol.premFreq} premium
                      {isOverdue
                        ? ` · ${Math.abs(daysUntil)}d overdue`
                        : daysUntil === 0 ? " · Due today"
                        : ` · ${daysUntil}d until ${pol.nextPremDue}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>S${dueAmount.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: T.dim }}>{pol.premFreq}</div>
                  </div>
                  <button onClick={() => setSelectedPolicy(pol)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: T.text, flexShrink: 0 }}>View</button>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── Filter toolbar ── */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: T.dim, pointerEvents: "none" }}>🔍</span>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search insurer, policy no, plan…"
            style={{ width: "100%", boxSizing: "border-box", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px 8px 34px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none" }} />
        </div>
        {/* Type group filter */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {typeGroups.map(g => (
            <button key={g} onClick={() => setFilterType(g)}
              style={{ background: filterType === g ? T.selected : T.inputBg, color: filterType === g ? T.selectedText : T.muted, border: `1px solid ${filterType === g ? T.selected : T.border}`, borderRadius: 7, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: filterType === g ? 600 : 400 }}>
              {g}
            </button>
          ))}
        </div>
        {/* Status filter */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 12px", fontSize: 12, fontFamily: "inherit", color: T.text, cursor: "pointer", outline: "none" }}>
          {["All", "Active", "Lapsed", "Surrendered", "Matured", "Pending", "Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: 12, color: T.muted, marginLeft: "auto" }}>{filtered.length} of {policies.length}</span>
      </div>

      {/* ── Policy table / mobile cards ── */}
      {filtered.length === 0 ? (
        <Card style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛡️</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No policies found</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Try adjusting filters or add a new policy</div>
        </Card>
      ) : isMobile ? (
        <Card style={{padding:0,overflow:"hidden"}}>
          {filtered.map(pol => {
            const tc = INS_TYPES[pol.type] || {icon:"📋",color:T.muted,bg:T.inputBg};
            const annualPrem = (parseFloat(pol.premium)||0) * ({Monthly:12,Quarterly:4,"Half-Yearly":2,Yearly:1,"Single Premium":0,"N/A":0}[pol.premFreq]||1);
            return <MobileListItem key={pol.id} onClick={()=>{setSelectedPolicy(pol);setDetailTab("overview");setTxSearch("");setTxFilter("All");setTxSort("desc");}}
              icon={tc.icon} iconBg={tc.bg} title={pol.planName} subtitle={`${pol.insurer} · ${pol.policyNo}`}
              value={pol.sumAssured>0?fmtCompact(pol.sumAssured):"—"} valueSub={annualPrem>0?`S$${annualPrem.toLocaleString()}/yr`:""}
              badge={pol.status} badgeBg={pol.status==="Active"?T.upBg:pol.status==="Lapsed"?T.downBg:T.inputBg} badgeColor={pol.status==="Active"?T.up:pol.status==="Lapsed"?T.down:T.muted}
            />;
          })}
        </Card>
      ) : (
        <Card className="wo-table-scroll" style={{ padding: 0, overflowX: "auto" }}>
          <SortHeader gridCols="2.2fr 1fr 1.1fr 1.1fr 1fr 1fr 0.9fr" sortKey={insSort.sortKey} sortDir={insSort.sortDir} onSort={insSort.onSort}
            columns={[["Policy / Plan","left","planName"],["Type","left","type"],["Sum Assured","right","sumAssured"],["Premium / yr","right","premium"],["Cash Value","right","cashValue"],["Renewal","left","renewal"],["Status","left","status"]]}/>
          {insSort.sortFn(filtered, (p, k) => {
            if (k==="planName") return (p.planName||"").toLowerCase();
            if (k==="type") return (p.type||"").toLowerCase();
            if (k==="sumAssured") return p.sumAssured||0;
            if (k==="premium") return (parseFloat(p.premium)||0) * ({ Monthly:12, Quarterly:4, "Half-Yearly":2, Yearly:1, "Single Premium":0, "N/A":0 }[p.premFreq]||1);
            if (k==="cashValue") return (p.cashValue||0) + (p.ilpFundValue||0);
            if (k==="renewal") return p.nextPremDue ? new Date(p.nextPremDue).getTime() : Infinity;
            if (k==="status") return p.status;
            return 0;
          }).map((pol, i) => {
            const tc = typeConf(pol.type);
            const annualPrem = (parseFloat(pol.premium)||0) * ({ Monthly:12, Quarterly:4, "Half-Yearly":2, Yearly:1, "Single Premium":0, "N/A":0 }[pol.premFreq]||1);
            const cv = (pol.cashValue||0) + (pol.ilpFundValue||0);
            return (
              <div key={pol.id} onClick={() => { setSelectedPolicy(pol); setDetailTab("overview"); setTxSearch(""); setTxFilter("All"); setTxSort("desc"); }}
                style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1.1fr 1.1fr 1fr 1fr 0.9fr", padding: "13px 20px", borderBottom: i < filtered.length-1 ? `1px solid ${T.border}` : "none", alignItems: "center", cursor: "pointer",
                  opacity: pol.status === "Lapsed" || pol.status === "Cancelled" || pol.status === "Surrendered" ? 0.5 : 1,
                  background: pol.status === "Lapsed" || pol.status === "Cancelled" ? T.sidebar : "",
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.hover}
                onMouseLeave={e => e.currentTarget.style.background = (pol.status === "Lapsed" || pol.status === "Cancelled" ? T.sidebar : "")}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{tc.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{pol.planName || "—"}</div>
                    <div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>{pol.insurer} · {pol.policyNo}</div>
                  </div>
                </div>
                <div><Badge bg={tc.bg} color={tc.color}>{pol.type}</Badge></div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{pol.sumAssured > 0 ? fmtCcy(pol.sumAssured) : "—"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>S${annualPrem.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
                  <div style={{ fontSize: 11, color: T.dim }}>{pol.premFreq}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: cv > 0 ? T.up : T.muted }}>{cv > 0 ? `S$${cv.toLocaleString()}` : "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: T.text }}>{pol.nextPremDue || (pol.endDate ? pol.endDate : "—")}</div>
                  {pol.endDate && <div style={{ fontSize: 11, color: T.dim }}>Ends {pol.endDate}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusChip status={pol.status} />
                  {(pol.claims || []).filter(c => c.status === "Pending").length > 0 && (
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.down, display: "inline-block" }} title="Pending claim" />
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ══ POLICY DETAIL MODAL ══════════════════════════════════ */}
      {selectedPolicy && (() => {
        const pol = policies.find(p => p.id === selectedPolicy.id) || selectedPolicy;
        const tc = typeConf(pol.type);
        const annualPrem = (parseFloat(pol.premium)||0) * ({ Monthly:12, Quarterly:4, "Half-Yearly":2, Yearly:1, "Single Premium":0, "N/A":0 }[pol.premFreq]||1);
        const cv = (pol.cashValue||0);
        const DETAIL_TABS = ["overview","coverage","premiums","transactions","claims","exclusions","documents","postings"];

        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}
            onClick={e => { if (e.target === e.currentTarget) { setSelectedPolicy(null); setTxSearch(""); setTxFilter("All"); setTxSort("desc"); } }}>
            <div style={{ width: "min(960px, 95vw)", height: "100vh", background: T.bg, overflow: "hidden", boxShadow: "-4px 0 32px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>

              {/* Drawer header */}
              <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`, background: T.sidebar, flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{tc.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{pol.planName}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{pol.insurer} · {pol.policyNo}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <StatusChip status={pol.status} />
                    {pol.status === "Active" && (
                      <button
                        onClick={() => { setClosureTarget(pol.id); setShowClosureModal(true); }}
                        style={{ background: T.downBg, border: `1px solid #FECACA`, borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: T.down, fontFamily: "inherit" }}>
                        Close Policy
                      </button>
                    )}
                    {pol.status === "Lapsed" && (
                      <button
                        onClick={() => { setPolicies(prev => prev.map(p => p.id === pol.id ? { ...p, status: "Active" } : p)); showToast("Policy reactivated", "success"); }}
                        style={{ background: T.upBg, border: `1px solid #BBF7D0`, borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: T.up, fontFamily: "inherit" }}>
                        Reactivate
                      </button>
                    )}
                    <button onClick={() => { setSelectedPolicy(null); setTxSearch(""); setTxFilter("All"); setTxSort("desc"); }} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 7, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: T.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                  </div>
                </div>

                {/* Quick stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { l: "Sum Assured", v: pol.sumAssured > 0 ? fmtCcy(pol.sumAssured) : "—" },
                    { l: "Annual Premium", v: `S$${annualPrem.toLocaleString(undefined,{maximumFractionDigits:0})}` },
                    { l: pol.ilpFundValue > 0 ? "Fund Value" : "Cash Value", v: pol.ilpFundValue > 0 ? `S$${pol.ilpFundValue.toLocaleString()}` : cv > 0 ? `S$${cv.toLocaleString()}` : "—" },
                  ].map(s => (
                    <div key={s.l} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 9, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, color: T.muted }}>{s.l}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* Detail tabs */}
                <div style={{ marginTop: 14, borderBottom: `1px solid ${T.border}`, overflowX: "auto", scrollbarWidth: "none" }}>
                  <div style={{ display: "flex", gap: 0, minWidth: "max-content" }}>
                    {DETAIL_TABS.map(dt => {
                      const label = { transactions: "Tx History", claims: "Claims", exclusions: "Exclusions", documents: "Documents", overview: "Overview", coverage: "Coverage", premiums: "Premiums", postings: "Postings" }[dt] || dt;
                      const badge = dt === "claims" && (pol.claims || []).length > 0 ? pol.claims.length
                                  : dt === "transactions" && (pol.premiumTransactions || []).length > 0 ? pol.premiumTransactions.length
                                  : null;
                      const active = detailTab === dt;
                      return (
                        <button key={dt} onClick={() => setDetailTab(dt)}
                          style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "none", borderBottom: `2px solid ${active ? T.selected : "transparent"}`, padding: "9px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: active ? 600 : 400, color: active ? T.text : T.muted, marginBottom: -1, whiteSpace: "nowrap", flexShrink: 0 }}>
                          {label}
                          {badge !== null && (
                            <span style={{ fontSize: 10, fontWeight: 600, background: active ? T.selected : T.border, color: active ? T.selectedText : T.muted, borderRadius: 99, padding: "1px 6px", lineHeight: 1.6 }}>{badge}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drawer body */}
              <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", minHeight: 0 }}>

                {/* Lapsed / closed warning banner */}
                {(pol.status === "Lapsed" || pol.status === "Cancelled" || pol.status === "Surrendered") && (
                  <div style={{ background: T.downBg, border: `1px solid #FECACA`, borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                    <span style={{ fontSize: 20 }}>🚫</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.down }}>This policy is {pol.status}</div>
                      <div style={{ fontSize: 12, color: T.down, marginTop: 2 }}>Coverage has ended. No new claims can be filed. Records are preserved for reference.</div>
                    </div>
                  </div>
                )}

                {/* Overview tab */}
                {detailTab === "overview" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        ["Insurance Type", pol.type], ["Insurer", pol.insurer],
                        ["Policy Number", pol.policyNo], ["Plan Name", pol.planName],
                        ["Insured", pol.insuredName], ["Date of Birth", pol.dob || "—"],
                        ["Beneficiary", pol.beneficiary || "—"], ["Start Date", pol.startDate],
                        ["End Date", pol.endDate || "Lifetime"], ["Next Premium Due", pol.nextPremDue || "—"],
                      ].map(([label, value]) => (
                        <div key={label} style={{ background: T.inputBg, borderRadius: 9, padding: "10px 14px" }}>
                          <div style={{ fontSize: 11, color: T.muted, marginBottom: 3 }}>{label}</div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    {pol.notes && (
                      <div style={{ background: T.accentBg, border: `1px solid ${T.accent}30`, borderRadius: 9, padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, color: T.accent, fontWeight: 600, marginBottom: 4 }}>📝 Notes</div>
                        <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{pol.notes}</div>
                      </div>
                    )}
                    {pol.closureComment && (
                      <div style={{ background: T.downBg, border: `1px solid #FECACA`, borderRadius: 9, padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, color: T.down, fontWeight: 600, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                          <span>🚫 Closure Reason</span>
                          {pol.closureDate && <span style={{ fontWeight: 400, color: T.muted }}>{pol.closureDate}</span>}
                        </div>
                        <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{pol.closureComment}</div>
                      </div>
                    )}
                    {(pol.riders || []).length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 8 }}>Riders Attached</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {pol.riders.map((r, i) => (
                            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", background: T.upBg, border: `1px solid ${T.up}20`, borderRadius: 8, padding: "8px 12px" }}>
                              <span style={{ color: T.up, fontSize: 13 }}>✓</span>
                              <span style={{ fontSize: 13 }}>{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Coverage tab */}
                {detailTab === "coverage" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        ["Sum Assured", pol.sumAssured > 0 ? `S$${pol.sumAssured.toLocaleString()}` : "—"],
                        ["Cash Value", pol.cashValue > 0 ? `S$${pol.cashValue.toLocaleString()}` : "—"],
                        ["Surrender Value", pol.surrenderValue > 0 ? `S$${pol.surrenderValue.toLocaleString()}` : "—"],
                        ["ILP Fund Value", pol.ilpFundValue > 0 ? `S$${pol.ilpFundValue.toLocaleString()}` : "—"],
                        ["Total Premiums Paid", pol.totalPremPaid > 0 ? `S$${pol.totalPremPaid.toLocaleString()}` : "—"],
                        ["Coverage Period", pol.endDate ? `${pol.startDate} → ${pol.endDate}` : `${pol.startDate} → Lifetime`],
                      ].map(([l, v]) => (
                        <div key={l} style={{ background: T.inputBg, borderRadius: 9, padding: "10px 14px" }}>
                          <div style={{ fontSize: 11, color: T.muted, marginBottom: 3 }}>{l}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {pol.ilpFundValue > 0 && pol.totalPremPaid > 0 && (
                      <div style={{ background: pol.ilpFundValue >= pol.totalPremPaid ? T.upBg : T.downBg, border: `1px solid ${pol.ilpFundValue >= pol.totalPremPaid ? T.up : T.down}30`, borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: pol.ilpFundValue >= pol.totalPremPaid ? T.up : T.down, marginBottom: 6 }}>ILP Performance</div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                          <span style={{ color: T.muted }}>Gain / Loss vs Premiums Paid</span>
                          <span style={{ fontWeight: 700, color: pol.ilpFundValue >= pol.totalPremPaid ? T.up : T.down }}>
                            {pol.ilpFundValue >= pol.totalPremPaid ? "+" : ""}S${(pol.ilpFundValue - pol.totalPremPaid).toLocaleString()} ({((pol.ilpFundValue / pol.totalPremPaid - 1)*100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    )}
                    {(pol.riders || []).length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 8 }}>Riders</div>
                        {pol.riders.map((r, i) => <div key={i} style={{ fontSize: 13, padding: "7px 12px", background: T.inputBg, borderRadius: 7, marginBottom: 5 }}>✓ {r}</div>)}
                      </div>
                    )}
                  </div>
                )}

                {/* Premiums tab */}
                {detailTab === "premiums" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Reminder status banner */}
                    {pol.nextPremDue && (() => {
                      const today = new Date("2026-03-10");
                      const due = new Date(pol.nextPremDue);
                      const daysUntil = Math.ceil((due - today) / 86400000);
                      const isOverdue = daysUntil < 0;
                      const isUpcoming = daysUntil >= 0 && daysUntil <= (pol.reminderDays || 14);
                      if (!isOverdue && !isUpcoming) return null;
                      return (
                        <div style={{ background: isOverdue ? T.downBg : T.warnBg, border: `1px solid ${isOverdue ? T.down : T.warn}30`, borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "center" }}>
                          <span style={{ fontSize: 18 }}>{isOverdue ? "⚠️" : "🔔"}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: isOverdue ? T.down : T.warn }}>
                              {isOverdue ? `Premium overdue by ${Math.abs(daysUntil)} days` : daysUntil === 0 ? "Premium due today!" : `Premium due in ${daysUntil} days`}
                            </div>
                            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                              S${parseFloat(pol.premium||0).toLocaleString()} due on {pol.nextPremDue}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        ["Premium Amount", `S$${parseFloat(pol.premium||0).toLocaleString()}`],
                        ["Frequency", pol.premFreq],
                        ["Annual Equivalent", `S$${annualPrem.toLocaleString(undefined,{maximumFractionDigits:0})}`],
                        ["Total Paid to Date", pol.totalPremPaid > 0 ? `S$${pol.totalPremPaid.toLocaleString()}` : "—"],
                        ["Next Due Date", pol.nextPremDue || "—"],
                        ["Start Date", pol.startDate],
                      ].map(([l,v]) => (
                        <div key={l} style={{ background: T.inputBg, borderRadius: 9, padding: "10px 14px" }}>
                          <div style={{ fontSize: 11, color: T.muted, marginBottom: 3 }}>{l}</div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {/* Reminder settings display */}
                    <div style={{ background: T.inputBg, borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 16 }}>🔔</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>Premium Reminder</div>
                            <div style={{ fontSize: 11, color: T.muted }}>
                              {pol.reminderEnabled ? `Alert ${pol.reminderDays || 14} days before due date` : "Reminders disabled"}
                            </div>
                          </div>
                        </div>
                        <Badge bg={pol.reminderEnabled ? T.upBg : T.inputBg} color={pol.reminderEnabled ? T.up : T.dim}>
                          {pol.reminderEnabled ? "On" : "Off"}
                        </Badge>
                      </div>
                      {pol.reminderEnabled && pol.nextPremDue && (() => {
                        const rd = new Date(new Date(pol.nextPremDue).getTime() - (pol.reminderDays||14) * 86400000);
                        return <div style={{ fontSize: 12, color: T.accent, marginTop: 8 }}>📅 Next reminder: {rd.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</div>;
                      })()}
                    </div>
                    {/* Premium bar visual */}
                    {pol.totalPremPaid > 0 && pol.sumAssured > 0 && (
                      <div style={{ background: T.inputBg, borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                          <span style={{ color: T.muted }}>Premiums Paid vs Coverage</span>
                          <span style={{ fontWeight: 600 }}>{((pol.totalPremPaid/pol.sumAssured)*100).toFixed(1)}% of sum assured</span>
                        </div>
                        <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min((pol.totalPremPaid/pol.sumAssured)*100, 100)}%`, height: "100%", background: T.accent, borderRadius: 4 }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.dim, marginTop: 6 }}>
                          <span>Paid: S${pol.totalPremPaid.toLocaleString()}</span>
                          <span>Assured: S${pol.sumAssured.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Claims tab */}
                {detailTab === "claims" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <button onClick={() => { setClaimTarget(pol); setClaimForm(EMPTY_CLAIM); setShowClaimModal(true); }}
                      style={{ background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 9, padding: "10px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: T.text, fontWeight: 500 }}>
                      + Record New Claim
                    </button>
                    {(pol.claims || []).length === 0 ? (
                      <div style={{ textAlign: "center", padding: "36px 20px" }}>
                        <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
                        <div style={{ fontSize: 13, color: T.muted }}>No claims recorded</div>
                      </div>
                    ) : pol.claims.map((c, i) => {
                      const claimColor = { Approved: T.up, Pending: T.warn, Rejected: T.down }[c.status] || T.muted;
                      const claimBg = { Approved: T.upBg, Pending: T.warnBg, Rejected: T.downBg }[c.status] || T.inputBg;
                      return (
                        <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{c.type}</div>
                            <Badge bg={claimBg} color={claimColor}>{c.status}</Badge>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                            <div style={{ fontSize: 12, color: T.muted }}>Date: <span style={{ color: T.text, fontWeight: 500 }}>{c.date}</span></div>
                            <div style={{ fontSize: 12, color: T.muted }}>Amount: <span style={{ color: T.text, fontWeight: 600 }}>S${parseFloat(c.amount||0).toLocaleString()}</span></div>
                          </div>
                          {c.notes && <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5, background: T.inputBg, borderRadius: 7, padding: "8px 10px" }}>{c.notes}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Exclusions tab */}
                {detailTab === "exclusions" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ background: T.warnBg, border: `1px solid ${T.warn}30`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.warn, fontWeight: 500 }}>
                      ⚠️ Review your policy document for the full and binding list of exclusions.
                    </div>
                    {(pol.exclusions || []).length === 0 ? (
                      <div style={{ textAlign: "center", padding: "36px 20px" }}>
                        <div style={{ fontSize: 28, marginBottom: 10 }}>✅</div>
                        <div style={{ fontSize: 13, color: T.muted }}>No exclusions recorded</div>
                      </div>
                    ) : pol.exclusions.map((ex, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 14px", background: T.inputBg, borderRadius: 9 }}>
                        <span style={{ color: T.down, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✕</span>
                        <span style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{ex}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Transaction History tab */}
                {detailTab === "transactions" && (() => {
                  const txs = pol.premiumTransactions || [];
                  const paid = txs.filter(t => t.status === "Paid");
                  const totalPaid = paid.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
                  const lastPaid = paid.length > 0 ? paid[paid.length - 1] : null;
                  const methodIcon = { GIRO: "🏦", "Credit Card": "💳", Cheque: "📝", PayNow: "📱", Cash: "💵", "Bank Transfer": "🔄" };

                  const filtered = txs
                    .filter(t => {
                      const mSearch = !txSearch || t.date.includes(txSearch) || t.ref.toLowerCase().includes(txSearch.toLowerCase()) || t.method.toLowerCase().includes(txSearch.toLowerCase()) || (t.notes||"").toLowerCase().includes(txSearch.toLowerCase());
                      const mStatus = txFilter === "All" || t.status === txFilter;
                      return mSearch && mStatus;
                    })
                    .sort((a, b) => txSort === "desc" ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                      {/* Summary strip */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                        {[
                          { label: "Total Paid", value: `S$${totalPaid.toLocaleString()}`, sub: `${paid.length} payments`, color: T.up },
                          { label: "Last Payment", value: lastPaid ? `S$${parseFloat(lastPaid.amount).toLocaleString()}` : "—", sub: lastPaid ? lastPaid.date : "No payments", color: T.text },
                          { label: "Outstanding", value: txs.filter(t => t.status !== "Paid").length > 0 ? `${txs.filter(t => t.status !== "Paid").length} unpaid` : "All clear", sub: txs.filter(t => t.status === "Overdue").length > 0 ? `${txs.filter(t => t.status === "Overdue").length} overdue` : "No overdue", color: txs.filter(t => t.status === "Overdue").length > 0 ? T.down : T.up },
                        ].map(s => (
                          <div key={s.label} style={{ background: T.inputBg, borderRadius: 9, padding: "10px 12px" }}>
                            <div style={{ fontSize: 11, color: T.muted }}>{s.label}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{s.sub}</div>
                          </div>
                        ))}
                      </div>

                      {/* Toolbar */}
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ position: "relative", flex: 1 }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: T.dim, pointerEvents: "none" }}>🔍</span>
                          <input value={txSearch} onChange={e => setTxSearch(e.target.value)} placeholder="Search ref, method, notes…"
                            style={{ width: "100%", boxSizing: "border-box", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px 7px 30px", fontSize: 12, fontFamily: "inherit", color: T.text, outline: "none" }} />
                        </div>
                        {["All","Paid","Pending","Overdue"].map(f => (
                          <button key={f} onClick={() => setTxFilter(f)}
                            style={{ padding: "6px 11px", borderRadius: 7, border: `1px solid ${txFilter===f ? T.selected : T.border}`, background: txFilter===f ? T.selected : T.inputBg, color: txFilter===f ? T.selectedText : T.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: txFilter===f ? 600 : 400 }}>
                            {f}
                          </button>
                        ))}
                        <button onClick={() => setTxSort(s => s === "desc" ? "asc" : "desc")}
                          style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.inputBg, color: T.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}
                          title="Toggle date sort">
                          {txSort === "desc" ? "↓ Newest" : "↑ Oldest"}
                        </button>
                        {pol.status === "Active" && (
                          <button onClick={() => setShowAddTxModal(true)}
                            style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: T.selected, color: T.selectedText, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                            + Record
                          </button>
                        )}
                      </div>

                      {showAddTxModal && (
                        <AddPremiumTxModal
                          polId={pol.id}
                          premium={pol.premium}
                          onClose={() => setShowAddTxModal(false)}
                        />
                      )}

                      {/* Year-grouped transaction list */}
                      {filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "36px 20px" }}>
                          <div style={{ fontSize: 28, marginBottom: 10 }}>💳</div>
                          <div style={{ fontSize: 13, color: T.muted }}>No transactions found</div>
                        </div>
                      ) : (() => {
                        // Group by year
                        const byYear = {};
                        filtered.forEach(t => {
                          const yr = t.date.slice(0,4);
                          if (!byYear[yr]) byYear[yr] = [];
                          byYear[yr].push(t);
                        });
                        const years = Object.keys(byYear).sort((a,b) => txSort === "desc" ? b-a : a-b);
                        return years.map(yr => {
                          const ytxs = byYear[yr];
                          const yrTotal = ytxs.filter(t=>t.status==="Paid").reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
                          return (
                            <div key={yr}>
                              {/* Year header */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0 8px", borderBottom: `1px solid ${T.border}`, marginBottom: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.04em" }}>{yr}</span>
                                <span style={{ fontSize: 11, color: T.dim }}>
                                  {ytxs.length} payment{ytxs.length>1?"s":""} · S${yrTotal.toLocaleString()} paid
                                </span>
                              </div>
                              {/* Transactions */}
                              {ytxs.map((tx, i) => {
                                const statusColor = { Paid: T.up, Pending: T.warn, Overdue: T.down, Waived: T.accent }[tx.status] || T.muted;
                                const statusBg    = { Paid: T.upBg, Pending: T.warnBg, Overdue: T.downBg, Waived: T.accentBg }[tx.status] || T.inputBg;
                                const icon = methodIcon[tx.method] || "💰";
                                return (
                                  <div key={tx.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 0", borderBottom: i < ytxs.length-1 ? `1px solid ${T.border}` : "none" }}>
                                    {/* Icon */}
                                    <div style={{ width: 34, height: 34, borderRadius: 9, background: statusBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</div>
                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                        <div>
                                          <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.method}</div>
                                          <div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>{tx.date}</div>
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                          <div style={{ fontSize: 14, fontWeight: 700, color: tx.status === "Paid" ? T.text : statusColor }}>
                                            {tx.status === "Waived" ? "Waived" : `S$${parseFloat(tx.amount||0).toLocaleString()}`}
                                          </div>
                                          <div style={{ marginTop: 3 }}>
                                            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: statusBg, color: statusColor }}>{tx.status}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                                        <span style={{ fontSize: 10, color: T.dim, background: T.inputBg, borderRadius: 5, padding: "2px 7px", fontFamily: "monospace" }}>{tx.ref}</span>
                                        {tx.fees > 0 && <span style={{ fontSize: 10, color: T.warn, background: T.warnBg, borderRadius: 5, padding: "2px 7px" }}>+ S${parseFloat(tx.fees).toLocaleString(undefined,{minimumFractionDigits:2})} fees</span>}
                                        {tx.notes && <span style={{ fontSize: 11, color: T.muted, fontStyle: "italic" }}>{tx.notes}</span>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        });
                      })()}

                      {/* Running total footer */}
                      {filtered.length > 0 && (
                        <div style={{ borderTop: `2px solid ${T.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: T.muted }}>{filtered.length} transaction{filtered.length>1?"s":""} shown</span>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>
                            S${filtered.filter(t=>t.status==="Paid").reduce((s,t)=>s+(parseFloat(t.amount)||0),0).toLocaleString()} total paid
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Documents tab */}
                {detailTab === "documents" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ background: T.inputBg, border: `2px dashed ${T.border}`, borderRadius: 10, padding: "24px", textAlign: "center", cursor: "pointer" }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>Upload Document</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>PDF, JPG, PNG · Drag & drop or click</div>
                    </div>
                    {(pol.documents || []).length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 20px" }}>
                        <div style={{ fontSize: 13, color: T.muted }}>No documents uploaded</div>
                      </div>
                    ) : pol.documents.map((doc, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: `1px solid ${T.border}`, borderRadius: 9 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📄</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{doc.name}</div>
                          <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{doc.type} · Uploaded {doc.date}</div>
                        </div>
                        <Badge>{doc.type}</Badge>
                        <button style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 14, color: T.muted, padding: "4px 6px" }}>↓</button>
                      </div>
                    ))}
                  </div>
                )}
                {detailTab === "postings" && (() => {
                  const inter = "'Inter','Segoe UI',system-ui,sans-serif";
                  const mono  = "'Courier New',Courier,monospace";
                  const txs    = (pol.premiumTransactions || []).filter(t => t.status === "Paid").slice().sort((a,b) => a.date.localeCompare(b.date));
                  const claims = (pol.claims || []).filter(c => c.status === "Approved").slice().sort((a,b) => a.date.localeCompare(b.date));
                  const ccy   = pol.currency || "SGD";
                  const sym2  = ccy === "USD" ? "US$" : ccy === "GBP" ? "£" : "S$";
                  const fmtA  = (v) => sym2 + Math.abs(parseFloat(v)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
                  const cashAcct = "Assets:Bank:Cash";
                  const expAcct  = `Expenses:Insurance:${(pol.type||"General").replace(/ /g,"")}`;

                  const daysAgo = (d) => {
                    if (!d) return "";
                    const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
                    return diff === 0 ? "Today" : diff === 1 ? "1 day ago" : diff + " days ago";
                  };

                  // Premium payments only — no inception entry
                  const journalRows = [];

                  // Build combined entries sorted by date
                  const allEntries = [
                    ...txs.map(tx => ({ _type: "premium", date: tx.date, tx })),
                    ...claims.map(c  => ({ _type: "claim",   date: c.date,  c  })),
                  ].sort((a, b) => a.date.localeCompare(b.date));

                  allEntries.forEach(entry => {
                    if (entry._type === "premium") {
                      const tx  = entry.tx;
                      const amt = parseFloat(tx.amount)||0;
                      const fee = parseFloat(tx.fees)||0;
                      journalRows.push(
                        { date: tx.date, desc: `${tx.date.slice(0,7)} Premium — ${pol.planName}`, account: expAcct,  amount: fmtA(amt), debit: true,  _first: true  },
                        { date: null,    desc: "",                                                  account: cashAcct, amount: fmtA(amt), debit: false, _first: false },
                      );
                      if (fee > 0) {
                        journalRows.push(
                          { date: null, desc: "Processing fee",              account: "Expenses:Insurance:Fees", amount: fmtA(fee), debit: true,  _first: false },
                          { date: null, desc: "",                            account: cashAcct,                  amount: fmtA(fee), debit: false, _first: false },
                        );
                      }
                    } else {
                      const c   = entry.c;
                      const amt = parseFloat(c.amount)||0;
                      // Claim payout: Dr Assets:Bank:Cash (receive money), Cr Income:InsuranceClaim
                      journalRows.push(
                        { date: c.date, desc: `Claim payout — ${c.type}${c.notes ? ` (${c.notes.slice(0,40)}${c.notes.length>40?"…":""})` : ""}`, account: cashAcct, amount: fmtA(amt), debit: true,  _first: true  },
                        { date: null,   desc: "",                                                                                                       account: `Income:InsuranceClaim:${pol.insurer.replace(/ /g,"")}`, amount: fmtA(amt), debit: false, _first: false },
                      );
                    }
                  });

                  if (isMobile && journalRows.length > 0) return <MobilePostingsList journalRows={journalRows} entryCount={txs.length} entryLabel={`premium${txs.length!==1?"s":""}`}/>;
                  if (journalRows.length === 0) {
                    return (
                      <div style={{ textAlign: "center", padding: "48px 20px", color: T.muted }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>📒</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>No entries to post yet</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>Record a premium payment to see ledger postings</div>
                      </div>
                    );
                  }

                  return (
                    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", background: T.bg }}>
                      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: inter }}>Ledger Postings</div>
                        <div style={{ fontSize: 12, color: T.accent, marginTop: 3, fontFamily: inter }}>Double-entry bookkeeping · PTA compliant · {txs.length} premium{txs.length !== 1 ? "s" : ""}{claims.length > 0 ? ` · ${claims.length} claim payout${claims.length !== 1 ? "s" : ""}` : ""}</div>
                      </div>
                      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 460 }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                              <th style={{ padding: "9px 16px", textAlign: "left", width: 148, fontSize: 11, fontWeight: 500, color: T.muted, fontFamily: inter, whiteSpace: "nowrap" }}>Date</th>
                              <th style={{ padding: "9px 16px", textAlign: "left", fontSize: 11, fontWeight: 500, color: T.muted, fontFamily: inter }}>Account</th>
                              <th style={{ padding: "9px 16px", textAlign: "left", fontSize: 11, fontWeight: 500, color: T.muted, fontFamily: inter }}>Description</th>
                              <th style={{ padding: "9px 16px", textAlign: "right", width: 148, fontSize: 11, fontWeight: 500, color: T.muted, fontFamily: inter }}>Debit</th>
                              <th style={{ padding: "9px 16px", textAlign: "right", width: 148, fontSize: 11, fontWeight: 500, color: T.muted, fontFamily: inter }}>Credit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {journalRows.map((row, ri) => (
                              <tr key={ri} style={{ borderBottom: `1px solid ${T.border}` }}>
                                <td style={{ padding: "11px 16px", verticalAlign: "top", width: 148 }}>
                                  {row._first && row.date ? (
                                    <>
                                      <div style={{ fontSize: 13, fontWeight: 400, color: T.text, fontFamily: inter, whiteSpace: "nowrap" }}>{row.date}</div>
                                      <div style={{ fontSize: 11, color: T.dim, marginTop: 2, fontFamily: inter }}>{daysAgo(row.date)}</div>
                                    </>
                                  ) : null}
                                </td>
                                <td style={{ padding: "11px 16px", verticalAlign: "top" }}>
                                  <span style={{ fontFamily: mono, fontSize: 12, color: T.text }}>{row.account}</span>
                                </td>
                                <td style={{ padding: "11px 16px", verticalAlign: "top", fontSize: 12, color: T.muted, fontFamily: inter }}>{row.desc}</td>
                                <td style={{ padding: "11px 16px", verticalAlign: "top", textAlign: "right", whiteSpace: "nowrap" }}>
                                  {row.debit
                                    ? <span style={{ fontSize: 13, fontWeight: 700, color: T.up, fontFamily: inter }}>{row.amount}</span>
                                    : <span style={{ fontSize: 13, color: T.dim, fontFamily: inter }}>—</span>}
                                </td>
                                <td style={{ padding: "11px 16px", verticalAlign: "top", textAlign: "right", whiteSpace: "nowrap" }}>
                                  {!row.debit
                                    ? <span style={{ fontSize: 13, fontWeight: 700, color: T.down, fontFamily: inter }}>{row.amount}</span>
                                    : <span style={{ fontSize: 13, color: T.dim, fontFamily: inter }}>—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.border}`, background: T.sidebar }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 6, fontFamily: inter }}>Double-Entry Accounting</div>
                        <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.8, fontFamily: inter }}>
                          <div>• <span style={{ color: T.up, fontWeight: 600 }}>Debit (Dr):</span> Premium paid → increases Expenses:Insurance; Claim payout → increases Assets:Bank:Cash</div>
                          <div>• <span style={{ color: T.down, fontWeight: 600 }}>Credit (Cr):</span> Premium paid → reduces Assets:Bank:Cash; Claim payout → records Income:InsuranceClaim</div>
                        </div>
                        <div style={{ fontSize: 11, color: T.dim, marginTop: 8, fontFamily: inter }}>Every transaction has equal debits and credits (sum = 0)</div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ CLOSURE COMMENT MODAL ═══════════════════════════════ */}
      {showClosureModal && (() => {
        const ClosureModal = () => {
          const [comment, setComment] = useState("");
          const handleConfirm = () => {
            if (!comment.trim()) return;
            setPolicies(prev => prev.map(p => p.id === closureTarget
              ? { ...p, status: "Lapsed", closureComment: comment.trim(), closureDate: new Date().toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) }
              : p
            ));
            showToast("Policy closed and marked as Lapsed", "success");
            setShowClosureModal(false);
            setClosureTarget(null);
          };
          return (
            <>
              <div onClick={() => { setShowClosureModal(false); setClosureTarget(null); }}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 400 }}/>
              <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 401,
                background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, width: 440,
                boxShadow: "0 20px 60px rgba(0,0,0,0.22)" }}>
                <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Close Policy</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>This will mark the policy as Lapsed. Please provide a reason.</div>
                </div>
                <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ background: T.downBg, border: `1px solid #FECACA`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.down }}>
                    ⚠️ Once closed, the policy will be disabled and no new claims can be filed. This can be reversed via Reactivate.
                  </div>
                  <div>
                    <Label required>Closure Reason / Comment</Label>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      rows={4}
                      placeholder="e.g. Surrendered policy due to financial restructuring. Surrender value of S$34,200 received on 14 Mar 2026."
                      style={{ width: "100%", boxSizing: "border-box", background: T.inputBg, border: `1px solid ${comment.trim() ? T.border : "#FECACA"}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none", resize: "vertical" }}
                    />
                    {!comment.trim() && <div style={{ fontSize: 11, color: T.down, marginTop: 4 }}>A reason is required to close the policy.</div>}
                  </div>
                </div>
                <div style={{ padding: "14px 22px", borderTop: `1px solid ${T.border}`, background: T.sidebar, display: "flex", gap: 10 }}>
                  <button onClick={handleConfirm} disabled={!comment.trim()}
                    style={{ flex: 1, background: comment.trim() ? T.down : T.inputBg, color: comment.trim() ? "#fff" : T.dim,
                      border: "none", borderRadius: 9, padding: "11px", fontSize: 13, fontWeight: 600,
                      cursor: comment.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                    Confirm Close Policy
                  </button>
                  <button onClick={() => { setShowClosureModal(false); setClosureTarget(null); }}
                    style={{ background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: 9, padding: "11px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    Cancel
                  </button>
                </div>
              </div>
            </>
          );
        };
        return <ClosureModal/>;
      })()}

      {/* ══ ADD POLICY MODAL ═════════════════════════════════════ */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div style={{ background: T.bg, borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "22px 26px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.sidebar, borderRadius: "16px 16px 0 0" }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Add New Policy</div>
              <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: T.muted }}>Cancel</button>
            </div>
            <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Type selector */}
              <div>
                <Label required>Insurance Type</Label>
                {(() => {
                  const tc = form.type ? typeConf(form.type) : null;
                  // Group options by category
                  const groups = {};
                  INS_TYPE_KEYS.forEach(t => {
                    const g = INS_TYPES[t].group;
                    if (!groups[g]) groups[g] = [];
                    groups[g].push(t);
                  });
                  return (
                    <div style={{ position: "relative" }}>
                      {/* Icon preview */}
                      {tc && (
                        <div style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none", zIndex: 1 }}>
                          {tc.icon}
                        </div>
                      )}
                      <select
                        value={form.type}
                        onChange={e => setF("type", e.target.value)}
                        style={{
                          width: "100%",
                          appearance: "none",
                          background: tc ? tc.bg : T.inputBg,
                          border: `1px solid ${tc ? tc.color + "60" : T.border}`,
                          borderRadius: 9,
                          padding: tc ? "10px 36px 10px 36px" : "10px 36px 10px 12px",
                          fontSize: 13,
                          fontFamily: "inherit",
                          fontWeight: tc ? 600 : 400,
                          color: tc ? tc.color : T.dim,
                          outline: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="">Select insurance type…</option>
                        {Object.entries(groups).map(([grp, types]) => (
                          <optgroup key={grp} label={`── ${grp} ──`}>
                            {types.map(t => (
                              <option key={t} value={t}>{INS_TYPES[t].icon}  {t}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {/* Chevron */}
                      <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 11, color: tc ? tc.color : T.dim }}>▾</div>
                    </div>
                  );
                })()}
              </div>

              {/* Policy basics */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <Label required>Insurer</Label>
                  <Sel value={form.insurer} onChange={e => setF("insurer", e.target.value)} options={INSURERS} placeholder="Select insurer" />
                </div>
                <div>
                  <Label required>Policy Number</Label>
                  <Input placeholder="e.g. L-2021-00841" value={form.policyNo} onChange={e => setF("policyNo", e.target.value)} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <Label>Plan Name</Label>
                  <Input placeholder="e.g. AIA Term Protect Plus" value={form.planName} onChange={e => setF("planName", e.target.value)} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Sel value={form.status} onChange={e => setF("status", e.target.value)} options={STATUS_OPTS} />
                </div>
                <div>
                  <Label>Insured Name</Label>
                  <Input value={form.insuredName} onChange={e => setF("insuredName", e.target.value)} />
                </div>
                <div>
                  <Label>Beneficiary</Label>
                  <Input placeholder="e.g. Spouse — Jane Doe" value={form.beneficiary} onChange={e => setF("beneficiary", e.target.value)} />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Sel value={form.currency} onChange={e => setF("currency", e.target.value)} options={["SGD","USD","GBP","EUR","MYR"]} />
                </div>
              </div>

              {/* ── Type-specific coverage fields ── */}
              {form.type && (() => {
                const tc = typeConf(form.type);
                const SField = ({ label, children, span }) => (
                  <div style={{ gridColumn: span ? "span 2" : undefined }}>
                    <Label>{label}</Label>
                    {children}
                  </div>
                );
                const NField = ({ label, field, placeholder = "0", hint }) => (
                  <div>
                    <Label>{label}</Label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: T.dim, pointerEvents: "none" }}>S$</span>
                      <input type="number" placeholder={placeholder} value={form[field] || ""} onChange={e => setF(field, e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px 9px 30px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none" }} />
                    </div>
                    {hint && <div style={{ fontSize: 11, color: T.dim, marginTop: 4 }}>{hint}</div>}
                  </div>
                );
                const TF = ({ label, field, placeholder }) => (
                  <div>
                    <Label>{label}</Label>
                    <Input placeholder={placeholder} value={form[field] || ""} onChange={e => setF(field, e.target.value)} />
                  </div>
                );
                const SF = ({ label, field, opts, placeholder }) => (
                  <div>
                    <Label>{label}</Label>
                    <Sel value={form[field] || ""} onChange={e => setF(field, e.target.value)} options={opts} placeholder={placeholder || "Select…"} />
                  </div>
                );
                const Toggle = ({ label, field, sub }) => (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 9 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{label}</div>
                      {sub && <div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>{sub}</div>}
                    </div>
                    <div onClick={() => setF(field, !form[field])}
                      style={{ width: 36, height: 20, borderRadius: 10, background: form[field] ? T.selected : T.border, cursor: "pointer", position: "relative", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: 2, left: form[field] ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: T.bg, transition: "left 0.15s" }} />
                    </div>
                  </div>
                );
                const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
                const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 };

                const typeFields = {

                  "Term Life": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={grid3}>
                        <NField label="Sum Assured" field="sumAssured" hint="Death + TPD benefit" />
                        <TF label="Policy Term" field="termYears" placeholder="e.g. 20 years" />
                        <SF label="Coverage Type" field="termCoverType" opts={["Level Term","Decreasing Term","Increasing Term"]} />
                      </div>
                      <div style={grid2}>
                        <Toggle label="Total & Permanent Disability (TPD)" field="tpdCover" sub="TPD benefit = Sum Assured" />
                        <Toggle label="Critical Illness Accelerated" field="ciAccelerated" sub="CI payout reduces SA" />
                        <Toggle label="Renewable at Expiry" field="renewable" sub="Option to renew without underwriting" />
                        <Toggle label="Convertible to Whole Life" field="convertible" sub="Conversion privilege included" />
                      </div>
                      <NField label="Total Premiums Paid" field="totalPremPaid" hint="Cumulative premiums paid to date" />
                    </div>
                  ),

                  "Whole Life": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={grid3}>
                        <NField label="Sum Assured" field="sumAssured" />
                        <NField label="Cash Value" field="cashValue" hint="Current CSV" />
                        <NField label="Surrender Value" field="surrenderValue" hint="If surrendered today" />
                      </div>
                      <div style={grid2}>
                        <SF label="Policy Type" field="wholeLifeType" opts={["Participating (Par)","Non-Participating (Non-Par)"]} />
                        <SF label="Premium Term" field="premiumTerm" opts={["Limited Pay — 10 years","Limited Pay — 15 years","Limited Pay — 20 years","Pay to 65","Whole of Life"]} />
                        <Toggle label="Bonus Participation" field="bonusParticipation" sub="Eligible for annual / special bonuses" />
                        <Toggle label="Waiver of Premium" field="waiverOfPremium" sub="Premium waived on TPD / CI" />
                      </div>
                      <NField label="Total Premiums Paid" field="totalPremPaid" />
                    </div>
                  ),

                  "Universal Life": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={grid3}>
                        <NField label="Sum Assured" field="sumAssured" />
                        <NField label="Account Value" field="cashValue" hint="Current investment account" />
                        <TF label="Current Interest Rate" field="ulInterestRate" placeholder="e.g. 4.5%" />
                      </div>
                      <div style={grid2}>
                        <NField label="Minimum Premium" field="ulMinPremium" hint="Minimum to keep policy active" />
                        <NField label="Surrender Value" field="surrenderValue" />
                        <Toggle label="Flexible Premium" field="flexPremium" sub="Can vary premium within limits" />
                        <Toggle label="Secondary Guarantee" field="secondaryGuarantee" sub="No-lapse guarantee if minimum paid" />
                      </div>
                      <NField label="Total Premiums Paid" field="totalPremPaid" />
                    </div>
                  ),

                  "Endowment": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={grid3}>
                        <NField label="Sum Assured" field="sumAssured" hint="Death benefit" />
                        <NField label="Maturity Value" field="maturityValue" hint="Projected payout at maturity" />
                        <NField label="Cash Value" field="cashValue" hint="Current CSV" />
                      </div>
                      <div style={grid2}>
                        <div>
                          <Label>Maturity Date</Label>
                          <Input type="date" value={form.endDate || ""} onChange={e => setF("endDate", e.target.value)} />
                        </div>
                        <SF label="Savings Type" field="endowmentType" opts={["Participating (Par)","Non-Participating","Capital Guaranteed","Projected Return"]} />
                        <Toggle label="Bonus Participation" field="bonusParticipation" sub="Annual reversionary bonuses" />
                        <Toggle label="Premium Waiver on Death/CI" field="waiverOfPremium" sub="Future premiums waived" />
                      </div>
                      <NField label="Total Premiums Paid" field="totalPremPaid" />
                    </div>
                  ),

                  "ILP": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={grid3}>
                        <NField label="Sum Assured" field="sumAssured" hint="Life protection component" />
                        <NField label="Fund Value" field="ilpFundValue" hint="Current market value of units" />
                        <NField label="Surrender Value" field="surrenderValue" hint="After surrender charges" />
                      </div>
                      <div style={grid2}>
                        <TF label="Fund Name(s)" field="ilpFundNames" placeholder="e.g. Global Equity Fund 60%, REIT 40%" />
                        <SF label="Investment Strategy" field="ilpStrategy" opts={["Aggressive (Equity)","Balanced","Conservative (Bond)","Income","Custom Mix"]} />
                        <Toggle label="Regular Top-Ups Allowed" field="ilpTopupAllowed" sub="Additional premium top-ups permitted" />
                        <Toggle label="Premium Holiday Allowed" field="ilpPremHoliday" sub="Can pause premiums using fund units" />
                      </div>
                      <NField label="Total Premiums Paid" field="totalPremPaid" hint="Excludes top-ups" />
                    </div>
                  ),

                  "Hospital Plan": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={grid2}>
                        <SF label="Ward Entitlement" field="hospitalWard" opts={["Private Hospital","Class A Ward","Class B1 Ward","Class B2 Ward","Class C Ward"]} />
                        <SF label="Plan Tier" field="hospitalTier" opts={["Standard","Preferred","Enhanced","Premier","Elite"]} />
                      </div>
                      <div style={grid3}>
                        <NField label="Annual Claim Limit" field="hospitalAnnualLimit" hint="Per policy year" />
                        <NField label="Lifetime Claim Limit" field="hospitalLifetimeLimit" hint="0 = unlimited" />
                        <TF label="Deductible" field="hospitalDeductible" placeholder="e.g. S$3,500" />
                      </div>
                      <div style={grid2}>
                        <TF label="Co-Insurance" field="hospitalCoinsurance" placeholder="e.g. 10% after deductible" />
                        <SF label="Pre-/Post-Hospitalisation" field="hospitalPrePost" opts={["60/90 days","90/180 days","180/365 days","As charged"]} />
                        <Toggle label="Integrated Shield Plan (MediShield)" field="isp" sub="Integrated with MediShield Life base layer" />
                        <Toggle label="Cashless Rider" field="cashlessRider" sub="No upfront payment at approved hospitals" />
                      </div>
                    </div>
                  ),

                  "Critical Illness": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={grid3}>
                        <NField label="CI Sum Assured" field="sumAssured" hint="Lump sum on CI diagnosis" />
                        <TF label="Conditions Covered" field="ciConditions" placeholder="e.g. 37 conditions" />
                        <NField label="Total Premiums Paid" field="totalPremPaid" />
                      </div>
                      <div>
                        <Label>Stages Covered</Label>
                        <div style={{ display: "flex", gap: 8 }}>
                          {["Early","Intermediate","Advanced"].map(s => (
                            <button key={s} onClick={() => {
                              const cur = form.ciStages || [];
                              setF("ciStages", cur.includes(s) ? cur.filter(x=>x!==s) : [...cur, s]);
                            }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${(form.ciStages||[]).includes(s) ? T.selected : T.border}`, background: (form.ciStages||[]).includes(s) ? T.selected : T.bg, color: (form.ciStages||[]).includes(s) ? T.selectedText : T.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 500 }}>{s}</button>
                          ))}
                        </div>
                      </div>
                      <div style={grid2}>
                        <Toggle label="Multi-Pay CI" field="ciMultiPay" sub="Multiple claims across different conditions" />
                        <Toggle label="CI + Death Benefit" field="ciDeathBenefit" sub="Separate death benefit on top of CI" />
                        <Toggle label="Premium Waiver on CI Claim" field="ciPremWaiver" sub="Future premiums waived after first claim" />
                        <Toggle label="Juvenile CI" field="ciJuvenile" sub="Coverage includes child-specific conditions" />
                      </div>
                    </div>
                  ),

                  "Disability": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={grid3}>
                        <NField label="Monthly Disability Benefit" field="disabilityMonthly" hint="Paid monthly if disabled" />
                        <TF label="Waiting Period" field="disabilityWait" placeholder="e.g. 60 days" />
                        <TF label="Benefit Period" field="disabilityBenefitPeriod" placeholder="e.g. To age 65" />
                      </div>
                      <div style={grid2}>
                        <SF label="Disability Definition" field="disabilityDefinition" opts={["Own Occupation","Any Occupation","Activities of Daily Living (ADL)"]} />
                        <TF label="Maximum Insurable Income %" field="disabilityMaxPct" placeholder="e.g. 75% of income" />
                        <Toggle label="Partial Disability Benefit" field="disabilityPartial" sub="Proportional benefit for partial disability" />
                        <Toggle label="Presumptive Disability" field="disabilityPresumptive" sub="Automatic benefit for loss of sight/limbs" />
                      </div>
                      <NField label="Total Premiums Paid" field="totalPremPaid" />
                    </div>
                  ),

                  "Long-Term Care": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={grid3}>
                        <NField label="Daily Benefit" field="ltcDailyBenefit" hint="Daily payout when triggered" />
                        <TF label="Elimination Period" field="ltcElimination" placeholder="e.g. 90 days" />
                        <TF label="Benefit Period" field="ltcBenefitPeriod" placeholder="e.g. 3 years / Lifetime" />
                      </div>
                      <div style={grid2}>
                        <SF label="ADL Trigger" field="ltcAdlTrigger" opts={["2 of 6 ADLs","3 of 6 ADLs","Severe Cognitive Impairment","2 of 6 or Cognitive"]} />
                        <TF label="Inflation Protection" field="ltcInflation" placeholder="e.g. 5% p.a. compound" />
                        <Toggle label="CareShield Life Integrated" field="ltcCareShield" sub="Tops up CareShield Life payouts" />
                        <Toggle label="Informal Care Benefit" field="ltcInformalCare" sub="Pays family members providing care" />
                      </div>
                      <NField label="Total Premiums Paid" field="totalPremPaid" />
                    </div>
                  ),

                  "Personal Accident": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={grid3}>
                        <NField label="Accidental Death Benefit" field="sumAssured" hint="Lump sum on accidental death" />
                        <NField label="Permanent Disability Benefit" field="paDisability" hint="Up to 100% of sum assured" />
                        <NField label="Medical Expenses Limit" field="paMedical" hint="Per accident" />
                      </div>
                      <div style={grid2}>
                        <SF label="Coverage Territory" field="paTeritory" opts={["Worldwide 24 hours","Worldwide (excl. war zones)","Asia Pacific","Singapore only"]} />
                        <TF label="Weekly Indemnity" field="paWeeklyIndemnity" placeholder="e.g. S$500/week" />
                        <Toggle label="Infectious Disease Cover" field="paInfectious" sub="COVID-19, dengue, H1N1 covered" />
                        <Toggle label="Broken Bones Cover" field="paBones" sub="Additional benefit for fractures" />
                      </div>
                      <NField label="Total Premiums Paid" field="totalPremPaid" />
                    </div>
                  ),

                  "Home": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <Label>Property Address</Label>
                        <Input placeholder="e.g. Blk 123 Tampines St 45, #08-12, S(520123)" value={form.homeAddress || ""} onChange={e => setF("homeAddress", e.target.value)} />
                      </div>
                      <div style={grid3}>
                        <SF label="Property Type" field="homeType" opts={["HDB Flat","HDB BTO","Condominium","Landed – Terrace","Landed – Semi-D","Landed – Bungalow"]} />
                        <NField label="Building / Structure" field="sumAssured" hint="Rebuilding cost" />
                        <NField label="Home Contents" field="homeContents" hint="Furniture, electronics, valuables" />
                      </div>
                      <div style={grid3}>
                        <NField label="Renovation Coverage" field="homeRenovation" hint="Custom fittings & fixtures" />
                        <NField label="Public Liability" field="homeLiability" hint="Third-party injury/damage" />
                        <TF label="Mortgage Lender" field="homeMortgagee" placeholder="e.g. DBS Bank" />
                      </div>
                      <div style={grid2}>
                        <Toggle label="Accidental Damage Cover" field="homeAccidental" sub="Sudden & unforeseen physical loss" />
                        <Toggle label="Domestic Helper Cover" field="homeMaidCover" sub="FDW personal accident included" />
                      </div>
                      <NField label="Total Premiums Paid" field="totalPremPaid" />
                    </div>
                  ),

                  "Motor": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={grid3}>
                        <TF label="Vehicle Make & Model" field="motorMake" placeholder="e.g. Toyota Camry" />
                        <TF label="Plate Number" field="motorPlate" placeholder="e.g. SBA1234X" />
                        <TF label="Year of Manufacture" field="motorYear" placeholder="e.g. 2022" />
                      </div>
                      <div style={grid3}>
                        <NField label="Market Value / Sum Insured" field="sumAssured" hint="Current market value" />
                        <TF label="No-Claim Discount (NCD)" field="motorNCD" placeholder="e.g. 50%" />
                        <SF label="Workshop Type" field="motorWorkshop" opts={["Authorised Workshop","Any Workshop"]} />
                      </div>
                      <div style={grid2}>
                        <SF label="Coverage Type" field="motorCoverType" opts={["Comprehensive","Third Party, Fire & Theft (TPFT)","Third Party Only (TPO)"]} />
                        <TF label="Engine Capacity" field="motorCC" placeholder="e.g. 1,998cc" />
                        <Toggle label="Personal Accident Benefit" field="motorPA" sub="Driver & passengers covered" />
                        <Toggle label="24h Roadside Assistance" field="motorRoadside" sub="Towing, battery jump, flat tyre" />
                      </div>
                      <NField label="Total Premiums Paid" field="totalPremPaid" />
                    </div>
                  ),

                  "Travel": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={grid2}>
                        <SF label="Trip Type" field="travelTripType" opts={["Single Trip","Annual Multi-Trip","Long Stay"]} />
                        <SF label="Destination Coverage" field="travelDestination" opts={["Worldwide","Worldwide (excl. USA/Canada)","Asia Pacific","ASEAN","Singapore only"]} />
                      </div>
                      <div style={grid3}>
                        <NField label="Medical / Evacuation Limit" field="sumAssured" hint="Emergency overseas medical" />
                        <NField label="Baggage & Personal Effects" field="travelBaggage" hint="Lost / damaged baggage" />
                        <NField label="Trip Cancellation Limit" field="travelCancellation" hint="Non-refundable trip costs" />
                      </div>
                      <div style={grid3}>
                        <TF label="Trip Start Date" field="travelStart" placeholder="YYYY-MM-DD" />
                        <TF label="Trip End Date" field="travelEnd" placeholder="YYYY-MM-DD" />
                        <TF label="No. of Travellers" field="travelPax" placeholder="e.g. 2" />
                      </div>
                      <div style={grid2}>
                        <Toggle label="Trip Delay Coverage" field="travelDelay" sub="Payout after 6h delay" />
                        <Toggle label="Home Content Burglary" field="travelBurglary" sub="Home theft during trip" />
                      </div>
                    </div>
                  ),

                  "Maid / FDW": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={grid2}>
                        <TF label="Helper's Full Name" field="maidName" placeholder="e.g. Maria Santos" />
                        <TF label="Passport Number" field="maidPassport" placeholder="e.g. A1234567B" />
                      </div>
                      <div style={grid2}>
                        <TF label="Work Permit Number" field="maidWorkPermit" placeholder="e.g. G1234567P" />
                        <TF label="Nationality" field="maidNationality" placeholder="e.g. Philippines" />
                      </div>
                      <div style={grid3}>
                        <NField label="Hospitalisation Limit" field="maidHospital" hint="Per year hospitalisation" />
                        <NField label="Personal Accident Benefit" field="sumAssured" hint="Accidental death / disablement" />
                        <NField label="Repatriation Limit" field="maidRepatriation" hint="Return to home country" />
                      </div>
                      <div style={grid2}>
                        <Toggle label="Security Bond Included" field="maidBond" sub="S$5,000 MOM security bond" />
                        <Toggle label="Employer's Liability" field="maidLiability" sub="Work injury compensation" />
                        <Toggle label="Outpatient / Specialist Cover" field="maidOutpatient" sub="GP & specialist visits" />
                        <Toggle label="Personal Belongings Cover" field="maidBelongings" sub="Loss of personal effects" />
                      </div>
                      <NField label="Total Premiums Paid" field="totalPremPaid" />
                    </div>
                  ),

                  "Business": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={grid2}>
                        <TF label="Business Name" field="bizName" placeholder="e.g. Dilwyn Pte Ltd" />
                        <TF label="UEN / Registration No." field="bizUEN" placeholder="e.g. 202312345A" />
                      </div>
                      <div style={grid2}>
                        <SF label="Business Type" field="bizType" opts={["Sole Proprietorship","Partnership","Private Limited","Public Limited","Non-Profit"]} />
                        <SF label="Insurance Category" field="bizCategory" opts={["Public Liability","Professional Indemnity","D&O Liability","Keyman Insurance","Business Interruption","Fire & Perils","Work Injury Compensation","Cyber Insurance","Group Medical"]} />
                      </div>
                      <div style={grid3}>
                        <NField label="Coverage / Indemnity Limit" field="sumAssured" hint="Maximum liability covered" />
                        <NField label="Excess / Deductible" field="bizDeductible" hint="Your first-loss contribution" />
                        <NField label="Total Premiums Paid" field="totalPremPaid" />
                      </div>
                      <div style={grid2}>
                        <Toggle label="Retroactive Coverage" field="bizRetroactive" sub="Covers claims from prior incidents" />
                        <Toggle label="Run-Off Coverage" field="bizRunOff" sub="Post-business closure protection" />
                      </div>
                    </div>
                  ),

                  "Other": (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <Label>Coverage Description</Label>
                        <textarea value={form.otherCoverageDesc || ""} onChange={e => setF("otherCoverageDesc", e.target.value)} placeholder="Describe what this policy covers…"
                          style={{ width: "100%", boxSizing: "border-box", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none", resize: "vertical", minHeight: 64 }} />
                      </div>
                      <div style={grid3}>
                        <NField label="Sum Assured / Coverage" field="sumAssured" />
                        <NField label="Cash Value" field="cashValue" />
                        <NField label="Total Premiums Paid" field="totalPremPaid" />
                      </div>
                    </div>
                  ),
                };

                return (
                  <div style={{ background: tc.bg + "55", border: `1px solid ${tc.color}30`, borderRadius: 12, padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <span style={{ fontSize: 18 }}>{tc.icon}</span>
                      <div style={{ fontSize: 12, fontWeight: 700, color: tc.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{form.type} — Coverage Details</div>
                    </div>
                    {typeFields[form.type] || typeFields["Other"]}
                  </div>
                );
              })()}

              {/* Prompt when no type selected */}
              {!form.type && (
                <div style={{ background: T.inputBg, borderRadius: 12, padding: "24px", textAlign: "center", border: `2px dashed ${T.border}` }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>👆</div>
                  <div style={{ fontSize: 13, color: T.muted }}>Select an insurance type above to see relevant coverage fields</div>
                </div>
              )}

              {/* Premium schedule card */}
              <div style={{ background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 18px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  💳 Premium Schedule
                </div>

                {/* Frequency pill selector */}
                <div style={{ marginBottom: 14 }}>
                  <Label required>Payment Frequency</Label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { key: "Monthly",      label: "Monthly",       sub: "12× / yr" },
                      { key: "Quarterly",    label: "Quarterly",     sub: "4× / yr" },
                      { key: "Half-Yearly",  label: "Half-Yearly",   sub: "2× / yr" },
                      { key: "Yearly",       label: "Annually",      sub: "1× / yr" },
                      { key: "Single Premium", label: "Single",      sub: "One-off" },
                    ].map(({ key, label, sub }) => (
                      <button key={key} onClick={() => setF("premFreq", key)}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center",
                          padding: "9px 14px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit",
                          border: `1px solid ${form.premFreq === key ? T.selected : T.border}`,
                          background: form.premFreq === key ? T.selected : T.bg,
                          minWidth: 78,
                        }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: form.premFreq === key ? T.selectedText : T.text }}>{label}</span>
                        <span style={{ fontSize: 10, color: form.premFreq === key ? "#9CA3AF" : T.dim, marginTop: 2 }}>{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount + next due */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <Label required>Premium Amount</Label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: T.muted, fontWeight: 600, pointerEvents: "none" }}>S$</span>
                      <input type="number" placeholder="0.00" value={form.premium} onChange={e => setF("premium", e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px 9px 30px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none" }} />
                    </div>
                    {form.premium && form.premFreq && form.premFreq !== "Single Premium" && (() => {
                      const mult = { Monthly:12, Quarterly:4, "Half-Yearly":2, Yearly:1 }[form.premFreq] || 1;
                      const annual = parseFloat(form.premium) * mult;
                      return <div style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>≈ S${annual.toLocaleString(undefined,{maximumFractionDigits:0})} / year</div>;
                    })()}
                  </div>
                  <div>
                    <Label required>Next Premium Due</Label>
                    <Input type="date" value={form.nextPremDue} onChange={e => setF("nextPremDue", e.target.value)} />
                    {form.nextPremDue && (() => {
                      const today = new Date("2026-03-10");
                      const due = new Date(form.nextPremDue);
                      const daysUntil = Math.ceil((due - today) / 86400000);
                      const color = daysUntil < 0 ? T.down : daysUntil <= 14 ? T.warn : T.up;
                      const label = daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? "Due today" : `${daysUntil}d away`;
                      return <div style={{ fontSize: 11, color, marginTop: 5, fontWeight: 500 }}>● {label}</div>;
                    })()}
                  </div>
                </div>

                {/* Reminder toggle */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: form.reminderEnabled ? 12 : 0 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 16 }}>🔔</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Premium Reminder</div>
                        <div style={{ fontSize: 11, color: T.muted }}>Get alerted before the due date</div>
                      </div>
                    </div>
                    {/* Toggle */}
                    <div onClick={() => setF("reminderEnabled", !form.reminderEnabled)}
                      style={{ width: 40, height: 22, borderRadius: 11, background: form.reminderEnabled ? T.selected : T.border, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: 3, left: form.reminderEnabled ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: T.bg, transition: "left 0.2s" }} />
                    </div>
                  </div>

                  {form.reminderEnabled && (
                    <div>
                      <Label>Remind me</Label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[7, 14, 30, 60].map(d => (
                          <button key={d} onClick={() => setF("reminderDays", d)}
                            style={{ flex: 1, padding: "8px 4px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: form.reminderDays === d ? 600 : 400, border: `1px solid ${form.reminderDays === d ? T.selected : T.border}`, background: form.reminderDays === d ? T.selected : T.bg, color: form.reminderDays === d ? T.selectedText : T.muted }}>
                            {d}d before
                          </button>
                        ))}
                      </div>
                      {form.nextPremDue && form.reminderEnabled && (() => {
                        const reminderDate = new Date(new Date(form.nextPremDue).getTime() - form.reminderDays * 86400000);
                        return (
                          <div style={{ marginTop: 10, background: T.accentBg, border: `1px solid ${T.accent}30`, borderRadius: 8, padding: "9px 13px", display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 14 }}>📅</span>
                            <span style={{ fontSize: 12, color: T.accent }}>
                              Reminder will be sent on <strong>{reminderDate.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</strong>
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <Label>Policy Start Date</Label>
                  <Input type="date" value={form.startDate} onChange={e => setF("startDate", e.target.value)} />
                </div>
                <div>
                  <Label>Policy End Date</Label>
                  <Input type="date" value={form.endDate} onChange={e => setF("endDate", e.target.value)} />
                </div>
              </div>

              {/* Riders */}
              <div>
                <Label>Riders</Label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={form.riderInput||""} onChange={e => setF("riderInput", e.target.value)}
                    onKeyDown={e => { if (e.key==="Enter" && form.riderInput && form.riderInput.trim()) { setF("riders", [...(form.riders||[]), form.riderInput.trim()]); setF("riderInput",""); e.preventDefault(); } }}
                    placeholder="Type rider name and press Enter…"
                    style={{ flex: 1, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none" }} />
                </div>
                {(form.riders || []).length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {form.riders.map((r,i) => (
                      <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, background: T.upBg, color: T.up, borderRadius: 6, padding: "4px 10px", fontSize: 12 }}>
                        {r}
                        <button onClick={() => setF("riders", form.riders.filter((_,j)=>j!==i))} style={{ background:"none",border:"none",cursor:"pointer",color:T.up,fontSize:13,lineHeight:1,padding:"0 0 0 2px" }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Exclusions */}
              <div>
                <Label>Exclusions</Label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={form.exclusionInput||""} onChange={e => setF("exclusionInput", e.target.value)}
                    onKeyDown={e => { if (e.key==="Enter" && form.exclusionInput && form.exclusionInput.trim()) { setF("exclusions", [...(form.exclusions||[]), form.exclusionInput.trim()]); setF("exclusionInput",""); e.preventDefault(); } }}
                    placeholder="Type exclusion and press Enter…"
                    style={{ flex: 1, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none" }} />
                </div>
                {(form.exclusions || []).length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
                    {form.exclusions.map((ex,i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: T.downBg, borderRadius: 7, padding: "6px 12px", fontSize: 12 }}>
                        <span style={{ color: T.down }}>✕</span>
                        <span style={{ flex: 1, color: T.text }}>{ex}</span>
                        <button onClick={() => setF("exclusions", form.exclusions.filter((_,j)=>j!==i))} style={{ background:"none",border:"none",cursor:"pointer",color:T.down,fontSize:14 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <textarea value={form.notes} onChange={e => setF("notes", e.target.value)} placeholder="Add any notes about this policy…"
                  style={{ width: "100%", boxSizing: "border-box", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none", resize: "vertical", minHeight: 70 }} />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleAddPolicy} disabled={!form.type || !form.insurer || !form.policyNo}
                  style={{ flex: 1, background: (!form.type||!form.insurer||!form.policyNo) ? T.inputBg : T.selected, color: (!form.type||!form.insurer||!form.policyNo) ? T.dim : T.selectedText, border: "none", borderRadius: 9, padding: "12px", fontSize: 13, cursor: (!form.type||!form.insurer||!form.policyNo) ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                  + Add Policy
                </button>
                <button onClick={() => setForm(EMPTY_POLICY)} style={{ background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: 9, padding: "12px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Clear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ ADD CLAIM MODAL ══════════════════════════════════════ */}
      {showClaimModal && claimTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowClaimModal(false); }}>
          <div style={{ background: T.bg, borderRadius: 14, width: 480, boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.sidebar, borderRadius: "14px 14px 0 0" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Record Claim</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{claimTarget.planName} · {claimTarget.policyNo}</div>
              </div>
              <button onClick={() => setShowClaimModal(false)} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 7, padding: "4px 12px", fontSize: 13, cursor: "pointer", color: T.muted }}>×</button>
            </div>
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <Label required>Claim Type</Label>
                  <Input placeholder="e.g. Hospitalisation, Critical Illness, Accident" value={claimForm.type} onChange={e => setCF("type", e.target.value)} />
                </div>
                <div>
                  <Label required>Claim Date</Label>
                  <Input type="date" value={claimForm.date} onChange={e => setCF("date", e.target.value)} />
                </div>
                <div>
                  <Label>Claim Amount (S$)</Label>
                  <Input type="number" placeholder="0" value={claimForm.amount} onChange={e => setCF("amount", e.target.value)} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <Label>Status</Label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["Pending","Approved","Rejected"].map(s => (
                      <button key={s} onClick={() => setCF("status", s)}
                        style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${claimForm.status===s ? T.selected : T.border}`, background: claimForm.status===s ? T.selected : T.inputBg, color: claimForm.status===s ? T.selectedText : T.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: claimForm.status===s ? 600 : 400 }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <Label>Notes</Label>
                  <textarea value={claimForm.notes} onChange={e => setCF("notes", e.target.value)} placeholder="Details about the claim…"
                    style={{ width: "100%", boxSizing: "border-box", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none", resize: "vertical", minHeight: 60 }} />
                </div>
              </div>
              <button onClick={handleAddClaim} disabled={!claimForm.type || !claimForm.date}
                style={{ background: (!claimForm.type||!claimForm.date) ? T.inputBg : T.selected, color: (!claimForm.type||!claimForm.date) ? T.dim : T.selectedText, border: "none", borderRadius: 9, padding: "11px", fontSize: 13, cursor: (!claimForm.type||!claimForm.date) ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                Save Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT APP — full shell matching the screenshot
═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   CREDIT CARD MODULE — Data & Screen
   ═══════════════════════════════════════════════════════════════ */

// ── Bank colour maps ──────────────────────────────────────────
const BANK_COLORS = {
  "DBS":              { from:"#E31837", to:"#8B0000",    text:"#fff" },
  "OCBC":             { from:"#E2231A", to:"#B01010",    text:"#fff" },
  "UOB":              { from:"#004B8D", to:"#002F5F",    text:"#fff" },
  "Citibank":         { from:"#003B95", to:"#00287A",    text:"#fff" },
  "Standard Chartered":{ from:"#009A44", to:"#006B2F",  text:"#fff" },
  "HSBC":             { from:"#DB0011", to:"#9A0000",    text:"#fff" },
  "Maybank":          { from:"#FABB00", to:"#C78E00",    text:"#222" },
  "American Express": { from:"#007BC1", to:"#005A8E",    text:"#fff" },
  "Trust Bank":       { from:"#1A1A2E", to:"#16213E",    text:"#fff" },
};

const CARD_NETWORKS = ["Visa","Mastercard","Amex","JCB","UnionPay"];

const TXN_CATEGORIES = [
  "Dining","Shopping","Groceries","Transport","Travel","Entertainment",
  "Healthcare","Utilities","Insurance","Fuel","Online","Education","Other"
];

const CATEGORY_ICONS = {
  Dining:"🍽",Shopping:"🛍",Groceries:"🛒",Transport:"🚌",Travel:"✈️",
  Entertainment:"🎬",Healthcare:"🏥",Utilities:"💡",Insurance:"🛡",
  Fuel:"⛽",Online:"💻",Education:"📚",Other:"💳"
};

// ── Initial data ──────────────────────────────────────────────
const EMPTY_CARD = {
  id:"", bank:"DBS", cardName:"", cardType:"Credit",
  network:"Visa", holderName:"dilwyn", last4:"", expiryMM:"12", expiryYY:"27",
  creditLimit:0, currentBalance:0, minimumPayment:0, dueDayOfMonth:28,
  apr:26.9, annualFee:0,
  companyName:"", companyUEN:"",
  linkedAccountId:null, isActive:true, notes:"",
};

const EMPTY_ACCOUNT = {
  id:"", bank:"DBS", accountName:"", accountType:"Checking",
  last4:"", balance:0, currency:"SGD", notes:"",
};

const CC_ACCOUNTS_INIT = [
  { id:"ACC001", bank:"DBS",  accountName:"DBS Multiplier",      accountType:"Savings",  last4:"2341", balance:18450, currency:"SGD" },
  { id:"ACC002", bank:"OCBC", accountName:"OCBC 360 Account",    accountType:"Savings",  last4:"8812", balance:9320,  currency:"SGD" },
  { id:"ACC003", bank:"UOB",  accountName:"UOB One Account",     accountType:"Checking", last4:"5567", balance:6150,  currency:"SGD" },
];

const CC_CARDS_INIT = [
  {
    id:"CC001", bank:"DBS", cardName:"DBS Live Fresh", cardType:"Credit",
    network:"Visa", holderName:"dilwyn", last4:"4521", expiryMM:"08", expiryYY:"27",
    creditLimit:12000, currentBalance:3240.50, minimumPayment:50, dueDayOfMonth:28,
    apr:26.9, annualFee:192.60, linkedAccountId:null, isActive:true,
    notes:"Online & Contactless 5% cashback. Waived if spend S$25k/yr.",
  },
  {
    id:"CC002", bank:"OCBC", cardName:"OCBC 365", cardType:"Credit",
    network:"Mastercard", holderName:"dilwyn", last4:"8834", expiryMM:"11", expiryYY:"26",
    creditLimit:20000, currentBalance:7812.00, minimumPayment:156.24, dueDayOfMonth:5,
    apr:26.9, annualFee:192.60, linkedAccountId:null, isActive:true,
    notes:"6% cashback on weekends. Min spend S$800/mo.",
  },
  {
    id:"CC003", bank:"UOB", cardName:"UOB PRVI Miles", cardType:"Credit",
    network:"Visa", holderName:"dilwyn", last4:"2290", expiryMM:"03", expiryYY:"28",
    creditLimit:30000, currentBalance:1545.00, minimumPayment:30.90, dueDayOfMonth:10,
    apr:26.9, annualFee:256.80, linkedAccountId:null, isActive:true,
    notes:"3 miles per S$1 on overseas. Good for travel.",
  },
  {
    id:"CC004", bank:"Standard Chartered", cardName:"SC Simply Cash", cardType:"Credit",
    network:"Visa", holderName:"dilwyn", last4:"6601", expiryMM:"06", expiryYY:"27",
    creditLimit:15000, currentBalance:0, minimumPayment:0, dueDayOfMonth:15,
    apr:26.9, annualFee:192.60, linkedAccountId:null, isActive:true,
    notes:"No min spend, no cap. Good everyday card.",
  },
  {
    id:"CC007", bank:"American Express", cardName:"Amex Business Gold", cardType:"Commercial",
    network:"Amex", holderName:"dilwyn", last4:"3008", expiryMM:"09", expiryYY:"27",
    creditLimit:50000, currentBalance:12480.00, minimumPayment:249.60, dueDayOfMonth:1,
    apr:26.9, annualFee:321, linkedAccountId:null, isActive:true,
    companyName:"Dilwyn Ventures Pte Ltd", companyUEN:"202401234Z",
    notes:"Corporate card. Used for business travel and vendor payments.",
  },
  {
    id:"CC005", bank:"DBS", cardName:"DBS Visa Debit", cardType:"Debit",
    network:"Visa", holderName:"dilwyn", last4:"2341", expiryMM:"12", expiryYY:"26",
    creditLimit:0, currentBalance:0, minimumPayment:0, dueDayOfMonth:28,
    apr:0, annualFee:0, linkedAccountId:"ACC001", isActive:true,
    notes:"Linked to DBS Multiplier account.",
  },
  {
    id:"CC006", bank:"OCBC", cardName:"OCBC Frank Debit", cardType:"Debit",
    network:"Mastercard", holderName:"dilwyn", last4:"8812", expiryMM:"05", expiryYY:"27",
    creditLimit:0, currentBalance:0, minimumPayment:0, dueDayOfMonth:28,
    apr:0, annualFee:0, linkedAccountId:"ACC002", isActive:true,
    notes:"Linked to OCBC 360 Account.",
  },
];

const CC_TRANSACTIONS_INIT = [
  { id:"T001", cardId:"CC001", date:"2026-03-10", description:"Grab Food",         category:"Dining",       amount:32.50,  type:"Debit"  },
  { id:"T002", cardId:"CC001", date:"2026-03-08", description:"Shopee",            category:"Online",       amount:89.90,  type:"Debit"  },
  { id:"T003", cardId:"CC001", date:"2026-03-07", description:"Cold Storage",      category:"Groceries",    amount:67.30,  type:"Debit"  },
  { id:"T004", cardId:"CC001", date:"2026-03-05", description:"Netflix",           category:"Entertainment",amount:19.98,  type:"Debit"  },
  { id:"T005", cardId:"CC001", date:"2026-03-01", description:"Payment - Thank You",category:"Other",       amount:500.00, type:"Credit" },
  { id:"T006", cardId:"CC002", date:"2026-03-11", description:"Dining at PS Cafe", category:"Dining",       amount:148.00, type:"Debit"  },
  { id:"T007", cardId:"CC002", date:"2026-03-09", description:"ComfortDelGro",     category:"Transport",    amount:24.60,  type:"Debit"  },
  { id:"T008", cardId:"CC002", date:"2026-03-09", description:"NTUC FairPrice",    category:"Groceries",    amount:112.50, type:"Debit"  },
  { id:"T009", cardId:"CC002", date:"2026-03-06", description:"Singapore Airlines",category:"Travel",       amount:1850.00,type:"Debit"  },
  { id:"T010", cardId:"CC002", date:"2026-03-01", description:"Payment - Thank You",category:"Other",       amount:2000.00,type:"Credit" },
  { id:"T011", cardId:"CC003", date:"2026-03-10", description:"Changi Airport T3", category:"Travel",       amount:320.00, type:"Debit"  },
  { id:"T012", cardId:"CC003", date:"2026-03-08", description:"Wingstop",          category:"Dining",       amount:28.90,  type:"Debit"  },
  { id:"T013", cardId:"CC003", date:"2026-03-05", description:"Lazada",            category:"Shopping",     amount:76.50,  type:"Debit"  },
  { id:"T014", cardId:"CC004", date:"2026-03-11", description:"Uniqlo",            category:"Shopping",     amount:89.90,  type:"Debit"  },
  { id:"T015", cardId:"CC004", date:"2026-03-10", description:"Guardian Pharmacy", category:"Healthcare",   amount:43.20,  type:"Debit"  },
  { id:"T016", cardId:"CC005", date:"2026-03-11", description:"Kopitiam",          category:"Dining",       amount:6.50,   type:"Debit"  },
  { id:"T017", cardId:"CC005", date:"2026-03-10", description:"MRT Top Up",        category:"Transport",    amount:20.00,  type:"Debit"  },
  { id:"T018", cardId:"CC006", date:"2026-03-09", description:"Giant Hypermart",   category:"Groceries",    amount:55.80,  type:"Debit"  },
];

// ── Loans mock data ───────────────────────────────────────────
const LOAN_TYPES = ["Personal Loan","Car Loan","Education Loan","Renovation Loan","Medical Loan","Business Term Loan"];

const LOAN_STATUS_COLORS = {
  Active:    { bg: T.upBg,   color: T.up },
  Completed: { bg: T.inputBg, color: T.muted },
  Overdue:   { bg: T.downBg,  color: T.down },
};

const EMPTY_LOAN = {
  id:"", loanType:"Personal Loan", lender:"DBS", borrowerName:"dilwyn",
  principalAmount:0, outstandingBalance:0, interestRate:0, rateType:"Fixed",
  tenureMonths:12, monthlyPayment:0, startDate:"", maturityDate:"",
  accountNumber:"", disbursedDate:"", purpose:"",
  status:"Active", notes:"",
  nextPaymentDue:"", reminderEnabled:true, reminderDays:14,
};

const LOANS_INIT = [
  {
    id:"LN001", loanType:"Car Loan", lender:"DBS", borrowerName:"dilwyn",
    principalAmount:85000, outstandingBalance:62340, interestRate:2.78, rateType:"Fixed",
    tenureMonths:84, monthlyPayment:1190, startDate:"2024-01-15", maturityDate:"2031-01-15",
    accountNumber:"DBS-AL-88214", disbursedDate:"2024-01-20", purpose:"Toyota Corolla Cross Hybrid — COE Jan 2024",
    status:"Active", notes:"7-year hire purchase via DBS AutoLoan. No early repayment penalty after 2 years.",
    nextPaymentDue:"2026-04-15", reminderEnabled:true, reminderDays:14,
    repayments:[
      { id:"LRP001", date:"2026-03-01", amount:1190, principal:980, interest:210, fees:0, repaymentType:"Monthly", notes:"Mar 2026" },
      { id:"LRP002", date:"2026-02-01", amount:1190, principal:975, interest:215, fees:0, repaymentType:"Monthly", notes:"Feb 2026" },
      { id:"LRP003", date:"2026-01-01", amount:1190, principal:970, interest:220, fees:0, repaymentType:"Monthly", notes:"Jan 2026" },
      { id:"LRP004", date:"2025-12-01", amount:1190, principal:965, interest:225, fees:0, repaymentType:"Monthly", notes:"Dec 2025" },
      { id:"LRP005", date:"2025-11-01", amount:1190, principal:960, interest:230, fees:0, repaymentType:"Monthly", notes:"Nov 2025" },
    ],
  },
  {
    id:"LN002", loanType:"Personal Loan", lender:"Standard Chartered", borrowerName:"dilwyn",
    principalAmount:30000, outstandingBalance:18200, interestRate:3.88, rateType:"Fixed",
    tenureMonths:36, monthlyPayment:886, startDate:"2025-04-01", maturityDate:"2028-04-01",
    accountNumber:"SC-PL-44210", disbursedDate:"2025-04-05", purpose:"Wedding expenses and honeymoon travel",
    status:"Active", notes:"SC CashOne personal loan. 3-year fixed rate. Early repayment fee 2% of outstanding.",
    nextPaymentDue:"2026-04-01", reminderEnabled:true, reminderDays:7,
    repayments:[
      { id:"LRP006", date:"2026-03-01", amount:886, principal:828, interest:58, fees:0, repaymentType:"Monthly", notes:"Mar 2026" },
      { id:"LRP007", date:"2026-02-01", amount:886, principal:825, interest:61, fees:0, repaymentType:"Monthly", notes:"Feb 2026" },
      { id:"LRP008", date:"2026-01-01", amount:886, principal:822, interest:64, fees:0, repaymentType:"Monthly", notes:"Jan 2026" },
    ],
  },
  {
    id:"LN003", loanType:"Education Loan", lender:"OCBC", borrowerName:"dilwyn",
    principalAmount:45000, outstandingBalance:31500, interestRate:4.50, rateType:"Fixed",
    tenureMonths:120, monthlyPayment:466, startDate:"2022-08-01", maturityDate:"2032-08-01",
    accountNumber:"OCBC-EL-92001", disbursedDate:"2022-08-10", purpose:"NUS MBA programme tuition fees",
    status:"Active", notes:"OCBC study loan. Interest-only during study period (ended Jun 2024), full repayment since Jul 2024.",
    nextPaymentDue:"2026-04-01", reminderEnabled:true, reminderDays:14,
    repayments:[
      { id:"LRP009", date:"2026-03-01", amount:466, principal:348, interest:118, fees:0, repaymentType:"Monthly", notes:"Mar 2026" },
      { id:"LRP010", date:"2026-02-01", amount:466, principal:345, interest:121, fees:0, repaymentType:"Monthly", notes:"Feb 2026" },
      { id:"LRP011", date:"2026-01-01", amount:466, principal:342, interest:124, fees:0, repaymentType:"Monthly", notes:"Jan 2026" },
    ],
  },
  {
    id:"LN004", loanType:"Renovation Loan", lender:"UOB", borrowerName:"dilwyn",
    principalAmount:50000, outstandingBalance:8400, interestRate:3.50, rateType:"Fixed",
    tenureMonths:60, monthlyPayment:910, startDate:"2021-06-01", maturityDate:"2026-06-01",
    accountNumber:"UOB-RL-60198", disbursedDate:"2021-06-10", purpose:"HDB Tampines flat full renovation — kitchen, bathrooms, flooring",
    status:"Active", notes:"UOB renovation loan. Final repayment Jun 2026. Almost fully paid off.",
    nextPaymentDue:"2026-03-08", reminderEnabled:true, reminderDays:14,
    repayments:[
      { id:"LRP012", date:"2026-03-01", amount:910, principal:885, interest:25, fees:0, repaymentType:"Monthly", notes:"Mar 2026" },
      { id:"LRP013", date:"2026-02-01", amount:910, principal:882, interest:28, fees:0, repaymentType:"Monthly", notes:"Feb 2026" },
      { id:"LRP014", date:"2026-01-01", amount:910, principal:879, interest:31, fees:0, repaymentType:"Monthly", notes:"Jan 2026" },
    ],
  },
  {
    id:"LN005", loanType:"Personal Loan", lender:"HSBC", borrowerName:"dilwyn",
    principalAmount:15000, outstandingBalance:0, interestRate:4.20, rateType:"Fixed",
    tenureMonths:24, monthlyPayment:654, startDate:"2023-09-01", maturityDate:"2025-09-01",
    accountNumber:"HSBC-PL-77031", disbursedDate:"2023-09-05", purpose:"Emergency dental surgery and medical bills",
    status:"Completed", notes:"Fully repaid Sep 2025. No outstanding balance.",
    nextPaymentDue:"", reminderEnabled:false, reminderDays:14,
    repayments:[
      { id:"LRP015", date:"2025-09-01", amount:654, principal:650, interest:4, fees:0, repaymentType:"Full", notes:"Final repayment — Sep 2025" },
    ],
  },
  {
    id:"LN006", loanType:"Business Term Loan", lender:"DBS", borrowerName:"dilwyn",
    principalAmount:100000, outstandingBalance:74500, interestRate:5.25, rateType:"Floating",
    tenureMonths:60, monthlyPayment:1898, startDate:"2025-01-15", maturityDate:"2030-01-15",
    accountNumber:"DBS-BL-10455", disbursedDate:"2025-01-20", purpose:"Working capital for Dilwyn Ventures Pte Ltd — equipment and inventory",
    status:"Active", notes:"DBS SME term loan. SORA + 2.5%. Quarterly rate review. Secured against personal guarantee.",
    nextPaymentDue:"2026-04-15", reminderEnabled:true, reminderDays:30,
    repayments:[
      { id:"LRP016", date:"2026-03-01", amount:1898, principal:1572, interest:326, fees:0, repaymentType:"Monthly", notes:"Mar 2026" },
      { id:"LRP017", date:"2026-02-01", amount:1898, principal:1565, interest:333, fees:0, repaymentType:"Monthly", notes:"Feb 2026" },
      { id:"LRP018", date:"2026-01-01", amount:1898, principal:1558, interest:340, fees:0, repaymentType:"Monthly", notes:"Jan 2026" },
    ],
  },
];

const LOAN_TYPE_ICONS = {
  "Personal Loan": "💰",
  "Car Loan": "🚗",
  "Education Loan": "🎓",
  "Renovation Loan": "🔨",
  "Medical Loan": "🏥",
  "Business Term Loan": "🏢",
};

// ── Loan Modal ────────────────────────────────────────────────
function LoanModal({ loan, onSave, onClose }) {
  const [f, setF] = useState({ ...loan });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}
      onClick={onClose}>
      <div style={{ background:T.bg, borderRadius:16, width:520, maxHeight:"85vh", overflow:"auto", padding:"28px 28px 20px", border:`1px solid ${T.border}` }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:16, fontWeight:800, marginBottom:20 }}>{f.id ? "Edit Loan" : "Add Loan"}</div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          <div><Label required>Loan Type</Label><Sel value={f.loanType} onChange={e=>set("loanType",e.target.value)} options={LOAN_TYPES}/></div>
          <div><Label required>Lender / Bank</Label><Sel value={f.lender} onChange={e=>set("lender",e.target.value)} options={Object.keys(BANK_COLORS)}/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          <div><Label required>Principal Amount</Label><Input type="number" prefix="S$" value={f.principalAmount} onChange={e=>set("principalAmount",+e.target.value)}/></div>
          <div><Label required>Outstanding Balance</Label><Input type="number" prefix="S$" value={f.outstandingBalance} onChange={e=>set("outstandingBalance",+e.target.value)}/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 }}>
          <div><Label required>Interest Rate (%)</Label><Input type="number" value={f.interestRate} onChange={e=>set("interestRate",+e.target.value)}/></div>
          <div><Label>Rate Type</Label><Sel value={f.rateType} onChange={e=>set("rateType",e.target.value)} options={["Fixed","Floating"]}/></div>
          <div><Label required>Tenure (months)</Label><Input type="number" value={f.tenureMonths} onChange={e=>set("tenureMonths",+e.target.value)}/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          <div><Label required>Monthly Payment</Label><Input type="number" prefix="S$" value={f.monthlyPayment} onChange={e=>set("monthlyPayment",+e.target.value)}/></div>
          <div><Label>Account Number</Label><Input value={f.accountNumber} onChange={e=>set("accountNumber",e.target.value)}/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 }}>
          <div><Label required>Start Date</Label><Input type="date" value={f.startDate} onChange={e=>set("startDate",e.target.value)}/></div>
          <div><Label required>Maturity Date</Label><Input type="date" value={f.maturityDate} onChange={e=>set("maturityDate",e.target.value)}/></div>
          <div><Label>Disbursed Date</Label><Input type="date" value={f.disbursedDate} onChange={e=>set("disbursedDate",e.target.value)}/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          <div>
            <Label>Next Payment Due</Label>
            <Input type="date" value={f.nextPaymentDue||""} onChange={e=>set("nextPaymentDue",e.target.value)}/>
            {f.nextPaymentDue && (() => {
              const today = new Date();
              const due = new Date(f.nextPaymentDue);
              const daysUntil = Math.ceil((due - today) / 86400000);
              const color = daysUntil < 0 ? T.down : daysUntil <= 14 ? T.warn : T.up;
              const label = daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? "Due today" : `${daysUntil}d away`;
              return <div style={{ fontSize: 11, color, marginTop: 5, fontWeight: 500 }}>● {label}</div>;
            })()}
          </div>
          <div><Label>Purpose</Label><Input value={f.purpose} onChange={e=>set("purpose",e.target.value)} placeholder="What is this loan for?"/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          <div><Label>Status</Label><Sel value={f.status} onChange={e=>set("status",e.target.value)} options={["Active","Completed","Overdue"]}/></div>
          <div><Label>Borrower Name</Label><Input value={f.borrowerName} onChange={e=>set("borrowerName",e.target.value)}/></div>
        </div>
        <div style={{ marginBottom:14 }}>
          <Label>Notes</Label>
          <textarea value={f.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="Additional notes..."
            style={{ width:"100%", boxSizing:"border-box", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"inherit", color:T.text, outline:"none", resize:"vertical" }}/>
        </div>

        {/* Reminder toggle — matches insurance modal */}
        <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:14, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: f.reminderEnabled ? 12 : 0 }}>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ fontSize:16 }}>🔔</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>Payment Reminder</div>
                <div style={{ fontSize:11, color:T.muted }}>Get alerted before the due date</div>
              </div>
            </div>
            <div onClick={()=>set("reminderEnabled",!f.reminderEnabled)}
              style={{ width:40, height:22, borderRadius:11, background:f.reminderEnabled?T.selected:T.border, cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
              <div style={{ position:"absolute", top:3, left:f.reminderEnabled?21:3, width:16, height:16, borderRadius:"50%", background:T.bg, transition:"left 0.2s" }}/>
            </div>
          </div>
          {f.reminderEnabled && (
            <div>
              <Label>Remind me</Label>
              <div style={{ display:"flex", gap:8 }}>
                {[7,14,30,60].map(d=>(
                  <button key={d} onClick={()=>set("reminderDays",d)}
                    style={{ flex:1, padding:"8px 4px", borderRadius:8, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:f.reminderDays===d?600:400,
                      border:`1px solid ${f.reminderDays===d?T.selected:T.border}`, background:f.reminderDays===d?T.selected:T.bg, color:f.reminderDays===d?T.selectedText:T.muted }}>
                    {d}d before
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>Cancel</button>
          <button onClick={()=>onSave(f)} disabled={!f.loanType||!f.lender||!f.principalAmount||!f.startDate||!f.maturityDate}
            style={{ padding:"9px 20px", borderRadius:8, border:"none", background:T.selected, color:T.selectedText, cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700, opacity:(!f.loanType||!f.lender||!f.principalAmount||!f.startDate||!f.maturityDate)?0.4:1 }}>
            {f.id ? "Save Changes" : "Add Loan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Loan Repayment Modal ──────────────────────────────────────
function LoanRepaymentModal({ loan, onSave, onClose }) {
  const [f, setF] = useState({
    date: new Date().toISOString().slice(0,10),
    repaymentType: "Monthly",
    amount: loan.monthlyPayment,
    principal: 0,
    interest: 0,
    fees: 0,
    notes: "",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  // Auto-calculate principal = amount - interest - fees
  const computedPrincipal = Math.max(0, f.amount - f.interest - f.fees);

  // When repayment type changes, pre-fill amount
  const handleTypeChange = (type) => {
    set("repaymentType", type);
    if (type === "Monthly") set("amount", loan.monthlyPayment);
    else if (type === "Full") set("amount", loan.outstandingBalance);
    // Partial: user enters custom amount
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}
      onClick={onClose}>
      <div style={{ background:T.bg, borderRadius:16, width:460, maxHeight:"85vh", overflow:"auto", padding:"28px 28px 20px", border:`1px solid ${T.border}` }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:16, fontWeight:800, marginBottom:6 }}>Record Repayment</div>
        <div style={{ fontSize:12, color:T.muted, marginBottom:20 }}>{loan.loanType} · {loan.lender} · Outstanding: S${loan.outstandingBalance.toLocaleString(undefined,{minimumFractionDigits:2})}</div>

        {/* Repayment type selector */}
        <div style={{ marginBottom:14 }}>
          <Label required>Repayment Type</Label>
          <div style={{ display:"flex", gap:8 }}>
            {["Monthly","Partial","Full"].map(t=>(
              <button key={t} onClick={()=>handleTypeChange(t)}
                style={{ flex:1, padding:"10px 4px", borderRadius:8, cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:f.repaymentType===t?700:400,
                  border:`1px solid ${f.repaymentType===t?T.selected:T.border}`, background:f.repaymentType===t?T.selected:T.bg, color:f.repaymentType===t?T.selectedText:T.muted }}>
                {t === "Monthly" ? "💳 Monthly" : t === "Partial" ? "📝 Partial" : "✅ Full"}
              </button>
            ))}
          </div>
          <div style={{ fontSize:11, color:T.dim, marginTop:6 }}>
            {f.repaymentType === "Monthly" && "Regular monthly installment payment"}
            {f.repaymentType === "Partial" && "Custom partial payment — enter any amount below the outstanding balance"}
            {f.repaymentType === "Full" && "Full settlement of the remaining loan balance"}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          <div><Label required>Payment Date</Label><Input type="date" value={f.date} onChange={e=>set("date",e.target.value)}/></div>
          <div><Label required>Total Amount</Label><Input type="number" prefix="S$" value={f.amount} onChange={e=>set("amount",+e.target.value)} disabled={f.repaymentType==="Full"}/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 }}>
          <div><Label>Interest Portion</Label><Input type="number" prefix="S$" value={f.interest} onChange={e=>set("interest",+e.target.value)}/></div>
          <div><Label>Fees</Label><Input type="number" prefix="S$" value={f.fees} onChange={e=>set("fees",+e.target.value)}/></div>
          <div>
            <Label>Principal (auto)</Label>
            <div style={{ background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:T.up, fontWeight:600 }}>
              S${computedPrincipal.toLocaleString(undefined,{minimumFractionDigits:2})}
            </div>
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <Label>Notes</Label>
          <textarea value={f.notes} onChange={e=>set("notes",e.target.value)} rows={2} placeholder="e.g. Apr 2026 monthly installment, early partial payment..."
            style={{ width:"100%", boxSizing:"border-box", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"inherit", color:T.text, outline:"none", resize:"vertical" }}/>
        </div>

        {/* Summary */}
        <div style={{ background:T.inputBg, borderRadius:10, padding:"12px 14px", marginBottom:20, fontSize:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ color:T.muted }}>Payment Amount</span>
            <span style={{ fontWeight:700 }}>S${f.amount.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ color:T.muted }}>→ Principal</span>
            <span style={{ fontWeight:600, color:T.up }}>S${computedPrincipal.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ color:T.muted }}>→ Interest</span>
            <span style={{ fontWeight:600, color:T.down }}>S${f.interest.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
          </div>
          {f.fees > 0 && (
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ color:T.muted }}>→ Fees</span>
              <span style={{ fontWeight:600, color:T.warn }}>S${f.fees.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
            </div>
          )}
          <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:4, marginTop:4, display:"flex", justifyContent:"space-between" }}>
            <span style={{ color:T.muted }}>New Outstanding</span>
            <span style={{ fontWeight:700, color:T.text }}>S${Math.max(0, loan.outstandingBalance - computedPrincipal).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>Cancel</button>
          <button onClick={()=>onSave({ ...f, principal:computedPrincipal })} disabled={!f.date||f.amount<=0}
            style={{ padding:"9px 20px", borderRadius:8, border:"none", background:T.selected, color:T.selectedText, cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700, opacity:(!f.date||f.amount<=0)?0.4:1 }}>
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Loan Drawer (right panel detail) ──────────────────────────
function LoanDrawer({ loan, setLoans, showToast, onClose }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("overview");
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const bc = BANK_COLORS[loan.lender] || { from:"#374151", to:"#1F2937", text:"#fff" };
  const icon = LOAN_TYPE_ICONS[loan.loanType] || "💰";
  const sc = LOAN_STATUS_COLORS[loan.status] || LOAN_STATUS_COLORS.Active;
  const paidPct = loan.principalAmount > 0 ? ((loan.principalAmount - loan.outstandingBalance) / loan.principalAmount * 100) : 0;
  const totalPaid = loan.principalAmount - loan.outstandingBalance;
  const repayments = (loan.repayments || []).sort((a,b)=>b.date.localeCompare(a.date));
  const totalInterestPaid = repayments.reduce((s, r) => s + r.interest, 0);
  const totalPrincipalPaid = repayments.reduce((s, r) => s + r.principal, 0);
  const paidColor = paidPct > 80 ? T.up : paidPct > 40 ? T.warn : T.down;

  // Months remaining
  const today = new Date();
  const maturity = new Date(loan.maturityDate);
  const monthsRemaining = Math.max(0, Math.ceil((maturity - today) / (1000 * 60 * 60 * 24 * 30.44)));

  // Next payment due (assume same day-of-month as start)
  const startDay = new Date(loan.startDate).getDate() || 1;
  const nextDueDate = (() => {
    const d = new Date(today.getFullYear(), today.getMonth(), startDay);
    if (d <= today) return new Date(today.getFullYear(), today.getMonth()+1, startDay);
    return d;
  })();
  const daysUntilDue = Math.ceil((nextDueDate - today) / (1000*60*60*24));
  const nextDueDateStr = nextDueDate.toLocaleDateString("en-SG",{day:"numeric",month:"short",year:"numeric"});

  const TABS = [{id:"overview",label:"Overview"},{id:"repayments",label:"Repayments"},{id:"postings",label:"Postings"}];

  const handleAddRepayment = (repayment) => {
    const newRep = { ...repayment, id:"LRP"+Date.now() };
    const newOutstanding = Math.max(0, loan.outstandingBalance - repayment.principal);
    const newStatus = newOutstanding <= 0 ? "Completed" : loan.status;
    setLoans(prev => prev.map(l => l.id === loan.id ? {
      ...l,
      repayments: [...(l.repayments||[]), newRep],
      outstandingBalance: newOutstanding,
      status: newStatus,
    } : l));
    setShowRepaymentModal(false);
    showToast(repayment.repaymentType === "Full" ? "Loan fully repaid!" : "Repayment recorded", "success");
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Header — matches CCDrawer: sidebar bg, name + badge, pill tabs */}
      <div style={{padding:"18px 22px 14px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:14,fontWeight:800}}>{icon} {loan.loanType}</div>
            <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:5,background:sc.bg,color:sc.color}}>
              {loan.status}
            </span>
          </div>
          <button onClick={onClose} style={{background:T.inputBg,border:"none",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:15,color:T.muted}}>✕</button>
        </div>
        {/* Pill tabs — same style as CCDrawer */}
        <div style={{display:"flex",gap:4}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{padding:"6px 14px",borderRadius:8,border:"none",background:tab===t.id?T.selected:T.inputBg,
                color:tab===t.id?T.selectedText:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:tab===t.id?700:400}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content — scrollable, same padding as CCDrawer */}
      <div style={{flex:1,overflowY:"auto",minHeight:0}}>
        <div style={{padding:"18px 22px 32px",display:"flex",flexDirection:"column",gap:16}}>

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <>
              {/* Payment due alerts — matches CC due alerts */}
              {loan.status === "Active" && daysUntilDue <= 7 && (
                <div style={{background:T.warnBg,border:"1px solid #FDE68A",borderRadius:10,padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:18}}>⚠️</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.warn}}>Payment due in {daysUntilDue} day{daysUntilDue!==1?"s":""}</div>
                    <div style={{fontSize:12,color:T.warn}}>S${loan.monthlyPayment.toLocaleString(undefined,{minimumFractionDigits:2})} due {nextDueDateStr}</div>
                  </div>
                </div>
              )}
              {loan.status === "Active" && daysUntilDue > 7 && (
                <div style={{background:T.accentBg,border:"1px solid #BFDBFE",borderRadius:10,padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:18}}>🔁</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.accent}}>Recurring payment — {daysUntilDue} days until due</div>
                    <div style={{fontSize:12,color:T.accent}}>S${loan.monthlyPayment.toLocaleString(undefined,{minimumFractionDigits:2})}/mo · next due {nextDueDateStr} (day {startDay} monthly)</div>
                  </div>
                </div>
              )}
              {loan.status === "Completed" && (
                <div style={{background:T.upBg,border:"1px solid #BBF7D0",borderRadius:10,padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
                  <span>✅</span>
                  <div style={{fontSize:13,fontWeight:600,color:T.up}}>No outstanding balance — fully repaid</div>
                </div>
              )}
              {loan.status === "Overdue" && (
                <div style={{background:T.downBg,border:"1px solid #FECACA",borderRadius:10,padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:18}}>🚨</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.down}}>Payment overdue</div>
                    <div style={{fontSize:12,color:T.down}}>S${loan.outstandingBalance.toLocaleString(undefined,{minimumFractionDigits:2})} outstanding — contact lender immediately</div>
                  </div>
                </div>
              )}

              {/* Repayment progress gauge — mirrors CC utilisation gauge */}
              <div style={{background:T.inputBg,borderRadius:12,padding:"16px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.muted}}>REPAYMENT PROGRESS</div>
                  <div style={{fontSize:13,fontWeight:800,color:paidColor}}>{paidPct.toFixed(1)}%</div>
                </div>
                <div style={{height:10,borderRadius:5,background:T.border,overflow:"hidden",marginBottom:10}}>
                  <div style={{width:`${paidPct}%`,height:"100%",borderRadius:5,background:paidColor,transition:"width 0.4s"}}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {[
                    {label:"Paid",value:`S$${totalPaid.toLocaleString(undefined,{minimumFractionDigits:2})}`,color:T.up},
                    {label:"Outstanding",value:`S$${loan.outstandingBalance.toLocaleString(undefined,{minimumFractionDigits:2})}`,color:T.down},
                    {label:"Principal",value:`S$${loan.principalAmount.toLocaleString()}`,color:T.text},
                  ].map(s=>(
                    <div key={s.label} style={{textAlign:"center"}}>
                      <div style={{fontSize:10,color:T.muted,marginBottom:3}}>{s.label}</div>
                      <div style={{fontSize:13,fontWeight:700,color:s.color}}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spend stats — same 2-col grid as CC */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[
                  {label:"Monthly Payment",value:`S$${loan.monthlyPayment.toLocaleString(undefined,{minimumFractionDigits:2})}`,sub:`${loan.rateType} rate at ${loan.interestRate}%`},
                  {label:"Months Remaining",value:loan.status==="Completed"?"—":String(monthsRemaining),sub:loan.status==="Completed"?"Fully repaid":`Maturity: ${loan.maturityDate}`},
                ].map(s=>(
                  <div key={s.label} style={{background:T.inputBg,borderRadius:10,padding:"14px 16px"}}>
                    <div style={{fontSize:11,color:T.muted,marginBottom:4}}>{s.label}</div>
                    <div style={{fontSize:16,fontWeight:800}}>{s.value}</div>
                    <div style={{fontSize:11,color:T.dim,marginTop:2}}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Interest breakdown — same rounded bar category style as CC spend by category */}
              {repayments.length > 0 && (
                <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                  <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📊 Interest vs Principal Breakdown</div>
                  {[
                    {label:"Principal Paid",amount:totalPrincipalPaid,icon:"💵",color:T.up},
                    {label:"Interest Paid",amount:totalInterestPaid,icon:"🏦",color:T.down},
                    {label:"Total Cost",amount:totalPrincipalPaid+totalInterestPaid,icon:"📈",color:T.text},
                  ].map((item,i)=>{
                    const pct = (totalPrincipalPaid+totalInterestPaid) > 0 ? (item.amount/(totalPrincipalPaid+totalInterestPaid)*100) : 0;
                    return (
                      <div key={item.label} style={{padding:"10px 16px",borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:16,width:22}}>{item.icon}</span>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                            <span style={{fontSize:12,fontWeight:600}}>{item.label}</span>
                            <span style={{fontSize:12,fontWeight:700}}>S${item.amount.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
                          </div>
                          {item.label !== "Total Cost" && (
                            <div style={{height:4,borderRadius:2,background:T.border,overflow:"hidden"}}>
                              <div style={{width:`${pct}%`,height:"100%",borderRadius:2,background:item.color}}/>
                            </div>
                          )}
                        </div>
                        {item.label !== "Total Cost" && <span style={{fontSize:11,color:T.muted,width:36,textAlign:"right"}}>{pct.toFixed(0)}%</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Loan details — same key/value row style as CC Card Details */}
              <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📋 Loan Details</div>
                {[
                  ["Loan Type", loan.loanType],
                  ["Lender / Bank", loan.lender],
                  ["Interest Rate", `${loan.interestRate}% p.a. (${loan.rateType})`],
                  ["Tenure", `${loan.tenureMonths} months`],
                  loan.status !== "Completed" ? ["Months Remaining", `${monthsRemaining} months`] : null,
                  ["Start Date", loan.startDate],
                  ["Maturity Date", loan.maturityDate],
                  loan.disbursedDate ? ["Disbursed Date", loan.disbursedDate] : null,
                  loan.accountNumber ? ["Account No.", loan.accountNumber] : null,
                  ["Borrower", loan.borrowerName],
                  loan.purpose ? ["Purpose", loan.purpose] : null,
                  loan.notes ? ["Notes", loan.notes] : null,
                ].filter(Boolean).map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                    <span style={{fontSize:12,color:T.muted}}>{k}</span>
                    <span style={{fontSize:12,fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Reminder settings display — matches insurance */}
              {loan.status !== "Completed" && (
                <div style={{background:T.inputBg,borderRadius:10,padding:"14px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{fontSize:16}}>🔔</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:600}}>Payment Reminder</div>
                        <div style={{fontSize:11,color:T.muted}}>
                          {loan.reminderEnabled ? `Alert ${loan.reminderDays || 14} days before due date` : "Reminders disabled"}
                        </div>
                      </div>
                    </div>
                    <Badge bg={loan.reminderEnabled ? T.upBg : T.inputBg} color={loan.reminderEnabled ? T.up : T.dim}>
                      {loan.reminderEnabled ? "On" : "Off"}
                    </Badge>
                  </div>
                  {loan.reminderEnabled && loan.nextPaymentDue && (() => {
                    const rd = new Date(new Date(loan.nextPaymentDue).getTime() - (loan.reminderDays||14) * 86400000);
                    return <div style={{fontSize:12,color:T.accent,marginTop:8}}>📅 Next reminder: {rd.toLocaleDateString("en-SG",{day:"numeric",month:"short",year:"numeric"})}</div>;
                  })()}
                </div>
              )}
            </>
          )}

          {/* ── REPAYMENTS — mirrors CC Transactions tab ── */}
          {tab === "repayments" && (
            <>
              {loan.status !== "Completed" && (
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                  <div style={{flex:1,fontSize:13,fontWeight:600,color:T.muted}}>{repayments.length} repayment{repayments.length!==1?"s":""}</div>
                  <button onClick={()=>setShowRepaymentModal(true)}
                    style={{padding:"8px 16px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,whiteSpace:"nowrap"}}>
                    + Add Repayment
                  </button>
                </div>
              )}
              {repayments.length === 0 ? (
                <div style={{textAlign:"center",padding:"32px 20px",color:T.muted}}>
                  <div style={{fontSize:28,marginBottom:8}}>🏦</div>
                  <div style={{fontSize:13,fontWeight:600}}>No repayment records yet</div>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:1,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                  {repayments.map((r,i)=>(
                    <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",background:i%2===0?T.bg:T.inputBg,
                      borderTop:i>0?`1px solid ${T.border}`:"none"}}>
                      <div style={{width:34,height:34,borderRadius:8,background:T.inputBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                        💳
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.notes || "Loan Repayment"}</div>
                        <div style={{fontSize:11,color:T.muted,marginTop:1,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                          <span>{r.date}</span>
                          <span style={{fontSize:10,color:T.up,background:T.upBg,borderRadius:4,padding:"1px 6px"}}>Principal: S${r.principal.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
                          <span style={{fontSize:10,color:T.down,background:T.downBg,borderRadius:4,padding:"1px 6px"}}>Interest: S${r.interest.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
                          {r.fees > 0 && <span style={{fontSize:10,color:T.warn,background:T.warnBg,borderRadius:4,padding:"1px 6px"}}>Fees: S${r.fees.toLocaleString(undefined,{minimumFractionDigits:2})}</span>}
                        </div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:T.down}}>
                          - S${r.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
                        </div>
                        <div style={{fontSize:10,color:T.dim,marginTop:1}}>{r.repaymentType || "Repayment"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── POSTINGS — mirrors CC Postings tab (double-entry ledger) ── */}
          {tab === "postings" && (() => {
            const inter = "'Inter','Segoe UI',system-ui,sans-serif";
            const mono  = "'Courier New',Courier,monospace";
            const sym   = "S$";
            const loanLiabilityAcct = `Liabilities:Loan:${loan.lender.replace(/ /g,"")}:${loan.loanType.replace(/ /g,"")}`;
            const bankAcct = "Assets:Bank:Cash";
            const interestAcct = `Expenses:Interest:${loan.loanType.replace(/ /g,"")}`;
            const feesAcct = "Expenses:Fees:Loan";

            const sorted = [...repayments].sort((a,b) => a.date.localeCompare(b.date));

            const daysAgo = (d) => {
              if (!d) return "";
              const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
              return diff === 0 ? "Today" : diff === 1 ? "1 day ago" : diff + " days ago";
            };

            const fmtAmt = (v) => sym + Math.abs(v).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});

            // Each repayment = principal reduces liability, interest is an expense, both come from bank
            const tableRows = sorted.flatMap((r) => {
              const rows = [];
              // Dr Liabilities:Loan (reduces debt) for principal portion
              rows.push({ date: r.date, desc: r.notes || "Loan repayment", account: loanLiabilityAcct, amount: fmtAmt(r.principal), debit: true, _first: true });
              // Dr Expenses:Interest for interest portion
              if (r.interest > 0) {
                rows.push({ date: null, desc: "", account: interestAcct, amount: fmtAmt(r.interest), debit: true, _first: false });
              }
              // Dr Expenses:Fees if any
              if (r.fees > 0) {
                rows.push({ date: null, desc: "", account: feesAcct, amount: fmtAmt(r.fees), debit: true, _first: false });
              }
              // Cr Assets:Bank (cash out = total amount)
              rows.push({ date: null, desc: "", account: bankAcct, amount: fmtAmt(r.amount), debit: false, _first: false });
              return rows;
            });

            if (isMobile && tableRows.length > 0) return <MobilePostingsList journalRows={tableRows} entryCount={repayments.length} entryLabel="repayments"/>;
            if (tableRows.length === 0) {
              return (
                <div style={{textAlign:"center",padding:"48px 20px",color:T.muted}}>
                  <div style={{fontSize:32,marginBottom:10}}>📒</div>
                  <div style={{fontSize:13,fontWeight:600}}>No repayments to post</div>
                  <div style={{fontSize:12,marginTop:4}}>Repayment records will appear here as ledger postings</div>
                </div>
              );
            }

            return (
              <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",background:T.bg}}>
                {/* Header */}
                <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:inter}}>Ledger Postings</div>
                  <div style={{fontSize:12,color:T.accent,marginTop:3,fontFamily:inter}}>Double-entry bookkeeping · PTA compliant · {sorted.length} repayments</div>
                </div>

                {/* Table */}
                <div style={{overflowX:"auto",overflowY:"auto",maxHeight:480}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:580}}>
                    <thead>
                      <tr style={{borderBottom:`1px solid ${T.border}`}}>
                        <th style={{padding:"9px 16px",textAlign:"left",width:148,fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,letterSpacing:"0.02em",whiteSpace:"nowrap"}}>Date</th>
                        <th style={{padding:"9px 16px",textAlign:"left",fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,letterSpacing:"0.02em"}}>Account</th>
                        <th style={{padding:"9px 16px",textAlign:"left",fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,letterSpacing:"0.02em"}}>Description</th>
                        <th style={{padding:"9px 16px",textAlign:"right",width:148,fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,letterSpacing:"0.02em"}}>Debit</th>
                        <th style={{padding:"9px 16px",textAlign:"right",width:148,fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,letterSpacing:"0.02em"}}>Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, ri) => (
                        <tr key={ri} style={{borderBottom:`1px solid ${T.border}`}}>
                          <td style={{padding:"11px 16px",verticalAlign:"top",width:148}}>
                            {row._first ? (
                              <>
                                <div style={{fontSize:13,fontWeight:400,color:T.text,fontFamily:inter,whiteSpace:"nowrap"}}>{row.date}</div>
                                <div style={{fontSize:11,color:T.dim,marginTop:2,fontFamily:inter}}>{daysAgo(row.date)}</div>
                              </>
                            ) : null}
                          </td>
                          <td style={{padding:"11px 16px",verticalAlign:"top"}}>
                            <span style={{fontFamily:mono,fontSize:12,color:T.text}}>{row.account}</span>
                          </td>
                          <td style={{padding:"11px 16px",verticalAlign:"top",fontSize:12,color:T.muted,fontFamily:inter}}>{row.desc}</td>
                          <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                            {row.debit
                              ? <span style={{fontSize:13,fontWeight:700,color:T.up,fontFamily:inter}}>{row.amount}</span>
                              : <span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                          </td>
                          <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                            {!row.debit
                              ? <span style={{fontSize:13,fontWeight:700,color:T.down,fontFamily:inter}}>{row.amount}</span>
                              : <span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div style={{padding:"12px 18px",borderTop:`1px solid ${T.border}`,background:T.sidebar}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:6,fontFamily:inter}}>Double-Entry Accounting</div>
                  <div style={{fontSize:11,color:T.muted,lineHeight:1.8,fontFamily:inter}}>
                    <div>• <span style={{color:T.up,fontWeight:600}}>Debit (Dr):</span> Repayment → reduces loan liability; Interest portion → recorded as expense</div>
                    <div>• <span style={{color:T.down,fontWeight:600}}>Credit (Cr):</span> Repayment → reduces bank cash (money out)</div>
                  </div>
                  <div style={{fontSize:11,color:T.dim,marginTop:8,fontFamily:inter}}>Every repayment has equal debits and credits (sum = 0)</div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* Repayment modal */}
      {showRepaymentModal && (
        <LoanRepaymentModal loan={loan} onSave={handleAddRepayment} onClose={()=>setShowRepaymentModal(false)} />
      )}
    </div>
  );
}

// ── Loans Screen ──────────────────────────────────────────────
function LoansScreen({ loans, setLoans, showToast }) {
  const isMobile = useIsMobile();
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editLoan, setEditLoan] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const lnSort = useSortState();

  const activeLoans = loans.filter(l => l.status === "Active");
  const totalOutstanding = activeLoans.reduce((s, l) => s + l.outstandingBalance, 0);
  const totalMonthly = activeLoans.reduce((s, l) => s + l.monthlyPayment, 0);
  const totalPrincipal = loans.reduce((s, l) => s + l.principalAmount, 0);
  const totalPaid = totalPrincipal - loans.reduce((s, l) => s + l.outstandingBalance, 0);
  const overallPaidPct = totalPrincipal > 0 ? (totalPaid / totalPrincipal * 100) : 0;

  const filteredLoans = loans.filter(l => {
    if (filterType !== "All" && l.loanType !== filterType) return false;
    if (filterStatus !== "All" && l.status !== filterStatus) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!(l.loanType||"").toLowerCase().includes(q) && !(l.lender||"").toLowerCase().includes(q) && !(l.accountNumber||"").toLowerCase().includes(q) && !(l.purpose||"").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleSave = (f) => {
    if (f.id) {
      setLoans(prev => prev.map(l => l.id === f.id ? { ...l, ...f } : l));
      showToast("Loan updated", "success");
    } else {
      const nl = { ...f, id: "LN" + Date.now(), repayments: [] };
      setLoans(prev => [...prev, nl]);
      showToast("Loan added", "success");
    }
    setShowModal(false);
    setEditLoan(null);
  };

  // Alert data
  const TODAY = new Date();
  const overdueLoans = loans.filter(l => l.status === "Active" && l.nextPaymentDue && new Date(l.nextPaymentDue) < TODAY);
  const upcomingLoans = loans.filter(l => {
    if (!l.reminderEnabled || !l.nextPaymentDue || l.status !== "Active") return false;
    const d = Math.ceil((new Date(l.nextPaymentDue) - TODAY) / 86400000);
    return d >= 0 && d <= (l.reminderDays || 14);
  }).sort((a, b) => new Date(a.nextPaymentDue) - new Date(b.nextPaymentDue));

  // Type breakdown for progress bars
  const typeBreakdown = {};
  activeLoans.forEach(l => { typeBreakdown[l.loanType] = (typeBreakdown[l.loanType] || 0) + l.outstandingBalance; });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>

      {/* ── Page header ── */}
      <div className="wo-page-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700 }}>Loan Portfolio</div>
          <div style={{ fontSize:13, color:T.muted, marginTop:2 }}>{activeLoans.length} active loan{activeLoans.length!==1?"s":""} · {loans.length} total</div>
        </div>
        <button onClick={() => { setEditLoan({ ...EMPTY_LOAN, id:"" }); setShowModal(true); }}
          style={{ background:T.selected, color:T.selectedText, border:"none", borderRadius:9, padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>
          + Add Loan
        </button>
      </div>

      {/* ── Summary cards — 4 col grid like insurance ── */}
      <div className="wo-summary-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, marginBottom:18 }}>
        {[
          { label:"Total Outstanding", value:fmtCompact(totalOutstanding), sub:`${activeLoans.length} active loans`, icon:"🏦", color:T.down },
          { label:"Monthly Outflow", value:fmtCompact(totalMonthly), sub:"Total monthly payments", icon:"💳", color:T.warn },
          { label:"Total Repaid", value:fmtCompact(totalPaid), sub:`${overallPaidPct.toFixed(1)}% of all principal`, icon:"📈", color:T.up },
          { label:"Overdue Payments", value:String(overdueLoans.length), sub:overdueLoans.length > 0 ? `S$${overdueLoans.reduce((s,l)=>s+l.monthlyPayment,0).toLocaleString()} past due` : "All payments current", icon:"⚠️", color:overdueLoans.length > 0 ? T.down : T.muted },
        ].map((c, i) => (
          <Card key={i} style={{ padding:"18px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ fontSize:12, color:T.muted, fontWeight:500 }}>{c.label}</div>
              <span style={{ fontSize:20 }}>{c.icon}</span>
            </div>
            <div style={{ fontSize:22, fontWeight:700, marginTop:8, color:T.text }}>{c.value}</div>
            <div style={{ fontSize:11, color:T.dim, marginTop:4 }}>{c.sub}</div>
          </Card>
        ))}
      </div>

      {/* ── Repayment breakdown bar — like insurance coverage bar ── */}
      <Card style={{ padding:"16px 20px", marginBottom:18 }}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Outstanding by Loan Type</div>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
          {Object.entries(typeBreakdown).map(([type, val]) => {
            const pct = totalOutstanding > 0 ? (val / totalOutstanding * 100).toFixed(0) : 0;
            const typeColors = { "Personal Loan":"#3B82F6", "Car Loan":"#059669", "Education Loan":"#8B5CF6", "Renovation Loan":"#EA580C", "Medical Loan":"#DC2626", "Business Term Loan":"#0891B2" };
            const tc = typeColors[type] || T.muted;
            return (
              <div key={type} style={{ flex:"1 1 140px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:12, color:T.muted, fontWeight:500 }}>{LOAN_TYPE_ICONS[type]||"💰"} {type}</span>
                  <span style={{ fontSize:12, fontWeight:600 }}>{pct}%</span>
                </div>
                <div style={{ height:6, background:T.inputBg, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:tc, borderRadius:3 }}/>
                </div>
                <div style={{ fontSize:11, color:T.dim, marginTop:4 }}>{fmtCompact(val)}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Payment reminder alerts — like insurance premium alerts ── */}
      {(() => {
        const alerts = [
          ...overdueLoans.map(l => ({ loan: l, type: "overdue" })),
          ...upcomingLoans.map(l => ({ loan: l, type: "upcoming" })),
        ];
        if (alerts.length === 0) return null;
        return (
          <div style={{ marginBottom:16, display:"flex", flexDirection:"column", gap:8 }}>
            {alerts.map(({ loan: al, type }, i) => {
              const due = new Date(al.nextPaymentDue);
              const daysUntil = Math.ceil((due - TODAY) / 86400000);
              const isOverdue = type === "overdue";
              const bgColor = isOverdue ? T.downBg : T.warnBg;
              const borderColor = isOverdue ? T.down + "40" : T.warn + "40";
              const textColor = isOverdue ? T.down : T.warn;
              const licon = LOAN_TYPE_ICONS[al.loanType] || "💰";
              return (
                <div key={i} style={{ background:bgColor, border:`1px solid ${borderColor}`, borderRadius:10, padding:"12px 16px", display:"flex", gap:12, alignItems:"center" }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{isOverdue ? "⚠️" : "🔔"}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text }}>
                      {isOverdue ? "Overdue:" : "Due soon:"}{" "}
                      <span style={{ color:textColor }}>{licon} {al.loanType}</span>
                    </div>
                    <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>
                      {al.lender} · {al.accountNumber || "—"}
                      {isOverdue
                        ? ` · ${Math.abs(daysUntil)}d overdue`
                        : daysUntil === 0 ? " · Due today"
                        : ` · ${daysUntil}d until ${al.nextPaymentDue}`}
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:textColor }}>S${al.monthlyPayment.toLocaleString()}</div>
                    <div style={{ fontSize:11, color:T.dim }}>Monthly</div>
                  </div>
                  <button onClick={() => setSelectedLoan(al)} style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:7, padding:"5px 12px", fontSize:12, cursor:"pointer", fontFamily:"inherit", color:T.text, flexShrink:0 }}>View</button>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── Filter toolbar — like insurance ── */}
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:"1 1 200px" }}>
          <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:13, color:T.dim, pointerEvents:"none" }}>🔍</span>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search lender, loan type, account no…"
            style={{ width:"100%", boxSizing:"border-box", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 12px 8px 34px", fontSize:13, fontFamily:"inherit", color:T.text, outline:"none" }}/>
        </div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {["All","Active","Completed","Overdue"].map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)}
              style={{ background:filterStatus===s?T.selected:T.inputBg, color:filterStatus===s?T.selectedText:T.muted, border:`1px solid ${filterStatus===s?T.selected:T.border}`, borderRadius:7, padding:"6px 14px", fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:filterStatus===s?600:400 }}>
              {s}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {["All",...LOAN_TYPES].map(t=>(
            <button key={t} onClick={()=>setFilterType(t)}
              style={{ background:filterType===t?T.selected:T.inputBg, color:filterType===t?T.selectedText:T.muted, border:`1px solid ${filterType===t?T.selected:T.border}`, borderRadius:7, padding:"6px 14px", fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:filterType===t?600:400 }}>
              {t === "All" ? "All Types" : t}
            </button>
          ))}
        </div>
        <span style={{ fontSize:12, color:T.muted, marginLeft:"auto" }}>{filteredLoans.length} of {loans.length}</span>
      </div>

      {/* ── Loan table / mobile cards ── */}
      {filteredLoans.length === 0 ? (
        <Card style={{ padding:"48px 24px", textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🏦</div>
          <div style={{ fontSize:14, fontWeight:600 }}>No loans found</div>
          <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>Try adjusting filters or add a new loan</div>
        </Card>
      ) : isMobile ? (
        <Card style={{padding:0,overflow:"hidden"}}>
          {filteredLoans.map(loan => {
            const licon = LOAN_TYPE_ICONS[loan.loanType] || "💰";
            const lsc = LOAN_STATUS_COLORS[loan.status] || LOAN_STATUS_COLORS.Active;
            const dUntil = loan.nextPaymentDue ? Math.ceil((new Date(loan.nextPaymentDue) - new Date()) / 86400000) : null;
            return <MobileListItem key={loan.id} onClick={()=>setSelectedLoan(loan)}
              icon={licon} iconBg={T.inputBg} title={loan.loanType} subtitle={`${loan.lender} · ${loan.rateType} ${loan.interestRate}%`}
              value={fmtCompact(loan.outstandingBalance)} valueColor={loan.outstandingBalance>0?T.down:T.up} valueSub={`${fmtCompact(loan.monthlyPayment)}/mo`}
              badge={loan.status} badgeBg={lsc.bg} badgeColor={lsc.color}
              extra={dUntil!==null && dUntil<0 ? <span style={{fontSize:11,color:T.down,fontWeight:600}}>⚠️ {Math.abs(dUntil)}d overdue</span> : dUntil!==null && dUntil<=7 ? <span style={{fontSize:11,color:T.warn,fontWeight:600}}>🔔 Due in {dUntil}d</span> : null}
            />;
          })}
        </Card>
      ) : (
        <Card style={{ padding:0, overflow:"hidden" }}>
          <SortHeader gridCols="2fr 1fr 1.2fr 1fr 1fr 1fr 0.8fr" sortKey={lnSort.sortKey} sortDir={lnSort.sortDir} onSort={lnSort.onSort}
            columns={[["Loan / Lender","left","lender"],["Type","left","rateType"],["Outstanding","right","outstanding"],["Monthly","right","monthly"],["Rate","right","rate"],["Next Due","left","nextDue"],["Status","left","status"]]}/>
          {lnSort.sortFn(filteredLoans, (l, k) => {
            if (k==="lender") return (l.lender||"").toLowerCase();
            if (k==="rateType") return (l.rateType||"").toLowerCase();
            if (k==="outstanding") return l.outstandingBalance;
            if (k==="monthly") return l.monthlyPayment;
            if (k==="rate") return l.interestRate;
            if (k==="nextDue") return l.nextPaymentDue ? new Date(l.nextPaymentDue).getTime() : Infinity;
            if (k==="status") return l.status;
            return 0;
          }).map((loan, i) => {
            const lbc = BANK_COLORS[loan.lender] || { from:"#374151", to:"#1F2937" };
            const licon = LOAN_TYPE_ICONS[loan.loanType] || "💰";
            const lsc = LOAN_STATUS_COLORS[loan.status] || LOAN_STATUS_COLORS.Active;
            const lpct = loan.principalAmount > 0 ? ((loan.principalAmount - loan.outstandingBalance) / loan.principalAmount * 100) : 0;
            const dUntil = loan.nextPaymentDue ? Math.ceil((new Date(loan.nextPaymentDue) - TODAY) / 86400000) : null;
            return (
              <div key={loan.id} onClick={() => setSelectedLoan(loan)}
                style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1.2fr 1fr 1fr 1fr 0.8fr", padding:"13px 20px", borderBottom:i<filteredLoans.length-1?`1px solid ${T.border}`:"none", alignItems:"center", cursor:"pointer",
                  opacity:loan.status==="Completed"?0.55:1, background:loan.status==="Completed"?T.sidebar:"" }}
                onMouseEnter={e=>e.currentTarget.style.background=T.hover}
                onMouseLeave={e=>e.currentTarget.style.background=(loan.status==="Completed"?T.sidebar:"")}>
                {/* Loan / Lender */}
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${lbc.from},${lbc.to})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>{licon}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{loan.loanType}</div>
                    <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>{loan.lender} · {loan.accountNumber || "—"}</div>
                  </div>
                </div>
                {/* Type */}
                <div style={{ fontSize:12, color:T.muted }}>{loan.rateType} {loan.interestRate}%</div>
                {/* Outstanding */}
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:loan.outstandingBalance > 0 ? T.text : T.up }}>{fmtCompact(loan.outstandingBalance)}</div>
                  <div style={{ fontSize:10, color:T.dim, marginTop:1 }}>{lpct.toFixed(0)}% repaid</div>
                </div>
                {/* Monthly */}
                <div style={{ fontSize:13, fontWeight:600, textAlign:"right" }}>{fmtCompact(loan.monthlyPayment)}</div>
                {/* Rate */}
                <div style={{ fontSize:12, color:T.muted, textAlign:"right" }}>{loan.interestRate}% p.a.</div>
                {/* Next Due */}
                <div>
                  {loan.nextPaymentDue ? (
                    <>
                      <div style={{ fontSize:12, color:T.text }}>{loan.nextPaymentDue}</div>
                      {dUntil !== null && dUntil < 0 && <div style={{ fontSize:10, color:T.down, fontWeight:600 }}>{Math.abs(dUntil)}d overdue</div>}
                      {dUntil !== null && dUntil >= 0 && dUntil <= 7 && <div style={{ fontSize:10, color:T.warn, fontWeight:600 }}>{dUntil}d away</div>}
                    </>
                  ) : <span style={{ fontSize:12, color:T.dim }}>—</span>}
                </div>
                {/* Status */}
                <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                  <Badge bg={lsc.bg} color={lsc.color}>{loan.status}</Badge>
                  {loan.status === "Active" && dUntil !== null && dUntil < 0 && (
                    <span style={{ width:7, height:7, borderRadius:"50%", background:T.down, display:"inline-block" }} title="Overdue payment"/>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ══ LOAN DETAIL DRAWER — slide-in overlay like insurance ══ */}
      {selectedLoan && (() => {
        const loan = loans.find(l => l.id === selectedLoan.id) || selectedLoan;
        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:200, display:"flex", alignItems:"flex-start", justifyContent:"flex-end" }}
            onClick={e => { if (e.target === e.currentTarget) setSelectedLoan(null); }}>
            <div style={{ width:"min(960px, 95vw)", height:"100vh", background:T.bg, overflow:"hidden", boxShadow:"-4px 0 32px rgba(0,0,0,0.15)", display:"flex", flexDirection:"column" }}>
              <LoanDrawer loan={loan} setLoans={setLoans} showToast={showToast} onClose={() => setSelectedLoan(null)} />
            </div>
          </div>
        );
      })()}

      {/* Modal */}
      {showModal && editLoan && (
        <LoanModal loan={editLoan} onSave={handleSave} onClose={() => { setShowModal(false); setEditLoan(null); }} />
      )}
    </div>
  );
}

// ── Card visual component ─────────────────────────────────────
function CreditCardVisual({ card, accounts, size = "lg" }) {
  const bc = BANK_COLORS[card.bank] || { from:"#374151", to:"#1F2937", text:"#fff" };
  const isDebit = card.cardType === "Debit";
  const linkedAcc = accounts.find(a => a.id === card.linkedAccountId);
  const small = size === "sm";
  const w = small ? 200 : 320;
  const h = small ? 126 : 200;
  const fs = { title: small ? 9 : 13, num: small ? 11 : 16, label: small ? 7 : 10, name: small ? 8 : 12 };

  return (
    <div style={{
      width: w, height: h, borderRadius: small ? 10 : 16, position:"relative", overflow:"hidden", flexShrink:0,
      background: `linear-gradient(135deg, #${bc.from}, #${bc.to})`,
      boxShadow: small ? "0 4px 12px rgba(0,0,0,0.18)" : "0 8px 32px rgba(0,0,0,0.22)",
      color: bc.text,
    }}>
      {/* Decorative circles */}
      <div style={{position:"absolute",right:-h*0.2,top:-h*0.3,width:h*0.9,height:h*0.9,borderRadius:"50%",background:"rgba(255,255,255,0.06)"}}/>
      <div style={{position:"absolute",right:h*0.1,top:-h*0.1,width:h*0.6,height:h*0.6,borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>
      {/* Content */}
      <div style={{position:"absolute",inset:0,padding: small ? "14px 16px" : "22px 24px",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
        {/* Top row */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:fs.title,fontWeight:800,opacity:0.95,letterSpacing:"0.01em"}}>{card.bank}</div>
            {!small && <div style={{fontSize:10,opacity:0.65,marginTop:2}}>{card.cardName}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
            <span style={{fontSize:fs.label,fontWeight:700,opacity:0.9,background:"rgba(255,255,255,0.15)",padding:"2px 6px",borderRadius:4}}>
              {isDebit ? "DEBIT" : "CREDIT"}
            </span>
            {!small && <span style={{fontSize:9,opacity:0.6}}>{card.network}</span>}
          </div>
        </div>
        {/* Card number */}
        <div style={{fontSize:fs.num,fontWeight:600,letterSpacing:"0.15em",opacity:0.9}}>
          •••• •••• •••• {card.last4 || "0000"}
        </div>
        {/* Bottom row */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <div>
            <div style={{fontSize:fs.label,opacity:0.6,marginBottom:2}}>{isDebit && linkedAcc ? "LINKED ACCOUNT" : "CARD HOLDER"}</div>
            <div style={{fontSize:fs.name,fontWeight:600,opacity:0.9}}>
              {isDebit && linkedAcc ? linkedAcc.accountName : card.holderName.toUpperCase()}
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:fs.label,opacity:0.6,marginBottom:2}}>EXPIRES</div>
            <div style={{fontSize:fs.name,fontWeight:600,opacity:0.9}}>{card.expiryMM}/{card.expiryYY}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add/Edit Card Modal ───────────────────────────────────────
function CCCardModal({ card, accounts, onSave, onClose }) {
  const [f, setFState] = useState(card);
  const setF = (k, v) => setFState(prev => ({...prev, [k]: v}));
  const isDebit = f.cardType === "Debit";
  const CIn = ({ label, fkey, type="text", placeholder="" }) => (
    <div>
      <Label>{label}</Label>
      <input value={f[fkey]||""} type={type} placeholder={placeholder}
        onChange={e => setF(fkey, type==="number" ? parseFloat(e.target.value)||0 : e.target.value)}
        style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}/>
    </div>
  );
  const CSel = ({ label, fkey, options }) => (
    <div>
      <Label>{label}</Label>
      <select value={f[fkey]||""} onChange={e => setF(fkey, e.target.value)}
        style={{width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:300}}/>
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:301,background:T.bg,border:`1px solid ${T.border}`,borderRadius:16,width:540,maxHeight:"88vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.22)"}}>
        <div style={{padding:"18px 22px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:T.bg,zIndex:1}}>
          <div style={{fontSize:15,fontWeight:700}}>{card.id ? "Edit Card" : "Add Card"}</div>
          <button onClick={onClose} style={{background:T.inputBg,border:"none",borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16,color:T.muted}}>×</button>
        </div>
        <div style={{padding:"20px 22px",display:"flex",flexDirection:"column",gap:14}}>
          {/* Card preview */}
          <div style={{display:"flex",justifyContent:"center",marginBottom:8}}>
            <CreditCardVisual card={f} accounts={accounts}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <CSel label="Bank" fkey="bank" options={Object.keys(BANK_COLORS)}/>
            <CSel label="Card Type" fkey="cardType" options={["Credit","Commercial","Debit"]}/>
          </div>
          <CIn label="Card Name" fkey="cardName" placeholder="e.g. DBS Live Fresh"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <CSel label="Network" fkey="network" options={CARD_NETWORKS}/>
            <CIn label="Card Holder Name" fkey="holderName" placeholder="Full name"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <CIn label="Last 4 Digits" fkey="last4" placeholder="4521"/>
            <CIn label="Expiry Month" fkey="expiryMM" placeholder="08"/>
            <CIn label="Expiry Year" fkey="expiryYY" placeholder="27"/>
          </div>
          {f.cardType === "Commercial" && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <CIn label="Company Name" fkey="companyName" placeholder="e.g. Acme Pte Ltd"/>
              <CIn label="UEN / Business Reg. No." fkey="companyUEN" placeholder="e.g. 202312345A"/>
            </div>
          )}
          {f.cardType === "Debit" ? (
            <div>
              <Label>Linked Account</Label>
              <select value={f.linkedAccountId||""} onChange={e=>setF("linkedAccountId",e.target.value||null)}
                style={{width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}>
                <option value="">— No linked account —</option>
                {accounts.map(a=><option key={a.id} value={a.id}>{a.bank} {a.accountName} (••{a.last4})</option>)}
              </select>
            </div>
          ) : (
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <CIn label="Credit Limit (S$)" fkey="creditLimit" type="number" placeholder="10000"/>
                <CIn label="Current Balance (S$)" fkey="currentBalance" type="number" placeholder="0"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <CIn label="Min. Payment (S$)" fkey="minimumPayment" type="number" placeholder="50"/>
                <div>
                  <Label>Due Day of Month</Label>
                  <select value={f.dueDayOfMonth||28} onChange={e=>setF("dueDayOfMonth",parseInt(e.target.value))}
                    style={{width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}>
                    {Array.from({length:28},(_,i)=>i+1).map(d=>(
                      <option key={d} value={d}>Day {d}{d===1?"st":d===2?"nd":d===3?"rd":"th"} of every month</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <CIn label="APR (%)" fkey="apr" type="number" placeholder="26.9"/>
                <CIn label="Annual Fee (S$)" fkey="annualFee" type="number" placeholder="192.60"/>
              </div>
            </>
          )}
          <div>
            <Label>Notes</Label>
            <textarea value={f.notes||""} onChange={e=>setF("notes",e.target.value)} rows={2}
              style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none",resize:"vertical"}}/>
          </div>
        </div>
        <div style={{padding:"14px 22px",borderTop:`1px solid ${T.border}`,background:T.sidebar,display:"flex",gap:10,position:"sticky",bottom:0}}>
          <button onClick={()=>onSave(f)}
            style={{flex:1,background:T.selected,color:T.selectedText,border:"none",borderRadius:9,padding:"11px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
            {card.id ? "Save Changes" : "Add Card"}
          </button>
          <button onClick={onClose}
            style={{background:"transparent",color:T.muted,border:`1px solid ${T.border}`,borderRadius:9,padding:"11px 20px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        </div>
      </div>
    </>
  );
}

// ── Add Transaction Modal ─────────────────────────────────────
function CCTxnModal({ cardId, card, accounts, setAccounts, setCards, onSave, onClose }) {
  const [f, setFState] = useState({
    cardId, date: new Date().toISOString().slice(0,10),
    description:"", category:"Dining", amount:"", fees:"",
    type:"Debit", linkedAccountId:"", ref:"", notes:"",
  });
  const setF = (k,v) => setFState(prev=>({...prev,[k]:v}));
  const iStyle = {width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 10px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"};

  const isRepayment = f.type === "Repayment";
  const selectedAcc = isRepayment && accounts ? accounts.find(a => a.id === f.linkedAccountId) : null;
  const repayAmt = parseFloat(f.amount)||0;
  const feesAmt  = parseFloat(f.fees)||0;
  const totalCost = repayAmt + feesAmt;
  const hasFunds = !selectedAcc || selectedAcc.balance >= totalCost;
  const newBalance = card ? Math.max(0, (card.currentBalance||0) - repayAmt) : 0;
  const newUtil = card && card.creditLimit > 0 ? (newBalance / card.creditLimit * 100) : 0;

  const canSubmit = isRepayment
    ? (repayAmt > 0 && f.linkedAccountId && hasFunds)
    : (f.description && f.amount);

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (isRepayment) {
      // Deduct from account
      if (setAccounts) {
        setAccounts(prev => prev.map(a =>
          a.id === f.linkedAccountId ? {...a, balance: Math.max(0, a.balance - totalCost)} : a
        ));
      }
      // Reduce card balance
      if (setCards) {
        setCards(prev => prev.map(c =>
          c.id === cardId ? {...c, currentBalance: Math.max(0, c.currentBalance - repayAmt)} : c
        ));
      }
      onSave({
        id:"T"+Date.now(), cardId, date:f.date,
        description: selectedAcc ? ("Payment from "+selectedAcc.bank+" "+selectedAcc.accountName) : "Card Payment",
        category:"Other", amount:repayAmt, fees:feesAmt, type:"Credit",
      });
    } else {
      onSave({...f, id:"T"+Date.now(), amount:parseFloat(f.amount), fees:feesAmt});
    }
  };

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:400}}/>
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:401,background:T.bg,border:`1px solid ${T.border}`,borderRadius:14,width:460,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,fontSize:14,fontWeight:700,position:"sticky",top:0,background:T.bg,zIndex:1}}>
          {isRepayment ? "Record Card Repayment" : "Add Transaction"}
          {isRepayment && card && <div style={{fontSize:11,color:T.muted,fontWeight:400,marginTop:2}}>Outstanding: S${(card.currentBalance||0).toLocaleString(undefined,{minimumFractionDigits:2})}</div>}
        </div>
        <div style={{padding:"18px 20px",display:"flex",flexDirection:"column",gap:12}}>

          {/* Date + Type */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><Label>Date</Label>
              <input type="date" value={f.date} onChange={e=>setF("date",e.target.value)} style={iStyle}/></div>
            <div><Label>Type</Label>
              <select value={f.type} onChange={e=>setF("type",e.target.value)} style={iStyle}>
                <option>Debit</option><option>Credit</option><option>Refund</option><option>Repayment</option>
              </select></div>
          </div>

          {/* Repayment-specific fields */}
          {isRepayment && card && (
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[
                {label:"Min Payment", val:card.minimumPayment||0},
                {label:"Half Balance", val:Math.round((card.currentBalance||0)/2*100)/100},
                {label:"Full Balance", val:card.currentBalance||0},
              ].filter(q=>q.val>0).map(q=>(
                <button key={q.label} onClick={()=>setF("amount",q.val)}
                  style={{flex:1,padding:"7px 8px",borderRadius:8,border:`1px solid ${parseFloat(f.amount)===q.val?T.selected:T.border}`,
                    background:parseFloat(f.amount)===q.val?T.selected:"transparent",
                    color:parseFloat(f.amount)===q.val?T.selectedText:T.muted,
                    cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600,textAlign:"center"}}>
                  {q.label}<br/><span style={{fontSize:10,opacity:0.8}}>S${q.val.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
                </button>
              ))}
            </div>
          )}

          {/* Description (hidden for repayments) */}
          {!isRepayment && (
            <div><Label>Description</Label>
              <input value={f.description} onChange={e=>setF("description",e.target.value)} placeholder="e.g. Grab Food" style={iStyle}/></div>
          )}

          {/* Amount + Fees */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><Label required>{isRepayment?"Repayment Amount (S$)":"Amount (S$)"}</Label>
              <input type="number" value={f.amount} onChange={e=>setF("amount",e.target.value)} placeholder="0.00" style={iStyle}/></div>
            <div><Label>Fees (optional, S$)</Label>
              <input type="number" value={f.fees} onChange={e=>setF("fees",e.target.value)} placeholder="e.g. 0.50" style={iStyle}/></div>
          </div>

          {feesAmt > 0 && (
            <div style={{background:T.warnBg,border:`1px solid #FDE68A`,borderRadius:8,padding:"8px 12px",fontSize:12,color:T.warn}}>
              Total deducted: S${totalCost.toLocaleString(undefined,{minimumFractionDigits:2})} (amount S${repayAmt.toLocaleString(undefined,{minimumFractionDigits:2})} + fees S${feesAmt.toLocaleString(undefined,{minimumFractionDigits:2})})
            </div>
          )}

          {/* Category — only for non-repayment */}
          {!isRepayment && (
            <div><Label>Category</Label>
              <select value={f.category} onChange={e=>setF("category",e.target.value)} style={iStyle}>
                {TXN_CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select></div>
          )}

          {/* Account selector — only for repayments */}
          {isRepayment && (
            <div>
              <Label required>Pay From Account</Label>
              <select value={f.linkedAccountId} onChange={e=>setF("linkedAccountId",e.target.value)}
                style={{...iStyle, borderColor:f.linkedAccountId?T.border:"#FECACA"}}>
                <option value="">— Choose savings or checking account —</option>
                {(accounts||[]).map(a=>(
                  <option key={a.id} value={a.id}>
                    {a.bank} {a.accountName} ({a.accountType} ••{a.last4}) — {a.currency} {a.balance.toLocaleString(undefined,{minimumFractionDigits:2})} available
                  </option>
                ))}
              </select>
              {selectedAcc && (
                <div style={{marginTop:6,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderRadius:8,fontSize:12,
                  background:hasFunds?T.upBg:T.downBg, border:`1px solid ${hasFunds?"#BBF7D0":"#FECACA"}`}}>
                  <span style={{fontWeight:600,color:hasFunds?T.up:T.down}}>{hasFunds?"✅ Sufficient funds":"❌ Insufficient funds"}</span>
                  <span style={{color:T.muted}}>S${selectedAcc.balance.toLocaleString(undefined,{minimumFractionDigits:2})} → S${Math.max(0,selectedAcc.balance-totalCost).toLocaleString(undefined,{minimumFractionDigits:2})}</span>
                </div>
              )}
            </div>
          )}

          {/* After repayment preview */}
          {isRepayment && repayAmt > 0 && card && (
            <div style={{border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px"}}>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:8}}>AFTER REPAYMENT</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[
                  {label:"New Balance",   value:`S$${newBalance.toLocaleString(undefined,{minimumFractionDigits:2})}`,        color:newBalance===0?T.up:T.down},
                  {label:"New Available", value:`S$${((card.creditLimit||0)-newBalance).toLocaleString(undefined,{minimumFractionDigits:2})}`, color:T.up},
                  {label:"Utilisation",   value:`${newUtil.toFixed(1)}%`,                                                     color:newUtil>70?T.down:T.up},
                ].map(s=>(
                  <div key={s.label} style={{background:T.inputBg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                    <div style={{fontSize:10,color:T.muted,marginBottom:2}}>{s.label}</div>
                    <div style={{fontSize:12,fontWeight:800,color:s.color}}>{s.value}</div>
                  </div>
                ))}
              </div>
              {newBalance===0 && <div style={{marginTop:8,textAlign:"center",fontSize:12,fontWeight:600,color:T.up}}>🎉 Card will be fully paid off!</div>}
            </div>
          )}

          {/* Reference + Notes */}
          <div><Label>Reference No. (optional)</Label>
            <input value={f.ref||""} onChange={e=>setF("ref",e.target.value)} placeholder="e.g. REF-123456"
              style={iStyle}/></div>
          <div><Label>Notes (optional)</Label>
            <textarea value={f.notes||""} onChange={e=>setF("notes",e.target.value)} rows={2}
              placeholder="e.g. Monthly bill, reimbursement pending"
              style={{...iStyle, resize:"vertical"}}/></div>

        </div>
        <div style={{padding:"14px 20px",borderTop:`1px solid ${T.border}`,background:T.sidebar,display:"flex",gap:10,position:"sticky",bottom:0}}>
          <button onClick={handleSubmit} disabled={!canSubmit}
            style={{flex:1,background:canSubmit?T.selected:T.inputBg,color:canSubmit?T.selectedText:T.dim,border:"none",borderRadius:9,padding:"10px",fontSize:13,fontWeight:600,cursor:canSubmit?"pointer":"not-allowed",fontFamily:"inherit"}}>
            {isRepayment?"Record Repayment":"Add Transaction"}
          </button>
          <button onClick={onClose} style={{background:"transparent",color:T.muted,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 16px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        </div>
      </div>
    </>
  );
}

// ── Add Account Modal ─────────────────────────────────────────
function CCAccountModal({ account, onSave, onClose }) {
  const [f, setFState] = useState(account);
  const setF = (k,v) => setFState(prev=>({...prev,[k]:v}));
  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:400}}/>
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:401,background:T.bg,border:`1px solid ${T.border}`,borderRadius:14,width:420,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,fontSize:14,fontWeight:700}}>{account.id?"Edit Account":"Add Account"}</div>
        <div style={{padding:"18px 20px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><Label>Bank</Label>
              <select value={f.bank} onChange={e=>setF("bank",e.target.value)}
                style={{width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 10px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}>
                {Object.keys(BANK_COLORS).map(b=><option key={b}>{b}</option>)}
              </select></div>
            <div><Label>Account Type</Label>
              <select value={f.accountType} onChange={e=>setF("accountType",e.target.value)}
                style={{width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 10px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}>
                <option>Checking</option><option>Savings</option>
              </select></div>
          </div>
          <div><Label>Account Name</Label>
            <input value={f.accountName} onChange={e=>setF("accountName",e.target.value)} placeholder="e.g. DBS Multiplier"
              style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 10px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div><Label>Last 4 Digits</Label>
              <input value={f.last4} onChange={e=>setF("last4",e.target.value)} placeholder="2341"
                style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 10px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}/></div>
            <div><Label>Balance</Label>
              <input type="number" value={f.balance} onChange={e=>setF("balance",parseFloat(e.target.value)||0)}
                style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 10px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}/></div>
            <div><Label>Currency</Label>
              <select value={f.currency} onChange={e=>setF("currency",e.target.value)}
                style={{width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 10px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}>
                <option>SGD</option><option>MYR</option><option>USD</option><option>GBP</option>
              </select></div>
          </div>
        </div>
        <div style={{padding:"14px 20px",borderTop:`1px solid ${T.border}`,background:T.sidebar,display:"flex",gap:10}}>
          <button onClick={()=>onSave(f)}
            style={{flex:1,background:T.selected,color:T.selectedText,border:"none",borderRadius:9,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
            {account.id?"Save Changes":"Add Account"}
          </button>
          <button onClick={onClose} style={{background:"transparent",color:T.muted,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 16px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        </div>
      </div>
    </>
  );
}

// ── Card Detail Drawer ────────────────────────────────────────
function CCDrawer({ card, accounts, setAccounts, transactions, setTransactions, setCards, showToast, onClose }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("overview");
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [catFilter, setCatFilter] = useState("All");
  const [txnSearch, setTxnSearch] = useState("");

  const isDebit = card.cardType === "Debit";
  const linkedAcc = accounts.find(a => a.id === card.linkedAccountId);
  const cardTxns = transactions.filter(t => t.cardId === card.id).sort((a,b)=>b.date.localeCompare(a.date));
  const bc = BANK_COLORS[card.bank] || { from:"#374151", to:"#1F2937", text:"#fff" };

  // Spend stats
  const debitTxns = cardTxns.filter(t => t.type === "Debit");
  const thisMonth = new Date().toISOString().slice(0,7);
  const monthTxns = debitTxns.filter(t => t.date.startsWith(thisMonth));
  const monthSpend = monthTxns.reduce((s,t) => s+t.amount, 0);
  const totalSpend = debitTxns.reduce((s,t) => s+t.amount, 0);

  // Category breakdown
  const catBreakdown = {};
  debitTxns.forEach(t => { catBreakdown[t.category] = (catBreakdown[t.category]||0) + t.amount; });
  const topCats = Object.entries(catBreakdown).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // Credit utilisation
  const utilPct = !isDebit && card.creditLimit > 0 ? Math.min(100,(card.currentBalance/card.creditLimit*100)) : 0;
  const utilColor = utilPct > 80 ? T.down : utilPct > 50 ? T.warn : T.up;

  // Filtered txns
  const filteredTxns = cardTxns.filter(t =>
    (catFilter === "All" || t.category === catFilter) &&
    (t.description.toLowerCase().includes(txnSearch.toLowerCase()) || t.category.toLowerCase().includes(txnSearch.toLowerCase()))
  );

  const handleAddTxn = (txn) => {
    setTransactions(prev => [txn, ...prev]);
    setShowTxnModal(false);
    showToast("Transaction added","success");
  };

  const handleDeleteTxn = (tid) => {
    setTransactions(prev => prev.filter(t => t.id !== tid));
    showToast("Transaction removed","success");
  };

  const TABS = [{id:"overview",label:"Overview"},{id:"transactions",label:"Transactions"},{id:"postings",label:"Postings"}];

  const nextDueDate = (() => {
    if(!card.dueDayOfMonth) return null;
    const today = new Date();
    const d = card.dueDayOfMonth;
    let due = new Date(today.getFullYear(), today.getMonth(), d);
    if (due <= today) due = new Date(today.getFullYear(), today.getMonth()+1, d);
    return due;
  })();
  const daysUntilDue = nextDueDate
    ? Math.ceil((nextDueDate - new Date()) / (1000*60*60*24))
    : null;
  const nextDueDateStr = nextDueDate
    ? nextDueDate.toLocaleDateString("en-SG",{day:"numeric",month:"short",year:"numeric"})
    : null;
  const hasOutstanding = !isDebit && card.currentBalance > 0;
  const isRecurringDue = hasOutstanding && card.dueDayOfMonth;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Header */}
      <div style={{padding:"18px 22px 14px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:14,fontWeight:800}}>{card.cardName}</div>
            <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:5,
              background: isDebit ? T.accentBg : T.upBg,
              color: isDebit ? T.accent : T.up}}>
              {card.cardType}
            </span>
            {!card.isActive && <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:5,background:T.downBg,color:T.down}}>Inactive</span>}
          </div>
          <button onClick={onClose} style={{background:T.inputBg,border:"none",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:15,color:T.muted}}>✕</button>
        </div>
        {/* Tabs */}
        <div style={{display:"flex",gap:4}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{padding:"6px 14px",borderRadius:8,border:"none",background:tab===t.id?T.selected:T.inputBg,
                color:tab===t.id?T.selectedText:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:tab===t.id?700:400}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",minHeight:0}}>
        <div style={{padding:"18px 22px 32px",display:"flex",flexDirection:"column",gap:16}}>

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <>
              {/* Card visual */}
              <div style={{display:"flex",justifyContent:"center"}}>
                <CreditCardVisual card={card} accounts={accounts}/>
              </div>

              {/* Payment due alert */}
              {!isDebit && card.dueDayOfMonth && daysUntilDue !== null && daysUntilDue <= 7 && (
                <div style={{background:T.warnBg,border:`1px solid #FDE68A`,borderRadius:10,padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:18}}>⚠️</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.warn}}>Payment due in {daysUntilDue} day{daysUntilDue!==1?"s":""}</div>
                    <div style={{fontSize:12,color:T.warn}}>Min. payment S${card.minimumPayment.toLocaleString()} due {nextDueDateStr}</div>
                  </div>
                </div>
              )}
              {isRecurringDue && daysUntilDue !== null && daysUntilDue > 7 && (
                <div style={{background:T.accentBg,border:`1px solid #BFDBFE`,borderRadius:10,padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:18}}>🔁</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.accent}}>Recurring payment — {daysUntilDue} days until due</div>
                    <div style={{fontSize:12,color:T.accent}}>S${card.currentBalance.toLocaleString(undefined,{minimumFractionDigits:2})} outstanding · next due {nextDueDateStr} (day {card.dueDayOfMonth} monthly)</div>
                  </div>
                </div>
              )}
              {!isDebit && card.currentBalance === 0 && (
                <div style={{background:T.upBg,border:`1px solid #BBF7D0`,borderRadius:10,padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
                  <span>✅</span>
                  <div style={{fontSize:13,fontWeight:600,color:T.up}}>No outstanding balance — fully paid</div>
                </div>
              )}

              {/* Credit utilisation gauge (credit cards only) */}
              {!isDebit && card.creditLimit > 0 && (
                <div style={{background:T.inputBg,borderRadius:12,padding:"16px 18px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.muted}}>CREDIT UTILISATION</div>
                    <div style={{fontSize:13,fontWeight:800,color:utilColor}}>{utilPct.toFixed(1)}%</div>
                  </div>
                  <div style={{height:10,borderRadius:5,background:T.border,overflow:"hidden",marginBottom:10}}>
                    <div style={{width:`${utilPct}%`,height:"100%",borderRadius:5,background:utilColor,transition:"width 0.4s"}}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    {[
                      {label:"Balance",value:`S$${card.currentBalance.toLocaleString(undefined,{minimumFractionDigits:2})}`,color:T.down},
                      {label:"Available",value:`S$${(card.creditLimit-card.currentBalance).toLocaleString(undefined,{minimumFractionDigits:2})}`,color:T.up},
                      {label:"Limit",value:`S$${card.creditLimit.toLocaleString()}`,color:T.text},
                    ].map(s=>(
                      <div key={s.label} style={{textAlign:"center"}}>
                        <div style={{fontSize:10,color:T.muted,marginBottom:3}}>{s.label}</div>
                        <div style={{fontSize:13,fontWeight:700,color:s.color}}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Debit: linked account info */}
              {isDebit && linkedAcc && (
                <div style={{border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:10}}>🔗 LINKED ACCOUNT</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700}}>{linkedAcc.accountName}</div>
                      <div style={{fontSize:11,color:T.muted,marginTop:2}}>{linkedAcc.bank} · {linkedAcc.accountType} · ••{linkedAcc.last4}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:10,color:T.muted}}>Available Balance</div>
                      <div style={{fontSize:16,fontWeight:800,color:T.up}}>{linkedAcc.currency} {linkedAcc.balance.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Spend stats */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[
                  {label:"This Month Spend",value:`S$${monthSpend.toLocaleString(undefined,{minimumFractionDigits:2})}`,sub:`${monthTxns.length} transactions`},
                  {label:"Total Spend",value:`S$${totalSpend.toLocaleString(undefined,{minimumFractionDigits:2})}`,sub:`${debitTxns.length} transactions`},
                ].map(s=>(
                  <div key={s.label} style={{background:T.inputBg,borderRadius:10,padding:"14px 16px"}}>
                    <div style={{fontSize:11,color:T.muted,marginBottom:4}}>{s.label}</div>
                    <div style={{fontSize:16,fontWeight:800}}>{s.value}</div>
                    <div style={{fontSize:11,color:T.dim,marginTop:2}}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Category breakdown */}
              {topCats.length > 0 && (
                <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                  <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📊 Spend by Category</div>
                  {topCats.map(([cat, amt],i) => {
                    const pct = totalSpend > 0 ? (amt/totalSpend*100) : 0;
                    return (
                      <div key={cat} style={{padding:"10px 16px",borderTop:i===0?`1px solid ${T.border}`:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:16,width:22}}>{CATEGORY_ICONS[cat]||"💳"}</span>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                            <span style={{fontSize:12,fontWeight:600}}>{cat}</span>
                            <span style={{fontSize:12,fontWeight:700}}>S${amt.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
                          </div>
                          <div style={{height:4,borderRadius:2,background:T.border,overflow:"hidden"}}>
                            <div style={{width:`${pct}%`,height:"100%",borderRadius:2,background:`#${bc.from}`}}/>
                          </div>
                        </div>
                        <span style={{fontSize:11,color:T.muted,width:36,textAlign:"right"}}>{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Card details */}
              <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"11px 16px",background:T.inputBg,fontSize:12,fontWeight:700}}>📋 Card Details</div>
                {[
                  ["Card Network", card.network],
                  card.cardType === "Commercial" && card.companyName ? ["Company Name", card.companyName] : null,
                  card.cardType === "Commercial" && card.companyUEN ? ["UEN / Reg. No.", card.companyUEN] : null,
                  ["Card Number", `•••• •••• •••• ${card.last4}`],
                  ["Expiry", `${card.expiryMM}/${card.expiryYY}`],
                  !isDebit && card.apr > 0 ? ["Interest Rate (APR)", `${card.apr}% p.a.`] : null,
                  !isDebit && card.annualFee > 0 ? ["Annual Fee", `S$${card.annualFee.toLocaleString()}`] : null,
                  !isDebit && card.dueDayOfMonth ? ["Payment Due", `Day ${card.dueDayOfMonth} monthly · Next: ${nextDueDateStr}`] : null,
                  card.notes ? ["Notes", card.notes] : null,
                ].filter(Boolean).map(([k,v],i)=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                    <span style={{fontSize:12,color:T.muted}}>{k}</span>
                    <span style={{fontSize:12,fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── TRANSACTIONS ── */}
          {tab === "transactions" && (
            <>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input value={txnSearch} onChange={e=>setTxnSearch(e.target.value)} placeholder="Search transactions..."
                  style={{flex:1,background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}/>
                <button onClick={()=>setShowTxnModal(true)}
                  style={{padding:"8px 16px",borderRadius:8,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,whiteSpace:"nowrap"}}>
                  + Add
                </button>
              </div>

              {/* Category filter pills */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["All",...TXN_CATEGORIES].map(c=>(
                  <button key={c} onClick={()=>setCatFilter(c)}
                    style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${catFilter===c?T.selected:T.border}`,
                      background:catFilter===c?T.selected:"transparent",color:catFilter===c?T.selectedText:T.muted,
                      cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:catFilter===c?700:400}}>
                    {c!=="All" && (CATEGORY_ICONS[c]+" ")}{c}
                  </button>
                ))}
              </div>

              {/* Transaction list */}
              {filteredTxns.length === 0 ? (
                <div style={{textAlign:"center",padding:"32px 20px",color:T.muted}}>
                  <div style={{fontSize:28,marginBottom:8}}>💳</div>
                  <div style={{fontSize:13,fontWeight:600}}>No transactions found</div>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:1,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
                  {filteredTxns.map((t,i)=>(
                    <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",background:i%2===0?T.bg:T.inputBg,
                      borderTop:i>0?`1px solid ${T.border}`:"none"}}>
                      <div style={{width:34,height:34,borderRadius:8,background:T.inputBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                        {CATEGORY_ICONS[t.category]||"💳"}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.description}</div>
                        <div style={{fontSize:11,color:T.muted,marginTop:1,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                          <span>{t.category} · {t.date}</span>
                          {t.fees > 0 && <span style={{fontSize:10,color:T.warn,background:T.warnBg,borderRadius:4,padding:"1px 6px"}}>+ S${parseFloat(t.fees).toLocaleString(undefined,{minimumFractionDigits:2})} fees</span>}
                          {t.ref && <span style={{fontSize:10,color:T.dim,background:T.inputBg,borderRadius:4,padding:"1px 6px",fontFamily:"monospace"}}>{t.ref}</span>}
                        </div>
                        {t.notes && <div style={{fontSize:11,color:T.muted,fontStyle:"italic",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.notes}</div>}
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:t.type==="Debit"?T.down:T.up}}>
                          {t.type==="Debit"?"-":"+"} S${t.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
                        </div>
                        <div style={{fontSize:10,color:T.dim,marginTop:1}}>{t.type}</div>
                      </div>
                      <button onClick={()=>handleDeleteTxn(t.id)}
                        style={{background:"none",border:"none",cursor:"pointer",color:T.dim,fontSize:14,padding:"2px 4px",flexShrink:0}}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── POSTINGS ── */}
          {tab === "postings" && (() => {
            const inter = "'Inter','Segoe UI',system-ui,sans-serif";
            const mono  = "'Courier New',Courier,monospace";
            const sym   = card.currency === "USD" ? "US$" : card.currency === "GBP" ? "£" : "S$";
            // Debit cards: money flows directly from bank account. Credit cards: uses liability account.
            const bankAcct = linkedAcc
              ? `Assets:Bank:${(linkedAcc.bankName||linkedAcc.accountName||"Checking").replace(/ /g,"")}`
              : "Assets:Bank:Cash";
            const cardLiabilityAcct = `Liabilities:CreditCard:${card.bank.replace(/ /g,"")}:${card.cardName.replace(/ /g,"")}`;
            // For debit: spend comes straight from bank. For credit: spend goes to liability.
            const spendAcct   = isDebit ? bankAcct : cardLiabilityAcct;
            const repayAcct   = isDebit ? bankAcct : bankAcct; // repayment always from bank

            // Build PTA journal from transactions
            const sorted = [...cardTxns].sort((a,b) => a.date.localeCompare(b.date));

            const daysAgo = (d) => {
              if (!d) return "";
              const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
              return diff === 0 ? "Today" : diff === 1 ? "1 day ago" : diff + " days ago";
            };

            const fmtAmt = (v) => sym + Math.abs(v).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});

            // Build table rows: each txn = 2 ledger lines
            const tableRows = sorted.flatMap((txn) => {
              const isRepayment = !isDebit && (txn.type === "Repayment" || txn.type === "Credit");
              const isRefund    = txn.type === "Refund";

              if (isRepayment) {
                // Credit card repayment: Dr Liabilities:CC (clears debt), Cr Assets:Bank (cash out)
                return [
                  { date: txn.date, desc: txn.description || "Card repayment", account: cardLiabilityAcct, amount: fmtAmt(txn.amount), debit: true,  _first: true  },
                  { date: null,     desc: "",                                   account: bankAcct,          amount: fmtAmt(txn.amount), debit: false, _first: false },
                ];
              }
              if (isRefund) {
                // Refund: Dr spendAcct (bank for debit / liability for credit), Cr Expenses (reversal)
                return [
                  { date: txn.date, desc: txn.description || "Refund",              account: spendAcct,                               amount: fmtAmt(txn.amount), debit: true,  _first: true  },
                  { date: null,     desc: `Refund — ${txn.category || "General"}`,  account: `Expenses:${txn.category || "General"}`, amount: fmtAmt(txn.amount), debit: false, _first: false },
                ];
              }
              // Regular spend: Dr Expenses:Category, Cr bank (debit) or Cr liability (credit card)
              return [
                { date: txn.date, desc: txn.description || txn.category, account: `Expenses:${txn.category || "General"}`, amount: fmtAmt(txn.amount), debit: true,  _first: true  },
                { date: null,     desc: "",                               account: spendAcct,                               amount: fmtAmt(txn.amount), debit: false, _first: false },
              ];
            });

            if (isMobile && tableRows.length > 0) return <MobilePostingsList journalRows={tableRows} entryCount={sorted.length} entryLabel="transactions"/>;
            if (tableRows.length === 0) {
              return (
                <div style={{textAlign:"center",padding:"48px 20px",color:T.muted}}>
                  <div style={{fontSize:32,marginBottom:10}}>📒</div>
                  <div style={{fontSize:13,fontWeight:600}}>No transactions to post</div>
                  <div style={{fontSize:12,marginTop:4}}>Add transactions to see ledger postings</div>
                </div>
              );
            }

            return (
              <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",background:T.bg}}>
                {/* Header */}
                <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:inter}}>Ledger Postings</div>
                  <div style={{fontSize:12,color:T.accent,marginTop:3,fontFamily:inter}}>Double-entry bookkeeping · PTA compliant · {sorted.length} transactions</div>
                </div>

                {/* Table */}
                <div style={{overflowX:"auto",overflowY:"auto",maxHeight:480}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:580}}>
                    <thead>
                      <tr style={{borderBottom:`1px solid ${T.border}`}}>
                        <th style={{padding:"9px 16px",textAlign:"left",width:148,fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,letterSpacing:"0.02em",whiteSpace:"nowrap"}}>Date</th>
                        <th style={{padding:"9px 16px",textAlign:"left",fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,letterSpacing:"0.02em"}}>Account</th>
                        <th style={{padding:"9px 16px",textAlign:"left",fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,letterSpacing:"0.02em"}}>Description</th>
                        <th style={{padding:"9px 16px",textAlign:"right",width:148,fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,letterSpacing:"0.02em"}}>Debit</th>
                        <th style={{padding:"9px 16px",textAlign:"right",width:148,fontSize:11,fontWeight:500,color:T.muted,fontFamily:inter,letterSpacing:"0.02em"}}>Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, ri) => (
                        <tr key={ri} style={{borderBottom:`1px solid ${T.border}`}}>
                          <td style={{padding:"11px 16px",verticalAlign:"top",width:148}}>
                            {row._first ? (
                              <>
                                <div style={{fontSize:13,fontWeight:400,color:T.text,fontFamily:inter,whiteSpace:"nowrap"}}>{row.date}</div>
                                <div style={{fontSize:11,color:T.dim,marginTop:2,fontFamily:inter}}>{daysAgo(row.date)}</div>
                              </>
                            ) : null}
                          </td>
                          <td style={{padding:"11px 16px",verticalAlign:"top"}}>
                            <span style={{fontFamily:mono,fontSize:12,color:T.text}}>{row.account}</span>
                          </td>
                          <td style={{padding:"11px 16px",verticalAlign:"top",fontSize:12,color:T.muted,fontFamily:inter}}>{row.desc}</td>
                          <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                            {row.debit
                              ? <span style={{fontSize:13,fontWeight:700,color:T.up,fontFamily:inter}}>{row.amount}</span>
                              : <span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                          </td>
                          <td style={{padding:"11px 16px",verticalAlign:"top",textAlign:"right",whiteSpace:"nowrap"}}>
                            {!row.debit
                              ? <span style={{fontSize:13,fontWeight:700,color:T.down,fontFamily:inter}}>{row.amount}</span>
                              : <span style={{fontSize:13,color:T.dim,fontFamily:inter}}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div style={{padding:"12px 18px",borderTop:`1px solid ${T.border}`,background:T.sidebar}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:6,fontFamily:inter}}>Double-Entry Accounting</div>
                  <div style={{fontSize:11,color:T.muted,lineHeight:1.8,fontFamily:inter}}>
                    {isDebit ? (
                      <>
                        <div>• <span style={{color:T.up,fontWeight:600}}>Debit (Dr):</span> Spend → increases Expenses; Refund → restores bank balance</div>
                        <div>• <span style={{color:T.down,fontWeight:600}}>Credit (Cr):</span> Spend → reduces bank account directly</div>
                      </>
                    ) : (
                      <>
                        <div>• <span style={{color:T.up,fontWeight:600}}>Debit (Dr):</span> Spend → increases Expenses; Repayment / Refund → reduces card liability</div>
                        <div>• <span style={{color:T.down,fontWeight:600}}>Credit (Cr):</span> Spend → increases card liability; Repayment → reduces bank cash</div>
                      </>
                    )}
                  </div>
                  <div style={{fontSize:11,color:T.dim,marginTop:8,fontFamily:inter}}>Every transaction has equal debits and credits (sum = 0)</div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* Transaction modal */}
      {showTxnModal && <CCTxnModal cardId={card.id} card={card} accounts={accounts} setAccounts={setAccounts} setCards={setCards} onSave={handleAddTxn} onClose={()=>setShowTxnModal(false)}/>}
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────
function CreditCardScreen({ cards, setCards, accounts, setAccounts, transactions, setTransactions, showToast }) {
  const isMobile = useIsMobile();
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [showAccModal, setShowAccModal] = useState(false);
  const [editAcc, setEditAcc] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [viewTab, setViewTab] = useState("cards");
  const [searchQ, setSearchQ] = useState("");
  const ccSort = useSortState();

  const creditCards = cards.filter(c => (c.cardType === "Credit" || c.cardType === "Commercial") && c.isActive);
  const debitCards  = cards.filter(c => c.cardType === "Debit" && c.isActive);

  // Summary stats
  const totalDebt   = creditCards.reduce((s,c) => s+c.currentBalance, 0);
  const totalLimit  = creditCards.reduce((s,c) => s+c.creditLimit, 0);
  const totalAvail  = totalLimit - totalDebt;
  const overallUtil = totalLimit > 0 ? (totalDebt/totalLimit*100) : 0;
  const totalAnnualFees = creditCards.reduce((s,c) => s + (c.annualFee||0), 0);
  const totalTxns = transactions.length;

  const dueThisWeek = creditCards.filter(c => {
    if(!c.dueDayOfMonth || c.currentBalance <= 0) return false;
    const today = new Date();
    let due = new Date(today.getFullYear(), today.getMonth(), c.dueDayOfMonth);
    if(due <= today) due = new Date(today.getFullYear(), today.getMonth()+1, c.dueDayOfMonth);
    const d = Math.ceil((due - today)/(1000*60*60*24));
    return d >= 0 && d <= 7;
  });

  const filteredCards = cards.filter(c => {
    if (filterType !== "All" && c.cardType !== filterType) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!(c.cardName||"").toLowerCase().includes(q) && !(c.bank||"").toLowerCase().includes(q) && !(c.last4||"").includes(q) && !(c.network||"").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Spend by bank breakdown
  const bankBreakdown = {};
  creditCards.forEach(c => { bankBreakdown[c.bank] = (bankBreakdown[c.bank]||0) + c.currentBalance; });

  const handleSaveCard = (f) => {
    if(f.id) {
      setCards(prev => prev.map(c => c.id===f.id ? f : c));
      showToast("Card updated","success");
    } else {
      setCards(prev => [...prev, {...f, id:"CC"+Date.now()}]);
      showToast("Card added","success");
    }
    setShowCardModal(false);
    setEditCard(null);
  };

  const handleSaveAcc = (f) => {
    if(f.id) {
      setAccounts(prev => prev.map(a => a.id===f.id ? f : a));
      showToast("Account updated","success");
    } else {
      setAccounts(prev => [...prev, {...f, id:"ACC"+Date.now()}]);
      showToast("Account added","success");
    }
    setShowAccModal(false);
    setEditAcc(null);
  };

  const handleToggleActive = (id) => {
    setCards(prev => prev.map(c => c.id===id ? {...c, isActive:!c.isActive} : c));
    const card = cards.find(c=>c.id===id);
    showToast(card && card.isActive ? "Card deactivated" : "Card reactivated", "success");
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>

      {/* ── Page header ── */}
      <div className="wo-page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:700}}>Cards & Accounts</div>
          <div style={{fontSize:13,color:T.muted,marginTop:2}}>{creditCards.length} credit · {debitCards.length} debit · {accounts.length} accounts</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setEditCard({...EMPTY_CARD,id:""});setShowCardModal(true);}}
            style={{background:T.selected,color:T.selectedText,border:"none",borderRadius:9,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
            + Add Card
          </button>
        </div>
      </div>

      {/* ── Summary cards — 4 col grid ── */}
      <div className="wo-summary-grid" style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12,marginBottom:18}}>
        {[
          {label:"Total Debt",value:fmtCompact(totalDebt),sub:`${creditCards.length} credit cards`,icon:"💳",color:T.down},
          {label:"Credit Limit",value:fmtCompact(totalLimit),sub:`${overallUtil.toFixed(1)}% utilised`,icon:"🏦",color:T.text},
          {label:"Available Credit",value:fmtCompact(totalAvail),sub:"Remaining credit across all cards",icon:"📈",color:T.up},
          {label:"Due This Week",value:String(dueThisWeek.length),sub:dueThisWeek.length>0?`S$${dueThisWeek.reduce((s,c)=>s+c.currentBalance,0).toLocaleString()} outstanding`:"All payments current",icon:"⚠️",color:dueThisWeek.length>0?T.warn:T.muted},
        ].map((c,i)=>(
          <Card key={i} style={{padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{fontSize:12,color:T.muted,fontWeight:500}}>{c.label}</div>
              <span style={{fontSize:20}}>{c.icon}</span>
            </div>
            <div style={{fontSize:22,fontWeight:700,marginTop:8,color:T.text}}>{c.value}</div>
            <div style={{fontSize:11,color:T.dim,marginTop:4}}>{c.sub}</div>
          </Card>
        ))}
      </div>

      {/* ── Utilisation by bank — like insurance coverage bar ── */}
      {Object.keys(bankBreakdown).length > 0 && (
        <Card style={{padding:"16px 20px",marginBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:600}}>Credit Utilisation by Bank</div>
            <div style={{fontSize:12,color:overallUtil>70?T.down:T.up,fontWeight:700}}>{overallUtil.toFixed(1)}% overall</div>
          </div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
            {Object.entries(bankBreakdown).map(([bank, bal])=>{
              const bankLimit = creditCards.filter(c=>c.bank===bank).reduce((s,c)=>s+c.creditLimit,0);
              const pct = bankLimit > 0 ? (bal/bankLimit*100).toFixed(0) : 0;
              const bc = BANK_COLORS[bank] || {from:"#374151",to:"#1F2937"};
              return (
                <div key={bank} style={{flex:"1 1 140px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:12,color:T.muted,fontWeight:500}}>{bank}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{pct}%</span>
                  </div>
                  <div style={{height:6,background:T.inputBg,borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:bc.from,borderRadius:3}}/>
                  </div>
                  <div style={{fontSize:11,color:T.dim,marginTop:4}}>{fmtCompact(bal)} / {fmtCompact(bankLimit)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Due alerts — full-width banners like insurance ── */}
      {dueThisWeek.length > 0 && (
        <div style={{marginBottom:16,display:"flex",flexDirection:"column",gap:8}}>
          {dueThisWeek.map((card,i) => {
            const today = new Date();
            let due = new Date(today.getFullYear(), today.getMonth(), card.dueDayOfMonth);
            if(due <= today) due = new Date(today.getFullYear(), today.getMonth()+1, card.dueDayOfMonth);
            const daysUntil = Math.ceil((due - today)/(1000*60*60*24));
            const dueStr = due.toLocaleDateString("en-SG",{day:"numeric",month:"short"});
            return (
              <div key={i} style={{background:T.warnBg,border:`1px solid ${T.warn}40`,borderRadius:10,padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
                <span style={{fontSize:18,flexShrink:0}}>🔔</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.text}}>
                    Due soon: <span style={{color:T.warn}}>{card.cardName}</span>
                  </div>
                  <div style={{fontSize:12,color:T.muted,marginTop:2}}>
                    {card.bank} · ••{card.last4} · {daysUntil === 0 ? "Due today" : `${daysUntil}d until ${dueStr}`}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.warn}}>S${card.currentBalance.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                  <div style={{fontSize:11,color:T.dim}}>Min S${card.minimumPayment.toLocaleString()}</div>
                </div>
                <button onClick={()=>setSelectedCard(card)} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",color:T.text,flexShrink:0}}>View</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── View tabs + Filter toolbar ── */}
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:"1 1 200px"}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.dim,pointerEvents:"none"}}>🔍</span>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search card name, bank, last 4…"
            style={{width:"100%",boxSizing:"border-box",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px 8px 34px",fontSize:13,fontFamily:"inherit",color:T.text,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:5}}>
          {[{id:"cards",label:"Cards"},{id:"accounts",label:"Accounts"}].map(t=>(
            <button key={t.id} onClick={()=>setViewTab(t.id)}
              style={{background:viewTab===t.id?T.selected:T.inputBg,color:viewTab===t.id?T.selectedText:T.muted,border:`1px solid ${viewTab===t.id?T.selected:T.border}`,borderRadius:7,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:viewTab===t.id?600:400}}>
              {t.label}
            </button>
          ))}
        </div>
        {viewTab === "cards" && (
          <>
            <div style={{width:1,height:20,background:T.border}}/>
            <div style={{display:"flex",gap:5}}>
              {["All","Credit","Commercial","Debit"].map(f=>(
                <button key={f} onClick={()=>setFilterType(f)}
                  style={{background:filterType===f?T.selected:T.inputBg,color:filterType===f?T.selectedText:T.muted,border:`1px solid ${filterType===f?T.selected:T.border}`,borderRadius:7,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:filterType===f?600:400}}>
                  {f}
                </button>
              ))}
            </div>
            <span style={{fontSize:12,color:T.muted,marginLeft:"auto"}}>{filteredCards.length} of {cards.length}</span>
          </>
        )}
        {viewTab === "accounts" && (
          <span style={{fontSize:12,color:T.muted,marginLeft:"auto"}}>{accounts.length} accounts</span>
        )}
      </div>

      {/* ── Cards table / mobile cards ── */}
      {viewTab === "cards" && (
        filteredCards.length === 0 ? (
          <Card style={{padding:"48px 24px",textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:12}}>💳</div>
            <div style={{fontSize:14,fontWeight:600}}>No cards found</div>
            <div style={{fontSize:12,color:T.muted,marginTop:4}}>Try adjusting filters or add a new card</div>
          </Card>
        ) : isMobile ? (
          <Card style={{padding:0,overflow:"hidden"}}>
            {filteredCards.map(card => {
              const bc = BANK_COLORS[card.bank] || {from:"#374151",to:"#1F2937"};
              const isDebit = card.cardType === "Debit";
              const utilPct = !isDebit && card.creditLimit>0 ? Math.min(100,card.currentBalance/card.creditLimit*100) : 0;
              const linkedAcc = accounts.find(a=>a.id===card.linkedAccountId);
              return <MobileListItem key={card.id} onClick={()=>setSelectedCard(card)}
                icon="💳" iconBg={`linear-gradient(135deg,${bc.from},${bc.to})`} title={card.cardName}
                subtitle={`${card.bank} · ${card.network} · ••${card.last4}`}
                value={isDebit ? (linkedAcc ? fmtCompact(linkedAcc.balance) : "—") : fmtCompact(card.currentBalance)}
                valueColor={isDebit ? T.up : (card.currentBalance > 0 ? T.down : T.up)}
                valueSub={!isDebit && card.creditLimit > 0 ? `${utilPct.toFixed(0)}% of ${fmtCompact(card.creditLimit)}` : (isDebit ? "Debit" : "")}
                badge={card.cardType} badgeBg={isDebit?T.accentBg:card.cardType==="Commercial"?T.warnBg:T.upBg}
                badgeColor={isDebit?T.accent:card.cardType==="Commercial"?T.warn:T.up}
                extra={!card.isActive ? <span style={{fontSize:11,color:T.down,fontWeight:600}}>Inactive</span> : null}
              />;
            })}
          </Card>
        ) : (
          <Card style={{padding:0,overflow:"hidden"}}>
            <SortHeader gridCols="2.2fr 1fr 1.2fr 1fr 1fr 0.8fr" sortKey={ccSort.sortKey} sortDir={ccSort.sortDir} onSort={ccSort.onSort}
              columns={[["Card / Bank","left","cardName"],["Network","left","network"],["Balance / Limit","right","balance"],["Utilisation","right","util"],["Due Date","left","due"],["Status","left","cardType"]]}/>
            {ccSort.sortFn(filteredCards, (c, k) => {
              if (k==="cardName") return (c.cardName||"").toLowerCase();
              if (k==="network") return (c.network||"").toLowerCase();
              if (k==="balance") return c.cardType==="Debit"?0:c.currentBalance;
              if (k==="util") return c.creditLimit>0?c.currentBalance/c.creditLimit:0;
              if (k==="due") return c.dueDayOfMonth||99;
              if (k==="cardType") return c.cardType;
              return 0;
            }).map((card,i) => {
              const bc = BANK_COLORS[card.bank] || {from:"#374151",to:"#1F2937"};
              const isDebit = card.cardType === "Debit";
              const linkedAcc = accounts.find(a=>a.id===card.linkedAccountId);
              const utilPct = !isDebit && card.creditLimit>0 ? Math.min(100,card.currentBalance/card.creditLimit*100) : 0;
              const cardTxns = transactions.filter(t=>t.cardId===card.id);
              const daysUntilDue = (() => {
                if(!card.dueDayOfMonth) return null;
                const today = new Date();
                let due = new Date(today.getFullYear(), today.getMonth(), card.dueDayOfMonth);
                if(due <= today) due = new Date(today.getFullYear(), today.getMonth()+1, card.dueDayOfMonth);
                return Math.ceil((due - today)/(1000*60*60*24));
              })();
              return (
                <div key={card.id} onClick={()=>setSelectedCard(card)}
                  style={{display:"grid",gridTemplateColumns:"2.2fr 1fr 1.2fr 1fr 1fr 0.8fr",padding:"13px 20px",borderBottom:i<filteredCards.length-1?`1px solid ${T.border}`:"none",alignItems:"center",cursor:"pointer",
                    opacity:card.isActive?1:0.5,background:card.isActive?"":T.sidebar}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.hover}
                  onMouseLeave={e=>e.currentTarget.style.background=(card.isActive?"":T.sidebar)}>
                  {/* Card / Bank */}
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${bc.from},${bc.to})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,color:"#fff"}}>💳</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600}}>{card.cardName}</div>
                      <div style={{fontSize:11,color:T.muted,marginTop:1}}>{card.bank} · ••{card.last4} · {cardTxns.length} txns</div>
                    </div>
                  </div>
                  {/* Network */}
                  <div style={{fontSize:12,color:T.muted}}>{card.network}</div>
                  {/* Balance / Limit */}
                  <div style={{textAlign:"right"}}>
                    {isDebit ? (
                      linkedAcc ? (
                        <div style={{fontSize:13,fontWeight:700,color:T.up}}>{fmtCompact(linkedAcc.balance)}</div>
                      ) : <span style={{fontSize:12,color:T.dim}}>—</span>
                    ) : (
                      <>
                        <div style={{fontSize:13,fontWeight:700,color:card.currentBalance>0?T.down:T.up}}>{fmtCompact(card.currentBalance)}</div>
                        <div style={{fontSize:10,color:T.dim,marginTop:1}}>/ {fmtCompact(card.creditLimit)}</div>
                      </>
                    )}
                  </div>
                  {/* Utilisation */}
                  <div style={{textAlign:"right"}}>
                    {!isDebit && card.creditLimit > 0 ? (
                      <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
                        <div style={{width:40,height:4,borderRadius:2,background:T.border,overflow:"hidden"}}>
                          <div style={{width:`${utilPct}%`,height:"100%",background:utilPct>70?T.down:T.up}}/>
                        </div>
                        <span style={{fontSize:12,fontWeight:600,color:utilPct>70?T.down:T.up}}>{utilPct.toFixed(0)}%</span>
                      </div>
                    ) : <span style={{fontSize:12,color:T.dim}}>—</span>}
                  </div>
                  {/* Due Date */}
                  <div>
                    {!isDebit && card.dueDayOfMonth ? (
                      <>
                        <div style={{fontSize:12,color:T.text}}>Day {card.dueDayOfMonth}</div>
                        {daysUntilDue !== null && daysUntilDue <= 7 && card.currentBalance > 0 && (
                          <div style={{fontSize:10,color:T.warn,fontWeight:600}}>{daysUntilDue}d away</div>
                        )}
                      </>
                    ) : <span style={{fontSize:12,color:T.dim}}>—</span>}
                  </div>
                  {/* Status */}
                  <div style={{display:"flex",gap:4,alignItems:"center"}}>
                    <Badge bg={isDebit?T.accentBg:card.cardType==="Commercial"?T.warnBg:T.upBg}
                      color={isDebit?T.accent:card.cardType==="Commercial"?T.warn:T.up}>
                      {card.cardType}
                    </Badge>
                    {!card.isActive && <span style={{width:7,height:7,borderRadius:"50%",background:T.down,display:"inline-block"}} title="Inactive"/>}
                  </div>
                </div>
              );
            })}
          </Card>
        )
      )}

      {/* ── Accounts table / mobile cards ── */}
      {viewTab === "accounts" && (
        isMobile ? (
          <Card style={{padding:0,overflow:"hidden"}}>
            {accounts.map(acc => {
              const bc = BANK_COLORS[acc.bank] || {from:"#374151",to:"#1F2937"};
              const linkedCards = cards.filter(c=>c.linkedAccountId===acc.id);
              return <MobileListItem key={acc.id}
                icon="🏦" iconBg={`linear-gradient(135deg,${bc.from},${bc.to})`} title={acc.accountName}
                subtitle={`${acc.bank} · ${acc.accountType} · ••${acc.last4}`}
                value={`${acc.currency} ${acc.balance.toLocaleString(undefined,{minimumFractionDigits:2})}`} valueColor={T.up}
                valueSub={linkedCards.length>0?`${linkedCards.length} linked card${linkedCards.length!==1?"s":""}`:""} />;
            })}
          </Card>
        ) : (
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1.5fr",padding:"9px 20px",background:T.sidebar,borderBottom:`1px solid ${T.border}`}}>
            {[["Account / Bank","left"],["Type","left"],["Balance","right"],["Linked Cards","left"]].map(([h,a])=>(
              <div key={h} style={{fontSize:11,color:T.muted,fontWeight:500,textAlign:a}}>{h}</div>
            ))}
          </div>
          {accounts.map((acc,i) => {
            const bc = BANK_COLORS[acc.bank] || {from:"#374151",to:"#1F2937"};
            const linkedCards = cards.filter(c=>c.linkedAccountId===acc.id);
            return (
              <div key={acc.id}
                style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1.5fr",padding:"13px 20px",borderBottom:i<accounts.length-1?`1px solid ${T.border}`:"none",alignItems:"center"}}
                onMouseEnter={e=>e.currentTarget.style.background=T.hover}
                onMouseLeave={e=>e.currentTarget.style.background=""}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${bc.from},${bc.to})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,color:"#fff"}}>🏦</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{acc.accountName}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:1}}>{acc.bank} · ••{acc.last4}</div>
                  </div>
                </div>
                <div style={{fontSize:12,color:T.muted}}>{acc.accountType}</div>
                <div style={{textAlign:"right",fontSize:15,fontWeight:700,color:T.up}}>{acc.currency} {acc.balance.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                <div>
                  {linkedCards.length > 0 ? linkedCards.map(c=>(
                    <div key={c.id} style={{fontSize:11,fontWeight:600,color:T.accent}}>••{c.last4} {c.cardName}</div>
                  )) : <span style={{fontSize:12,color:T.dim}}>No linked cards</span>}
                </div>
              </div>
            );
          })}
        </Card>
        )
      )}

      {/* ══ CARD DETAIL DRAWER — slide-in overlay like insurance/loans ══ */}
      {selectedCard && (() => {
        const card = cards.find(c => c.id === selectedCard.id) || selectedCard;
        return (
          <div className="wo-drawer-overlay" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}
            onClick={e => { if (e.target === e.currentTarget) setSelectedCard(null); }}>
            <div style={{width:"min(960px, 95vw)",height:"100vh",background:T.bg,overflow:"hidden",boxShadow:"-4px 0 32px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column"}}>
              <CCDrawer
                key={card.id}
                card={card}
                accounts={accounts}
                setAccounts={setAccounts}
                transactions={transactions}
                setTransactions={setTransactions}
                setCards={setCards}
                showToast={showToast}
                onClose={()=>setSelectedCard(null)}
              />
            </div>
          </div>
        );
      })()}

      {/* Modals */}
      {showCardModal && editCard && (
        <CCCardModal card={editCard} accounts={accounts} onSave={handleSaveCard} onClose={()=>{setShowCardModal(false);setEditCard(null);}}/>
      )}
      {showAccModal && editAcc && (
        <CCAccountModal account={editAcc} onSave={handleSaveAcc} onClose={()=>{setShowAccModal(false);setEditAcc(null);}}/>
      )}
    </div>
  );
}


const NAV = [
  { id: "holdings", label: "Holdings", icon: "≡", group: "Stocks & Shares" },
  { id: "chart", label: "Stock Chart", icon: "↗", group: "Stocks & Shares" },
  { id: "dividends", label: "Dividends", icon: "◎", group: "Stocks & Shares" },
  { id: "news", label: "News & Sentiment", icon: "⚡", group: "Stocks & Shares", soon: true },
  { id: "manage", label: "Manage Stocks", icon: "+", group: "Stocks & Shares" },
  { id: "creditcards", label: "Credit Cards", icon: "💳", group: "Banking" },
  { id: "loans", label: "Loans", icon: "🏦", group: "Banking" },
  { id: "insurance", label: "Insurance", icon: "🛡", group: "Protection" },
  { id: "realestate", label: "Real Estate", icon: "🏠", group: "Protection" },
  { id: "retirement", label: "Retirement", icon: "🏛️", group: "Protection" },
  { id: "bonds", label: "Bonds & T-Bills", icon: "📊", group: "Protection" },
  { id: "crypto", label: "Cryptocurrencies", icon: "🪙", group: "Crypto Wallet" },
  { id: "privateequity", label: "VC/PE Investments", icon: "💼", group: "Private Assets" },
  { id: "partnerships", label: "Business Ventures", icon: "🤝", group: "Private Assets" },
  { id: "collectibles", label: "Collectibles", icon: "💎", group: "Private Assets" },
  { id: "ai", label: "AI Agent", icon: "✦", group: "Tools", soon: true },
  { id: "import", label: "Import Data", icon: "⇄", group: "Tools", soon: true },
];

const subtitles = {
  holdings: "All positions across your linked accounts",
  chart: "Live price chart and technical analysis",
  dividends: "Dividend calendar, income history and projections",
  news: "Latest news and insider activity for your holdings",
  manage: "Add, sell or remove stock positions manually",
  ai: "Ask your AI agent anything about your portfolio",
  import: "Connect your broker or upload CSV data",
  creditcards: "Credit & debit cards, limits and transactions",
  loans: "Personal, car, education and business loans overview",
  insurance: "Policies, premiums, claims and coverage overview",
  realestate: "Properties, valuations, rental income and insurance",
  retirement: "CPF LIFE, SRS, retirement income plans and cash reserves",
  bonds: "Singapore Savings Bonds, SGS, T-Bills, corporate bonds and fixed deposits",
  crypto: "Spot holdings, stablecoins, staking and DeFi positions across chains",
  privateequity: "VC funds, PE funds, direct equity, SAFEs and secondary investments",
  partnerships: "Partnerships, joint ventures, Pte Ltd shareholdings and co-owned businesses",
  collectibles: "Watches, art, wine, classic cars, jewellery and other tangible assets",
};

export default function App() {
  const [page, setPage] = useState("holdings");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [holdings, setHoldings] = useState(HOLDINGS_INIT);
  const [divModalOpen, setDivModalOpen] = useState(false);
  const [manualDivs, setManualDivs] = useState([]);
  const [policies, setPolicies] = useState(POLICIES_INIT);
  const [properties, setProperties] = useState([
    { id:"P001", name:"Tampines HDB", country:"Singapore", flag:"🇸🇬", type:"HDB — Resale", tenure:"99-Year Leasehold", address:"Blk 448A Tampines St 45, #08-12", postalCode:"520448", sizeSqft:1001, purchasePrice:390000, purchaseDate:"2021-03-15", currentValuation:490000, purpose:"Own Stay", isRented:false, monthlyRent:0, tenantName:"", leaseStart:"", leaseEnd:"", loanAmount:312000, interestRate:2.6, loanTenureYears:22, monthlyPayment:1565, annualTax:924, mcstFee:0, maintenanceFee:0, stampDuty:9600, agentFee:0, otherFees:3200, notes:"HDB resale. 3-room. Near Tampines MRT.", linkedInsuranceId: 7, tags:["Primary Home","HDB"],
      loanContracts:[
        { id:"LC001", loanType:"HDB Loan", lender:"HDB", loanAmount:312000, interestRate:2.6, rateType:"Fixed", tenureYears:25, monthlyPayment:1421, startDate:"2021-03-15", maturityDate:"2046-03-15", isActive:true, notes:"HDB concessionary loan at 2.6% fixed." },
      ],
      loanRepayments:[
        { id:"LR001", contractId:"LC001", date:"2026-03-01", totalAmount:1421, cashAmount:711, cpfAmount:710, fees:0, notes:"March 2026 — half cash, half CPF-OA" },
        { id:"LR002", contractId:"LC001", date:"2026-02-01", totalAmount:1421, cashAmount:711, cpfAmount:710, fees:0, notes:"Feb 2026" },
        { id:"LR003", contractId:"LC001", date:"2026-01-01", totalAmount:1421, cashAmount:1421, cpfAmount:0, fees:0, notes:"Jan 2026 — full cash" },
      ],
    },
    { id:"P002", name:"One North Condo", country:"Singapore", flag:"🇸🇬", type:"Private Condo", tenure:"99-Year Leasehold", address:"1 Rochester Park, #12-08", postalCode:"139212", sizeSqft:753, purchasePrice:1050000, purchaseDate:"2021-09-01", currentValuation:1280000, purpose:"Investment / Rental", isRented:true, monthlyRent:4800, tenantName:"Mr. James Wong", leaseStart:"2025-05-01", leaseEnd:"2027-04-30", loanAmount:840000, interestRate:3.2, loanTenureYears:27, monthlyPayment:3892, annualTax:5920, mcstFee:380, maintenanceFee:0, stampDuty:34200, agentFee:4800, otherFees:5000, notes:"Investment condo. 1BR. Near one-north MRT.", tags:["Investment","Tenanted"],
      loanContracts:[
        { id:"LC002", loanType:"Bank Loan", lender:"DBS Bank", loanAmount:840000, interestRate:3.2, rateType:"Floating", tenureYears:30, monthlyPayment:3892, startDate:"2021-09-01", maturityDate:"2051-09-01", isActive:true, notes:"DBS floating rate package. SORA + 0.85%." },
      ],
      loanRepayments:[
        { id:"LR004", contractId:"LC002", date:"2026-03-01", totalAmount:3892, cashAmount:2892, cpfAmount:1000, fees:0, notes:"Mar 2026 — partial CPF-OA" },
        { id:"LR005", contractId:"LC002", date:"2026-02-01", totalAmount:3892, cashAmount:2892, cpfAmount:1000, fees:0, notes:"Feb 2026" },
        { id:"LR006", contractId:"LC002", date:"2026-01-01", totalAmount:3892, cashAmount:3892, cpfAmount:0, fees:0, notes:"Jan 2026 — full cash" },
      ],
    },
    { id:"P003", name:"KL Mont Kiara Condo", country:"Malaysia", flag:"🇲🇾", type:"Condo / Serviced Apt", tenure:"Freehold", address:"Jalan Kiara 3, Mont Kiara, KL", postalCode:"50480", sizeSqft:1250, purchasePrice:850000, purchaseDate:"2023-06-01", currentValuation:920000, purpose:"Investment / Rental", isRented:true, monthlyRent:4200, tenantName:"Expat Family", leaseStart:"2024-01-01", leaseEnd:"2025-12-31", loanAmount:595000, interestRate:4.35, loanTenureYears:30, monthlyPayment:2960, annualTax:1200, mcstFee:450, maintenanceFee:0, stampDuty:21000, agentFee:5950, otherFees:3000, notes:"Freehold condo. Expat tenant.", tags:["Overseas","Freehold"],
      loanContracts:[
        { id:"LC003", loanType:"Bank Loan", lender:"Maybank Malaysia", loanAmount:595000, interestRate:4.35, rateType:"Floating", tenureYears:30, monthlyPayment:2960, startDate:"2023-06-01", maturityDate:"2053-06-01", isActive:true, notes:"Maybank BLR-based floating rate." },
      ],
      loanRepayments:[
        { id:"LR007", contractId:"LC003", date:"2026-03-01", totalAmount:2960, cashAmount:2960, cpfAmount:0, fees:0, notes:"Mar 2026" },
        { id:"LR008", contractId:"LC003", date:"2026-02-01", totalAmount:2960, cashAmount:2960, cpfAmount:0, fees:0, notes:"Feb 2026" },
      ],
    },
  ]);
  const [ccCards, setCCCards] = useState(CC_CARDS_INIT);
  const [ccAccounts, setCCAccounts] = useState(CC_ACCOUNTS_INIT);
  const [ccTransactions, setCCTransactions] = useState(CC_TRANSACTIONS_INIT);
  const [loans, setLoans] = useState(LOANS_INIT);
  const [retPlans, setRetPlans] = useState(RETIREMENT_INIT);
  const [bondHoldings, setBondHoldings] = useState(BONDS_INIT);
  const [cryptoHoldings, setCryptoHoldings] = useState(CRYPTO_INIT);
  const [peInvestments, setPEInvestments] = useState(PE_INIT);
  const [bpVentures, setBPVentures] = useState(BP_INIT);
  const [collectibles, setCollectibles] = useState(COL_INIT);
  const [transactions, setTransactions] = useState([
    { id: 1,  sym: "AAPL",  txType: "Buy",      date: "2025-01-12", qty: "45",  price: "152.30", fees: "1.50", currency: "SGD", broker: "Tiger Brokers", notes: "" },
    { id: 2,  sym: "MSFT",  txType: "Buy",      date: "2025-02-03", qty: "22",  price: "310.40", fees: "1.20", currency: "SGD", broker: "IBKR",          notes: "" },
    { id: 3,  sym: "VOO",   txType: "Buy",      date: "2025-02-20", qty: "18",  price: "380.10", fees: "0.00", currency: "SGD", broker: "Tiger Brokers", notes: "Long-term ETF position" },
    { id: 4,  sym: "NVDA",  txType: "Buy",      date: "2025-03-01", qty: "12",  price: "420.00", fees: "1.80", currency: "SGD", broker: "Moomoo",        notes: "" },
    { id: 5,  sym: "JNJ",   txType: "Buy",      date: "2025-03-08", qty: "30",  price: "161.80", fees: "1.00", currency: "SGD", broker: "IBKR",          notes: "" },
    { id: 6,  sym: "AMZN",  txType: "Buy",      date: "2025-03-10", qty: "8",   price: "140.20", fees: "1.20", currency: "SGD", broker: "Tiger Brokers", notes: "" },
    { id: 7,  sym: "GOOGL", txType: "Buy",      date: "2025-03-12", qty: "15",  price: "130.80", fees: "1.00", currency: "SGD", broker: "IBKR",          notes: "" },
    { id: 8,  sym: "META",  txType: "Buy",      date: "2025-03-15", qty: "10",  price: "320.00", fees: "1.50", currency: "SGD", broker: "Moomoo",        notes: "" },
    { id: 9,  sym: "BRK.B", txType: "Buy",      date: "2025-03-18", qty: "20",  price: "360.50", fees: "1.00", currency: "SGD", broker: "IBKR",          notes: "" },
    { id: 10, sym: "VTI",   txType: "Buy",      date: "2025-03-20", qty: "25",  price: "210.40", fees: "0.00", currency: "SGD", broker: "Tiger Brokers", notes: "Diversification ETF" },
    { id: 11, sym: "AAPL",  txType: "Dividend", date: "2025-06-15", qty: "45",  price: "0.25",   fees: "0.00", currency: "SGD", broker: "Tiger Brokers", notes: "Q2 dividend" },
    { id: 12, sym: "JNJ",   txType: "Dividend", date: "2025-06-20", qty: "30",  price: "1.24",   fees: "0.00", currency: "SGD", broker: "IBKR",          notes: "Q2 dividend" },
    { id: 13, sym: "MSFT",  txType: "Dividend", date: "2025-09-10", qty: "22",  price: "0.75",   fees: "0.00", currency: "SGD", broker: "IBKR",          notes: "Q3 dividend" },
    { id: 14, sym: "NVDA",  txType: "Sell",     date: "2025-10-05", qty: "5",   price: "680.00", fees: "2.00", currency: "SGD", broker: "Moomoo",        notes: "Partial profit taking" },
    { id: 15, sym: "VOO",   txType: "Dividend", date: "2025-12-18", qty: "18",  price: "1.65",   fees: "0.00", currency: "SGD", broker: "Tiger Brokers", notes: "Q4 dividend" },
    { id: 16, sym: "AAPL",  txType: "Buy",      date: "2026-01-08", qty: "10",  price: "175.40", fees: "1.20", currency: "SGD", broker: "Tiger Brokers", notes: "Added to position" },
    { id: 17, sym: "META",  txType: "Sell",     date: "2026-01-22", qty: "3",   price: "490.00", fees: "1.50", currency: "SGD", broker: "Moomoo",        notes: "Rebalancing" },
    { id: 18, sym: "JNJ",   txType: "Dividend", date: "2026-03-07", qty: "30",  price: "1.24",   fees: "0.00", currency: "SGD", broker: "IBKR",          notes: "Q1 2026 dividend" },
    { id: 19, sym: "AAPL",  txType: "Dividend", date: "2026-03-10", qty: "55",  price: "0.25",   fees: "0.00", currency: "SGD", broker: "Tiger Brokers", notes: "Q1 2026 dividend" },
    { id: 20, sym: "GOOGL", txType: "Buy",      date: "2026-02-14", qty: "5",   price: "158.20", fees: "1.00", currency: "SGD", broker: "IBKR",          notes: "Added to position" },
  ]);
  const [toast, setToast] = useState({ msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  const groups = [...new Set(NAV.map(n => n.group))];
  const activeNav = NAV.find(n => n.id === page);

  const renderScreen = () => {
    if (page === "holdings") return <HoldingsScreen />;
    if (page === "chart") return <ChartScreen holdings={holdings} />;
    if (page === "dividends") return <DividendsScreen manualDivs={manualDivs} />;
    if (page === "news") return <NewsScreen />;
    if (page === "ai") return <AIScreen />;
    if (page === "manage") return <ManageScreen holdings={holdings} setHoldings={setHoldings} transactions={transactions} setTransactions={setTransactions} showToast={showToast} />;
    if (page === "import") return <ImportDataScreen />;
    if (page === "creditcards") return <CreditCardScreen cards={ccCards} setCards={setCCCards} accounts={ccAccounts} setAccounts={setCCAccounts} transactions={ccTransactions} setTransactions={setCCTransactions} showToast={showToast} />;
    if (page === "loans") return <LoansScreen loans={loans} setLoans={setLoans} showToast={showToast} />;
    if (page === "insurance") return <InsuranceScreen policies={policies} setPolicies={setPolicies} accounts={ccAccounts} setAccounts={setCCAccounts} showToast={showToast} />;
    if (page === "realestate") return <RealEstateScreen properties={properties} setProperties={setProperties} policies={policies} showToast={showToast} />;
    if (page === "retirement") return <RetirementScreen plans={retPlans} setPlans={setRetPlans} showToast={showToast} />;
    if (page === "bonds") return <BondsScreen bonds={bondHoldings} setBonds={setBondHoldings} showToast={showToast} />;
    if (page === "crypto") return <CryptoScreen cryptos={cryptoHoldings} setCryptos={setCryptoHoldings} showToast={showToast} />;
    if (page === "privateequity") return <PEScreen investments={peInvestments} setInvestments={setPEInvestments} showToast={showToast} />;
    if (page === "partnerships") return <BPScreen ventures={bpVentures} setVentures={setBPVentures} showToast={showToast} />;
    if (page === "collectibles") return <CollectiblesScreen items={collectibles} setItems={setCollectibles} showToast={showToast} />;
    return <div style={{ color: T.muted, fontSize: 13 }}>Coming soon.</div>;
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", background: T.bg, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: T.text, fontSize: 14, overflow: "hidden" }}>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "" })} />

      {/* Mobile sidebar backdrop */}
      <div className={`wo-sidebar-backdrop${sidebarOpen?" wo-open":""}`} onClick={()=>setSidebarOpen(false)}/>

      {/* ── Sidebar ── */}
      <div className={`wo-sidebar${sidebarOpen?" wo-open":""}`} style={{ width: 215, borderRight: `1px solid ${T.sidebarBorder}`, background: T.sidebar, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Org header */}
        <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${T.sidebarBorder}`, display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: T.selected, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: T.selectedText }}>W</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25 }}>dilwyn's WealthOS</div>
            <div style={{ fontSize: 11, color: T.dim }}>Organization</div>
          </div>
        </div>

        {/* Add New */}
        <div style={{ padding: "10px 12px 6px" }}>
          <button style={{ width: "100%", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 12, color: T.muted, cursor: "pointer", fontFamily: "inherit", textAlign: "left", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 15 }}>+</span> Add New
          </button>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px" }}>
          {groups.map(g => (
            <div key={g} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 500, padding: "4px 8px 5px", letterSpacing: "0.02em" }}>{g}</div>
              {NAV.filter(n => n.group === g).map(n => {
                const active = page === n.id;
                return (
                  <button key={n.id} onClick={() => {setPage(n.id);setSidebarOpen(false);}} style={{ width: "100%", background: active ? T.selected : "transparent", color: active ? T.selectedText : T.muted, border: "none", borderRadius: 7, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: active ? 600 : 400, marginBottom: 1 }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.hover; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ fontSize: 12, width: 16, textAlign: "center", opacity: active ? 1 : 0.7 }}>{n.icon}</span>
                    {n.label}
                    {/* live badge on Manage */}

                    {n.soon && (
                      <span style={{ marginLeft: "auto", fontSize: 10, background: T.inputBg, color: T.dim, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>Soon</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User */}
        <div style={{ borderTop: `1px solid ${T.sidebarBorder}`, padding: "11px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.selected, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: T.selectedText, fontWeight: 700 }}>DI</div>
          <span style={{ fontSize: 12, color: T.muted }}>dilwyn</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: T.dim }}>∧</span>
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar — exactly as in screenshot */}
        <div style={{ height: 48, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 14, flexShrink: 0, background: T.bg }}>
          <button className="wo-hamburger" onClick={()=>setSidebarOpen(o=>!o)} style={{ background: "transparent", border: "none", color: T.dim, cursor: "pointer", fontSize: 16, padding: "4px 6px", display: "none" }}>☰</button>
          <div className="wo-topbar-search" style={{ flex: 1, maxWidth: 340, display: "flex", alignItems: "center", gap: 8, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 12px" }}>
            <span style={{ fontSize: 13, color: T.dim }}>🔍</span>
            <span style={{ fontSize: 13, color: T.dim }}>Search</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: T.dim, background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: "1px 6px" }}>⌘K</span>
          </div>
          <div className="wo-topbar-extras" style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: T.muted }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.up }} />
              Live · Last sync 2 min ago
            </div>
            <select style={{ fontSize: 12, color: T.muted, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 10px", fontFamily: "inherit", cursor: "pointer", outline: "none" }}>
              <option>All Accounts</option>
            </select>
          </div>
        </div>

        {/* Page content */}
        {page === "realestate" || page === "creditcards" || page === "insurance" || page === "loans" || page === "retirement" || page === "bonds" || page === "crypto" || page === "privateequity" || page === "partnerships" || page === "collectibles" ? (
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 28px 0", flexShrink: 0 }}>
              <h1 className="wo-main-title" style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{activeNav && activeNav.label}</h1>
              <p style={{ fontSize: 13, color: T.muted, margin: "0 0 14px" }}>{subtitles[page]}</p>
            </div>
            <div className="wo-main-content" style={{ padding: "0 28px 32px" }}>
              {renderScreen()}
            </div>
          </div>
        ) : (
          <div className="wo-default-page" style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
            <div className="wo-default-page-inner" style={{ maxWidth: 980, margin: "0 auto" }}>
              <div className="wo-page-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                <h1 className="wo-main-title" style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>{activeNav && activeNav.label}</h1>
                {page === "dividends" && (
                  <button onClick={() => setDivModalOpen(true)} style={{ background: T.selected, color: T.selectedText, border: "none", borderRadius: 9, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                    <span style={{ fontSize: 16 }}>+</span> Add Dividend
                  </button>
                )}
              </div>
              <p style={{ fontSize: 13, color: T.muted, margin: "0 0 24px" }}>{subtitles[page]}</p>
              {page === "dividends" && divModalOpen && <AddDividendModal onClose={() => setDivModalOpen(false)} onAdd={(entry) => { setManualDivs(p => [...p, entry]); setDivModalOpen(false); }} />}
              {renderScreen()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
