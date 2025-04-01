/***********************************************
 * 9-DEEP PROCESSING ARRAY
 ***********************************************/
const stateHistory = [];
const MAX_HISTORY = 9;

function pushState(dataURL) {
  if (stateHistory.length === MAX_HISTORY) {
    // Remove oldest snapshot
    stateHistory.shift();
  }
  stateHistory.push(dataURL);
}

function popState() {
  if (stateHistory.length > 0) {
    return stateHistory.pop();
  }
  return null;
}

/***********************************************
 * DRAGGABLE AXIS CONTROLS
 ***********************************************/
let draggingX = false;
let draggingY = false;
let sliceX = null; // user-chosen vertical axis
let sliceY = null; // user-chosen horizontal axis

function positionAxisNodes() {
  const xNode = document.getElementById("xNode");
  const yNode = document.getElementById("yNode");

  // Vertical X line (centered at sliceX)
  xNode.style.left = `${sliceX - 0.5}px`; // 1px width
  xNode.style.top = "0";
  xNode.style.height = "100%";

  // Horizontal Y line (centered at sliceY)
  yNode.style.top = `${sliceY - 0.5}px`;
  yNode.style.left = "0";
  yNode.style.width = "100%";
}

function initAxisControls() {
  const xHandle = document.querySelector(".xHandle");
  const yHandle = document.querySelector(".yHandle");

  const canvas = document.getElementById("canvas");

  // If not set yet, center them
  if (sliceX === null) sliceX = canvas.width / 2;
  if (sliceY === null) sliceY = canvas.height / 2;
  positionAxisNodes();

  xHandle.addEventListener("pointerdown", (e) => {
    draggingX = true;
    xHandle.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  });
  xHandle.addEventListener("pointermove", (e) => {
    if (!draggingX) return;
    const rect = canvas.getBoundingClientRect();
    sliceX = e.clientX - rect.left;
    sliceX = Math.max(0, Math.min(sliceX, canvas.width));
    positionAxisNodes();
    e.preventDefault();
  });
  xHandle.addEventListener("pointerup", (e) => {
    draggingX = false;
    xHandle.releasePointerCapture(e.pointerId);
    e.preventDefault();
  });

  yHandle.addEventListener("pointerdown", (e) => {
    draggingY = true;
    yHandle.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  });
  yHandle.addEventListener("pointermove", (e) => {
    if (!draggingY) return;
    const rect = canvas.getBoundingClientRect();
    sliceY = e.clientY - rect.top;
    sliceY = Math.max(0, Math.min(sliceY, canvas.height));
    positionAxisNodes();
    e.preventDefault();
  });
  yHandle.addEventListener("pointerup", (e) => {
    draggingY = false;
    yHandle.releasePointerCapture(e.pointerId);
    e.preventDefault();
  });
}

/***********************************************
 * FILE LOADING & CANVAS DRAW
 ***********************************************/
document.getElementById("imageUpload").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      loadImageToCanvas(e.target.result);
    };
    reader.readAsDataURL(file);
  }
});

function loadImageToCanvas(imageSrc) {
  const img = new Image();
  img.src = imageSrc;

  img.onload = () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // ~95% usage
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let canvasWidth = viewportWidth * 0.95;
    let canvasHeight = viewportHeight * 0.95;

    // Maintain aspect ratio
    const aspectRatio = img.width / img.height;
    if (canvasWidth / aspectRatio > canvasHeight) {
      canvasWidth = canvasHeight * aspectRatio;
    } else {
      canvasHeight = canvasWidth / aspectRatio;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.dataset.originalSrc = imageSrc;
    pushState(canvas.toDataURL());

    // Initialize draggable axis
    initAxisControls();
  };
}

/***********************************************
 * MACROS
 ***********************************************/

/**
 * Macro1: X-axis "stretch" using sliceX
 */
