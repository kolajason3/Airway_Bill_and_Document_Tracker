const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

// ---------- palette ----------
const NAVY = "1E2761";
const NAVY_DARK = "141A47";
const ICE = "EDF1FA";
const WHITE = "FFFFFF";
const AMBER = "E8804C";
const TEXT_DARK = "1A2236";
const TEXT_MUTED = "5B6B8C";
const GREEN = "2D8A5E";
const AMBER_STATUS = "B07D10";
const RED = "C0392B";
const BLUE_STATUS = "3A5CB0";
const CODE_BG = "11163A";

const HEAD = "Cambria";
const BODY = "Calibri";
const MONO = "Courier New";

const ICONS = path.join(__dirname, "icons") + path.sep;

let pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.author = "Jason";
pres.title = "Airway Bill & Document Tracker — Final Review";
const SW = 13.3, SH = 7.5;

function shadow() {
  return { type: "outer", color: "1E2761", blur: 8, offset: 3, angle: 90, opacity: 0.18 };
}

function newSlide(bg = WHITE) {
  const s = pres.addSlide();
  s.background = { color: bg };
  return s;
}

function kicker(s, text, x, y, color = AMBER, align = "left") {
  s.addText(text.toUpperCase(), {
    x, y, w: 8, h: 0.35, fontFace: BODY, fontSize: 12, bold: true,
    color, charSpacing: 2, align, margin: 0
  });
}

function heading(s, text, x, y, w, color = NAVY, size = 30) {
  s.addText(text, {
    x, y, w, h: 0.8, fontFace: HEAD, fontSize: size, bold: true,
    color, align: "left", margin: 0
  });
}

function pageNum(s, n) {
  s.addText(String(n), {
    x: SW - 0.7, y: SH - 0.45, w: 0.5, h: 0.3, fontFace: BODY, fontSize: 10,
    color: TEXT_MUTED, align: "right", margin: 0
  });
}

function card(s, x, y, w, h, fill = ICE, withShadow = true) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { type: "none" },
    shadow: withShadow ? shadow() : undefined
  });
}

function iconCircle(s, iconFile, cx, cy, d, circleColor, padFrac = 0.32) {
  s.addShape(pres.shapes.OVAL, {
    x: cx - d / 2, y: cy - d / 2, w: d, h: d, fill: { color: circleColor }, line: { type: "none" }
  });
  
  const pad = d * padFrac;
  const localIconPath = path.join(__dirname, "icons", iconFile);
  
  if (fs.existsSync(localIconPath)) {
    s.addImage({ path: localIconPath, x: cx - d / 2 + pad / 2, y: cy - d / 2 + pad / 2, w: d - pad, h: d - pad });
  } else {
    // Unicode symbol fallback map
    const map = {
      "plane_white.png": "✈",
      "search_white.png": "🔍",
      "design_white.png": "📐",
      "code_white.png": "💻",
      "check_white.png": "✔",
      "file_white.png": "📄",
      "bug_white.png": "🐛",
      "envelope_white.png": "✉",
      "bulb_white.png": "💡",
      "warning_white.png": "⚠",
      "rocket_white.png": "🚀",
      "cogs_white.png": "⚙",
      "database_white.png": "💾"
    };
    const symbol = map[iconFile] || "★";
    s.addText(symbol, {
      x: cx - d / 2, y: cy - d / 2, w: d, h: d, align: "center", valign: "middle",
      fontFace: BODY, fontSize: Math.floor(d * 22), color: WHITE, margin: 0
    });
  }
}

function fitImage(maxW, maxH, origW, origH) {
  const ratio = origW / origH;
  let w = maxW, h = w / ratio;
  if (h > maxH) { h = maxH; w = h * ratio; }
  return { w, h };
}

function safeAddImage(s, imgPath, x, y, maxW, maxH, fallbackText, origW, origH) {
  if (fs.existsSync(imgPath)) {
    const dim = fitImage(maxW, maxH, origW, origH);
    s.addImage({ path: imgPath, x, y: y + (maxH - dim.h) / 2, w: dim.w, h: dim.h, shadow: shadow() });
  } else {
    // Render placeholder card
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w: maxW, h: maxH, rectRadius: 0.05, fill: { color: "F1F5F9" }, line: { color: "CBD5E1", width: 1 }, shadow: shadow()
    });
    s.addText(fallbackText, {
      x: x + 0.2, y: y + 0.2, w: maxW - 0.4, h: maxH - 0.4,
      align: "center", valign: "middle", fontFace: BODY, fontSize: 13, bold: true, color: "475569", margin: 0
    });
  }
}

