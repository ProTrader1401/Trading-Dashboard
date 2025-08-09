import { Link, useLocation } from "wouter";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { path: "/", label: "Dashboard" },
  { path: "/trades", label: "Trade Log" },
  { path: "/analytics", label: "Analytics" },
  { path: "/strategies", label: "Strategies" },
  { path: "/psychology", label: "Psychology" },
  { path: "/settings", label: "Settings" },
];

export default function Header() {
  const [location] = useLocation();

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border-b border-border sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground transition-colors duration-300">IntraDay Pro</h1>
          </Link>
          
          {/* Navigation Menu */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "nav-link",
                  location === item.path && "nav-link-active"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Theme Toggle and Mobile Menu */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
