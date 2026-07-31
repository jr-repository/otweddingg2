import { useEffect, useMemo, useRef, useState } from "react";

import { AdminApp } from "@/admin/AdminApp";
import { GuestPassPage } from "@/guest-pass/GuestPassPage";
import { useReveal } from "@/hooks/use-reveal";
import { API_BASE_URL } from "@/lib/config";
import galleryImage1 from "./assets/photos/gallery-photo-06.jpeg";
import galleryImage2 from "./assets/photos/gallery-photo-01.jpeg";
import galleryImage3 from "./assets/photos/gallery-photo-02.jpeg";
import galleryImage4 from "./assets/photos/gallery-photo-05.jpeg";
import galleryImage5 from "./assets/photos/gallery-photo-03.jpeg";
import galleryImage6 from "./assets/photos/gallery-photo-04.jpeg";
import galleryImage7 from "./assets/photos/gallery-photo-07.jpeg";
import galleryImage8 from "./assets/photos/gallery-photo-08.jpeg";
import heroPhoto from "./assets/photos/hero-photo.png";
import storyPhoto from "./assets/photos/our-story-photo.png";

const HERO = heroPhoto;
const STORY = storyPhoto;
const RSVP_IMG =
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=80";
const CLOSING =
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=2000&q=80";
const BACKSOUND_SRC = "/i-love-you.mp3";

type GuestPassInfo = {
  guestCode: string;
  passUrl: string;
  qrCodeDataUrl: string;
};

type DashboardRecord = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  attending: "yes" | "no";
  attendingLabel: string;
  guestsLabel: string;
  eventsLabel: string;
  submittedAtLabel: string;
};

type DashboardSummary = {
  totalResponses: number;
  attendingYes: number;
  attendingNo: number;
  confirmedSeats: number;
  latestSubmittedAt: string | null;
};

const GALLERY: { src: string; alt: string; description: string; span?: string }[] = [
  {
    src: galleryImage1,
    alt: "Romantic portrait of the couple from the latest gallery set",
    description: "A playful portrait filled with warmth and ease.",
    span: "md:col-span-2 md:row-span-2",
  },
  {
    src: galleryImage2,
    alt: "Candid outdoor moment from the latest gallery set",
    description: "Quiet affection captured in a candid little pause.",
  },
  {
    src: galleryImage3,
    alt: "Warm candid portrait from the latest gallery set",
    description: "Joyful energy and effortless chemistry together.",
  },
  {
    src: galleryImage4,
    alt: "Elegant standing portrait from the latest gallery set",
    description: "A tender frame that feels intimate and timeless.",
  },
  {
    src: galleryImage8,
    alt: "Soft portrait from the latest gallery set",
    description: "A sweet, surprised moment held in soft light.",
  },
  {
    src: galleryImage5,
    alt: "Wide romantic composition from the latest gallery set",
    description: "Laughter and closeness in a beautifully honest moment.",
    span: "md:col-span-2",
  },
  {
    src: galleryImage6,
    alt: "Relaxed portrait from the latest gallery set",
    description: "A gentle embrace that feels calm and reassuring.",
  },
  {
    src: galleryImage7,
    alt: "Timeless portrait from the latest gallery set",
    description: "A sparkling little detail from a cherished memory.",
  },
];