function bullets(s, items, x, y, w, h, opts = {}) {
  const arr = items.map((t, i) => ({
    text: t, options: { bullet: { code: "25AA", indent: 14 }, breakLine: i < items.length - 1, color: opts.color || TEXT_DARK, fontSize: opts.fontSize || 13, fontFace: BODY, paraSpaceAfter: 10 }
  }));
  s.addText(arr, { x, y, w, h, valign: "top", margin: 0 });
}

// ============================================================
// SLIDE 1 — TITLE
// ============================================================
{
  const s = newSlide(NAVY);
  iconCircle(s, "plane_white.png", 11.7, 1.3, 1.5, AMBER, 0.3);
  kicker(s, "Final Review · Project Closure", 0.8, 1.1, AMBER);
  s.addText("Airway Bill & Document Tracker", {
    x: 0.8, y: 1.55, w: 10.5, h: 1.3, fontFace: HEAD, fontSize: 40, bold: true, color: WHITE, margin: 0
  });
  s.addText("Automated Document Compliance for Air Cargo Operations", {
    x: 0.8, y: 2.75, w: 9.5, h: 0.5, fontFace: BODY, fontSize: 17, color: ICE, margin: 0
  });
  s.addText("ORBEM Solutions Private Limited", {
    x: 0.8, y: 3.35, w: 8, h: 0.4, fontFace: BODY, fontSize: 14, bold: true, color: AMBER, margin: 0
  });

  card(s, 0.8, 5.55, 11.7, 1.05, NAVY_DARK, false);
  s.addText([
    { text: "Akshaya", options: { bold: true, color: WHITE } },
    { text: "  ·  Frontend Lead\n", options: { color: ICE } },
    { text: "Rasul Khan", options: { bold: true, color: WHITE } },
    { text: "  ·  Backend Lead\n", options: { color: ICE } },
    { text: "Jason", options: { bold: true, color: WHITE } },
    { text: "  ·  QA / DevOps Lead", options: { color: ICE } }
  ], { x: 1.1, y: 5.75, w: 6.5, h: 0.7, fontFace: BODY, fontSize: 13, lineSpacingMultiple: 1.3, margin: 0 });
  s.addText("Final Review\n29 June 2026", {
    x: 9.3, y: 5.75, w: 2.9, h: 0.7, fontFace: BODY, fontSize: 13, color: WHITE, align: "right", margin: 0, lineSpacingMultiple: 1.3
  });
}

// ============================================================
// SLIDE 2 — JOURNEY RECAP
// ============================================================
{
  const s = newSlide();
  kicker(s, "The Full Arc", 0.8, 0.55);
  heading(s, "From Problem to Production", 0.8, 0.9, 11);

  const steps = [
    { icon: "search_white.png", title: "Week 1 — Discover", body: "Studied ORBEM's air-cargo workflow and defined the 5-document compliance problem for Review 1." },
    { icon: "design_white.png", title: "Week 2 — Design", body: "Modeled the database schema and ER diagram; stood up the first Supabase tables and API views." },
    { icon: "code_white.png", title: "Week 3 — Build", body: "Implemented the document checklist, the status automation engine, and full frontend integration." },
    { icon: "check_white.png", title: "Week 4 — Test & Deploy", body: "Ran a 22-point end-to-end test suite, wired up email alerts, and deployed the live system." }
  ];
  const colW = 2.85, gap = 0.25, startX = 0.8, iconY = 2.5;
  steps.forEach((st, i) => {
    const cx = startX + colW / 2 + i * (colW + gap);
    iconCircle(s, st.icon, cx, iconY, 1.05, NAVY);
    s.addText(st.title, { x: startX + i * (colW + gap), y: 3.25, w: colW, h: 0.4, align: "center", fontFace: BODY, fontSize: 13, bold: true, color: NAVY, margin: 0 });
    s.addText(st.body, { x: startX + i * (colW + gap), y: 3.68, w: colW, h: 1.7, align: "center", fontFace: BODY, fontSize: 11.5, color: TEXT_MUTED, margin: 0, valign: "top" });
    
    const localArrowPath = path.join(__dirname, "icons", "arrow_amber.png");
    if (i < steps.length - 1 && fs.existsSync(localArrowPath)) {
      s.addImage({ path: localArrowPath, x: startX + colW + i * (colW + gap) - 0.02, y: iconY - 0.16, w: 0.32, h: 0.32 });
    }
  });

  card(s, 0.8, 5.85, 11.7, 0.95, ICE, true);
  s.addText([
    { text: "Outcome:  ", options: { bold: true, color: NAVY } },
    { text: "every phase above ended with a working, reviewed deliverable — nothing here is retroactive.", options: { italic: true, color: TEXT_MUTED } }
  ], { x: 1.1, y: 6.08, w: 11.1, h: 0.5, fontFace: BODY, fontSize: 13, margin: 0 });
  pageNum(s, 2);
}

