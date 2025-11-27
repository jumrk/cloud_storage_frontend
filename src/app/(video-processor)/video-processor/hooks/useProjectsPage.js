import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import projectsService from "../services/projects";
import toast from "react-hot-toast";

export default function useProjectsPage() {
  const serviceRef = useRef(null);
  if (!serviceRef.current) {
    serviceRef.current = projectsService();
  }
  const { createProject, listProjects, updateProject, deleteProject } =
    serviceRef.current;
  const router = useRouter();
  const [ui, setUi] = useState({ aspect: "", sort: "Modified", q: "" });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const ctrl = new AbortController();
    abortControllerRef.current = ctrl;

    try {
      setLoading(true);
      const res = await listProjects({
        q: ui.q,
        aspect: ui.aspect,
        signal: ctrl.signal,
      });
      const data = res.items;
      setData(data);
      setLoading(false);
    } catch (error) {
      // Ignore cancellation errors (AbortError from fetch, CanceledError from axios)
      if (
        error.name === "AbortError" ||
        error.name === "CanceledError" ||
        error.code === "ERR_CANCELED"
      ) {
        return; // Request was aborted, ignore
      }
      console.error(error);
      toast.error("Lỗi");
      setLoading(false);
    }
  }, [ui.q, ui.aspect, listProjects]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const onCreate = useCallback(
    async (aspect) => {
      try {
        const r = await createProject({ aspect });
        router.push(`/video-processor/project/${r.id}`);
      } catch (e) {
        console.error(e);
        toast.error("Không thể tạo dự án");
      }
    },
    [createProject, router]
  );

  const onOpen = useCallback(
    (item) => router.push(`/video-processor/project/${item.id}`),
    [router]
  );

  const onRename = useCallback(
    async (item, title) => {
      const id = item.id;
      if (!id) {
        toast.error("Id không tồn tại");
        return;
      }
      try {
        setLoading(true);
        await updateProject({ id, title });
        setData((prev) =>
          prev.map((l) => (l.id === id ? { ...l, title: title ?? l.title } : l))
        );
        toast.success("Thay đổi thành công");
      } catch (error) {
        const msg = error?.response?.data?.messenger;
        toast.error(msg || "Lỗi");
      } finally {
        setLoading(false);
      }
    },
    [updateProject]
  );

  const onDelete = useCallback(
    async (item) => {
      const id = item.id;
      if (!id) {
        toast.error("Id không tồn tại");
        return;
      }
      try {
        setLoading(true);
        await deleteProject({ id });
        setData((prev) => prev.filter((l) => l.id !== id));
        toast.success("Xóa thành công");
      } catch (error) {
        toast.error("Lỗi");
      } finally {
        setLoading(false);
      }
    },
    [deleteProject]
  );

  return {
    ui,
    setUi,
    data,
    loading,
    onCreate,
    onOpen,
    onRename,
    onDelete,
  };
}

