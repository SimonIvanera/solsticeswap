import { OrderDetailClient } from "./OrderDetailClient";

// For static export, generateStaticParams must return at least one param
// that matches the dynamic segment [id]
export async function generateStaticParams() {
  // Return placeholder params for static generation
  // Pre-render pages for first 10 order IDs
  return Array.from({ length: 10 }, (_, i) => ({
    id: String(i + 1),
  }));
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailClient orderId={id} />;
}
