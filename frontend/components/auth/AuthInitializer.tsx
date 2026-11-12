"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import { useAppDispatch } from "@/redux/hooks";
import { fetchCurrentUser, hydrateFromStorage } from "@/redux/slices/authSlice";

export default function AuthInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = Cookies.get("smma.token");
    dispatch(hydrateFromStorage());
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  return null;
}