// ============================================================
// SLIDE 3 — FINAL SYSTEM OVERVIEW
// ============================================================
{
  const s = newSlide();
  kicker(s, "What We Shipped", 0.8, 0.55);
  heading(s, "A Complete, Working Compliance Tracker", 0.8, 0.9, 11.5, NAVY, 28);

  card(s, 0.8, 1.85, 6.1, 4.55, ICE);
  s.addText("Features Delivered", { x: 1.1, y: 2.05, w: 5.5, h: 0.4, fontFace: BODY, fontSize: 14, bold: true, color: NAVY, margin: 0 });
  bullets(s, [
    "Shipment registry with automatic volumetric & chargeable weight calculation",
    "5-document compliance checklist per shipment with real file upload & storage",
    "Automated status engine — Pending Documents → Ready for Handover / On Hold",
    "Email alerts on every status change, fully logged for audit",
    "Searchable, filterable operations dashboard",
    "Complete audit trail (status history) for every shipment"
  ], 1.1, 2.55, 5.5, 3.7, { fontSize: 12.5 });

  const stats = [
    { n: "5", l: "Document Types\nAutomated" },
    { n: "5", l: "Status States\nin the Workflow" },
    { n: "6", l: "Database\nTables" },
    { n: "22/22", l: "End-to-End Tests\nPassed" }
  ];
  const gx = 7.2, gw = 2.6, gh = 2.05, ggap = 0.25;
  stats.forEach((st, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = gx + col * (gw + ggap), y = 1.85 + row * (gh + ggap);
    card(s, x, y, gw, gh, NAVY, true);
    s.addText(st.n, { x, y: y + 0.25, w: gw, h: 0.9, align: "center", fontFace: HEAD, fontSize: 34, bold: true, color: AMBER, margin: 0 });
    s.addText(st.l, { x, y: y + 1.15, w: gw, h: 0.7, align: "center", fontFace: BODY, fontSize: 11.5, color: ICE, margin: 0 });
  });

  card(s, 0.8, 6.55, 11.7, 0.65, NAVY, false);
  s.addText("A fully functional air cargo document-compliance tracker — built on Supabase, tested end-to-end, and deployed.", {
    x: 1.1, y: 6.55, w: 11.1, h: 0.65, valign: "middle", italic: true, fontFace: BODY, fontSize: 13, color: WHITE, margin: 0
  });
}

// ============================================================
// SLIDE 4 — DEMO STEP 1: DASHBOARD
// ============================================================
{
  const s = newSlide();
  kicker(s, "Live System Walkthrough · Step 1 of 5", 0.8, 0.55);
  heading(s, "Operational Dashboard", 0.8, 0.9, 5.5, NAVY, 28);

  bullets(s, [
    "Real-time stat cards pulled live from a Supabase view",
    "Searchable, filterable shipment registry (status, priority, owner)",
    "Live Supabase Cloud connection badge — not a static mockup",
    "Per-row action shortcut straight into document audit"
  ], 0.8, 2.0, 4.0, 3.2, { fontSize: 13 });

  card(s, 0.8, 5.4, 4.0, 1.2, ICE, true);
  s.addText("This is the actual running app at localhost:5173 — every number shown is live from the database.", {
    x: 1.05, y: 5.55, w: 3.5, h: 0.95, fontFace: BODY, fontSize: 11, italic: true, color: TEXT_MUTED, margin: 0
  });

  safeAddImage(
    s,
    path.join(__dirname, "uploads", "dashboard.png"),
    13.3 - 8.1 - 0.55,
    (SH - 5.6) / 2 + 0.15,
    8.1,
    5.6,
    "[Dashboard Screenshot - Real-time cargo stats grid & statuses active]",
    1920,
    1020
  );
  pageNum(s, 4);
}

