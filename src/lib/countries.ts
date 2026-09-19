import { supabase } from "./supabase";

export type CountryStat = { country_code: string; people: number; communities: number };

export const countries = [
  ["NG","Nigeria"],["US","United States"],["GB","United Kingdom"],["NL","Netherlands"],
  ["CA","Canada"],["DE","Germany"],["FR","France"],["ES","Spain"],["IN","India"],
  ["BR","Brazil"],["ZA","South Africa"],["AU","Australia"],["JP","Japan"],["SG","Singapore"],
] as const;

export async function getCountryStats(): Promise<CountryStat[]> {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const { data, error } = await supabase.from("profiles").select("country_code").eq("onboarding_complete", true);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) counts.set(row.country_code, (counts.get(row.country_code) ?? 0) + 1);
  return countries.map(([code]) => ({ country_code: code, people: counts.get(code) ?? 0, communities: 0 }));
}
