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
  xNode.style.left = `${sliceX - 0.5}px`; // 1px width assumed
  xNode.style.top = `0`;
  xNode.style.height = `100%`;
  xNode.style.width = `1px`; // optional clarity

  // Horizontal Y line (centered at sliceY)
  yNode.style.top = `${sliceY - 0.5}px`;
  yNode.style.left = `0`;
  yNode.style.width = `100%`;
  yNode.style.height = `1px`; // optional clarity
}





function initAxisControls() {
  const xHandle = document.querySelector(".xHandle");
  const yHandle = document.querySelector(".yHandle");

  // Show the axis container
  document.getElementById("xNode").style.display = "block";
  document.getElementById("yNode").style.display = "block";

  const canvas = document.getElementById("canvas");
  sliceX = canvas.width / 2;
  sliceY = canvas.height / 2;
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

    // 50% bigger => ~95% usage
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

    // Initialize draggable axis if we haven't yet, or re-center
    initAxisControls();
  };
}

/***********************************************
 * MACROS
 * 1) X-axis stretch  (using sliceX)
 * 2) Y-axis stretch  (using sliceY)
 * 3) Prime-based X offset
 * 4) Color shift
 * 5) Bezier-based X wave
 * 6) Example: SVG warp
 ***********************************************/
function applyPixelStretchX() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  if (!canvas.dataset.originalSrc) return;

  const img = new Image();
  img.src = canvas.dataset.originalSrc;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Use sliceX from draggable node
    const slice = Math.floor(sliceX);
    const sliceWidth = 1;

    const strip = ctx.getImageData(slice, 0, sliceWidth, canvas.height);
    for (let x = slice; x < canvas.width; x++) {
      ctx.putImageData(strip, x, 0);
    }
    pushState(canvas.toDataURL());
  };
}

function applyPixelStretchY() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  if (!canvas.dataset.originalSrc) return;

  const img = new Image();
  img.src = canvas.dataset.originalSrc;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Use sliceY from draggable node
    const slice = Math.floor(sliceY);
    const sliceHeight = 1;

    const strip = ctx.getImageData(0, slice, canvas.width, sliceHeight);
    for (let y = slice; y < canvas.height; y++) {
      ctx.putImageData(strip, 0, y);
    }
    pushState(canvas.toDataURL());
  };
}

function applyPrimeX() {
  // same as before, uses primeOffset slider
  // you could also incorporate 'sliceX' for a more advanced effect
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  if (!canvas.dataset.originalSrc) return;

  const offset = parseInt(document.getElementById("primeOffset").value, 10) || 5;
  const primes = generatePrimesUpTo(5000);

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
  const sieve = new Array(n+1).fill(true);
  sieve[0] = false; sieve[1] = false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (sieve[i]) {
      for (let j = i*i; j <= n; j += i) {
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

function applyColorShift() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  if (!canvas.dataset.originalSrc) return;

  const colorShift = document.getElementById("colorShift").checked;

  const img = new Image();
  img.src = canvas.dataset.originalSrc;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (colorShift) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // swap R and G
        const r = data[i];
        data[i] = data[i+1];
        data[i+1] = r;
      }
      ctx.putImageData(imageData, 0, 0);
    }
    pushState(canvas.toDataURL());
  };
}

function applyBezierX() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  if (!canvas.dataset.originalSrc) return;

  const intensity = parseInt(document.getElementById("bezierIntensity").value, 10) || 25;

  const img = new Image();
  img.src = canvas.dataset.originalSrc;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let y = 0; y < canvas.height; y++) {
      const shift = Math.floor(Math.sin(y * 0.05) * intensity);
      if (shift !== 0) {
        const start = y * canvas.width * 4;
        const rowSlice = data.slice(start, start + canvas.width * 4);

        const newRow = new Uint8ClampedArray(rowSlice.length);
        for (let x = 0; x < canvas.width; x++) {
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
          data[start + i] = newRow[i];
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    pushState(canvas.toDataURL());
  };
}

/** (6) Example: SVG Warp - placeholder for vector transformations. */
function applySvgWarp() {
  // We could do something like shifting the path. 
  // For now, just a sample wave update on #svgPath:
  const path = document.getElementById("svgPath");
  let newD = "M 100 400";
  for (let x = 100; x <= 700; x += 100) {
    const y = 400 + Math.sin(x * 0.02) * 100;
    newD += ` Q ${x + 50} ${y - 50}, ${x} ${y}`;
  }
  path.setAttribute("d", newD);
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

// 7-15 remain placeholders
for (let m = 7; m <= 15; m++) {
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
document.getElementById("modeSwitch").addEventListener("change", (event) => {
  const mode = event.target.value;
  if (mode === "svg") {
    enableSVGMode();
  } else {
    enableRasterMode();
  }
});
function enableSVGMode() {
  document.getElementById("canvas").style.display = "none";
  document.getElementById("xNode").style.display = "none";
  document.getElementById("yNode").style.display = "none";
  document.getElementById("svgContainer").style.display = "block";
}
function enableRasterMode() {
  document.getElementById("canvas").style.display = "block";
  document.getElementById("xNode").style.display = "block";
  document.getElementById("yNode").style.display = "block";
  document.getElementById("svgContainer").style.display = "none";
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

// xy toggle 

document.getElementById("toggleAxisOverlay").addEventListener("change", (e) => {
  const display = e.target.checked ? "block" : "none";
  document.getElementById("xNode").style.display = display;
  document.getElementById("yNode").style.display = display;
});




  alert(`Process with primeOffset=${primeValNum}, bezierIntensity=${bezValNum}, colorShift=${colorCheck}`);
  // Could chain macros:
  // applyPrimeX();
  // applyBezierX();
  // applyColorShift();
});
