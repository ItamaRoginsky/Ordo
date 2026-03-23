export default function LoginPage() {
  return (
    <div>
      <h1>Sign in to Ordo</h1>
      <a href="/auth/login">Login</a>
      <br />
      <a href="/auth/login?screen_hint=signup">Sign up</a>
    </div>
  );
}
