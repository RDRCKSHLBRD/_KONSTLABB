/***********************************************
 * 9-DEEP PROCESSING ARRAY (STATE HISTORY)
 ***********************************************/
const stateHistory = [];
const MAX_HISTORY = 9;

function pushState(dataURL) {
  if (stateHistory.length === MAX_HISTORY) {
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
  xNode.style.left = `${sliceX - 0.5}px`;
  xNode.style.top = "0";
  xNode.style.height = "100%";
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

  // X handle events
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

  // Y handle events
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
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    loadImageToCanvas(e.target.result);
  };
  reader.readAsDataURL(file);
});

function loadImageToCanvas(imageSrc) {
  const img = new Image();
  img.src = imageSrc;

  img.onload = () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // scale canvas to ~95% of viewport
    let canvasWidth = window.innerWidth * 0.95;
    let canvasHeight = window.innerHeight * 0.95;

    // maintain aspect
    const aspectRatio = img.width / img.height;
    if (canvasWidth / aspectRatio > canvasHeight) {
      canvasWidth = canvasHeight * aspectRatio;
    } else {
      canvasHeight = canvasWidth / aspectRatio;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

    canvas.dataset.originalSrc = imageSrc;
    pushState(canvas.toDataURL());

    initAxisControls();
  };
}

/***********************************************
 * HELPER: PRIMES
 ***********************************************/
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
  return sieve.map((v, i) => (v ? i : -1)).filter((x) => x >= 2);
}

/***********************************************
 * MACROS IMPLEMENTATION
 ***********************************************/

/** (1) X-axis "stretch" using sliceX */
function applyPixelStretchX() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;

  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const sx = Math.floor(sliceX);
    const strip = ctx.getImageData(sx, 0, 1, canvas.height);
    for (let x = sx; x < canvas.width; x++) {
      ctx.putImageData(strip, x, 0);
    }
    pushState(canvas.toDataURL());
  };
}

/** (2) Y-axis "stretch" using sliceY */
function applyPixelStretchY() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;

  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const sy = Math.floor(sliceY);
    const strip = ctx.getImageData(0, sy, canvas.width, 1);
    for (let y = sy; y < canvas.height; y++) {
      ctx.putImageData(strip, 0, y);
    }
    pushState(canvas.toDataURL());
  };
}

/** (3) Prime-based X offset */
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
        // move that vertical slice over by 1
        const slice = ctx.getImageData(x, 0, 1, canvas.height);
        if (x + 1 < canvas.width) {
          ctx.putImageData(slice, x + 1, 0);
        }
      }
    }
    pushState(canvas.toDataURL());
  };
}

/** (4) Color Shift (swap R & G if checked) */
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
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1];
        d[i] = g;
        d[i+1] = r;
      }
      ctx.putImageData(imageData, 0, 0);
    }
    pushState(canvas.toDataURL());
  };
}

