import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Wallet,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Processos", path: "/processos", icon: Briefcase },
  { title: "Fluxo de Caixa", path: "/financeiro", icon: Wallet },
  { title: "Agenda", path: "/agenda", icon: CalendarDays },
];

interface Props {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onNewCase?: () => void;
}

export function AppSidebar({ collapsed, setCollapsed, onNewCase }: Props) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-primary flex flex-col z-50 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn("p-4 flex flex-col items-center", collapsed && "p-2")}>
        <Logo
          variant="dark"
          maxHeight={collapsed ? 44 : 185}
          className={cn(collapsed ? "max-w-[44px]" : "w-full max-w-[210px] px-2")}
        />
        {!collapsed && (
          <p className="mt-3 text-[10px] tracking-[0.2em] uppercase text-sidebar-foreground/50 font-label text-center">
            Gestão Financeira Jurídica
          </p>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary border border-amber-accent/30 flex items-center justify-center text-amber-accent hover:bg-sidebar-hover transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-all duration-200 rounded-sm",
                isActive
                  ? "border-l-2 border-amber-accent text-amber-accent font-bold bg-sidebar-hover/50"
                  : "text-sidebar-foreground/70 hover:text-primary-foreground hover:bg-sidebar-hover/30 hover:translate-x-1",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon size={18} />
              {!collapsed && (
                <span className="text-xs tracking-wider uppercase font-label">
                  {item.title}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

    </aside>
  );
}
