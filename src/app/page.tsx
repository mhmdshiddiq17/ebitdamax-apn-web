import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE } from "@/lib/constants";

export default async function Home() {
  const cookieStore = await cookies();
  redirect(cookieStore.has(ACCESS_COOKIE) ? "/dashboard" : "/login");
}
