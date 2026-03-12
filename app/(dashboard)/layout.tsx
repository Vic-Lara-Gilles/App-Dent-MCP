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
      <div className="flex h-screen">
        {/* Sidebar — visible only on md+ */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        <main className="flex-1 overflow-y-auto bg-muted/30">
          {/* Mobile top bar */}
          <div className="md:hidden sticky top-0 z-40 bg-background border-b px-4 h-12 flex items-center justify-between">
            <span className="text-base font-bold">🦷 DentAI</span>
            <ThemeToggle />
          </div>

          {/* Page content: extra bottom padding on mobile for the bottom nav */}
          <div className="p-4 pb-24 md:p-6 md:pb-6">
            {children}
          </div>

          {/* Mobile bottom navigation */}
          <MobileNav />
        </main>
      </div>
    </AuthProvider>
  );
}
