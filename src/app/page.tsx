import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/constants";

export default async function Home() {
  const cookieStore = await cookies();
  redirect(cookieStore.has(SESSION_COOKIE) ? "/dashboard" : "/login");
}
