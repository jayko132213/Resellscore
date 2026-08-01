import { ExternalLink, KeyRound, PackageSearch } from "lucide-react";
import { margin, marginRate, squishyProducts } from "@/lib/squishy-products";

export default function AdminShopPage() {
  return (
    <main className="min-h-screen bg-[#fff8fb] py-12 text-[#281c3d]">
      <div className="shell">
        <div className="rounded-[32px] border border-[#ffd6ea] bg-white p-6 shadow-[0_24px_80px_rgba(255,111,177,0.14)]">
          <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#ff6fb1]">
            <KeyRound size={16} />
            Panel boutique
          </p>
          <h1 className="mt-2 text-4xl font-black">Produits et fournisseur CJ</h1>
          <p className="mt-3 max-w-3xl text-[#6c5b7c]">
            Les produits ci-dessous sont le catalogue de lancement. Ajoute ensuite CJ_ACCESS_TOKEN dans Vercel pour connecter la recherche fournisseur et la creation de commande.
          </p>
        </div>

        <section className="mt-6 rounded-[28px] border border-[#ffd6ea] bg-white p-5">
          <p className="flex items-center gap-2 font-black">
            <PackageSearch size={18} className="text-[#ff6fb1]" />
            Recherches fournisseur pretes
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {squishyProducts.map((product) => (
              <article key={product.slug} className="rounded-[22px] border border-[#ffd6ea] bg-[#fff8fb] p-4">
                <div className="flex items-start gap-3">
                  <img src={product.image} alt="" className="h-20 w-20 rounded-[18px] object-cover" />
                  <div>
                    <p className="text-sm font-black">{product.name}</p>
                    <p className="mt-1 text-xs text-[#6c5b7c]">Mot-cle CJ: {product.cjKeyword}</p>
                    <p className="mt-2 text-xs font-black text-[#138878]">Cout {product.cost.toFixed(2)} EUR / Vente {product.price.toFixed(2)} EUR / +{margin(product).toFixed(2)} EUR ({marginRate(product)}%)</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-[#ffd6ea] bg-[#281c3d] p-5 text-white">
          <p className="font-black">API prevue</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Endpoint title="Chercher produits" path="/api/supplier/cj/products" />
            <Endpoint title="Creer commande" path="/api/supplier/cj/orders" />
            <Endpoint title="Docs CJ" path="https://developers.cjdropshipping.com/en/api/api2/" external />
          </div>
        </section>
      </div>
    </main>
  );
}

function Endpoint({ title, path, external }: { title: string; path: string; external?: boolean }) {
  return (
    <a href={path} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="rounded-[20px] border border-white/10 bg-white/10 p-4">
      <p className="text-sm font-black">{title}</p>
      <p className="mt-2 flex items-center gap-2 text-xs text-white/70">
        {path}
        {external ? <ExternalLink size={13} /> : null}
      </p>
    </a>
  );
}
