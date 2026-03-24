export default function SuspendedPage() {
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
          maxWidth: 360,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "var(--card-shadow)",
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--sys-red)",
            margin: "0 0 12px",
          }}
        >
          Account Suspended
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-3)",
            margin: "0 0 28px",
            lineHeight: 1.6,
          }}
        >
          Your account has been suspended. Contact an administrator for
          assistance.
        </p>
        <a
          href="/auth/logout"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            borderRadius: 10,
            background: "var(--bg-active)",
            border: "1px solid var(--border)",
            color: "var(--text-2)",
            fontWeight: 500,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          Sign out
        </a>
      </div>
    </main>
  );
}
