import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AuthProvider } from "@/components/providers/AuthProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-dvh">
        {/* Sidebar — visible only on md+ */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Right column: top bar + scrollable content + bottom nav */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Mobile top bar */}
          <div className="md:hidden shrink-0 z-40 bg-background border-b px-4 h-12 flex items-center justify-between">
            <span className="text-base font-bold">🦷 DentAI</span>
            <ThemeToggle />
          </div>

          {/* Scrollable page content */}
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="p-4 md:p-6">
              {children}
            </div>
          </main>

          {/* Mobile bottom navigation — outside scroll container, sticks naturally */}
          <MobileNav />
        </div>
      </div>
    </AuthProvider>
  );
}
