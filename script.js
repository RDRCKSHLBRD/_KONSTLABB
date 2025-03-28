/***********************************************
 * 9-DEEP PROCESSING ARRAY
 * We store up to 9 snapshots in memory.
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

    // Set canvas size
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let canvasWidth = viewportWidth * 0.65;
    let canvasHeight = viewportHeight * 0.65;

    // Maintain aspect ratio
    const aspectRatio = img.width / img.height;
    if (canvasWidth / aspectRatio > canvasHeight) {
      canvasWidth = canvasHeight * aspectRatio;
    } else {
      canvasHeight = canvasWidth / aspectRatio;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw the image normally
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Store original image data for later modifications
    canvas.dataset.originalSrc = imageSrc;
    pushState(canvas.toDataURL());
  };
}

/***********************************************
 * MACROS
 ***********************************************/
/** Macro #1: X-axis stretch */
function applyPixelStretchX() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  if (!canvas.dataset.originalSrc) return;

  const img = new Image();
  img.src = canvas.dataset.originalSrc;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const sliceX = Math.floor(canvas.width / 2);
    const sliceWidth = 1;
    const slice = ctx.getImageData(sliceX, 0, sliceWidth, canvas.height);

    for (let x = sliceX; x < canvas.width; x++) {
      ctx.putImageData(slice, x, 0);
    }
    pushState(canvas.toDataURL());
  };
}

/** Macro #2: Y-axis stretch */
function applyPixelStretchY() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  if (!canvas.dataset.originalSrc) return;

  const img = new Image();
  img.src = canvas.dataset.originalSrc;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const sliceY = Math.floor(canvas.height / 2);
    const sliceHeight = 1;
    const slice = ctx.getImageData(0, sliceY, canvas.width, sliceHeight);

    for (let y = sliceY; y < canvas.height; y++) {
      ctx.putImageData(slice, 0, y);
    }
    pushState(canvas.toDataURL());
  };
}

/** Hook macros to UI. 
 *  Macro #1 is X, Macro #2 is Y,
 *  Macros #3–#15 are placeholders. 
 */
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
for (let m = 3; m <= 15; m++) {
  document.getElementById(`macro${m}`).addEventListener("click", () => {
    document.getElementById("macroName").textContent = `Macro ${m}`;
    alert(`Macro ${m} is not implemented yet!`);
  });
}

/***********************************************
 * RESTORE & WRITE
 ***********************************************/
/** RESTORE loads the last original image. 
 *  (In a multi-state scenario, you might expand this logic
 *   to pop the last snapshot from the history.)
 */
document.getElementById("restoreBtn").addEventListener("click", () => {
  const canvas = document.getElementById("canvas");
  if (canvas.dataset.originalSrc) {
    loadImageToCanvas(canvas.dataset.originalSrc);
  }
});

/** WRITE commits the current canvas to become the 'original'. */
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
 * MODE TOGGLE (RASTER VS SVG)
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
  document.getElementById("svgContainer").style.display = "block";
}

function enableRasterMode() {
  document.getElementById("canvas").style.display = "block";
  document.getElementById("svgContainer").style.display = "none";
}

/***********************************************
 * ADVANCED CONTROLS 
 ***********************************************/
document.getElementById("processBtn").addEventListener("click", () => {
  const primeVal = document.getElementById("primeOffset").value;
  const bezierVal = document.getElementById("bezierIntensity").value;
  const colorShift = document.getElementById("colorShift").checked;

  // Placeholder for advanced processing
  alert(`Process with PrimeOffset=${primeVal}, BezierIntensity=${bezierVal}, ColorShift=${colorShift}`);
});