// ============================================================
// SLIDE 5 — DEMO STEP 2: INTAKE & WEIGHT CALC
// ============================================================
{
  const s = newSlide();
  kicker(s, "Live System Walkthrough · Step 2 of 5", 0.8, 0.55);
  heading(s, "Shipment Intake & Automatic Weight Calculation", 0.8, 0.9, 11.5, NAVY, 26);

  card(s, 0.8, 2.0, 5.6, 2.0, CODE_BG, true);
  s.addText([
    { text: "volumetric_weight", options: { color: AMBER, bold: true } },
    { text: " = (L × W × H) / 6000\n", options: { color: WHITE } },
    { text: "chargeable_weight", options: { color: AMBER, bold: true } },
    { text: "  = MAX(actual, volumetric)", options: { color: WHITE } }
  ], { x: 1.1, y: 2.35, w: 5.0, h: 1.3, fontFace: MONO, fontSize: 14, valign: "middle", margin: 0, lineSpacingMultiple: 1.5 });

  bullets(s, [
    "Computed automatically by a Postgres trigger the instant a shipment is created",
    "No manual entry, no frontend drift from the database value",
    "Re-runs automatically if dimensions are ever updated"
  ], 0.8, 4.25, 5.6, 2.3, { fontSize: 13 });

  safeAddImage(
    s,
    path.join(__dirname, "uploads", "crop_consignment.png"),
    13.3 - 5.6 - 0.7,
    1.9,
    5.6,
    4.9,
    "[Intake Consignment & Volumetric Weight Form Crop]",
    685,
    530
  );
  pageNum(s, 5);
}

// ============================================================
// SLIDE 6 — DEMO STEP 3: DOCUMENT CHECKLIST
// ============================================================
{
  const s = newSlide();
  kicker(s, "Live System Walkthrough · Step 3 of 5", 0.8, 0.55);
  heading(s, "5-Document Compliance Checklist", 0.8, 0.9, 11, NAVY, 28);

  bullets(s, [
    "Every shipment auto-generates 5 required documents on creation:",
    "Airway Bill Copy, Commercial Invoice, Packing List,\nID Proof, Cargo Declaration",
    "Real file upload to Supabase Storage — not a placeholder reference",
    "View opens the actual uploaded file via a signed URL",
    "Reject requires a written reason; Approve updates compliance % live"
  ], 0.8, 2.0, 4.5, 4.5, { fontSize: 12.5 });

  safeAddImage(
    s,
    path.join(__dirname, "uploads", "crop_checklist.png"),
    13.3 - 6.8 - 0.55,
    1.9,
    6.8,
    4.9,
    "[Checklist Details Screenshot - File upload, approve, & reject inputs]",
    915,
    650
  );
  pageNum(s, 6);
}

// ============================================================
// SLIDE 7 — DEMO STEP 4: STATUS AUTOMATION ENGINE
// ============================================================
{
  const s = newSlide();
  kicker(s, "Live System Walkthrough · Step 4 of 5", 0.8, 0.55);
  heading(s, "Status Automation Engine", 0.8, 0.9, 9, NAVY, 28);

  // state flow diagram
  function stateBox(x, y, w, h, label, color) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color }, line: { type: "none" }, shadow: shadow() });
    s.addText(label, { x, y, w, h, align: "center", valign: "middle", fontFace: BODY, fontSize: 12.5, bold: true, color: WHITE, margin: 0 });
  }
  const topY = 2.15, botY = 3.34, boxH = 0.85; // top/bottom rows; PENDING spans both
  stateBox(0.8, topY, 2.6, botY + boxH - topY, "PENDING_DOCUMENTS", AMBER_STATUS);
  
  const localArrowNavy = path.join(__dirname, "icons", "arrow_navy.png");
  if (fs.existsSync(localArrowNavy)) {
    s.addImage({ path: localArrowNavy, x: 3.55, y: topY + boxH / 2 - 0.18, w: 0.36, h: 0.36 });
    s.addImage({ path: localArrowNavy, x: 3.55, y: botY + boxH / 2 - 0.18, w: 0.36, h: 0.36 });
  }

  stateBox(4.05, topY, 2.7, boxH, "READY_FOR_HANDOVER", GREEN);
  s.addText("all 5 approved", { x: 4.05, y: topY - 0.32, w: 2.7, h: 0.3, align: "center", fontFace: BODY, fontSize: 9.5, italic: true, color: TEXT_MUTED, margin: 0 });

  stateBox(4.05, botY, 2.7, boxH, "ON_HOLD", RED);
  s.addText("any 1 rejected", { x: 4.05, y: topY + boxH + 0.03, w: 2.7, h: 0.28, align: "center", fontFace: BODY, fontSize: 9.5, italic: true, color: TEXT_MUTED, margin: 0 });

  const compY = topY + ((botY + boxH) - topY - boxH) / 2;
  if (fs.existsSync(localArrowNavy)) {
    s.addImage({ path: localArrowNavy, x: 6.95, y: compY + boxH / 2 - 0.18, w: 0.36, h: 0.36 });
  }
  stateBox(7.45, compY, 2.6, boxH, "COMPLETED / CANCELLED", BLUE_STATUS);
  s.addText("manual, terminal", { x: 7.45, y: compY - 0.32, w: 2.6, h: 0.3, align: "center", fontFace: BODY, fontSize: 9.5, italic: true, color: TEXT_MUTED, margin: 0 });

  card(s, 0.8, 4.55, 11.7, 2.05, ICE, true);
  bullets(s, [
    "A single Postgres trigger re-evaluates shipment status after every document change — guaranteed consistent regardless of which document was approved first or whether two reviewers act at the same moment",
    "Every transition writes a status_history row automatically — nothing is logged manually",
    "Terminal states (Completed / Cancelled) are explicitly protected: once set, the automation engine no longer overrides them"
  ], 1.1, 4.72, 11.1, 1.8, { fontSize: 12.5 });
  pageNum(s, 7);
}