/** (5) BezierX wave */
function applyBezierX() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;
  const intensity = parseInt(document.getElementById("bezierIntensity").value, 10) || 25;

  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width, h = canvas.height;

    for (let y = 0; y < h; y++) {
      const shift = Math.floor(
        intensity * (0.5 * Math.sin(y * 0.02) + 0.5 * Math.cos(y * 0.01))
      );
      if (shift) {
        const rowStart = y * w * 4;
        const rowSlice = data.slice(rowStart, rowStart + w * 4);
        const newRow = new Uint8ClampedArray(rowSlice.length);
        for (let x = 0; x < w; x++) {
          const srcIdx = x * 4;
          const dstIdx = (x + shift) * 4;
          if (dstIdx >= 0 && dstIdx < rowSlice.length) {
            newRow[dstIdx]   = rowSlice[srcIdx];
            newRow[dstIdx+1] = rowSlice[srcIdx+1];
            newRow[dstIdx+2] = rowSlice[srcIdx+2];
            newRow[dstIdx+3] = rowSlice[srcIdx+3];
          }
        }
        // Copy newRow back into data
        for (let i = 0; i < newRow.length; i++) {
          data[rowStart + i] = newRow[i];
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    pushState(canvas.toDataURL());
  };
}

/** (6) Example: SVG Warp (toy path mod) */
function applySvgWarp() {
  const path = document.getElementById("svgPath");
  let newD = "M 100 400";
  for (let x = 100; x <= 700; x += 100) {
    const y = 400 + Math.sin(x * 0.02) * 100;
    newD += ` Q ${x + 50} ${y - 50}, ${x} ${y}`;
  }
  path.setAttribute("d", newD);
}

/***********************************************
 * EDGE DETECTION & REGIONS (7)
 ***********************************************/
// We'll store the region labels + bounding boxes so we can display them
let globalLabelArray = null;
let globalRegions = [];

function applyEdgeDetection() {
  const thresholdVal = parseInt(document.getElementById("edgeModulus").value, 10) || 80;
  const edgeType = document.getElementById("edgeAlgo").value;
  const applyBlur = document.getElementById("blurToggle").checked;
  const minArea = parseInt(document.getElementById("minArea").value, 10);
  
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;

  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);

    // 1) Convert to grayscale
    const gray = new Float32Array(width * height);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      gray[i / 4] = 0.299*r + 0.587*g + 0.114*b;
    }

    // 2) Apply Gaussian blur if enabled
    let inputGray = gray;
    if (applyBlur) {
      inputGray = gaussianBlur(gray, width, height);
    }

    // 3) Choose edge detection algorithm
    let edges;
    if (edgeType === 'sobel') {
      edges = sobelFromGray(inputGray, width, height);
    } else if (edgeType === 'prewitt') {
      edges = prewittFromGray(inputGray, width, height);
    } else if (edgeType === 'laplacian') {
      edges = laplacianFromGray(inputGray, width, height);
    }

    // 4) Threshold => 0=Edge, 1=Inside
    const binaryMask = new Uint8Array(width * height);
    for (let i = 0; i < edges.length; i++) {
      binaryMask[i] = edges[i] > thresholdVal ? 0 : 1;
    }

    // 5) Connected Components => label
    const { labels, numLabels } = labelConnectedComponents(binaryMask, width, height);

    // 6) Build region info + store globally
    globalLabelArray = labels;
    globalRegions = buildRegionInfo(labels, numLabels, width);

    // 7) Filter small regions
    globalRegions = globalRegions.filter(r => r.area >= minArea);

    // 8) Color overlay for visual
    const outData = ctx.createImageData(width, height);
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const idx4 = i * 4;
      if (label < 0) {
        // edge
        outData.data[idx4]   = 0;
        outData.data[idx4+1] = 0;
        outData.data[idx4+2] = 0;
        outData.data[idx4+3] = 255;
      } else {
        // Check if region is too small
        const region = globalRegions.find(r => r.id === label);
        if (!region) {
          // Semi-transparent black for filtered out
          outData.data[idx4]   = 0;
          outData.data[idx4+1] = 0;
          outData.data[idx4+2] = 0;
          outData.data[idx4+3] = 50;
        } else {
          const seed = label * 13;
          outData.data[idx4]   = (seed * 53) % 256;
          outData.data[idx4+1] = (seed * 31) % 256;
          outData.data[idx4+2] = (seed * 97) % 256;
          outData.data[idx4+3] = 255;
        }
      }
    }
    ctx.putImageData(outData, 0, 0);

    // 9) Show region listing
    displayRegionList(globalRegions);

    // 10) Update state
    pushState(canvas.toDataURL());
    
    // 11) Update minAreaVal display
    document.getElementById("minAreaVal").textContent = minArea;
  };
}

function sobelFromGray(gray, width, height) {
  const out = new Float32Array(width * height);
  const kx = [[-1,0,1],[-2,0,2],[-1,0,1]];
  const ky = [[-1,-2,-1],[0,0,0],[1,2,1]];
  for (let y = 1; y < height-1; y++) {
    for (let x = 1; x < width-1; x++) {
      let gx=0, gy=0;
      for (let yy = -1; yy <= 1; yy++) {
        for (let xx = -1; xx <= 1; xx++) {
          const val = gray[(y+yy)*width + (x+xx)];
          gx += kx[yy+1][xx+1] * val;
          gy += ky[yy+1][xx+1] * val;
        }
      }
      out[y*width + x] = Math.sqrt(gx*gx + gy*gy);
    }
  }
  return out;
}

function prewittFromGray(gray, width, height) {
  const out = new Float32Array(width * height);
  const kx = [[-1,0,1],[-1,0,1],[-1,0,1]];
  const ky = [[-1,-1,-1],[0,0,0],[1,1,1]];
  for (let y = 1; y < height-1; y++) {
    for (let x = 1; x < width-1; x++) {
      let gx=0, gy=0;
      for (let yy = -1; yy <= 1; yy++) {
        for (let xx = -1; xx <= 1; xx++) {
          const val = gray[(y+yy)*width + (x+xx)];
          gx += kx[yy+1][xx+1] * val;
          gy += ky[yy+1][xx+1] * val;
        }
      }
      out[y*width + x] = Math.sqrt(gx*gx + gy*gy);
    }
  }
  return out;
}

