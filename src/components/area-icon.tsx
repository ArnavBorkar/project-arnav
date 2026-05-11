import {
  Bed,
  Dumbbell,
  Utensils,
  Armchair,
  Briefcase,
  Rocket,
  Sparkles,
  Users,
  BookText,
  Wand2,
  Home,
  Smartphone,
  Droplets,
  Wallet,
  CircleDot,
  type LucideIcon,
} from 'lucide-react';

const map: Record<string, LucideIcon> = {
  sleep: Bed,
  gym: Dumbbell,
  food: Utensils,
  posture: Armchair,
  work: Briefcase,
  startup: Rocket,
  spirit: Sparkles,
  social: Users,
  reading: BookText,
  looks: Wand2,
  env: Home,
  screen: Smartphone,
  hydration: Droplets,
  finance: Wallet,
};

export function AreaIcon({ area, className }: { area: string; className?: string }) {
  const Icon = map[area] ?? CircleDot;
  return <Icon className={className} aria-hidden />;
}
