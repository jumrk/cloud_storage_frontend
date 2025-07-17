"use client";
import React, { useState, useRef, useEffect } from "react";
import Table from "@/components/ui/Table_custom";
import Card_file from "@/components/card_file";
import useDriveActions from "@/hook/useDriveActions";
import Loader from "@/components/ui/Loader";
import toast from "react-hot-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { BsFillGrid3X3GapFill, BsFillGrid3X2GapFill } from "react-icons/bs";
import ActionZone from "@/components/ui/ActionZone";
import { decodeTokenGetUser } from "@/lib/jwt";

function isMobile() {
  if (typeof window === "undefined") return false;
  return (
    window.innerWidth < 768 ||
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent
    )
  );
}

function Forder_component() {
  const header = ["Tên tệp", "Kích thước", "Ngày cập nhật", "Chia sẻ"];
  const [tableData, setTableData] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null); // null là root
  const [filterType, setFilterType] = useState("all");
  const [inputSearch, setInputSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [draggedItems, setDraggedItems] = useState([]);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetFolder, setMoveTargetFolder] = useState(null);
  const [pendingMoveItems, setPendingMoveItems] = useState([]);
  const [isLayout, setIsLayout] = useState(false); // false: table, true: card
  const [copiedShareMobile, setCopiedShareMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allFiles, setAllFiles] = useState([]); // files đã load
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);

  const scrollRef = useRef();

  const searchParams = useSearchParams();
  const router = useRouter();

  // Hook API
  const {
    loading: apiLoading,
    fetchData,
    move,
    deleteItems,
    rename,
  } = useDriveActions();

  // useEffect fetch data KHÔNG phụ thuộc searchTerm
  useEffect(() => {
    let timeout;
    setLoading(true);
    setPage(1);
    setAllFiles([]);
    const folderId = searchParams.get("folderId");
    setCurrentFolderId(folderId || null);
    async function load() {
      if (!folderId) {
        // Ở root: phân trang
        const { files, folders, totalPages: tp } = await fetchData(1);
        setFolders(folders);
        setAllFiles(files);
        setTotalPages(tp);
        setFiles(files); // giữ lại cho logic cũ
      } else {
        // Trong thư mục: load toàn bộ
        const { files, folders } = await fetchData(1, 1000); // lấy tối đa 1000 file
        setFolders(folders);
        setAllFiles(files);
        setTotalPages(1);
        setFiles(files);
      }
      timeout = setTimeout(() => setLoading(false), 400);
    }
    load();
    setIsMobileDevice(isMobile());
    const handleResize = () => setIsMobileDevice(isMobile());
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [searchParams, filterType]);

  // Debounce searchTerm
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(inputSearch);
    }, 400);
    return () => clearTimeout(handler);
  }, [inputSearch]);

  // Tải thêm trang mới (chỉ ở root)
  const loadMore = async () => {
    if (currentFolderId != null || page >= totalPages) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const { files } = await fetchData(nextPage);
    setAllFiles((prev) => [...prev, ...files]);
    setPage(nextPage);
    setLoadingMore(false);
  };

  // Infinite scroll (chỉ ở root)
  useEffect(() => {
    if (currentFolderId != null) return;
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (
        scrollHeight - scrollTop - clientHeight < 100 &&
        !loadingMore &&
        page < totalPages
      ) {
        loadMore();
      }
    };
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", handleScroll);
    return () => {
      if (el) el.removeEventListener("scroll", handleScroll);
    };
  }, [loadingMore, page, totalPages, currentFolderId]);

  // Lọc dữ liệu theo folder hiện tại và searchTerm (client-side)
  useEffect(() => {
    const folderRows = (folders || [])
      .filter((f) => (f.parentId ?? null) === currentFolderId)
      .map((f) => ({
        ...f,
        id: f.driveFolderId,
        type: "folder",
        size: "-",
        date: f.updatedAt, // lưu raw date
        download: "-",
      }));
    let fileRows = [];
    // Ở root chỉ hiện folder, không hiện file
    if (currentFolderId) {
      fileRows = (allFiles || [])
        .filter((file) => (file.folderId ?? null) === currentFolderId)
        .map((f) => ({
          ...f,
          id: f.driveFileId,
          type: "file",
          name: f.originalName,
          size: f.size,
          date: f.updatedAt, // lưu raw date
          download: f.url ? (
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-600"
            >
              Tải xuống
            </a>
          ) : (
            "-"
          ),
        }));
    }
    // Filter theo searchTerm (client-side)
    const allRows = [...folderRows, ...fileRows].filter((item) => {
      if (
        searchTerm &&
        item.name &&
        !item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    });
    setTableData(allRows);
  }, [folders, allFiles, currentFolderId, searchTerm]);

  // Thêm hàm formatDate phía trên render
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN");
  };

  // Click vào folder trong table/card
  const handleRowClick = (row) => {
    if (row.type === "folder") {
      setCurrentFolderId(row.id);
      router.push(`/your_folder?folderId=${row.id}`);
    }
  };

  // Chọn file/folder
  const handleSelectItem = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      return [...prev, item];
    });
  };
  // Chọn tất cả
  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredData);
    }
  };
  // Drag
  const handleDragStart = (item) => {
    if (selectedItems.find((i) => i.id === item.id)) {
      setDraggedItems(selectedItems);
    } else {
      setDraggedItems([item]);
    }
  };
  const handleDragEnd = () => {
    setDraggedItems([]);
  };
  // Di chuyển
  const handleMoveItem = async ({ id, type, targetFolderId }) => {
    const ok = await move({ id, type, targetFolderId });
    if (ok) {
      await reloadData();
      setSelectedItems([]);
      window.dispatchEvent(new Event("reload-folder"));
    }
  };
  // Xóa
  const handleDropDelete = async (items) => {
    const ok = await deleteItems(items);
    if (ok) {
      await reloadData();
      setSelectedItems([]);
      window.dispatchEvent(new Event("reload-folder"));
    }
  };
  // Đổi tên
  const handleRenameFolder = async (id, type, newName) => {
    const ok = await rename(id, type, newName);
    if (ok) await reloadData();
  };
  // Filter
  const filteredData = tableData.filter((item) => {
    if (filterType === "folder" && item.type !== "folder") return false;
    if (
      filterType === "image" &&
      !/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(item.name)
    )
      return false;
    if (
      filterType === "video" &&
      !/\.(mp4|avi|mov|wmv|flv|mkv)$/i.test(item.name)
    )
      return false;
    if (filterType === "word" && !/\.(doc|docx)$/i.test(item.name))
      return false;
    if (
      searchTerm &&
      !item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  // Callback cho ActionZone
  const handleDropMove = (items) => {
    setPendingMoveItems(items);
    setShowMoveModal(true);
  };
  const handleDownload = (items) => {
    if (!Array.isArray(items)) items = [items];
    items.forEach((item) => {
      if (item.type === "file" && item.url) {
        window.open(item.url, "_blank");
      }
    });
    toast.success("Đã tải xuống các file đã chọn");
  };
  const handleShare = (item) => {
    const shareUrl = `${window.location.origin}/share/${item.id}`;
    navigator.clipboard.writeText(shareUrl);
  };

  // Khi fetch lại data (ví dụ tạo folder, xóa file), cũng set loading
  const reloadData = async () => {
    setLoading(true);
    setPage(1);
    setAllFiles([]);
    const { files, folders, totalPages: tp } = await fetchData(1);
    setFolders(folders);
    setAllFiles(files);
    setTotalPages(tp);
    setFiles(files);
    setTimeout(() => setLoading(false), 400);
  };

  // Tính tổng số file + folder thực tế ở root
  const allFilesLength = Array.isArray(allFiles) ? allFiles.length : 0;
  const rootFoldersLength = Array.isArray(folders)
    ? folders.filter((f) => (f.parentId ?? null) === null).length
    : 0;
  const totalItems =
    (folders?.filter((f) => (f.parentId ?? null) === null)?.length || 0) +
    (allFiles?.filter((f) => (f.folderId ?? null) === null)?.length || 0);

  // Thay vì chỉ dùng state loading cục bộ, đồng bộ với driveActions.loading
  const isLoading = loading || apiLoading;

  useEffect(() => {
    // Lấy role từ token (decode)
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      const user = decodeTokenGetUser(token);
      setUserRole(user?.role || null);
      setUserId(user?.id || null);
    }
  }, []);

  // Helper kiểm tra quyền member trên folder/file
  const hasPermission = (item) => {
    if (userRole !== "member") return true;
    if (!item.permissions) return false;
    const perm = item.permissions.find((p) => p.memberId === userId);
    return perm && !perm.locked;
  };

  // Khi render folder/file, disable/grey nếu bị locked
  const renderRow = (row) => {
    const disabled =
      userRole === "member" &&
      row.permissions &&
      row.permissions.some((p) => p.memberId === userId && p.locked);
    return (
      <tr
        key={row.id}
        className={disabled ? "opacity-50 pointer-events-none" : ""}
      >
        {/* ... render các cell ... */}
      </tr>
    );
  };

  // Khi truyền parentId cho upload, chỉ truyền nếu member có quyền
  const canUploadHere = () => {
    if (userRole !== "member") return true;
    const currentFolder = folders.find(
      (f) => f.driveFolderId === currentFolderId
    );
    if (!currentFolder) return false;
    return hasPermission(currentFolder);
  };

  return (
    <div>
      {/* Overlay loading */}
      {isLoading && <Loader position="center" bg="black" hideText />}
      <div className="min-h-screen w-full pl-20 lg:pl-20 py-5 pr-5">
        {/* Tìm kiếm + filter + layout switch */}
        <div className="grid mt-5">
          <input
            name="search"
            className="w-full lg:w-[60%] placeholder:text-[#8897AD] p-3 border focus:outline-none border-[#D4D7E3] bg-[#F7FBFF] rounded-xl"
            type="text"
            placeholder="Tìm kiếm tệp của bạn"
            value={inputSearch}
            onChange={(e) => setInputSearch(e.target.value)}
          />
        </div>
        <div className="grid lg:flex lg:p-5 lg:justify-between relative">
          <div className="flex gap-2 mt-5 items-center relative">
            <select
              className="min-w-[165px] min-h-10 max-w-xs p-2 rounded-[6px] border-none text-primary font-medium transition-all bg-[#E5E7EB] duration-300 ease-in-out shadow-xl"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="folder">Thư mục</option>
              <option value="image">Tệp ảnh</option>
              <option value="video">Tệp video</option>
              <option value="word">Tệp word</option>
            </select>
            <div className="hidden lg:flex gap-2 ml-4">
              <BsFillGrid3X3GapFill
                onClick={() => setIsLayout(false)}
                style={{ cursor: "pointer", transition: "all 0.3s" }}
                size={30}
                color={isLayout ? "#A2A2A2" : "#1E293B"}
              />
              <BsFillGrid3X2GapFill
                onClick={() => setIsLayout(true)}
                style={{ cursor: "pointer", transition: "all 0.3s" }}
                size={30}
                color={isLayout ? "#1E293B" : "#A2A2A2"}
              />
            </div>
          </div>
        </div>
        {/* Card/Table view: mobile luôn là Card, desktop cho phép chuyển đổi qua lại bằng isLayout */}
        {!loading && (
          <>
            {isMobileDevice || isLayout ? (
              <div className="mt-4 w-full justify-center flex flex-wrap gap-4 transition-opacity duration-300">
                {filteredData.map((item) => (
                  <Card_file
                    key={item.id}
                    data={item}
                    onClick={() => {
                      if (item.type === "folder") handleRowClick(item);
                    }}
                    onMoveItem={handleMoveItem}
                    selectedItems={selectedItems}
                    onSelectItem={handleSelectItem}
                    draggedItems={draggedItems}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onRenameFolder={handleRenameFolder}
                  />
                ))}
              </div>
            ) : (
              <div className="lg:block hidden transition-opacity duration-300">
                <Table
                  header={header}
                  data={filteredData}
                  handleChecked={setIsChecked}
                  editingFolderId={editingFolderId}
                  handleRename={() => {}}
                  onRowClick={handleRowClick}
                  onMoveItem={handleMoveItem}
                  selectedItems={selectedItems}
                  onSelectItem={handleSelectItem}
                  onSelectAll={handleSelectAll}
                  draggedItems={draggedItems}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onRenameFolder={handleRenameFolder}
                />
              </div>
            )}
            {/* Nút tải thêm chỉ ở root và chỉ khi còn dữ liệu */}
            {currentFolderId == null &&
              allFilesLength + rootFoldersLength < totalItems &&
              page < totalPages && (
                <div className="flex justify-center my-4">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-4 py-2 rounded bg-primary text-white disabled:bg-gray-300"
                  >
                    {loadingMore ? "Đang tải..." : "Tải thêm"}
                  </button>
                </div>
              )}
          </>
        )}
        {/* Thay thế action zone cũ bằng ActionZone */}
        <ActionZone
          isMobile={isMobileDevice}
          selectedItems={selectedItems}
          draggedItems={draggedItems}
          onMove={handleDropMove}
          onDownload={handleDownload}
          onDelete={handleDropDelete}
          onShare={handleShare}
          showMoveModal={showMoveModal}
          setShowMoveModal={setShowMoveModal}
        />
        {/* Modal chọn folder đích khi di chuyển */}
        {showMoveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl p-6 min-w-[320px] shadow-2xl relative">
              <h3 className="font-bold text-lg mb-4">Chọn thư mục đích</h3>
              <div className="max-h-60 overflow-y-auto mb-4">
                <div
                  className={`p-2 rounded cursor-pointer mb-1 ${
                    moveTargetFolder && moveTargetFolder.id === null
                      ? "bg-blue-200"
                      : "hover:bg-blue-100"
                  }`}
                  onClick={() =>
                    setMoveTargetFolder({ id: null, name: "Thư mục gốc" })
                  }
                >
                  📁 Ra ngoài tất cả thư mục (Thư mục gốc)
                </div>
                {folders.map((folder) => (
                  <div
                    key={folder.driveFolderId}
                    className={`p-2 rounded cursor-pointer mb-1 ${
                      moveTargetFolder &&
                      moveTargetFolder.id === folder.driveFolderId
                        ? "bg-blue-200"
                        : "hover:bg-blue-100"
                    }`}
                    onClick={() =>
                      setMoveTargetFolder({
                        id: folder.driveFolderId,
                        name: folder.name,
                      })
                    }
                  >
                    📁 {folder.name}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowMoveModal(false)}
                  className="px-4 py-2 rounded bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (moveTargetFolder && pendingMoveItems.length > 0) {
                      pendingMoveItems.forEach((item) => {
                        handleMoveItem({
                          id: item.id,
                          type: item.type,
                          targetFolderId: moveTargetFolder.id,
                        });
                      });
                    }
                    setShowMoveModal(false);
                    setMoveTargetFolder(null);
                    setPendingMoveItems([]);
                  }}
                  className="px-4 py-2 rounded bg-primary text-white disabled:bg-gray-300"
                  disabled={moveTargetFolder === null}
                >
                  Di chuyển
                </button>
              </div>
            </div>
          </div>
        )}
      </div>{" "}
      {/* <-- Move this closing div here to wrap all main content */}
    </div>
  );
}

export default Forder_component;
