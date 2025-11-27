export const DEFAULT_SETTINGS = {
  font: "Inter",
  color: "#ffffff",
  scale: 0.5,
  weight: "700",
  style: "normal",
  align: "center",
  bgEnabled: false,
  bgColor: "#000000",
  bgOpacity: 0.5,
  hiEnabled: false,
  hiColor: "#ffffff",
  hiBg: "#ffffff",
  hiOpacity: 0.5,
  karaokeEnabled: false,
  karaokeColor: "#ffff00",
  karaokeBg: "#ffff00",
  karaokeOpacity: 0.8,
  hPlace: 0.5,
  hPlaceBase: 0.5,
  hPlaceOffset: 0,
  vPlace: 0.85,
  vPlaceBase: 0.85,
  vPlaceOffset: 0,
  autoBreak: true,
  maxLines: 2,
  maxWords: 12,
};

export default function useSubtitleSettings({ settings, onSettingsChange }) {
  const handleReset = () => {
    onSettingsChange(DEFAULT_SETTINGS);
  };

  const handleFieldChange = (field, value) => {
    onSettingsChange({ ...settings, [field]: value });
  };

  const handleResetField = (field) => {
    onSettingsChange({ ...settings, [field]: DEFAULT_SETTINGS[field] });
  };

  return {
    DEFAULT_SETTINGS,
    handleReset,
    handleFieldChange,
    handleResetField,
  };
}

