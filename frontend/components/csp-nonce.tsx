"use client";

import { createContext, useContext, type ReactNode } from "react";

const NonceContext = createContext<string | undefined>(undefined);
export function CspNonceProvider({ nonce, children }: { nonce?: string; children: ReactNode }) {
  return <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>;
}
export function useCspNonce() { return useContext(NonceContext); }
export function JsonLd({ data }: { data: unknown }) {
  const nonce = useCspNonce();
  return <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll("<", "\\u003c") }} />;
}
