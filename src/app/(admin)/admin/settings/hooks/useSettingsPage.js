"use client";

import { useState, useEffect } from "react";
import aiChatSettingsService from "../services/aiChatSettingsService";
import aiAsrSettingsService from "../services/aiAsrSettingsService";
import aiOcrSettingsService from "../services/aiOcrSettingsService";
import aiVoiceSettingsService from "../services/aiVoiceSettingsService";
import paymentSettingsService from "../services/paymentSettingsService";
import toast from "react-hot-toast";

export default function useSettingsPage() {
  // AI Chat Settings state
  const [aiSettings, setAiSettings] = useState({
    enabled: false,
    provider: "openai",
    apiKey: "",
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 2000,
  });
  const [aiSettingsLoading, setAiSettingsLoading] = useState(false);

  // AI OCR Settings state
  const [ocrSettings, setOcrSettings] = useState({
    enabled: false,
    provider: "tesseract",
    credentials: "",
    awsAccessKeyId: "",
    awsSecretAccessKey: "",
    awsRegion: "us-east-1",
    accuracy: 0.8,
  });
  const [ocrSettingsLoading, setOcrSettingsLoading] = useState(false);

  // AI ASR Settings state
  const [asrSettings, setAsrSettings] = useState({
    enabled: false,
    provider: "whisper",
    credentials: "",
    awsAccessKeyId: "",
    awsSecretAccessKey: "",
    awsRegion: "us-east-1",
    whisperModel: "base",
  });
  const [asrSettingsLoading, setAsrSettingsLoading] = useState(false);

  // AI Voice Settings state - Array of providers
  const [voiceSettings, setVoiceSettings] = useState({
    enabled: false,
    providers: [], // Array of provider configs
  });
  const [voiceSettingsLoading, setVoiceSettingsLoading] = useState(false);

  // Payment Settings state
  const [paymentSettings, setPaymentSettings] = useState({
    vnpayEnabled: false,
    vnpayTmnCode: "",
    vnpayHashSecret: "",
    vnpayUrl: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  });
  const [paymentSettingsLoading, setPaymentSettingsLoading] = useState(false);

  const [loadingSettings, setLoadingSettings] = useState(true);

  // Load all settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoadingSettings(true);
      try {
        // Load AI Chat settings
        const chatResponse = await aiChatSettingsService.getSettings();
        if (chatResponse.success && chatResponse.data) {
          setAiSettings({
            enabled: chatResponse.data.enabled ?? false,
            provider: chatResponse.data.provider || "openai",
            apiKey: chatResponse.data.apiKey || "",
            model: chatResponse.data.model || "gpt-4o",
            temperature: chatResponse.data.temperature ?? 0.7,
            maxTokens: chatResponse.data.maxTokens ?? 2000,
          });
        }

        // Load OCR settings
        const ocrResponse = await aiOcrSettingsService.getSettings();
        if (ocrResponse.success && ocrResponse.data) {
          setOcrSettings({
            enabled: ocrResponse.data.enabled ?? false,
            provider: ocrResponse.data.provider || "tesseract",
            credentials: ocrResponse.data.credentials || "",
            awsAccessKeyId: ocrResponse.data.awsAccessKeyId || "",
            awsSecretAccessKey: ocrResponse.data.awsSecretAccessKey || "",
            awsRegion: ocrResponse.data.awsRegion || "us-east-1",
            accuracy: ocrResponse.data.accuracy ?? 0.8,
          });
        }

        // Load ASR settings
        const asrResponse = await aiAsrSettingsService.getSettings();
        if (asrResponse.success && asrResponse.data) {
          setAsrSettings({
            enabled: asrResponse.data.enabled ?? false,
            provider: asrResponse.data.provider || "whisper",
            credentials: asrResponse.data.credentials || "",
            awsAccessKeyId: asrResponse.data.awsAccessKeyId || "",
            awsSecretAccessKey: asrResponse.data.awsSecretAccessKey || "",
            awsRegion: asrResponse.data.awsRegion || "us-east-1",
            whisperModel: asrResponse.data.whisperModel || "base",
          });
        }

        // Load Voice settings
        const voiceResponse = await aiVoiceSettingsService.getSettings();
        if (voiceResponse.success && voiceResponse.data) {
          setVoiceSettings({
            enabled: voiceResponse.data.enabled ?? false,
            providers: voiceResponse.data.providers || [],
          });
        }

        // Load Payment settings
        try {
          const paymentResponse = await paymentSettingsService.getSettings();
          if (paymentResponse.success && paymentResponse.data) {
            setPaymentSettings({
              vnpayEnabled: paymentResponse.data.vnpayEnabled ?? false,
              vnpayTmnCode: paymentResponse.data.vnpayTmnCode || "",
              vnpayHashSecret: paymentResponse.data.vnpayHashSecret || "",
              vnpayUrl: paymentResponse.data.vnpayUrl || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
            });
          }
        } catch (err) {
            console.error("Error loading payment settings:", err);
            // Don't toast here to avoid spam if one service fails
        }

      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Không thể tải cài đặt");
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  const handleSaveAiSettings = async () => {
    setAiSettingsLoading(true);
    try {
      const response = await aiChatSettingsService.updateSettings(aiSettings);
      if (response.success) {
        toast.success(response.message || "Đã lưu cài đặt AI Chat thành công!");
      } else {
        toast.error(response.error || "Lỗi khi lưu cài đặt AI Chat");
      }
    } catch (error) {
      console.error("Error saving AI Chat settings:", error);
      toast.error(error.response?.data?.error || "Lỗi khi lưu cài đặt AI Chat");
    } finally {
      setAiSettingsLoading(false);
    }
  };

  const handleSaveOcrSettings = async () => {
    setOcrSettingsLoading(true);
    try {
      const response = await aiOcrSettingsService.updateSettings(ocrSettings);
      if (response.success) {
        toast.success(response.message || "Đã lưu cài đặt AI OCR thành công!");
      } else {
        toast.error(response.error || "Lỗi khi lưu cài đặt AI OCR");
      }
    } catch (error) {
      console.error("Error saving AI OCR settings:", error);
      toast.error(error.response?.data?.error || "Lỗi khi lưu cài đặt AI OCR");
    } finally {
      setOcrSettingsLoading(false);
    }
  };

  const handleSaveAsrSettings = async () => {
    setAsrSettingsLoading(true);
    try {
      const response = await aiAsrSettingsService.updateSettings(asrSettings);
      if (response.success) {
        toast.success(response.message || "Đã lưu cài đặt AI ASR thành công!");
      } else {
        toast.error(response.error || "Lỗi khi lưu cài đặt AI ASR");
      }
    } catch (error) {
      console.error("Error saving AI ASR settings:", error);
      toast.error(error.response?.data?.error || "Lỗi khi lưu cài đặt AI ASR");
    } finally {
      setAsrSettingsLoading(false);
    }
  };

  const handleSaveVoiceSettings = async () => {
    setVoiceSettingsLoading(true);
    try {
      const response = await aiVoiceSettingsService.updateSettings(voiceSettings);
      if (response.success) {
        toast.success(response.message || "Đã lưu cài đặt AI Lồng tiếng thành công!");
      } else {
        toast.error(response.error || "Lỗi khi lưu cài đặt AI Lồng tiếng");
      }
    } catch (error) {
      console.error("Error saving AI Voice settings:", error);
      toast.error(error.response?.data?.error || "Lỗi khi lưu cài đặt AI Lồng tiếng");
    } finally {
      setVoiceSettingsLoading(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    setPaymentSettingsLoading(true);
    try {
      const dataToSave = { ...paymentSettings };
      // Handle the hash secret logic: if "***" or empty and hasn't changed, we might send it as is.
      // But the requirement says: if not changing secret, send "***" or don't send field.
      // If the frontend receives encrypted secret, it likely comes as "encrypted_hash_..." or similar?
      // Or maybe it comes as "***". If the user didn't touch it, it remains the initial value.
      // If the user clears it, it becomes empty string?
      // Let's stick to sending whatever is in the state. The backend handle "***" logic.
      
      const response = await paymentSettingsService.updateSettings(dataToSave);
      if (response.success) {
         // Update state with returned data (useful if backend sanitized/modified fields)
         if (response.data) {
             setPaymentSettings(prev => ({ ...prev, ...response.data }));
         }
        toast.success(response.message || "Đã lưu cài đặt Thanh toán thành công!");
      } else {
        toast.error(response.error || "Lỗi khi lưu cài đặt Thanh toán");
      }
    } catch (error) {
      console.error("Error saving Payment settings:", error);
      toast.error(error.response?.data?.error || "Lỗi khi lưu cài đặt Thanh toán");
    } finally {
        setPaymentSettingsLoading(false);
    }
  };

  return {
    aiSettings,
    setAiSettings,
    aiSettingsLoading,
    ocrSettings,
    setOcrSettings,
    ocrSettingsLoading,
    asrSettings,
    setAsrSettings,
    asrSettingsLoading,
    voiceSettings,
    setVoiceSettings,
    voiceSettingsLoading,
    paymentSettings,
    setPaymentSettings,
    paymentSettingsLoading,
    loadingSettings,
    handleSaveAiSettings,
    handleSaveOcrSettings,
    handleSaveAsrSettings,
    handleSaveVoiceSettings,
    handleSavePaymentSettings,
  };
}

