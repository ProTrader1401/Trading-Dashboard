import { Link, useLocation } from "wouter";
import { Home, TrendingUp, BarChart3, Brain, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/trades", label: "Trades", icon: TrendingUp },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/strategies", label: "Strategies", icon: Brain },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