function laplacianFromGray(gray, width, height) {
  const out = new Float32Array(width * height);
  const kernel = [[0,1,0],[1,-4,1],[0,1,0]];
  for (let y = 1; y < height-1; y++) {
    for (let x = 1; x < width-1; x++) {
      let acc = 0;
      for (let yy = -1; yy <= 1; yy++) {
        for (let xx = -1; xx <= 1; xx++) {
          const val = gray[(y+yy)*width + (x+xx)];
          acc += kernel[yy+1][xx+1] * val;
        }
      }
      out[y*width + x] = Math.abs(acc);
    }
  }
  return out;
}

function gaussianBlur(gray, width, height) {
  const out = new Float32Array(width * height);
  const kernel = [1, 4, 6, 4, 1];
  const kSum = 16;
  const temp = new Float32Array(width * height);

  // horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 2; x < width-2; x++) {
      let val = 0;
      for (let k = -2; k <= 2; k++) {
        val += kernel[k+2] * gray[y*width + (x+k)];
      }
      temp[y*width + x] = val / kSum;
    }
  }

  // vertical pass
  for (let y = 2; y < height-2; y++) {
    for (let x = 0; x < width; x++) {
      let val = 0;
      for (let k = -2; k <= 2; k++) {
        val += kernel[k+2] * temp[(y+k)*width + x];
      }
      out[y*width + x] = val / kSum;
    }
  }
  return out;
}

function labelConnectedComponents(binaryMask, width, height) {
  const labels = new Int32Array(width * height).fill(-1);
  let labelCount = 0;

  for (let i = 0; i < binaryMask.length; i++) {
    if (binaryMask[i] === 1 && labels[i] < 0) {
      // BFS or DFS
      const queue = [i];
      labels[i] = labelCount;
      while (queue.length) {
        const idx = queue.shift();
        const x = idx % width;
        const y = (idx / width) | 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x+dx, ny = y+dy;
            if (nx>=0 && nx<width && ny>=0 && ny<height) {
              const nIdx = ny*width + nx;
              if (binaryMask[nIdx] === 1 && labels[nIdx]<0) {
                labels[nIdx] = labelCount;
                queue.push(nIdx);
              }
            }
          }
        }
      }
      labelCount++;
    }
  }
  return { labels, numLabels: labelCount };
}

function buildRegionInfo(labels, numLabels, width) {
  // bounding boxes, area, etc.
  const info = [];
  for (let r = 0; r < numLabels; r++) {
    info.push({
      id: r,
      minX: Infinity,
      maxX: -1,
      minY: Infinity,
      maxY: -1,
      area: 0,
    });
  }

  for (let i = 0; i < labels.length; i++) {
    const rID = labels[i];
    if (rID >= 0) {
      const x = i % width;
      const y = (i / width) | 0;
      info[rID].area++;
      if (x < info[rID].minX) info[rID].minX = x;
      if (x > info[rID].maxX) info[rID].maxX = x;
      if (y < info[rID].minY) info[rID].minY = y;
      if (y > info[rID].maxY) info[rID].maxY = y;
    }
  }
  return info;
}

function displayRegionList(regionData) {
  const regionDetails = document.getElementById("regionDetails");
  const regionList = document.getElementById("regionList");

  regionDetails.style.display = "block";
  regionList.innerHTML = `<p>Found ${regionData.length} regions:</p>`;

  regionData.forEach((r) => {
    const div = document.createElement("div");
    div.className = "regionItem";
    div.textContent = `Region ${r.id} - area=${r.area}`;
    div.addEventListener("click", () => {
      highlightRegion(r.id);
    });
    regionList.appendChild(div);
  });
}

function highlightRegion(rID) {
  // Example: fill that region with a highlight color
  if (!globalLabelArray) return;
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;

  for (let i = 0; i < globalLabelArray.length; i++) {
    if (globalLabelArray[i] === rID) {
      const idx4 = i*4;
      // e.g. invert color
      d[idx4]   = 255 - d[idx4];
      d[idx4+1] = 255 - d[idx4+1];
      d[idx4+2] = 255 - d[idx4+2];
    }
  }
  ctx.putImageData(imageData, 0, 0);
  pushState(canvas.toDataURL());
}

