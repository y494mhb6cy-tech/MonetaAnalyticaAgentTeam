"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Users,
  Cpu,
  DollarSign,
  Clock,
  Shield,
  ArrowRight,
  Zap,
  TrendingUp,
} from "lucide-react";

interface MaosIntroProps {
  onComplete: () => void;
}

// Animated counter
function CountUp({ value, duration = 2000, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(value * easeOut));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{count}{suffix}</>;
}

// Typewriter effect
function Typewriter({ text, delay = 50, onComplete }: { text: string; delay?: number; onComplete?: () => void }) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, delay, onComplete]);

  return <>{displayText}<span className="animate-pulse">|</span></>;
}

export default function MaosIntro({ onComplete }: MaosIntroProps) {
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [showSkip, setShowSkip] = useState(false);

  // Show skip button after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-advance stages
  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 1000),   // Start metrics reveal
      setTimeout(() => setStage(2), 3000),   // Show org insights
      setTimeout(() => setStage(3), 5000),   // Show value prop
      setTimeout(() => setStage(4), 7000),   // Final CTA
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleEnter = useCallback(() => {
    onComplete();
    router.push("/home");
  }, [onComplete, router]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(124,196,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(124,196,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-blue-400/30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
        {/* Stage 0: Logo and tagline */}
        <div
          className={`transition-all duration-1000 ${
            stage >= 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-blue-500/20">
              <Activity className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-4">
            MAOS
          </h1>
          <p className="text-xl text-slate-400">
            <Typewriter text="Your organization, operationalized." delay={60} />
          </p>
        </div>

        {/* Stage 1: Live metrics reveal */}
        <div
          className={`mt-16 transition-all duration-1000 ${
            stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white">
                <CountUp value={124} />
              </div>
              <div className="text-sm text-slate-500 mt-1">People</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <Cpu className="w-6 h-6 text-purple-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white">
                <CountUp value={16} />
              </div>
              <div className="text-sm text-slate-500 mt-1">AI Agents</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <DollarSign className="w-6 h-6 text-emerald-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-emerald-400">
                <CountUp value={67} suffix="%" />
              </div>
              <div className="text-sm text-slate-500 mt-1">Revenue Work</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <Clock className="w-6 h-6 text-amber-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-amber-400">
                <CountUp value={18} suffix="%" />
              </div>
              <div className="text-sm text-slate-500 mt-1">Admin Drag</div>
            </div>
          </div>
        </div>

        {/* Stage 2: Insights reveal */}
        <div
          className={`mt-12 transition-all duration-1000 ${
            stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Organization operating at 73% efficiency</span>
          </div>

          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>89 active</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span>5 blocked</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>847 agent runs today</span>
            </div>
          </div>
        </div>

        {/* Stage 3: Value proposition */}
        <div
          className={`mt-12 transition-all duration-1000 ${
            stage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 mx-auto mb-3 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-sm font-medium text-white">Clear Accountability</div>
                <div className="text-xs text-slate-500 mt-1">Know who owns what</div>
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 mx-auto mb-3 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-sm font-medium text-white">Humans + Agents</div>
                <div className="text-xs text-slate-500 mt-1">Working together</div>
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 mx-auto mb-3 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-sm font-medium text-white">Scale with Structure</div>
                <div className="text-xs text-slate-500 mt-1">Not with chaos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage 4: CTA */}
        <div
          className={`mt-16 transition-all duration-1000 ${
            stage >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <button
            onClick={handleEnter}
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold text-lg shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105"
          >
            Enter MAOS
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-4 text-sm text-slate-500">
            See your organization like never before
          </p>
        </div>
      </div>

      {/* Skip button */}
      {showSkip && (
        <button
          onClick={handleEnter}
          className="absolute bottom-8 right-8 text-sm text-slate-600 hover:text-slate-400 transition-colors"
        >
          Skip intro →
        </button>
      )}

      {/* Progress indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {[0, 1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              s <= stage ? "bg-blue-400" : "bg-slate-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