function Monogram({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-serif tracking-[0.25em] text-[0.72rem] uppercase text-charcoal ${className}`}
    >
      L <span className="text-champagne">&</span> A
    </span>
  );
}

function Hairline({ className = "" }: { className?: string }) {
  return <span className={`hairline ${className}`} aria-hidden="true" />;
}

export default function App() {
  useReveal();

  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
    return <AdminApp />;
  }

  if (pathname.startsWith("/guest-pass/")) {
    const guestCode = pathname.split("/guest-pass/")[1] ?? "";
    return <GuestPassPage guestCode={decodeURIComponent(guestCode)} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-champagne/40">
      <BackgroundMusic />
      <Header />
      <Hero />
      <Welcome />
      <Story />
      <Details />
      <Gallery />
      <Rsvp />
      <Closing />
      <Footer />
    </div>
  );
}

function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.38;

    const tryPlay = async () => {
      try {
        await audio.play();
        setHasStarted(true);
      } catch {}
    };

    void tryPlay();

    const activateOnInteraction = () => {
      if (hasStarted) return;
      void tryPlay();
    };

    window.addEventListener("pointerdown", activateOnInteraction, { passive: true });
    window.addEventListener("touchstart", activateOnInteraction, { passive: true });
    window.addEventListener("keydown", activateOnInteraction);
    window.addEventListener("scroll", activateOnInteraction, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", activateOnInteraction);
      window.removeEventListener("touchstart", activateOnInteraction);
      window.removeEventListener("keydown", activateOnInteraction);
      window.removeEventListener("scroll", activateOnInteraction);
    };
  }, [hasStarted]);

  return (
    <audio ref={audioRef} src={BACKSOUND_SRC} loop preload="auto" />
  );
}

function ReportDashboard() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [records, setRecords] = useState<DashboardRecord[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalResponses: 0,
    attendingYes: 0,
    attendingNo: 0,
    confirmedSeats: 0,
    latestSubmittedAt: null,
  });
  const [generatedAt, setGeneratedAt] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/api/rsvps`);
        const payload = (await response.json()) as {
          summary: DashboardSummary;
          records: DashboardRecord[];
          generatedAt?: { date?: string };
        };

        if (!response.ok) {
          throw new Error("Unable to load RSVP report.");
        }

        if (cancelled) return;

        setSummary(payload.summary);
        setRecords(payload.records);
        setGeneratedAt(
          payload.generatedAt?.date
            ? new Date(payload.generatedAt.date).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : new Date().toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              }),
        );
      } catch (caughtError) {
        if (cancelled) return;
        setError(
          caughtError instanceof Error ? caughtError.message : "Unable to load RSVP report.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRecords = records.filter((record) => {
    const haystack = [
      record.fullName,
      record.email,
      record.phone,
      record.attendingLabel,
      record.submittedAtLabel,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[28px] border border-[rgba(200,182,153,0.45)] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,250,245,0.92))] p-6 shadow-[0_28px_80px_-38px_rgba(64,48,37,0.28)] md:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.38em] text-taupe">
                Wedding RSVP Report
              </p>
              <h1 className="mt-4 font-serif text-4xl leading-none text-charcoal md:text-6xl">
                Invitation Dashboard
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                All RSVP responses are collected here with the same calm, premium visual language as
                the invitation experience.
              </p>
              <p className="mt-4 text-[0.72rem] uppercase tracking-[0.24em] text-taupe">
                Generated {generatedAt || "just now"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={`${API_BASE_URL}/reports/rsvp/excel`}
                className="inline-flex items-center justify-center rounded-full bg-charcoal px-5 py-3 text-[0.72rem] font-medium uppercase tracking-[0.28em] text-ivory transition-colors hover:bg-charcoal/90"
              >
                Export Excel
              </a>
              <a
                href={`${API_BASE_URL}/reports/rsvp/pdf`}
                className="inline-flex items-center justify-center rounded-full border border-champagne/40 bg-transparent px-5 py-3 text-[0.72rem] font-medium uppercase tracking-[0.28em] text-charcoal transition-colors hover:bg-cream"
              >
                Export PDF
              </a>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Responses" value={summary.totalResponses} />
          <SummaryCard label="Attending" value={summary.attendingYes} />
          <SummaryCard label="Unable to Attend" value={summary.attendingNo} />
          <SummaryCard label="Confirmed Seats" value={summary.confirmedSeats} />
        </section>

        <section className="mt-6 overflow-hidden rounded-[28px] border border-[rgba(200,182,153,0.45)] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,250,245,0.92))] p-6 shadow-[0_28px_80px_-38px_rgba(64,48,37,0.22)] md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.38em] text-taupe">
                Guest Responses
              </p>
              <h2 className="mt-3 font-serif text-3xl text-charcoal md:text-4xl">RSVP Table</h2>
            </div>
            <label className="block lg:w-[320px]">
              <span className="mb-2 block text-[0.68rem] font-medium uppercase tracking-[0.22em] text-taupe">
                Search
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, phone"
                className="block w-full rounded-[12px] border border-border bg-background px-4 py-3 text-sm text-charcoal outline-none transition-colors focus:border-champagne focus:ring-2 focus:ring-champagne/25"
              />
            </label>
          </div>

          {error && <p className="mt-6 text-sm text-destructive">{error}</p>}
          {loading && <p className="mt-6 text-sm text-muted-foreground">Loading RSVP data…</p>}

          {!loading && !error && (
            <div className="mt-6 overflow-hidden rounded-[22px] border border-champagne/20">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-charcoal text-left text-[0.68rem] uppercase tracking-[0.2em] text-ivory">
                      <th className="px-5 py-4 font-medium">Submitted</th>
                      <th className="px-5 py-4 font-medium">Guest Name</th>
                      <th className="px-5 py-4 font-medium">Email</th>
                      <th className="px-5 py-4 font-medium">Phone</th>
                      <th className="px-5 py-4 font-medium">Attendance</th>
                      <th className="px-5 py-4 font-medium">Guests</th>
                      <th className="px-5 py-4 font-medium">Events</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-10 text-center text-sm text-muted-foreground"
                        >
                          No RSVP records match this view yet.
                        </td>
                      </tr>
                    )}
                    {filteredRecords.map((record, index) => (
                      <tr
                        key={record.id}
                        className={index % 2 === 0 ? "bg-white/70" : "bg-cream/35"}
                      >
                        <td className="border-t border-champagne/15 px-5 py-4 text-sm text-muted-foreground">
                          {record.submittedAtLabel}
                        </td>
                        <td className="border-t border-champagne/15 px-5 py-4 text-sm text-charcoal">
                          {record.fullName}
                        </td>
                        <td className="border-t border-champagne/15 px-5 py-4 text-sm text-muted-foreground">
                          {record.email}
                        </td>
                        <td className="border-t border-champagne/15 px-5 py-4 text-sm text-muted-foreground">
                          {record.phone || "-"}
                        </td>
                        <td className="border-t border-champagne/15 px-5 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.18em] ${
                              record.attending === "yes"
                                ? "bg-champagne/25 text-charcoal"
                                : "bg-taupe/12 text-taupe"
                            }`}
                          >
                            {record.attendingLabel}
                          </span>
                        </td>
                        <td className="border-t border-champagne/15 px-5 py-4 text-sm text-charcoal">
                          {record.guestsLabel}
                        </td>
                        <td className="border-t border-champagne/15 px-5 py-4 text-sm text-muted-foreground">
                          {record.eventsLabel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-[22px] border border-[rgba(200,182,153,0.36)] bg-white/80 p-5 shadow-[0_18px_44px_-36px_rgba(63,47,37,0.28)]">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-taupe">{label}</p>
      <p className="mt-3 font-serif text-5xl leading-none text-charcoal">{value}</p>
    </article>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#story", label: "Story" },
    // { href: "#gallery", label: "Gallery" },
    { href: "#rsvp", label: "RSVP", highlight: true },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled ? "bg-ivory/85 backdrop-blur-md border-b border-border/70" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
        <a href="#top" className="flex items-center gap-2">
          <span
            className={`font-serif text-xl tracking-[0.28em] transition-colors ${
              scrolled ? "text-charcoal" : "text-ivory"
            }`}
          >
            L <span className="text-champagne">&</span> A
          </span>
        </a>
        <ul className="flex items-center gap-6 md:gap-10">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={`relative inline-flex items-center justify-center text-[0.72rem] font-medium uppercase tracking-[0.25em] transition-colors hover:text-champagne ${
                  scrolled ? "text-charcoal" : "text-ivory/90"
                }`}
              >
                <span className="relative z-[1]">{link.label}</span>
                {link.highlight && (
                  <span
                    aria-hidden="true"
                    className="nav-rsvp-line absolute -bottom-1.5 left-1/2 h-px w-9 -translate-x-1/2 bg-current"
                  />
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      <img
        src={HERO}
        alt="Elegant candlelit wedding venue at dusk"
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/50 via-charcoal/30 to-charcoal/70" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-ivory">
        <p
          data-reveal
          className="reveal text-[0.72rem] font-medium uppercase tracking-[0.4em] text-ivory/85"
        >
          Save the Date
        </p>
        <Hairline className="my-6 !bg-ivory/70" />
        <h1
          data-reveal
          data-reveal-delay="120"
          className="reveal font-serif text-[3rem] leading-[1.02] tracking-tight sm:text-[4.5rem] md:text-[6rem] lg:text-[7.25rem]"
        >
          Luis Meraz
          <span className="my-2 block text-champagne italic font-light sm:mx-4 sm:my-0 sm:inline-block sm:align-middle">
            &amp;
          </span>
          Angel Mayjesty
        </h1>
        <div
          data-reveal
          data-reveal-delay="260"
          className="reveal mt-8 flex flex-col items-center gap-2"
        >
          <p className="font-serif text-lg italic text-ivory/90 md:text-xl">23 — 24 April 2027</p>
          <p className="text-[0.7rem] uppercase tracking-[0.35em] text-ivory/75">
            Jakarta, Indonesia
          </p>
        </div>
      </div>
      <a
        href="#welcome"
        aria-label="Scroll to next section"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-ivory/80"
      >
        <span className="scroll-dot block h-10 w-px bg-ivory/60" />
      </a>
    </section>
  );
}

function Welcome() {
  return (
    <section id="welcome" className="bg-background px-6 py-28 md:py-36">
      <div className="mx-auto max-w-2xl text-center">
        <div data-reveal className="reveal">
          <Monogram />
        </div>
        <div data-reveal data-reveal-delay="120" className="reveal mt-6 flex justify-center">
          <Hairline />
        </div>
        <h2
          data-reveal
          data-reveal-delay="200"
          className="reveal mt-8 font-serif text-3xl leading-tight text-charcoal md:text-5xl"
        >
          We're so excited to celebrate our wedding with you.
        </h2>
        <p
          data-reveal
          data-reveal-delay="320"
          className="reveal mt-6 text-base leading-relaxed text-muted-foreground md:text-lg"
        >
          Before we send the official invitation,{" "}
          <a
            href="#rsvp"
            className="relative inline-block italic text-charcoal transition-colors hover:text-champagne"
          >
            <span>we&apos;d love to know if you&apos;re likely to attend.</span>
            <span
              aria-hidden="true"
              className="nav-rsvp-line absolute -bottom-1.5 left-1/2 h-px w-16 -translate-x-1/2 bg-current"
            />
          </a>
        </p>
      </div>
    </section>
  );
}

function Story() {
  return (
    <section id="story" className="bg-cream px-6 py-28 md:py-36">
      <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2 md:gap-20">
        <div data-reveal className="reveal order-2 md:order-1">
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.35em] text-taupe">
            Our Story
          </p>
          <Hairline className="mt-6" />
          <h2 className="mt-6 font-serif text-4xl leading-tight text-charcoal md:text-5xl">
            A quiet beginning,
            <br />a lifelong promise.
          </h2>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            <p>
              Some stories begin unexpectedly, grow beautifully, and eventually lead to a promise of
              forever.
            </p>
            <p>
              As we prepare for this meaningful new chapter, we would be honored to celebrate it
              with the people who have been part of our journey.
            </p>
          </div>
        </div>
        <div data-reveal data-reveal-delay="160" className="reveal order-1 md:order-2">
          <div className="relative overflow-hidden rounded-lg shadow-[0_20px_60px_-30px_rgba(50,40,30,0.35)]">
            <img
              src={STORY}
              alt="Bride and groom walking hand in hand through soft afternoon light"
              className="aspect-[4/5] w-full object-cover brightness-[0.64] contrast-[1.14] saturate-[0.7] sepia-[0.16] drop-shadow-[0_24px_42px_rgba(40,29,22,0.28)]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-charcoal/40 via-charcoal/18 to-charcoal/48" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_28%,rgba(37,30,24,0.3)_100%)] mix-blend-multiply" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(199,168,120,0.1),transparent_38%,rgba(32,26,22,0.18))]" />
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <div className="max-w-[16rem] text-ivory md:max-w-[18rem]">
                <p className="text-[0.64rem] font-medium uppercase tracking-[0.38em] text-ivory/78">
                  Our Promise
                </p>
                <p className="mt-4 font-serif text-2xl leading-tight italic text-ivory/92 md:text-3xl">
                  Every forever begins with a single touch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Details() {
  const items = [
    {
      label: "Holy Matrimony",
      title: "Friday, 23 April 2027",
      sub: "08:30 AM",
      note: "Jakarta Cathedral Church",
      extra: "Jakarta, Indonesia",
    },
    {
      label: "Syukuran",
      title: "Saturday, 24 April 2027",
      sub: "Jakarta, Indonesia",
      note: "Full address and event time will be updated soon",
      extra: "Details to follow",
    },
  ];

  return (
    <section className="bg-background px-6 py-28 md:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <div data-reveal className="reveal flex justify-center">
            <Hairline />
          </div>
          <h2
            data-reveal
            data-reveal-delay="120"
            className="reveal mt-6 font-serif text-3xl text-charcoal md:text-5xl"
          >
            Wedding Details
          </h2>
        </div>
        <div data-reveal data-reveal-delay="120" className="reveal mt-14 md:mt-20">
          <div className="relative overflow-hidden rounded-[28px] border border-[rgba(200,182,153,0.45)] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,250,245,0.92))] px-6 py-8 shadow-[0_28px_80px_-38px_rgba(64,48,37,0.28)] backdrop-blur-sm md:px-10 md:py-12">
            <div className="absolute left-5 top-5 h-10 w-10 rounded-tl-[20px] border-l border-t border-champagne/45 md:left-7 md:top-7" />
            <div className="absolute right-5 top-5 h-10 w-10 rounded-tr-[20px] border-r border-t border-champagne/45 md:right-7 md:top-7" />
            <div className="absolute bottom-5 left-5 h-10 w-10 rounded-bl-[20px] border-b border-l border-champagne/45 md:bottom-7 md:left-7" />
            <div className="absolute bottom-5 right-5 h-10 w-10 rounded-br-[20px] border-b border-r border-champagne/45 md:bottom-7 md:right-7" />
            <div className="absolute inset-x-12 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(214,190,152,0.18),transparent_72%)]" />
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <p className="text-[0.66rem] font-medium uppercase tracking-[0.42em] text-taupe/95">
                  Save This Chapter
                </p>
                <p className="mt-4 max-w-2xl font-serif text-xl italic leading-relaxed text-charcoal/88 md:text-2xl">
                  An intimate celebration designed with quiet elegance, warm details, and timeless
                  moments.
                </p>
              </div>

              <div className="mt-8 grid gap-0 rounded-[22px] border border-champagne/20 bg-[linear-gradient(180deg,rgba(248,243,235,0.52),rgba(255,255,255,0.76))] md:mt-10 md:grid-cols-2">
                {items.map((item, index) => (
                  <article
                    key={item.label}
                    className={[
                      "relative flex min-h-[220px] flex-col items-center justify-center px-5 py-8 text-center sm:min-h-[240px] sm:px-8 sm:py-10 md:min-h-[290px] md:px-10",
                      index !== items.length - 1 ? "border-b border-champagne/18 md:border-b-0 md:border-r" : "",
                    ].join(" ")}
                  >
                    <span className="absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(201,170,129,0.55),transparent)]" />
                    <span className="absolute inset-x-10 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(201,170,129,0.3),transparent)]" />
                    <p className="text-[0.68rem] font-medium uppercase tracking-[0.42em] text-taupe">
                      {item.label}
                    </p>
                    <div className="mt-5 h-px w-16 bg-champagne/70" />
                    <h3 className="mt-6 whitespace-normal font-serif text-[1.9rem] leading-tight text-charcoal sm:text-[2.15rem] md:whitespace-nowrap md:text-[2.6rem] md:leading-none">
                      {item.title}
                    </h3>
                    <p className="mt-4 whitespace-normal text-[0.98rem] leading-relaxed text-taupe sm:text-base md:whitespace-nowrap md:text-[1.12rem] md:leading-normal">
                      {item.sub}
                    </p>
                    <p className="mt-6 max-w-[18rem] whitespace-normal text-[0.56rem] uppercase leading-[1.7] tracking-[0.16em] text-muted-foreground sm:text-[0.6rem] sm:tracking-[0.2em] md:max-w-none md:whitespace-nowrap md:text-[0.62rem] md:leading-normal md:tracking-[0.24em]">
                      {item.note}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-taupe md:text-[0.98rem]">
                      {item.extra}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center text-center md:mt-10">
                <Hairline />
                <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  The official invitation, venue address, and complete event details will be shared
                  approximately 3 months before the wedding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [desktopSlide, setDesktopSlide] = useState(0);
  const [mobileSlide, setMobileSlide] = useState(0);

  useEffect(() => {
    const desktopTimer = window.setInterval(() => {
      setDesktopSlide((current) => (current + 1) % GALLERY.length);
    }, 3600);

    const mobileTimer = window.setInterval(() => {
      setMobileSlide((current) => (current + 1) % 4);
    }, 3400);

    return () => {
      window.clearInterval(desktopTimer);
      window.clearInterval(mobileTimer);
    };
  }, []);

  useEffect(() => {
    if (lightbox === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowRight") {
        setLightbox((index) => (index === null ? index : (index + 1) % GALLERY.length));
      }
      if (event.key === "ArrowLeft") {
        setLightbox((index) =>
          index === null ? index : (index - 1 + GALLERY.length) % GALLERY.length,
        );
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  return (
    <section id="gallery" className="bg-cream px-6 py-28 md:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p
            data-reveal
            className="reveal text-[0.72rem] font-medium uppercase tracking-[0.35em] text-taupe"
          >
            Moments
          </p>
          <div data-reveal data-reveal-delay="100" className="reveal mt-5 flex justify-center">
            <Hairline />
          </div>
          <h2
            data-reveal
            data-reveal-delay="180"
            className="reveal mt-6 font-serif text-3xl text-charcoal md:text-5xl"
          >
            A quiet gallery
          </h2>
        </div>

        <div className="mt-14 md:hidden">
          <button
            type="button"
            onClick={() => setLightbox(mobileSlide)}
            data-reveal
            className="reveal group relative block aspect-[4/5] w-full overflow-hidden rounded-md shadow-[0_18px_44px_-28px_rgba(58,44,34,0.42)]"
          >
            <img
              src={GALLERY[mobileSlide].src}
              alt={GALLERY[mobileSlide].alt}
              loading="lazy"
              className="h-full w-full object-cover brightness-[0.82] contrast-[1.08] saturate-[0.86] sepia-[0.12] transition-transform duration-[900ms] ease-out group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-b from-charcoal/8 via-transparent to-charcoal/72" />
            <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(198,168,128,0.08),transparent_45%,rgba(31,25,22,0.12))]" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-left text-ivory">
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.34em] text-ivory/78">
                Gallery Highlight
              </p>
              <p className="mt-2 max-w-[15rem] font-serif text-lg leading-snug text-ivory">
                {GALLERY[mobileSlide].description}
              </p>
              <div className="mt-4 flex gap-2">
                {GALLERY.slice(0, 4).map((image, index) => (
                  <span
                    key={image.src}
                    className={`h-1.5 rounded-full transition-all ${
                      mobileSlide === index ? "w-7 bg-ivory" : "w-2 bg-ivory/45"
                    }`}
                  />
                ))}
              </div>
            </div>
          </button>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {GALLERY.slice(4).map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setLightbox(index + 4)}
                data-reveal
                data-reveal-delay={String((index % 2) * 100)}
                className="reveal group relative overflow-hidden rounded-md shadow-[0_18px_44px_-28px_rgba(58,44,34,0.42)]"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover brightness-[0.82] contrast-[1.08] saturate-[0.86] sepia-[0.12] transition-transform duration-[900ms] ease-out group-hover:scale-105 group-hover:brightness-[0.78]"
                />
                <span className="absolute inset-0 bg-gradient-to-b from-charcoal/16 via-transparent to-charcoal/18 opacity-90" />
                <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(198,168,128,0.08),transparent_45%,rgba(31,25,22,0.12))]" />
                <span className="absolute inset-0 bg-charcoal/0 transition-colors duration-500 group-hover:bg-charcoal/10" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-20 hidden auto-rows-[220px] grid-cols-4 gap-4 md:grid">
          <button
            type="button"
            onClick={() => setLightbox(desktopSlide)}
            data-reveal
            className="reveal group relative overflow-hidden rounded-md shadow-[0_18px_44px_-28px_rgba(58,44,34,0.42)] md:col-span-2 md:row-span-2"
          >
            <img
              src={GALLERY[desktopSlide].src}
              alt={GALLERY[desktopSlide].alt}
              loading="lazy"
              className="h-full w-full object-cover brightness-[0.82] contrast-[1.08] saturate-[0.86] sepia-[0.12] transition-transform duration-[900ms] ease-out group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-b from-charcoal/10 via-transparent to-charcoal/72 opacity-95" />
            <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(198,168,128,0.08),transparent_45%,rgba(31,25,22,0.12))]" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-left text-ivory">
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.36em] text-ivory/78">
                Slideshow Moment
              </p>
              <p className="mt-3 max-w-[24rem] font-serif text-2xl leading-snug text-ivory">
                {GALLERY[desktopSlide].description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {GALLERY.map((image, index) => (
                  <span
                    key={image.src}
                    className={`h-1.5 rounded-full transition-all ${
                      desktopSlide === index ? "w-8 bg-ivory" : "w-2 bg-ivory/45"
                    }`}
                  />
                ))}
              </div>
            </div>
          </button>

          {GALLERY.slice(1).map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setLightbox(index + 1)}
              data-reveal
              data-reveal-delay={String((index % 4) * 100)}
              className={`reveal group relative overflow-hidden rounded-md shadow-[0_18px_44px_-28px_rgba(58,44,34,0.42)] ${
                index === 4 ? "md:col-span-2" : ""
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className="h-full w-full object-cover brightness-[0.82] contrast-[1.08] saturate-[0.86] sepia-[0.12] drop-shadow-[0_18px_32px_rgba(54,40,31,0.22)] transition-transform duration-[900ms] ease-out group-hover:scale-105 group-hover:brightness-[0.78]"
              />
              <span className="absolute inset-0 bg-gradient-to-b from-charcoal/16 via-transparent to-charcoal/18 opacity-90" />
              <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(198,168,128,0.08),transparent_45%,rgba(31,25,22,0.12))]" />
              <span className="absolute inset-0 bg-charcoal/0 transition-colors duration-500 group-hover:bg-charcoal/10" />
            </button>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/85 px-4 py-8"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setLightbox(null)}
            className="absolute right-6 top-6 text-sm uppercase tracking-[0.3em] text-ivory/90 hover:text-champagne"
          >
            Close
          </button>
          <img
            src={GALLERY[lightbox].src}
            alt={GALLERY[lightbox].alt}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[85vh] max-w-[92vw] rounded-md object-contain shadow-2xl"
          />
        </div>
      )}
    </section>
  );
}

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  attending: "yes" | "no" | "";
  guests: "1" | "2" | "";
  events: string[];
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  attending: "",
  guests: "",
  events: [],
};

