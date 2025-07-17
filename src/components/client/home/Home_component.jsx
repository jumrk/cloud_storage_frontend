// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import {
//   IoAddOutline,
//   IoMoveOutline,
//   IoArrowBackOutline,
// } from "react-icons/io5";
// import { BsFillGrid3X3GapFill, BsFillGrid3X2GapFill } from "react-icons/bs";
// import Button_icon from "@/components/ui/Button_icon";
// import { FiDownload } from "react-icons/fi";
// import { RiDeleteBin6Line } from "react-icons/ri";
// import Table from "@/components/ui/Table_custom";
// import UploadModal from "@/components/Upload_component";
// import Card_file from "@/components/card_file";
// import toast from "react-hot-toast";
// import { useRouter } from "next/navigation";
// import useDriveActions from "@/hook/useDriveActions";
// import Loader from "@/components/ui/Loader";
// import UploadMiniStatus from "@/components/UploadMiniStatus";
// import { v4 as uuidv4 } from "uuid";
// import ActionZone from "@/components/ui/ActionZone";

// function isMobile() {
//   if (typeof window === "undefined") return false;
//   return (
//     window.innerWidth < 768 ||
//     /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
//       navigator.userAgent
//     )
//   );
// }

// function Home_Component() {
//   const router = useRouter();
//   const scrollRef = useRef();
//   const header = ["Tên tệp", "Kích thước", "Ngày cập nhật", "Lượt tải"];
//   const [isChecked, setIsChecked] = useState(false);
//   const [showModal, setShowModal] = useState(false);
//   const [showUploadModal, setShowUploadModal] = useState(false);
//   const [isLayout, setIsLayout] = useState(false);
//   const [tableData, setTableData] = useState([]);
//   const [editingFolderId, setEditingFolderId] = useState(null);
//   const [folders, setFolders] = useState([]);
//   const [files, setFiles] = useState([]);
//   const [currentFolderId, setCurrentFolderId] = useState(null); // null là root
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [allFiles, setAllFiles] = useState([]);
//   const [breadcrumb, setBreadcrumb] = useState([
//     { id: null, name: "Tất cả tệp" },
//   ]);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const modalRef = useRef(null);
//   const [filterType, setFilterType] = useState("all");
//   const [searchTerm, setSearchTerm] = useState("");

//   // State chọn nhiều file và kéo nhiều file
//   const [selectedItems, setSelectedItems] = useState([]); // [{id, type, ...}]
//   const [draggedItems, setDraggedItems] = useState([]); // [{id, type, ...}]
//   const [isMobileDevice, setIsMobileDevice] = useState(false);

//   // State cho UI mini upload
//   const [uploadBatches, setUploadBatches] = useState([]); // [{id, files, status}]
//   // Hàm chọn/bỏ chọn file/folder
//   const handleSelectItem = (item) => {
//     setSelectedItems((prev) => {
//       const exists = prev.find((i) => i.id === item.id);
//       if (exists) return prev.filter((i) => i.id !== item.id);
//       return [...prev, item];
//     });
//   };

//   // Hàm chọn tất cả
//   const handleSelectAll = () => {
//     if (selectedItems.length === filteredData.length) {
//       setSelectedItems([]);
//     } else {
//       setSelectedItems(filteredData);
//     }
//   };

//   // Khi drag start, xác định draggedItems
//   const handleDragStart = (item) => {
//     if (selectedItems.find((i) => i.id === item.id)) {
//       setDraggedItems(selectedItems);
//     } else {
//       setDraggedItems([item]);
//     }
//   };
//   const handleDragEnd = () => {
//     setDraggedItems([]);
//   };

//   // Use Effect
//   const [loading, setLoading] = useState(true);
//   useEffect(() => {
//     let timeout;
//     setLoading(true);
//     setPage(1);
//     setAllFiles([]);

//     async function load() {
//       const { files, folders, totalPages: tp } = await fetchData(1);
//       setFolders(folders);
//       setAllFiles(files);
//       setTotalPages(tp);
//       setFiles(files); // giữ lại cho logic cũ
//       timeout = setTimeout(() => setLoading(false), 400);
//     }
//     load();

