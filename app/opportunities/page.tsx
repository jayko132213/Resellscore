import { WeeklyOpportunities } from "@/components/weekly-opportunities";

export default function OpportunitiesPage() {
  return (
    <main className="shell py-10">
      <div className="max-w-3xl">
        <p className="inline-flex rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">Elite</p>
        <h1 className="mt-4 text-4xl font-bold">Tendances Elite</h1>
        <p className="mt-3 text-muted">
          Les categories qui montent selon la saison, la mode, le budget et la marge possible. Ici, pas de fausses annonces : tu vois quoi chercher, quoi verifier et comment revendre.
        </p>
      </div>
      <WeeklyOpportunities />
    </main>
  );
}
