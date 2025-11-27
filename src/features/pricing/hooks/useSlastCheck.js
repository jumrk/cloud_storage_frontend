import { useEffect, useState } from "react";
import axiosClient from "@/shared/lib/axiosClient";
import { SLAST_REGEX } from "../utils/constants";

/**
 * Hook để kiểm tra slast có tồn tại không
 * @param {string} slast - Giá trị slast cần kiểm tra
 * @returns {Object} { slastExists, slastChecking }
 */
export function useSlastCheck(slast) {
  const [slastExists, setSlastExists] = useState(false);
  const [slastChecking, setSlastChecking] = useState(false);

  useEffect(() => {
    if (!slast || !SLAST_REGEX.test(slast.trim())) {
      setSlastExists(false);
      return;
    }
    let active = true;
    setSlastChecking(true);
    const timeout = setTimeout(() => {
      axiosClient
        .get("/api/user/check-slast", { params: { slast: slast.trim() } })
        .then((res) => {
          if (active) setSlastExists(res?.data?.exists);
        })
        .catch(() => {
          if (active) setSlastExists(false);
        })
        .finally(() => {
          if (active) setSlastChecking(false);
        });
    }, 400);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [slast]);

  return { slastExists, slastChecking };
}