//     // Xử lý click outside
//     const handleClickOutside = (e) => {
//       if (modalRef.current && !modalRef.current.contains(e.target)) {
//         setShowModal(false);
//       }
//     };

//     // Xử lý thay đổi kích thước
//     const handleResize = () => {
//       if (window.innerWidth >= 1020) {
//         setIsLayout(false);
//       } else {
//         setIsLayout(true);
//       }
//     };

//     // Gọi lần đầu khi load trang
//     handleResize();

//     // Thêm sự kiện
//     document.addEventListener("mousedown", handleClickOutside);
//     window.addEventListener("resize", handleResize);

//     // Cleanup
//     return () => {
//       clearTimeout(timeout);
//       document.removeEventListener("mousedown", handleClickOutside);
//       window.removeEventListener("resize", handleResize);
//     };
//   }, [filterType, searchTerm]);

//   useEffect(() => {
//     setIsMobileDevice(isMobile());
//     const handleResize = () => setIsMobileDevice(isMobile());
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   // Tải thêm trang mới
//   const loadMore = async () => {
//     if (page >= totalPages) return;
//     setLoadingMore(true);
//     const nextPage = page + 1;
//     const { files } = await fetchData(nextPage);
//     setAllFiles((prev) => [...prev, ...files]);
//     setPage(nextPage);
//     setLoadingMore(false);
//   };

//   // Infinite scroll
//   useEffect(() => {
//     const handleScroll = () => {
//       if (!scrollRef.current) return;
//       const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
//       if (
//         scrollHeight - scrollTop - clientHeight < 100 &&
//         !loadingMore &&
//         page < totalPages
//       ) {
//         loadMore();
//       }
//     };
//     const el = scrollRef.current;
//     if (el) el.addEventListener("scroll", handleScroll);
//     return () => {
//       if (el) el.removeEventListener("scroll", handleScroll);
//     };
//   }, [loadingMore, page, totalPages]);

//   // Lọc dữ liệu theo folder hiện tại
//   useEffect(() => {
//     const folderRows = (folders || [])
//       .filter((f) => (f.parentId ?? null) === currentFolderId)
//       .map((f) => ({
//         ...f,
//         id: f.driveFolderId,
//         type: "folder",
//         size: "-",
//         date: f.updatedAt, // lưu raw date
//         download: "-",
//       }));
//     // File thuộc folder hiện tại
//     const fileRows = (allFiles || [])
//       .filter((file) => (file.folderId ?? null) === currentFolderId)
//       .map((f) => ({
//         ...f,
//         id: f.driveFileId,
//         type: "file",
//         name: f.originalName,
//         size: f.size,
//         date: f.updatedAt, // lưu raw date
//         download: f.url ? (
//           <a
//             href={f.url}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="underline text-blue-600"
//           >
//             Tải xuống
//           </a>
//         ) : (
//           "-"
//         ),
//       }));
//     setTableData([...folderRows, ...fileRows]);
//   }, [folders, allFiles, currentFolderId]);

//   // Click vào folder trong table
//   const handleRowClick = (row) => {
//     if (row.type === "folder") {
//       setCurrentFolderId(row.id);
//       setBreadcrumb((prev) => [...prev, { id: row.id, name: row.name }]);
//     }
//   };

//   // Handle
//   const handleCheck = (isValid) => {
//     setIsChecked(isValid);
//   };

//   const [loadingNewFolder, setLoadingNewFolder] = useState(false);

//   const createNewFolder = async () => {
//     setLoadingNewFolder(true);
//     const folderName = "Thư mục mới";
//     try {
//       const res = await fetch("/api/upload/create_folder", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           name: folderName,
//           parentId: currentFolderId, // null nếu là root
//         }),
//       });
//       const data = await res.json();
//       if (data.success) {
//         toast.success("Tạo thư mục thành công!");
//         fetchData().then(({ files, folders }) => {
//           setFolders(folders);
//           setFiles(files);
//           window.dispatchEvent(new Event("reload-folder"));
//         });
//       } else {
//         toast.error(data.error || "Tạo thư mục thất bại");
//       }
//     } catch (err) {
//       toast.error("Lỗi khi tạo thư mục");
//     } finally {
//       setLoadingNewFolder(false);
//     }
//   };

