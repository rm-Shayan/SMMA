"use client";

import { useState } from "react";
import { creditsApi } from "../api/credits.api";
import toast from "react-hot-toast";

export function useCheckoutPack() {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const checkoutPack = async (packId: string) => {
    setIsCheckingOut(true);
    try {
      const res = await creditsApi.createCheckoutSession(packId);
      if (res?.checkout_url) {
        window.location.href = res.checkout_url;
      } else {
        toast.success("Checkout session created!");
      }
      return res;
    } catch {
      toast.error("Failed to initialize Stripe checkout session");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return { isCheckingOut, checkoutPack };
}
