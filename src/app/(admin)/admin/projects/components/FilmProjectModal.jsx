"use client";
import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Phim truyền hình",
  "Phim điện ảnh",
  "Web series",
];

const SERVICES = [
  "Chế tác phụ đề",
  "Lồng tiếng",
  "Biên dịch",
  "Thuyết minh",
];

const slugify = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function FilmProjectModal({
  open,
  onClose,
  project,
  onSubmit,
  loading,
}) {
  const isEdit = Boolean(project);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    longDescription: "",
    category: "",
    year: "",
    poster: "",
    images: [],
    videoUrl: "",
    services: [],
  });
  const [errors, setErrors] = useState({});
  const [imageInput, setImageInput] = useState("");
  const [serviceInput, setServiceInput] = useState("");

  useEffect(() => {
    if (!open) return;
    if (project) {
      setForm({
        title: project.title || "",
        slug: project.slug || "",
        description: project.description || "",
        longDescription: project.longDescription || "",
        category: project.category || "",
        year: project.year || "",
        poster: project.poster || "",
        images: Array.isArray(project.images) ? [...project.images] : [],
        videoUrl: project.videoUrl || "",
        services: Array.isArray(project.services) ? [...project.services] : [],
      });
    } else {
      setForm({
        title: "",
        slug: "",
        description: "",
        longDescription: "",
        category: "",
        year: "",
        poster: "",
        images: [],
        videoUrl: "",
        services: [],
      });
    }
    setErrors({});
    setImageInput("");
    setServiceInput("");
  }, [project, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-generate slug from title only if slug is empty
      if (name === "title" && !prev.slug) {
        updated.slug = slugify(value);
      }
      return updated;
    });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSlugChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, slug: slugify(value) }));
    setErrors((prev) => ({ ...prev, slug: undefined }));
  };

  const addImage = () => {
    const value = imageInput.trim();
    if (!value) return;
    if (form.images.includes(value)) {
      toast.error("Ảnh này đã được thêm");
      return;
    }
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, value],
    }));
    setImageInput("");
    setErrors((prev) => ({ ...prev, images: undefined }));
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const addService = () => {
    if (!serviceInput) return;
    if (form.services.includes(serviceInput)) {
      toast.error("Dịch vụ này đã được thêm");
      return;
    }
    setForm((prev) => ({
      ...prev,
      services: [...prev.services, serviceInput],
    }));
    setServiceInput("");
    setErrors((prev) => ({ ...prev, services: undefined }));
  };

  const removeService = (index) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Vui lòng nhập tiêu đề";
    if (!form.slug.trim()) nextErrors.slug = "Vui lòng nhập slug";
    if (!form.description.trim())
      nextErrors.description = "Vui lòng nhập mô tả ngắn";
    if (!form.longDescription.trim())
      nextErrors.longDescription = "Vui lòng nhập mô tả chi tiết";
    if (!form.category) nextErrors.category = "Vui lòng chọn loại phim";
    if (!form.year.trim()) nextErrors.year = "Vui lòng nhập năm";
    if (!form.poster.trim()) nextErrors.poster = "Vui lòng nhập URL poster";
    if (!form.images || form.images.length === 0)
      nextErrors.images = "Vui lòng thêm ít nhất 1 ảnh";
    if (!form.services || form.services.length === 0)
      nextErrors.services = "Vui lòng chọn ít nhất 1 dịch vụ";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      longDescription: form.longDescription.trim(),
      category: form.category,
      year: form.year.trim(),
      poster: form.poster.trim(),
      images: form.images.filter((img) => img.trim()),
      videoUrl: form.videoUrl.trim() || null,
      services: form.services,
    };

    onSubmit && onSubmit(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-fadeIn">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl z-10"
          onClick={onClose}
          title="Đóng"
          disabled={loading}
        >
          <FiX />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {isEdit ? "Chỉnh sửa dự án" : "Thêm dự án mới"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tiêu đề dự án *
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                  disabled={loading}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleSlugChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                  disabled={loading}
                />
                {errors.slug && (
                  <p className="text-xs text-red-500 mt-1">{errors.slug}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Tự động tạo từ tiêu đề nếu để trống
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Mô tả ngắn *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
                disabled={loading}
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Mô tả chi tiết *
              </label>
              <textarea
                name="longDescription"
                value={form.longDescription}
                onChange={handleChange}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
                disabled={loading}
              />
              {errors.longDescription && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.longDescription}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Loại phim *
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                  disabled={loading}
                >
                  <option value="">-- Chọn loại phim --</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-xs text-red-500 mt-1">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Năm *</label>
                <input
                  type="text"
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  placeholder="VD: 2024"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                  disabled={loading}
                />
                {errors.year && (
                  <p className="text-xs text-red-500 mt-1">{errors.year}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                URL Poster *
              </label>
              <input
                type="text"
                name="poster"
                value={form.poster}
                onChange={handleChange}
                placeholder="/images/projects/poster1.jpg"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
                disabled={loading}
              />
              {errors.poster && (
                <p className="text-xs text-red-500 mt-1">{errors.poster}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                URL Video (tùy chọn)
              </label>
              <input
                type="text"
                name="videoUrl"
                value={form.videoUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Ảnh slider *
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  placeholder="/images/projects/project1/image1.jpg"
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImage();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addImage}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                >
                  Thêm
                </button>
              </div>
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.images.map((img, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm"
                    >
                      <span className="max-w-xs truncate">{img}</span>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {errors.images && (
                <p className="text-xs text-red-500 mt-1">{errors.images}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Dịch vụ *
              </label>
              <div className="flex gap-2 mb-2">
                <select
                  value={serviceInput}
                  onChange={(e) => setServiceInput(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={loading}
                >
                  <option value="">-- Chọn dịch vụ --</option>
                  {SERVICES.filter((s) => !form.services.includes(s)).map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    )
                  )}
                </select>
                <button
                  type="button"
                  onClick={addService}
                  disabled={loading || !serviceInput}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                >
                  Thêm
                </button>
              </div>
              {form.services.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.services.map((srv, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 text-sm text-blue-700"
                    >
                      {srv}
                      <button
                        type="button"
                        onClick={() => removeService(idx)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {errors.services && (
                <p className="text-xs text-red-500 mt-1">{errors.services}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {loading
                  ? "Đang lưu..."
                  : isEdit
                  ? "Cập nhật"
                  : "Tạo dự án"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

