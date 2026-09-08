import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";

import { useRef, useState, useEffect, useCallback } from "react";

import stories from "./data/stories";
import "./App.css";


/* =========================================================
   BACKGROUND
   ========================================================= */

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
   NAVBAR
   ========================================================= */

function Navbar() {
  return (
    <header className="navbar">

      <Link
        to="/"
        className="logo"
      >
        prgstories
      </Link>


      <nav className="nav-links">

        <Link to="/">
          Home
        </Link>

        <Link to="/stories">
          Stories
        </Link>

        <Link to="/about">
          About
        </Link>

      </nav>

    </header>
  );
}


/* =========================================================
   SIDE WINDOW
   ========================================================= */

/*
  scrollProgress: 0 = initial hidden-behind-main state
                  1 = final fully-expanded state (matches existing design)
*/
function SideWindow({ side, label, scrollProgress }) {
  /*
    At progress = 0:
      Left  window: translateX( +HideAmount) — shoved right, behind main
      Right window: translateX( -HideAmount) — shoved left, behind main

    At progress = 1:
      translateX( 0 ) — natural CSS position, matches existing design

    The hide amount (in px) needs to push the panel so it sits behind the
    main window.  We use a CSS custom property --hide-tx set inline and
    read in the transform rule so there is never a transform conflict.

    rotateY also interpolates:
      Left:  10deg * progress  (0 → 10deg)
      Right: -10deg * progress (0 → -10deg)

    The existing CSS `left` / `right` properties position the panel
    geometrically; we do NOT change those.  We only layer on a translateX
    and rotateY via the inline style property.
  */

  // Amount to shift panels inward at progress = 0.
  // We pick a generous value that guarantees they are behind the main window
  // across all desktop viewport sizes.  On mobile the animation is disabled.
  const HIDE_TX_PX = 260; // px — roughly side-width + window-gap

  const p = scrollProgress;  // 0 → 1

  const sign = side === "left" ? 1 : -1;  // left shifts right (+), right shifts left (-)

  // translateX interpolation: from ±HIDE_TX_PX down to 0
  const tx = sign * HIDE_TX_PX * (1 - p);

  // rotateY interpolation: from 0 to ±10deg
  const ry = sign * 10 * p;

  // Opacity: fade in from 0.12 to 1 during the first 40% of the scroll
  const opacity = Math.min(1, 0.12 + p * (1 / 0.6));

  // z-index: start below main (z-index 3 is natural), keep at 3 throughout.
  // Main window has z-index 5, so side windows start visually behind it.
  // No z-index change needed.

  const style = {
    "--sw-tx": `${tx}px`,
    "--sw-ry": `${ry}deg`,
    "--sw-opacity": opacity,
    // During active scroll, suppress all transitions so the rAF-driven
    // transform is never lagged by the CSS 0.45s ease transition.
    // At p=0 and p=1 the CSS transition can apply normally (hover, etc.)
    transition: p > 0 && p < 1
      ? "none"
      : undefined,
  };

  return (
    <aside
      className={`side-window side-window-${side} side-window-animated`}
      style={style}
    >

      <div className="side-window-inner">

        <div className="window-label">
          {label}
        </div>


        <div className="window-lines">

          <div className="window-line"></div>
          <div className="window-line"></div>
          <div className="window-line"></div>
          <div className="window-line"></div>
          <div className="window-line"></div>

        </div>

      </div>

    </aside>
  );
}


/* =========================================================
   HOME
   ========================================================= */

/*
  Scroll strategy:
  - .home-scroll-container is position:relative with height 300vh.
    This gives the scroll room to travel while the viewport content is "pinned".
  - .home-sticky-inner is position:sticky, top:0, height:100vh.
    It stays locked at the top of the viewport for the full 200vh of scroll travel.
  - We read scrollTop of the container (or window scroll offset relative to the
    container top) to derive a 0→1 progress value.

  Mobile (<=800px): layout is already stacked. We skip the animation and
  pass scrollProgress=1 so panels are shown in their final (natural) state.

  prefers-reduced-motion: same — skip animation, pass progress=1.
*/

