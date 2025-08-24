import React, { useEffect, useState } from "react";

// Nenrin — WhatsApp One-Time Onboarding (Complete, Single-File)
// This component creates a multi-step onboarding flow for a WhatsApp-based service.
// It's designed to be shown only once to new users, using localStorage to track completion.

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
      --nenrin-forest:  #1F5E42; /* primary */
      --nenrin-sprout:  #60C689; /* accent (use dark text) */
      --nenrin-bark:    #3A2E2A; /* deep headings */
      --nenrin-mist:    #F4F6F5; /* page background */
      --nenrin-ink:     #0E0F10; /* primary text */
      --nenrin-white:   #FFFFFF;
      --forest-hover:   #1B523A;
      --forest-active:  #184933;
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
        <circle cx="20" cy="20" r="6"  fill="none" stroke="var(--nenrin-forest)" strokeWidth="2" opacity=".4"/>
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
  Check: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${props.className||""}`}><path d="M20 6L9 17l-5-5"/></svg>
  ),
  Pin: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${props.className||""}`}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
  ),
  Timer: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${props.className||""}`}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
  ),
  Bell: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${props.className||""}`}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  ),
  Spark: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${props.className||""}`}><path d="M12 2l1.8 4.8L18 9l-4.2 2.2L12 16l-1.8-4.8L6 9l4.2-2.2L12 2z"/></svg>
  ),
  Mute: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${props.className||""}`}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
  ),
  Chat: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${props.className||""}`}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
  ),
};

// Custom hook to manage the one-time visibility of the onboarding flow.
function useOnlyOnce(key = "nenrin_onboarded"){
  const [dismissed, setDismissed] = useState(true); // Default to true to avoid flash of content
  useEffect(() => {
    // Allows for debugging by adding ?debugOnboarding=1 to the URL
    const url = new URL(window.location.href);
    const debug = url.searchParams.get("debugOnboarding");
    const stored = localStorage.getItem(key);
    if (!stored || debug === "1") {
        setDismissed(false);
    } else {
        setDismissed(true);
    }
  }, [key]);
  
  const complete = () => {
      localStorage.setItem(key, "true");
      // Redirect to dashboard page for new user onboarding
      window.location.href = '/dashboard';
  };
  
  return { dismissed, complete };
}

// Renders a chat-style bubble for demonstration purposes.
function Bubble({ children, role = "user" }){
  const isNenrin = role === "nenrin";
  return (
    <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm mb-2 ${isNenrin ? "self-start" : "self-end"}`}
      style={{ background: isNenrin ? "#E7EFEA" : "#EDEDED", color: "var(--nenrin-ink)" }}
    >{children}</div>
  );
}