function applyPixelStretchX() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;

  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const slice = Math.floor(sliceX);
    const strip = ctx.getImageData(slice, 0, 1, canvas.height);

    for (let x = slice; x < canvas.width; x++) {
      ctx.putImageData(strip, x, 0);
    }
    pushState(canvas.toDataURL());
  };
}

/**
 * Macro2: Y-axis "stretch" using sliceY
 */
function applyPixelStretchY() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;

  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const slice = Math.floor(sliceY);
    const strip = ctx.getImageData(0, slice, canvas.width, 1);

    for (let y = slice; y < canvas.height; y++) {
      ctx.putImageData(strip, 0, y);
    }
    pushState(canvas.toDataURL());
  };
}

/**
 * Macro3: Prime-based X offset
 */
function applyPrimeX() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;

  const offset = parseInt(document.getElementById("primeOffset").value, 10) || 5;
  const primes = generatePrimesUpTo(5000);

  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (let x = 0; x < canvas.width; x++) {
      if (x % offset === 0 && primes.includes(x)) {
        const slice = ctx.getImageData(x, 0, 1, canvas.height);
        if (x + 1 < canvas.width) {
          ctx.putImageData(slice, x + 1, 0);
        }
      }
    }
    pushState(canvas.toDataURL());
  };
}

function generatePrimesUpTo(n) {
  const sieve = new Array(n + 1).fill(true);
  sieve[0] = false; 
  sieve[1] = false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (sieve[i]) {
      for (let j = i * i; j <= n; j += i) {
        sieve[j] = false;
      }
    }
  }
  const result = [];
  for (let k = 2; k <= n; k++) {
    if (sieve[k]) result.push(k);
  }
  return result;
}

/**
 * Macro4: Color Shift (swap R and G if checkbox is on)
 */
function applyColorShift() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;

  const doShift = document.getElementById("colorShift").checked;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (doShift) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // swap R and G
        const r = data[i];
        data[i] = data[i + 1];
        data[i + 1] = r;
      }
      ctx.putImageData(imageData, 0, 0);
    }
    pushState(canvas.toDataURL());
  };
}

/**
 * Macro5: BezierX (but let's do something a bit more interesting
 * than a simple sine wave). We'll do a quick "two-hump" wave.
 */
function applyBezierX() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;

  const intensity = parseInt(document.getElementById("bezierIntensity").value, 10) || 25;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // For each row y, we shift horizontally by a "wave" function
    for (let y = 0; y < height; y++) {
      // Example wave: combine two sin() calls
      const shift = Math.floor(intensity * (0.5 * Math.sin(y * 0.02) + 0.5 * Math.cos(y * 0.01)));
      if (shift !== 0) {
        const rowStart = y * width * 4;
        const rowSlice = data.slice(rowStart, rowStart + width * 4);

        const newRow = new Uint8ClampedArray(rowSlice.length);
        for (let x = 0; x < width; x++) {
          const srcIndex = x * 4;
          let destIndex = (x + shift) * 4;
          if (destIndex >= 0 && destIndex < rowSlice.length) {
            newRow[destIndex] = rowSlice[srcIndex];
            newRow[destIndex+1] = rowSlice[srcIndex+1];
            newRow[destIndex+2] = rowSlice[srcIndex+2];
            newRow[destIndex+3] = rowSlice[srcIndex+3];
          }
        }
        for (let i = 0; i < newRow.length; i++) {
          data[rowStart + i] = newRow[i];
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    pushState(canvas.toDataURL());
  };
}

/**
 * Macro6: Example SVG Warp
 */
function applySvgWarp() {
  const path = document.getElementById("svgPath");
  let newD = "M 100 400";
  for (let x = 100; x <= 700; x += 100) {
    const y = 400 + Math.sin(x * 0.02) * 100;
    newD += ` Q ${x + 50} ${y - 50}, ${x} ${y}`;
  }
  path.setAttribute("d", newD);
}

/**
 * Macro7: Edge Detection + Region Labeling
 * We'll do a minimal Sobel => connected components => region listing
 */
function applyEdgeDetection() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;

  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    // 1) Draw the original
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 2) Get data
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const edges = sobelEdgeDetection(imageData);
    // edges is a one-channel array of magnitude

    // 3) Threshold => binary mask
    const thresholdVal = 80; 
    const binaryMask = new Uint8Array(width * height);
    for (let i = 0; i < edges.length; i++) {
      binaryMask[i] = edges[i] > thresholdVal ? 0 : 1; 
      // 0 => edge, 1 => inside region
    }

    // 4) Connected components
    const { labels, numLabels } = labelConnectedComponents(binaryMask, width, height);

    // 5) Build region color overlay + show region count in the sidebar
    //    Let's just highlight each region with a random color
    const outData = ctx.createImageData(width, height);
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      if (label < 0) {
        // edge
        outData.data[i * 4 + 0] = 0;
        outData.data[i * 4 + 1] = 0;
        outData.data[i * 4 + 2] = 0;
        outData.data[i * 4 + 3] = 255;
      } else {
        // random color from label
        const colorSeed = label * 13; // arbitrary
        outData.data[i * 4 + 0] = (colorSeed * 53) % 256;
        outData.data[i * 4 + 1] = (colorSeed * 31) % 256;
        outData.data[i * 4 + 2] = (colorSeed * 97) % 256;
        outData.data[i * 4 + 3] = 255;
      }
    }
    ctx.putImageData(outData, 0, 0);

    // 6) Show region listing
    const regionDetails = document.getElementById("regionDetails");
    const regionList = document.getElementById("regionList");
    regionDetails.style.display = "block";
    regionList.innerHTML = `Detected ${numLabels} regions.`;

    pushState(canvas.toDataURL());
  };
}

