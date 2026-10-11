import { redirect } from "next/navigation";

export default function RootPage() {
  redirect(process.env.JAHAN_PANEL === "destinationS" ? "/fa/countries" : "/fa");
}
