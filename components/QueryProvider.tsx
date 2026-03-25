"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,          // data fresh for 60s — no refetch on re-mount
            gcTime: 10 * 60_000,        // keep unused cache 10 min
            refetchOnWindowFocus: false, // don't refetch when tab regains focus
            refetchOnReconnect: false,   // don't refetch on network reconnect
            retry: 1,                   // one retry on failure, not three
          },
        },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