// Minimal Sobel
function sobelEdgeDetection(imageData) {
  const { width, height, data } = imageData;
  // Grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const avg = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    gray[i/4] = avg;
  }

  const output = new Float32Array(width * height);
  const kernelX = [[-1,0,1], [-2,0,2], [-1,0,1]];
  const kernelY = [[-1,-2,-1],[0,0,0],[1,2,1]];

  for (let y = 1; y < height-1; y++) {
    for (let x = 1; x < width-1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelVal = gray[(y+ky)*width + (x+kx)];
          gx += kernelX[ky+1][kx+1] * pixelVal;
          gy += kernelY[ky+1][kx+1] * pixelVal;
        }
      }
      const mag = Math.sqrt(gx*gx + gy*gy);
      output[y*width + x] = mag;
    }
  }
  return output;
}

// Minimal Connected Components (4 or 8 directions – here we do 8)
function labelConnectedComponents(binaryMask, width, height) {
  const labels = new Int32Array(width * height).fill(-1);
  let currentLabel = 0;

  for (let i = 0; i < binaryMask.length; i++) {
    if (binaryMask[i] === 1 && labels[i] < 0) {
      // BFS or DFS
      const queue = [i];
      labels[i] = currentLabel;

      while (queue.length > 0) {
        const idx = queue.shift();
        const x = idx % width;
        const y = (idx / width)|0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx===0 && dy===0) continue;
            const nx = x+dx;
            const ny = y+dy;
            if (nx>=0 && nx<width && ny>=0 && ny<height) {
              const nIdx = ny*width + nx;
              if (binaryMask[nIdx]===1 && labels[nIdx]<0) {
                labels[nIdx] = currentLabel;
                queue.push(nIdx);
              }
            }
          }
        }
      }
      currentLabel++;
    }
  }

  return { labels, numLabels: currentLabel };
}

/**
 * Macro8: Offset Summation
 *   Summation of pixel + offset pixel => clamp(0..255)
 */
