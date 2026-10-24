import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";

import stories from "./data/stories";
import "./App.css";


function Background() {
  return (
    <div className="background-layer">
      <img
        className="background-image"
        src="/images/ultron.png"
        alt=""
      />

      <video
        className="background-video"
        src="/video/Ultron.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      <div className="background-overlay"></div>
      <div className="background-vignette"></div>
    </div>
  );
}


/* =========================================================
   NAVBAR — menu data
   null href = destination not yet implemented
   ========================================================= */

const NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    panel: [
      { label: "Welcome",        href: "/",                    icon: "house",    description: "Return to the homepage" },
      { label: "Featured Story", href: "/stories/story-one",  icon: "bookmark", description: "Editor's pick" },
      { label: "Latest Updates", href: null,                   icon: "clock",    description: "Recent additions" },
    ],
  },
  {
    id: "stories",
    label: "Stories",
    panel: [
      { label: "All Stories", href: "/stories", icon: "books",     description: "Browse the full catalogue" },
      { label: "Featured",    href: null,        icon: "star",      description: "Highlighted works" },
      { label: "Ongoing",     href: null,        icon: "hourglass", description: "Works in progress" },
      { label: "Completed",   href: null,        icon: "seal",      description: "Finished stories" },
    ],
  },
  {
    id: "about",
    label: "About",
    panel: [
      { label: "About prgstories", href: "/about", icon: "openbook", description: "What this place is" },
      { label: "The Author",       href: null,     icon: "quill",    description: "Who writes here" },
      { label: "Contact",          href: null,     icon: "envelope", description: "Get in touch" },
    ],
  },
];


/* =========================================================
   ICONS — inline SVG path strings, 24-unit coordinate space,
   currentColor stroke, no fill. Keyed by the icon field in NAV_ITEMS.
   ========================================================= */

const ICONS = {
  // arch / house
  house: "M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1v-10.5z M9 22V12h6v10",

  // bookmark ribbon
  bookmark: "M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z",

  // clock face
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",

  // stacked books
  books: "M4 19V7a1 1 0 011-1h4v13H5a1 1 0 01-1-1z M9 6h6a1 1 0 011 1v12H9V6z M15 6h4a1 1 0 011 1v12h-5V6z",

  // five-pointed star
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",

  // hourglass
  hourglass: "M6 2h12M6 22h12 M8 2c0 4 8 6 8 10S8 18 8 22 M16 2c0 4-8 6-8 10s8 6 8 10",

  // seal / checkmark circle
  seal: "M12 22a10 10 0 100-20 10 10 0 000 20z M8 12l3 3 5-6",

  // open book
  openbook: "M2 6a1 1 0 011-1h5a4 4 0 014 4v13a3 3 0 00-3-3H3a1 1 0 01-1-1V6z M22 6a1 1 0 00-1-1h-5a4 4 0 00-4 4v13a3 3 0 013-3h6a1 1 0 001-1V6z",

  // quill pen
  quill: "M20 4C14 4 6 10 4 20c2-2 4-3 6-3 0-4 3-8 10-13z M4 20l4-4",

  // envelope
  envelope: "M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z M3 7l9 6 9-6",
};


/* =========================================================
   RADIAL WHEEL — SVG wedge sector navigation
   ========================================================= */

/**
 * Compute an SVG arc path for one wheel sector.
 *
 * @param {number} cx          - center x
 * @param {number} cy          - center y
 * @param {number} innerR      - inner (hub) radius
 * @param {number} outerR      - outer radius
 * @param {number} startAngle  - start angle in radians
 * @param {number} endAngle    - end angle in radians
 * @returns {string} SVG path d attribute
 */
