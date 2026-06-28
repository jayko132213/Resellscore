import { ProfileEditor } from "@/components/profile-editor";

export default function ProfilePage() {
  return (
    <main className="shell py-10">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold">Profil</h1>
        <p className="mt-2 text-muted">Gère ton profil, ta photo et ton abonnement de test.</p>
      </div>
      <ProfileEditor />
    </main>
  );
}