// ============================================================
// SLIDE 8 — DEMO STEP 5: NOTIFICATIONS
// ============================================================
{
  const s = newSlide();
  kicker(s, "Live System Walkthrough · Step 5 of 5", 0.8, 0.55);
  heading(s, "Automated Customer Notifications", 0.8, 0.9, 10, NAVY, 28);

  card(s, 0.8, 2.0, 5.4, 2.1, ICE, true);
  s.addText("Early UI concept", { x: 1.05, y: 2.12, w: 4.9, h: 0.3, fontFace: BODY, fontSize: 11, bold: true, color: TEXT_MUTED, margin: 0 });
  
  safeAddImage(
    s,
    path.join(__dirname, "uploads", "crop_whatsapp.png"),
    1.05,
    2.45,
    4.9,
    1.5,
    "[WhatsApp Mock Crop]",
    654,
    174
  );

  const localArrowAmber = path.join(__dirname, "icons", "arrow_amber.png");
  if (fs.existsSync(localArrowAmber)) {
    s.addImage({ path: localArrowAmber, x: 6.45, y: 2.85, w: 0.5, h: 0.5 });
  }

  card(s, 7.2, 2.0, 5.3, 2.1, NAVY, true);
  iconCircle(s, "envelope_white.png", 7.95, 2.95, 0.85, AMBER);
  s.addText("Production implementation:\nEmail via Resend", { x: 8.55, y: 2.65, w: 3.7, h: 0.7, fontFace: BODY, fontSize: 14, bold: true, color: WHITE, margin: 0, valign: "middle" });

  bullets(s, [
    "Triggered automatically on shipment creation and on every status change",
    "Every attempt logged to notification_log — SENT, FAILED, or SIMULATED, never silently lost",
    "Swappable by design: the same trigger → Edge Function → provider pattern works for email, SMS, or WhatsApp with zero database changes"
  ], 0.8, 4.5, 11.7, 2.2, { fontSize: 13 });
  pageNum(s, 8);
}

