import LoginClient from "./LoginClient";

export default function Page({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next = searchParams?.next || "/catalog";
  return <LoginClient next={next} />;
}
