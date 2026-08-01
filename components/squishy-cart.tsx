"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { squishyProducts } from "@/lib/squishy-products";

type Cart = Record<string, number>;

const cartKey = "squishy_need_you_cart";

function readCart(): Cart {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(cartKey) || "{}") as Cart;
  } catch {
    return {};
  }
}

function saveCart(cart: Cart) {
  localStorage.setItem(cartKey, JSON.stringify(cart));
  window.dispatchEvent(new Event("squishy-cart-updated"));
}

export function AddToCartButton({ slug }: { slug: string }) {
  const [added, setAdded] = useState(false);

  function add() {
    const cart = readCart();
    cart[slug] = (cart[slug] || 0) + 1;
    saveCart(cart);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={add}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#ff6fb1] px-5 text-sm font-black text-white shadow-[0_16px_35px_rgba(255,111,177,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ff4fa0]"
    >
      <ShoppingBag size={17} />
      {added ? "Ajoute" : "Ajouter au panier"}
    </button>
  );
}

export function CartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function refresh() {
      setCount(Object.values(readCart()).reduce((total, qty) => total + qty, 0));
    }
    refresh();
    window.addEventListener("squishy-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("squishy-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <Link href="/panier" className="relative inline-flex h-10 items-center gap-2 rounded-full bg-[#2de2c5] px-4 text-sm font-black text-[#281c3d]">
      <ShoppingBag size={17} />
      Panier
      {count > 0 ? <span className="rounded-full bg-white px-2 py-0.5 text-xs">{count}</span> : null}
    </Link>
  );
}

export function CartView() {
  const [cart, setCart] = useState<Cart>({});

  useEffect(() => {
    setCart(readCart());
  }, []);

  function update(slug: string, qty: number) {
    const next = { ...cart };
    if (qty <= 0) delete next[slug];
    else next[slug] = qty;
    setCart(next);
    saveCart(next);
  }

  const rows = squishyProducts
    .filter((product) => cart[product.slug])
    .map((product) => ({ product, qty: cart[product.slug] }));

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + row.product.price * row.qty, 0),
    [rows]
  );

  if (rows.length === 0) {
    return (
      <div className="rounded-[28px] border border-[#ffd6ea] bg-white/80 p-8 text-center shadow-[0_24px_80px_rgba(255,111,177,0.16)]">
        <p className="text-2xl font-black text-[#281c3d]">Ton panier est vide</p>
        <p className="mt-2 text-[#6c5b7c]">Ajoute quelques squishies avant de commander.</p>
        <Link href="/boutique" className="mt-5 inline-flex rounded-full bg-[#ff6fb1] px-5 py-3 text-sm font-black text-white">
          Voir la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4">
        {rows.map(({ product, qty }) => (
          <article key={product.slug} className="grid gap-4 rounded-[26px] border border-[#ffd6ea] bg-white/85 p-4 shadow-[0_20px_60px_rgba(45,226,197,0.12)] sm:grid-cols-[130px_1fr]">
            <img src={product.image} alt="" className="h-32 w-full rounded-[22px] object-cover" />
            <div className="flex flex-col justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#ff6fb1]">{product.category}</p>
                <h2 className="mt-1 text-xl font-black text-[#281c3d]">{product.name}</h2>
                <p className="mt-1 text-sm text-[#6c5b7c]">{product.tagline}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-black text-[#281c3d]">{product.price.toFixed(2)} EUR</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => update(product.slug, qty - 1)} className="grid h-9 w-9 place-items-center rounded-full bg-[#ffe4f1] text-[#281c3d]">
                    <Minus size={15} />
                  </button>
                  <span className="w-8 text-center font-black text-[#281c3d]">{qty}</span>
                  <button type="button" onClick={() => update(product.slug, qty + 1)} className="grid h-9 w-9 place-items-center rounded-full bg-[#d6fff6] text-[#281c3d]">
                    <Plus size={15} />
                  </button>
                  <button type="button" onClick={() => update(product.slug, 0)} className="grid h-9 w-9 place-items-center rounded-full bg-[#fff4bf] text-[#281c3d]">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      <aside className="h-fit rounded-[28px] border border-[#ffd6ea] bg-white/90 p-6 shadow-[0_24px_80px_rgba(255,111,177,0.16)]">
        <p className="text-sm font-black uppercase tracking-wide text-[#ff6fb1]">Commande</p>
        <div className="mt-4 flex justify-between text-lg font-black text-[#281c3d]">
          <span>Total</span>
          <span>{total.toFixed(2)} EUR</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#6c5b7c]">Pour l'instant, le bouton cree une demande de commande. Quand CJ est branche, on envoie automatiquement la commande fournisseur.</p>
        <button type="button" className="mt-5 w-full rounded-full bg-[#2de2c5] px-5 py-3 text-sm font-black text-[#281c3d]">
          Commander
        </button>
      </aside>
    </div>
  );
}
