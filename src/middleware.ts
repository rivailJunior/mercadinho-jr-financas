import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export const middleware = async (request: NextRequest) => updateSession(request);

export const config = {
  matcher: [
    /*
     * Run on every route except static assets, image optimization and
     * files with an extension (favicon, images, etc.).
     */
    "/((?!_next/static|_next/image|.*\\..*).*)",
  ],
};