/***********************************************
 * Macro8: Offset Summation
 ***********************************************/
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
    const w = canvas.width, h = canvas.height;

    const offX = Math.floor(sliceX - w/2);
    const offY = Math.floor(sliceY - h/2);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y*w + x)*4;
        const ox = x + offX, oy = y + offY;
        if (ox>=0 && ox<w && oy>=0 && oy<h) {
          const oIdx = (oy*w + ox)*4;
          data[idx]   = Math.min(255, data[idx]   + data[oIdx]);
          data[idx+1] = Math.min(255, data[idx+1] + data[oIdx+1]);
          data[idx+2] = Math.min(255, data[idx+2] + data[oIdx+2]);
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    pushState(canvas.toDataURL());
  };
}

/***********************************************
 * Macro9: Offset Difference
 ***********************************************/
function applyOffsetDiff() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;

  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    const w = canvas.width, h = canvas.height;

    const offX = Math.floor(sliceX - w/2);
    const offY = Math.floor(sliceY - h/2);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y*w + x)*4;
        const ox = x + offX, oy = y + offY;
        if (ox>=0 && ox<w && oy>=0 && oy<h) {
          const oIdx = (oy*w + ox)*4;
          d[idx]   = Math.abs(d[idx]   - d[oIdx]);
          d[idx+1] = Math.abs(d[idx+1] - d[oIdx+1]);
          d[idx+2] = Math.abs(d[idx+2] - d[oIdx+2]);
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    pushState(canvas.toDataURL());
  };
}

/***********************************************
 * Macro10: Doubling effect
 ***********************************************/
function applyDoubling() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;

  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i]   = Math.min(255, d[i]*2);
      d[i+1] = Math.min(255, d[i+1]*2);
      d[i+2] = Math.min(255, d[i+2]*2);
    }
    ctx.putImageData(imageData, 0, 0);
    pushState(canvas.toDataURL());
  };




}

/***********************************************
 * Macro11: Quad-Tree
 ***********************************************/
class QuadTreeNode {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.isLeaf = false;
    this.avgColor = [0, 0, 0, 255];
    this.children = [];
  }
}

function applyQuadTree() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;
  const maxDepth = parseInt(document.getElementById("quadTreeDepth").value, 10) || 6;

  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const threshold = 800; // Could be another user parameter
    const root = buildQuadTree(imageData, 0, 0, canvas.width, canvas.height, threshold, maxDepth);
    drawQuadTreeLeaves(ctx, root);

    pushState(canvas.toDataURL());
  };
}

/**
 * Recursively build a quadtree given an imageData region
 */
function buildQuadTree(imageData, x, y, w, h, threshold, maxDepth, depth = 0) {
  const node = new QuadTreeNode(x, y, w, h);

  // Stop subdividing if region too small or too deep
  if (w < 2 || h < 2 || depth >= maxDepth) {
    node.isLeaf = true;
    node.avgColor = computeRegionAverage(imageData, x, y, w, h);
    return node;
  }

  // Compute variance to decide if we subdivide
  const variance = computeRegionVariance(imageData, x, y, w, h);
  if (variance < threshold) {
    node.isLeaf = true;
    node.avgColor = computeRegionAverage(imageData, x, y, w, h);
  } else {
    const halfW = Math.floor(w / 2);
    const halfH = Math.floor(h / 2);

    // child #1
    node.children.push(
      buildQuadTree(imageData, x,         y,         halfW,  halfH,  threshold, maxDepth, depth + 1)
    );
    // child #2
    node.children.push(
      buildQuadTree(imageData, x + halfW, y,         w - halfW, halfH, threshold, maxDepth, depth + 1)
    );
    // child #3
    node.children.push(
      buildQuadTree(imageData, x,         y + halfH, halfW,  h - halfH, threshold, maxDepth, depth + 1)
    );
    // child #4
    node.children.push(
      buildQuadTree(imageData, x + halfW, y + halfH, w - halfW, h - halfH, threshold, maxDepth, depth + 1)
    );
  }
  return node;
}

