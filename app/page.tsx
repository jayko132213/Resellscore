import Link from "next/link";
import { Gift, Heart, PackageCheck, Sparkles, Truck } from "lucide-react";
import { AddToCartButton } from "@/components/squishy-cart";
import { margin, marginRate, squishyProducts } from "@/lib/squishy-products";

export default function HomePage() {
  const featured = squishyProducts.slice(0, 4);

  return (
    <main className="bg-[#fff8fb] text-[#281c3d]">
      <section className="relative overflow-hidden border-b border-[#ffd6ea] bg-[radial-gradient(circle_at_15%_12%,#ffb3d9_0,transparent_25%),radial-gradient(circle_at_86%_18%,#8df7e4_0,transparent_24%),radial-gradient(circle_at_55%_82%,#fff59d_0,transparent_28%),#fff8fb]">
        <div className="shell grid min-h-[calc(100vh-64px)] items-center gap-10 py-12 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <p className="inline-flex rounded-full border border-[#ffb3d9] bg-white/70 px-4 py-2 text-sm font-black text-[#ff4fa0] shadow-[0_12px_35px_rgba(255,111,177,0.16)]">
              Boutique kawaii anti-stress
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.95] tracking-normal md:text-7xl">
              Squishy <span className="text-[#ff6fb1]">Need</span> You
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6c5b7c] md:text-xl">
              Des squishies doux, colorés et trop satisfaisants pour les cadeaux, les bureaux, les trousses et les pauses anti-stress.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/boutique" className="inline-flex h-12 items-center justify-center rounded-full bg-[#ff6fb1] px-6 text-sm font-black text-white shadow-[0_18px_40px_rgba(255,111,177,0.28)]">
                Voir les squishies
              </Link>
              <Link href="/admin-shop" className="inline-flex h-12 items-center justify-center rounded-full border border-[#2de2c5] bg-white/70 px-6 text-sm font-black text-[#281c3d]">
                Panel boutique
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {featured.map((product) => (
              <article key={product.slug} className="rounded-[30px] border border-white bg-white/78 p-4 shadow-[0_24px_70px_rgba(255,111,177,0.18)] backdrop-blur">
                <img src={product.image} alt="" className="aspect-square w-full rounded-[24px] object-cover" />
                <p className="mt-3 text-xs font-black uppercase text-[#ff6fb1]">{product.category}</p>
                <h2 className="mt-1 text-lg font-black">{product.name}</h2>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#6c5b7c] line-through">{product.compareAt.toFixed(2)} EUR</p>
                    <p className="text-2xl font-black">{product.price.toFixed(2)} EUR</p>
                  </div>
                  <AddToCartButton slug={product.slug} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="shell py-16">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { Icon: Sparkles, title: "Visuels cadeau", text: "Produits choisis pour etre compris en une seconde." },
            { Icon: Heart, title: "Achat impulsif", text: "Prix ronds, couleurs fortes, fiches courtes et rassurantes." },
            { Icon: Truck, title: "Fournisseur CJ", text: "API catalogue et commandes prete a brancher." },
            { Icon: PackageCheck, title: "Marge suivie", text: "Prix d'achat, prix public et marge visibles en admin." }
          ].map(({ Icon, title, text }) => (
            <article key={title} className="rounded-[24px] border border-[#ffd6ea] bg-white p-5 shadow-[0_18px_55px_rgba(45,226,197,0.1)]">
              <Icon className="text-[#ff6fb1]" />
              <h2 className="mt-4 font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6c5b7c]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell pb-20">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#ff6fb1]">Catalogue pret</p>
            <h2 className="mt-1 text-3xl font-black">Produits a lancer maintenant</h2>
          </div>
          <Link href="/boutique" className="text-sm font-black text-[#0fb8a1]">Tout voir</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {squishyProducts.map((product) => (
            <article key={product.slug} className="rounded-[28px] border border-[#ffd6ea] bg-white p-4 shadow-[0_24px_70px_rgba(255,111,177,0.12)]">
              <Link href={`/produit/${product.slug}`}>
                <img src={product.image} alt="" className="aspect-square w-full rounded-[24px] object-cover" />
              </Link>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-[#ff6fb1]">{product.mood}</p>
                  <h3 className="mt-1 text-xl font-black">{product.name}</h3>
                </div>
                <span className="rounded-full bg-[#d6fff6] px-3 py-1 text-xs font-black text-[#138878]">
                  {marginRate(product)}% marge
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#6c5b7c]">{product.tagline}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-[#6c5b7c]">Prix public</p>
                  <p className="text-2xl font-black">{product.price.toFixed(2)} EUR</p>
                </div>
                <AddToCartButton slug={product.slug} />
              </div>
              <p className="mt-3 text-xs font-bold text-[#8b7a98]">Marge brute cible: +{margin(product).toFixed(2)} EUR</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#ffd6ea] bg-[#281c3d] py-16 text-white">
        <div className="shell grid gap-8 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-[#8df7e4]">
              <Gift size={16} />
              Dropshipping propre
            </p>
            <h2 className="mt-5 text-3xl font-black">CJdropshipping est le fournisseur prevu.</h2>
          </div>
          <div className="text-sm leading-7 text-white/75">
            Le site est pret pour recevoir une cle API CJ. Sans cle, il affiche le catalogue de lancement. Avec la cle, on peut chercher les vrais produits, verifier les prix fournisseur et preparer les commandes automatiquement apres paiement.
          </div>
        </div>
      </section>
    </main>
  );
}
