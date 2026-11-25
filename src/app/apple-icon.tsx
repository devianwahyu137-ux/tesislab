import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#060B11",
          borderRadius: 40,
          border: "4px solid rgba(16, 185, 129, 0.45)",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontFamily: "Georgia, serif",
            fontSize: 108,
            fontWeight: 700,
            color: "#F8FAFC",
            letterSpacing: "-0.04em",
          }}
        >
          <span>T</span>
          <span style={{ color: "#10B981", marginLeft: 4 }}>.</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