//   const handleRename = (id, newName) => {
//     setTableData((prev) =>
//       prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
//     );
//     setEditingFolderId(null);
//   };

//   // Thay thế các hàm xử lý bằng hook
//   const {
//     loading: apiLoading,
//     fetchData,
//     upload,
//     move,
//     deleteItems,
//     rename,
//   } = useDriveActions();

//   const filteredData = tableData.filter((item) => {
//     // Lọc theo loại
//     if (filterType === "folder" && item.type !== "folder") return false;
//     if (
//       filterType === "image" &&
//       !/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(item.name)
//     )
//       return false;
//     if (
//       filterType === "video" &&
//       !/\.(mp4|avi|mov|wmv|flv|mkv)$/i.test(item.name)
//     )
//       return false;
//     if (filterType === "word" && !/\.(doc|docx)$/i.test(item.name))
//       return false;
//     // Lọc theo search
//     if (
//       searchTerm &&
//       !item.name.toLowerCase().includes(searchTerm.toLowerCase())
//     )
//       return false;
//     return true;
//   });

//   // Hàm xử lý di chuyển file/folder
//   const handleMoveItem = async ({ id, type, targetFolderId }) => {
//     setLoading(true);
//     const ok = await move({ id, type, targetFolderId });
//     if (ok) {
//       await reloadData();
//       setSelectedItems([]);
//       setDraggedItems([]); // Reset draggedItems để ActionZone ẩn đi
//       window.dispatchEvent(new Event("reload-folder"));
//     }
//   };

//   // Modal chọn folder đích
//   const [showMoveModal, setShowMoveModal] = useState(false);
//   const [moveTargetFolder, setMoveTargetFolder] = useState(null);
//   const [pendingMoveItems, setPendingMoveItems] = useState([]);

//   // Action khi drop vào nút chức năng
//   // Callback cho ActionZone
//   const handleDropMove = (items) => {
//     setLoading(true);
//     setPendingMoveItems(items);
//     setShowMoveModal(true);
//     setDraggedItems([]); // Reset draggedItems để ActionZone ẩn đi
//     setLoading(false);
//   };
//   const handleDownload = (items) => {
//     setLoading(true);
//     if (!Array.isArray(items)) items = [items];
//     items.forEach((item) => {
//       if (item.type === "file" && item.url) {
//         window.open(item.url, "_blank");
//       }
//     });
//     toast.success("Đã tải xuống các file đã chọn");
//     setDraggedItems([]); // Reset draggedItems để ActionZone ẩn đi
//     setLoading(false);
//   };
//   const handleShare = (item) => {
//     setLoading(true);
//     const shareUrl = `${window.location.origin}/share/${item.id}`;
//     navigator.clipboard.writeText(shareUrl);
//     setDraggedItems([]); // Reset draggedItems để ActionZone ẩn đi
//     setLoading(false);
//   };
//   const handleConfirmMove = async () => {
//     setLoading(true);
//     if (moveTargetFolder && pendingMoveItems.length > 0) {
//       await Promise.all(
//         pendingMoveItems.map((item) =>
//           handleMoveItem({
//             id: item.id,
//             type: item.type,
//             targetFolderId: moveTargetFolder.id,
//           })
//         )
//       );
//       await reloadData();
//       setSelectedItems([]);
//       setDraggedItems([]); // Reset draggedItems để ActionZone ẩn đi
//       window.dispatchEvent(new Event("reload-folder"));
//     }
//     setShowMoveModal(false);
//     setMoveTargetFolder(null);
//     setPendingMoveItems([]);
//     setLoading(false);
//   };
//   const handleCancelMove = () => {
//     setShowMoveModal(false);
//     setMoveTargetFolder(null);
//     setPendingMoveItems([]);
//   };
//   const handleDropDelete = async (items) => {
//     setLoading(true);
//     const ok = await deleteItems(items);
//     if (ok) {
//       await reloadData();
//       setSelectedItems([]);
//       setDraggedItems([]); // Reset draggedItems để ActionZone ẩn đi
//       window.dispatchEvent(new Event("reload-folder"));
//     }
//     setLoading(false);
//   };

