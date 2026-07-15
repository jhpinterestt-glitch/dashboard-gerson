import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { NovoCasoModal } from "./NovoCasoModal";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="h-screen flex w-full overflow-hidden">
      <AppSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onNewCase={() => setModalOpen(true)}
      />
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        <TopBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="flex-1 px-12 py-8 overflow-y-auto">
          <Outlet context={{ refreshKey, bumpRefresh, searchQuery }} />
        </main>
      </div>
      {/* Subtle gradient embellishment */}
      <div className="fixed top-0 right-0 w-1/3 h-screen bg-gradient-to-l from-primary/5 to-transparent pointer-events-none -z-10" />
      <NovoCasoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={bumpRefresh}
      />
    </div>
  );
}