function Home() {
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Detect mobile or reduced-motion preference once on mount.
  const skipAnimation = useRef(false);

  useEffect(() => {
    const mq800 = window.matchMedia("(max-width: 800px)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const checkSkip = () => {
      skipAnimation.current = mq800.matches || mqMotion.matches;
      if (skipAnimation.current) {
        setScrollProgress(1);
      }
    };

    checkSkip();
    mq800.addEventListener("change", checkSkip);
    mqMotion.addEventListener("change", checkSkip);

    return () => {
      mq800.removeEventListener("change", checkSkip);
      mqMotion.removeEventListener("change", checkSkip);
    };
  }, []);

  const updateProgress = useCallback(() => {
    rafRef.current = null;

    if (skipAnimation.current) {
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    /*
      Use scrollY + offsetTop so progress is exactly 0 when the page
      first loads regardless of where the container sits in the document
      (below navbar, etc.).

      scrollTravel = containerHeight - viewportHeight
        = 300vh - 100vh = 200vh of usable scroll distance

      progress = (scrollY - containerTop) / scrollTravel
      clamped to [0, 1]
    */

    const viewportH = window.innerHeight;
    const containerTop = el.offsetTop;          // distance from doc top to container
    const containerH   = el.offsetHeight;       // 300vh in px
    const scrollTravel = containerH - viewportH; // 200vh in px

    if (scrollTravel <= 0) {
      setScrollProgress(1);
      return;
    }

    const scrolled = window.scrollY - containerTop;
    const raw      = scrolled / scrollTravel;
    const clamped  = Math.max(0, Math.min(1, raw));

    setScrollProgress(clamped);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    // Run once on mount so initial state is correct
    updateProgress();

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateProgress]);

  return (
    /*
      .home-scroll-container: tall relative container (300vh).
      Gives the browser scroll room while the sticky inner stays visible.
    */
    <div
      className="home-scroll-container"
      ref={containerRef}
    >

      {/* Sticky inner: stays pinned for the full scroll duration */}
      <div className="home-sticky-inner">

        <main className="home">

          <div className="window-stage">

            {/* LEFT WINDOW */}
            <SideWindow
              side="left"
              label="LIST 01"
              scrollProgress={scrollProgress}
            />


            {/* MAIN WINDOW */}
            <section className="main-window">

              <div className="main-window-inner">
                {/* Main content will be added later */}
              </div>

            </section>


            {/* RIGHT WINDOW */}
            <SideWindow
              side="right"
              label="LIST 02"
              scrollProgress={scrollProgress}
            />

          </div>

        </main>

      </div>

    </div>
  );
}


/* =========================================================
   STORIES PAGE
   ========================================================= */

function Stories() {
  return (
    <main className="stories-page">

      <header className="page-header">

        <div className="home-eyebrow">
          PRGSTORIES
        </div>

        <h1>
          Stories
        </h1>

      </header>


      <section className="story-grid">

        {stories.map((story, index) => (

          <article
            className="story-card"
            key={story.id}
          >

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

      </section>

    </main>
  );
}


/* =========================================================
   STORY PAGE
   ========================================================= */

function Story() {
  const { storyId } = useParams();

  const story = stories.find(
    (item) => item.id === storyId
  );


  if (!story) {
    return (
      <main className="page not-found">

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


  return (
    <main className="story-page">

      <section className="story-hero">

        <div className="story-hero-content">

          <Link
            to="/stories"
            className="back-link"
          >
            ← Back to Stories
          </Link>


          <div className="story-label">
            {story.genre} · {story.status}
          </div>


          <h1 className="story-title">
            {story.title}
          </h1>


          <p className="story-subtitle">
            {story.subtitle}
          </p>

        </div>

      </section>


      <section className="chapters">

        {story.chapters.map((chapter, index) => (

          <article
            className="chapter"
            key={chapter.id}
          >

            <div className="chapter-content">

              <div className="chapter-number">
                Chapter {String(index + 1).padStart(2, "0")}
              </div>


              <h2>
                {chapter.title}
              </h2>


              <div className="chapter-text">
                {chapter.content}
              </div>

            </div>

          </article>

        ))}

      </section>

    </main>
  );
}


/* =========================================================
   ABOUT
   ========================================================= */

function About() {
  return (
    <main className="about-page">

      <header className="page-header">

        <div className="home-eyebrow">
          PRGSTORIES
        </div>

        <h1>
          About
        </h1>

      </header>


      <section className="about-content">

        <p>
          prgstories is a collection of stories,
          characters and worlds brought together
          in one place.
        </p>

      </section>

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
