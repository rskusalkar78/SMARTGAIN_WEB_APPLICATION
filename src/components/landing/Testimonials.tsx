import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { User } from 'lucide-react';

interface TestimonialData {
  name: string;
  role: string;
  content: string;
  result: string;
}

const testimonials: TestimonialData[] = [
  {
    name: "Sarah Chen",
    role: "Marketing Professional",
    content: "SmartGain's adaptive algorithm changed everything. In just 3 months, I lost 12 lbs while actually enjoying my workouts. The AI-powered nutrition plan felt personalized, not generic.",
    result: "Lost 12 lbs | 22% body fat reduction"
  },
  {
    name: "Marcus Thompson",
    role: "Software Engineer",
    content: "As someone with an unpredictable schedule, the dynamic meal recommendations and workout adjustments saved me. I've never felt more in control of my fitness journey.",
    result: "Gained 15 lbs muscle | +45% strength"
  },
  {
    name: "Emily Rodriguez",
    role: "College Student",
    content: "Finally, a fitness app that doesn't judge my busy lifestyle. SmartGain adapted to my exam schedule and still helped me build sustainable habits. Life-changing!",
    result: "6-week transformation | 5x more consistent"
  },
  {
    name: "David Patel",
    role: "Fitness Coach",
    content: "I recommend SmartGain to all my clients now. The data-driven insights and metabolic profiling are incredible. It's like having a sports scientist in your pocket.",
    result: "Clients see 3x faster results"
  },
  {
    name: "Jessica Williams",
    role: "Working Mom",
    content: "Balancing two kids and a career is tough, but SmartGain made fitness fit into my life. The meal prep suggestions are actually realistic. I've never felt healthier!",
    result: "Lost 18 lbs | +2 years of wellness"
  },
  {
    name: "Alex Kumar",
    role: "Personal Trainer",
    content: "The advanced metrics and macro tracking integration is unmatched. My clients are getting results faster than ever before. This is the future of fitness.",
    result: "Client satisfaction +89%"
  }
];

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 bg-background" ref={ref}>
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
            2026 Success <span className="gradient-text">Stories</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Real transformations from our growing community using cutting-edge 2026 methods.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.25, delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground/80 italic mb-4">
                "{testimonial.content}"
              </p>
              <div className="pt-4 border-t border-border/50">
                <p className="text-xs font-semibold text-primary/80">{testimonial.result}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