function computeRegionVariance(imageData, x, y, w, h) {
  const avg = computeRegionAverage(imageData, x, y, w, h);
  let sumSq = 0;
  const { width, data } = imageData;

  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const idx = ((y + row) * width + (x + col)) * 4;
      const dr = data[idx]     - avg[0];
      const dg = data[idx + 1] - avg[1];
      const db = data[idx + 2] - avg[2];
      sumSq += (dr * dr + dg * dg + db * db);
    }
  }
  return sumSq / (w * h);
}

function computeRegionAverage(imageData, x, y, w, h) {
  const { width, data } = imageData;
  let sumR = 0, sumG = 0, sumB = 0;

  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const idx = ((y + row) * width + (x + col)) * 4;
      sumR += data[idx];
      sumG += data[idx + 1];
      sumB += data[idx + 2];
    }
  }
  const area = w * h;
  const r = Math.floor(sumR / area);
  const g = Math.floor(sumG / area);
  const b = Math.floor(sumB / area);
  return [r, g, b, 255];
}

function drawQuadTreeLeaves(ctx, node) {
  if (node.isLeaf) {
    // Fill region with average color
    ctx.fillStyle = `rgba(${node.avgColor[0]}, ${node.avgColor[1]}, ${node.avgColor[2]}, 1)`;
    ctx.fillRect(node.x, node.y, node.w, node.h);
  } else {
    // Recursively draw children
    for (const child of node.children) {
      drawQuadTreeLeaves(ctx, child);
    }
  }
}

/***********************************************
 * Bayesian Edge Detection (Macro #13)
 * Applies probabilistic edge detection using Bayesian principles
 ***********************************************/

function applyBayesianEdgeDetection() {
  console.log("Bayesian Edge Detection started");
  
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;

  // Get parameters from controls
  const priorStrength = parseFloat(document.getElementById("bayesPriorStrength").value) / 100;
  const noiseLevel = parseFloat(document.getElementById("bayesNoiseLevel").value);
  const edgeContinuity = parseFloat(document.getElementById("bayesEdgeContinuity").value) / 100;
  const minProbability = parseFloat(document.getElementById("bayesThreshold").value) / 100;
  const visualizeProbMap = document.getElementById("bayesVisualizeProb")?.checked ?? true;

  console.log("Parameters loaded:", { priorStrength, noiseLevel, edgeContinuity, minProbability, visualizeProbMap });

  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);

    // Step 1: Convert to grayscale
    const gray = new Float32Array(width * height);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      gray[i / 4] = 0.299*r + 0.587*g + 0.114*b;
    }

    // Step 2: Apply Gaussian blur to reduce noise
    const blurredGray = gaussianBlur(gray, width, height);

    // Step 3: Compute gradients (likelihood of edges)
    const { gradientMagnitude, gradientDirection } = computeGradients(blurredGray, width, height);

    // Step 4: Create prior probability map for edges
    const priorMap = createEdgePriorMap(gradientMagnitude, width, height, priorStrength);

    // Step 5: Compute likelihood P(image|edge) using gradient and noise model
    const likelihoodMap = computeEdgeLikelihood(gradientMagnitude, noiseLevel, width, height);

    // Step 6: Apply Bayes' theorem to get posterior edge probabilities
    const posteriorMap = computeBayesianPosterior(likelihoodMap, priorMap, width, height);

    // Step 7: Apply edge continuity constraints (MRF-like smoothing)
    const refinedMap = applyEdgeContinuityConstraints(
      posteriorMap, 
      gradientDirection, 
      width, 
      height, 
      edgeContinuity
    );

    // Step 8: Create output visualization (probability map or thresholded edges)
    const outData = visualizeResults(refinedMap, minProbability, width, height, visualizeProbMap);
    ctx.putImageData(outData, 0, 0);

    // Update state
    pushState(canvas.toDataURL());
    
    console.log("Bayesian Edge Detection completed");
  };
}

/**
 * Compute image gradients using Sobel operators
 */
