"use client";

import { useQuery } from "@tanstack/react-query";
import type { User } from "@/types";

async function fetchUsers(): Promise<User[]> {
  const response = await fetch("/api/users");
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  const data = await response.json();
  return data.data;
}

export function useUsers() {
  const {
    data: users = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  return {
    users,
    isLoading,
    error,
    refetch,
  };
}
