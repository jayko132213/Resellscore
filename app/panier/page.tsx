import { CartView } from "@/components/squishy-cart";

export default function PanierPage() {
  return (
    <main className="min-h-screen bg-[#fff8fb] py-12 text-[#281c3d]">
      <div className="shell">
        <p className="text-sm font-black uppercase tracking-wide text-[#ff6fb1]">Panier</p>
        <h1 className="mt-2 text-4xl font-black">Ta commande</h1>
        <div className="mt-8">
          <CartView />
        </div>
      </div>
    </main>
  );
}
