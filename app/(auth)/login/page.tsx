import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="shell py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Connexion</h1>
        <p className="mt-3 text-muted">Connecte-toi avec Google ou ton email.</p>
      </div>
      <AuthForm mode="login" />
      <p className="mt-5 text-center text-sm text-muted">Pas encore de compte ? <Link href="/signup" className="text-accent">Créer un compte</Link></p>
    </main>
  );
}
