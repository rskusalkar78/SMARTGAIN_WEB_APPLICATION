import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Dumbbell, TrendingUp, Utensils, Zap, Shield, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface HeroProps {
  onGetStarted: () => void;
}

const cyclingTexts = [
  "2026's Most Advanced Calorie Intelligence",
  "AI-Powered Workout Planning",
  "Evidence-Based Weight Gain Science",
];

const sciencePrinciples = [
  {
    title: "Energy Surplus Rule",
    value: "7700",
    unit: "kcal/kg",
    explanation: "The energy needed to gain 1kg of body weight",
  },
  {
    title: "Protein Synthesis",
    value: "1.8g",
    unit: "/kg",
    explanation: "Optimal protein intake per kg of body weight",
  },
  {
    title: "Safe Gain Rate",
    value: "0.5kg",
    unit: "/week",
    explanation: "Maximum healthy weight gain per week",
  },
];

export function Hero({ onGetStarted }: HeroProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % cyclingTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleScrollToScience = () => {
    const scienceSection = document.getElementById('science-principles');
    scienceSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-secondary border border-border"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-sm font-medium text-secondary-foreground">
              Latest 2026 nutrition science & research
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-4"
          >
            Gain Weight{' '}
            <span className="gradient-text">Intelligently</span>
          </motion.h1>

          {/* Animated cycling subtext */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="h-8 mb-6 overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={currentTextIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="text-lg md:text-xl text-primary font-medium"
              >
                {cyclingTexts[currentTextIndex]}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed"
          >
            Calculate your personalized daily calories, macros, and workout plans 
            using 2026's most advanced nutrition algorithms — not outdated formulas.
          </motion.p>

          {/* Supporting line */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="text-base text-muted-foreground/80 mb-10 font-medium"
          >
            Your body data. Your lifestyle. A smarter gain plan.
          </motion.p>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-3 mb-6"
          >
            <Button 
              variant="hero" 
              size="xl" 
              onClick={onGetStarted}
              className="group"
            >
              Calculate My Smart Gain Plan
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            {/* Microcopy */}
            <p className="text-sm text-muted-foreground">
              Takes less than 60 seconds • No signup required
            </p>
            
            {/* Secondary link */}
            <button
              onClick={handleScrollToScience}
              className="text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
            >
              Is this safe for beginners?
            </button>
          </motion.div>

          {/* Reassurance Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-16 px-6 py-4 rounded-2xl bg-secondary/50 border border-border/50 max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4 text-primary" />
              <span>Designed for beginners</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>No supplements required</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Safety-first calculations</span>
            </div>
          </motion.div>
        </div>

        {/* Science-Backed Principles Cards */}
        <motion.div
          id="science-principles"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mt-8 max-w-4xl mx-auto"
        >
          <p className="text-center text-sm text-muted-foreground mb-6 uppercase tracking-wider">
            Based on 2026's latest nutrition research & metabolic studies
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {sciencePrinciples.map((principle, index) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.45 + index * 0.1 }}
                className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                {/* Soft glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    {principle.title}
                  </p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl md:text-4xl font-bold font-display gradient-text">
                      {principle.value}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      {principle.unit}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {principle.explanation}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