//   // Hàm back folder
//   const handleBackFolder = () => {
//     if (breadcrumb.length > 1) {
//       const prev = breadcrumb[breadcrumb.length - 2];
//       setCurrentFolderId(prev.id);
//       setBreadcrumb(breadcrumb.slice(0, breadcrumb.length - 1));
//     }
//   };

//   // Đổi tên file/folder
//   const handleRenameFolder = async (id, type, newName) => {
//     setLoading(true);
//     const ok = await rename(id, type, newName);
//     if (ok)
//       fetchData().then(({ files, folders }) => {
//         setFolders(folders);
//         setFiles(files);
//       });
//     setLoading(false);
//   };

//   // Xem file
//   const [previewFile, setPreviewFile] = useState(null);
//   const handlePreviewFile = (file) => {
//     setPreviewFile(file);
//   };
//   const closePreview = () => setPreviewFile(null);

//   // Callback truyền cho UploadModal
//   const handleShowMiniUploadStatus = (files) => {
//     const batchId = uuidv4();
//     setUploadBatches((prev) => [
//       ...prev,
//       {
//         id: batchId,
//         files: files.map((f) => ({
//           name: f.name,
//           icon: "/images/icon/png.png",
//           status: "Đang tải...",
//         })),
//         status: "Đang bắt đầu tải lên...",
//       },
//     ]);
//     return batchId;
//   };
//   // Callback cập nhật trạng thái upload
//   const handleUpdateMiniUploadStatus = (batchId, status, files) => {
//     setUploadBatches((prev) =>
//       prev.map((b) =>
//         b.id === batchId
//           ? {
//               ...b,
//               status,
//               files: files || b.files,
//             }
//           : b
//       )
//     );
//   };
//   // Callback ẩn UI mini upload cho batch cụ thể
//   const handleHideMiniUploadStatus = (batchId) => {
//     setTimeout(() => {
//       setUploadBatches((prev) => prev.filter((b) => b.id !== batchId));
//     }, 2000);
//   };

//   const [showPageLoading, setShowPageLoading] = useState(true);

//   useEffect(() => {
//     setShowPageLoading(true);
//     let timeout = setTimeout(() => setShowPageLoading(false), 2000);
//     fetchData().then(({ files, folders }) => {
//       setFolders(folders);
//       setFiles(files);
//       // Nếu fetch xong mà timeout đã hết thì tắt loading luôn
//       if (timeout) {
//         clearTimeout(timeout);
//         setTimeout(() => setShowPageLoading(false), 0);
//       }
//     });
//     return () => clearTimeout(timeout);
//   }, []);

//   // Khi fetch lại data (ví dụ tạo folder, xóa file), cũng set loading
//   const reloadData = async () => {
//     setLoading(true);
//     setPage(1);
//     setAllFiles([]);
//     const { files, folders, totalPages: tp } = await fetchData(1);
//     setFolders(folders);
//     setAllFiles(files);
//     setTotalPages(tp);
//     setFiles(files);
//     setTimeout(() => setLoading(false), 400);
//   };

//   // Tính tổng số file + folder thực tế ở root
//   const allFilesLength = Array.isArray(allFiles) ? allFiles.length : 0;
//   const rootFoldersLength = Array.isArray(folders)
//     ? folders.filter((f) => (f.parentId ?? null) === null).length
//     : 0;
//   const totalItems = allFilesLength + rootFoldersLength;

//   const driveActions = useDriveActions();
//   // Thay vì chỉ dùng state loading cục bộ, đồng bộ với driveActions.loading
//   const isLoading = loading || driveActions.loading;

