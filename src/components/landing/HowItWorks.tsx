import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ClipboardList, Calculator, TrendingUp } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    step: "1",
    title: "Enter Your Details",
    description: "Share your body stats, lifestyle & 2026 health goals",
  },
  {
    icon: Calculator,
    step: "2",
    title: "Get Your AI Plan",
    description: "Receive a personalized calorie + workout plan powered by 2026 algorithms",
  },
  {
    icon: TrendingUp,
    step: "3",
    title: "Track & Evolve",
    description: "Monitor progress with smart adaptations weekly",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 bg-secondary/30" ref={ref}>
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
            How <span className="gradient-text">SmartGain</span> Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Three simple steps to your personalized weight gain journey using 2026's most advanced algorithms.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.25, delay: index * 0.15 }}
              className="flex-1 relative"
            >
              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-primary/10" />
              )}
              
              <div className="p-6 rounded-2xl bg-card border border-border text-center relative z-10">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center relative">
                  <step.icon className="w-6 h-6 text-primary" />
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
