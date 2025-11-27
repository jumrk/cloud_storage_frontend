import axiosClient from "@/shared/lib/axiosClient";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import {
  checkEmail,
  createMember,
  fetchMember,
} from "../services/memberManagementService";

export default function useMemberManagement() {
  const t = useTranslations();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    password: "",
    slast: "",
  });
  const [emailExists, setEmailExists] = useState(false);
  const [slastExists, setSlastExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingSlast, setCheckingSlast] = useState(false);
  const [memberStats, setMemberStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [editForm, setEditForm] = useState({
    email: "",
    fullName: "",
    password: "",
  });
  const [editError, setEditError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [sortFolderCount, setSortFolderCount] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    user: null,
  });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetchMember();
      const data = res.data;
      if (data.members) setMembers(data.members);
      else setMembers([]);
    } catch (e) {
      toast.error(t("user_management.load_members_error"));
      setMembers([]);
    }
    setLoading(false);
  };

  const handleOpenModal = () => {
    setForm({ email: "", fullName: "", password: "", slast: "" });
    setEmailExists(false);
    setSlastExists(false);
    setCheckingEmail(false);
    setCheckingSlast(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "email") {
      setEmailExists(false);
      setCheckingEmail(true);
      if (e.target.value && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.target.value)) {
        checkEmail(e)
          .then((res) => setEmailExists(res.data.exists))
          .catch(() => setEmailExists(false))
          .finally(() => setCheckingEmail(false));
      } else {
        setCheckingEmail(false);
      }
    }
    if (e.target.name === "slast") {
      setSlastExists(false);
      setCheckingSlast(true);
      if (e.target.value && /^[a-zA-Z0-9_-]+$/.test(e.target.value)) {
        axiosClient
          .get("/api/user/check-slast", { params: { slast: e.target.value } })
          .then((res) => setSlastExists(res.data.exists))
          .catch(() => setSlastExists(false))
          .finally(() => setCheckingSlast(false));
      } else {
        setCheckingSlast(false);
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (emailExists) {
      toast.error(t("user_management.email_exists"));
      setLoading(false);
      return;
    }
    if (slastExists) {
      toast.error(t("user_management.slast_exists"));
      setLoading(false);
      return;
    }
    try {
      const res = await createMember(form);
      const data = res.data;
      if (data.success) {
        toast.success(t("user_management.create_success"));
        setShowModal(false);
        fetchMembers();
      } else {
        toast.error(data.error || t("user_management.create_failed"));
      }
    } catch (e) {
      let errorMsg = t("user_management.connection_error");
      if (e.response && e.response.data && e.response.data.error) {
        errorMsg = e.response.data.error;
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (user) => {
    setEditForm({ email: user.email, fullName: user.fullName, password: "" });
    setEditModal({ open: true, user });
    setEditError("");
  };
  const handleCloseEditModal = () => {
    setEditModal({ open: false, user: null });
    setEditError("");
  };
  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEditError("");
    try {
      const res = await axiosClient.patch(
        `/api/user/members/${editModal.user._id}`,
        editForm
      );
      const data = res.data;
      if (data.success) {
        toast.success(t("user_management.update_success"));
        setEditModal({ open: false, user: null });
        fetchMembers();
      } else {
        setEditError(data.error || t("user_management.update_failed"));
        toast.error(data.error || t("user_management.update_failed"));
      }
    } catch (e) {
      setEditError(t("user_management.connection_error"));
      toast.error(t("user_management.connection_error"));
    }
    setLoading(false);
  };
  const handleDeleteUser = async (user) => {
    setConfirmDialog({ open: true, user });
  };

  const handleConfirmDelete = async () => {
    const user = confirmDialog.user;
    if (!user) return;
    try {
      const res = await axiosClient.delete(`/api/user/members/${user._id}`);
      const data = res.data;
      if (data.success) {
        toast.success(t("user_management.delete_success"));
        fetchMembers();
      } else {
        toast.error(data.error || t("user_management.delete_failed"));
      }
    } catch (e) {
      toast.error(t("user_management.connection_error"));
    }
    setConfirmDialog({ open: false, user: null });
  };
  const filteredMembers = members.filter((user) => {
    return (
      user.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const aCount = memberStats[a._id]?.folderCount || 0;
    const bCount = memberStats[b._id]?.folderCount || 0;
    if (!sortFolderCount) return 0;
    if (sortFolderCount === "asc") return aCount - bCount;
    return bCount - aCount;
  });

  return {
    t,
    members,
    loading,
    showModal,
    form,
    emailExists,
    slastExists,
    checkingEmail,
    checkingSlast,
    memberStats,
    loadingStats,
    editModal,
    editForm,
    editError,
    searchText,
    sortFolderCount,
    confirmDialog,
    sortedMembers,
    setMemberStats,
    setLoadingStats,
    setSearchText,
    setSortFolderCount,
    setConfirmDialog,
    fetchMembers,
    handleOpenModal,
    handleCloseModal,
    handleFormChange,
    handleFormSubmit,
    handleOpenEditModal,
    handleCloseEditModal,
    handleEditFormChange,
    handleEditFormSubmit,
    handleDeleteUser,
    handleConfirmDelete,
  };
}

