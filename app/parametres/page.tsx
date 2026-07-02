import Link from "next/link";
import { CreditCard, Settings, ShieldCheck, Smartphone, UserCircle } from "lucide-react";

const settings = [
  {
    href: "/profile",
    title: "Profil",
    text: "Pseudo, photo, abonnement et statut du compte.",
    icon: <UserCircle size={20} />
  },
  {
    href: "/pricing",
    title: "Abonnement",
    text: "Voir les plans, quotas et accès premium.",
    icon: <CreditCard size={20} />
  },
  {
    href: "/login",
    title: "Interface appareil",
    text: "Choisir iPhone, Samsung ou PC pour adapter le menu.",
    icon: <Smartphone size={20} />
  },
  {
    href: "/conditions",
    title: "Sécurité",
    text: "Conditions, confidentialité et règles du service.",
    icon: <ShieldCheck size={20} />
  }
];

export default function ParametresPage() {
  return (
    <main className="shell py-10">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-muted">
          <Settings size={14} />
          Centre de contrôle
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Paramètres</h1>
        <p className="mt-3 leading-7 text-muted">
          Les réglages importants du compte au même endroit, pour éviter de chercher partout dans le site.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {settings.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-lg border border-white/10 bg-panel p-5 transition hover:border-accent/35 hover:bg-white/[0.04]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-md bg-accent/10 text-accent group-hover:bg-accent group-hover:text-ink">
              {item.icon}
            </span>
            <h2 className="mt-4 text-xl font-black text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
