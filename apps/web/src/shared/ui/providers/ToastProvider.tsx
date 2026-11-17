"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
 return (
 <Toaster
 position="top-right"
 gutter={10}
 containerStyle={{
 top: 20,
 right: 20,
 zIndex: 999999,
 }}
 toastOptions={{
 duration: 3500,
 style: {
 background: "#ffffff",
 color: "#0b1c30",
 border: "1px solid #e2e8f0",
 borderRadius: "0.75rem",
 fontSize: "0.875rem",
 fontWeight: 500,
 boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 4px 10px -6px rgba(0, 0, 0, 0.08)",
 padding: "12px 18px",
 maxWidth: "420px",
 },
 success: {
 duration: 3500,
 iconTheme: {
 primary: "#10b981",
 secondary: "#ffffff",
 },
 style: {
 background: "#ffffff",
 color: "#0b1c30",
 border: "1px solid #d1fae5",
 },
 },
 error: {
 duration: 4000,
 iconTheme: {
 primary: "#ef4444",
 secondary: "#ffffff",
 },
 style: {
 background: "#ffffff",
 color: "#0b1c30",
 border: "1px solid #fee2e2",
 },
 },
 }}
 />
 );
}
