import React, { useState } from "react";
import { supabase } from '../lib/supabaseClient'; // <-- 1. IMPORT SUPABASE (check path)

// Nenrin — WhatsApp One-Time Onboarding (Complete, Single-File)
// This component creates a multi-step onboarding flow for a WhatsApp-based service.

// 1) Set your real WhatsApp number in international format (no +, spaces, or dashes)
const WHATSAPP_NUMBER = "6280000000000"; // e.g., 62812xxxxxxx

// 2) Optional QR code image (desktop handoff). Leave blank to hide.
const OPTIONAL_QR_SRC = ""; // e.g., "/qr-nenrin-wa.png"

// ----------------- Brand CSS & Helpers -----------------
// Injects all the necessary brand styles, colors, and fonts into the document head.
const BrandCSS = () => (
  <style>{`
    /* Webfonts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Manrope:wght@600;700&display=swap');

    :root{
      --nenrin-forest:  #1F5E42; /* primary */
      --nenrin-sprout:  #60C689; /* accent (use dark text) */
      --nenrin-bark:    #3A2E2A; /* deep headings */
      --nenrin-mist:    #F4F6F5; /* page background */
      --nenrin-ink:     #0E0F10; /* primary text */
      --nenrin-white:   #FFFFFF;
      --forest-hover:   #1B523A;
      --forest-active:  #184933;
    }

    /* Ensure the root takes full height */
    html, body, #root { height: 100%; }

    .nenrin-font-heading { font-family: "Manrope", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
    .nenrin-font-body { font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }

    /* Button Styles */
    .nenrin-btn-primary{
      background: var(--nenrin-forest);
      color: var(--nenrin-white);
      border: none;
      padding: 10px 16px;
      border-radius: 12px;
      font-weight: 700;
      letter-spacing: .01em;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .nenrin-btn-primary:hover{ background: var(--forest-hover); }
    .nenrin-btn-primary:active{ background: var(--forest-active); }

    .nenrin-btn-accent{
      background: var(--nenrin-sprout);
      color: var(--nenrin-ink);
      border: none;
      padding: 8px 14px;
      border-radius: 12px;
      font-weight: 600;
      letter-spacing: .01em;
      cursor: pointer;
    }

    /* Accessibility Focus Styles */
    .nenrin-focus:focus-visible{ outline: none; box-shadow: 0 0 0 3px rgba(31,94,66,.45); }

    /* Card with blurred background effect */
    .nenrin-card{ background: rgba(255,255,255,0.92); backdrop-filter: blur(6px); border: 1px solid rgba(0,0,0,.06); }

    /* Reduced motion accessibility */
    @media (prefers-reduced-motion: reduce){
      .nenrin-motion{ transition: none !important; animation: none !important; }
    }
  `}</style>
);

// Renders the brand logo with SVG rings and wordmark.
function NenrinLogo({ size = 36 }){
  return (
    <div className="flex items-center gap-2" aria-label="Nenrin logo">
      <svg aria-hidden viewBox="0 0 40 40" width={size} height={size}>
        <circle cx="20" cy="20" r="18" fill="none" stroke="var(--nenrin-forest)" strokeWidth="2"/>
        <circle cx="20" cy="20" r="12" fill="none" stroke="var(--nenrin-forest)" strokeWidth="2" opacity=".6"/>
        <circle cx="20" cy="20" r="6"  fill="none" stroke="var(--nenrin-forest)" strokeWidth="2" opacity=".4"/>
      </svg>
      <div className="leading-none">
        <p className="nenrin-font-heading font-[700] tracking-[.02em]" style={{color:'var(--nenrin-ink)', fontSize:16}}>Nenrin</p>
        <p className="nenrin-font-body text-[11px] opacity-70" style={{color:'var(--nenrin-ink)'}}>calm productivity</p>
      </div>
    </div>
  );
}

// Renders a subtle, decorative background of concentric rings.
function RingsBackground(){
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -left-40 -top-56 h-[1200px] w-[1200px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(31,94,66,0.05) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          opacity: 0.3,
        }}
      />
    </div>
  );
}

