// ============================================
// TradeVision AI — Chart Image Analyzer
// Analyzes chart screenshots using Canvas pixel analysis
// No external API required
// ============================================

/**
 * Converts RGB colors to HSL (Hue, Saturation, Lightness) for highly precise color detection
 */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } 
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

/**
 * Analyze a chart image using Canvas-based pixel analysis
 * Detects: dominant colors, trend direction, candle ratios, volatility
 */
export async function analyzeChartImage(imageBase64, mimeType) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Scale down for performance (max 400px width)
        const scale = Math.min(1, 400 / img.width);
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        const chartRegion = detectChartRegion(pixels, canvas.width, canvas.height);
        
        // 2. Perform localized analysis to increase accuracy
        const analysis = {
          dimensions: { width: canvas.width, height: canvas.height },
          chartRegion: chartRegion,
          colors: analyzeColors(pixels, canvas.width, canvas.height, chartRegion),
          trend: analyzeTrend(pixels, canvas.width, canvas.height, chartRegion),
          volatility: analyzeVolatility(pixels, canvas.width, canvas.height, chartRegion),
          candleRatio: analyzeCandleColors(pixels, canvas.width, canvas.height, chartRegion),
          brightness: analyzeBrightness(pixels)
        };
        
        resolve(analysis);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = `data:${mimeType};base64,${imageBase64}`;
  });
}

/**
 * Analyze dominant colors in the image
 */
function analyzeColors(pixels, width, height, region) {
  let greenCount = 0, redCount = 0, blueCount = 0, whiteCount = 0, darkCount = 0;
  let totalPixels = 0;
  
  // Use dynamically detected chart region for more precision
  const startX = Math.floor(width * (region ? Math.max(0.05, region.left) : 0.15));
  const endX = Math.floor(width * (region ? Math.min(0.95, region.right) : 0.85));
  const startY = Math.floor(height * (region ? Math.max(0.05, region.top) : 0.1));
  const endY = Math.floor(height * (region ? Math.min(0.95, region.bottom) : 0.85));
  
  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      const i = (y * width + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      totalPixels++;
      
      const [h, s, l] = rgbToHsl(r, g, b);
      
      // More precise HSL-based color detection
      if (s > 0.2 && l > 0.2 && l < 0.8) {
        if (h > 80 && h < 160) greenCount++; // Green candles
        else if (h > 330 || h < 25) redCount++; // Red candles
        else if (h > 190 && h < 250) blueCount++; // Blue indicators
      } else if (l > 0.8) {
        whiteCount++; // Light backgrounds
      } else if (l < 0.2) {
        darkCount++; // Dark backgrounds
      }
    }
  }
  
  return {
    green: greenCount / totalPixels,
    red: redCount / totalPixels,
    blue: blueCount / totalPixels,
    white: whiteCount / totalPixels,
    dark: darkCount / totalPixels,
    isDarkTheme: darkCount > whiteCount,
    bullishDominance: greenCount / (greenCount + redCount + 1) // Avoid division by zero
  };
}

/**
 * Analyze trend direction by scanning pixel brightness from left to right
 */
function analyzeTrend(pixels, width, height, region) {
  // Dive the chart into vertical columns
  const columns = 30; // Increased granularity
  const colWidth = Math.floor(width / columns);
  const centerOfMass = [];
  
  // Detect background color
  const bgColor = detectBackgroundColor(pixels, width, height);
  
  const startY = Math.floor(height * (region ? region.top : 0.1));
  const endY = Math.floor(height * (region ? region.bottom : 0.85));
  
  for (let col = 0; col < columns; col++) {
    let totalWeight = 0;
    let weightedY = 0;
    
    for (let x = col * colWidth; x < (col + 1) * colWidth && x < width; x += 2) {
      for (let y = startY; y < endY; y++) {
        const i = (y * width + x) * 4;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        
        const diffR = Math.abs(r - bgColor.r);
        const diffG = Math.abs(g - bgColor.g);
        const diffB = Math.abs(b - bgColor.b);
        const colorDiff = diffR + diffG + diffB;
        
        if (colorDiff > 80) { 
          const weight = colorDiff / 765;
          totalWeight += weight;
          weightedY += (height - y) * weight;
        }
      }
    }
    
    centerOfMass.push(totalWeight > 0 ? weightedY / totalWeight : height / 2);
  }
  
  // High-precision linear regression for trend slope
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  const n = centerOfMass.length;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += centerOfMass[i];
    sumXY += i * centerOfMass[i];
    sumX2 += i * i;
  }
  
  const regressionSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const trendSlope = regressionSlope / (height / columns);
  
  let maxSwing = 0;
  for (let i = 1; i < centerOfMass.length; i++) {
    maxSwing = Math.max(maxSwing, Math.abs(centerOfMass[i] - centerOfMass[i - 1]));
  }
  
  let direction, strength;
  if (trendSlope > 0.08) { direction = 'bullish'; strength = trendSlope > 0.2 ? 'strong' : 'moderate'; }
  else if (trendSlope < -0.08) { direction = 'bearish'; strength = trendSlope < -0.2 ? 'strong' : 'moderate'; }
  else { direction = 'sideways'; strength = 'weak'; }
  
  const firstThirdAvg = centerOfMass.slice(0, Math.floor(n/3)).reduce((a, b) => a + b, 0) / Math.floor(n/3);
  const middleThirdAvg = centerOfMass.slice(Math.floor(n/3), Math.floor(n*2/3)).reduce((a, b) => a + b, 0) / Math.floor(n/3);
  const lastThirdAvg = centerOfMass.slice(Math.floor(n*2/3)).reduce((a, b) => a + b, 0) / (n - Math.floor(n*2/3));
  
  return {
    direction,
    strength,
    slope: trendSlope,
    positions: centerOfMass,
    firstThirdAvg: firstThirdAvg,
    middleThirdAvg: middleThirdAvg,
    lastThirdAvg: lastThirdAvg,
    maxSwing
  };
}

