"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";

type Props = {
  productId: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl?: string | null;
};

export default function AddToCartBox({ productId, name, price, unit, stock, imageUrl }: Props) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  const handleAdd = () => {
    addItem({ productId, name, price, unit, imageUrl }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-md border border-gray-300 dark:border-gray-600">
        <button
          className="px-3 py-2 text-lg text-brand-navy disabled:opacity-40 dark:text-white"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
        >
          -
        </button>
        <span className="w-10 text-center font-medium dark:text-white">{qty}</span>
        <button className="px-3 py-2 text-lg text-brand-navy dark:text-white" onClick={() => setQty((q) => q + 1)}>
          +
        </button>
      </div>
      <button disabled={stock <= 0} onClick={handleAdd} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
        {added ? "Added!" : "Add to Cart"}
      </button>
      <button
        disabled={stock <= 0}
        onClick={() => {
          handleAdd();
          router.push("/cart");
        }}
        className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
      >
        Buy Now
      </button>
    </div>
  );
}
