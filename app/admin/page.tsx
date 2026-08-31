"use client";

import { useEffect, useState } from "react";
import {
  Users, LayoutTemplate,
  CreditCard, Sparkles, TrendingUp
} from "lucide-react";
import { toast } from "sonner";

export default function AdminOverviewDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      } else {
        toast.error("Failed to load statistics");
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
      toast.error("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Estimated MRR",
      value: stats?.revenue ? `$${stats.revenue.toLocaleString()}` : "$0",
      icon: CreditCard,
      sub: "Based on active plans",
    },
    {
      title: "Active Subscribers",
      value: stats?.activeSubscribers ?? 0,
      icon: TrendingUp,
      sub: "Users with active subscriptions",
    },
    {
      title: "Total Briefs",
      value: stats?.sessions ?? 0,
      icon: LayoutTemplate,
      sub: "Total reversed URLs/Uploads",
    },
    {
      title: "Total Prompts",
      value: stats?.generations ?? 0,
      icon: Sparkles,
      sub: "Images/Videos generated",
    },
    {
      title: "Total Users",
      value: stats?.users ?? 0,
      icon: Users,
      sub: "Registered accounts",
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">Global statistics across Recrea8.</p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] rounded-2xl bg-card border border-border animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="relative group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="p-6">
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>

                  {/* Value */}
                  <div className="text-3xl font-black text-foreground tracking-tight tabular-nums">
                    {card.value}
                  </div>

                  {/* Title + sub */}
                  <div className="mt-1.5">
                    <p className="text-sm font-semibold text-foreground/80">{card.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