//   return (
//     <div>
//       {/* Overlay loading */}
//       {isLoading && <Loader position="center" bg="black" hideText />}
//       <div
//         className="min-h-screen w-full px-5 py-5 pr-5"
//         ref={scrollRef}
//         style={{ overflowY: "auto", maxHeight: "calc(100vh - 40px)" }}
//       >
//         {/* Tìm kiếm */}
//         <div className="grid mt-5">
//           <input
//             name="search"
//             className="w-full lg:w-[60%] placeholder:text-[#8897AD] p-3 border focus:outline-none border-[#D4D7E3] bg-[#F7FBFF] rounded-xl"
//             type="text"
//             placeholder="Tìm kiếm tệp của bạn"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>

//         <div className="grid lg:flex lg:p-5 lg:justify-between relative">
//           {/* Button left */}
//           <div className="flex gap-2 mt-5 items-center relative" ref={modalRef}>
//             <select
//               className="min-w-[165px] min-h-10 max-w-xs p-2 rounded-[6px] border-none text-primary font-medium transition-all bg-[#E5E7EB] duration-300 ease-in-out shadow-xl"
//               value={filterType}
//               onChange={(e) => setFilterType(e.target.value)}
//             >
//               <option value="all">Tất cả</option>
//               <option value="folder">Thư mục</option>
//               <option value="image">Tệp ảnh</option>
//               <option value="video">Tệp video</option>
//               <option value="word">Tệp word</option>
//             </select>

//             {/* Modal tải lên thư mục */}
//             <div className="relative">
//               <button
//                 onClick={() => setShowModal(!showModal)}
//                 className="flex bg-primary p-2 cursor-pointer shadow-xl/20 hover:scale-105 transition-all rounded-[8px] text-white justify-center items-center gap-3 disabled:bg-blue-300"
//                 disabled={loadingNewFolder}
//               >
//                 {loadingNewFolder ? (
//                   <span className="animate-spin mr-2">⏳</span>
//                 ) : (
//                   <IoAddOutline />
//                 )}
//                 <p>Mới</p>
//               </button>
//               {showModal && (
//                 <div className="absolute top-12 left-0 z-50 w-[200px] bg-white rounded-md shadow-lg border border-gray-200">
//                   <ul className="flex flex-col text-sm">
//                     <li
//                       className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
//                       onClick={() => {
//                         setShowModal(false);
//                         createNewFolder();
//                       }}
//                     >
//                       {loadingNewFolder ? (
//                         <span className="animate-spin mr-2">⏳</span>
//                       ) : (
//                         "📁"
//                       )}{" "}
//                       Tạo thư mục mới
//                     </li>
//                     <li
//                       className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
//                       onClick={() => {
//                         setShowModal(false);
//                         setShowUploadModal(true);
//                       }}
//                     >
//                       📤 Tải lên
//                     </li>
//                   </ul>
//                 </div>
//               )}
//             </div>

//             <div className="hidden lg:flex gap-2">
//               <BsFillGrid3X3GapFill
//                 onClick={() => setIsLayout(false)} // Chuyển sang table
//                 style={{ cursor: "pointer", transition: "all 0.3s" }}
//                 size={30}
//                 color={isLayout ? "#A2A2A2" : "#1E293B"}
//               />
//               <BsFillGrid3X2GapFill
//                 onClick={() => setIsLayout(true)} // Chuyển sang card
//                 style={{ cursor: "pointer", transition: "all 0.3s" }}
//                 size={30}
//                 color={isLayout ? "#1E293B" : "#A2A2A2"}
//               />
//             </div>
//           </div>

