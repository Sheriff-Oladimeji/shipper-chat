"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import type { User } from "@/types";

async function fetchCurrentUser(): Promise<User> {
  const response = await fetch("/api/auth/me");
  if (!response.ok) {
    throw new Error("Not authenticated");
  }
  const data = await response.json();
  return data.data;
}

async function logoutUser(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setCurrentUser } = useChatStore();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update store when user changes - use useEffect to avoid render loop
  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user, setCurrentUser]);

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      setCurrentUser(null);
      queryClient.clear();
      router.push("/login");
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
