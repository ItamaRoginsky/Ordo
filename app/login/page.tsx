export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-page)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 340,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "44px 36px",
          textAlign: "center",
          boxShadow: "var(--card-shadow)",
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            fontFamily: "'Gelasio', serif",
            color: "var(--text-1)",
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}
        >
          Ordo
        </h1>

        <p
          style={{
            fontSize: 13,
            color: "var(--text-3)",
            margin: "0 0 36px",
            lineHeight: 1.5,
          }}
        >
          Your personal productivity OS
        </p>

        <a
          href="/auth/login"
          style={{
            display: "block",
            width: "100%",
            padding: "13px",
            borderRadius: 12,
            background: "var(--text-1)",
            color: "var(--bg-card)",
            fontWeight: 500,
            fontSize: 14,
            textDecoration: "none",
            textAlign: "center",
            letterSpacing: "-0.01em",
            boxSizing: "border-box",
          }}
        >
          Continue with Auth0
        </a>

        <p
          style={{
            fontSize: 11,
            color: "var(--text-4)",
            marginTop: 32,
            lineHeight: 1.6,
          }}
        >
          Access is by invitation only.
        </p>
      </div>
    </main>
  );
}
