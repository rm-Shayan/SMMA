"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAppDispatch } from "@/redux/hooks";
import { fetchCurrentUser, hydrateFromStorage, logout } from "@/redux/slices/authSlice";
import { setUnauthorizedHandler } from "@/services/api";

export default function AuthInitializer() {
 const dispatch = useAppDispatch();
 const router = useRouter();

 useEffect(() => {
  // 401 from any API call → drop redux session and navigate with the router
  // (registered here because api.ts lives outside React).
  setUnauthorizedHandler(() => {
    dispatch(logout());
    const { pathname, search } = window.location;
    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname + search)}` : "";
    router.replace(`/login${next}`);
  });

  const token = Cookies.get("styre.token") || Cookies.get("smma.token");
  dispatch(hydrateFromStorage());
  if (token) {
    dispatch(fetchCurrentUser());
  }

  return () => setUnauthorizedHandler(null);
 }, [dispatch, router]);

  return null;
}