function sectorPath(cx, cy, innerR, outerR, startAngle, endAngle) {
  const cos = Math.cos;
  const sin = Math.sin;

  // Add a tiny gap (1.5 deg) between sectors for visual separation
  const gap = (1.5 * Math.PI) / 180;
  const s = startAngle + gap / 2;
  const e = endAngle   - gap / 2;

  const x1 = cx + outerR * cos(s);   const y1 = cy + outerR * sin(s);
  const x2 = cx + outerR * cos(e);   const y2 = cy + outerR * sin(e);
  const x3 = cx + innerR * cos(e);   const y3 = cy + innerR * sin(e);
  const x4 = cx + innerR * cos(s);   const y4 = cy + innerR * sin(s);

  const large = (e - s) > Math.PI ? 1 : 0;

  return [
    `M ${x1} ${y1}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

/**
 * Compute the midpoint angle of a sector.
 */
function sectorMid(startAngle, endAngle) {
  return (startAngle + endAngle) / 2;
}

/**
 * Compute centroid position (SVG units) of a sector for icon placement.
 * Uses the geometric centre of the arc band.
 */
function sectorCentroid(cx, cy, innerR, outerR, startAngle, endAngle) {
  const mid  = sectorMid(startAngle, endAngle);
  const r    = (innerR + outerR) / 2;
  return { x: cx + r * Math.cos(mid), y: cy + r * Math.sin(mid) };
}

/**
 * RadialWheel — compact SVG navigation wheel anchored below a navbar trigger.
 *
 * Layering (independent fixed elements, no shared stacking context):
 *   .wheel-dim   — z:90, pointer-events:none  — dims page, never blocks input
 *   .wheel-stage — z:110, pointer-events:none on div/svg root
 *                  pointer-events:all on sector paths, hub, and outer boundary
 *
 * Hit testing: each sector <path> owns its pointer events. Individual sector
 * onPointerLeave does NOT clear hoveredIndex — only the outer-boundary circle's
 * onPointerLeave does, so the label remains stable while the pointer crosses
 * between sectors. The hub clears hoveredIndex (no active sector) but does not
 * close the wheel. The square corners of the SVG bounding box are dead.
 *
 * Props:
 *   item       — NAV_ITEMS entry
 *   anchorPos  — { top, centerX } in viewport px
 *   onNavigate — fn(href)
 *   onClose    — fn()
 *   isClosing  — bool   play exit animation before unmount
 */
function RadialWheel({ item, anchorPos, onNavigate, onClose, isClosing }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const svgRef = useRef(null);

  const sectors = item.panel;
  const count   = sectors.length;

  // ---- Wheel geometry (SVG units) ----
  const SIZE         = 240;
  const CX           = SIZE / 2;   // 120
  const CY           = SIZE / 2;   // 120
  const OUTER_R      = 100;
  const INNER_R      = 42;
  // Icon scale: map 24-unit viewBox into ring width
  const RING_WIDTH   = OUTER_R - INNER_R;                // 58 SVG units
  const ICON_SCALE   = (RING_WIDTH * 0.52) / 24;         // ~1.26 — fits icon in ~51% ring width
  const FULL_ANGLE   = 2 * Math.PI;
  const SLICE        = FULL_ANGLE / count;
  const START_OFFSET = -Math.PI / 2;  // 12 o'clock

  // ---- Position: center wheel below trigger, clamp to viewport ----
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Rendered pixel size matches CSS clamp(176px, 22vw, 232px)
  const WHEEL_PX    = Math.min(232, Math.max(176, vw * 0.22));
  const GAP_PX      = 10;
  const rawLeft     = anchorPos ? anchorPos.centerX - WHEEL_PX / 2 : 0;
  const clampedLeft = Math.max(8, Math.min(rawLeft, vw - WHEEL_PX - 8));
  const rawTop      = anchorPos ? anchorPos.top + GAP_PX : 0;
  const clampedTop  = Math.max(8, Math.min(rawTop, vh - WHEEL_PX - 8));
  // originX: where within the stage the trigger center falls (for grow-from-trigger)
  const originX     = anchorPos ? anchorPos.centerX - clampedLeft : WHEEL_PX / 2;

  // ---- Active index: hover takes priority over keyboard focus ----
  const activeIndex = hoveredIndex !== null ? hoveredIndex : focusedIndex;

  // ---- Hover label position (pixel-space, relative to stage div) ----
  // Placed at OUTER_R + ~14 SVG units outward from sector mid-angle,
  // converted to percentage of WHEEL_PX.
  const LABEL_R_SVG = OUTER_R + 14;
  let hoverLabelStyle = null;
  let hoverLabelText  = null;
  let hoverLabelAlign = "center";

  if (activeIndex !== null) {
    const sec      = sectors[activeIndex];
    const mid      = sectorMid(
      START_OFFSET + activeIndex * SLICE,
      START_OFFSET + (activeIndex + 1) * SLICE,
    );
    // Convert SVG units → % of stage size
    const pct      = WHEEL_PX / SIZE;
    const lx       = (CX + LABEL_R_SVG * Math.cos(mid)) * pct;
    const ly       = (CY + LABEL_R_SVG * Math.sin(mid)) * pct;

    // Alignment: left of centre → right-align, right of centre → left-align
    const cosVal = Math.cos(mid);
    if (cosVal > 0.15)       hoverLabelAlign = "left";
    else if (cosVal < -0.15) hoverLabelAlign = "right";
    else                     hoverLabelAlign = "center";

    // Horizontal room (px) between the label's anchor and the viewport edge,
    // so a long label wraps instead of being clipped.
    const absX = clampedLeft + lx;
    const room = hoverLabelAlign === "left"  ? vw - 8 - absX
               : hoverLabelAlign === "right" ? absX - 8
               : 2 * Math.min(absX - 8, vw - 8 - absX);

    hoverLabelStyle = {
      width:      "max-content",
      maxWidth:   `${Math.max(72, room)}px`,
      whiteSpace: "normal",
      left:      hoverLabelAlign === "right"  ? "auto" : `${lx}px`,
      right:     hoverLabelAlign === "right"  ? `${WHEEL_PX - lx}px` : "auto",
      top:       `${ly}px`,
      textAlign: hoverLabelAlign,
      transform: hoverLabelAlign === "left"   ? "translateY(-50%)"
               : hoverLabelAlign === "right"  ? "translateY(-50%)"
               : "translate(-50%, -50%)",
    };
    hoverLabelText = sec.href ? sec.label : `${sec.label} · soon`;
  }

  // ---- Keyboard navigation (attached to SVG so Tab reaches it) ----
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((p) => (p === null ? 0 : (p + 1) % count));
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((p) => (p === null ? count - 1 : (p - 1 + count) % count));
    }
    if ((e.key === "Enter" || e.key === " ") && focusedIndex !== null) {
      e.preventDefault();
      const sec = sectors[focusedIndex];
      if (sec.href) onNavigate(sec.href);
    }
  }, [count, focusedIndex, sectors, onNavigate, onClose]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ---- Render ----
  return (
    <>
      {/* Dim layer — independent fixed element, pointer-events:none,
          sits at z:90 below .navbar-wrapper (z:100). Never blocks input. */}
      <div
        className={"wheel-dim" + (isClosing ? " wheel-dim-closing" : "")}
        aria-hidden="true"
      />

      {/* Wheel stage — independent fixed element at z:110.
          pointer-events:none on the div so square SVG corners are dead.
          Individual paths and circles set pointer-events:all via CSS / inline. */}
      <div
        className={"wheel-stage" + (isClosing ? " wheel-stage-closing" : "")}
        role="dialog"
        aria-label={`${item.label} navigation wheel`}
        aria-modal="false"
        style={{
          top:               clampedTop,
          left:              clampedLeft,
          "--wheel-originX": `${originX}px`,
          width:             WHEEL_PX,
          height:            WHEEL_PX,
        }}
      >
        <svg
          ref={svgRef}
          className="wheel-svg"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          tabIndex={0}
          aria-label={`${item.label} navigation wheel. Use arrow keys to navigate.`}
          style={{ pointerEvents: "none" }}
        >
          {/* ---- INTERACTIVE GROUP ----
               The transparent bridge circle is the FIRST child, so it sits BENEATH the
               sector paths (SVG paints in document order and the topmost shape gets the
               pointer events). It keeps the wheel one continuous hover region across the
               gaps between wedges. Leaving the whole group is the single place that
               clears hover, so it cannot get stuck even on a fast exit. ---- */}
          <g
            onPointerLeave={(e) => {
              if (e.pointerType === "touch") return;
              setHoveredIndex(null);
            }}
          >
          <circle
            cx={CX} cy={CY} r={OUTER_R + 2}
            fill="transparent"
            stroke="none"
            style={{ pointerEvents: "all", cursor: "default" }}
          />

          {/* ---- SECTOR PATHS (each owns its pointer events) ---- */}
          {sectors.map((sec, i) => {
            const startAngle = START_OFFSET + i * SLICE;
            const endAngle   = startAngle + SLICE;
            const isActive   = i === activeIndex;
            const available  = !!sec.href;
            const isFocused  = focusedIndex === i && hoveredIndex === null;

            return (
              <path
                key={sec.label}
                d={sectorPath(CX, CY, INNER_R, OUTER_R, startAngle, endAngle)}
                className={[
                  "wheel-sector",
                  isActive               ? "wheel-sector-active"     : "",
                  isFocused && !isActive ? "wheel-sector-focused"     : "",
                  !available             ? "wheel-sector-unavailable" : "",
                ].filter(Boolean).join(" ")}
                style={{ "--sector-i": i }}
                tabIndex={available ? 0 : -1}
                role="menuitem"
                aria-label={sec.label + (available ? "" : " (coming soon)")}
                aria-disabled={!available || undefined}
                onPointerEnter={(e) => {
                  if (e.pointerType === "touch") return;
                  setHoveredIndex(i);
                }}
                // No onPointerLeave here — label stays until leaving the ring boundary
                onClick={() => {
                  if (available) onNavigate(sec.href);
                }}
              />
            );
          })}

          </g>

          {/* ---- ICONS — one per sector, pointer-events:none ---- */}
          {sectors.map((sec, i) => {
            const startAngle = START_OFFSET + i * SLICE;
            const endAngle   = startAngle + SLICE;
            const { x, y }   = sectorCentroid(CX, CY, INNER_R, OUTER_R, startAngle, endAngle);
            const iconPath   = ICONS[sec.icon] ?? "";
            const isActive   = i === activeIndex;
            const available  = !!sec.href;

            return (
              <g
                key={sec.label + "-icon"}
                transform={`translate(${x - 12 * ICON_SCALE}, ${y - 12 * ICON_SCALE}) scale(${ICON_SCALE})`}
                className={[
                  "wheel-icon",
                  isActive   ? "wheel-icon-active"      : "",
                  !available ? "wheel-icon-unavailable"  : "",
                ].filter(Boolean).join(" ")}
                style={{ pointerEvents: "none" }}
                aria-hidden="true"
              >
                {/* Split icon path string by 'M' to render multi-segment icons */}
                {iconPath.split(/(?=M)/).filter(Boolean).map((d, di) => (
                  <path
                    key={di}
                    d={d.trim()}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5 / ICON_SCALE}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </g>
            );
          })}

          {/* ---- OUTER RING (decorative, no events) ---- */}
          <circle
            cx={CX} cy={CY} r={OUTER_R + 1}
            className="wheel-outer-ring"
            fill="none"
            style={{ pointerEvents: "none" }}
          />

          {/* ---- HUB — empty, clears active sector but keeps wheel open.
               onClick is intentionally absent so hub clicks do nothing. ---- */}
          <circle
            cx={CX} cy={CY} r={INNER_R}
            className="wheel-hub"
            style={{ pointerEvents: "all" }}
            onPointerEnter={(e) => {
              if (e.pointerType === "touch") return;
              // Clear active sector but do NOT close the wheel
              setHoveredIndex(null);
            }}
          />
        </svg>

        {/* ---- HOVER LABEL — HTML div, one at a time, outside the ring ---- */}
        {activeIndex !== null && hoverLabelStyle && (
          <div
            className="wheel-hover-label"
            aria-hidden="true"
            style={hoverLabelStyle}
          >
            {hoverLabelText}
          </div>
        )}
      </div>
    </>
  );
}


/* =========================================================
   NAVBAR
   ========================================================= */

function Navbar() {
  const [activeId, setActiveId]   = useState(null);
  // visibleId drives rendering; may outlast activeId during close animation
  const [visibleId, setVisibleId] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [anchorPos, setAnchorPos] = useState(null); // {top, centerX}
  const [menuOpen, setMenuOpen]   = useState(false);
  const exitTimer   = useRef(null);  // exit-animation hold (~320 ms)
  const navbarRef   = useRef(null);
  const triggerRefs = useRef({});
  const navigate    = useNavigate();
  const location    = useLocation();

  const activeItem = NAV_ITEMS.find((n) => n.id === visibleId) ?? null;

  // ---- Close helpers ----

  const startClose = useCallback(() => {
    if (exitTimer.current) return; // already mid-exit
    setIsClosing(true);
    exitTimer.current = setTimeout(() => {
      setVisibleId(null);
      setActiveId(null);
      setIsClosing(false);
      exitTimer.current = null;
    }, 320);
  }, []);

  const openWheel = useCallback((id) => {
    // Cancel a mid-exit when switching directly to another item
    if (exitTimer.current) {
      clearTimeout(exitTimer.current);
      exitTimer.current = null;
      setIsClosing(false);
    }
    const el = triggerRefs.current[id];
    if (el) {
      const rect = el.getBoundingClientRect();
      setAnchorPos({
        top:     rect.bottom,
        centerX: rect.left + rect.width / 2,
      });
    }
    setActiveId(id);
    setVisibleId(id);
    setIsClosing(false);
  }, []);

  // ---- Escape ----
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { startClose(); setMenuOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [startClose]);

  // ---- Outside-click (exclude navbar and wheel-stage) ----
  useEffect(() => {
    const onDown = (e) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(e.target) &&
        !e.target.closest(".wheel-stage") &&
        !e.target.closest(".wheel-dim")
      ) {
        startClose();
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [startClose]);

  // ---- Cleanup ----
  useEffect(() => () => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
  }, []);

  // ---- Close wheel and mobile menu on route change (back/forward safe) ----
  useEffect(() => {
    startClose();
    setMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ---- Recalculate anchor position on viewport resize (do not close) ----
  useEffect(() => {
    const onResize = () => {
      if (!activeId) return;
      const el = triggerRefs.current[activeId];
      if (el) {
        const rect = el.getBoundingClientRect();
        setAnchorPos({
          top:     rect.bottom,
          centerX: rect.left + rect.width / 2,
        });
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeId]);

  // ---- Navigate ----
  const handleNavigate = useCallback((hrefOrEvent) => {
    startClose();
    setMenuOpen(false);
    if (typeof hrefOrEvent === "string") navigate(hrefOrEvent);
  }, [navigate, startClose]);

  // ---- Mobile hamburger ----
  const toggleMenu = () => {
    setMenuOpen((prev) => {
      if (prev) startClose();
      return !prev;
    });
  };

  // ---- Render ----
  return (
    <>
      {/* NAVBAR BAR — no wrapper hover handlers.
          Individual triggers handle enter/leave with touch guard. */}
      <div className="navbar-wrapper" ref={navbarRef}>
        <header className="navbar" role="banner">

          <div className="navbar-left">
            <button
              className={`menu-button${menuOpen ? " menu-button-open" : ""}`}
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="nav-mobile-panel"
              onClick={toggleMenu}
            >
              <span></span><span></span><span></span>
            </button>

            <Link to="/" className="logo" onClick={handleNavigate}>
              prgstories
            </Link>
          </div>

          <nav className="nav-links" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                ref={(el) => { triggerRefs.current[item.id] = el; }}
                type="button"
                className={
                  "nav-trigger" +
                  (activeId === item.id ? " nav-trigger-active" : "")
                }
                aria-haspopup="dialog"
                aria-expanded={activeId === item.id}
                onClick={() => {
                  if (activeId === item.id) startClose();
                  else openWheel(item.id);
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

        </header>

        {/* MOBILE PANEL */}
        <div
          className={"nav-mobile-panel" + (menuOpen ? " nav-mobile-panel-open" : "")}
          aria-hidden={!menuOpen}
          id="nav-mobile-panel"
        >
          {NAV_ITEMS.map((item) => (
            <div key={item.id} className="nav-mobile-section">
              <div className="nav-mobile-section-label">{item.label}</div>
              <ul className="nav-mobile-list" role="list">
                {item.panel.map((opt) => (
                  <li key={opt.label} role="listitem">
                    {opt.href ? (
                      <Link
                        to={opt.href}
                        className="nav-mobile-option nav-mobile-option-available"
                        tabIndex={menuOpen ? 0 : -1}
                        onClick={handleNavigate}
                      >
                        {opt.label}
                      </Link>
                    ) : (
                      <span
                        className="nav-mobile-option nav-mobile-option-unavailable"
                        aria-disabled="true"
                        title="Coming soon"
                      >
                        {opt.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* RADIAL WHEEL — rendered as two independent siblings,
          not inside navbar-wrapper, so z-indices are clean. */}
      {activeItem && (
        <RadialWheel
          key={activeItem.id}
          item={activeItem}
          anchorPos={anchorPos}
          isClosing={isClosing}
          onNavigate={handleNavigate}
          onClose={startClose}
        />
      )}
    </>
  );
}


/* =========================================================
   HOME — no three-window system. Temporary placeholder only.
   ========================================================= */

function Home() {
  return (
    <main className="home">

      <div className="home-placeholder">

        <p className="home-placeholder-text">
          Homepage coming soon.
        </p>

      </div>

    </main>
  );
}


/* =========================================================
   STORIES
   ========================================================= */

function Stories() {
  return (
    <main className="stories-page">

      <div className="page-header">

        <div className="home-eyebrow">
          PRGSTORIES
        </div>

        <h1>
          Stories
        </h1>

      </div>


      <div className="story-grid">

        {stories.map((story, index) => (

          <article
            className="story-card"
            key={story.id}
          >

            <div>

              <div className="story-index">
                {String(index + 1).padStart(2, "0")}
              </div>

              <h2>
                {story.title}
              </h2>

              <p>
                {story.description}
              </p>

              <div className="story-meta">
                {story.genre} · {story.status}
              </div>

            </div>


            <div className="story-card-meta">

              <Link
                to={`/stories/${story.id}`}
                className="primary-button"
              >
                Enter Story
              </Link>

            </div>

          </article>

        ))}

      </div>

    </main>
  );
}


/* =========================================================
   STORY READER — the ONLY three-window system in the app
   ========================================================= */

function Story() {
  const { storyId } = useParams();

  const story = stories.find(
    (item) => item.id === storyId
  );

  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [prevStoryId, setPrevStoryId] = useState(storyId);

  if (prevStoryId !== storyId) {
    setPrevStoryId(storyId);
    setActiveChapterIndex(0);
  }

  const scrollTrackRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [storyId]);

  useEffect(() => {
    const track = scrollTrackRef.current;
    const stage = stageRef.current;

    if (!track || !stage) {
      return;
    }

    let ticking = false;

    const updateReveal = () => {
      const rect = track.getBoundingClientRect();

      const scrollableDistance = Math.max(
        1,
        rect.height - window.innerHeight
      );

      const progress = Math.min(
        1,
        Math.max(0, -rect.top / scrollableDistance)
      );

      stage.style.setProperty("--reveal", progress.toFixed(4));

      ticking = false;
    };

    const onScrollOrResize = () => {
      if (!ticking) {
        ticking = true;

        requestAnimationFrame(updateReveal);
      }
    };

    updateReveal();

    window.addEventListener(
      "scroll",
      onScrollOrResize,
      { passive: true }
    );

    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [storyId]);

  if (!story) {
    return (
      <main className="page">

        <div className="home-eyebrow">
          ERROR
        </div>

        <h1>
          Story Not Found
        </h1>

        <Link
          to="/stories"
          className="primary-button"
        >
          Back to Stories
        </Link>

      </main>
    );
  }

  const hasChapters = story.chapters && story.chapters.length > 0;

  const activeChapter = hasChapters
    ? story.chapters[activeChapterIndex] || story.chapters[0]
    : null;


  return (
    <main className="story-reader-page">

      <div
        className="story-reader-scroll-track"
        ref={scrollTrackRef}
      >

        <div className="story-reader-stage-wrapper">

          <div
            className="window-stage"
            ref={stageRef}
            style={{ "--reveal": 0 }}
          >

            {/* LEFT WINDOW — Story info + chapters */}

            <aside className="side-window side-window-left">

              <div className="window-inner reader-info-inner">

                <Link
                  to="/stories"
                  className="back-link"
                >
                  ← Back to Stories
                </Link>

                <div className="reader-story-meta">

                  <div className="reader-story-genres">

                    {(Array.isArray(story.genre)
                      ? story.genre
                      : [story.genre]
                    ).map((genre) => (

                      <span
                        key={genre}
                        className="reader-story-genre"
                      >
                        {genre}
                      </span>

                    ))}

                  </div>

                  <div className="reader-story-status">
                    {story.status}
                  </div>

                </div>
                <h2 className="reader-story-title">
                  {story.title}
                </h2>

                <p className="reader-story-description">
                  {story.description}
                </p>

                <div className="reader-chapter-list-label">
                  Chapters
                </div>

                <div className="reader-chapter-list">

                  {hasChapters ? (

                    story.chapters.map((chapter, index) => (

                      <button
                        key={chapter.id}
                        type="button"
                        className={
                          "reader-chapter-btn" +
                          (index === activeChapterIndex
                            ? " reader-chapter-btn-active"
                            : "")
                        }
                        onClick={() => setActiveChapterIndex(index)}
                      >

                        <span className="reader-chapter-btn-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span className="reader-chapter-btn-title">
                          {chapter.title}
                        </span>

                      </button>

                    ))

                  ) : (

                    <div className="reader-chapter-list-empty">
                      No chapters yet.
                    </div>

                  )}

                </div>

              </div>

            </aside>


        {/* MAIN WINDOW — Reading area (stationary) */}

        <section className="main-window">

          <div className="main-window-mask" aria-hidden="true"></div>

          <div className="main-window-inner reader-main-inner">                {activeChapter ? (

                  <>

                    <div className="chapter-number">
                      Chapter {String(activeChapterIndex + 1).padStart(2, "0")}
                    </div>

                    <h1 className="reader-chapter-title">
                      {activeChapter.title}
                    </h1>

                    <div className="chapter-text">
                      {activeChapter.content}
                    </div>

                  </>

                ) : (

                  <div className="reader-chapter-list-empty">
                    This story has no chapters yet.
                  </div>

                )}

              </div>

            </section>


            {/* RIGHT WINDOW — Comments */}

            <aside className="side-window side-window-right">

              <div className="window-inner reader-comments-inner">

                <div className="window-label">
                  Discussion
                </div>

                <div className="reader-comments-placeholder">

                  <p className="reader-comments-empty">
                    No comments yet. Be the first to share
                    your thoughts on this chapter.
                  </p>

                </div>

                <button
                  type="button"
                  className="primary-button reader-comment-button"
                >
                  Write a Comment
                </button>

              </div>

            </aside>

          </div>

        </div>

      </div>

    </main>
  );
}


/* =========================================================
   ABOUT
   ========================================================= */

function About() {
  return (
    <main className="about-page">

      <div className="page-header">

        <div className="home-eyebrow">
          PRGSTORIES
        </div>

        <h1>
          About
        </h1>

      </div>


      <div className="about-content">

        <p>
          prgstories is a collection of stories,
          characters and worlds brought together
          in one place.
        </p>

      </div>

    </main>
  );
}


/* =========================================================
   APP
   ========================================================= */

function App() {
  return (
    <BrowserRouter>

      <Background />

      <Navbar />

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/stories"
          element={<Stories />}
        />

        <Route
          path="/stories/:storyId"
          element={<Story />}
        />

        <Route
          path="/about"
          element={<About />}
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;