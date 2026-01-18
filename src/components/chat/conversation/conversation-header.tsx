"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, MoreVertical, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface ConversationHeaderProps {
  name: string;
  image?: string | null;
  isOnline?: boolean;
  onBack?: () => void;
}

export function ConversationHeader({
  name,
  image,
  isOnline = false,
  onBack,
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
        <Avatar
          src={image}
          fallback={name}
          showOnlineStatus
          isOnline={isOnline}
        />
        <div>
          <h2 className="font-semibold text-foreground">{name}</h2>
          <p className="text-sm text-muted-foreground">
            {isOnline ? (
              <span className="text-green-500">Online</span>
            ) : (
              "Offline"
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
