"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-brand-navy dark:text-white">Your Cart is Empty</h1>
        <p className="text-gray-500 dark:text-gray-400">Browse our products and add items to your cart to place an order.</p>
        <Link href="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold text-brand-navy dark:text-white">Your Cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-4 p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-brand-light dark:bg-gray-800">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full rounded-md object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-brand-navy/20 dark:text-white/20">{item.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-brand-navy dark:text-white">{item.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Rs {item.price.toFixed(2)} / {item.unit}</p>
                </div>
                <div className="flex items-center rounded-md border border-gray-300 dark:border-gray-600">
                  <button
                    className="px-2.5 py-1.5 text-brand-navy dark:text-white"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm dark:text-gray-100">{item.quantity}</span>
                  <button
                    className="px-2.5 py-1.5 text-brand-navy dark:text-white"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <span className="w-24 text-right font-semibold text-brand-navy dark:text-white">
                  Rs {(item.price * item.quantity).toFixed(2)}
                </span>
                <button
                  aria-label="Remove item"
                  onClick={() => removeItem(item.productId)}
                  className="text-gray-400 hover:text-brand-red"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <button onClick={clearCart} className="mt-4 text-sm text-gray-500 hover:text-brand-red dark:text-gray-400">
            Clear Cart
          </button>
        </div>

        <div className="card h-fit p-6">
          <h2 className="text-lg font-bold text-brand-navy dark:text-white">Order Summary</h2>
          <div className="mt-4 flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>Rs {subtotal.toFixed(2)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Final pricing &amp; delivery charges (if any) will be confirmed by the shop.
          </p>
          <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-base font-bold text-brand-navy dark:border-gray-700 dark:text-white">
            <span>Total</span>
            <span>Rs {subtotal.toFixed(2)}</span>
          </div>
          <Link href="/checkout" className="btn-primary mt-6 w-full">
            Proceed to Checkout
          </Link>
          <Link href="/products" className="btn-secondary mt-3 w-full">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
