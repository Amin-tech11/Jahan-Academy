import { ImageResponse } from "next/og";
export const dynamic = "force-static";
export function GET() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "90px", background: "#071b3a", color: "#e1e6ee" }}><div style={{ display: "flex", fontSize: 80, fontWeight: 700 }}>Jahan Academy</div><div style={{ display: "flex", marginTop: 28, fontSize: 32 }}>Your international study journey</div><div style={{ display: "flex", marginTop: 64, fontSize: 24 }}>jahanacademi.ir</div></div>, { width: 1200, height: 630 });
}