function computeGradients(gray, width, height) {
  const gradientMagnitude = new Float32Array(width * height);
  const gradientDirection = new Float32Array(width * height);
  
  // Sobel kernels
  const kx = [[-1,0,1],[-2,0,2],[-1,0,1]];
  const ky = [[-1,-2,-1],[0,0,0],[1,2,1]];
  
  for (let y = 1; y < height-1; y++) {
    for (let x = 1; x < width-1; x++) {
      let gx = 0, gy = 0;
      for (let yy = -1; yy <= 1; yy++) {
        for (let xx = -1; xx <= 1; xx++) {
          const val = gray[(y+yy)*width + (x+xx)];
          gx += kx[yy+1][xx+1] * val;
          gy += ky[yy+1][xx+1] * val;
        }
      }
      
      const idx = y*width + x;
      gradientMagnitude[idx] = Math.sqrt(gx*gx + gy*gy);
      gradientDirection[idx] = Math.atan2(gy, gx);
    }
  }
  
  // Normalize gradient magnitude to [0,1]
  let maxGrad = 0;
  for (let i = 0; i < gradientMagnitude.length; i++) {
    if (gradientMagnitude[i] > maxGrad) {
      maxGrad = gradientMagnitude[i];
    }
  }
  
  if (maxGrad > 0) {
    for (let i = 0; i < gradientMagnitude.length; i++) {
      gradientMagnitude[i] /= maxGrad;
    }
  }
  
  return { gradientMagnitude, gradientDirection };
}

/**
 * Create edge prior probability map
 */
function createEdgePriorMap(gradientMagnitude, width, height, priorStrength) {
  const priorMap = new Float32Array(width * height);
  
  // Base prior probability (chance of any pixel being an edge)
  const basePrior = 0.1 + (priorStrength * 0.4); // Range: 0.1 to 0.5
  
  for (let i = 0; i < priorMap.length; i++) {
    // Weighted mixture of uniform prior and gradient-influenced prior
    priorMap[i] = (1 - priorStrength) * basePrior + 
                  priorStrength * gradientMagnitude[i];
  }
  
  return priorMap;
}

/**
 * Compute edge likelihood based on gradient and noise model
 */
function computeEdgeLikelihood(gradientMagnitude, noiseLevel, width, height) {
  const likelihoodMap = new Float32Array(width * height);
  const sigma = 0.1 + (noiseLevel / 25); // Convert noise parameter to sigma
  
  for (let i = 0; i < gradientMagnitude.length; i++) {
    // Higher gradients have higher likelihood of being edges
    // We model this as a sigmoid function
    const gradient = gradientMagnitude[i];
    likelihoodMap[i] = 1 / (1 + Math.exp(-(gradient - 0.5) / sigma));
  }
  
  return likelihoodMap;
}

/**
 * Apply Bayes' theorem: P(edge|image) = P(image|edge) * P(edge) / P(image)
 */
function computeBayesianPosterior(likelihoodMap, priorMap, width, height) {
  const posteriorMap = new Float32Array(width * height);
  
  // Evidence P(image) is a normalizing constant, we'll normalize at the end
  for (let i = 0; i < posteriorMap.length; i++) {
    posteriorMap[i] = likelihoodMap[i] * priorMap[i];
  }
  
  // Normalize to [0,1]
  let maxVal = 0;
  for (let i = 0; i < posteriorMap.length; i++) {
    if (posteriorMap[i] > maxVal) {
      maxVal = posteriorMap[i];
    }
  }
  
  if (maxVal > 0) {
    for (let i = 0; i < posteriorMap.length; i++) {
      posteriorMap[i] /= maxVal;
    }
  }
  
  return posteriorMap;
}

/**
 * Apply edge continuity constraints (similar to Markov Random Field refinement)
 */
function applyEdgeContinuityConstraints(posteriorMap, gradientDirection, width, height, continuityWeight) {
  const refinedMap = new Float32Array(width * height);
  
  // First copy the original values
  for (let i = 0; i < posteriorMap.length; i++) {
    refinedMap[i] = posteriorMap[i];
  }
  
  // Apply continuity constraints by smoothing along the edge direction
  for (let y = 2; y < height-2; y++) {
    for (let x = 2; x < width-2; x++) {
      const idx = y * width + x;
      const direction = gradientDirection[idx];
      
      // Get coordinates of 2 pixels along the edge direction
      const dx = Math.cos(direction);
      const dy = Math.sin(direction);
      
      const x1 = Math.round(x + dx);
      const y1 = Math.round(y + dy);
      const x2 = Math.round(x - dx);
      const y2 = Math.round(y - dy);
      
      // Check bounds
      if (x1 >= 0 && x1 < width && y1 >= 0 && y1 < height &&
          x2 >= 0 && x2 < width && y2 >= 0 && y2 < height) {
        
        const idx1 = y1 * width + x1;
        const idx2 = y2 * width + x2;
        
        // Weighted average with neighbors along the edge direction
        refinedMap[idx] = (1 - continuityWeight) * posteriorMap[idx] + 
                          continuityWeight * (posteriorMap[idx1] + posteriorMap[idx2]) / 2;
      }
    }
  }
  
  return refinedMap;
}

