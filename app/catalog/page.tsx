import CatalogClient from "./CatalogClient";

export default function Page({
  searchParams,
}: {
  searchParams?: { chat?: string };
}) {
  const chatId = searchParams?.chat ?? "default";
  return <CatalogClient chatId={chatId} />;
}
