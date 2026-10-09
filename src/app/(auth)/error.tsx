"use client";

import { ErrorPantalla } from "@/components/layout/ErrorPantalla";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorPantalla error={error} retry={retry} variante="auth" />;
}
