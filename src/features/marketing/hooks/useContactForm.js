import axiosClient from "@/shared/lib/axiosClient";
import { useTranslations } from "next-intl";
import { useState } from "react";
import contactService from "../services/contactService";

export default function useContactForm() {
  const t = useTranslations();
  const { sendContact } = contactService();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    if (!form.name || !form.email || !form.message) {
      setAlert({ type: "error", msg: t("pages.contact.please_fill_all") });
      return;
    }
    setLoading(true);
    try {
      const res = await sendContact(form);
      const data = res.data;
      setAlert({
        type: "success",
        msg: data.message || t("pages.contact.send_success"),
      });
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      const msg = err?.response?.data?.error || t("pages.contact.send_failed");
      setAlert({ type: "error", msg });
    } finally {
      setLoading(false);
    }
  };
  return {
    t,
    form,
    loading,
    alert,
    handleSubmit,
    handleChange,
  };
}