// ============================================================
// SLIDE 9 — ARCHITECTURE
// ============================================================
{
  const s = newSlide();
  kicker(s, "System Architecture", 0.8, 0.55);
  heading(s, "As-Built Architecture", 0.8, 0.9, 8, NAVY, 28);

  const boxY = 2.6, boxH = 1.7;
  function archBox(x, w, title, sub, fill) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: boxY, w, h: boxH, rectRadius: 0.1, fill: { color: fill }, line: { type: "none" }, shadow: shadow() });
    s.addText(title, { x, y: boxY + 0.18, w, h: 0.5, align: "center", fontFace: BODY, fontSize: 14, bold: true, color: WHITE, margin: 0 });
    s.addText(sub, { x: x + 0.15, y: boxY + 0.7, w: w - 0.3, h: 0.9, align: "center", fontFace: BODY, fontSize: 10.5, color: ICE, margin: 0 });
  }
  archBox(0.8, 3.1, "React Frontend", "Vite · Tailwind CSS\nReact Router\nsupabase-js client", NAVY);
  
  const localArrowNavy = path.join(__dirname, "icons", "arrow_navy.png");
  if (fs.existsSync(localArrowNavy)) {
    s.addImage({ path: localArrowNavy, x: 4.05, y: boxY + 0.65, w: 0.4, h: 0.4 });
  }
  archBox(4.6, 4.0, "Supabase", "Postgres · Storage\nTriggers: weight calc · doc init · status sync\nEdge Functions", NAVY_DARK);
  if (fs.existsSync(localArrowNavy)) {
    s.addImage({ path: localArrowNavy, x: 8.75, y: boxY + 0.65, w: 0.4, h: 0.4 });
  }
  archBox(9.3, 3.2, "Resend", "Email API\nTransactional status\nnotifications", AMBER);

  s.addText("Frontend reads/writes only through Supabase views and tables — every business rule lives in the database, not the client.", {
    x: 0.8, y: boxY + boxH + 0.4, w: 11.7, h: 0.5, fontFace: BODY, fontSize: 12.5, italic: true, color: TEXT_MUTED, align: "center", margin: 0
  });

  card(s, 0.8, 5.7, 11.7, 1.2, ICE, true);
  bullets(s, [
    "No custom backend server — Postgres triggers + Edge Functions handle all business logic",
    "Storage bucket with signed URLs for real document uploads"
  ], 1.1, 5.85, 11.1, 1.0, { fontSize: 12.5 });
  pageNum(s, 9);
}


// ============================================================
// SLIDE 11 — DATABASE DESIGN
// ============================================================
{
  const s = newSlide();
  kicker(s, "Database Design", 0.8, 0.55);
  heading(s, "Entity-Relationship Overview", 0.8, 0.9, 9, NAVY, 28);

  function tbox(x, y, w, h, title, fields) {
    card(s, x, y, w, h, ICE, true);
    s.addText(title, { x: x + 0.12, y: y + 0.08, w: w - 0.24, h: 0.32, fontFace: BODY, fontSize: 12, bold: true, color: NAVY, margin: 0 });
    s.addText(fields, { x: x + 0.12, y: y + 0.4, w: w - 0.24, h: h - 0.5, fontFace: BODY, fontSize: 9.5, color: TEXT_MUTED, margin: 0, lineSpacingMultiple: 1.2 });
  }
  tbox(0.8, 2.0, 2.5, 1.1, "customers", "id · name · type\nemail · phone");
  tbox(3.55, 2.0, 2.7, 1.1, "shipments", "id · awb_number · status\nchargeable_weight");
  tbox(6.5, 1.5, 2.7, 1.0, "shipment_documents", "shipment_id · doc_type\nstatus · file_reference");
  tbox(6.5, 2.7, 2.7, 1.0, "status_history", "shipment_id · prev/new\nstatus · created_at");
  tbox(9.45, 1.5, 2.6, 1.0, "alerts", "shipment_id · type\nmessage · is_read");
  tbox(9.45, 2.7, 2.6, 1.0, "notification_log", "shipment_id · subject\nsend_status");

  // connector lines
  const line = (x1, y1, x2, y2) => s.addShape(pres.shapes.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), line: { color: "AAB6D6", width: 1.5 } });
  line(3.55, 2.55, 3.3, 2.55); // placeholder line
  line(6.05, 2.55, 6.5, 2.0);
  line(6.05, 2.55, 6.5, 3.2);
  line(9.2, 2.0, 9.45, 2.0);
  line(9.2, 3.2, 9.45, 3.2);

  card(s, 0.8, 4.0, 11.7, 2.6, NAVY, true);
  bullets(s, [
    "customers → shipments (1-to-many) — one customer can have multiple shipments",
    "shipments → shipment_documents (1-to-5, fixed) — every shipment gets exactly the 5 required document rows",
    "shipments → status_history (1-to-many) — full audit trail of every transition",
    "shipments → alerts / notification_log (1-to-many) — every flagged event and every notification attempt is preserved, never overwritten"
  ], 1.1, 4.25, 11.1, 2.2, { fontSize: 13, color: ICE });
  pageNum(s, 10);
}

