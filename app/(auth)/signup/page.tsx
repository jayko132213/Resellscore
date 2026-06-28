import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <main className="shell py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Créer un compte</h1>
        <p className="mt-3 text-muted">Même interface que connexion, avec Google ou email.</p>
      </div>
      <AuthForm mode="signup" />
      <p className="mt-5 text-center text-sm text-muted">Déjà inscrit ? <Link href="/login" className="text-accent">Se connecter</Link></p>
    </main>
  );
}
