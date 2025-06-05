import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0, // 항상 최신 상태 확인
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // user가 존재하면 인증됨, null이면 인증되지 않음
  const isAuthenticated = !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}