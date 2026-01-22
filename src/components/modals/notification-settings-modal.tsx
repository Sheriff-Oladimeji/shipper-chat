"use client";

import { X, Bell, BellOff, Volume2, VolumeX, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useChatStore } from "@/stores/chat-store";

interface NotificationSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationSettingsModal({ open, onOpenChange }: NotificationSettingsModalProps) {
  const { notificationSettings, setNotificationSettings } = useChatStore();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Notification Settings</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* In-app notifications toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {notificationSettings.inAppEnabled ? (
                <MessageSquare className="h-5 w-5 text-primary" />
              ) : (
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">In-App Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Show toast notifications for new messages
                </p>
              </div>
            </div>
            <Switch
              checked={notificationSettings.inAppEnabled}
              onCheckedChange={(checked) => setNotificationSettings({ inAppEnabled: checked })}
            />
          </div>

          {/* Sound toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {notificationSettings.soundEnabled ? (
                <Volume2 className="h-5 w-5 text-primary" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Sound</p>
                <p className="text-sm text-muted-foreground">
                  Play sound for new messages
                </p>
              </div>
            </div>
            <Switch
              checked={notificationSettings.soundEnabled}
              onCheckedChange={(checked) => setNotificationSettings({ soundEnabled: checked })}
            />
          </div>

          {/* Desktop notifications toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {notificationSettings.desktopEnabled ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Desktop Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Browser notifications when app is minimized
                </p>
              </div>
            </div>
            <Switch
              checked={notificationSettings.desktopEnabled}
              onCheckedChange={(checked) => {
                if (checked && "Notification" in window) {
                  Notification.requestPermission().then((permission) => {
                    if (permission === "granted") {
                      setNotificationSettings({ desktopEnabled: true });
                    }
                  });
                } else {
                  setNotificationSettings({ desktopEnabled: checked });
                }
              }}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-primary hover:bg-primary/90"
          >
            Done
          </Button>
        </div>
      </div>
    </>
  );
}
