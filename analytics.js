(() => {
  const cfg = window.BIG_HEAD_CONFIG || {};
  const measurementId = cfg.googleAnalyticsId;
  if (!measurementId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };

  gtag("js", new Date());
  gtag("config", measurementId, {
    anonymize_ip: true,
    transport_type: "beacon"
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
  document.head.appendChild(script);

  const page = document.body?.dataset?.page || "site";
  const pageEvent = page === "agenda" ? "agenda_view" : page === "portfolio" ? "portfolio_view" : "site_view";

  gtag("event", pageEvent, {
    page_type: page,
    page_location: location.href,
    page_title: document.title
  });

  const track = (name, params = {}) => {
    try {
      gtag("event", name, {
        page_type: page,
        ...params
      });
    } catch (_) {}
  };

  document.addEventListener("click", event => {
    const whatsapp = event.target.closest(".js-whatsapp");
    if (whatsapp) {
      const linkLocation = whatsapp.closest("header") ? "header" :
        whatsapp.classList.contains("floating-whatsapp") ? "floating_button" :
        whatsapp.closest("footer") ? "footer" :
        whatsapp.id === "dayWhatsapp" ? "agenda_day" : "content";

      track("whatsapp_click", {
        link_text: (whatsapp.textContent || "").trim().slice(0, 100),
        link_location: linkLocation
      });

      // Evento recomendado do GA4 para geração de lead.
      // Mantemos whatsapp_click para diagnóstico e generate_lead como
      // evento de negócio a ser marcado como evento principal no GA4.
      track("generate_lead", {
        lead_source: "whatsapp",
        lead_context: linkLocation,
        lead_page: page
      });
      return;
    }

    const review = event.target.closest(".js-review");
    if (review) {
      track("google_review_click", {
        link_location: review.closest("footer") ? "footer" : "content"
      });
      return;
    }

    const maps = event.target.closest(".js-maps");
    if (maps) {
      track("maps_click", {
        link_location: maps.closest("footer") ? "footer" : "content"
      });
      return;
    }

    const instagram = event.target.closest(".js-instagram");
    if (instagram) {
      track("instagram_click", {
        link_location: instagram.closest("footer") ? "footer" : "content"
      });
      return;
    }

    const agendaLink = event.target.closest('a[href="index.html"], a[href="./"], a[href="/"]');
    if (agendaLink && page === "portfolio") {
      track("agenda_cta_click", {
        link_text: (agendaLink.textContent || "").trim().slice(0, 100)
      });
    }

    const portfolioLink = event.target.closest('a[href="portfolio.html"]');
    if (portfolioLink && page === "agenda") {
      track("portfolio_cta_click", {
        link_text: (portfolioLink.textContent || "").trim().slice(0, 100)
      });
    }

    const availableSlot = event.target.closest(".slot.available");
    if (availableSlot) {
      track("agenda_slot_select", {
        slot_text: (availableSlot.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100)
      });
    }

    const calendarDay = event.target.closest(".day:not(.outside)");
    if (calendarDay && page === "agenda") {
      track("agenda_day_select", {
        day_label: calendarDay.getAttribute("aria-label") || ""
      });
    }

    const serviceTab = event.target.closest(".service-tab");
    if (serviceTab) {
      track("portfolio_service_select", {
        service: serviceTab.dataset.service || ""
      });
    }

    const caseFilter = event.target.closest(".case-filter");
    if (caseFilter) {
      track("portfolio_filter_select", {
        filter: caseFilter.dataset.filter || "all"
      });
    }

    const caseToggle = event.target.closest(".case-toggle");
    if (caseToggle) {
      const card = caseToggle.closest(".case-card");
      track("portfolio_case_expand", {
        project: card?.querySelector("h3")?.textContent?.trim().slice(0, 100) || ""
      });
    }
  });

  const tourButton = document.getElementById("tourPlay");
  if (tourButton) {
    tourButton.addEventListener("click", () => track("tour_play"));
  }

  const tourVideo = document.getElementById("studioTour");
  if (tourVideo) {
    let tracked25 = false;
    let tracked75 = false;
    tourVideo.addEventListener("timeupdate", () => {
      if (!tourVideo.duration || !Number.isFinite(tourVideo.duration)) return;
      const pct = tourVideo.currentTime / tourVideo.duration;
      if (!tracked25 && pct >= .25) {
        tracked25 = true;
        track("tour_progress", { percent: 25 });
      }
      if (!tracked75 && pct >= .75) {
        tracked75 = true;
        track("tour_progress", { percent: 75 });
      }
    });
    tourVideo.addEventListener("ended", () => track("tour_complete"));
  }
})();