//           {/* Button right */}
//           {isChecked && (
//             <div className="flex flex-wrap gap-5 mt-3">
//               <Button_icon
//                 text="Di chuyển"
//                 icon={<IoMoveOutline />}
//                 bg="bg-primary"
//               />
//               <Button_icon
//                 text="Tải xuống"
//                 icon={<FiDownload />}
//                 bg="bg-[#828DAD]"
//               />
//               <Button_icon
//                 text="Xóa"
//                 icon={<RiDeleteBin6Line />}
//                 bg="bg-[#DC2626]"
//               />
//             </div>
//           )}
//         </div>
//         {/* Nút back khi không ở root */}
//         <button
//           className={`block items-center h-2  gap-2 mb-2 transition-all mt-5 text-primary hover:underline hover:text-blue-700 font-medium text-base ${
//             breadcrumb.length > 1 ? "opacity-100" : "opacity-0"
//           }`}
//           onClick={handleBackFolder}
//         >
//           <IoArrowBackOutline size={22} />
//         </button>
//         {/* Card/Table view: mobile luôn là Card, desktop cho phép chuyển đổi qua lại bằng isLayout */}
//         {!loading && (
//           <>
//             {isMobileDevice || isLayout ? (
//               <div className="mt-4 w-full justify-center flex flex-wrap gap-4 transition-opacity duration-300">
//                 {filteredData.map((item) => (
//                   <Card_file
//                     key={item.id}
//                     data={item}
//                     onClick={() => {
//                       if (item.type === "folder") handleRowClick(item);
//                     }}
//                     onMoveItem={handleMoveItem}
//                     selectedItems={selectedItems}
//                     onSelectItem={handleSelectItem}
//                     draggedItems={draggedItems}
//                     onDragStart={handleDragStart}
//                     onDragEnd={handleDragEnd}
//                     onRenameFolder={handleRenameFolder}
//                     onPreviewFile={handlePreviewFile}
//                   />
//                 ))}
//               </div>
//             ) : (
//               <div className="lg:block hidden transition-opacity duration-300">
//                 <Table
//                   header={header}
//                   data={filteredData}
//                   handleChecked={handleCheck}
//                   editingFolderId={editingFolderId}
//                   handleRename={handleRename}
//                   onRowClick={handleRowClick}
//                   onMoveItem={handleMoveItem}
//                   selectedItems={selectedItems}
//                   onSelectItem={handleSelectItem}
//                   onSelectAll={handleSelectAll}
//                   draggedItems={draggedItems}
//                   onDragStart={handleDragStart}
//                   onDragEnd={handleDragEnd}
//                   onRenameFolder={handleRenameFolder}
//                   onPreviewFile={handlePreviewFile}
//                 />
//               </div>
//             )}
//             {/* Nút tải thêm chỉ ở root và chỉ khi còn dữ liệu */}
//             {currentFolderId == null &&
//               allFilesLength + rootFoldersLength < totalItems &&
//               page < totalPages && (
//                 <div className="flex justify-center my-4">
//                   <button
//                     onClick={loadMore}
//                     disabled={loadingMore}
//                     className="px-4 py-2 rounded bg-primary text-white disabled:bg-gray-300"
//                   >
//                     {loadingMore ? "Đang tải..." : "Tải thêm"}
//                   </button>
//                 </div>
//               )}
//           </>
//         )}

//         {/* Upload Modal */}
//         <UploadModal
//           isOpen={showUploadModal}
//           onClose={() => setShowUploadModal(false)}
//           onUploaded={reloadData}
//           onShowMiniUploadStatus={handleShowMiniUploadStatus}
//           onUpdateMiniUploadStatus={handleUpdateMiniUploadStatus}
//           onHideMiniUploadStatus={handleHideMiniUploadStatus}
//         />

//         {/* Render nhiều UI mini upload xếp chồng nhau */}
//         <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
//           {uploadBatches.map((batch, idx) => (
//             <div key={batch.id} style={{ marginBottom: idx > 0 ? 12 : 0 }}>
//               <UploadMiniStatus files={batch.files} status={batch.status} />
//             </div>
//           ))}
//         </div>

//         {/* Thay thế action zone cũ bằng ActionZone */}
//         <ActionZone
//           isMobile={isMobileDevice}
//           selectedItems={selectedItems}
//           draggedItems={draggedItems}
//           onMove={handleDropMove}
//           onDownload={handleDownload}
//           onDelete={handleDropDelete}
//           onShare={handleShare}
//           showMoveModal={showMoveModal}
//           setShowMoveModal={setShowMoveModal}
//         />

