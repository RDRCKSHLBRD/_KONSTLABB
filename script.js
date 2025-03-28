document.getElementById("imageUpload").addEventListener("change", function(event) {
  const file = event.target.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
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

      // Draw the image normally (unaffected)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Store original image data for later modifications
      canvas.dataset.originalSrc = imageSrc;
  };
}

// Apply X-axis pixel stretch (Macro 1)
document.getElementById("stretchX").addEventListener("click", function() {
  applyPixelStretchX();
});

function applyPixelStretchX() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  if (!canvas.dataset.originalSrc) return;

  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // X-axis stretch
      const sliceX = Math.floor(canvas.width / 2);
      const sliceWidth = 1;
      const slice = ctx.getImageData(sliceX, 0, sliceWidth, canvas.height);

      for (let x = sliceX; x < canvas.width; x++) {
          ctx.putImageData(slice, x, 0);
      }
  };
}

// Apply Y-axis pixel stretch (Macro 2)
document.getElementById("stretchY").addEventListener("click", function() {
  applyPixelStretchY();
});

function applyPixelStretchY() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  if (!canvas.dataset.originalSrc) return;

  const img = new Image();
  img.src = canvas.dataset.originalSrc;

  img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Y-axis stretch
      const sliceY = Math.floor(canvas.height / 2);
      const sliceHeight = 1;
      const slice = ctx.getImageData(0, sliceY, canvas.width, sliceHeight);

      for (let y = sliceY; y < canvas.height; y++) {
          ctx.putImageData(slice, 0, y);
      }
  };
}

// Restore Original Image
document.getElementById("restoreBtn").addEventListener("click", function() {
  if (document.getElementById("canvas").dataset.originalSrc) {
      loadImageToCanvas(document.getElementById("canvas").dataset.originalSrc);
  }
});

// Save File
document.getElementById("saveBtn").addEventListener("click", function() {
    const canvas = document.getElementById("canvas");
    const fileName = document.getElementById("fileName").value || "pixel_stretch";
    
    const link = document.createElement("a");
    link.download = fileName + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});

// Commit Changes to Buffer
document.getElementById("writeBtn").addEventListener("click", function() {
    const canvas = document.getElementById("canvas");
    canvas.dataset.originalSrc = canvas.toDataURL(); // Save current state as new buffer
});
