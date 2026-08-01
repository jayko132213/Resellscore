import Link from "next/link";
import { AddToCartButton } from "@/components/squishy-cart";
import { marginRate, squishyProducts } from "@/lib/squishy-products";

export default function BoutiquePage() {
  const categories = Array.from(new Set(squishyProducts.map((product) => product.category)));

  return (
    <main className="min-h-screen bg-[#fff8fb] py-12 text-[#281c3d]">
      <div className="shell">
        <div className="rounded-[32px] border border-[#ffd6ea] bg-white p-6 shadow-[0_24px_80px_rgba(255,111,177,0.14)]">
          <p className="text-sm font-black uppercase tracking-wide text-[#ff6fb1]">Boutique</p>
          <h1 className="mt-2 text-4xl font-black">Tous les squishies</h1>
          <p className="mt-3 max-w-2xl text-[#6c5b7c]">Dumplings, animaux, jelly toys et packs cadeaux. Le catalogue est pret pour etre remplace par les vrais produits CJ quand la cle API est ajoutee.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category} className="rounded-full bg-[#d6fff6] px-3 py-1 text-xs font-black text-[#138878]">{category}</span>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {squishyProducts.map((product) => (
            <article key={product.slug} className="rounded-[28px] border border-[#ffd6ea] bg-white p-4 shadow-[0_20px_70px_rgba(45,226,197,0.1)]">
              <Link href={`/produit/${product.slug}`}>
                <img src={product.image} alt="" className="aspect-square w-full rounded-[24px] object-cover" />
              </Link>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-[#ff6fb1]">{product.category}</p>
                  <h2 className="mt-1 text-xl font-black">{product.name}</h2>
                </div>
                <span className="rounded-full bg-[#fff4bf] px-3 py-1 text-xs font-black">{marginRate(product)}%</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#6c5b7c]">{product.copy}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-2xl font-black">{product.price.toFixed(2)} EUR</p>
                <AddToCartButton slug={product.slug} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
