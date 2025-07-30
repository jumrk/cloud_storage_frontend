import axiosClient from "@/lib/axiosClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const { default: validateForm } = require("@/utils/validateForm");
const { useState } = require("react");

function useLoginForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handelChange = (e) => {
    const { name, value } = e.target;
    setErrors({});
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handelSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm({
      email: formData.email,
      password: formData.password,
    });

    setErrors(validationError);

    if (!validationError.email && !validationError.password) {
      try {
        setLoading(true);
        const res = await axiosClient.post("/api/auth/login", formData);
        setErrors({});

        const token = res.data.token;
        // Không cần lưu vào localStorage nữa vì backend đã set cookie
        localStorage.setItem("token", token);
        const { role, slast } = res.data.user;
        if (role === "admin") {
          router.push("/admin");
        } else {
          router.push(`/${slast}/home`);
        }
        toast.success(res.data.message);
        // XÓA reset form và loading ở đây để tránh render lại login
        // setFormData({ email: "", password: "" });
        // setLoading(false);
      } catch (error) {
        console.log(error);
        toast.error(error?.response?.data?.error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    }
  };
  return { formData, errors, loading, handelSubmit, handelChange };
}

export default useLoginForm;
