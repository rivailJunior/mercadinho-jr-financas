import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center bg-app-bg px-5 shadow-2xl">
      <LoginForm />
    </main>
  );
}
