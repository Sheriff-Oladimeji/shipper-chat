"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Sparkles } from "lucide-react";
import { useUsers } from "@/hooks/use-users";

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isOnline: boolean;
}

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (userId: string) => void;
  isCreating?: boolean;
}

const SHIPPER_AI = {
  id: "shipper-ai",
  name: "Shipper AI",
  email: "AI Assistant",
  isOnline: true,
};

export function NewMessageDialog({
  open,
  onOpenChange,
  onSelectUser,
  isCreating = false,
}: NewMessageDialogProps) {
  const [search, setSearch] = useState("");
  const { users, isLoading } = useUsers();
  const router = useRouter();

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const showShipperAI =
    search === "" ||
    SHIPPER_AI.name.toLowerCase().includes(search.toLowerCase());

  const handleSelectShipperAI = () => {
    onOpenChange(false);
    router.push("/ai");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 && !showShipperAI ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="space-y-1">
                {/* Shipper AI at the top */}
                {showShipperAI && (
                  <button
                    onClick={handleSelectShipperAI}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted"
                  >
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary">
                      <Sparkles className="h-5 w-5 text-white" />
                      <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white bg-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{SHIPPER_AI.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {SHIPPER_AI.email}
                      </p>
                    </div>
                  </button>
                )}
                {/* Regular users */}
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => onSelectUser(user.id)}
                    disabled={isCreating}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <Avatar
                      src={user.image}
                      fallback={user.name}
                      showOnlineStatus
                      isOnline={user.isOnline}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    {isCreating && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
