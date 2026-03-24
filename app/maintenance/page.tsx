export default function MaintenancePage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "var(--bg-page)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: 360,
        padding: "0 24px",
      }}>
        <p style={{ fontSize: 32, marginBottom: 16 }}>🔧</p>
        <h1 style={{
          fontSize: 22,
          fontWeight: 600,
          color: "var(--text-1)",
          letterSpacing: "-0.01em",
          marginBottom: 8,
        }}>
          Under maintenance
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6 }}>
          Ordo is currently undergoing maintenance. Check back soon.
        </p>
      </div>
    </main>
  );
}
