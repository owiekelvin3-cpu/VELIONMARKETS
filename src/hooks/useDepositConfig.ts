import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDepositConfig, type DepositPlatformConfig } from "@/lib/deposit-config";

export const DEPOSIT_CONFIG_QUERY_KEY = ["deposit-config"] as const;

export function useDepositConfig() {
  return useQuery({
    queryKey: DEPOSIT_CONFIG_QUERY_KEY,
    queryFn: fetchDepositConfig,
    staleTime: 60_000,
  });
}

export function useInvalidateDepositConfig() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: DEPOSIT_CONFIG_QUERY_KEY });
}

export type { DepositPlatformConfig };