function applyOffsetSum() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;

  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Offsets from sliceX/sliceY, but let's clamp
    const offX = Math.floor(sliceX - width/2);
    const offY = Math.floor(sliceY - height/2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const ox = x + offX;
        const oy = y + offY;
        if (ox >= 0 && ox < width && oy >= 0 && oy < height) {
          const oIdx = (oy * width + ox) * 4;
          data[idx] = Math.min(255, data[idx] + data[oIdx]);
          data[idx+1] = Math.min(255, data[idx+1] + data[oIdx+1]);
          data[idx+2] = Math.min(255, data[idx+2] + data[oIdx+2]);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    pushState(canvas.toDataURL());
  };
}

/**
 * Macro9: Offset Difference
 */
function applyOffsetDiff() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const offX = Math.floor(sliceX - width/2);
    const offY = Math.floor(sliceY - height/2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const ox = x + offX;
        const oy = y + offY;
        if (ox >= 0 && ox < width && oy >= 0 && oy < height) {
          const oIdx = (oy * width + ox) * 4;
          data[idx]   = Math.abs(data[idx]   - data[oIdx]);
          data[idx+1] = Math.abs(data[idx+1] - data[oIdx+1]);
          data[idx+2] = Math.abs(data[idx+2] - data[oIdx+2]);
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    pushState(canvas.toDataURL());
  };
}

/**
 * Macro10: Doubling effect
 *   Just add the pixel to itself or do something akin to "multiply by 2"
 */
function applyDoubling() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i]   = Math.min(255, data[i]   * 2);
      data[i+1] = Math.min(255, data[i+1] * 2);
      data[i+2] = Math.min(255, data[i+2] * 2);
    }

    ctx.putImageData(imageData, 0, 0);
    pushState(canvas.toDataURL());
  };
}

/**
 * Macro11: Quad-Tree (very minimal)
 * We'll subdivide the image to leaves whose variance < threshold
 * Then fill each leaf with its average color. 
 */
function applyQuadTree() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const root = buildQuadTree(imageData, 0, 0, canvas.width, canvas.height, 800 /* threshold */, 6);
    // We'll just do a quick draw of each leaf's average color
    drawQuadTreeLeaves(ctx, root);

    pushState(canvas.toDataURL());
  };
}

class QuadTreeNode {
  constructor(x, y, w, h) {
    this.x = x; 
    this.y = y;
    this.w = w;
    this.h = h;
    this.isLeaf = false;
    this.avgColor = [0,0,0,255];
    this.children = [];
  }
}

function buildQuadTree(imageData, x, y, w, h, threshold, maxDepth, depth=0) {
  const node = new QuadTreeNode(x, y, w, h);
  if (w<2 || h<2 || depth>=maxDepth) {
    node.isLeaf = true;
    node.avgColor = computeRegionAverage(imageData, x, y, w, h);
    return node;
  }

  const variance = computeRegionVariance(imageData, x, y, w, h);
  if (variance < threshold) {
    node.isLeaf = true;
    node.avgColor = computeRegionAverage(imageData, x, y, w, h);
  } else {
    const halfW = Math.floor(w/2);
    const halfH = Math.floor(h/2);
    node.children.push(buildQuadTree(imageData, x,       y,       halfW, halfH, threshold, maxDepth, depth+1));
    node.children.push(buildQuadTree(imageData, x+halfW, y,       w-halfW, halfH, threshold, maxDepth, depth+1));
    node.children.push(buildQuadTree(imageData, x,       y+halfH, halfW, h-halfH, threshold, maxDepth, depth+1));
    node.children.push(buildQuadTree(imageData, x+halfW, y+halfH, w-halfW, h-halfH, threshold, maxDepth, depth+1));
  }
  return node;
}

function computeRegionVariance(imageData, x, y, w, h) {
  // We'll just do a rough approach:
  // get average color, then compute sum of squared diffs
  const avg = computeRegionAverage(imageData, x, y, w, h);
  let sumSq = 0;
  const {width, data} = imageData;
  for (let row=0; row<h; row++) {
    for (let col=0; col<w; col++) {
      const idx = ((y+row)*width + (x+col))*4;
      const dr = data[idx] - avg[0];
      const dg = data[idx+1] - avg[1];
      const db = data[idx+2] - avg[2];
      sumSq += (dr*dr + dg*dg + db*db);
    }
  }
  return sumSq / (w*h);
}

