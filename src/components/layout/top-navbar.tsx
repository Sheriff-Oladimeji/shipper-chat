"use client";

import { useState } from "react";
import { MessageCircle, Search, Bell, Settings, ChevronDown, LogOut, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import { ProfileSettingsModal, SearchModal, NotificationSettingsModal } from "@/components/modals";

export function TopNavbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { unreadNotificationCount, resetUnreadCount } = useChatStore();
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
      <div className="p-3 pb-0 bg-[#F3F3EE]">
      <header className="flex h-14 items-center justify-between rounded-2xl bg-card px-4">
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
            className="flex items-center gap-2 rounded-lg border border-[#E8E5DF] bg-white pl-4 pr-1 py-1.5 text-sm hover:bg-gray-50 transition-colors min-w-70"
          >
            <Search className="h-4 w-4 text-gray-400" />
            <span className="flex-1 text-left text-gray-400">Search</span>
            <kbd className="pointer-events-none flex h-6 select-none items-center rounded bg-gray-100 px-1.5 font-mono text-sm text-gray-500">
              ⌘+K
            </kbd>
          </button>

          {/* Notification bell */}
          <button
            onClick={() => {
              setShowNotificationModal(true);
              resetUnreadCount();
            }}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E5DF] hover:bg-gray-100 transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-700" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E5DF] hover:bg-gray-100 transition-colors"
          >
            <Settings className="h-5 w-5 text-gray-700" />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 mx-1" />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1 rounded-lg p-0.5 hover:bg-gray-100 transition-colors"
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
      </div>

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