/**
 * Create visualization of the results
 */
function visualizeResults(probabilityMap, threshold, width, height, showProbMap = true) {
  const outData = new ImageData(width, height);
  
  for (let i = 0; i < probabilityMap.length; i++) {
    const prob = probabilityMap[i];
    const idx = i * 4;
    
    if (prob >= threshold) {
      if (showProbMap) {
        // Enhanced thermal color map with better contrast
        const intensity = Math.min(1, (prob - threshold) / (1 - threshold));
        // More vibrant colors for better visibility
        outData.data[idx]   = 255;  // R - Always bright red base
        outData.data[idx+1] = Math.floor(255 * Math.pow(intensity, 0.7));  // G - Faster rise
        outData.data[idx+2] = Math.floor(255 * Math.pow(intensity, 3));    // B - Slower rise
        outData.data[idx+3] = 255;  // Alpha
      } else {
        // Binary edge visualization - white edges on black
        outData.data[idx]   = 255;  // White
        outData.data[idx+1] = 255;
        outData.data[idx+2] = 255;
        outData.data[idx+3] = 255;
      }
    } else {
      if (showProbMap) {
        // Non-edge pixel - improved dark blue gradient with better contrast
        const blueIntensity = Math.floor(prob * 120); // Increased from 80 to 120
        outData.data[idx]   = 0;
        outData.data[idx+1] = 0;
        outData.data[idx+2] = blueIntensity;
        outData.data[idx+3] = 255;
      } else {
        // Binary edge visualization - black background
        outData.data[idx]   = 0;
        outData.data[idx+1] = 0;
        outData.data[idx+2] = 0;
        outData.data[idx+3] = 255;
      }
    }
  }
  
  return outData;
}

/***********************************************
 * Y-axis Bezier (Macro12)
 ***********************************************/
function applyBezierY() {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;
  const intensity = parseInt(document.getElementById("bezierIntensity").value, 10) || 25;

  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width, h = canvas.height;

    for (let x = 0; x < w; x++) {
      const shift = Math.floor(intensity * Math.sin(x * 0.02));
      if (shift) {
        const colSlice = new Uint8ClampedArray(h * 4);
        // Extract column
        for (let y=0; y<h; y++) {
          const idx = (y*w + x)*4;
          const cIdx = y*4;
          colSlice[cIdx]   = data[idx];
          colSlice[cIdx+1] = data[idx+1];
          colSlice[cIdx+2] = data[idx+2];
          colSlice[cIdx+3] = data[idx+3];
        }
        // Shift
        const newCol = new Uint8ClampedArray(colSlice.length);
        for (let y=0; y<h; y++) {
          const dstY = y + shift;
          if (dstY>=0 && dstY<h) {
            const srcIdx = y*4;
            const dstIdx = dstY*4;
            newCol[dstIdx]   = colSlice[srcIdx];
            newCol[dstIdx+1] = colSlice[srcIdx+1];
            newCol[dstIdx+2] = colSlice[srcIdx+2];
            newCol[dstIdx+3] = colSlice[srcIdx+3];
          }
        }
        // Put back
        for (let y=0; y<h; y++) {
          const idx = (y*w + x)*4;
          data[idx]   = newCol[y*4];
          data[idx+1] = newCol[y*4+1];
          data[idx+2] = newCol[y*4+2];
          data[idx+3] = newCol[y*4+3];
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    pushState(canvas.toDataURL());
  };
}

/***********************************************
 * MACROS 14 - 25: Placeholders
 ***********************************************/
function placeholderMacro(macroNumber) {
  const canvas = document.getElementById("canvas");
  if (!canvas.dataset.originalSrc) return;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(255,255,0,0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(`Macro ${macroNumber} Placeholder`, 10, 50);

  pushState(canvas.toDataURL());
}

/***********************************************
 * MACRO EVENT LISTENERS
 ***********************************************/
document.getElementById("macro1").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "X-Axis Stretch";
  applyPixelStretchX();
  // mark effect
  document.getElementById("effectX").classList.add("active");
});
document.getElementById("macro2").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "Y-Axis Stretch";
  applyPixelStretchY();
  // mark effect
  document.getElementById("effectY").classList.add("active");
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

// Macro 12: Bezier Y Wave
document.getElementById("macro12").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "Bezier Y Wave";
  applyBezierY();
});

