import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";

import { useEffect, useState } from "react";

import stories from "./data/stories";
import "./App.css";


/* =========================================================
   CINEMATIC BACKGROUND
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
   HOME
========================================================= */

function Home() {
  return (
    <>
      <Background />

      <main>

        <section className="home">

          <div className="home-content">

            <p className="home-eyebrow">
              WELCOME TO PRGSTORIES
            </p>

            <h1>
              Stories,
              <br />
              worlds & characters.
            </h1>

            <p className="home-description">
              A collection of stories, characters and worlds
              brought together in one place.
            </p>

            <Link
              to="/stories"
              className="primary-button"
            >
              Browse Stories
            </Link>

          </div>

        </section>


        <section className="home-section">

          <p className="home-eyebrow">
            THE IDEA
          </p>

          <h2>
            A place for stories to live.
          </h2>

          <p>
            prgstories is a growing archive of fictional
            worlds, characters and stories.
          </p>

        </section>


        <section className="home-section">

          <p className="home-eyebrow">
            THE LIBRARY
          </p>

          <h2>
            Explore the stories.
          </h2>

          <Link
            to="/stories"
            className="primary-button"
          >
            Enter Library
          </Link>

        </section>

      </main>
    </>
  );
}


/* =========================================================
   STORIES
========================================================= */

function Stories() {
  return (
    <>
      <Background />

      <main className="stories-page">

        <header className="page-header">

          <p className="home-eyebrow">
            THE LIBRARY
          </p>

          <h1>
            Stories
          </h1>

          <p>
            Explore the worlds, characters and stories
            collected inside prgstories.
          </p>

        </header>


        <div className="story-grid">

          {stories.map((story, index) => (

            <article
              className="story-card"
              key={story.id}
            >

              <div className="story-index">
                {String(index + 1).padStart(2, "0")}
              </div>

              <p className="story-meta">
                {story.genre} · {story.status}
              </p>

              <h2>
                {story.title}
              </h2>

              <p>
                {story.subtitle}
              </p>

              <div className="story-card-meta">

                <span>
                  {story.genre}
                </span>

                <span>
                  {story.status}
                </span>

              </div>

              <br />

              <Link
                to={`/stories/${story.id}`}
                className="primary-button"
              >
                Read Story →
              </Link>

            </article>

          ))}

        </div>

      </main>
    </>
  );
}


/* =========================================================
   STORY
========================================================= */

function Story() {
  const { storyId } = useParams();

  const story = stories.find(
    (item) => item.id === storyId
  );

  const [entering, setEntering] = useState(true);


  useEffect(() => {

    window.scrollTo(0, 0);

    const timer = setTimeout(() => {
      setEntering(false);
    }, 900);

    return () => clearTimeout(timer);

  }, [storyId]);


  if (!story) {

    return (
      <>
        <Background />

        <main className="page">

          <header className="page-header">

            <h1>
              Story not found.
            </h1>

            <Link
              to="/stories"
              className="primary-button"
            >
              Return to Stories
            </Link>

          </header>

        </main>
      </>
    );
  }


  return (
    <>
      <Background />


      {entering && (

        <div className="story-transition">

          <div className="story-transition-title">
            {story.title}
          </div>

        </div>

      )}


      <main className="story-page">


        <header className="story-hero">

          <div className="story-hero-content">

            <Link
              to="/stories"
              className="primary-button"
            >
              ← Back to Stories
            </Link>

            <p className="story-label">
              {story.genre}
            </p>

            <h1 className="story-title">
              {story.title}
            </h1>

            <p className="story-subtitle">
              {story.subtitle}
            </p>

          </div>

        </header>


        <div className="chapters">

          {story.chapters.map(
            (chapter, index) => (

              <section
                className="chapter"
                key={chapter.id}
              >

                <p className="story-label">
                  Chapter{" "}
                  {String(index + 1).padStart(2, "0")}
                </p>

                <h2>
                  {chapter.title}
                </h2>

                <div className="chapter-content">

                  {chapter.content
                    .trim()
                    .split("\n\n")
                    .map(
                      (
                        paragraph,
                        paragraphIndex
                      ) => (

                        <p
                          key={paragraphIndex}
                        >
                          {paragraph}
                        </p>

                      )
                    )}

                </div>

              </section>

            )
          )}

        </div>

      </main>
    </>
  );
}


/* =========================================================
   ABOUT
========================================================= */

function About() {
  return (
    <>
      <Background />

      <main className="about-page">

        <header className="page-header">

          <p className="home-eyebrow">
            ABOUT
          </p>

          <h1>
            prgstories
          </h1>

          <p>
            A home for stories, characters,
            worlds and ideas.
          </p>

        </header>


        <div className="about-content">

          <h2>
            A place for stories to live.
          </h2>

          <p>
            prgstories is a growing archive of fictional
            worlds, characters and stories.
          </p>

        </div>

      </main>
    </>
  );
}


/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <BrowserRouter>

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