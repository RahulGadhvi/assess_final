"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Hiring Tasks", href: "/dashboard", icon: LayoutDashboard },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-[220px] h-screen fixed left-0 top-0 bg-[#0A0A0A] border-r border-border flex flex-col z-20">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <span className="font-mono font-bold text-xl tracking-tighter text-text-primary">
          Assess.
        </span>
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-surface border-l-2 border-accent text-text-primary"
                  : "text-text-muted hover:text-text-primary hover:bg-surface/50 border-l-2 border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-text-primary">RG</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">Rahul Gadhvi</p>
          <p className="text-xs text-text-muted truncate">ACME Corp</p>
        </div>
        <button className="text-text-muted hover:text-text-primary transition-colors p-1">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}