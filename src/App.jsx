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
    "        margin: 0 !important; padding: 0 !important; text-align: left !important; }"
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

const Card = ({ children, style = {} }) => (
  <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, ...style }}>
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
  { id: 1, sym: "AAPL", name: "Apple Inc.", qty: 45, price: 189.84, cost: 152.30, changeP: +0.66, value: 8542.80, weight: 22.1, sector: "Technology", broker: "Tiger Brokers", addedDate: "Jan 12, 2025", tradeCcy: "USD", exchange: "NASDAQ" },
  { id: 2, sym: "MSFT", name: "Microsoft Corp.", qty: 22, price: 415.60, cost: 310.40, changeP: -0.51, value: 9143.20, weight: 23.7, sector: "Technology", broker: "IBKR", addedDate: "Feb 3, 2025", tradeCcy: "USD", exchange: "NASDAQ" },
  { id: 3, sym: "VOO", name: "Vanguard S&P 500 ETF", qty: 18, price: 498.25, cost: 380.10, changeP: +0.69, value: 8968.50, weight: 23.2, sector: "ETF", broker: "Tiger Brokers", addedDate: "Feb 20, 2025", tradeCcy: "USD", exchange: "NYSE" },
  { id: 4, sym: "NVDA", name: "NVIDIA Corp.", qty: 12, price: 875.40, cost: 420.00, changeP: +1.77, value: 10504.80, weight: 27.2, sector: "Technology", broker: "Moomoo", addedDate: "Mar 1, 2025", tradeCcy: "USD", exchange: "NASDAQ" },
  { id: 5, sym: "JNJ", name: "Johnson & Johnson", qty: 30, price: 152.30, cost: 161.80, changeP: -0.30, value: 4569.00, weight: 11.8, sector: "Healthcare", broker: "IBKR", addedDate: "Mar 8, 2025", tradeCcy: "USD", exchange: "NYSE" },
  { id: 6, sym: "AMZN", name: "Amazon.com Inc.", qty: 8, price: 182.50, cost: 140.20, changeP: +0.92, value: 1460.00, weight: 3.8, sector: "Technology", broker: "Tiger Brokers", addedDate: "Mar 10, 2025", tradeCcy: "USD", exchange: "NASDAQ" },
  { id: 7, sym: "GOOGL", name: "Alphabet Inc.", qty: 15, price: 165.30, cost: 130.80, changeP: -0.44, value: 2479.50, weight: 6.4, sector: "Technology", broker: "IBKR", addedDate: "Mar 12, 2025", tradeCcy: "USD", exchange: "NASDAQ" },
  { id: 8, sym: "META", name: "Meta Platforms Inc.", qty: 10, price: 512.40, cost: 320.00, changeP: +1.21, value: 5124.00, weight: 13.3, sector: "Technology", broker: "Moomoo", addedDate: "Mar 15, 2025", tradeCcy: "USD", exchange: "NASDAQ" },
  { id: 9, sym: "BRK.B", name: "Berkshire Hathaway B", qty: 20, price: 410.10, cost: 360.50, changeP: +0.18, value: 8202.00, weight: 21.2, sector: "Financials", broker: "IBKR", addedDate: "Mar 18, 2025", tradeCcy: "USD", exchange: "NYSE" },
  { id: 10, sym: "VTI", name: "Vanguard Total Market ETF", qty: 25, price: 240.80, cost: 210.40, changeP: +0.55, value: 6020.00, weight: 15.6, sector: "ETF", broker: "Tiger Brokers", addedDate: "Mar 20, 2025", tradeCcy: "USD", exchange: "NYSE" },
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
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
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState("All Categories");
  const [period, setPeriod] = useState("All");
  const totalValue = HOLDINGS_INIT.reduce((s, h) => s + h.value, 0);

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["All Categories", "Technology", "ETF", "Healthcare"].map(f => (
                <button key={f} onClick={e => { e.stopPropagation(); setFilter(f); }} style={{ background: filter === f ? T.selected : "transparent", color: filter === f ? T.selectedText : T.muted, border: `1px solid ${filter === f ? T.selected : T.border}`, borderRadius: 7, padding: "5px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: filter === f ? 600 : 400 }}>{f}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {["1M", "3M", "1Y", "All"].map(t => (
                <button key={t} onClick={e => { e.stopPropagation(); setPeriod(t); }} style={{ background: period === t ? T.selected : "transparent", color: period === t ? T.selectedText : T.muted, border: `1px solid ${period === t ? T.selected : T.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>{t}</button>
              ))}
            </div>
          </div>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 0.7fr 0.8fr 1fr 1fr 1fr", padding: "9px 20px", background: T.sidebar, borderBottom: `1px solid ${T.border}` }}>
            {[["Assets","left"],["Quantity","left"],["Type","left"],["Price","right"],["Change","right"],["Value","right"]].map(([h, align]) => (
              <div key={h} style={{ fontSize: 11, color: T.muted, fontWeight: 500, textAlign: align }}>{h}</div>
            ))}
          </div>
          {/* Rows */}
          {HOLDINGS_INIT.filter(h => filter === "All Categories" || h.sector === filter).map((h, i, arr) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 0.7fr 0.8fr 1fr 1fr 1fr", padding: "13px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center", cursor: "pointer" }}
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
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{h.tradeCcy} {h.price.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: T.dim }}>{h.tradeCcy !== "SGD" ? `(S$${(h.price * (FX[h.tradeCcy] || 1)).toFixed(2)})` : ""}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: h.changeP >= 0 ? T.up : T.down }}>{h.changeP >= 0 ? "+" : ""}{h.changeP.toFixed(2)}%</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>S${h.value.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: h.changeP >= 0 ? T.up : T.down }}>{h.changeP >= 0 ? "+" : ""}S${((h.price - h.cost) * h.qty).toFixed(0)}</div>
              </div>
            </div>
          ))}
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
          <div style={{ fontSize: 30, fontWeight: 700, color: T.up, letterSpacing: "-0.03em", marginTop: 6 }}>+S$22,840.00</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 10 }}>Cost basis: S$95,610.32</div>
        </Card>
      </div>

      {/* ── Cash Accounts ── */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
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
              return (
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
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
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 201, background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", overflow: "hidden" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[{ l: "Projected Annual Income", v: "S$1,916" }, { l: "YTD Received", v: "S$360.00" }, { l: "Yield on Cost", v: "2.14%" }].map((s, i) => (
          <Card key={i} style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>{s.l}</div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{s.v}</div>
          </Card>
        ))}
      </div>
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
        <Card style={{ padding: 0, overflow: "hidden" }}>
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
      <Card style={{ padding: 0, overflow: "hidden" }}>
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
    { id: "add", label: "Add Stock", icon: "+" },
    { id: "remove", label: `Manage Holdings (${holdings.length})`, icon: "⊟" },
    { id: "history", label: `Transaction History (${transactions.length})`, icon: "☰" },
    { id: "api", label: "Broker Integrations", icon: "🔗", badge: "Coming Soon" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Inner tab bar */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: 22 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "transparent", color: tab === t.id ? T.text : T.muted, border: "none", borderBottom: `2px solid ${tab === t.id ? T.selected : "transparent"}`, padding: "10px 18px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: tab === t.id ? 600 : 400, display: "flex", alignItems: "center", gap: 6, marginBottom: -1 }}>
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
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1.2fr 1fr 130px", padding: "9px 20px", background: T.sidebar, borderBottom: `1px solid ${T.border}` }}>
              {["Stock / ETF", "Shares", "Avg. Cost", "Broker", ""].map((h, i) => (
                <div key={i} style={{ fontSize: 11, color: T.muted, fontWeight: 500, textAlign: i === 4 ? "right" : "left" }}>{h}</div>
              ))}
            </div>
            {filtered.length === 0 && <div style={{ padding: "36px 20px", textAlign: "center", fontSize: 13, color: T.dim }}>No holdings found.</div>}
            {filtered.map((h) => (
              <div key={h.id}>
                <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1.2fr 1fr 130px", padding: "13px 20px", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: T.inputBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: T.muted }}>{h.sym.slice(0, 2)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{h.name}</div>
                      <div style={{ fontSize: 11, color: T.dim }}>{h.sym} · Added {h.addedDate}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{h.qty}</div>
                  <div style={{ fontSize: 13, color: T.muted }}>S${h.cost.toFixed(2)}</div>
                  <div><Badge>{h.broker}</Badge></div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button onClick={() => { setPartialId(partialId === h.id ? null : h.id); setConfirmId(null); setSellF({ qty: "", price: "", date: "", fees: "" }); }}
                      style={{ background: partialId === h.id ? T.selected : T.inputBg, color: partialId === h.id ? T.selectedText : T.muted, border: `1px solid ${partialId === h.id ? T.selected : T.border}`, borderRadius: 7, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Sell</button>
                    <button onClick={() => { setConfirmId(confirmId === h.id ? null : h.id); setPartialId(null); }}
                      style={{ background: confirmId === h.id ? T.downBg : T.inputBg, color: confirmId === h.id ? T.down : T.muted, border: `1px solid ${confirmId === h.id ? T.down + "40" : T.border}`, borderRadius: 7, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
                  </div>
                </div>

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
            ))}
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
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {/* Result count */}
              <div style={{ padding: "10px 20px", borderBottom: `1px solid ${T.border}`, background: T.sidebar, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: T.muted }}>{sorted.length} of {transactions.length} transactions</span>
                {(histSearch || histTypeFilter !== "All") && (
                  <button onClick={() => { setHistSearch(""); setHistTypeFilter("All"); }} style={{ fontSize: 11, color: T.accent, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Clear filters</button>
                )}
              </div>
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
            </Card>
            );
          })()}
        </div>
      )}

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
          <Card style={{ padding: 0, overflow: "hidden" }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
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
        <Card style={{ padding: 0, overflow: "hidden" }}>
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
};

function calcMonthly(principal, annualRate, years) {
  if (!principal || !annualRate || !years) return 0;
  const r = annualRate / 100 / 12, n = years * 12;
  return Math.round(principal * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1));
}

const COUNTRIES_LIST = Object.keys(RE_COUNTRIES);

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
          <span style={{fontSize:10,fontWeight:600,color:sc.color,background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:6,padding:"3px 8px",whiteSpace:"nowrap"}}>
            {p.purpose}
          </span>
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
  const [editing, setEditing] = useState(false);
  const [ef, setEFState] = useState(null);
  const setEF = (k, v) => setEFState(f => ({...f, [k]: v}));

  const ctry = RE_COUNTRIES[p.country] || RE_COUNTRIES.Singapore;
  const sym = ctry.symbol;
  const gain = (p.currentValuation||0) - (p.purchasePrice||0);
  const gainPct = p.purchasePrice ? ((gain/p.purchasePrice)*100).toFixed(1) : "0.0";
  const monthly = p.monthlyPayment || calcMonthly(p.loanAmount, p.interestRate, p.loanTenureYears);
  const update = (fields) => setProperties(prev => prev.map(pr => pr.id === p.id ? {...pr,...fields} : pr));

  const TABS = ["overview","financials","rental","costs","insurance"];
  const tabLabel = {overview:"Overview",financials:"Loan & Finance",rental:"Rental",costs:"Costs & Fees",insurance:"Insurance"};

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
              <div style={{fontSize:15,fontWeight:800}}>{p.name}</div>
              <div style={{fontSize:11,color:T.muted}}>{p.type} · {p.country}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:6}}>
            {propTab !== "insurance" && (
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
        {propTab === "financials" && (
          <>
            <div style={{background:T.selected,borderRadius:14,padding:"18px 20px"}}>
              <div style={{fontSize:11,color:"#9CA3AF",marginBottom:12,fontWeight:600}}>EQUITY SNAPSHOT</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {[
                  {l:"Property Value", v:`${sym}${(p.currentValuation||p.purchasePrice||0).toLocaleString()}`, c:"white"},
                  {l:"Loan Balance",   v:p.loanAmount>0?`-${sym}${p.loanAmount.toLocaleString()}`:"No loan",  c:p.loanAmount>0?"#FCA5A5":"#86EFAC"},
                  {l:"Equity",         v:`${sym}${((p.currentValuation||p.purchasePrice||0)-(p.loanAmount||0)).toLocaleString()}`, c:"#86EFAC"},
                ].map(s => (
                  <div key={s.l}>
                    <div style={{fontSize:10,color:"#9CA3AF"}}>{s.l}</div>
                    <div style={{fontSize:14,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"11px 16px",background:T.inputBg,fontSize:13,fontWeight:700}}>🏦 Loan Details</div>
              {editing && ef ? (
                <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div><Label>Loan Balance ({sym})</Label><Input type="number" value={ef.loanAmount} onChange={e=>setEF("loanAmount",parseFloat(e.target.value)||0)}/></div>
                    <div><Label>Interest Rate (%)</Label><Input type="number" step="0.01" value={ef.interestRate} onChange={e=>setEF("interestRate",parseFloat(e.target.value)||0)}/></div>
                    <div><Label>Remaining Tenure (yrs)</Label><Input type="number" value={ef.loanTenureYears} onChange={e=>setEF("loanTenureYears",parseInt(e.target.value)||25)}/></div>
                    <div><Label>Monthly Payment</Label><Input type="number" value={ef.monthlyPayment} onChange={e=>setEF("monthlyPayment",parseFloat(e.target.value)||0)} placeholder="Auto-calculated"/></div>
                  </div>
                  {!!(ef.loanAmount && ef.interestRate && ef.loanTenureYears) && (
                    <div style={{background:T.inputBg,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.muted}}>
                      Calculated monthly: <strong style={{color:T.text}}>{sym}{calcMonthly(parseFloat(ef.loanAmount),parseFloat(ef.interestRate),parseInt(ef.loanTenureYears)).toLocaleString()}</strong>
                    </div>
                  )}
                </div>
              ) : (
                [
                  ["Loan Balance",      p.loanAmount>0?`${sym}${p.loanAmount.toLocaleString()}`:"No loan / Cash purchase"],
                  ["Interest Rate",     p.interestRate>0?`${p.interestRate}% p.a.`:"—"],
                  ["Remaining Tenure",  p.loanTenureYears>0?`${p.loanTenureYears} years`:"—"],
                  ["Monthly Repayment", monthly>0?`${sym}${monthly.toLocaleString()}`:"—"],
                  ["Annual Repayment",  monthly>0?`${sym}${(monthly*12).toLocaleString()}`:"—"],
                  ["LTV Ratio",         p.purchasePrice>0&&p.loanAmount>0?`${((p.loanAmount/p.purchasePrice)*100).toFixed(0)}%`:"—"],
                ].map(([k,v]) => (
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
                    <span style={{fontSize:12,color:T.muted}}>{k}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{v}</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ── RENTAL ── */}
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
    </div>
  );
}

/* ── Real Estate Screen ─────────────────────────────────────────── */
function RealEstateScreen({ properties, setProperties, policies, showToast }) {
  const [selProp,    setSelProp]    = useState(null);
  const [propTab,    setPropTab]    = useState("overview");
  const [showAdd,    setShowAdd]    = useState(false);
  const [filterCtry, setFilterCtry] = useState("All");
  const [filterPurp, setFilterPurp] = useState("All");
  const [searchQ,    setSearchQ]    = useState("");
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

  const cp = RE_COUNTRIES[addForm.country] || RE_COUNTRIES.Singapore;
  const previewMonthly = calcMonthly(parseFloat(addForm.loanAmount)||0, parseFloat(addForm.interestRate)||0, parseInt(addForm.loanTenureYears)||25);

  const selPropData = selProp ? properties.find(x => x.id === selProp.id) : null;

  return (
    <div style={{display:"flex",height:"100%",overflow:"hidden"}}>

      {/* Left panel */}
      <div style={{width:380,flexShrink:0,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Summary */}
        <div style={{padding:"16px 18px",borderBottom:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <RESummaryCard l="Total Value"           v={`S$${totalValue.toLocaleString()}`}                      c={T.text}/>
          <RESummaryCard l="Total Equity"          v={`S$${equity.toLocaleString()}`}                          c={T.up}/>
          <RESummaryCard l="Monthly Rental"        v={totalRent>0?`+S$${totalRent.toLocaleString()}`:"—"}      c={T.up}/>
          <RESummaryCard l="Properties"            v={`${properties.length} total`}                            c={T.text}
            sub={`${properties.filter(p=>p.isRented).length} rented`}/>
        </div>

        {/* Filters */}
        <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:8}}>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search properties…"
            style={{width:"100%",boxSizing:"border-box",padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.inputBg,fontFamily:"inherit",fontSize:13,outline:"none",color:T.text}}/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["All", ...COUNTRIES_LIST].map(c => (
              <button key={c} onClick={()=>setFilterCtry(c)}
                style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${filterCtry===c?T.selected:T.border}`,background:filterCtry===c?T.selected:T.inputBg,color:filterCtry===c?T.selectedText:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:filterCtry===c?700:400}}>
                {c==="All" ? "All" : RE_COUNTRIES[c].flag+" "+c}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["All", ...RE_PURPOSE].map(p => (
              <button key={p} onClick={()=>setFilterPurp(p)}
                style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${filterPurp===p?T.selected:T.border}`,background:filterPurp===p?T.selected:T.inputBg,color:filterPurp===p?T.selectedText:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:filterPurp===p?700:400}}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{flex:1,overflowY:"auto",minHeight:0}}><div style={{padding:"12px 18px 24px",display:"flex",flexDirection:"column",gap:10}}>
          {filtered.length === 0 ? (
            <div style={{textAlign:"center",padding:"48px 20px",color:T.muted}}>
              <div style={{fontSize:32,marginBottom:10}}>🏘</div>
              <div style={{fontSize:14,fontWeight:600}}>No properties found</div>
              <div style={{fontSize:12,marginTop:6}}>Add your first property below</div>
            </div>
          ) : filtered.map(p => (
            <REPropCard key={p.id} p={p} selPropId={selProp && selProp.id}
              insured={!!(policies||[]).find(pol=>pol.id===p.linkedInsuranceId)}
              onSelect={prop=>{setSelProp(prop);setPropTab("overview");}}/>
          ))}
        </div>

        {/* Add button */}
        <div style={{padding:"14px 18px",borderTop:`1px solid ${T.border}`}}>
          <button onClick={()=>{setAddForm({...EMPTY_PROP,id:`P${Date.now()}`});setShowAdd(true);}}
            style={{width:"100%",padding:"11px",borderRadius:10,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700}}>
            + Add Property
          </button>
        </div>
      </div></div>

      {/* Right panel */}
      <div style={{flex:1,overflow:"hidden",background:T.bg}}>
        {selPropData ? (
          <REDrawer
            key={selPropData.id}
            p={selPropData}
            properties={properties}
            setProperties={setProperties}
            policies={policies}
            propTab={propTab}
            setPropTab={setPropTab}
            showToast={showToast}
            onClose={()=>setSelProp(null)}
          />
        ) : (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:T.muted}}>
            <div style={{fontSize:48,marginBottom:16}}>🏠</div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Real Estate Portfolio</div>
            <div style={{fontSize:13}}>Select a property to view details</div>
          </div>
        )}
      </div>

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
  const [insTab, setInsTab] = useState("overview");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState(null);
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
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

      {/* ── Policy table ── */}
      {filtered.length === 0 ? (
        <Card style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛡️</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No policies found</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Try adjusting filters or add a new policy</div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1.1fr 1.1fr 1fr 1fr 0.9fr", padding: "9px 20px", background: T.sidebar, borderBottom: `1px solid ${T.border}` }}>
            {[["Policy / Plan","left"],["Type","left"],["Sum Assured","right"],["Premium / yr","right"],["Cash Value","right"],["Renewal","left"],["Status","left"]].map(([h,a]) => (
              <div key={h} style={{ fontSize: 11, color: T.muted, fontWeight: 500, textAlign: a }}>{h}</div>
            ))}
          </div>
          {filtered.map((pol, i) => {
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
        const DETAIL_TABS = ["overview","coverage","premiums","transactions","claims","exclusions","documents"];

        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}
            onClick={e => { if (e.target === e.currentTarget) { setSelectedPolicy(null); setTxSearch(""); setTxFilter("All"); setTxSort("desc"); } }}>
            <div style={{ width: 580, height: "100vh", background: T.bg, overflow: "hidden", boxShadow: "-4px 0 32px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>

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
                      const label = { transactions: "Tx History", claims: "Claims", exclusions: "Exclusions", documents: "Documents", overview: "Overview", coverage: "Coverage", premiums: "Premiums" }[dt] || dt;
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

  const TABS = [{id:"overview",label:"Overview"},{id:"transactions",label:"Transactions"}];

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

        </div>
      </div>

      {/* Transaction modal */}
      {showTxnModal && <CCTxnModal cardId={card.id} card={card} accounts={accounts} setAccounts={setAccounts} setCards={setCards} onSave={handleAddTxn} onClose={()=>setShowTxnModal(false)}/>}
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────
function CreditCardScreen({ cards, setCards, accounts, setAccounts, transactions, setTransactions, showToast }) {
  const [selCard, setSelCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [showAccModal, setShowAccModal] = useState(false);
  const [editAcc, setEditAcc] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [leftTab, setLeftTab] = useState("cards");

  const selCardData = cards.find(c => c.id === selCard);
  const creditCards = cards.filter(c => (c.cardType === "Credit" || c.cardType === "Commercial") && c.isActive);
  const debitCards  = cards.filter(c => c.cardType === "Debit" && c.isActive);

  // Summary stats
  const totalDebt   = creditCards.reduce((s,c) => s+c.currentBalance, 0);
  const totalLimit  = creditCards.reduce((s,c) => s+c.creditLimit, 0);
  const totalAvail  = totalLimit - totalDebt;
  const overallUtil = totalLimit > 0 ? (totalDebt/totalLimit*100) : 0;
  const dueThisWeek = creditCards.filter(c => {
    if(!c.dueDayOfMonth || c.currentBalance <= 0) return false;
    const today = new Date();
    let due = new Date(today.getFullYear(), today.getMonth(), c.dueDayOfMonth);
    if(due <= today) due = new Date(today.getFullYear(), today.getMonth()+1, c.dueDayOfMonth);
    const d = Math.ceil((due - today)/(1000*60*60*24));
    return d >= 0 && d <= 7;
  });

  const filteredCards = cards.filter(c =>
    filterType === "All" || c.cardType === filterType
  );

  const handleSaveCard = (f) => {
    if(f.id) {
      setCards(prev => prev.map(c => c.id===f.id ? f : c));
      showToast("Card updated","success");
    } else {
      const nc = {...f, id:"CC"+Date.now()};
      setCards(prev => [...prev, nc]);
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
    <div style={{display:"flex",height:"100%",overflow:"hidden"}}>

      {/* ── Left Panel ── */}
      <div style={{width:360,flexShrink:0,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Summary strip */}
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${T.border}`,background:T.sidebar,flexShrink:0}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
            {[
              {label:"Total Debt",  value:fmtCompact(totalDebt),  full:`S$${totalDebt.toLocaleString(undefined,{minimumFractionDigits:2})}`,  color:T.down},
              {label:"Total Limit", value:fmtCompact(totalLimit), full:`S$${totalLimit.toLocaleString(undefined,{minimumFractionDigits:2})}`, color:T.text},
              {label:"Available",   value:fmtCompact(totalAvail), full:`S$${totalAvail.toLocaleString(undefined,{minimumFractionDigits:2})}`, color:T.up},
            ].map(s=>(
              <div key={s.label} title={s.full} style={{background:T.bg,borderRadius:8,padding:"8px 8px",border:`1px solid ${T.border}`,minWidth:0,cursor:"default"}}>
                <div style={{fontSize:9,color:T.muted,marginBottom:2,whiteSpace:"nowrap"}}>{s.label}</div>
                <div style={{fontSize:12,fontWeight:800,color:s.color,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.value}</div>
              </div>
            ))}
          </div>
          {/* Overall utilisation bar */}
          {totalLimit > 0 && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.muted,marginBottom:4}}>
                <span>Overall Credit Utilisation</span>
                <span style={{fontWeight:700,color:overallUtil>70?T.down:T.up}}>{overallUtil.toFixed(1)}%</span>
              </div>
              <div style={{height:5,borderRadius:3,background:T.border,overflow:"hidden"}}>
                <div style={{width:`${overallUtil}%`,height:"100%",borderRadius:3,background:overallUtil>70?T.down:T.up}}/>
              </div>
            </div>
          )}
          {dueThisWeek.length > 0 && (
            <div style={{marginTop:8,padding:"7px 10px",background:T.warnBg,borderRadius:8,fontSize:11,color:T.warn,fontWeight:600}}>
              ⚠️ {dueThisWeek.length} card{dueThisWeek.length>1?"s":""} due this week
            </div>
          )}
        </div>

        {/* Left panel tabs */}
        <div style={{display:"flex",padding:"8px 12px",gap:6,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
          {[{id:"cards",label:"Cards"},{id:"accounts",label:"Accounts"}].map(t=>(
            <button key={t.id} onClick={()=>setLeftTab(t.id)}
              style={{flex:1,padding:"7px",borderRadius:8,border:"none",background:leftTab===t.id?T.selected:"transparent",
                color:leftTab===t.id?T.selectedText:T.muted,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:leftTab===t.id?700:400}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Cards tab */}
        {leftTab === "cards" && (
          <>
            {/* Filter + add */}
            <div style={{padding:"8px 12px",display:"flex",gap:6,flexShrink:0}}>
              {["All","Credit","Commercial","Debit"].map(f=>(
                <button key={f} onClick={()=>setFilterType(f)}
                  style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${filterType===f?T.selected:T.border}`,
                    background:filterType===f?T.selected:"transparent",color:filterType===f?T.selectedText:T.muted,
                    cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:filterType===f?700:400}}>
                  {f}
                </button>
              ))}
            </div>

            <div style={{flex:1,overflowY:"auto",minHeight:0}}>
              <div style={{padding:"8px 12px 24px",display:"flex",flexDirection:"column",gap:8}}>
                {filteredCards.map(card=>{
                  const bc = BANK_COLORS[card.bank] || {from:"374151",to:"1F2937"};
                  const isDebit = card.cardType!=="Credit";
                  const linkedAcc = accounts.find(a=>a.id===card.linkedAccountId);
                  const cardTxns = transactions.filter(t=>t.cardId===card.id);
                  const utilPct = !isDebit && card.creditLimit>0 ? Math.min(100,card.currentBalance/card.creditLimit*100) : 0;
                  const daysUntilDue = (() => {
                    if(!card.dueDayOfMonth) return null;
                    const today = new Date();
                    let due = new Date(today.getFullYear(), today.getMonth(), card.dueDayOfMonth);
                    if(due <= today) due = new Date(today.getFullYear(), today.getMonth()+1, card.dueDayOfMonth);
                    return Math.ceil((due - today)/(1000*60*60*24));
                  })();
                  const isSelected = selCard === card.id;

                  return (
                    <div key={card.id} onClick={()=>setSelCard(card.id)}
                      style={{border:`1.5px solid ${isSelected?T.selected:T.border}`,borderRadius:12,padding:"12px 14px",
                        cursor:"pointer",background:card.isActive?T.bg:T.sidebar,
                        opacity:card.isActive?1:0.55,transition:"border-color 0.15s"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          {/* Mini colour bar */}
                          <div style={{width:4,height:36,borderRadius:2,background:card.isActive?`linear-gradient(180deg,#${bc.from},#${bc.to})`:"#D1D5DB"}}/>
                          <div>
                            <div style={{fontSize:13,fontWeight:700,color:card.isActive?T.text:T.muted}}>{card.cardName}</div>
                            <div style={{fontSize:11,color:T.muted,marginTop:1}}>{card.bank} · {card.network} · ••{card.last4}</div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:4,alignItems:"center"}}>
                          {!card.isActive && (
                            <span style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:4,background:T.downBg,color:T.down}}>Inactive</span>
                          )}
                          {card.isActive && (
                            <span style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:4,
                              background:isDebit?T.accentBg:card.cardType==="Commercial"?T.warnBg:T.upBg,
                              color:isDebit?T.accent:card.cardType==="Commercial"?T.warn:T.up}}>
                              {card.cardType}
                            </span>
                          )}
                          <button onClick={e=>{e.stopPropagation();setEditCard(card);setShowCardModal(true);}}
                            style={{background:"none",border:"none",cursor:"pointer",color:T.dim,fontSize:13,padding:"2px"}}>✏️</button>
                          <button
                            onClick={e=>{e.stopPropagation();handleToggleActive(card.id);}}
                            title={card.isActive?"Deactivate card":"Reactivate card"}
                            style={{background:"none",border:"none",cursor:"pointer",fontSize:13,padding:"2px",
                              color:card.isActive?T.dim:T.up}}>
                            {card.isActive ? "🚫" : "✅"}
                          </button>
                        </div>
                      </div>
                      {/* Credit utilisation */}
                      {!isDebit && card.creditLimit > 0 && (
                        <div style={{marginBottom:6}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.muted,marginBottom:3}}>
                            <span>S${card.currentBalance.toLocaleString(undefined,{minimumFractionDigits:2})} / S${card.creditLimit.toLocaleString()}</span>
                            <span style={{color:utilPct>70?T.down:T.up,fontWeight:700}}>{utilPct.toFixed(0)}%</span>
                          </div>
                          <div style={{height:3,borderRadius:2,background:T.border,overflow:"hidden"}}>
                            <div style={{width:`${utilPct}%`,height:"100%",background:utilPct>70?T.down:T.up}}/>
                          </div>
                        </div>
                      )}
                      {/* Debit: account balance */}
                      {isDebit && linkedAcc && (
                        <div style={{fontSize:11,color:T.muted}}>
                          Linked: {linkedAcc.accountName} · <span style={{color:T.up,fontWeight:700}}>S${linkedAcc.balance.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
                        </div>
                      )}
                      {/* Due date */}
                      {!isDebit && card.currentBalance > 0 && daysUntilDue !== null && daysUntilDue <= 7 && (
                        <div style={{fontSize:10,color:T.warn,fontWeight:600,marginTop:4}}>
                          ⚠️ Due in {daysUntilDue} day{daysUntilDue!==1?"s":""}
                        </div>
                      )}
                      <div style={{fontSize:10,color:T.dim,marginTop:4}}>{cardTxns.length} transactions</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add card button */}
            <div style={{padding:"12px 14px",borderTop:`1px solid ${T.border}`,flexShrink:0}}>
              <button onClick={()=>{setEditCard({...EMPTY_CARD,id:""});setShowCardModal(true);}}
                style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:T.selected,color:T.selectedText,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700}}>
                + Add Card
              </button>
            </div>
          </>
        )}

        {/* Accounts tab */}
        {leftTab === "accounts" && (
          <>
            <div style={{flex:1,overflowY:"auto",minHeight:0}}>
              <div style={{padding:"10px 12px 24px",display:"flex",flexDirection:"column",gap:8}}>
                {accounts.map(acc=>{
                  const bc = BANK_COLORS[acc.bank] || {from:"374151",to:"1F2937"};
                  const linkedCards = cards.filter(c=>c.linkedAccountId===acc.id);
                  return (
                    <div key={acc.id} style={{border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px",background:T.bg}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:4,height:36,borderRadius:2,background:`linear-gradient(180deg,#${bc.from},#${bc.to})`}}/>
                          <div>
                            <div style={{fontSize:13,fontWeight:700}}>{acc.accountName}</div>
                            <div style={{fontSize:11,color:T.muted,marginTop:1}}>{acc.bank} · {acc.accountType} · ••{acc.last4}</div>
                          </div>
                        </div>
  
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:10,color:T.muted}}>Available Balance</div>
                          <div style={{fontSize:18,fontWeight:800,color:T.up}}>{acc.currency} {acc.balance.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                        </div>
                        {linkedCards.length > 0 && (
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:10,color:T.muted,marginBottom:3}}>Linked Cards</div>
                            {linkedCards.map(c=>(
                              <div key={c.id} style={{fontSize:11,fontWeight:600,color:T.accent}}>••{c.last4} {c.cardName}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </>
        )}
      </div>

      {/* ── Right Panel ── */}
      <div style={{flex:1,overflow:"hidden",background:T.bg}}>
        {selCardData ? (
          <CCDrawer
            key={selCardData.id}
            card={selCardData}
            accounts={accounts}
            setAccounts={setAccounts}
            transactions={transactions}
            setTransactions={setTransactions}
            setCards={setCards}
            showToast={showToast}
            onClose={()=>setSelCard(null)}
          />
        ) : (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",flexDirection:"column",gap:12,color:T.muted}}>
            <div style={{fontSize:48}}>💳</div>
            <div style={{fontSize:15,fontWeight:600}}>Select a card to view details</div>
            <div style={{fontSize:13}}>Or add a new card with the button on the left</div>
          </div>
        )}
      </div>

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
  { id: "insurance", label: "Insurance", icon: "🛡", group: "Protection" },
  { id: "realestate", label: "Real Estate", icon: "🏠", group: "Protection" },
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
  insurance: "Policies, premiums, claims and coverage overview",
  realestate: "Properties, valuations, rental income and insurance",
};

export default function App() {
  const [page, setPage] = useState("holdings");
  const [holdings, setHoldings] = useState(HOLDINGS_INIT);
  const [divModalOpen, setDivModalOpen] = useState(false);
  const [manualDivs, setManualDivs] = useState([]);
  const [policies, setPolicies] = useState(POLICIES_INIT);
  const [properties, setProperties] = useState([
    { id:"P001", name:"Tampines HDB", country:"Singapore", flag:"🇸🇬", type:"HDB — Resale", tenure:"99-Year Leasehold", address:"Blk 448A Tampines St 45, #08-12", postalCode:"520448", sizeSqft:1001, purchasePrice:390000, purchaseDate:"2021-03-15", currentValuation:490000, purpose:"Own Stay", isRented:false, monthlyRent:0, tenantName:"", leaseStart:"", leaseEnd:"", loanAmount:312000, interestRate:2.6, loanTenureYears:22, monthlyPayment:1565, annualTax:924, mcstFee:0, maintenanceFee:0, stampDuty:9600, agentFee:0, otherFees:3200, notes:"HDB resale. 3-room. Near Tampines MRT.", linkedInsuranceId: 7, tags:["Primary Home","HDB"] },
    { id:"P002", name:"One North Condo", country:"Singapore", flag:"🇸🇬", type:"Private Condo", tenure:"99-Year Leasehold", address:"1 Rochester Park, #12-08", postalCode:"139212", sizeSqft:753, purchasePrice:1050000, purchaseDate:"2021-09-01", currentValuation:1280000, purpose:"Investment / Rental", isRented:true, monthlyRent:4800, tenantName:"Mr. James Wong", leaseStart:"2025-05-01", leaseEnd:"2027-04-30", loanAmount:840000, interestRate:3.2, loanTenureYears:27, monthlyPayment:3892, annualTax:5920, mcstFee:380, maintenanceFee:0, stampDuty:34200, agentFee:4800, otherFees:5000, notes:"Investment condo. 1BR. Near one-north MRT.", tags:["Investment","Tenanted"] },
    { id:"P003", name:"KL Mont Kiara Condo", country:"Malaysia", flag:"🇲🇾", type:"Condo / Serviced Apt", tenure:"Freehold", address:"Jalan Kiara 3, Mont Kiara, KL", postalCode:"50480", sizeSqft:1250, purchasePrice:850000, purchaseDate:"2023-06-01", currentValuation:920000, purpose:"Investment / Rental", isRented:true, monthlyRent:4200, tenantName:"Expat Family", leaseStart:"2024-01-01", leaseEnd:"2025-12-31", loanAmount:595000, interestRate:4.35, loanTenureYears:30, monthlyPayment:2960, annualTax:1200, mcstFee:450, maintenanceFee:0, stampDuty:21000, agentFee:5950, otherFees:3000, notes:"Freehold condo. Expat tenant.", tags:["Overseas","Freehold"] },
  ]);
  const [ccCards, setCCCards] = useState(CC_CARDS_INIT);
  const [ccAccounts, setCCAccounts] = useState(CC_ACCOUNTS_INIT);
  const [ccTransactions, setCCTransactions] = useState(CC_TRANSACTIONS_INIT);
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
    if (page === "insurance") return <InsuranceScreen policies={policies} setPolicies={setPolicies} accounts={ccAccounts} setAccounts={setCCAccounts} showToast={showToast} />;
    if (page === "realestate") return <RealEstateScreen properties={properties} setProperties={setProperties} policies={policies} showToast={showToast} />;
    return <div style={{ color: T.muted, fontSize: 13 }}>Coming soon.</div>;
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", background: T.bg, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: T.text, fontSize: 14, overflow: "hidden" }}>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "" })} />

      {/* ── Sidebar — exactly as in screenshot ── */}
      <div style={{ width: 215, borderRight: `1px solid ${T.sidebarBorder}`, background: T.sidebar, display: "flex", flexDirection: "column", flexShrink: 0 }}>
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
                  <button key={n.id} onClick={() => setPage(n.id)} style={{ width: "100%", background: active ? T.selected : "transparent", color: active ? T.selectedText : T.muted, border: "none", borderRadius: 7, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: active ? 600 : 400, marginBottom: 1 }}
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
          <button style={{ background: "transparent", border: "none", color: T.dim, cursor: "pointer", fontSize: 16, padding: "4px 6px" }}>☰</button>
          <div style={{ flex: 1, maxWidth: 340, display: "flex", alignItems: "center", gap: 8, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 12px" }}>
            <span style={{ fontSize: 13, color: T.dim }}>🔍</span>
            <span style={{ fontSize: 13, color: T.dim }}>Search</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: T.dim, background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: "1px 6px" }}>⌘K</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center" }}>
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
        {page === "realestate" ? (
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ padding: "18px 28px 0", flexShrink: 0 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{activeNav && activeNav.label}</h1>
              <p style={{ fontSize: 13, color: T.muted, margin: "0 0 14px" }}>{subtitles[page]}</p>
            </div>
            <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
              {renderScreen()}
            </div>
          </div>
        ) : page === "creditcards" ? (
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ padding: "18px 28px 0", flexShrink: 0 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{activeNav && activeNav.label}</h1>
              <p style={{ fontSize: 13, color: T.muted, margin: "0 0 14px" }}>{subtitles[page]}</p>
            </div>
            <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
              {renderScreen()}
            </div>
          </div>
        ) : page === "insurance" ? (
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 28px 0", flexShrink: 0 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{activeNav && activeNav.label}</h1>
              <p style={{ fontSize: 13, color: T.muted, margin: "0 0 14px" }}>{subtitles[page]}</p>
            </div>
            <div style={{ padding: "0 28px 32px" }}>
              {renderScreen()}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
            <div style={{ maxWidth: 980, margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>{activeNav && activeNav.label}</h1>
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
