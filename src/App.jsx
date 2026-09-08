import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";

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

function SideWindow({ side, label }) {
  return (
    <aside className={`side-window side-window-${side}`}>

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

function Home() {
  return (
    <main className="home">

      <div className="window-stage">

        {/* LEFT WINDOW */}

        <SideWindow
          side="left"
          label="LIST 01"
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
        />

      </div>

    </main>
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