import { motion } from "framer-motion";
import StatsCards from "@/components/dashboard/stats-cards";
import QuickTradeForm from "@/components/dashboard/quick-trade-form";
import RecentTrades from "@/components/dashboard/recent-trades";
import TradingCalendar from "@/components/dashboard/trading-calendar";
import QuickStats from "@/components/dashboard/quick-stats";
import EmotionTracker from "@/components/dashboard/emotion-tracker";
import StrategyPerformance from "@/components/dashboard/strategy-performance";

export default function Dashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <StatsCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Left Column */}
        <motion.div 
          className="lg:col-span-2 space-y-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <QuickTradeForm />
          <RecentTrades />
        </motion.div>
        
        {/* Right Column */}
        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <TradingCalendar />
          <QuickStats />
          <EmotionTracker />
        </motion.div>
      </div>
      
      <div className="mt-8">
        <StrategyPerformance />
      </div>
    </motion.div>
  );
}