/**
 * Analyze price volatility from pixel distribution
 */
function analyzeVolatility(pixels, width, height, region) {
  const bgColor = detectBackgroundColor(pixels, width, height);
  const columns = 10;
  const colWidth = Math.floor(width / columns);
  const ranges = [];
  
  const startY = Math.floor(height * (region ? region.top : 0.1));
  const endY = Math.floor(height * (region ? region.bottom : 0.85));
  
  for (let col = 0; col < columns; col++) {
    let minY = height, maxY = 0;
    
    for (let x = col * colWidth; x < (col + 1) * colWidth && x < width; x += 3) {
      for (let y = startY; y < endY; y++) {
        const i = (y * width + x) * 4;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        
        const diff = Math.abs(r - bgColor.r) + Math.abs(g - bgColor.g) + Math.abs(b - bgColor.b);
        if (diff > 100) {
          const [h, s, l] = rgbToHsl(r, g, b);
          // Only map boundaries using saturated colors (candles, lines) to ignore noise
          if (s > 0.2 && l > 0.2 && l < 0.8) {
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      }
    }
    
    if (maxY > minY) {
      ranges.push((maxY - minY) / height);
    }
  }
  
  const avgRange = ranges.length > 0 ? ranges.reduce((a, b) => a + b, 0) / ranges.length : 0.3;
  const maxRange = Math.max(...ranges, 0.1);
  
  let level;
  if (avgRange > 0.5) level = 'very high';
  else if (avgRange > 0.35) level = 'high';
  else if (avgRange > 0.2) level = 'moderate';
  else level = 'low';
  
  return { level, avgRange, maxRange, ranges };
}

/**
 * Count green vs red candle pixels
 */
function analyzeCandleColors(pixels, width, height, region) {
  let greenPixels = 0, redPixels = 0;
  
  // Use precise region
  const startX = Math.floor(width * (region ? region.left : 0.1));
  const endX = Math.floor(width * (region ? region.right : 0.9));
  const startY = Math.floor(height * (region ? region.top : 0.1));
  const endY = Math.floor(height * (region ? region.bottom : 0.85));
  
  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      const i = (y * width + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      
      const [h, s, l] = rgbToHsl(r, g, b);
      
      // HSL color bound filter for precision mapping
      if (s > 0.25 && l > 0.15 && l < 0.85) {
        if (h > 70 && h < 160) greenPixels++;
        else if (h > 330 || h < 25) redPixels++;
      }
    }
  }
  
  const total = greenPixels + redPixels;
  return {
    greenRatio: total > 0 ? greenPixels / total : 0.5,
    redRatio: total > 0 ? redPixels / total : 0.5,
    totalCandlePixels: total,
    dominance: total > 0 
      ? (greenPixels > redPixels * 1.2 ? 'bullish' : 
         redPixels > greenPixels * 1.2 ? 'bearish' : 'mixed')
      : 'indeterminate'
  };
}

/**
 * Analyze overall image brightness
 */
function analyzeBrightness(pixels) {
  let totalBrightness = 0;
  let count = 0;
  
  for (let i = 0; i < pixels.length; i += 16) { // Sample every 4th pixel
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    totalBrightness += (r + g + b) / 3;
    count++;
  }
  
  return count > 0 ? totalBrightness / count : 128;
}

/**
 * Detect background color (sample corners and edges)
 */
function detectBackgroundColor(pixels, width, height) {
  const samples = [];
  const positions = [
    [2, 2], [width - 3, 2], [2, height - 3], [width - 3, height - 3], // corners
    [Math.floor(width / 2), 2], [2, Math.floor(height / 2)], // edges
  ];
  
  for (const [x, y] of positions) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const i = (y * width + x) * 4;
      samples.push({ r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] });
    }
  }
  
  // Average the corner/edge colors
  const avg = { r: 0, g: 0, b: 0 };
  samples.forEach(s => { avg.r += s.r; avg.g += s.g; avg.b += s.b; });
  avg.r = Math.floor(avg.r / samples.length);
  avg.g = Math.floor(avg.g / samples.length);
  avg.b = Math.floor(avg.b / samples.length);
  
  return avg;
}

/**
 * Detect where the actual chart area is
 */
function detectChartRegion(pixels, width, height) {
  const bgColor = detectBackgroundColor(pixels, width, height);
  
  let leftEdge = width, rightEdge = 0;
  let topEdge = height, bottomEdge = 0;
  
  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const i = (y * width + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      
      const diff = Math.abs(r - bgColor.r) + Math.abs(g - bgColor.g) + Math.abs(b - bgColor.b);
      if (diff > 100) {
        leftEdge = Math.min(leftEdge, x);
        rightEdge = Math.max(rightEdge, x);
        topEdge = Math.min(topEdge, y);
        bottomEdge = Math.max(bottomEdge, y);
      }
    }
  }
  
  return {
    left: leftEdge / width,
    right: rightEdge / width,
    top: topEdge / height,
    bottom: bottomEdge / height,
    chartWidth: (rightEdge - leftEdge) / width,
    chartHeight: (bottomEdge - topEdge) / height
  };
}
