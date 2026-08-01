import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/squishy-cart";
import { margin, marginRate, squishyProducts } from "@/lib/squishy-products";

export function generateStaticParams() {
  return squishyProducts.map((product) => ({ slug: product.slug }));
}

export default async function ProduitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = squishyProducts.find((item) => item.slug === slug);
  if (!product) notFound();

  return (
    <main className="min-h-screen bg-[#fff8fb] py-12 text-[#281c3d]">
      <div className="shell grid gap-8 lg:grid-cols-[0.9fr_1fr]">
        <div className="rounded-[34px] border border-[#ffd6ea] bg-white p-4 shadow-[0_24px_80px_rgba(255,111,177,0.16)]">
          <img src={product.image} alt="" className="aspect-square w-full rounded-[28px] object-cover" />
        </div>
        <section className="rounded-[34px] border border-[#ffd6ea] bg-white p-6 shadow-[0_24px_80px_rgba(45,226,197,0.12)]">
          <p className="text-sm font-black uppercase tracking-wide text-[#ff6fb1]">{product.category}</p>
          <h1 className="mt-2 text-4xl font-black">{product.name}</h1>
          <p className="mt-3 text-lg leading-8 text-[#6c5b7c]">{product.copy}</p>
          <div className="mt-6 flex flex-wrap items-end gap-4">
            <div>
              <p className="text-sm text-[#6c5b7c] line-through">{product.compareAt.toFixed(2)} EUR</p>
              <p className="text-4xl font-black">{product.price.toFixed(2)} EUR</p>
            </div>
            <AddToCartButton slug={product.slug} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Info label="Marge brute" value={`+${margin(product).toFixed(2)} EUR`} />
            <Info label="Taux marge" value={`${marginRate(product)}%`} />
            <Info label="Recherche CJ" value={product.cjKeyword} />
          </div>
          <div className="mt-6 rounded-[24px] bg-[#fff4bf] p-5">
            <p className="font-black">Pourquoi ca peut partir</p>
            <ul className="mt-3 grid gap-2 text-sm text-[#6c5b7c]">
              {product.bullets.map((bullet) => <li key={bullet}>- {bullet}</li>)}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[#ffd6ea] bg-[#fff8fb] p-4">
      <p className="text-xs font-black uppercase text-[#ff6fb1]">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}
