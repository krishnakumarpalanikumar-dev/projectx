// ============================================
// TradeVision AI — Chart Image Analyzer
// Analyzes chart screenshots using Canvas pixel analysis
// No external API required
// ============================================

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
        
        const analysis = {
          dimensions: { width: canvas.width, height: canvas.height },
          colors: analyzeColors(pixels, canvas.width, canvas.height),
          trend: analyzeTrend(pixels, canvas.width, canvas.height),
          volatility: analyzeVolatility(pixels, canvas.width, canvas.height),
          candleRatio: analyzeCandleColors(pixels, canvas.width, canvas.height),
          brightness: analyzeBrightness(pixels),
          chartRegion: detectChartRegion(pixels, canvas.width, canvas.height)
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
function analyzeColors(pixels, width, height) {
  let greenCount = 0, redCount = 0, blueCount = 0, whiteCount = 0, darkCount = 0;
  let totalPixels = 0;
  
  // Sample the center 60% of the image (where the chart typically is)
  const startX = Math.floor(width * 0.15);
  const endX = Math.floor(width * 0.85);
  const startY = Math.floor(height * 0.1);
  const endY = Math.floor(height * 0.85);
  
  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      const i = (y * width + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      totalPixels++;
      
      // Detect green candles / bullish elements
      if (g > r * 1.3 && g > b * 1.2 && g > 80) greenCount++;
      // Detect red candles / bearish elements
      else if (r > g * 1.3 && r > b * 1.2 && r > 80) redCount++;
      // Detect blue elements (indicators, lines)
      else if (b > r * 1.3 && b > g * 1.2 && b > 80) blueCount++;
      // White/light
      else if (r > 200 && g > 200 && b > 200) whiteCount++;
      // Dark/background
      else if (r < 60 && g < 60 && b < 60) darkCount++;
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
function analyzeTrend(pixels, width, height) {
  // Divide the chart into vertical columns and find the "center of mass" of non-background pixels
  const columns = 20; // Divide into 20 segments
  const colWidth = Math.floor(width / columns);
  const centerOfMass = [];
  
  // Detect background color (most common at edges)
  const bgColor = detectBackgroundColor(pixels, width, height);
  
  for (let col = 0; col < columns; col++) {
    let totalWeight = 0;
    let weightedY = 0;
    
    for (let x = col * colWidth; x < (col + 1) * colWidth && x < width; x += 2) {
      for (let y = Math.floor(height * 0.1); y < Math.floor(height * 0.85); y++) {
        const i = (y * width + x) * 4;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        
        // Check if this pixel is "interesting" (not background)
        const diffR = Math.abs(r - bgColor.r);
        const diffG = Math.abs(g - bgColor.g);
        const diffB = Math.abs(b - bgColor.b);
        const colorDiff = diffR + diffG + diffB;
        
        if (colorDiff > 80) { // Significant color difference from background
          const weight = colorDiff / 765; // Normalize
          totalWeight += weight;
          // Invert Y because in charts, up = lower Y coordinate
          weightedY += (height - y) * weight;
        }
      }
    }
    
    centerOfMass.push(totalWeight > 0 ? weightedY / totalWeight : height / 2);
  }
  
  // Calculate trend from center of mass positions
  const firstThird = centerOfMass.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
  const lastThird = centerOfMass.slice(13).reduce((a, b) => a + b, 0) / 7;
  const middleThird = centerOfMass.slice(7, 13).reduce((a, b) => a + b, 0) / 6;
  
  const trendSlope = (lastThird - firstThird) / firstThird;
  
  // Calculate volatility from center of mass changes
  let maxSwing = 0;
  for (let i = 1; i < centerOfMass.length; i++) {
    maxSwing = Math.max(maxSwing, Math.abs(centerOfMass[i] - centerOfMass[i - 1]));
  }
  
  let direction, strength;
  if (trendSlope > 0.08) { direction = 'bullish'; strength = trendSlope > 0.2 ? 'strong' : 'moderate'; }
  else if (trendSlope < -0.08) { direction = 'bearish'; strength = trendSlope < -0.2 ? 'strong' : 'moderate'; }
  else { direction = 'sideways'; strength = 'weak'; }
  
  return {
    direction,
    strength,
    slope: trendSlope,
    positions: centerOfMass,
    firstThirdAvg: firstThird,
    middleThirdAvg: middleThird,
    lastThirdAvg: lastThird,
    maxSwing
  };
}

/**
 * Analyze price volatility from pixel distribution
 */
function analyzeVolatility(pixels, width, height) {
  // Look at the vertical spread of non-background pixels across the chart
  const bgColor = detectBackgroundColor(pixels, width, height);
  const columns = 10;
  const colWidth = Math.floor(width / columns);
  const ranges = [];
  
  for (let col = 0; col < columns; col++) {
    let minY = height, maxY = 0;
    
    for (let x = col * colWidth; x < (col + 1) * colWidth && x < width; x += 3) {
      for (let y = Math.floor(height * 0.1); y < Math.floor(height * 0.85); y++) {
        const i = (y * width + x) * 4;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        
        const diffR = Math.abs(r - bgColor.r);
        const diffG = Math.abs(g - bgColor.g);
        const diffB = Math.abs(b - bgColor.b);
        
        if (diffR + diffG + diffB > 100) {
          if ((r > g * 1.2 && r > 80) || (g > r * 1.2 && g > 80)) { // candle-like colors
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
function analyzeCandleColors(pixels, width, height) {
  let greenPixels = 0, redPixels = 0;
  
  // Focus on the main chart area
  const startX = Math.floor(width * 0.1);
  const endX = Math.floor(width * 0.9);
  const startY = Math.floor(height * 0.1);
  const endY = Math.floor(height * 0.85);
  
  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      const i = (y * width + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      
      // Green candle detection (various shades)
      if (g > r * 1.2 && g > 60 && g > b) greenPixels++;
      // Red candle detection (various shades)
      else if (r > g * 1.2 && r > 60 && r > b) redPixels++;
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
