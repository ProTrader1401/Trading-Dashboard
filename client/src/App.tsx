import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/app-context";
// import { ThemeProvider } from "@/hooks/use-theme";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";
import Dashboard from "@/pages/dashboard";
import TradeLogEnhanced from "@/pages/trade-log-enhanced";
import Analytics from "@/pages/analytics";
import Strategies from "@/pages/strategies";
import PsychologyEnhanced from "@/pages/psychology-enhanced";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <AnimatePresence mode="wait">
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/trades" component={TradeLogEnhanced} />
        <Route path="/trade-log" component={TradeLogEnhanced} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/strategies" component={Strategies} />
        <Route path="/psychology" component={PsychologyEnhanced} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Header />
            <main className="pb-20 md:pb-8">
              <Router />
            </main>
            <MobileNav />
          </div>
          <Toaster />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