// ============================================================
// SLIDE 12 — CHALLENGES & SOLUTIONS (1)
// ============================================================
{
  const s = newSlide();
  kicker(s, "Challenges & Solutions · 1", 0.8, 0.55);
  heading(s, "Engineering Decisions Under Pressure", 0.8, 0.9, 11, NAVY, 28);

  function challengeCard(x, iconFile, title, body) {
    card(s, x, 1.95, 5.6, 4.6, ICE, true);
    iconCircle(s, iconFile, x + 0.75, 2.65, 0.85, NAVY);
    s.addText(title, { x: x + 1.35, y: 2.3, w: 4.0, h: 0.7, fontFace: BODY, fontSize: 14, bold: true, color: NAVY, margin: 0, valign: "middle" });
    s.addText(body, { x: x + 0.4, y: 3.25, w: 4.8, h: 3.1, fontFace: BODY, fontSize: 11.5, color: TEXT_DARK, margin: 0, valign: "top", lineSpacingMultiple: 1.25 });
  }
  challengeCard(0.8, "cogs_white.png", "Race-condition-safe status updates",
    "Problem: 5 documents can be approved in any order, by different reviewers, near-simultaneously.\n\nTried first: recalculating status from the frontend after each approval.\n\nWhy it failed: risk of stale state if two approvals landed close together.\n\nSolution: moved the logic into a Postgres trigger that recalculates straight from the document table on every write — the database is the single source of truth, not the client.");
  challengeCard(6.9, "database_white.png", "Real file storage, not a placeholder",
    "Problem: a file_reference text column doesn't prove uploads actually work end-to-end.\n\nSolution: wired Supabase Storage with a {shipment_id}/{document_type} path convention and signed URLs.\n\nValidated by building 5 realistic sample PDFs (Airway Bill, Invoice, Packing List, ID Proof, Cargo Declaration) and running the full upload → approve → view pipeline before relying on it in the live demo.");
  pageNum(s, 11);
}

// ============================================================
// SLIDE 13 — CHALLENGES & SOLUTIONS (2)
// ============================================================
{
  const s = newSlide();
  kicker(s, "Challenges & Solutions · 2", 0.8, 0.55);
  heading(s, "From WhatsApp Concept to Production-Ready Email", 0.8, 0.9, 11.5, NAVY, 26);

  card(s, 0.8, 2.1, 4.6, 2.0, ICE, true);
  s.addText("Initial UI concept", { x: 1.05, y: 2.22, w: 4.1, h: 0.3, fontFace: BODY, fontSize: 11, bold: true, color: TEXT_MUTED, margin: 0 });
  
  safeAddImage(
    s,
    path.join(__dirname, "uploads", "crop_whatsapp.png"),
    1.05,
    2.55,
    4.1,
    1.5,
    "[WhatsApp Mock Crop]",
    654,
    174
  );

  bullets(s, [
    "Problem: the original design sketched WhatsApp Business API alerts — but that needs Meta business verification and phone provisioning, infeasible inside the internship timeline",
    "Tried first: scoped a full WhatsApp + workflow-automation integration",
    "Why it didn't fit: a third infrastructure layer to learn and debug under deadline, with no reliable way to test it before review"
  ], 5.7, 2.1, 6.8, 2.6, { fontSize: 12 });

  card(s, 0.8, 4.5, 11.7, 2.2, NAVY, true);
  bullets(s, [
    "What we did instead: kept the exact same event-driven pattern — trigger → Edge Function → provider → logged result — and swapped the channel to Resend email, which needs only an API key",
    "Learning: the architecture mattered more than the specific provider — the same trigger works for email, SMS, or WhatsApp with zero changes to the database design"
  ], 1.1, 4.75, 11.1, 1.8, { fontSize: 13, color: ICE });
  pageNum(s, 12);
}