// Renders progress dots for the multi-step flow.
function Dots({ total, index }){
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
      <p className="text-[15px] leading-relaxed text-[color:var(--nenrin-ink)]/85">Calm productivity, right inside WhatsApp. We’ll keep this quick.</p>
    ),
    icon: <Icon.Spark className="text-[color:var(--nenrin-forest)]"/>,
    cta: { label: "Next", intent: "next" },
  },
  {
    title: "Just write. Messy is okay.",
    body: (
      <>
        <p className="text-[15px] leading-relaxed">Drop rough thoughts, todos, even a brain dump—Nenrin will help organize.</p>
        <div className="mt-3 flex flex-col bg-white/50 p-3 rounded-lg">
          <Bubble role="user">Remember Dinda's address: Apt B No. 31, behind the dog park. And always use emojis!</Bubble>
          <Bubble role="nenrin">👍 Got it! Dinda's address is saved, and I'll remember to use emojis.</Bubble>
          <Bubble role="user">Meeting with Dinda at 9. also, remind me Fri to submit report</Bubble>
          <Bubble role="nenrin">Okey, I'll remember that. I noticed you set a meeting at 9, should I set the reminder at 7? 🤔</Bubble>
        </div>
      </>
    ),
    icon: <Icon.Check className="text-[color:var(--nenrin-forest)]"/>,
    cta: { label: "Next", intent: "next" },
  },
  {
    title: "Pin the chat",
    body: (
      <>
        <p className="text-[15px] leading-relaxed">Keep Nenrin handy so it’s there when you need it.</p>
        <ul className="mt-3 text-[14px] space-y-2">
          <li className="flex items-start gap-2"><Icon.Pin className="mt-0.5 flex-shrink-0"/> <span><strong>Android:</strong> Open Nenrin → tap <span aria-label="more">⋮</span> → <em>Pin chat</em>.</span></li>
          <li className="flex items-start gap-2"><Icon.Pin className="mt-0.5 flex-shrink-0"/> <span><strong>iOS:</strong> Swipe right on Nenrin → <em>Pin</em>.</span></li>
        </ul>
      </>
    ),
    icon: <Icon.Pin className="text-[color:var(--nenrin-forest)]"/>,
    cta: { label: "Got it", intent: "next" },
  },
  {
    title: "Two Ways to Use Nenrin",
    body: (
      <>
        <p className="text-[15px] leading-relaxed">Choose how you want Nenrin to interact with you.</p>
        <ul className="mt-3 text-[14px] space-y-2">
          <li className="flex items-start gap-2">
            <Icon.Mute className="mt-0.5 flex-shrink-0 text-[color:var(--nenrin-forest)]/70"/>
            <span><strong>Silent Mode:</strong> Only replies and summarizes at specific times you set.</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon.Chat className="mt-0.5 flex-shrink-0 text-[color:var(--nenrin-forest)]/70"/>
            <span><strong>Chat Mode (default):</strong> Always replies to your chat instantly.</span>
          </li>
        </ul>
      </>
    ),
    icon: <Icon.Bell className="text-[color:var(--nenrin-forest)]"/>,
    cta: { label: "Next", intent: "next" },
  },
  {
    title: "Start Calmly",
    body: (
      <>
        <p className="text-[15px] leading-relaxed">Start your rings of progress. We’ll keep things clear and calm.</p>
        {OPTIONAL_QR_SRC ? (
          <div className="mt-4 grid place-items-center">
            <img src={OPTIONAL_QR_SRC} alt="Scan to open Nenrin on WhatsApp" className="h-32 w-32 rounded-lg border border-black/10 shadow-sm" />
          </div>
        ) : null}
      </>
    ),
    icon: <Icon.Spark className="text-[color:var(--nenrin-forest)]"/>,
    cta: { label: "Get a Message", intent: "send_welcome" },
    secondary: { label: "Maybe later", intent: "done" }
  }
];

// ----------------- Main Component -----------------
export default function App(){
  const { dismissed, complete } = useOnlyOnce();
  const [index, setIndex] = useState(0);
  const total = cards.length;
  const step = cards[index];

  // Function to send the initial welcome message via a Supabase function
  const sendWelcomeMessage = async () => {
    const phoneNumber = WHATSAPP_NUMBER;
    try {
      console.log('Sending welcome message to new user:', phoneNumber);
      const response = await fetch('https://heagzwnxlcvpwglyuoyg.supabase.co/functions/v1/send-welcome-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber })
      });
      
      if (!response.ok) {
        console.warn('Failed to send welcome message, but continuing with signup');
      } else {
        console.log('Welcome message sent successfully');
      }
    } catch (error) {
      console.warn('Error sending welcome message:', error, 'but continuing with signup');
    }
    complete(); // Dismiss the modal and redirect
  };

  // Handles actions from buttons (next, send_welcome, done).
  const handleAction = (intent) => {
    if (intent === "next") {
      setIndex((i) => Math.min(i + 1, total - 1));
    } else if (intent === "send_welcome") {
      sendWelcomeMessage();
    } else {
      complete();
    }
  };

  // The component returns null if it has been dismissed, effectively hiding it.
  if (dismissed) return null;

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
              onClick={() => complete()}
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
