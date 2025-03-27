document.getElementById("imageUpload").addEventListener("change", function(event) {
  const file = event.target.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
          applyPixelStretch(e.target.result);
      };
      reader.readAsDataURL(file);
  }
});

function applyPixelStretch(imageSrc) {
  const img = new Image();
  img.src = imageSrc;

  img.onload = () => {
      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");

      // Set canvas size to 60-70% of viewport width
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let canvasWidth = viewportWidth * 0.65; // 65% of viewport
      let canvasHeight = viewportHeight * 0.65; // 65% of viewport

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

      // Draw resized image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Define the vertical slice (center of image)
      const sliceX = Math.floor(canvas.width / 2);
      const sliceWidth = 1;

      // Get that single vertical strip
      const slice = ctx.getImageData(sliceX, 0, sliceWidth, canvas.height);

      // Stretch that strip across the right half of the image
      for (let x = sliceX; x < canvas.width; x++) {
          ctx.putImageData(slice, x, 0);
      }
  };
}