// A collection of simple SVG icons used throughout the UI.
const Icon = {
  Check: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${props.className||""}`}><path d="M20 6L9 17l-5-5"/></svg>
  ),
  Pin: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${props.className||""}`}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
  ),
  Brain: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${props.className||""}`}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 9.5 7v0A2.5 2.5 0 0 1 7 4.5v0A2.5 2.5 0 0 1 9.5 2m0 13.5A2.5 2.5 0 0 1 12 18v0a2.5 2.5 0 0 1-2.5 2.5v0A2.5 2.5 0 0 1 7 18v0a2.5 2.5 0 0 1 2.5-2.5m5 0A2.5 2.5 0 0 1 17 18v0a2.5 2.5 0 0 1-2.5 2.5v0A2.5 2.5 0 0 1 12 18v0a2.5 2.5 0 0 1 2.5-2.5m0-13.5A2.5 2.5 0 0 1 17 4.5v0A2.5 2.5 0 0 1 14.5 7v0A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 14.5 2M9 11.5A2.5 2.5 0 0 1 11.5 9h1A2.5 2.5 0 0 1 15 11.5v1A2.5 2.5 0 0 1 12.5 15h-1A2.5 2.5 0 0 1 9 12.5v-1z"/></svg>
  ),
  Calendar: (props: { className?: string }) => (
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${props.className||""}`}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
  ),
  Spark: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${props.className||""}`}><path d="M12 2l1.8 4.8L18 9l-4.2 2.2L12 16l-1.8-4.8L6 9l4.2-2.2L12 2z"/></svg>
  ),
  Globe: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${props.className||""}`}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 18 15.3 15.3 0 0 1-8 0 15.3 15.3 0 0 1 4-18z"></path></svg>
  ),
  Wand: (props: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${props.className||""}`}><path d="M12 2L8 6l4 4-4 4-4 4 4 4 4-4 4 4 4-4-4-4 4-4-4-4-4-4z"/></svg>
  ),
};

// Renders a chat-style bubble for demonstration purposes.
function Bubble({ children, role = "user" }: { children: React.ReactNode, role?: "user" | "nenrin" }){
  const isNenrin = role === "nenrin";
  return (
    <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm mb-2 ${isNenrin ? "self-start" : "self-end"}`}
      style={{ background: isNenrin ? "#E7EFEA" : "#F3F3F3", color: "var(--nenrin-ink)" }}
    >{children}</div>
  );
}

// Renders progress dots for the multi-step flow.
function Dots({ total, index }: { total: number, index: number }){
  return (
    <div className="flex items-center justify-center gap-2 mt-4" aria-label={`Step ${index+1} of ${total}`}>
      {Array.from({length: total}).map((_,i) => (
        <span key={i} className={`h-2 w-2 rounded-full transition-opacity ${i===index?"opacity-100":"opacity-30"}`} style={{background:"var(--nenrin-forest)"}} />
      ))}
    </div>
  );
}

