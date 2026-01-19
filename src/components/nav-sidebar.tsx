"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  Archive,
  LogOut,
  User,
  ChevronLeft,
  Pencil,
  Gift,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useChatStore } from "@/stores/chat-store";
import { ProfileSettingsModal } from "./profile-settings-modal";
import Image from "next/image";

interface NavSidebarProps {
  onOpenSettings?: () => void;
}

export function NavSidebar({ onOpenSettings }: NavSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { showArchived, setShowArchived } = useChatStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoMenu, setShowLogoMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const logoMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (logoMenuRef.current && !logoMenuRef.current.contains(e.target as Node)) {
        setShowLogoMenu(false);
      }
    };

    if (showProfileMenu || showLogoMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showProfileMenu, showLogoMenu]);

  const isMessagesActive = pathname === "/" || pathname.startsWith("/c/") || pathname === "/ai";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      <aside className="flex h-full w-14 flex-col items-center border-r bg-background py-4">
        {/* Logo with dropdown */}
        <div className="relative mb-4" ref={logoMenuRef}>
          <button
            onClick={() => setShowLogoMenu(!showLogoMenu)}
            className="rounded-lg transition-opacity hover:opacity-80"
          >
            <Image
              src="/logo.svg"
              alt="Shipper"
              width={32}
              height={32}
              className="rounded-lg"
            />
          </button>

          {showLogoMenu && (
            <div className="absolute top-0 left-12 z-50 w-64 rounded-xl border bg-[#F3F3EE] shadow-lg overflow-hidden">
              {/* Navigation options */}
              <div className="p-1 border-b">
                <button
                  onClick={() => {
                    setShowLogoMenu(false);
                    router.push("/");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Go back to dashboard
                </button>
                <button
                  onClick={() => setShowLogoMenu(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white"
                >
                  <Pencil className="h-4 w-4" />
                  Rename file
                </button>
              </div>

              {/* User info & credits */}
              <div className="p-4 border-b">
                <p className="font-semibold text-sm">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Credits</p>
                    <p className="font-semibold">20 left</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Renews in</p>
                    <p className="font-semibold">6h 24m</p>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "20%" }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-muted-foreground">5 of 25 used today</p>
                    <p className="text-xs text-primary">+25 tomorrow</p>
                  </div>
                </div>
              </div>

              {/* Menu options */}
              <div className="p-1">
                <button
                  onClick={() => setShowLogoMenu(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white"
                >
                  <Gift className="h-4 w-4" />
                  Win free credits
                </button>
                <button
                  onClick={() => setShowLogoMenu(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white"
                >
                  <Sun className="h-4 w-4" />
                  Theme Style
                </button>
              </div>

              {/* Log out */}
              <div className="p-1 border-t">
                <button
                  onClick={() => {
                    setShowLogoMenu(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col items-center gap-2">
          <button
            onClick={() => {
              setShowArchived(false);
              router.push("/");
            }}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              isMessagesActive && !showArchived
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title="Home"
          >
            <Home className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setShowArchived(false);
              router.push("/");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Messages"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setShowArchived(true);
              router.push("/");
            }}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              showArchived
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title="Archive"
          >
            <Archive className="h-5 w-5" />
          </button>
        </nav>

        {/* User avatar with dropdown */}
        <div className="relative" ref={profileMenuRef}>
          {user && (
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="rounded-full transition-opacity hover:opacity-80"
              title="Profile"
            >
              <Avatar
                src={user.image}
                fallback={user.name}
                size="sm"
              />
            </button>
          )}

          {showProfileMenu && (
            <div className="absolute bottom-0 left-12 z-50 w-48 rounded-xl border bg-[#F3F3EE] shadow-lg overflow-hidden">
              <div className="p-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowProfileModal(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white"
                >
                  <User className="h-4 w-4" />
                  Profile Settings
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-white"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
      />
    </>
  );
}
