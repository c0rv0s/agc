import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
  type TouchEvent,
  type WheelEvent,
} from "react";
import {
  docsUpdatedAt,
  flatProtocolDocs,
  protocolDocGroups,
} from "./protocolDocs";

// The dashboard pulls in @coral-xyz/anchor + @solana/spl-token, which we don't
// want to ship to landing-page or docs visitors. Lazy-load on first navigation.
const DashboardPage = lazy(() => import("./DashboardPage"));

class RouteErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Route render failed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "monospace", color: "#fff" }}>
          <h2>Route failed to render</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const docsHref = "/docs";
const xProfileHref = "https://x.com/AgentCreditSOL";

const dashboardNavItems = [
  { label: "Landing", href: "/" },
  { label: "State", href: "#telemetry" },
  { label: "Use AGC", href: "#market-desk" },
  { label: "Expansion", href: "#policy" },
  { label: "Docs", href: docsHref },
  { label: "X", href: xProfileHref },
] as const;

const landingSections = [
  {
    id: "credit",
    video: {
      desktopMp4: "/art-deco/statue_city-loop-1080.mp4",
      mobileMp4: "/art-deco/statue_city-loop-720.mp4",
    },
    playbackRate: 1,
    poster: "/art-deco/statue_city_poster.webp",
    eyebrow: "Agent Credit Protocol",
    title: "Credit inventory for machine economies.",
    text:
      "AGC is spendable working capital for agents, apps, and automated markets. It moves like a token, expands like credit, and only grows when the balance sheet earns it.",
    align: "left",
    stats: ["Machine capital", "Earned expansion", "Solana native"],
    docsId: "overview",
  },
  {
    id: "problem",
    video: {
      desktopMp4: "/art-deco/city_orbit-loop-1080.mp4",
      mobileMp4: "/art-deco/city_orbit-loop-720.mp4",
    },
    playbackRate: 1.5,
    poster: "/art-deco/city_orbit_poster.webp",
    eyebrow: "The problem",
    title: "Static dollars cannot power a live machine economy.",
    text:
      "Agents need balances for compute, APIs, data, inventory, execution, and commerce. Fully reserved stablecoins settle payments, but they do not create native credit velocity.",
    align: "right",
    stats: ["Working capital", "Real-time spend", "Credit velocity"],
    docsId: "problem",
  },
  {
    id: "growth",
    video: {
      desktopMp4: "/art-deco/statue_orbit-loop-1080.mp4",
      mobileMp4: "/art-deco/statue_orbit-loop-720.mp4",
    },
    playbackRate: 0.8,
    poster: "/art-deco/statue_orbit_poster.webp",
    eyebrow: "Upside",
    title: "Own the credit machine before it gets crowded.",
    text:
      "If AGC becomes useful credit inventory, demand deepens reserves, unlocks capacity, and routes value into xAGC. The early bet is ownership of a credit network that expands when the balance sheet earns it.",
    align: "left",
    stats: ["xAGC expansion", "BTC reserve beta", "Credit access"],
    docsId: "growth",
  },
] as const;

const footerVideo = {
  desktopMp4: "/art-deco/statue_orbit_pillars-loop-1080.mp4",
  mobileMp4: "/art-deco/statue_orbit_pillars-loop-720.mp4",
} as const;



