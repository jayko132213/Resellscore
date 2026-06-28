import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-accent text-ink hover:bg-emerald-300",
        variant === "secondary" && "border border-white/15 bg-white/10 text-white hover:bg-white/15",
        variant === "ghost" && "text-white hover:bg-white/10",
        className
      )}
      {...props}
    />
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition",
        variant === "primary" ? "bg-accent text-ink hover:bg-emerald-300" : "border border-white/15 bg-white/10 text-white hover:bg-white/15"
      )}
    >
      {children}
    </Link>
  );
}