function Rsvp() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<"yes" | "no" | null>(null);
  const [guestPass, setGuestPass] = useState<GuestPassInfo | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string>("");

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitMessage("");
  };

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) next.firstName = "Please enter your first name.";
    if (!form.lastName.trim()) next.lastName = "Please enter your last name.";
    if (!form.phone.trim()) {
      next.phone = "Please enter your WhatsApp number.";
    } else if (form.phone.replace(/\D/g, "").length < 6) {
      next.phone = "Please enter a valid phone number.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Please enter a valid email address.";
    }
    if (!form.attending) next.attending = "Please let us know if you can attend.";
    if (form.attending === "yes" && !form.guests) {
      next.guests = "Please select how many guests.";
    }
    if (form.attending === "yes" && form.events.length === 0) {
      next.events = "Please choose at least one event.";
    }
    setErrors(next);

    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email,
          attending: form.attending,
          guests: form.attending === "yes" ? form.guests : null,
          events: form.attending === "yes" ? form.events : [],
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        errors?: Partial<Record<keyof FormState | "firstName", string>>;
        guestPass?: GuestPassInfo | null;
      };

      if (!response.ok) {
        if (payload.errors) {
          setErrors((current) => ({
            ...current,
            firstName: payload.errors.firstName ?? current.firstName,
            lastName: payload.errors.lastName ?? current.lastName,
            phone: payload.errors.phone ?? current.phone,
            email: payload.errors.email ?? current.email,
            attending: payload.errors.attending ?? current.attending,
            guests: payload.errors.guests ?? current.guests,
            events: payload.errors.events ?? current.events,
          }));
        }
        throw new Error(payload.message ?? "Unable to send your RSVP right now.");
      }

      setConfirmation(form.attending as "yes" | "no");
      setGuestPass(payload.guestPass ?? null);
      setSubmitMessage(
        form.attending === "yes"
          ? "Thank you for your confirmation! We’re so excited to celebrate with you."
          : "Thank you for letting us know. We truly appreciate your response and hope to celebrate with you another time.",
      );
    } catch (error) {
      setSubmitMessage(
        error instanceof Error ? error.message : "Unable to send your RSVP right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const closeConfirm = () => {
    setConfirmation(null);
    setGuestPass(null);
    setForm(initialForm);
    setErrors({});
  };

  return (
    <section id="rsvp" className="bg-background px-6 py-28 md:py-36">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-lg border border-border bg-card shadow-[0_20px_60px_-30px_rgba(50,40,30,0.25)] md:grid-cols-2">
        <div className="relative hidden md:block">
          <img
            src={RSVP_IMG}
            alt="Handwritten place card resting on ivory linen"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="px-6 py-12 md:px-12 md:py-16">
          <div data-reveal className="reveal">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.35em] text-taupe">
              Kindly Respond
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-charcoal md:text-4xl">
              Will you join us?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              A preliminary response helps us plan. The full invitation follows.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-10 space-y-5"
            data-reveal
            data-reveal-delay="120"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First Name" required error={errors.firstName} htmlFor="firstName">
                <input
                  id="firstName"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(event) => update("firstName", event.target.value)}
                  className={inputCls(Boolean(errors.firstName))}
                />
              </Field>
              <Field label="Last Name" required error={errors.lastName} htmlFor="lastName">
                <input
                  id="lastName"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={(event) => update("lastName", event.target.value)}
                  className={inputCls(Boolean(errors.lastName))}
                />
              </Field>
            </div>
            <Field label="WhatsApp Number" required error={errors.phone} htmlFor="phone">
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                className={inputCls(Boolean(errors.phone))}
              />
            </Field>
            <Field label="Email Address" required error={errors.email} htmlFor="email">
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                className={inputCls(Boolean(errors.email))}
              />
            </Field>

            <fieldset className="pt-2">
              <legend className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-taupe sm:text-[0.72rem] sm:tracking-[0.25em]">
                Will you likely attend our wedding?
              </legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <RadioCard
                  name="attending"
                  value="yes"
                  checked={form.attending === "yes"}
                  onChange={() => update("attending", "yes")}
                  title="Yes, I'll be there!"
                  subtitle="Save my place"
                />
                <RadioCard
                  name="attending"
                  value="no"
                  checked={form.attending === "no"}
                  onChange={() => {
                    update("attending", "no");
                    update("guests", "");
                    update("events", []);
                  }}
                  title="Sorry, I can't attend"
                  subtitle="Sending love from afar"
                />
              </div>
              {errors.attending && (
                <p className="mt-2 text-xs text-destructive">{errors.attending}</p>
              )}
            </fieldset>

            {form.attending === "yes" && (
              <fieldset className="animate-in fade-in duration-500 pt-2">
                <legend className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-taupe sm:text-[0.72rem] sm:tracking-[0.25em]">
                  How many guests will attend? (including yourself)
                </legend>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {(["1", "2"] as const).map((guestCount) => (
                    <RadioCard
                      key={guestCount}
                      name="guests"
                      value={guestCount}
                      checked={form.guests === guestCount}
                      onChange={() => update("guests", guestCount)}
                      title={`${guestCount} Guest${guestCount === "2" ? "s" : ""}`}
                      subtitle={guestCount === "1" ? "Just me" : "Me and one guest"}
                      compact
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Children under 12 years old are not permitted. Teenagers are welcome, but they
                  should complete a separate RSVP together with their parents.
                </p>
                {errors.guests && <p className="mt-2 text-xs text-destructive">{errors.guests}</p>}
              </fieldset>
            )}

            {form.attending === "yes" && (
              <fieldset className="animate-in fade-in duration-500 pt-2">
                <legend className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-taupe sm:text-[0.72rem] sm:tracking-[0.25em]">
                  Which event(s) will you attend?
                </legend>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { value: "holy_matrimony", label: "Holy Matrimony" },
                    { value: "syukuran", label: "Syukuran" },
                  ].map((eventOption) => (
                    <CheckboxCard
                      key={eventOption.value}
                      checked={form.events.includes(eventOption.value)}
                      onToggle={() =>
                        update(
                          "events",
                          form.events.includes(eventOption.value)
                            ? form.events.filter((item) => item !== eventOption.value)
                            : [...form.events, eventOption.value],
                        )
                      }
                      title={eventOption.label}
                    />
                  ))}
                </div>
                {errors.events && <p className="mt-2 text-xs text-destructive">{errors.events}</p>}
              </fieldset>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="group inline-flex w-full items-center justify-center gap-3 rounded-[6px] bg-charcoal px-8 py-4 text-[0.72rem] font-medium uppercase tracking-[0.3em] text-ivory transition-all hover:bg-charcoal/90 disabled:opacity-60 sm:w-auto"
              >
                {submitting ? "Sending…" : "Submit RSVP"}
                {!submitting && (
                  <span className="inline-block h-px w-6 bg-champagne transition-all group-hover:w-10" />
                )}
              </button>
              <p className="mt-4 text-xs text-muted-foreground">
                Your information will only be used for wedding planning and communication.
              </p>
              {submitMessage && <p className="mt-3 text-sm text-taupe">{submitMessage}</p>}
            </div>
          </form>
        </div>
      </div>

      {confirmation && <ConfirmModal type={confirmation} guestPass={guestPass} onClose={closeConfirm} />}
    </section>
  );
}

function inputCls(hasError: boolean) {
  return [
    "block w-full rounded-[6px] border bg-background px-3 py-2.5 text-[0.95rem] text-charcoal outline-none transition-colors sm:px-4 sm:py-3 sm:text-base",
    "placeholder:text-muted-foreground/70",
    "focus:border-champagne focus:ring-2 focus:ring-champagne/25",
    hasError ? "border-destructive/70" : "border-border",
  ].join(" ");
}

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[0.62rem] font-medium uppercase tracking-[0.18em] text-taupe sm:mb-2 sm:text-[0.7rem] sm:tracking-[0.25em]"
      >
        {label}
        {required && <span className="ml-1 text-champagne">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function RadioCard({
  name,
  value,
  checked,
  onChange,
  title,
  subtitle,
  compact,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <label
      className={[
        "relative flex cursor-pointer items-center gap-3 rounded-[6px] border bg-card transition-all",
        compact ? "px-4 py-3" : "px-5 py-4",
        checked
          ? "border-champagne shadow-[0_0_0_1px_var(--color-champagne)]"
          : "border-border hover:border-taupe/50",
      ].join(" ")}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        aria-hidden
        className={[
          "grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-all",
          checked ? "border-champagne" : "border-border",
        ].join(" ")}
      >
        <span
          className={`h-2 w-2 rounded-full bg-champagne transition-opacity ${
            checked ? "opacity-100" : "opacity-0"
          }`}
        />
      </span>
      <span className="min-w-0">
        <span className="block font-serif text-lg leading-tight text-charcoal">{title}</span>
        {subtitle && <span className="block text-xs text-muted-foreground">{subtitle}</span>}
      </span>
    </label>
  );
}

function CheckboxCard({
  checked,
  onToggle,
  title,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
}) {
  return (
    <label
      className={[
        "relative flex cursor-pointer items-center gap-3 rounded-[6px] border bg-card px-5 py-4 transition-all",
        checked
          ? "border-champagne shadow-[0_0_0_1px_var(--color-champagne)]"
          : "border-border hover:border-taupe/50",
      ].join(" ")}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
      <span
        aria-hidden
        className={[
          "grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border transition-all",
          checked ? "border-champagne bg-champagne/15" : "border-border",
        ].join(" ")}
      >
        <span
          className={`h-2 w-2 rounded-[2px] bg-champagne transition-opacity ${
            checked ? "opacity-100" : "opacity-0"
          }`}
        />
      </span>
      <span className="block font-serif text-lg leading-tight text-charcoal">{title}</span>
    </label>
  );
}

function ConfirmModal({
  type,
  guestPass,
  onClose,
}: {
  type: "yes" | "no";
  guestPass: GuestPassInfo | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const content = useMemo(
    () =>
      type === "yes"
        ? {
            title: "Thank you for your confirmation! 🤍",
            body: "We’re so excited to celebrate with you. The official invitation, venue address, and complete event details will be shared approximately 3 months before the wedding.",
          }
        : {
            title: "Thank you for letting us know",
            body: "We truly appreciate your response and hope to celebrate with you another time. 🤍",
          },
    [type],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 px-4 py-8"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-xl rounded-[18px] border border-border bg-card p-8 text-center shadow-2xl md:p-10"
      >
        <div className="flex justify-center">
          <Monogram />
        </div>
        <div className="mt-5 flex justify-center">
          <Hairline />
        </div>
        <h3
          id="confirm-title"
          className="mt-6 font-serif text-2xl leading-tight text-charcoal md:text-3xl"
        >
          {content.title}
        </h3>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
          {content.body}
        </p>
        {type === "yes" && guestPass && (
          <div className="mt-6 rounded-[18px] border border-[rgba(200,182,153,0.28)] bg-cream/40 p-5">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.26em] text-taupe">
              Your Guest Pass
            </p>
            <img
              src={guestPass.qrCodeDataUrl}
              alt="Guest QR code"
              className="mx-auto mt-4 w-full max-w-[220px] rounded-[16px] border border-[rgba(200,182,153,0.24)] bg-white p-3"
            />
            <p className="mt-4 text-[0.7rem] uppercase tracking-[0.24em] text-taupe">
              Guest Code {guestPass.guestCode}
            </p>
            <a
              href={guestPass.passUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-charcoal px-5 py-3 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-ivory transition-colors hover:bg-charcoal/92"
            >
              Open Guest Pass
            </a>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-8 inline-flex items-center gap-3 rounded-[6px] border border-charcoal px-6 py-3 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-charcoal transition-colors hover:bg-charcoal hover:text-ivory"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Closing() {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src={CLOSING}
        alt="Chandeliers illuminating an intimate ballroom at night"
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-charcoal/70" />
      <div className="relative mx-auto max-w-3xl px-6 py-32 text-center text-ivory md:py-44">
        <div data-reveal className="reveal flex justify-center">
          <Hairline className="!bg-ivory/70" />
        </div>
        <h2
          data-reveal
          data-reveal-delay="120"
          className="reveal mt-8 font-serif text-4xl leading-tight md:text-6xl"
        >
          Luis <span className="font-light italic text-champagne">&amp;</span> Angel Mayjesty
        </h2>
        <p
          data-reveal
          data-reveal-delay="220"
          className="reveal mt-6 text-[0.72rem] uppercase tracking-[0.4em] text-ivory/85"
        >
          23 — 24 April 2027 · Jakarta, Indonesia
        </p>
        <p
          data-reveal
          data-reveal-delay="320"
          className="reveal mt-8 font-serif text-xl italic text-ivory/90 md:text-2xl"
        >
          "We can't wait to celebrate with you."
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-background px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3">
        <Monogram />
        <p className="text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground">
          Jakarta · 2027
        </p>
      </div>
    </footer>
  );
}
