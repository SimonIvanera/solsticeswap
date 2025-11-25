"use client";

import { OrderList } from "@/components/OrderList";

export default function OrdersPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">
          Your Orders
        </h1>
        <p className="text-foreground/80 text-lg">
          View and manage your encrypted orders
        </p>
      </div>
      <OrderList />
    </div>
  );
}

