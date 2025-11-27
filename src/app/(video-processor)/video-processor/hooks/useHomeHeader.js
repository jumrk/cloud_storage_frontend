import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function useHomeHeader({ value, onChange }) {
  const t = useTranslations();
  const [open, setOpen] = useState({
    create: false,
    aspect: false,
    sort: false,
  });
  const [q, setQ] = useState(value?.q || "");

  // Sync q with value.q when value changes externally
  useEffect(() => {
    if (value?.q !== undefined && value.q !== q) {
      setQ(value.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.q]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (onChange) {
        onChange({ ...value, q });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Click outside handler
  useEffect(() => {
    const h = (e) => {
      if (
        !e.target.closest?.("[data-popover]") &&
        !e.target.closest?.("[data-popover-panel]")
      ) {
        setOpen({ create: false, aspect: false, sort: false });
      }
    };
    window.addEventListener("click", h);
    return () => window.removeEventListener("click", h);
  }, []);

  const aspectLabel = value?.aspect ? value.aspect : t("video_processor.all");

  const handleCreateClick = () => {
    setOpen((s) => ({ ...s, create: !s.create }));
  };

  const handleAspectClick = () => {
    setOpen((s) => ({ ...s, aspect: !s.aspect, sort: false }));
  };

  const handleCreateItemClick = (aspect) => {
    setOpen((s) => ({ ...s, create: false }));
  };

  const handleAspectItemClick = (val) => {
    if (onChange) {
      onChange({ ...value, aspect: val });
    }
    setOpen((s) => ({ ...s, aspect: false }));
  };

  return {
    open,
    q,
    setQ,
    aspectLabel,
    handleCreateClick,
    handleAspectClick,
    handleCreateItemClick,
    handleAspectItemClick,
  };
}

