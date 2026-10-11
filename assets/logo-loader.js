(() => {
  const parts = window.BH_LOGO_PARTS || [];
  if (!parts.length) return;
  const src = "data:image/webp;base64," + parts.join("");
  document.querySelectorAll("[data-bh-logo]").forEach(img => {
    img.src = src;
  });
})();