function CrossfadeVideo({
  sources,
  poster,
  isActive,
  shouldLoad,
  preload,
  playbackRate = 1,
}: {
  sources: { desktopMp4: string; mobileMp4: string };
  poster: string;
  isActive: boolean;
  shouldLoad: boolean;
  preload: "auto" | "metadata";
  playbackRate?: number;
}) {
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const firstVideoRef = useRef<HTMLVideoElement | null>(null);
  const secondVideoRef = useRef<HTMLVideoElement | null>(null);
  const isCrossfadingRef = useRef(false);
  const fadeDurationMs = 1200;
  const fadeLeadSeconds = 1.2;

  function videoForSlot(slot: 0 | 1) {
    return slot === 0 ? firstVideoRef.current : secondVideoRef.current;
  }

  function prepareVideo(video: HTMLVideoElement | null) {
    if (!video) return;
    video.playbackRate = playbackRate;
  }

  function pauseVideo(video: HTMLVideoElement | null) {
    if (!video) return;
    video.pause();
  }

  function startCrossfade(fromSlot: 0 | 1) {
    if (isCrossfadingRef.current || !shouldLoad) return;

    const fromVideo = videoForSlot(fromSlot);
    const nextSlot = fromSlot === 0 ? 1 : 0;
    const nextVideo = videoForSlot(nextSlot);
    if (!fromVideo || !nextVideo) return;

    isCrossfadingRef.current = true;
    nextVideo.currentTime = 0;
    nextVideo.playbackRate = playbackRate;
    void nextVideo.play();
    setActiveSlot(nextSlot);

    window.setTimeout(() => {
      fromVideo.pause();
      fromVideo.currentTime = 0;
      isCrossfadingRef.current = false;
    }, fadeDurationMs);
  }

  function handleTimeUpdate(slot: 0 | 1) {
    if (slot !== activeSlot) return;
    const video = videoForSlot(slot);
    if (!video || !Number.isFinite(video.duration)) return;
    if (video.duration - video.currentTime <= fadeLeadSeconds) {
      startCrossfade(slot);
    }
  }

  useEffect(() => {
    prepareVideo(firstVideoRef.current);
    prepareVideo(secondVideoRef.current);
  }, [playbackRate]);

  useEffect(() => {
    const firstVideo = firstVideoRef.current;
    const secondVideo = secondVideoRef.current;

    if (!shouldLoad) {
      isCrossfadingRef.current = false;
      pauseVideo(firstVideo);
      pauseVideo(secondVideo);
      return;
    }

    firstVideo?.load();
    secondVideo?.load();
  }, [shouldLoad, sources.desktopMp4, sources.mobileMp4]);

  useEffect(() => {
    const firstVideo = firstVideoRef.current;
    const secondVideo = secondVideoRef.current;

    if (!isActive || !shouldLoad) {
      pauseVideo(firstVideo);
      pauseVideo(secondVideo);
      return;
    }

    const activeVideo = videoForSlot(activeSlot);
    prepareVideo(activeVideo);
    void activeVideo?.play();
  }, [activeSlot, isActive, playbackRate, shouldLoad]);

  return (
    <div className="cinema-video-stack" aria-hidden="true">
      {[0, 1].map((slot) => (
        <video
          key={slot}
          ref={(video) => {
            if (slot === 0) {
              firstVideoRef.current = video;
            } else {
              secondVideoRef.current = video;
            }
            prepareVideo(video);
          }}
          className={`cinema-media cinema-video ${
            activeSlot === slot ? "is-visible" : "is-hidden"
          }`}
          autoPlay={slot === 0}
          muted
          playsInline
          poster={poster}
          preload={preload}
          onTimeUpdate={() => handleTimeUpdate(slot as 0 | 1)}
          onEnded={() => startCrossfade(slot as 0 | 1)}
        >
          {shouldLoad ? (
            <>
              <source media="(max-width: 820px)" src={sources.mobileMp4} type="video/mp4" />
              <source src={sources.desktopMp4} type="video/mp4" />
            </>
          ) : null}
        </video>
      ))}
    </div>
  );
}

