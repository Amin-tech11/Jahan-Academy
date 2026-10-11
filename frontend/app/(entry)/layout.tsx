import type { ReactNode } from "react";
import { PublicDocument } from "@/components/public-document";
export default function Layout({ children }: { children: ReactNode }) { return <PublicDocument locale="fa">{children}</PublicDocument>; }
