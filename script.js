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

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Define the vertical slice (center of image)
      const sliceX = Math.floor(img.width / 2);
      const sliceWidth = 1;

      // Get that single vertical strip
      const slice = ctx.getImageData(sliceX, 0, sliceWidth, img.height);

      // Stretch that strip across the right half of the image
      for (let x = sliceX; x < img.width; x++) {
          ctx.putImageData(slice, x, 0);
      }
  };
}