// ----------------- Cards Content -----------------
// An array of objects, each defining the content for one step of the onboarding.
const cards = [
  {
    title: "Welcome to Nenrin",
    body: (
      <>
        <p className="text-[15px] leading-relaxed text-[color:var(--nenrin-ink)]/85">Your personal journal, reminder, to-do list, and assistant—right inside WhatsApp.</p>
        <div className="mt-4 p-3 bg-white/50 rounded-lg text-center">
            <p className="font-semibold text-sm flex items-center justify-center">
                <Icon.Pin className="inline-block mr-2 text-[color:var(--nenrin-forest)]" />
                Pin Nenrin for easy access!
            </p>
        </div>
      </>
    ),
    icon: <Icon.Spark className="text-[color:var(--nenrin-forest)]"/>,
    cta: { label: "Next", intent: "next" },
  },
  {
    title: "Your Second Brain",
    body: (
      <>
        <p className="text-[15px] leading-relaxed">Store information, recall it anytime. Just chat naturally, messy is fine.</p>
        <div className="mt-3 flex flex-col bg-white/50 p-3 rounded-lg">
          <Bubble role="user">Dinda's favorite book is The Hobbit.</Bubble>
          <Bubble role="nenrin">👍 I'll remember that.</Bubble>
          <Bubble role="user">what's dinda's favorite book again?</Bubble>
          <Bubble role="nenrin">It's "The Hobbit"!</Bubble>
        </div>
      </>
    ),
    icon: <Icon.Brain className="text-[color:var(--nenrin-forest)]"/>,
    cta: { label: "Next", intent: "next" },
  },
  {
    title: "Effortless Scheduling",
    body: (
      <>
        <p className="text-[15px] leading-relaxed">Set one-time or recurring reminders with simple language.</p>
        <div className="mt-3 flex flex-col bg-white/50 p-3 rounded-lg">
          <Bubble role="user">remind me to call the vet tomorrow at 2pm</Bubble>
          <Bubble role="nenrin">✅ Reminder set for tomorrow at 2 PM.</Bubble>
          <Bubble role="user">remind me to take out the trash every Tuesday night</Bubble>
          <Bubble role="nenrin">👍 Recurring reminder is set for every Tuesday.</Bubble>
        </div>
      </>
    ),
    icon: <Icon.Calendar className="text-[color:var(--nenrin-forest)]"/>,
    cta: { label: "Next", intent: "next" },
  },
  {
    title: "More Than a To-Do List",
    body: (
      <>
        <p className="text-[15px] leading-relaxed">Get smart suggestions and guidance on your tasks.</p>
        <div className="mt-3 flex flex-col bg-white/50 p-3 rounded-lg">
          <Bubble role="user">todo: buy milk, bread, and eggs</Bubble>
          <Bubble role="nenrin">🛒 Added to your Shopping list.</Bubble>
          <Bubble role="user">I need to plan my trip to Bali</Bubble>
          <Bubble role="nenrin">Great! A good first step is to decide on your budget and travel dates. Want to start there?</Bubble>
        </div>
      </>
    ),
    icon: <Icon.Check className="text-[color:var(--nenrin-forest)]"/>,
    cta: { label: "Next", intent: "next" },
  },
  {
    title: "Always Up-to-Date",
    body: (
      <>
        <p className="text-[15px] leading-relaxed">Connected to the internet to fetch the latest information for you.</p>
        <div className="mt-3 flex flex-col bg-white/50 p-3 rounded-lg">
          <Bubble role="user">what are the top movies in Indonesia right now?</Bubble>
          <Bubble role="nenrin">Currently, "Agak Laen" and "Badarawuhi di Desa Penari" are very popular at the box office.</Bubble>
        </div>
      </>
    ),
    icon: <Icon.Globe className="text-[color:var(--nenrin-forest)]"/>,
    cta: { label: "Next", intent: "next" },
  },
  {
    title: "Your Personal Assistant",
    body: (
      <>
        <p className="text-[15px] leading-relaxed">Set your assistant's personality. Nenrin adapts to your style.</p>
        <div className="mt-3 flex flex-col bg-white/50 p-3 rounded-lg">
          <Bubble role="user">Hey Nenrin, tolong selalu jawab dengan bahasa indonesia, dan pake emoji ya</Bubble>
          <Bubble role="nenrin">Tentu saja! Mulai sekarang, saya akan selalu membalas dalam Bahasa Indonesia dan pakai emoji! Ada yang bisa saya bantu? 😊</Bubble>
        </div>
      </>
    ),
    icon: <Icon.Wand className="text-[color:var(--nenrin-forest)]"/>,
    cta: { label: "Next", intent: "next" },
  },
  {
    title: "Start Calmly",
    body: (
      <>
        <p className="text-[15px] leading-relaxed">Start your rings of progress. We’ll keep things clear and calm.</p>
      </>
    ),
    icon: <Icon.Spark className="text-[color:var(--nenrin-forest)]"/>,
    cta: { label: "Get a Message", intent: "send_welcome" },
    secondary: { label: "Maybe later", intent: "done" }
  }
];

