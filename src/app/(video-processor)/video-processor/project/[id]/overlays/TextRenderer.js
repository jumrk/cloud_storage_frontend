function wrapText(ctx, text, maxWidth, maxLines = 2) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + " " + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) {
        const remaining = words.slice(i + 1).join(" ");
        if (remaining) {
          currentLine = currentLine + " " + remaining;
        }
        break;
      }
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  const result = lines.slice(0, maxLines);
  
  for (let i = 0; i < result.length; i++) {
    let line = result[i];
    let lineWidth = ctx.measureText(line).width;
    
    while (lineWidth > maxWidth && line.length > 0) {
      line = line.slice(0, -1);
      lineWidth = ctx.measureText(line).width;
    }
    
    result[i] = line;
  }
  
  return result;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function parseColor(color, alpha) {
  if (color.startsWith("#")) {
    return hexToRgba(color, alpha);
  } else if (color.startsWith("rgba")) {
    return color.replace(/[\d.]+\)$/, `${alpha})`);
  } else if (color.startsWith("rgb")) {
    return color.replace("rgb", "rgba").replace(")", `, ${alpha})`);
  }
  return color;
}

export function drawTextLayers(ctx, layers = [], frameW, frameH, T) {
  if (!layers || layers.length === 0) return;
  
  const validLayers = layers.filter((t) => {
    const styleScale = Number(t.styleScale) ?? 1;
    return styleScale > 0 && styleScale >= 0.1;
  });
  
  if (validLayers.length === 0) return;
  
  // Set rendering quality settings every frame to ensure stability
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  
  // Cache active layers for this frame to avoid re-filtering
  const activeLayers = validLayers.filter((t) => {
    return T >= (t.start || 0) && T < (t.start || 0) + (t.duration || 0);
  });
  
  if (activeLayers.length === 0) return;
  
  for (const t of activeLayers) {
    
    const scale = t.scale ?? 1;
    const rot = (t.rotate || 0) * (Math.PI / 180);
    const fontSize = Math.round((t.fontSize || 48) * scale);
    
    if (fontSize <= 0 || fontSize < 5) continue;
    
    const text = String(t.text || "");
    const padding = fontSize * 0.2;
    const maxLines = t.maxLines ?? 2;
    const autoBreak = t.autoBreak !== false;
    const align = t.align || "center";
    
    ctx.save();
    // Reset all context settings to ensure stable rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    // Ensure font is set consistently to prevent flickering
    const fontStyle = t.style === "italic" ? "italic " : "";
    const fontWeight = t.weight || 600;
    const fontFamily = t.fontFamily || "Inter, Arial";
    ctx.font = `${fontStyle}${fontWeight} ${fontSize}px ${fontFamily}`;
    
    const maxTextWidth = frameW * 0.9 - padding * 2;
    const lines = autoBreak ? wrapText(ctx, text, maxTextWidth, maxLines) : [text];
    const textHeight = fontSize;
    const lineHeight = textHeight * 1.2;
    const totalHeight = lines.length * lineHeight;
    
    let maxLineWidth = 0;
    for (const line of lines) {
      const lineWidth = ctx.measureText(line).width;
      maxLineWidth = Math.max(maxLineWidth, Math.min(lineWidth, maxTextWidth));
    }
    
    const layoutWidth = maxLineWidth + padding * 2;
    const layoutHeight = totalHeight + padding * 2;
    
    const hPlace = t.x ?? 0.5;
    const vPlace = t.y ?? 0.85;
    
    // Round layout positions to pixel boundaries to prevent sub-pixel rendering issues
    let layoutX = 0;
    if (Math.abs(hPlace - 0.5) < 0.01) {
      layoutX = Math.round((frameW - layoutWidth) / 2);
    } else {
      const minX = 0;
      const maxX = Math.max(minX, frameW - layoutWidth);
      layoutX = Math.round(minX + hPlace * (maxX - minX));
    }
    layoutX = Math.max(0, Math.min(frameW - layoutWidth, layoutX));
    
    let layoutY = 0;
    if (Math.abs(vPlace - 0.5) < 0.01) {
      layoutY = Math.round((frameH - layoutHeight) / 2);
    } else {
      const minY = 0;
      const maxY = Math.max(minY, frameH - layoutHeight);
      layoutY = Math.round(minY + vPlace * (maxY - minY));
    }
    layoutY = Math.max(0, Math.min(frameH - layoutHeight, layoutY));
    
    // Round translation to pixel boundaries to prevent sub-pixel rendering
    const snappedLayoutCenterX = Math.round(layoutX + layoutWidth / 2);
    const snappedLayoutCenterY = Math.round(layoutY + layoutHeight / 2);
    ctx.translate(snappedLayoutCenterX, snappedLayoutCenterY);
    ctx.rotate(rot);
    
    if (t.bgEnabled && t.bgColor) {
      const bgAlpha = t.bgOpacity ?? 0.5;
      const bgRgba = parseColor(t.bgColor || "#000000", bgAlpha);
      const bgW = layoutWidth;
      const bgH = layoutHeight;
      const bgX = -bgW / 2;
      const bgY = -layoutHeight / 2;
      
      ctx.fillStyle = bgRgba;
      ctx.fillRect(bgX, bgY, bgW, bgH);
    }
    
    const startY = -(lines.length - 1) * lineHeight / 2;
    
    // Calculate karaoke highlighting based on current time
    let karaokeRanges = [];
    if (t.karaokeEnabled && text && lines.length === 1) {
      const clipStart = t.start || 0;
      const clipDuration = t.duration || 0;
      
      // Only highlight if current time is within clip duration
      if (T >= clipStart && T < clipStart + clipDuration) {
        const localTime = T - clipStart;
        
        const wordTiming = t.wordTiming;
        
        if (wordTiming && Array.isArray(wordTiming) && wordTiming.length > 0) {
          const words = text.match(/\S+\s*/g) || [];
          const originalWordCount = wordTiming.length;
          const currentWordCount = words.length;
          const needsScaling = originalWordCount !== currentWordCount;

          let scaledWordTiming = wordTiming;
          if (needsScaling && clipDuration > 0) {
            const originalDuration = wordTiming[wordTiming.length - 1]?.end || clipDuration;
            const scaleFactor = clipDuration / originalDuration;
            
            scaledWordTiming = wordTiming.map((wt) => ({
              word: wt.word || "",
              start: (Number(wt.start) || 0) * scaleFactor,
              end: (Number(wt.end) || wt.start || 0) * scaleFactor,
            }));

            if (currentWordCount !== originalWordCount) {
              const wordsPerOriginalWord = currentWordCount / originalWordCount;
              const newWordTiming = [];
              
              for (let i = 0; i < scaledWordTiming.length; i++) {
                const wt = scaledWordTiming[i];
                const nextWt = scaledWordTiming[i + 1];
                const wordStart = wt.start;
                const wordEnd = nextWt ? nextWt.start : wt.end;
                const wordDuration = wordEnd - wordStart;
                
                const wordsInSegment = Math.round(wordsPerOriginalWord);
                const segmentDuration = wordDuration / wordsInSegment;
                
                for (let j = 0; j < wordsInSegment && (i * wordsPerOriginalWord + j) < currentWordCount; j++) {
                  newWordTiming.push({
                    word: words[Math.floor(i * wordsPerOriginalWord + j)] || "",
                    start: wordStart + (j * segmentDuration),
                    end: wordStart + ((j + 1) * segmentDuration),
                  });
                }
              }
              
              scaledWordTiming = newWordTiming.slice(0, currentWordCount);
            }
          }

          let charIndex = 0;
          let highlightedEnd = 0;
          
          for (let i = 0; i < scaledWordTiming.length && i < words.length; i++) {
            const wordTimingItem = scaledWordTiming[i];
            const word = words[i];
            const wordStart = Number(wordTimingItem.start) || 0;
            const wordEnd = Number(wordTimingItem.end) || wordStart;
            const wordCharStart = charIndex;
            const wordCharEnd = charIndex + word.length;
            
            if (localTime >= wordStart) {
              if (localTime >= wordEnd) {
                highlightedEnd = wordCharEnd;
              } else {
                const wordDuration = wordEnd - wordStart;
                if (wordDuration > 0) {
                  const wordProgress = (localTime - wordStart) / wordDuration;
                  const highlightChars = Math.floor(wordProgress * word.length);
                  highlightedEnd = wordCharStart + Math.max(0, highlightChars);
                } else {
                  highlightedEnd = wordCharEnd;
                }
                break;
              }
            } else {
              break;
            }
            
            charIndex = wordCharEnd;
          }
          
          if (highlightedEnd > 0) {
            karaokeRanges.push({
              start: 0,
              end: highlightedEnd,
              color: "#000000", // Black text on karaoke background for contrast
              bg: t.karaokeBg || "#ffff00",
            });
          }
        } else {
          // Fallback to uniform progress-based highlighting (original behavior)
          const progress = clipDuration > 0 ? Math.max(0, Math.min(1, localTime / clipDuration)) : 0;
          
          // Split text into words (preserve spaces)
          const words = text.match(/\S+\s*/g) || [];
          if (words.length > 0) {
            const totalChars = text.length;
            let charIndex = 0;
            let highlightedEnd = 0;
            
            // Calculate cumulative character positions for each word
            const wordPositions = [];
            for (let i = 0; i < words.length; i++) {
              const word = words[i];
              const wordStart = charIndex;
              const wordEnd = charIndex + word.length;
              wordPositions.push({ start: wordStart, end: wordEnd, word });
              charIndex = wordEnd;
            }
            
            // Find which words should be highlighted based on progress
            for (let i = 0; i < wordPositions.length; i++) {
              const { start, end, word } = wordPositions[i];
              const wordStartProgress = start / totalChars;
              const wordEndProgress = end / totalChars;
              
              if (progress >= wordStartProgress) {
                if (progress >= wordEndProgress) {
                  // Entire word is highlighted
                  highlightedEnd = end;
                } else {
                  // Partial word highlight (calculate character position within word)
                  const wordProgress = (progress - wordStartProgress) / (wordEndProgress - wordStartProgress);
                  const highlightChars = Math.floor(wordProgress * word.length);
                  highlightedEnd = start + Math.max(0, highlightChars);
                  break;
                }
              } else {
                break;
              }
            }
            
            if (highlightedEnd > 0) {
              karaokeRanges.push({
                start: 0,
                end: highlightedEnd,
                color: "#000000", // Black text on karaoke background for contrast
                bg: t.karaokeBg || "#ffff00",
              });
            }
          }
        }
      }
    }
    
    if (t.karaokeEnabled && lines.length === 1) {
      // Render karaoke highlighting - always render text, highlight based on time
      const line = lines[0];
      
      // Pre-measure all text segments to ensure stable rendering
      const fullLineWidth = ctx.measureText(line).width;
      const lineWidth = Math.min(fullLineWidth, maxTextWidth);
      
      let baseX = 0;
      if (align === "left") {
        baseX = -layoutWidth / 2 + padding;
      } else if (align === "right") {
        baseX = layoutWidth / 2 - lineWidth - padding;
      } else {
        baseX = -lineWidth / 2;
      }
      
      // Snap baseX to pixel grid to prevent flickering
      baseX = Math.round(baseX);
      const snappedStartY = Math.round(startY);
      const snappedBgY = Math.round(-textHeight / 2);
      const snappedBgH = Math.round(textHeight);
      
      // Draw karaoke background highlights first (if any)
      if (karaokeRanges.length > 0) {
        const karaokeAlpha = t.karaokeOpacity ?? 0.8;
        karaokeRanges.forEach((range) => {
          const startText = line.substring(0, range.start);
          const rangeText = line.substring(range.start, range.end);
          
          // Pre-measure widths once and cache to prevent flickering
          const startWidth = ctx.measureText(startText).width;
          const rangeWidth = ctx.measureText(rangeText).width;
          
          // Use karaokeBg from karaoke settings
          const karaokeBgRgba = parseColor(range.bg || t.karaokeBg || "#ffff00", karaokeAlpha);
          
          // Snap all positions to pixel grid to prevent sub-pixel rendering
          const bgX = Math.round(baseX + startWidth);
          const bgW = Math.max(1, Math.round(rangeWidth));
          const snappedBgYFinal = Math.round(snappedBgY);
          const snappedBgHFinal = Math.round(snappedBgH);
          
          ctx.fillStyle = karaokeBgRgba;
          ctx.fillRect(bgX, snappedBgYFinal, bgW, snappedBgHFinal);
        });
      }
      
      // Draw text with karaoke colors - use consistent measurements and pixel snapping
      let currentX = baseX;
      let lastIndex = 0;
      
      if (karaokeRanges.length > 0) {
        karaokeRanges.sort((a, b) => a.start - b.start);
        
        for (const range of karaokeRanges) {
          if (range.start > lastIndex) {
            // Draw text before highlight (normal color)
            const beforeText = line.substring(lastIndex, range.start);
            const beforeWidth = ctx.measureText(beforeText).width;
            
            ctx.fillStyle = t.fill || "#ffffff";
            const beforeX = Math.round(currentX);
            const beforeY = Math.round(snappedStartY);
            ctx.fillText(beforeText, beforeX, beforeY);
            currentX += beforeWidth;
          }
          
          // Draw highlighted text (black on highlight background)
          const rangeText = line.substring(range.start, range.end);
          const rangeWidth = ctx.measureText(rangeText).width;
          
          ctx.fillStyle = range.color || "#000000";
          const rangeX = Math.round(currentX);
          const rangeY = Math.round(snappedStartY);
          ctx.fillText(rangeText, rangeX, rangeY);
          currentX += rangeWidth;
          lastIndex = range.end;
        }
        
        // Draw remaining text (normal color)
        if (lastIndex < line.length) {
          const remainingText = line.substring(lastIndex);
          ctx.fillStyle = t.fill || "#ffffff";
          const remainingX = Math.round(currentX);
          const remainingY = Math.round(snappedStartY);
          ctx.fillText(remainingText, remainingX, remainingY);
        }
      } else {
        // No highlight yet - draw all text in normal color
        ctx.fillStyle = t.fill || "#ffffff";
        const textX = Math.round(baseX);
        const textY = Math.round(snappedStartY);
        ctx.fillText(line, textX, textY);
      }
    } else {
      const color = t.fill || "#ffffff";
      const stroke = t.stroke || null;
      const sw = t.strokeWidth || 0;
      
      lines.forEach((line, index) => {
        const lineWidth = Math.min(ctx.measureText(line).width, maxTextWidth);
        
        let lineX = 0;
        if (align === "left") {
          lineX = -layoutWidth / 2 + padding;
        } else if (align === "right") {
          lineX = layoutWidth / 2 - lineWidth - padding;
        } else {
          lineX = -lineWidth / 2;
        }
        
        // Round line positions to pixel boundaries to prevent sub-pixel rendering
        lineX = Math.round(lineX);
        const lineY = Math.round(startY + index * lineHeight);
        
        if (stroke && sw > 0) {
          ctx.lineWidth = sw;
          ctx.strokeStyle = stroke;
          ctx.strokeText(line, lineX, lineY);
        }
        ctx.fillStyle = color;
        ctx.fillText(line, lineX, lineY);
      });
    }
    
    ctx.restore();
  }
}
