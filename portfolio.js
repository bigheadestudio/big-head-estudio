
(() => {
  const media = window.BH_PORTFOLIO_MEDIA || {};
  document.querySelectorAll("[data-media-key]").forEach(el => {
    const key = el.getAttribute("data-media-key");
    if (media[key]) el.src = media[key];
  });

  const tour = document.getElementById("studioTour");
  if (tour && window.BH_TOUR_VIDEO) {
    tour.src = window.BH_TOUR_VIDEO;
    if (media.tourPoster) tour.poster = media.tourPoster;
  }
})();
