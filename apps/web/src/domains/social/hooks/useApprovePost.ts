"use client";

import { useState } from "react";
import { socialApi } from "../api/social.api";
import toast from "react-hot-toast";

export function useApprovePost() {
  const [isApproving, setIsApproving] = useState(false);

  const approvePost = async (postId: string) => {
    setIsApproving(true);
    try {
      const res = await socialApi.approvePost(postId);
      toast.success("Post approved and queued for dispatch!");
      return res;
    } catch {
      toast.error("Failed to approve post");
    } finally {
      setIsApproving(false);
    }
  };

  return { isApproving, approvePost };
}
