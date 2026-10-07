"use client";

import { cn } from "@/lib/utils";

export type DashboardTab = "information" | "articles";

type DashboardTabsProps = {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
};

const tabs: { id: DashboardTab; label: string }[] = [
  { id: "information", label: "Mes informations" },
  { id: "articles", label: "Mon tableau de bord" },
];

export default function DashboardTabs({ active, onChange }: DashboardTabsProps) {
  return (
    <div className="mb-8 flex border-b">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "border border-b-0 px-4 py-2 text-sm font-medium transition-colors",
            active === tab.id
              ? "bg-background text-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
