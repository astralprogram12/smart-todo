import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

/**
 * Nenrin — First Dashboard (Functionless, WhatsApp Guide)
 * ------------------------------------------------------------------
 * Purpose: A calm, on-brand landing dashboard that nudges users to use WhatsApp.
 * - Home: curated recommendations with prefilled WhatsApp messages
 * - Brand tokens, logo, accessible contrast, subtle ring background
 * - Primary CTA opens WhatsApp (replace number below)
 *
 * Drop-in: render <App /> in your site app shell.
 */

// 1) Set your WhatsApp number (international format, no + or spaces)
const WHATSAPP_NUMBER = "6280000000000"; // e.g., 62812xxxxxxx

// ----------------- Brand CSS -----------------
const BrandCSS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Manrope:wght@600;700&display=swap');
    @import url('https://cdn.tailwindcss.com');

    :root{
      --nenrin-forest:#1A4A35; /* darker primary for better contrast */
      --nenrin-forest-light:#2A7A5A; /* enhanced hover */
      --nenrin-sprout:#4FB36B; /* slightly darker for better contrast */
      --nenrin-sprout-light:#6BC584; /* accent light */
      --nenrin-bark:#2A1F1C;   /* darker for better contrast */
      --nenrin-mist:#F8FAF9;   /* lighter page background */
      --nenrin-ink:#0A0B0C;    /* darker primary text */
      --nenrin-white:#FFFFFF;
      --forest-hover:#164A32;
      --forest-active:#12432B;
      --nenrin-gold:#B8941F; /* darker gold for better contrast */
      --nenrin-sage:#7A9B6E; /* darker complementary green */
      --nenrin-text-light:#4A5A52; /* better contrast for secondary text */
      
      /* Wooden ring theme colors */
      --wood-light:#D4A574;
      --wood-medium:#B8956A;
      --wood-dark:#A0825C;
      --wood-grain:#8B6F47;
      --wood-bark:#6B5437;
    }

    html, body, #root { 
      height: 100%; 
      background: linear-gradient(135deg, var(--nenrin-mist) 0%, #F2F6F4 100%);
      color: var(--nenrin-ink); 
    }

    .nenrin-font-heading { font-family: "Manrope", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
    .nenrin-font-body { font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }

    /* Enhanced Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes floatAnimation {
      0%, 100% {
        transform: translateY(0px) rotate(0deg);
      }
      33% {
        transform: translateY(-10px) rotate(1deg);
      }
      66% {
        transform: translateY(-5px) rotate(-0.5deg);
      }
    }

    @keyframes breathe {
      0%, 100% {
        opacity: 0.4;
        transform: scale(1);
      }
      50% {
        opacity: 0.6;
        transform: scale(1.02);
      }
    }

    @keyframes sparkle {
      0%, 100% {
        transform: rotate(0deg) scale(1);
        opacity: 0.8;
      }
      25% {
        transform: rotate(90deg) scale(1.1);
        opacity: 1;
      }
      50% {
        transform: rotate(180deg) scale(0.9);
        opacity: 0.9;
      }
      75% {
        transform: rotate(270deg) scale(1.05);
        opacity: 1;
      }
    }

    @keyframes ripple {
      0% {
        transform: scale(0.8);
        opacity: 1;
      }
      100% {
        transform: scale(2.4);
        opacity: 0;
      }
    }

    /* Enhanced Components */
    .animate-fadeInUp {
      animation: fadeInUp 0.8s ease-out forwards;
    }

    .animate-fadeInScale {
      animation: fadeInScale 0.6s ease-out forwards;
    }

    .animate-float {
      animation: floatAnimation 6s ease-in-out infinite;
    }

    .animate-breathe {
      animation: breathe 4s ease-in-out infinite;
    }

    .animate-sparkle {
      animation: sparkle 3s ease-in-out infinite;
    }

    .btn-primary{
      background: linear-gradient(135deg, var(--nenrin-forest) 0%, var(--nenrin-forest-light) 100%);
      color: var(--nenrin-white);
      border: none; padding: 12px 20px; border-radius: 14px;
      font-weight: 700; letter-spacing:.01em; cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(31, 94, 66, 0.2);
    }
    .btn-primary:hover{ 
      background: linear-gradient(135deg, var(--forest-hover) 0%, var(--nenrin-forest) 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(31, 94, 66, 0.3);
    }
    .btn-primary:active{ 
      background: linear-gradient(135deg, var(--forest-active) 0%, var(--forest-hover) 100%);
      transform: translateY(0);
    }

    .btn-primary::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      transition: width 0.6s, height 0.6s;
      transform: translate(-50%, -50%);
      z-index: 0;
    }

    .btn-primary:active::before {
      width: 300px;
      height: 300px;
    }

    .btn-accent{ 
      background: linear-gradient(135deg, var(--nenrin-sprout) 0%, var(--nenrin-sprout-light) 100%);
      color: var(--nenrin-ink); 
      border: none; padding: 10px 16px; border-radius: 12px; 
      font-weight: 600; cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 10px rgba(96, 198, 137, 0.2);
    }
    .btn-accent:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(96, 198, 137, 0.3);
    }

    .focusable:focus-visible{ 
      outline: none; 
      box-shadow: 0 0 0 3px rgba(31,94,66,.45), 0 0 20px rgba(31,94,66,.2); 
    }

    .chip{ 
      display:inline-flex; align-items:center; gap:6px; padding:6px 12px; 
      border-radius:999px; font: 600 12px/1 "Inter", system-ui; 
      background: linear-gradient(135deg, #E8F3EC 0%, #F1F8F4 100%);
      color:var(--nenrin-forest);
      border: 1px solid rgba(26, 74, 53, 0.15);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .chip::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(79, 179, 107, 0.2), transparent);
      transition: left 0.5s ease;
    }

    .chip:hover::before {
      left: 100%;
    }

    .card{ 
      background: rgba(255,255,255,.98); 
      border:1px solid rgba(26, 74, 53, 0.12); 
      border-radius:20px; 
      padding:20px;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--nenrin-sprout), var(--nenrin-forest), var(--nenrin-gold));
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .card:hover::before {
      opacity: 1;
    }

    .card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(26, 74, 53, 0.15);
      border-color: rgba(26, 74, 53, 0.18);
    }

    .suggestion-card {
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .suggestion-card:hover {
      transform: translateY(-10px) scale(1.02);
      box-shadow: 0 25px 50px rgba(26, 74, 53, 0.18);
    }

    .suggestion-card:hover .card-icon {
      transform: scale(1.2) rotate(5deg);
      color: var(--nenrin-sprout);
    }

    .card-icon {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .section-card {
      opacity: 0;
      transform: translateY(40px);
    }

    .section-card.animate-in {
      animation: fadeInUp 0.8s ease-out forwards;
    }

    .grid-item {
      opacity: 0;
      transform: translateY(20px);
    }

    .grid-item.animate-in {
      animation: fadeInUp 0.6s ease-out forwards;
    }

    /* Staggered animation delays */
    .grid-item:nth-child(1) { animation-delay: 0.1s; }
    .grid-item:nth-child(2) { animation-delay: 0.2s; }
    .grid-item:nth-child(3) { animation-delay: 0.3s; }
    .grid-item:nth-child(4) { animation-delay: 0.4s; }
    .grid-item:nth-child(5) { animation-delay: 0.5s; }
    .grid-item:nth-child(6) { animation-delay: 0.6s; }

    .subtle{ color: var(--nenrin-text-light); }

    /* Enhanced card text contrast */
    .card-text { color: var(--nenrin-ink); }
    .card-text-secondary { color: var(--nenrin-text-light); }

    /* Enhanced header */
    .enhanced-header {
      background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,248,243,0.9) 100%);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(31, 94, 66, 0.08);
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.02);
    }

    .logo-container {
      transition: all 0.3s ease;
    }

    .logo-container:hover {
      transform: scale(1.05);
    }

    /* Section dividers */
    .section-divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--nenrin-sprout), var(--nenrin-forest), var(--nenrin-sprout), transparent);
      margin: 2rem 0;
      border-radius: 2px;
      opacity: 0.3;
    }

    @media (prefers-reduced-motion: reduce){
      .no-motion, * { 
        transition:none !important; 
        animation:none !important; 
        transform: none !important;
      }
    }

    /* Loading shimmer effect */
    @keyframes shimmer {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: calc(200px + 100%) 0;
      }
    }

    .shimmer {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200px 100%;
      animation: shimmer 1.5s infinite;
    }

    /* Wooden Ring Backgrounds */
    .wooden-rings-1 {
      background-image: 
        radial-gradient(ellipse 800px 400px at 50% 50%, transparent 45%, var(--wood-light) 46%, var(--wood-light) 49%, transparent 50%),
        radial-gradient(ellipse 600px 300px at 50% 50%, transparent 55%, var(--wood-medium) 56%, var(--wood-medium) 58%, transparent 59%),
        radial-gradient(ellipse 400px 200px at 50% 50%, transparent 65%, var(--wood-dark) 66%, var(--wood-dark) 67%, transparent 68%),
        radial-gradient(ellipse 200px 100px at 50% 50%, transparent 75%, var(--wood-grain) 76%, var(--wood-grain) 77%, transparent 78%);
      background-size: 100% 100%;
      opacity: 0.08;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 20px;
      pointer-events: none;
    }

    .wooden-rings-2 {
      background-image: 
        radial-gradient(ellipse 700px 350px at 30% 70%, transparent 40%, var(--wood-medium) 41%, var(--wood-medium) 43%, transparent 44%),
        radial-gradient(ellipse 500px 250px at 70% 30%, transparent 50%, var(--wood-light) 51%, var(--wood-light) 53%, transparent 54%),
        radial-gradient(ellipse 300px 150px at 50% 50%, transparent 60%, var(--wood-dark) 61%, var(--wood-dark) 62%, transparent 63%),
        radial-gradient(ellipse 150px 75px at 40% 60%, transparent 70%, var(--wood-bark) 71%, var(--wood-bark) 72%, transparent 73%);
      background-size: 100% 100%;
      opacity: 0.06;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 20px;
      pointer-events: none;
    }

    .wooden-rings-3 {
      background-image: 
        radial-gradient(ellipse 600px 300px at 60% 40%, transparent 35%, var(--wood-light) 36%, var(--wood-light) 38%, transparent 39%),
        radial-gradient(ellipse 450px 225px at 40% 60%, transparent 45%, var(--wood-medium) 46%, var(--wood-medium) 48%, transparent 49%),
        radial-gradient(ellipse 350px 175px at 50% 50%, transparent 55%, var(--wood-dark) 56%, var(--wood-dark) 57%, transparent 58%),
        radial-gradient(ellipse 200px 100px at 35% 65%, transparent 65%, var(--wood-grain) 66%, var(--wood-grain) 67%, transparent 68%),
        radial-gradient(ellipse 100px 50px at 65% 35%, transparent 75%, var(--wood-bark) 76%, var(--wood-bark) 77%, transparent 78%);
      background-size: 100% 100%;
      opacity: 0.07;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 20px;
      pointer-events: none;
    }

    /* Section-specific wooden ring animations */
    @keyframes woodenRingsFloat1 {
      0%, 100% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(0.5deg) scale(1.002); }
    }

    @keyframes woodenRingsFloat2 {
      0%, 100% { transform: rotate(0deg) scale(1); }
      33% { transform: rotate(-0.3deg) scale(1.001); }
      66% { transform: rotate(0.4deg) scale(1.002); }
    }

    @keyframes woodenRingsFloat3 {
      0%, 100% { transform: rotate(0deg) scale(1); }
      25% { transform: rotate(0.2deg) scale(1.001); }
      75% { transform: rotate(-0.3deg) scale(1.002); }
    }

    .wooden-rings-1 { animation: woodenRingsFloat1 20s ease-in-out infinite; }
    .wooden-rings-2 { animation: woodenRingsFloat2 25s ease-in-out infinite; }
    .wooden-rings-3 { animation: woodenRingsFloat3 30s ease-in-out infinite; }
  `}</style>
);

// ----------------- Marks & Icons -----------------
function NenrinLogo({ size = 36 }: { size?: number }){
  return (
    <div className="flex items-center gap-4 logo-container" aria-label="Nenrin logo">
      <div className="relative">
        <svg aria-hidden={true} viewBox="0 0 40 40" width={size} height={size} className="animate-float">
          <circle cx="20" cy="20" r="18" fill="none" stroke="var(--nenrin-forest)" strokeWidth="2.5" className="animate-breathe"/>
          <circle cx="20" cy="20" r="12" fill="none" stroke="var(--nenrin-sprout)" strokeWidth="2" opacity=".8" style={{ animationDelay: "1s" }} className="animate-breathe"/>
          <circle cx="20" cy="20" r="6"  fill="none" stroke="var(--nenrin-gold)" strokeWidth="1.5" opacity=".6" style={{ animationDelay: "2s" }} className="animate-breathe"/>
          {/* Central dot with sparkle animation */}
          <circle cx="20" cy="20" r="2" fill="var(--nenrin-forest)" opacity=".9" className="animate-sparkle"/>
        </svg>
        {/* Subtle glow effect */}
        <div 
          className="absolute inset-0 rounded-full animate-breathe"
          style={{
            background: "radial-gradient(circle, rgba(31,94,66,0.15) 0%, transparent 70%)",
            animationDelay: "0.5s"
          }}
        />
      </div>
      <div className="flex flex-col">
        <p className="nenrin-font-heading font-[700] tracking-[.02em] text-2xl text-nenrin-forest">
          Nenrin
        </p>
        <div className="h-0.5 w-full bg-gradient-to-r from-nenrin-sprout to-nenrin-forest opacity-70 rounded"/>
        <p className="nenrin-font-body text-xs text-nenrin-forest opacity-80 mt-1 font-medium">
          Your digital companion
        </p>
      </div>
    </div>
  );
}

function RingsBackground(){
  return (
    <div aria-hidden={true} className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Primary animated ring pattern */}
      <div
        className="absolute -left-40 -top-56 h-[1200px] w-[1200px] rounded-full animate-breathe"
        style={{
          background: "radial-gradient(circle, rgba(31,94,66,0.08) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          opacity: 0.6,
        }}
      />
      {/* Secondary floating pattern */}
      <div
        className="absolute -right-60 -top-20 h-[800px] w-[800px] rounded-full animate-float"
        style={{
          background: "radial-gradient(circle, rgba(96,198,137,0.06) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          opacity: 0.4,
          animationDelay: "2s",
        }}
      />
      {/* Tertiary subtle pattern */}
      <div
        className="absolute -left-20 -bottom-40 h-[600px] w-[600px] rounded-full animate-breathe"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.3,
          animationDelay: "4s",
        }}
      />
      {/* Floating particles */}
      <div className="absolute top-20 left-1/4 w-2 h-2 bg-nenrin-sprout rounded-full opacity-20 animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-nenrin-forest rounded-full opacity-30 animate-float" style={{ animationDelay: "3s" }} />
      <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-nenrin-gold rounded-full opacity-25 animate-float" style={{ animationDelay: "5s" }} />
    </div>
  );
}

interface IconProps {
  width?: string;
  height?: string;
  [key: string]: any;
}

const Icon = {
  WA: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20.5 3.5a11 11 0 0 0-16 14.1L3 21l3.6-1.4A11 11 0 1 0 20.5 3.5z"/>
      <path d="M8.5 8.5c.5 2.2 2.8 4.5 5 5l1.8-.9c.3-.2.7 0 .8.3l.7 1.7c.1.4 0 .8-.4 1a6.6 6.6 0 0 1-3 1c-3.6 0-7.2-3.6-7.2-7.2 0-1 .3-2 .8-2.9.2-.4.7-.5 1-.4l1.7.7c.3.1.5.5.3.8l-.9 1.8z"/>
    </svg>
  ),
  Spark: (props: IconProps) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2l1.8 4.8L18 9l-4.2 2.2L12 16l-1.8-4.8L6 9l4.2-2.2L12 2z"/></svg>),
  Bell:  (props: IconProps) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>),
  Timer: (props: IconProps) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="13" r="9"/><path d="M12 6v7l4 4M9 3h6"/></svg>),
  Pin:   (props: IconProps) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14 3l7 7-4 4 4 4-3 3-4-4-4 4-3-3 4-4-4-4 7-7z"/></svg>),
  Check: (props: IconProps) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 6L9 17l-5-5"/></svg>),
};

// ----------------- Helpers -----------------
const waLink = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

function SuggestionCard({ title, phrase, icon, onClick }: { title: string; phrase: string; icon: React.ReactNode; onClick: () => void }){
    return (
      <div 
        onClick={onClick}
        aria-label={`Select suggestion: ${title}`} 
        className="card suggestion-card block focusable rounded-2xl grid-item group cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="nenrin-font-heading text-[19px] font-[600] tracking-[.01em] mb-2 text-nenrin-ink group-hover:text-nenrin-forest transition-colors duration-300">
              {title}
            </h3>
            <p className="nenrin-font-body text-[15px] text-nenrin-text-light leading-relaxed mb-3">
              "{phrase}"
            </p>
            {/* Visual indicator */}
            <div className="flex items-center gap-2 opacity-50 group-hover:opacity-80 transition-all duration-300">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-nenrin-sprout to-nenrin-forest opacity-60"/>
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-nenrin-forest to-nenrin-gold opacity-40"/>
              <div className="w-1.5 h-1.5 rounded-full bg-nenrin-sage opacity-50"/>
            </div>
          </div>
          <span className="text-nenrin-forest pt-1 card-icon">{icon}</span>
        </div>
        {/* Hover accent line */}
        <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-nenrin-sprout via-nenrin-forest to-nenrin-gold opacity-0 group-hover:opacity-40 transition-all duration-500 rounded-full"/>
      </div>
    );
  }

// ----------------- Modal -----------------
function SimilarExpressionsModal({ isOpen, onClose, suggestion }) {
    if (!isOpen) return null;
  
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeInScale"
        onClick={onClose}
      >
        <div 
          className="card max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start">
            <h2 className="nenrin-font-heading text-2xl font-bold mb-4 text-nenrin-forest">{suggestion.title}</h2>
            <button onClick={onClose} className="text-2xl text-nenrin-text-light">&times;</button>
          </div>
          
          <p className="nenrin-font-body text-nenrin-text-light mb-6">Here are a few other ways you could phrase this:</p>
  
          <ul className="space-y-3">
            {suggestion.similar.map((phrase, index) => (
              <li key={index}>
                <a 
                  href={waLink(phrase)} 
                  target="_blank" 
                  rel="noreferrer noopener"
                  className="block p-4 rounded-lg bg-nenrin-mist hover:bg-opacity-80 transition-all duration-300"
                >
                  <p className="nenrin-font-body text-nenrin-ink">"{phrase}"</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

// ----------------- Home Content -----------------
function Home() {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);

    const suggestions = [
        { 
            title: "Greet the Sun", 
            phrase: "summarize my tasks every day at 6am", 
            icon: <Icon.Check/>,
            similar: [
                "What's on my plate for today?",
                "Can you give me the morning highlights?",
                "I'm starting my day, what should I focus on?"
            ]
        },
        { 
            title: "Root a New Habit", 
            phrase: "run every Sunday at 7am", 
            icon: <Icon.Timer/>,
            similar: [
                "Help me stick to a running schedule every Sunday morning.",
                "I want to start a new weekly routine: running.",
                "Let's make sure I go for a run every Sunday."
            ]
        },
        { 
            title: "A Gentle Nudge", 
            phrase: "remind me to call mom at 6pm today", 
            icon: <Icon.Bell/>,
            similar: [
                "Ping me at 6pm so I don't forget to call my mom.",
                "I have to call my mom after work today.",
                "Later today, 6pm, call mom."
            ]
        },
        { 
            title: "Find Needle in the hasctack", 
            phrase: "Where is rina house again?", 
            icon: <Icon.Bell/>,
            similar: [
                "Summarize what do i write last week.",
                "What father would like for his birthday.",
                "Idea for holiday"
            ]
        },
        { 
            title: "Jot Down a Thought", 
            phrase: "Today I learned that elephants have incredible memories.", 
            icon: <Icon.Check/>,
            similar: [
                "Rina house is beside a mosque have green color.",
                "Fathers Wallet look old.",
                "Bali Festival is on October"
            ]
        },
        { 
            title: "Personalize Your Assistant", 
            phrase: "From now on, always sign off with my name, [Your Name].", 
            icon: <Icon.Check/>,
            similar: [
                "Update my profile, you can call me [Your Name].",
                "Let's be on a first-name basis.",
                "I'd prefer if you used my name."
            ]
        },
    ];

    const openModal = (suggestion) => {
        setSelectedSuggestion(suggestion);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedSuggestion(null);
    };

  // Animation trigger effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const elements = document.querySelectorAll('.section-card, .grid-item');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Recommendations */}
      <section className="card section-card relative">
        <div className="wooden-rings-1"></div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="p-2 rounded-xl bg-gradient-to-r from-nenrin-sprout to-nenrin-forest-light">
            <Icon.Spark className="text-white animate-sparkle" width="20" height="20"/>
          </div>
          <div>
            <h2 className="nenrin-font-heading text-[24px] font-[700] tracking-[.02em] text-nenrin-ink">
              Cultivate Your Day
            </h2>
            <p className="nenrin-font-body text-sm text-nenrin-text-light mt-1">Gentle suggestions to nurture your daily rhythm</p>
          </div>
        </div>
        <div className="section-divider my-4 relative z-10"/>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {suggestions.map((suggestion, index) => (
              <SuggestionCard 
                key={index}
                title={suggestion.title} 
                phrase={suggestion.phrase} 
                icon={suggestion.icon} 
                onClick={() => openModal(suggestion)}
              />
          ))}
        </div>
      </section>

      {/* Glossary */}
      <section className="mt-6 card section-card relative">
        <div className="wooden-rings-3"></div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="p-2 rounded-xl bg-gradient-to-r from-nenrin-sage to-nenrin-sprout">
            <Icon.Spark className="text-white animate-sparkle" width="20" height="20" style={{ animationDelay: "2s" }}/>
          </div>
          <div>
            <h2 className="nenrin-font-heading text-[20px] font-[600] tracking-[.01em] text-nenrin-ink">
              Nenrin Glossary
            </h2>
            <p className="nenrin-font-body text-sm text-nenrin-text-light mt-1">Understanding your digital companion's capabilities</p>
          </div>
        </div>
        <div className="section-divider my-4 relative z-10"/>
        <div className="nenrin-font-body text-[14px] grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 relative z-10">
          <div className="p-4 rounded-xl bg-gradient-to-br from-nenrin-mist to-transparent border border-nenrin-forest border-opacity-8 transition-all duration-300 hover:shadow-lg hover:border-opacity-18">
            <h3 className="font-bold text-base nenrin-font-heading text-nenrin-forest mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-nenrin-forest"/>
              AI Brain
            </h3>
            <p className="text-nenrin-text-light leading-relaxed">Spesify how you want your nenrin response, long , short and in any leangue<br/><i className="text-nenrin-forest font-medium">Try: "remember my work hours are 9-5"</i></p>
          </div>
           <div className="p-4 rounded-xl bg-gradient-to-br from-nenrin-mist to-transparent border border-nenrin-forest border-opacity-8 transition-all duration-300 hover:shadow-lg hover:border-opacity-18">
            <h3 className="font-bold text-base nenrin-font-heading text-nenrin-forest mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-nenrin-sprout"/>
              Journal
            </h3>
            <p className="text-nenrin-text-light leading-relaxed">General notes not about you—like meeting summaries or ideas—that are easy to search later.<br/><i className="text-nenrin-forest font-medium">Try: "journal: design review notes…"</i></p>
          </div>
           <div className="p-4 rounded-xl bg-gradient-to-br from-nenrin-mist to-transparent border border-nenrin-forest border-opacity-8 transition-all duration-300 hover:shadow-lg hover:border-opacity-18">
            <h3 className="font-bold text-base nenrin-font-heading text-nenrin-forest mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-nenrin-gold"/>
              Tasks
            </h3>
            <p className="text-nenrin-text-light leading-relaxed">Your to-dos. You can add, edit, complete, or organized them into category.<br/><i className="text-nenrin-forest font-medium">Try: "add task: call Dinda tomorrow 9am"</i></p>
          </div>
           <div className="p-4 rounded-xl bg-gradient-to-br from-nenrin-mist to-transparent border border-nenrin-forest border-opacity-8 transition-all duration-300 hover:shadow-lg hover:border-opacity-18">
            <h3 className="font-bold text-base nenrin-font-heading text-nenrin-forest mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-nenrin-sage"/>
              Reminders
            </h3>
            <p className="text-nenrin-text-light leading-relaxed">Gentle nudges at a specific date and time or repeated schedule. You can reschedule or remove them anytime.<br/><i className="text-nenrin-forest font-medium">Try: "remind me today 6pm to send invoice"</i></p>
          </div>
           <div className="p-4 rounded-xl bg-gradient-to-br from-nenrin-mist to-transparent border border-nenrin-forest border-opacity-8 transition-all duration-300 hover:shadow-lg hover:border-opacity-18">
            <h3 className="font-bold text-base nenrin-font-heading text-nenrin-forest mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-nenrin-forest"/>
              Internet Access
            </h3>
            <p className="text-nenrin-text-light leading-relaxed">AI stil can find relevant and uptodate information for me.<br/><i className="text-nenrin-forest font-medium">Try: "silent mode for the next hour"</i></p>
          </div>
           <div className="p-4 rounded-xl bg-gradient-to-br from-nenrin-mist to-transparent border border-nenrin-forest border-opacity-8 transition-all duration-300 hover:shadow-lg hover:border-opacity-18">
            <h3 className="font-bold text-base nenrin-font-heading text-nenrin-forest mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-nenrin-sprout"/>
               Expert Mode
            </h3>
            <p className="text-nenrin-text-light leading-relaxed">You can ask Nenrin to merge, break down the task, or more.<br/><i className="text-nenrin-forest font-medium">Try: "expert mode: break down 'plan trip' into smaller tasks"</i></p>
          </div>
        </div>
      </section>

      {/* How to talk to Nenrin */}
      <section className="mt-6 card section-card relative">
        <div className="wooden-rings-2"></div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="p-2 rounded-xl bg-gradient-to-r from-nenrin-forest to-nenrin-gold">
            <Icon.Spark className="text-white animate-sparkle" width="20" height="20" style={{ animationDelay: "1s" }}/>
          </div>
          <div>
            <h2 className="nenrin-font-heading text-[22px] font-[700] tracking-[.02em] text-nenrin-ink">
              Planting Seeds of Action
            </h2>
            <p className="nenrin-font-body text-sm text-nenrin-text-light mt-1">Natural ways to communicate your intentions</p>
          </div>
        </div>
        <div className="section-divider my-4 relative z-10"/>
        <ul className="nenrin-font-body text-[15px] grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 relative z-10">
          <li className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-nenrin-mist to-transparent border border-nenrin-forest border-opacity-15 transition-all duration-300 hover:shadow-md">
            <span className="chip">New Task</span> 
            <span className="flex-1 text-nenrin-ink">"call Dinda tomorrow at 9am"</span>
          </li>
          <li className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-nenrin-mist to-transparent border border-nenrin-forest border-opacity-15 transition-all duration-300 hover:shadow-md">
            <span className="chip">Reminder</span> 
            <span className="flex-1 text-nenrin-ink">"remind me Friday 6pm to pay bills"</span>
          </li>
          <li className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-nenrin-mist to-transparent border border-nenrin-forest border-opacity-15 transition-all duration-300 hover:shadow-md">
            <span className="chip">Reschedule</span> 
            <span className="flex-1 text-nenrin-ink">"move design review to next Tuesday 10am"</span>
          </li>
          <li className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-nenrin-mist to-transparent border border-nenrin-forest border-opacity-15 transition-all duration-300 hover:shadow-md">
            <span className="chip">Ask for Advice</span> 
            <span className="flex-1 text-nenrin-ink">"what should I do first today?"</span>
          </li>
        </ul>
      </section>

      <SimilarExpressionsModal 
        isOpen={modalIsOpen}
        onClose={closeModal}
        suggestion={selectedSuggestion}
      />
    </>
  );
}

// ----------------- Main -----------------
function NenrinFirstDashboard(){
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleConnectGoogleCalendar = async () => {
    const { data } = supabase.functions.getURL('google-calendar-integration', {
      path: '/oauth-start',
    });
    window.location.href = data.url;
  };

  return (
    <main className="relative min-h-[100vh] w-full">
      <BrandCSS/>
      <RingsBackground/>
      
      <header className="enhanced-header sticky top-0 z-10 max-w-5xl mx-auto px-6 py-6 flex items-center justify-between animate-fadeInScale">
          <NenrinLogo size={48}/>
          <div className="flex items-center gap-4">
            <Button onClick={handleConnectGoogleCalendar} variant="outline">
              Connect to Google Calendar
            </Button>
            <Button onClick={handleLogout}>
              Logout
            </Button>
          </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-4 pb-12 grid gap-6">
        <Home/>
      </div>

      <footer className="relative max-w-5xl mx-auto px-6 py-8 text-center">
        {/* Decorative element */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-nenrin-sprout to-nenrin-forest flex items-center justify-center animate-float">
            <Icon.Spark className="text-white animate-sparkle" width="24" height="24"/>
          </div>
        </div>
        
        <p className="nenrin-font-body text-sm text-nenrin-bark leading-relaxed max-w-md mx-auto">
          Nenrin grows with you, calmly and at your own pace. 
          <span className="block mt-2 text-nenrin-forest font-medium">
            You are always in control.
          </span>
        </p>
        
        {/* Bottom accent */}
        <div className="mt-6 w-32 h-0.5 bg-gradient-to-r from-transparent via-nenrin-sprout to-transparent mx-auto rounded-full opacity-50"/>
      </footer>
    </main>
  );
}

export default function DashboardPage() {
    return <NenrinFirstDashboard />;
}