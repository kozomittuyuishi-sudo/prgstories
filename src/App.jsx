import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";
import { useState, useRef, useEffect } from "react";

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
   NAVBAR
   ========================================================= */

function Navbar() {
  return (
    <header className="navbar">

      <div className="navbar-left">

        <button
          className="menu-button"
          type="button"
          aria-label="Open menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <Link to="/" className="logo">
          prgstories
        </Link>

      </div>


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