//         {/* Modal chọn folder đích khi di chuyển */}
//         {showMoveModal && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//             <div className="bg-white rounded-xl p-6 min-w-[320px] shadow-2xl relative">
//               <h3 className="font-bold text-lg mb-4">Chọn thư mục đích</h3>
//               <div className="max-h-60 overflow-y-auto mb-4">
//                 <div
//                   className={`p-2 rounded cursor-pointer mb-1 ${
//                     moveTargetFolder && moveTargetFolder.id === null
//                       ? "bg-blue-200"
//                       : "hover:bg-blue-100"
//                   }`}
//                   onClick={() =>
//                     setMoveTargetFolder({ id: null, name: "Thư mục gốc" })
//                   }
//                 >
//                   �� Ra ngoài tất cả thư mục (Thư mục gốc)
//                 </div>
//                 {folders.map((folder) => (
//                   <div
//                     key={folder.driveFolderId}
//                     className={`p-2 rounded cursor-pointer mb-1 ${
//                       moveTargetFolder &&
//                       moveTargetFolder.id === folder.driveFolderId
//                         ? "bg-blue-200"
//                         : "hover:bg-blue-100"
//                     }`}
//                     onClick={() =>
//                       setMoveTargetFolder({
//                         id: folder.driveFolderId,
//                         name: folder.name,
//                       })
//                     }
//                   >
//                     📁 {folder.name}
//                   </div>
//                 ))}
//               </div>
//               <div className="flex gap-3 justify-end">
//                 <button
//                   onClick={handleCancelMove}
//                   className="px-4 py-2 rounded bg-gray-200"
//                 >
//                   Hủy
//                 </button>
//                 <button
//                   onClick={handleConfirmMove}
//                   className="px-4 py-2 rounded bg-primary text-white disabled:bg-gray-300"
//                   disabled={moveTargetFolder === null}
//                 >
//                   Di chuyển
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Modal xem file */}
//         {previewFile && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
//             <div className="relative bg-white rounded-xl shadow-2xl max-w-full max-h-full w-[90vw] h-[90vh] flex flex-col">
//               <button
//                 className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-2xl z-10"
//                 onClick={closePreview}
//                 aria-label="Đóng"
//               >
//                 ×
//               </button>
//               <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
//                 {(() => {
//                   const fileId = previewFile.id || previewFile.driveFileId;
//                   const name =
//                     previewFile.name || previewFile.originalName || "";
//                   const ext = name.split(".").pop().toLowerCase();
//                   const previewUrl = fileId
//                     ? `https://drive.google.com/file/d/${fileId}/preview`
//                     : null;
//                   const downloadUrl = fileId
//                     ? `https://drive.google.com/uc?export=download&id=${fileId}`
//                     : previewFile.url ||
//                       (typeof previewFile.download === "string"
//                         ? previewFile.download
//                         : null);
//                   // Nếu là ảnh, video, audio: chỉ hiện nút xem file
//                   if (
//                     /\.(jpg|jpeg|png|gif|bmp|webp|mp4|webm|ogg|mp3|wav)$/i.test(
//                       name
//                     )
//                   ) {
//                     return (
//                       <a
//                         href={previewUrl || downloadUrl}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="inline-block px-6 py-3 bg-primary text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all shadow"
//                       >
//                         Xem file
//                       </a>
//                     );
//                   }
//                   // PDF: nhúng preview
//                   if (/\.(pdf)$/i.test(name)) {
//                     return (
//                       <iframe
//                         src={previewUrl}
//                         title={name}
//                         className="w-full h-[70vh] rounded shadow"
//                       />
//                     );
//                   }
//                   // File khác: hiện nút tải về
//                   return (
//                     <a
//                       href={downloadUrl}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="inline-block px-6 py-3 bg-primary text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all shadow"
//                     >
//                       Tải xuống hoặc mở file này
//                     </a>
//                   );
//                 })()}
//               </div>
//               <div className="p-2 text-center text-gray-500 text-xs truncate">
//                 {previewFile.name || previewFile.originalName}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default Home_Component;