// ----------------- Main Component -----------------
export default function NenrinOnboarding(){
  const [index, setIndex] = useState(0);
  const total = cards.length;
  const step = cards[index];

  // Function to send the initial welcome message via the backend using Supabase invoke
  const sendWelcomeMessage = async () => {
    const phoneNumber = WHATSAPP_NUMBER;
    try {
      console.log('Invoking send-welcome-message function...');
      const { data, error } = await supabase.functions.invoke('send-welcome-message', {
        body: { phone: phoneNumber }
      });

      if (error) {
        console.error('Error invoking function:', error);
      } else {
        console.log('Function invoked successfully:', data);
      }
    } catch (err) {
      console.error('A critical error occurred:', err);
    }
    // Redirect AFTER the function call is attempted
    window.location.href = '/onboarding';
  };

  // Handles actions from buttons (next, send_welcome, done).
  const handleAction = (intent: string) => {
    if (intent === "next") {
      setIndex((i) => Math.min(i + 1, total - 1));
    } else if (intent === "send_welcome") {
      sendWelcomeMessage();
    } else { // This handles the "done" intent from "Maybe later" and "Skip"
      console.log("Onboarding skipped. Redirecting...");
      window.location.href = '/onboarding';
    }
  };

  return (
    <main className="relative min-h-screen w-full nenrin-font-body" style={{ background:"var(--nenrin-mist)", color:"var(--nenrin-ink)" }}>
      <BrandCSS/>
      <RingsBackground/>

      {/* Centering container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="nenrin-onboard-title"
          className="nenrin-motion nenrin-card w-full max-w-md rounded-2xl shadow-xl p-6 sm:p-8"
        >
          {/* Header with logo and skip button */}
          <header className="flex items-center justify-between mb-4">
            <NenrinLogo />
            <button
              className="nenrin-font-body text-sm opacity-70 hover:opacity-100 nenrin-focus px-2 py-1 rounded-md"
              onClick={() => handleAction("done")}
              aria-label="Skip onboarding"
            >Skip</button>
          </header>

          {/* Main card content */}
          <article>
            <div className="flex items-center gap-2 text-[color:var(--nenrin-forest)] mb-1">
              <span>{step.icon}</span>
              <h2 id="nenrin-onboard-title" className="nenrin-font-heading text-[22px] font-[700] tracking-[.02em]">
                {step.title}
              </h2>
            </div>
            <div className="nenrin-font-body text-[15px]">
              {step.body}
            </div>

            <Dots total={total} index={index}/>

            {/* Action buttons */}
            <div className="mt-6 flex items-center gap-3">
              <button
                className="nenrin-btn-primary nenrin-focus rounded-lg"
                onClick={() => handleAction(step.cta.intent)}
              >{step.cta.label}</button>

              {step.secondary && (
                <button
                  className="nenrin-btn-accent nenrin-focus rounded-lg"
                  onClick={() => handleAction(step.secondary.intent)}
                >{step.secondary.label}</button>
              )}

              {index>0 && (
                <button
                  className="ml-auto nenrin-font-body text-sm underline opacity-80 hover:opacity-100 nenrin-focus px-2 py-1 rounded-md"
                  onClick={() => setIndex((i)=> Math.max(0,i-1))}
                >Back</button>
              )}
            </div>

            <p className="mt-4 nenrin-font-body text-xs opacity-70">By continuing you agree to our <a className="underline" href="#" onClick={(e)=>e.preventDefault()}>Terms</a> and <a className="underline" href="#" onClick={(e)=>e.preventDefault()}>Privacy</a>.</p>
          </article>
        </section>
      </div>

      {/* Footer with a debug tip */}
      <footer className="absolute bottom-3 w-full text-center nenrin-font-body text-xs opacity-70">
        Tip: add <code>?debugOnboarding=1</code> to the URL to re-open this flow.
      </footer>
    </main>
  );
}