"use server";

import { createSupabaseClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signIn = async (input: {
  email: string;
  password: string;
}): Promise<{ ok: boolean; error?: string }> => {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "E-mail ou senha inválidos." };

  const supabase = await createSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: "E-mail ou senha incorretos." };
  return { ok: true };
};

export const signOut = async () => {
  const supabase = await createSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
};