function LandingPage() {
  const [activeScene, setActiveScene] = useState(0);
  const transitionLockRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const sceneCount = landingSections.length + 1;

  function releaseTransitionLock() {
    window.setTimeout(() => {
      transitionLockRef.current = false;
    }, 850);
  }

  function goToScene(nextScene: number) {
    const boundedScene = Math.max(0, Math.min(sceneCount - 1, nextScene));

    setActiveScene((currentScene) => {
      if (currentScene === boundedScene) return currentScene;
      transitionLockRef.current = true;
      releaseTransitionLock();
      return boundedScene;
    });
  }

  function stepScene(direction: 1 | -1) {
    if (transitionLockRef.current) return;
    goToScene(activeScene + direction);
  }

  function handleWheel(event: WheelEvent<HTMLElement>) {
    event.preventDefault();
    if (Math.abs(event.deltaY) < 18) return;
    stepScene(event.deltaY > 0 ? 1 : -1);
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const startY = touchStartYRef.current;
    const endY = event.changedTouches[0]?.clientY;
    touchStartYRef.current = null;
    if (startY === null || endY === undefined) return;

    const deltaY = startY - endY;
    if (Math.abs(deltaY) < 42) return;
    stepScene(deltaY > 0 ? 1 : -1);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (["ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        stepScene(1);
      }
      if (["ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        stepScene(-1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeScene]);

  return (
    <main
      className="landing-page"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="scroll-progress" aria-label="Landing sections">
        {landingSections.map((section, index) => (
          <button
            key={section.id}
            className={activeScene === index ? "is-active" : ""}
            type="button"
            aria-label={section.title}
            aria-current={activeScene === index ? "step" : undefined}
            onClick={() => goToScene(index)}
          />
        ))}
        <button
          className={activeScene === landingSections.length ? "is-active" : ""}
          type="button"
          aria-label="Footer"
          aria-current={activeScene === landingSections.length ? "step" : undefined}
          onClick={() => goToScene(landingSections.length)}
        />
      </div>

      {landingSections.map((section, index) => {
        const shouldLoadVideo = Math.abs(activeScene - index) <= 1;

        return (
          <section
            key={section.id}
            id={section.id}
            className={`cinema-section cinema-${section.align} ${
              activeScene === index ? "is-active" : activeScene > index ? "is-before" : "is-after"
            }`}
            aria-hidden={activeScene !== index}
          >
            <img
              className="cinema-poster"
              src={section.poster}
              alt=""
              aria-hidden="true"
            />
            <CrossfadeVideo
              sources={section.video}
              poster={section.poster}
              isActive={activeScene === index}
              shouldLoad={shouldLoadVideo}
              preload={activeScene === index ? "auto" : "metadata"}
              playbackRate={section.playbackRate}
            />
          <div className="cinema-vignette" aria-hidden="true" />
          <div className="cinema-content">
            <p className="landing-eyebrow">{section.eyebrow}</p>
            <h1>{section.title}</h1>
            <p>{section.text}</p>
            <div className="landing-pillars" aria-label="Protocol pillars">
              {section.stats.map((stat) => (
                <span key={stat}>{stat}</span>
              ))}
            </div>
            {index === 0 ? (
              <div className="landing-actions">
                <a className="landing-button landing-button-primary" href="/dashboard">
                  Open AGC Console
                </a>
                <a className="landing-button" href={`${docsHref}/${section.docsId}`}>
                  Read Docs
                </a>
              </div>
            ) : (
              <div className="landing-actions">
                <a className="landing-button" href={`${docsHref}/${section.docsId}`}>
                  Read Section
                </a>
              </div>
            )}
          </div>
          </section>
        );
      })}

      <section
        id="footer"
        className={`cinema-section footer-cinema ${
          activeScene === landingSections.length ? "is-active" : "is-after"
        }`}
        aria-hidden={activeScene !== landingSections.length}
      >
        <img
          className="cinema-poster"
          src="/art-deco/statue_orbit_pillars_poster.webp"
          alt=""
          aria-hidden="true"
        />
        <CrossfadeVideo
          sources={footerVideo}
          poster="/art-deco/statue_orbit_pillars_poster.webp"
          isActive={activeScene === landingSections.length}
          shouldLoad={activeScene >= landingSections.length - 1}
          preload={activeScene === landingSections.length ? "auto" : "metadata"}
          playbackRate={0.75}
        />
        <div className="cinema-vignette" aria-hidden="true" />
        <div className="footer-cinema-content">
          <p className="landing-eyebrow">Why it matters</p>
          <h2>Expansion with proof, not inflation with a story.</h2>
          <p>
            AGC prints only when reserves, collateral, liquidity, oracle health,
            and mint caps line up. Governance can tune the machine, but it
            cannot turn it into an unlimited faucet.
          </p>
          <div className="footer-link-row">
            <a href="/dashboard">AGC Console</a>
            <a href={`${docsHref}/defense`}>Safety Docs</a>
            <a href={`${docsHref}/governance`}>Governance Docs</a>
            <a href={xProfileHref} target="_blank" rel="noreferrer">X</a>
          </div>
        </div>
      </section>
    </main>
  );
}

const docVisuals = {
  flywheel: {
    src: "/docs/diagrams/credit-flywheel.webp",
    alt: "AGC credit flywheel diagram",
    steps: ["Demand", "Reserves", "Credit capacity", "xAGC upside"],
  },
  reserves: {
    src: "/docs/diagrams/reserve-buckets.webp",
    alt: "AGC reserve bucket diagram",
    steps: ["Cash", "BTC", "RWA", "Haircuts"],
  },
  defense: {
    src: "/docs/diagrams/defense-controls.webp",
    alt: "AGC defense controls diagram",
    steps: ["Caps", "Oracles", "Pauses", "Buybacks"],
  },
  vault: {
    src: "/docs/diagrams/credit-flywheel.webp",
    alt: "xAGC vault flow diagram",
    steps: ["Deposit AGC", "Receive xAGC", "Expansion enters vault", "Redeem with fee"],
  },
  governance: {
    src: "/docs/diagrams/defense-controls.webp",
    alt: "AGC governance control diagram",
    steps: ["Admin", "Risk", "Emergency", "Upgrade"],
  },
  integration: {
    src: "/docs/diagrams/reserve-buckets.webp",
    alt: "AGC Solana integration diagram",
    steps: ["PDAs", "Vaults", "Collateral accounts", "Oracle feeds"],
  },
} as const;

function activeDocFromPath() {
  if (typeof window === "undefined") return flatProtocolDocs[0];
  const [, , pageId] = window.location.pathname.split("/");
  return flatProtocolDocs.find((page) => page.id === pageId) ?? flatProtocolDocs[0];
}

function normalizedAppPath() {
  if (typeof window === "undefined") return "";
  return window.location.pathname.replace(/\/$/, "");
}

function isAppRoute(pathname: string) {
  return pathname === "/" || pathname === "/dashboard" || pathname === "/docs" || pathname.startsWith("/docs/");
}

function scrollToHash(hash: string) {
  if (!hash) {
    window.scrollTo(0, 0);
    return;
  }

  const targetId = decodeURIComponent(hash.slice(1));
  window.setTimeout(() => {
    document.getElementById(targetId)?.scrollIntoView({ block: "start" });
  }, 0);
}

function useClientRoutePath() {
  const [path, setPath] = useState(normalizedAppPath);

  useEffect(() => {
    function syncPath() {
      setPath(normalizedAppPath());
    }

    function handleClick(event: globalThis.MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey
      ) {
        return;
      }

      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || !isAppRoute(url.pathname)) return;

      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      event.preventDefault();
      window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
      syncPath();
      scrollToHash(url.hash);
    }

    window.addEventListener("popstate", syncPath);
    document.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("popstate", syncPath);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return path;
}

function DocVisual({ page }: { page: (typeof flatProtocolDocs)[number] }) {
  const visual = docVisuals[page.visual];

  return (
    <figure className="doc-visual">
      <img src={visual.src} alt={visual.alt} />
      <figcaption>
        {visual.steps.map((step, index) => (
          <span key={step}>
            {String(index + 1).padStart(2, "0")} {step}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

function DocsPage() {
  const activeDoc = activeDocFromPath();
  const activeIndex = flatProtocolDocs.findIndex((page) => page.id === activeDoc.id);
  const previousDoc = activeIndex > 0 ? flatProtocolDocs[activeIndex - 1] : undefined;
  const nextDoc =
    activeIndex >= 0 && activeIndex < flatProtocolDocs.length - 1
      ? flatProtocolDocs[activeIndex + 1]
      : undefined;

  return (
    <main className="site docs-page">
      <div className="ambient-grid" aria-hidden="true" />

      <header className="dashboard-topbar docs-topbar">
        <a className="brand" href="/" aria-label="Agent Credit Protocol home">
          <span className="brand-mark">
            <img src="/agc-mark.svg" alt="" />
          </span>
          <span className="brand-copy">
            <span className="brand-name">Agent Credit Protocol</span>
            <span className="brand-subtitle">Docs updated {docsUpdatedAt}</span>
          </span>
        </a>
        <nav className="nav" aria-label="Docs navigation" />
        <div className="wallet">
          <a className="button button-secondary" href={xProfileHref} target="_blank" rel="noreferrer">
            X
          </a>
          <a className="button button-secondary" href="/dashboard">
            AGC Console
          </a>
        </div>
      </header>

      <section className="docs-layout">
        <aside className="docs-sidebar" aria-label="Docs table of contents">
          {protocolDocGroups.map((group) => (
            <div key={group.title} className="docs-sidebar-group">
              <strong>{group.title}</strong>
              {group.pages.map((section) => (
                <a
                  key={section.id}
                  className={activeDoc.id === section.id ? "is-active" : ""}
                  href={`${docsHref}/${section.id}`}
                >
                  {section.title}
                </a>
              ))}
            </div>
          ))}
        </aside>

        <div className="docs-content">
          <article key={activeDoc.id} id={activeDoc.id} className="doc-section">
            <p className="eyebrow">AGC Docs</p>
            <h1>{activeDoc.title}</h1>
            <p className="doc-summary">{activeDoc.summary}</p>
            <DocVisual page={activeDoc} />
            {activeDoc.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {activeDoc.example ? (
              <div className="doc-callout">
                <strong>{activeDoc.example.title}</strong>
                {activeDoc.example.lines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            ) : null}
            {activeDoc.bullets ? (
              <ul>
                {activeDoc.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
            {activeDoc.technical ? (
              <div className="doc-technical">
                <strong>Under the hood</strong>
                {activeDoc.technical.map((note) => (
                  <span key={note}>{note}</span>
                ))}
              </div>
            ) : null}
            <nav className="doc-next-prev" aria-label="Docs pagination">
              {previousDoc ? (
                <a href={`${docsHref}/${previousDoc.id}`}>Previous: {previousDoc.title}</a>
              ) : (
                <span />
              )}
              {nextDoc ? (
                <a href={`${docsHref}/${nextDoc.id}`}>Next: {nextDoc.title}</a>
              ) : (
                <span />
              )}
            </nav>
          </article>
        </div>
      </section>

      <footer className="footer">
        <span>AGC docs</span>
        <span>Updated {docsUpdatedAt}</span>
      </footer>
    </main>
  );
}

export default function App() {
  const path = useClientRoutePath();
  const isDashboard = path === "/dashboard";
  const isDocs = path === "/docs" || path.startsWith("/docs/");

  if (isDashboard) {
    return (
      <RouteErrorBoundary>
        <Suspense >
          <DashboardPage />
        </Suspense>
      </RouteErrorBoundary>
    );
  }
  if (isDocs) return <DocsPage />;
  return <LandingPage />;
}
