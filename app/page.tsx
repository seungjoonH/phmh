// 루트 — 홈으로 서버 리다이렉트
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/about/who-we-are");
}
