"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  Clock,
  Star,
  Settings,
  LogOut,
  ChevronRight,
  Palette,
  Gift,
  ArrowLeft,
  PenSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";

export function NavSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const isMessagesActive = pathname === "/" || pathname.startsWith("/c/") || pathname === "/ai";

  return (
    <aside className="flex h-full w-14 flex-col items-center border-r bg-background py-3">
      {/* Logo with dropdown */}
      <div className="relative mb-3" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
        >
          <Image
            src="/logo.svg"
            alt="Shipper"
            width={36}
            height={36}
            className="rounded-lg"
          />
        </button>

        {showMenu && (
          <div className="absolute left-12 top-0 z-50 w-60 rounded-lg border bg-background shadow-lg">
            <div className="p-1.5 border-b">
              <button
                onClick={() => {
                  router.push("/");
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
                Go back to dashboard
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <PenSquare className="h-4 w-4" />
                  Rename file
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>

            {user && (
              <div className="px-2.5 py-2 border-b">
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            )}

            <div className="px-2.5 py-2 border-b">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Credits</span>
                <span>Renews in</span>
              </div>
              <div className="flex justify-between text-sm font-semibold mb-1.5">
                <span>20 left</span>
                <span>6h 24m</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                <div className="h-full w-3/4 bg-green-500 rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>5 of 25 used today</span>
                <span className="text-green-500">+25 tomorrow</span>
              </div>
            </div>

            <div className="p-1.5">
              <button
                onClick={() => setShowMenu(false)}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Win free credits
                </div>
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Theme Style
                </div>
              </button>
              <button
                onClick={() => {
                  logout();
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-red-500 transition-colors hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        <button
          onClick={() => router.push("/")}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
            isMessagesActive
              ? "bg-green-500 text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title="Home"
        >
          <Home className="h-4 w-4" />
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Recent"
        >
          <Clock className="h-4 w-4" />
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Starred"
        >
          <Star className="h-4 w-4" />
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Messages"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
      </nav>

      {/* Settings */}
      <button
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-2"
        title="Settings"
      >
        <Settings className="h-4 w-4" />
      </button>

      {/* User avatar */}
      {user && (
        <Avatar
          src={user.image}
          fallback={user.name}
          size="sm"
        />
      )}
    </aside>
  );
}
