"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  PenSquare,
  Settings,
  LogOut,
  ChevronRight,
  Palette,
  Gift,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  hasArrow?: boolean;
}

export function NavSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const navItems: NavItem[] = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Home",
      href: "/",
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Messages",
      href: "/",
    },
    {
      icon: <PenSquare className="h-5 w-5" />,
      label: "Compose",
      href: "/",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      href: "/settings",
    },
  ];

  const menuItems: MenuItem[] = [
    {
      icon: <ArrowLeft className="h-4 w-4" />,
      label: "Go back to dashboard",
      onClick: () => router.push("/"),
    },
    {
      icon: <PenSquare className="h-4 w-4" />,
      label: "Rename file",
      onClick: () => {},
      hasArrow: true,
    },
    {
      icon: <Gift className="h-4 w-4" />,
      label: "Win free credits",
      onClick: () => {},
      hasArrow: true,
    },
    {
      icon: <Palette className="h-4 w-4" />,
      label: "Theme Style",
      onClick: () => {},
      hasArrow: true,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname.startsWith("/c/");
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-full w-16 flex-col items-center border-r bg-background py-4">
      {/* Logo with dropdown */}
      <div className="relative mb-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted"
          title="Menu"
        >
          <Image
            src="/logo.svg"
            alt="Shipper"
            width={40}
            height={40}
            className="rounded-lg"
          />
        </button>

        {showMenu && (
          <div className="absolute left-16 top-0 z-50 w-56 rounded-lg border bg-background p-2 shadow-lg">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick?.();
                  setShowMenu(false);
                }}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </div>
                {item.hasArrow && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ))}
            <div className="my-2 h-px bg-border" />
            <button
              onClick={() => {
                logout();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 transition-colors hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => router.push(item.href)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              isActive(item.href)
                ? "bg-green-500 text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </nav>

      {/* User avatar at bottom */}
      <div className="mt-auto">
        {user && (
          <Avatar
            src={user.image}
            fallback={user.name}
            size="md"
          />
        )}
      </div>
    </aside>
  );
}