function computeRegionAverage(imageData, x, y, w, h) {
  let sumR=0, sumG=0, sumB=0;
  const {width, data} = imageData;
  for (let row=0; row<h; row++) {
    for (let col=0; col<w; col++) {
      const idx = ((y+row)*width + (x+col))*4;
      sumR += data[idx];
      sumG += data[idx+1];
      sumB += data[idx+2];
    }
  }
  const area = w*h;
  return [
    Math.floor(sumR/area),
    Math.floor(sumG/area),
    Math.floor(sumB/area),
    255
  ];
}

function drawQuadTreeLeaves(ctx, node) {
  if (node.isLeaf) {
    ctx.fillStyle = `rgba(${node.avgColor[0]}, ${node.avgColor[1]}, ${node.avgColor[2]}, 1)`;
    ctx.fillRect(node.x, node.y, node.w, node.h);
  } else {
    for (let c of node.children) {
      drawQuadTreeLeaves(ctx, c);
    }
  }
}

/**
 * Macro12: BezierY
 *   Similar to BezierX, but shift columns up/down by a wave function
 */
function applyBezierY() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  const intensity = parseInt(document.getElementById("bezierIntensity").value, 10) || 25;

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // For each column x, shift up/down by wave
    for (let x = 0; x < width; x++) {
      const shift = Math.floor(intensity * Math.sin(x * 0.02));
      if (shift !== 0) {
        // We process each column
        const colSlice = new Uint8ClampedArray(height*4);
        // Extract column
        for (let y=0; y<height; y++) {
          const idx = (y*width + x)*4;
          const cIdx = y*4;
          colSlice[cIdx]   = data[idx];
          colSlice[cIdx+1] = data[idx+1];
          colSlice[cIdx+2] = data[idx+2];
          colSlice[cIdx+3] = data[idx+3];
        }
        // Write shifted
        const newCol = new Uint8ClampedArray(colSlice.length);
        for (let y=0; y<height; y++) {
          const srcIdx = y*4;
          let dstY = y + shift;
          if (dstY>=0 && dstY<height) {
            const dstIdx = dstY*4;
            newCol[dstIdx]   = colSlice[srcIdx];
            newCol[dstIdx+1] = colSlice[srcIdx+1];
            newCol[dstIdx+2] = colSlice[srcIdx+2];
            newCol[dstIdx+3] = colSlice[srcIdx+3];
          }
        }
        // Copy back
        for (let y=0; y<height; y++) {
          const idx = (y*width + x)*4;
          const cIdx = y*4;
          data[idx]   = newCol[cIdx];
          data[idx+1] = newCol[cIdx+1];
          data[idx+2] = newCol[cIdx+2];
          data[idx+3] = newCol[cIdx+3];
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    pushState(canvas.toDataURL());
  };
}

/***********************************************
 * MACRO EVENT LISTENERS
 ***********************************************/
document.getElementById("macro1").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "X-Axis Stretch";
  applyPixelStretchX();
  markEffectApplied("effectX");
});

document.getElementById("macro2").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "Y-Axis Stretch";
  applyPixelStretchY();
  markEffectApplied("effectY");
});

document.getElementById("macro3").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "PrimeX Offset";
  applyPrimeX();
});

document.getElementById("macro4").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "Color Shift";
  applyColorShift();
});

document.getElementById("macro5").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "Bezier X Wave";
  applyBezierX();
});

document.getElementById("macro6").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "SVG Warp";
  applySvgWarp();
});

document.getElementById("macro7").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "Edge Detect + Regions";
  applyEdgeDetection();
});

document.getElementById("macro8").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "Offset Summation";
  applyOffsetSum();
});

document.getElementById("macro9").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "Offset Difference";
  applyOffsetDiff();
});