// Macro 13: Bayesian Edge Detection
document.getElementById("macro13").addEventListener("click", () => {
  document.getElementById("macroName").textContent = "Bayesian Edge Detection";
  applyBayesianEdgeDetection();
});

// Macros 14 - 25 => placeholders
for (let m = 14; m <= 25; m++) {
  document.getElementById(`macro${m}`).addEventListener("click", () => {
    document.getElementById("macroName").textContent = `Macro ${m} (Placeholder)`;
    placeholderMacro(m);
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
  const fileName = document.getElementById("fileName").value || "konstlabb_output";
  const link = document.createElement("a");
  link.download = fileName + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

/***********************************************
 * MODE TOGGLE (RASTER ↔ SVG)
 ***********************************************/
const modeSwitch = document.getElementById("modeSwitch");
modeSwitch.addEventListener("change", () => {
  const mode = modeSwitch.value;
  const isSVG = (mode === "svg");

  // Show/hide canvas vs. svg
  const canvas = document.getElementById("canvas");
  const svg = document.getElementById("svgContainer");
  canvas.style.display = isSVG ? "none" : "block";
  svg.style.display = isSVG ? "block" : "none";

  // Hide axis overlay in SVG mode
  const xNode = document.getElementById("xNode");
  const yNode = document.getElementById("yNode");
  const showAxes = document.getElementById("toggleAxisOverlay").checked;
  xNode.style.display = (isSVG || !showAxes) ? "none" : "block";
  yNode.style.display = (isSVG || !showAxes) ? "none" : "block";
});

/***********************************************
 * ADVANCED CONTROLS (Sliders, Tools)
 ***********************************************/
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

const quadDepthSlider = document.getElementById("quadTreeDepth");
const quadDepthVal = document.getElementById("quadTreeVal");
quadDepthSlider.addEventListener("input", () => {
  quadDepthVal.textContent = quadDepthSlider.value;
});

const edgeModSlider = document.getElementById("edgeModulus");
const edgeModVal = document.getElementById("edgeModVal");
edgeModSlider.addEventListener("input", () => {
  edgeModVal.textContent = edgeModSlider.value;
});

// Slider event listeners for Bayesian Edge Detection
const bayesPriorSlider = document.getElementById("bayesPriorStrength");
const bayesPriorVal = document.getElementById("bayesPriorVal");
bayesPriorSlider.addEventListener("input", () => {
  bayesPriorVal.textContent = bayesPriorSlider.value;
});

const bayesNoiseSlider = document.getElementById("bayesNoiseLevel");
const bayesNoiseVal = document.getElementById("bayesNoiseVal");
bayesNoiseSlider.addEventListener("input", () => {
  bayesNoiseVal.textContent = bayesNoiseSlider.value;
});

const bayesContinuitySlider = document.getElementById("bayesEdgeContinuity");
const bayesContinuityVal = document.getElementById("bayesContinuityVal");
bayesContinuitySlider.addEventListener("input", () => {
  bayesContinuityVal.textContent = bayesContinuitySlider.value;
});

const bayesThresholdSlider = document.getElementById("bayesThreshold");
const bayesThresholdVal = document.getElementById("bayesThresholdVal");
bayesThresholdSlider.addEventListener("input", () => {
  bayesThresholdVal.textContent = bayesThresholdSlider.value;
});

// Combined "Process" button (placeholder) – purely an example
document.getElementById("processBtn").addEventListener("click", () => {
  const primeValNum   = parseInt(primeOffset.value, 10);
  const bezValNum     = parseInt(bezierIntensity.value, 10);
  const quadVal       = parseInt(quadDepthSlider.value, 10);
  const edgeVal       = parseInt(edgeModSlider.value, 10);
  const colorCheck    = document.getElementById("colorShift").checked;

  alert(`Process with:
    primeOffset=${primeValNum},
    bezierIntensity=${bezValNum},
    quadTreeDepth=${quadVal},
    edgeModulus=${edgeVal},
    colorShift=${colorCheck}
  `);
});

// Toggle Axis Overlay
const toggleAxisOverlay = document.getElementById("toggleAxisOverlay");
toggleAxisOverlay.addEventListener("change", (e) => {
  const on = e.target.checked;
  const isSvgMode = (modeSwitch.value === "svg");
  document.getElementById("xNode").style.display = (!isSvgMode && on) ? "block" : "none";
  document.getElementById("yNode").style.display = (!isSvgMode && on) ? "block" : "none";
});