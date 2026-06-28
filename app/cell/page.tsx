import { redirect } from "next/navigation";

export default async function CellPage({ searchParams }: { searchParams: Promise<{ item?: string }> }) {
  const { item } = await searchParams;
  redirect(item ? `/pre-achat?item=${encodeURIComponent(item)}` : "/pre-achat");
}