document.getElementById("macro10").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "Double Pixels";
  applyDoubling();
});

document.getElementById("macro11").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "QuadTree Fill";
  applyQuadTree();
});

document.getElementById("macro12").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "Bezier Y Wave";
  applyBezierY();
});

for (let m = 13; m <= 15; m++) {
  document.getElementById(`macro${m}`).addEventListener("click", () => {
    document.getElementById("macroName").textContent = `Macro ${m}`;
    alert(`Macro ${m} is not implemented yet!`);
  });
}

/***********************************************
 * RESTORE & WRITE
 ***********************************************/
document.getElementById("restoreBtn").addEventListener("click", () => {
  const canvas = document.getElementById("canvas");
  if (canvas.dataset.originalSrc) {
    loadImageToCanvas(canvas.dataset.originalSrc);
  }
});
document.getElementById("writeBtn").addEventListener("click", () => {
  const canvas = document.getElementById("canvas");
  canvas.dataset.originalSrc = canvas.toDataURL();
  pushState(canvas.dataset.originalSrc);
});

/***********************************************
 * SAVE IMAGE
 ***********************************************/
document.getElementById("saveBtn").addEventListener("click", () => {
  const canvas = document.getElementById("canvas");
  const fileName = document.getElementById("fileName").value || "pixel_stretch";

  const link = document.createElement("a");
  link.download = fileName + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

/***********************************************
 * PROCESSED INDICATORS
 ***********************************************/
function markEffectApplied(effectId) {
  document.getElementById(effectId).classList.add("active");
}

/***********************************************
 * MODE TOGGLE (RASTER VS. SVG)
 ***********************************************/
const modeSwitch = document.getElementById("modeSwitch");
modeSwitch.addEventListener("change", (event) => {
  const mode = event.target.value;
  if (mode === "svg") {
    enableSVGMode();
  } else {
    enableRasterMode();
  }
});

function enableSVGMode() {
  document.getElementById("canvas").style.display = "none";
  document.getElementById("svgContainer").style.display = "block";

  // Hide axis overlays
  document.getElementById("xNode").style.display = "none";
  document.getElementById("yNode").style.display = "none";
}

function enableRasterMode() {
  document.getElementById("canvas").style.display = "block";
  document.getElementById("svgContainer").style.display = "none";

  // Respect toggle state
  const showAxes = document.getElementById("toggleAxisOverlay").checked;
  document.getElementById("xNode").style.display = showAxes ? "block" : "none";
  document.getElementById("yNode").style.display = showAxes ? "block" : "none";
}

/***********************************************
 * ADVANCED CONTROLS 
 ***********************************************/
// Show slider values in real time
const primeOffset = document.getElementById("primeOffset");
const primeVal = document.getElementById("primeVal");
primeOffset.addEventListener("input", () => {
  primeVal.textContent = primeOffset.value;
});

const bezierIntensity = document.getElementById("bezierIntensity");
const bezierVal = document.getElementById("bezierVal");
bezierIntensity.addEventListener("input", () => {
  bezierVal.textContent = bezierIntensity.value;
});

// Combined process button (placeholder)
document.getElementById("processBtn").addEventListener("click", () => {
  const primeValNum = parseInt(primeOffset.value, 10);
  const bezValNum = parseInt(bezierIntensity.value, 10);
  const colorCheck = document.getElementById("colorShift").checked;

  alert(`Process with primeOffset=${primeValNum}, bezierIntensity=${bezValNum}, colorShift=${colorCheck}`);
});

// === Toggle X/Y axis overlay visibility ===
const toggleAxisOverlay = document.getElementById("toggleAxisOverlay");
toggleAxisOverlay.addEventListener("change", (e) => {
  const showAxes = e.target.checked;
  const mode = document.getElementById("modeSwitch").value;
  if (mode === "raster") {
    document.getElementById("xNode").style.display = showAxes ? "block" : "none";
    document.getElementById("yNode").style.display = showAxes ? "block" : "none";
  }
});