// ============================================================
// SLIDE 14 — TESTING & VALIDATION
// ============================================================
{
  const s = newSlide();
  kicker(s, "Testing & Validation", 0.8, 0.55);
  heading(s, "22-Point End-to-End Test Suite — All Passing", 0.8, 0.9, 11.5, NAVY, 26);

  card(s, 0.8, 2.0, 3.2, 4.0, NAVY, true);
  s.addText("22 / 22", { x: 0.8, y: 2.7, w: 3.2, h: 1.0, align: "center", fontFace: HEAD, fontSize: 44, bold: true, color: AMBER, margin: 0 });
  s.addText("scenarios passed\nzero console errors", { x: 0.8, y: 3.75, w: 3.2, h: 0.8, align: "center", fontFace: BODY, fontSize: 13, color: ICE, margin: 0 });

  const cats = [
    { icon: "check_white.png", t: "Core Workflow", d: "Status transitions, weight calculation, terminal-state protection" },
    { icon: "file_white.png", t: "Document Upload & Storage", d: "Real file upload, signed-URL view, rejection-reason validation" },
    { icon: "bug_white.png", t: "Validation & Error Handling", d: "Empty fields, invalid input, empty-state and error-message checks" },
    { icon: "envelope_white.png", t: "Email Alerts", d: "Creation, on-hold, ready-for-handover, completed/cancelled events" }
  ];
  cats.forEach((c, i) => {
    const y = 2.0 + i * 1.0;
    iconCircle(s, c.icon, 4.7, y + 0.45, 0.7, NAVY);
    s.addText(c.t, { x: 5.3, y: y + 0.05, w: 3.0, h: 0.4, fontFace: BODY, fontSize: 13, bold: true, color: NAVY, margin: 0 });
    s.addText(c.d, { x: 5.3, y: y + 0.42, w: 6.9, h: 0.55, fontFace: BODY, fontSize: 11, color: TEXT_MUTED, margin: 0 });
  });
  pageNum(s, 13);
}

// ============================================================
// SLIDE 15 — LEARNINGS / LIMITATIONS / FUTURE SCOPE
// ============================================================
{
  const s = newSlide();
  kicker(s, "Reflection", 0.8, 0.55);
  heading(s, "What We Learned, What's Left, What's Next", 0.8, 0.9, 11.5, NAVY, 26);

  function reflCol(x, iconFile, title, items, fill) {
    card(s, x, 1.95, 3.75, 4.7, fill, true);
    iconCircle(s, iconFile, x + 0.65, 2.55, 0.75, NAVY);
    s.addText(title, { x: x + 0.3, y: 3.05, w: 3.15, h: 0.4, align: "center", fontFace: BODY, fontSize: 13.5, bold: true, color: NAVY, margin: 0 });
    bullets(s, items, x + 0.3, 3.55, 3.15, 2.9, { fontSize: 10.5 });
  }
  reflCol(0.8, "bulb_white.png", "Learnings", [
    "Database triggers enforce business rules more reliably than application code",
    "Full-journey integration tests catch state bugs unit tests miss",
    "Event-driven, logged, swappable-provider design is achievable at student scope"
  ], ICE);
  reflCol(4.78, "warning_white.png", "Limitations", [
    "RLS policies are fully open for the prototype demo",
    "No real authentication yet — single shared admin view",
    "Email delivery is sandboxed without a verified domain"
  ], ICE);
  reflCol(8.76, "rocket_white.png", "Future Scope", [
    "Role-based authentication for staff vs. customer portals",
    "Realtime dashboard updates via Supabase subscriptions",
    "PDF / CSV export of compliance reports"
  ], ICE);
  pageNum(s, 14);
}

// ============================================================
// SLIDE 16 — THANK YOU & Q&A
// ============================================================
{
  const s = newSlide(NAVY);
  iconCircle(s, "plane_white.png", SW / 2, 2.0, 1.3, AMBER, 0.3);
  s.addText("Thank You", { x: 0, y: 3.0, w: SW, h: 1.0, align: "center", fontFace: HEAD, fontSize: 42, bold: true, color: WHITE, margin: 0 });
  s.addText("Airway Bill & Document Tracker — ORBEM Solutions Private Limited", {
    x: 0, y: 4.0, w: SW, h: 0.5, align: "center", fontFace: BODY, fontSize: 15, color: ICE, margin: 0
  });
  s.addText("A fully functional air cargo document-compliance tracker — built, tested, and deployed.", {
    x: 0, y: 4.55, w: SW, h: 0.5, align: "center", fontFace: BODY, fontSize: 13, italic: true, color: AMBER, margin: 0
  });
  s.addText("Questions?", { x: 0, y: 5.5, w: SW, h: 0.5, align: "center", fontFace: BODY, fontSize: 16, bold: true, color: WHITE, margin: 0 });
  s.addText("Akshaya · Rasul Khan · Jason", {
    x: 0, y: SH - 0.7, w: SW, h: 0.4, align: "center", fontFace: BODY, fontSize: 12, color: ICE, margin: 0
  });
}

const outputPath = path.join(__dirname, "..", "Review3_Final_Presentation.pptx");
pres.writeFile({ fileName: outputPath }).then(() => console.log("done"));
