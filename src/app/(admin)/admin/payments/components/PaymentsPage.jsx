"use client";
import React from "react";
import OverviewTab from "./OverviewTab";
import OrderTab from "./OrderTab";
import HistoryTab from "./HistoryTab";
import ConfigTab from "./ConfigTab";
import DiscountCodeTab from "./DiscountCodeTab";
import usePaymentsPage from "../hooks/usePaymentsPage";
export default function PaymentsPage() {
  const {
    activeTab,
    setActiveTab,
    ordersStats,
    orders,
    ordersLoading,
    orderSearch,
    setOrderSearch,
    orderStatus,
    setOrderStatus,
    orderPage,
    setOrderPage,
    orderTotalPages,
    refetchOrders,
    historyOrders,
    historyLoading,
    historySearch,
    setHistorySearch,
    historyStatus,
    setHistoryStatus,
    historyPage,
    setHistoryPage,
    historyTotalPages,
    paymentMethodsData,
    loadingMethods,
    actionLoading,
    modalOpen,
    editingMethod,
    confirmOpen,
    setConfirmOpen,
    handleAddPaymentMethod,
    handleEditPaymentMethod,
    handleDeletePaymentMethod,
    handleCloseModal,
    handleSubmitPaymentMethod,
    handleConfirmDelete,
  } = usePaymentsPage();
  return (
    <div className="w-full max-w-6xl mx-auto px-2 py-4">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          Quản lý thanh toán
        </h1>
        <p className="text-gray-500 text-sm">
          Quản lý doanh thu, cấu hình thanh toán và theo dõi lịch sử giao dịch.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {[
          { key: "overview", label: "Tổng quan doanh thu" },
          { key: "orders", label: "Đơn hàng" },
          { key: "config", label: "Cấu hình thanh toán" },
          { key: "history", label: "Lịch sử thanh toán" },
          { key: "discount", label: "Mã giảm giá" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-t-lg font-medium transition ${
              activeTab === tab.key
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "overview" && (
        <OverviewTab stats={ordersStats} loading={ordersLoading && !orders} />
      )}
      {activeTab === "orders" && (
        <OrderTab
          orders={orders}
          loading={ordersLoading}
          search={orderSearch}
          statusFilter={orderStatus}
          page={orderPage}
          totalPages={orderTotalPages}
          onSearch={setOrderSearch}
          onStatusFilter={setOrderStatus}
          onPage={setOrderPage}
          reloadOrders={refetchOrders}
        />
      )}
      {activeTab === "config" && (
        <ConfigTab
          paymentMethodsData={paymentMethodsData}
          loading={loadingMethods}
          onAdd={handleAddPaymentMethod}
          onEdit={handleEditPaymentMethod}
          onDelete={handleDeletePaymentMethod}
          actionLoading={actionLoading}
          modalOpen={modalOpen}
          editingMethod={editingMethod}
          onCloseModal={handleCloseModal}
          onSubmitPaymentMethod={handleSubmitPaymentMethod}
          confirmOpen={confirmOpen}
          onCloseConfirm={() => setConfirmOpen(false)}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
      {activeTab === "history" && (
        <HistoryTab
          orders={historyOrders}
          loading={historyLoading}
          search={historySearch}
          statusFilter={historyStatus}
          page={historyPage}
          totalPages={historyTotalPages}
          onSearch={setHistorySearch}
          onStatusFilter={setHistoryStatus}
          onPage={setHistoryPage}
        />
      )}
      {activeTab === "discount" && <DiscountCodeTab />}
    </div>
  );
}
