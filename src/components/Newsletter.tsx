"use client";

import { useState, FormEvent } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <section className="w-full py-16 sm:py-20 bg-neutral-50 border-b border-neutral-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="text-[11px] font-bold tracking-[0.25em] text-neutral-400 uppercase block mb-2">
          JOIN THE SYNDICATE
        </span>

        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-black">
          UNLOCK EARLY ACCESS
        </h2>

        <p className="mt-3 text-sm text-neutral-600 max-w-md mx-auto tracking-tight">
          Subscribe to receive secret capsule drop links, private archive access, and 10% off your inaugural DOMPI order.
        </p>

        {subscribed ? (
          <div className="mt-8 p-4 bg-white border border-neutral-300 rounded-[8px] text-xs font-bold uppercase tracking-wider text-black">
            Thank you for joining. Welcome to DOMPI.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 bg-white border border-neutral-300 rounded-[8px] px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-black text-white font-bold text-xs uppercase tracking-widest rounded-[8px] hover:bg-neutral-800 transition-colors"
            >
              SUBSCRIBE
            </button>
          </form>
        )}

        <p className="mt-4 text-[11px] text-neutral-400 tracking-tight">
          Strict privacy. No spam. You can unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}
