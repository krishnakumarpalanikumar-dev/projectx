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
        
        // Scale down for performance (max 500px width for better accuracy)
        const scale = Math.min(1, 500 / img.width);
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        const bgColor = detectBackgroundColor(pixels, canvas.width, canvas.height);
        const chartRegion = detectChartRegion(pixels, canvas.width, canvas.height, bgColor);
        
        // Perform localized analysis
        const colors = analyzeColors(pixels, canvas.width, canvas.height, chartRegion);
        const candleRatio = analyzeCandleColors(pixels, canvas.width, canvas.height, chartRegion);
        const trendRaw = analyzeTrend(pixels, canvas.width, canvas.height, chartRegion, bgColor);
        const volatility = analyzeVolatility(pixels, canvas.width, canvas.height, chartRegion, bgColor);
        const brightness = analyzeBrightness(pixels);
        
        // Multi-factor consensus: combine slope, segment comparison, and candle colors
        const trend = buildTrendConsensus(trendRaw, candleRatio, colors);
        
        const analysis = {
          dimensions: { width: canvas.width, height: canvas.height },
          chartRegion,
          colors,
          trend,
          volatility,
          candleRatio,
          brightness
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
 * Multi-factor consensus trend determination.
 * Combines pixel slope, segment comparison, and candle color ratio
 * to produce a final direction and strength that rarely falls into "sideways".
 */
function buildTrendConsensus(trendRaw, candleRatio, colors) {
  // --- Factor 1: Pixel regression slope ---
  let slopeVote = 'sideways';
  let slopeConfidence = 0; // 0-1
  const absSlope = Math.abs(trendRaw.slope);
  
  if (trendRaw.slope > 0.02) {
    slopeVote = 'bullish';
    slopeConfidence = Math.min(1, absSlope / 0.25);
  } else if (trendRaw.slope < -0.02) {
    slopeVote = 'bearish';
    slopeConfidence = Math.min(1, absSlope / 0.25);
  } else {
    slopeConfidence = 0.1;
  }
  
  // --- Factor 2: Segment comparison (last third vs first third) ---
  let segmentVote = 'sideways';
  let segmentConfidence = 0;
  const segDiff = trendRaw.lastThirdAvg - trendRaw.firstThirdAvg;
  const segRange = trendRaw.maxSwing > 0 ? trendRaw.maxSwing : 1;
  const segRatio = segDiff / segRange;
  
  if (segRatio > 0.15) {
    segmentVote = 'bullish';
    segmentConfidence = Math.min(1, segRatio / 1.0);
  } else if (segRatio < -0.15) {
    segmentVote = 'bearish';
    segmentConfidence = Math.min(1, Math.abs(segRatio) / 1.0);
  } else {
    segmentConfidence = 0.1;
  }
  
  // --- Factor 3: Candle color dominance ---
  let candleVote = 'sideways';
  let candleConfidence = 0;
  
  if (candleRatio.totalCandlePixels > 50) { // Need minimum candle pixels to trust
    const greenR = candleRatio.greenRatio;
    const redR = candleRatio.redRatio;
    
    if (greenR > 0.55) {
      candleVote = 'bullish';
      candleConfidence = Math.min(1, (greenR - 0.5) * 4); // 0.55→0.2, 0.75→1.0
    } else if (redR > 0.55) {
      candleVote = 'bearish';
      candleConfidence = Math.min(1, (redR - 0.5) * 4);
    } else {
      candleConfidence = 0.15;
    }
  }
  
  // --- Factor 4: Overall color dominance (green vs red pixels in chart) ---
  let colorVote = 'sideways';
  let colorConfidence = 0;
  
  if (colors.bullishDominance > 0.58) {
    colorVote = 'bullish';
    colorConfidence = Math.min(1, (colors.bullishDominance - 0.5) * 4);
  } else if (colors.bullishDominance < 0.42) {
    colorVote = 'bearish';
    colorConfidence = Math.min(1, (0.5 - colors.bullishDominance) * 4);
  } else {
    colorConfidence = 0.1;
  }
  
  // --- Weighted voting ---
  // Slope and candle colors are the strongest signals
  const weights = {
    slope: 0.35,
    segment: 0.20,
    candle: 0.30,
    color: 0.15
  };
  
  const votes = [
    { dir: slopeVote, conf: slopeConfidence, w: weights.slope },
    { dir: segmentVote, conf: segmentConfidence, w: weights.segment },
    { dir: candleVote, conf: candleConfidence, w: weights.candle },
    { dir: colorVote, conf: colorConfidence, w: weights.color },
  ];
  
  let bullishScore = 0, bearishScore = 0, sidewaysScore = 0;
  for (const v of votes) {
    const s = v.conf * v.w;
    if (v.dir === 'bullish') bullishScore += s;
    else if (v.dir === 'bearish') bearishScore += s;
    else sidewaysScore += s;
  }
  
  // Determine direction — give directional bias a boost to reduce HOLD results
  let direction, rawScore;
  const directionalMax = Math.max(bullishScore, bearishScore);
  
  if (directionalMax > sidewaysScore * 0.6 && directionalMax > 0.05) {
    // Prefer directional over sideways — only call sideways if REALLY nothing
    direction = bullishScore >= bearishScore ? 'bullish' : 'bearish';
    rawScore = directionalMax;
  } else {
    direction = 'sideways';
    rawScore = sidewaysScore;
  }
  
  // Determine strength
  let strength;
  if (rawScore > 0.25) strength = 'strong';
  else if (rawScore > 0.12) strength = 'moderate';
  else strength = 'weak';
  
  // If sideways, try to tiebreak with candle colors since that's the most reliable
  // signal on real charts — pixel position can be thrown off by UI elements
  if (direction === 'sideways' && candleRatio.totalCandlePixels > 100) {
    if (candleRatio.greenRatio > 0.52) {
      direction = 'bullish';
      strength = 'weak';
    } else if (candleRatio.redRatio > 0.52) {
      direction = 'bearish';
      strength = 'weak';
    }
  }
  
  return {
    direction,
    strength,
    slope: trendRaw.slope,
    positions: trendRaw.positions,
    firstThirdAvg: trendRaw.firstThirdAvg,
    middleThirdAvg: trendRaw.middleThirdAvg,
    lastThirdAvg: trendRaw.lastThirdAvg,
    maxSwing: trendRaw.maxSwing,
    // Debug: expose voting details
    _votes: { bullishScore, bearishScore, sidewaysScore, slopeVote, segmentVote, candleVote, colorVote }
  };
}

/**
 * Analyze dominant colors in the image
 */
function analyzeColors(pixels, width, height, region) {
  let greenCount = 0, redCount = 0, blueCount = 0, whiteCount = 0, darkCount = 0;
  let totalPixels = 0;
  
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
      
      // Widened HSL ranges for better detection across chart platforms
      if (s > 0.15 && l > 0.15 && l < 0.85) {
        if (h > 70 && h < 170) greenCount++;       // Green candles (wider range)
        else if (h > 320 || h < 30) redCount++;     // Red candles (wider range)
        else if (h > 185 && h < 260) blueCount++;   // Blue indicators
      } else if (l > 0.8) {
        whiteCount++;
      } else if (l < 0.2) {
        darkCount++;
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
    bullishDominance: greenCount / (greenCount + redCount + 1)
  };
}

/**
 * Analyze trend direction by scanning pixel brightness from left to right
 */
function analyzeTrend(pixels, width, height, region, bgColor) {
  const columns = 40; // Higher granularity for better accuracy
  const colWidth = Math.floor(width / columns);
  const centerOfMass = [];
  
  const startY = Math.floor(height * (region ? region.top : 0.1));
  const endY = Math.floor(height * (region ? region.bottom : 0.85));
  
  for (let col = 0; col < columns; col++) {
    let totalWeight = 0;
    let weightedY = 0;
    
    const colStartX = Math.floor(width * (region ? region.left : 0.1)) + col * colWidth;
    const colEndX = Math.min(colStartX + colWidth, Math.floor(width * (region ? region.right : 0.9)));
    
    for (let x = colStartX; x < colEndX; x += 2) {
      for (let y = startY; y < endY; y++) {
        const i = (y * width + x) * 4;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        
        const diffR = Math.abs(r - bgColor.r);
        const diffG = Math.abs(g - bgColor.g);
        const diffB = Math.abs(b - bgColor.b);
        const colorDiff = diffR + diffG + diffB;
        
        if (colorDiff > 60) {
          // Give extra weight to saturated colors (candles/lines vs grey UI elements)
          const [h, s, l] = rgbToHsl(r, g, b);
          const satBoost = s > 0.3 ? 2.0 : 1.0;
          const weight = (colorDiff / 765) * satBoost;
          totalWeight += weight;
          weightedY += (height - y) * weight; // Higher Y = higher price (inverted)
        }
      }
    }
    
    centerOfMass.push(totalWeight > 0 ? weightedY / totalWeight : height / 2);
  }
  
  // Linear regression for trend slope
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
  
  // Segment averages for comparison
  const thirdLen = Math.floor(n / 3);
  const firstThirdAvg = centerOfMass.slice(0, thirdLen).reduce((a, b) => a + b, 0) / thirdLen;
  const middleThirdAvg = centerOfMass.slice(thirdLen, thirdLen * 2).reduce((a, b) => a + b, 0) / thirdLen;
  const lastThirdAvg = centerOfMass.slice(thirdLen * 2).reduce((a, b) => a + b, 0) / (n - thirdLen * 2);
  
  return {
    slope: trendSlope,
    positions: centerOfMass,
    firstThirdAvg,
    middleThirdAvg,
    lastThirdAvg,
    maxSwing
  };
}

/**
 * Analyze price volatility from pixel distribution
 */
function analyzeVolatility(pixels, width, height, region, bgColor) {
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
        if (diff > 80) {
          const [h, s, l] = rgbToHsl(r, g, b);
          if (s > 0.15 && l > 0.15 && l < 0.85) {
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
 * Count green vs red candle pixels with wider hue ranges for platform compatibility
 */
function analyzeCandleColors(pixels, width, height, region) {
  let greenPixels = 0, redPixels = 0;
  
  const startX = Math.floor(width * (region ? region.left : 0.1));
  const endX = Math.floor(width * (region ? region.right : 0.9));
  const startY = Math.floor(height * (region ? region.top : 0.1));
  const endY = Math.floor(height * (region ? region.bottom : 0.85));
  
  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      const i = (y * width + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      
      const [h, s, l] = rgbToHsl(r, g, b);
      
      // Wider hue ranges for different chart platform color schemes
      // TradingView: green=#26a69a(h~170), red=#ef5350(h~1)
      // MetaTrader:  green=#00ff00(h=120), red=#ff0000(h=0)
      // Dark themes can shift hues slightly
      if (s > 0.20 && l > 0.12 && l < 0.88) {
        if (h > 60 && h < 175) greenPixels++;       // Wide green range
        else if (h > 320 || h < 30) redPixels++;     // Wide red range
      }
    }
  }
  
  const total = greenPixels + redPixels;
  return {
    greenRatio: total > 0 ? greenPixels / total : 0.5,
    redRatio: total > 0 ? redPixels / total : 0.5,
    totalCandlePixels: total,
    dominance: total > 0 
      ? (greenPixels > redPixels * 1.1 ? 'bullish' : 
         redPixels > greenPixels * 1.1 ? 'bearish' : 'mixed')
      : 'indeterminate'
  };
}

/**
 * Analyze overall image brightness
 */
function analyzeBrightness(pixels) {
  let totalBrightness = 0;
  let count = 0;
  
  for (let i = 0; i < pixels.length; i += 16) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    totalBrightness += (r + g + b) / 3;
    count++;
  }
  
  return count > 0 ? totalBrightness / count : 128;
}

/**
 * Detect background color using histogram mode (most frequent color bucket)
 * instead of corner averaging — much more reliable for charts with toolbars/panels
 */
function detectBackgroundColor(pixels, width, height) {
  // Build a color histogram with 8x8x8 buckets
  const bucketSize = 32; // 256 / 8
  const buckets = new Map();
  
  // Sample every 4th pixel for speed
  for (let i = 0; i < pixels.length; i += 16) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const key = `${Math.floor(r / bucketSize)},${Math.floor(g / bucketSize)},${Math.floor(b / bucketSize)}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  
  // Find the most common bucket
  let maxCount = 0, maxKey = '0,0,0';
  for (const [key, count] of buckets) {
    if (count > maxCount) {
      maxCount = count;
      maxKey = key;
    }
  }
  
  // Convert bucket back to approximate RGB
  const parts = maxKey.split(',').map(Number);
  const bg = {
    r: parts[0] * bucketSize + bucketSize / 2,
    g: parts[1] * bucketSize + bucketSize / 2,
    b: parts[2] * bucketSize + bucketSize / 2
  };
  
  // Also sample corners as a fallback validation
  const cornerSamples = [];
  const positions = [
    [2, 2], [width - 3, 2], [2, height - 3], [width - 3, height - 3],
  ];
  for (const [x, y] of positions) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const i = (y * width + x) * 4;
      cornerSamples.push({ r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] });
    }
  }
  
  // If corners are very similar to each other, use corner average (it's more precise)
  if (cornerSamples.length >= 4) {
    const cornerAvg = { r: 0, g: 0, b: 0 };
    cornerSamples.forEach(s => { cornerAvg.r += s.r; cornerAvg.g += s.g; cornerAvg.b += s.b; });
    cornerAvg.r /= cornerSamples.length;
    cornerAvg.g /= cornerSamples.length;
    cornerAvg.b /= cornerSamples.length;
    
    // Check if corners are consistent (all similar color)
    const cornerVariance = cornerSamples.reduce((sum, s) => {
      return sum + Math.abs(s.r - cornerAvg.r) + Math.abs(s.g - cornerAvg.g) + Math.abs(s.b - cornerAvg.b);
    }, 0) / cornerSamples.length;
    
    if (cornerVariance < 40) {
      // Corners are consistent — use them (more precise than histogram)
      return { r: Math.round(cornerAvg.r), g: Math.round(cornerAvg.g), b: Math.round(cornerAvg.b) };
    }
  }
  
  return bg;
}

/**
 * Detect where the actual chart area is, excluding UI elements
 */
function detectChartRegion(pixels, width, height, bgColor) {
  let leftEdge = width, rightEdge = 0;
  let topEdge = height, bottomEdge = 0;
  let colorPixelCount = 0;
  
  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const i = (y * width + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      
      const diff = Math.abs(r - bgColor.r) + Math.abs(g - bgColor.g) + Math.abs(b - bgColor.b);
      if (diff > 80) {
        leftEdge = Math.min(leftEdge, x);
        rightEdge = Math.max(rightEdge, x);
        topEdge = Math.min(topEdge, y);
        bottomEdge = Math.max(bottomEdge, y);
        colorPixelCount++;
      }
    }
  }
  
  // Add padding to exclude axis labels and toolbars
  // Typical chart: price axis on the right (~10% width), time axis at bottom (~10% height)
  const rawLeft = leftEdge / width;
  const rawRight = rightEdge / width;
  const rawTop = topEdge / height;
  const rawBottom = bottomEdge / height;
  
  return {
    left: Math.max(rawLeft, 0.05),
    right: Math.min(rawRight, 0.92),   // Exclude right price axis
    top: Math.max(rawTop, 0.05),
    bottom: Math.min(rawBottom, 0.88),  // Exclude bottom time axis
    chartWidth: (Math.min(rawRight, 0.92) - Math.max(rawLeft, 0.05)),
    chartHeight: (Math.min(rawBottom, 0.88) - Math.max(rawTop, 0.05))
  };
}
