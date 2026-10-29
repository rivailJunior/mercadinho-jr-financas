import { z } from "zod";

/**
 * Your .env variables will be parsed here
 */
const envSchema = z.object({
  WELCOME_MESSAGE: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
