import { useState, useRef, useCallback, useEffect } from "react";
import { useSubtitle } from "../../context/SubtitleContext";

const STYLE_PRESETS = {
  classic: {
    font: "Inter",
    color: "#ffffff",
    scale: 0.5,
    weight: "600",
    style: "normal",
    align: "center",
    bgEnabled: true,
    bgColor: "#000000",
    bgOpacity: 0.45,
    hPlace: 0.5,
    vPlace: 0.85,
    autoBreak: true,
    maxLines: 2,
    maxWords: 12,
  },
  modern: {
    font: "Inter",
    color: "#ffffff",
    scale: 0.6,
    weight: "700",
    style: "normal",
    align: "center",
    bgEnabled: false,
    bgColor: "#000000",
    bgOpacity: 0.5,
    hPlace: 0.5,
    vPlace: 0.85,
    autoBreak: true,
    maxLines: 2,
    maxWords: 12,
  },
  cinematic: {
    font: "Inter",
    color: "#ffffff",
    scale: 0.55,
    weight: "800",
    style: "normal",
    align: "center",
    bgEnabled: false,
    bgColor: "#000000",
    bgOpacity: 0.5,
    karaokeBg: "#ffff00",
    karaokeOpacity: 0.8,
    hPlace: 0.5,
    vPlace: 0.85,
    autoBreak: true,
    maxLines: 2,
    maxWords: 12,
  },
};

const DEFAULTS = {
  classic: { text: "#ffffff", bg: "rgba(0,0,0,0.45)", highlight: "#ffffff" },
  modern: { text: "#ffffff", bg: "transparent", highlight: "#ffffff" },
  cinematic: { text: "#ffffff", bg: "transparent", highlight: "#ffb000" },
};

export default function useSubtitleStyle() {
  const { subtitleStyle, updateSubtitleStyle } = useSubtitle();

  const getSelectedStyleId = useCallback(() => {
    if (!subtitleStyle) return "none";
    if (subtitleStyle.styleId) return subtitleStyle.styleId;
    if (
      subtitleStyle.scale === 0 ||
      (subtitleStyle.scale && subtitleStyle.scale < 0.1)
    ) {
      return "none";
    }
    if (subtitleStyle.bgEnabled && subtitleStyle.bgOpacity === 0.45)
      return "classic";
    if (!subtitleStyle.bgEnabled && subtitleStyle.hiEnabled) return "cinematic";
    if (!subtitleStyle.bgEnabled && !subtitleStyle.hiEnabled) return "modern";
    return "classic";
  }, [subtitleStyle]);

  const [selectedId, setSelectedId] = useState(() => {
    if (!subtitleStyle) return "none";
    if (subtitleStyle.styleId) return subtitleStyle.styleId;
    if (subtitleStyle.scale === 0 || subtitleStyle.scale < 0.1) return "none";
    return "classic";
  });

  const initialScale = subtitleStyle?.scale ?? 0.5;
  const [scale, setScale] = useState(initialScale);
  const savedScaleRef = useRef(initialScale > 0.1 ? initialScale : 0.5);

  const [colors, setColors] = useState({
    classic: subtitleStyle?.color || DEFAULTS.classic.text,
    modern: subtitleStyle?.color || DEFAULTS.modern.text,
    cinematic: subtitleStyle?.hiColor || DEFAULTS.cinematic.highlight,
  });

  const [settings, setSettings] = useState(() => {
    return subtitleStyle || STYLE_PRESETS.classic;
  });

  useEffect(() => {
    const currentSelectedId = getSelectedStyleId();
    setSelectedId(currentSelectedId);
  }, [getSelectedStyleId]);

  useEffect(() => {
    if (subtitleStyle) {
      setSettings(subtitleStyle);
      setScale(subtitleStyle.scale ?? 0.5);
      setColors({
        classic: subtitleStyle.color || DEFAULTS.classic.text,
        modern: subtitleStyle.color || DEFAULTS.modern.text,
        cinematic: subtitleStyle.hiColor || DEFAULTS.cinematic.highlight,
      });
    }
  }, [subtitleStyle]);

  const handleSelectStyle = useCallback(
    (styleId) => {
      setSelectedId(styleId);

      if (styleId === "none") {
        savedScaleRef.current = scale > 0.1 ? scale : savedScaleRef.current;
        updateSubtitleStyle(null);
        setScale(0);
      } else {
        const preset = STYLE_PRESETS[styleId];
        if (preset) {
          const newStyle = {
            ...preset,
            styleId,
            color: colors[styleId] || preset.color,
            scale: styleId === selectedId ? scale : preset.scale,
            hPlaceBase: 0.5,
            hPlaceOffset: 0,
            vPlaceBase: 0.85,
            vPlaceOffset: 0,
          };
          if (styleId === "cinematic") {
            newStyle.hiColor = colors.cinematic || preset.hiColor;
          }
          updateSubtitleStyle(newStyle);
          setScale(newStyle.scale);
        }
      }
    },
    [colors, scale, selectedId, updateSubtitleStyle]
  );

  const handleColorChange = useCallback(
    (styleId, color) => {
      setColors((prev) => ({ ...prev, [styleId]: color }));
      if (selectedId === styleId && subtitleStyle) {
        const updatedStyle = { ...subtitleStyle };
        if (styleId === "cinematic") {
          updatedStyle.hiColor = color;
        } else {
          updatedStyle.color = color;
        }
        updateSubtitleStyle(updatedStyle);
      }
    },
    [selectedId, subtitleStyle, updateSubtitleStyle]
  );

  const handleScaleChange = useCallback(
    (newScale) => {
      setScale(newScale);
      if (subtitleStyle && selectedId !== "none") {
        const updatedStyle = { ...subtitleStyle, scale: newScale };
        updateSubtitleStyle(updatedStyle);
      }
    },
    [subtitleStyle, selectedId, updateSubtitleStyle]
  );

  const handleResetCard = useCallback(
    (styleId) => {
      const preset = STYLE_PRESETS[styleId];
      if (preset) {
        const defaultColor =
          styleId === "cinematic"
            ? DEFAULTS.cinematic.highlight
            : DEFAULTS[styleId].text;
        setColors((prev) => ({ ...prev, [styleId]: defaultColor }));
        if (selectedId === styleId && subtitleStyle) {
          const updatedStyle = {
            ...subtitleStyle,
            color: styleId === "cinematic" ? subtitleStyle.color : defaultColor,
            hiColor: styleId === "cinematic" ? defaultColor : subtitleStyle.hiColor,
          };
          updateSubtitleStyle(updatedStyle);
        }
      }
    },
    [selectedId, subtitleStyle, updateSubtitleStyle]
  );

  const handleSettingsChange = useCallback(
    (newSettings) => {
      setSettings(newSettings);
      if (subtitleStyle) {
        const updatedStyle = {
          ...subtitleStyle,
          ...newSettings,
          styleId: selectedId,
        };
        updateSubtitleStyle(updatedStyle);
      }
    },
    [subtitleStyle, selectedId, updateSubtitleStyle]
  );

  return {
    selectedId,
    scale,
    colors,
    settings,
    STYLE_PRESETS,
    DEFAULTS,
    handleSelectStyle,
    handleColorChange,
    handleScaleChange,
    handleResetCard,
    handleSettingsChange,
    getSelectedStyleId,
  };
}

