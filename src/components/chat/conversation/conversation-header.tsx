"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Phone, Video, MoreVertical, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface ConversationHeaderProps {
  name: string;
  image?: string | null;
  isOnline?: boolean;
  lastSeenAt?: Date | string | null;
  onBack?: () => void;
  onOpenContactInfo?: () => void;
  onSearch?: () => void;
}

export function ConversationHeader({
  name,
  image,
  isOnline = false,
  lastSeenAt,
  onBack,
  onOpenContactInfo,
  onSearch,
}: ConversationHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/");
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b bg-card">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <button
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          onClick={onOpenContactInfo}
        >
          <Avatar
            src={image}
            fallback={name}
            showOnlineStatus
            isOnline={isOnline}
          />
          <div className="text-left">
            <h2 className="font-semibold text-foreground">{name}</h2>
            <p className="text-sm text-muted-foreground">
              {isOnline ? (
                <span className="text-primary">Online</span>
              ) : lastSeenAt ? (
                `last seen ${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`
              ) : (
                "Offline"
              )}
            </p>
          </div>
        </button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onSearch} className="h-8 w-8 rounded-lg border">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg border">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg border">
          <Video className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onOpenContactInfo} className="h-8 w-8 rounded-lg border">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
