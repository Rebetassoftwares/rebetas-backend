// components/MaintenanceScreen.jsx

export default function MaintenanceScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, #103b27 0%, #071f15 55%, #030d09 100%)",
        padding: "25px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Glow Effects */}
      <div
        style={{
          position: "absolute",
          width: "350px",
          height: "350px",
          background: "#16803c",
          filter: "blur(120px)",
          opacity: 0.25,
          top: "-100px",
          left: "-100px",
          borderRadius: "50%",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: "300px",
          height: "300px",
          background: "#22a06b",
          filter: "blur(120px)",
          opacity: 0.2,
          bottom: "-100px",
          right: "-100px",
          borderRadius: "50%",
        }}
      />

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "28px",
          padding: "55px 40px",
          textAlign: "center",
          color: "white",
          boxShadow: "0 25px 80px rgba(0,0,0,0.35)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "42px",
              fontWeight: "800",
              letterSpacing: "-1px",
            }}
          >
            SunStreamers
          </h1>

          <p
            style={{
              marginTop: "10px",
              color: "rgba(255,255,255,0.75)",
              fontSize: "15px",
            }}
          >
            AI-Powered Virtual Football Predictions
          </p>
        </div>

        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(34,160,107,0.15)",
            border: "1px solid rgba(34,160,107,0.3)",
            padding: "10px 18px",
            borderRadius: "999px",
            marginBottom: "30px",
            fontSize: "14px",
            color: "#86efac",
            fontWeight: "600",
          }}
        >
          🚀 Major Platform Upgrade Extended
        </div>

        {/* Main Heading */}
        <h2
          style={{
            fontSize: "40px",
            lineHeight: "1.15",
            marginBottom: "22px",
            fontWeight: "800",
            letterSpacing: "-1px",
          }}
        >
          We’re Building Something
          <span
            style={{
              background: "linear-gradient(135deg, #4ade80, #ffffff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {" "}
            Better For You
          </span>
        </h2>

        {/* Message */}
        <p
          style={{
            fontSize: "17px",
            lineHeight: "1.9",
            color: "rgba(255,255,255,0.78)",
            maxWidth: "560px",
            margin: "0 auto",
          }}
        >
          You asked. We listened.
          <br />
          <br />
          SunStreamers is currently being upgraded with powerful new features
          designed to help you earn more consistently, reduce unnecessary risk,
          and enjoy a smoother experience with less stress.
          <br />
          <br />
          This temporary downtime is part of a major improvement focused
          entirely on giving you smarter tools, faster performance, and better
          results.
        </p>

        {/* Time Box */}
        <div
          style={{
            marginTop: "38px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            padding: "22px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "rgba(255,255,255,0.65)",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Estimated Downtime
          </p>

          <h3
            style={{
              margin: 0,
              fontSize: "24px",
              color: "#86efac",
              fontWeight: "800",
              lineHeight: "1.5",
            }}
          >
            May 26, 2026 — 5:00 AM
            <br />
            to
            <br />
            May 28, 2026 — 2:00 AM
          </h3>
        </div>

        {/* Bottom Reassurance */}
        <p
          style={{
            marginTop: "35px",
            fontSize: "15px",
            color: "rgba(255,255,255,0.7)",
            lineHeight: "1.8",
          }}
        >
          We’ll be back shortly — stronger, smarter, and better optimized to
          help you win.
        </p>

        {/* Footer */}
        <div
          style={{
            marginTop: "40px",
            paddingTop: "25px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontSize: "13px",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          © {new Date().getFullYear()} SunStreamers. All rights reserved.
        </div>
      </div>
    </div>
  );
}
