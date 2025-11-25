"use client";

import { OrderForm } from "@/components/OrderForm";

export default function SwapPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">
          Create Order
        </h1>
        <p className="text-foreground/80 text-lg">
          Create an encrypted order with your desired parameters
        </p>
      </div>
      <div className="bg-white rounded-2xl border-2 border-border/60 shadow-lg p-6 md:p-8">
        <OrderForm />
      </div>
    </div>
  );
}

