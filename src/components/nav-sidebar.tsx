"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  Archive,
  Settings,
  LogOut,
  User,
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
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    if (showSettingsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSettingsMenu]);

  const isMessagesActive = pathname === "/" || pathname.startsWith("/c/") || pathname === "/ai";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      <aside className="flex h-full w-14 flex-col items-center border-r bg-background py-3">
        {/* Logo */}
        <div className="mb-3">
          <Image
            src="/logo.svg"
            alt="Shipper"
            width={36}
            height={36}
            className="rounded-lg"
          />
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col items-center gap-1">
          <button
            onClick={() => {
              setShowArchived(false);
              router.push("/");
            }}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              isMessagesActive && !showArchived
                ? "bg-green-500 text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title="Home"
          >
            <Home className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setShowArchived(false);
              router.push("/");
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Messages"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setShowArchived(true);
              router.push("/");
            }}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              showArchived
                ? "bg-green-500 text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </button>
        </nav>

        {/* Settings with dropdown */}
        <div className="relative" ref={settingsMenuRef}>
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-2"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {showSettingsMenu && (
            <div className="absolute bottom-0 left-12 z-50 w-48 rounded-lg border bg-card shadow-lg">
              <div className="p-1">
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    setShowProfileModal(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <User className="h-4 w-4" />
                  Profile Settings
                </button>
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        {user && (
          <Avatar
            src={user.image}
            fallback={user.name}
            size="sm"
          />
        )}
      </aside>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
      />
    </>
  );
}
