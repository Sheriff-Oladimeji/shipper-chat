"use client";

import { useState } from "react";
import { MessageCircle, Search, Bell, Settings, ChevronDown, LogOut, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { ProfileSettingsModal, SearchModal, NotificationSettingsModal } from "@/components/modals";

export function TopNavbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b bg-card px-4">
        {/* Left - Message title */}
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Message</span>
        </div>

        {/* Right - Search, notifications, settings, user */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
            <kbd className="ml-8 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          {/* Notification bell */}
          <button
            onClick={() => setShowNotificationModal(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted transition-colors"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted transition-colors"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-border mx-1" />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1 rounded-lg p-1 hover:bg-muted transition-colors"
            >
              <Avatar
                src={user?.image}
                fallback={user?.name || "U"}
                size="sm"
              />
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border bg-card shadow-lg">
                  <div className="p-2 border-b">
                    <p className="font-medium text-sm truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setShowProfileModal(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-muted transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <ProfileSettingsModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
      />
      <SearchModal
        open={showSearchModal}
        onOpenChange={setShowSearchModal}
      />
      <NotificationSettingsModal
        open={showNotificationModal}
        onOpenChange={setShowNotificationModal}
      />
    </>
  );
}
