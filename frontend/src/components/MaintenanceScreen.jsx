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
        background: "#f4f6fb",
        padding: "20px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          width: "100%",
          background: "#ffffff",
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: "0 15px 40px rgba(0,0,0,0.08)",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: "linear-gradient(135deg, #6c2bd9, #a855f7)",
            padding: "35px 25px",
            textAlign: "center",
            color: "white",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              fontWeight: "700",
            }}
          >
            Rebetas
          </h1>

          <p
            style={{
              marginTop: "10px",
              fontSize: "14px",
              opacity: 0.95,
            }}
          >
            AI-Powered Virtual Football Predictions
          </p>
        </div>

        {/* BODY */}
        <div
          style={{
            padding: "40px 30px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "60px",
              marginBottom: "15px",
            }}
          >
            ⚙️
          </div>

          <h2
            style={{
              marginBottom: "15px",
              color: "#222",
            }}
          >
            Scheduled Maintenance
          </h2>

          <p
            style={{
              color: "#666",
              fontSize: "15px",
              lineHeight: "1.7",
            }}
          >
            Rebetas is currently undergoing a scheduled system upgrade to
            improve performance, stability, and your overall experience.
          </p>

          <div
            style={{
              marginTop: "25px",
              background: "#f3e8ff",
              borderLeft: "5px solid #6c2bd9",
              padding: "18px",
              borderRadius: "10px",
              textAlign: "left",
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: "600",
                color: "#333",
              }}
            >
              Downtime Period
            </p>

            <p
              style={{
                marginTop: "8px",
                marginBottom: 0,
                color: "#6c2bd9",
                fontWeight: "700",
              }}
            >
              5:00 AM today → 5:00 AM tomorrow
            </p>
          </div>

          <p
            style={{
              marginTop: "28px",
              fontSize: "14px",
              color: "#888",
            }}
          >
            We sincerely apologize for the inconvenience and appreciate your
            patience.
          </p>
        </div>

        {/* FOOTER */}
        <div
          style={{
            background: "#fafafa",
            padding: "18px",
            textAlign: "center",
            fontSize: "12px",
            color: "#999",
          }}
        >
          © {new Date().getFullYear()} Rebetas. All rights reserved.
        </div>
      </div>
    </div>
  );
}
