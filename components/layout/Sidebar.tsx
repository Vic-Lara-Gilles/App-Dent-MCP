"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";
import { Calendar, CreditCard, LayoutDashboard, LogOut, Mic, Stethoscope, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Pacientes", icon: Users },
  { href: "/dentists", label: "Dentistas", icon: Stethoscope },
  { href: "/treatments", label: "Pagos", icon: CreditCard },
  { href: "/appointments", label: "Citas", icon: Calendar },
  { href: "/voice", label: "Voz", icon: Mic },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 border-r bg-white flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">🦷 DentAI</h1>
        <p className="text-xs text-muted-foreground mt-1">Gestion Dental</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.role === "ADMIN" ? "Administrador" : "Dentista"}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-md text-muted-foreground hover:bg-muted transition-colors"
              title="Cerrar sesion"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
