(() => {
  const media = window.BH_PORTFOLIO_MEDIA || {};

  // Bind embedded portfolio media.
  document.querySelectorAll("[data-media-key]").forEach(el => {
    const key = el.getAttribute("data-media-key");
    if (media[key]) el.src = media[key];
  });

  // Reading progress.
  const progress = document.getElementById("portfolioProgress");
  const updateProgress = () => {
    if (!progress) return;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + "%";
  };
  addEventListener("scroll", updateProgress, { passive:true });
  addEventListener("resize", updateProgress);
  updateProgress();

  // Reveal-on-scroll.
  const revealItems = [...document.querySelectorAll(".reveal")];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold:.12, rootMargin:"0px 0px -30px 0px" });
    revealItems.forEach(el => observer.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add("is-visible"));
  }

  // Section scroll-spy.
  const subLinks = [...document.querySelectorAll(".portfolio-subnav a[href^='#']")];
  const sections = subLinks
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(entries => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      subLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + visible.target.id));
    }, { rootMargin:"-30% 0px -58% 0px", threshold:[0,.2,.5,.8] });
    sections.forEach(section => spy.observe(section));
  }

  // Subtle hero parallax on precise pointers only.
  const hero = document.querySelector(".pro-hero");
  if (hero && matchMedia("(pointer:fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    hero.addEventListener("pointermove", e => {
      const r = hero.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - .5) * -12;
      const y = ((e.clientY - r.top) / r.height - .5) * -8;
      hero.style.setProperty("--hero-x", x + "px");
      hero.style.setProperty("--hero-y", y + "px");
    });
    hero.addEventListener("pointerleave", () => {
      hero.style.setProperty("--hero-x", "0px");
      hero.style.setProperty("--hero-y", "0px");
    });
  }

  // Service explorer.
  const serviceData = {
    ensaios: {
      icon:"E",
      title:"Ensaios",
      body:"Sala preparada para bandas que precisam tocar, ajustar repertório, testar dinâmica e chegar mais prontas ao palco ou à gravação.",
      points:[
        "Agenda mensal online com disponibilidade pública",
        "Backline e estrutura de sala",
        "Configuração pensada para diferentes formações",
        "Contato direto com o estúdio pelo WhatsApp"
      ]
    },
    gravacao: {
      icon:"G",
      title:"Gravação e captação",
      body:"Captação de instrumentos e vocais para singles, projetos autorais e registros de banda ao vivo, com possibilidade de entregar material para continuidade em outro estúdio.",
      points:[
        "Instrumentos e vocais",
        "Singles e projetos autorais",
        "Captação de banda ao vivo",
        "Fluxo adaptado ao objetivo do projeto"
      ]
    },
    producao: {
      icon:"M",
      title:"Produção, mixagem e masterização",
      body:"O histórico do Big Head inclui projetos realizados integralmente no espaço — da gravação à finalização — e trabalhos em que o estúdio participa apenas de etapas específicas.",
      points:[
        "Produção musical conforme proposta",
        "Edição e organização de material",
        "Mixagem",
        "Masterização"
      ]
    },
    eventos: {
      icon:"P",
      title:"Sonorização e direção técnica",
      body:"Atuação externa com PA, backline, operação de som e direção técnica, dimensionada conforme local, programação e rider. Iluminação e DJ podem ser atendidos por parceria.",
      points:[
        "Sonorização de eventos de pequeno e médio porte",
        "Backline",
        "Operação de som",
        "Direção técnica de palco"
      ]
    }
  };
  const serviceTabs = [...document.querySelectorAll(".service-tab")];
  const servicePanel = document.getElementById("servicePanel");
  const renderService = key => {
    const d = serviceData[key];
    if (!d || !servicePanel) return;
    servicePanel.innerHTML = `
      <div class="service-icon">${d.icon}</div>
      <h3>${d.title}</h3>
      <p>${d.body}</p>
      <ul class="service-points">${d.points.map(x => `<li>${x}</li>`).join("")}</ul>
    `;
    serviceTabs.forEach(tab => tab.setAttribute("aria-selected", String(tab.dataset.service === key)));
  };
  serviceTabs.forEach(tab => tab.addEventListener("click", () => renderService(tab.dataset.service)));
  if (serviceTabs.length) renderService(serviceTabs[0].dataset.service);

  // Case filtering.
  const filters = [...document.querySelectorAll(".case-filter")];
  const cards = [...document.querySelectorAll(".case-card")];
  filters.forEach(filter => {
    filter.addEventListener("click", () => {
      filters.forEach(f => f.classList.remove("active"));
      filter.classList.add("active");
      const category = filter.dataset.filter;
      cards.forEach(card => {
        const categories = (card.dataset.category || "").split(" ");
        card.classList.toggle("is-hidden", category !== "all" && !categories.includes(category));
      });
    });
  });

  // Case details.
  document.querySelectorAll(".case-toggle").forEach(button => {
    button.addEventListener("click", () => {
      const card = button.closest(".case-card");
      const open = card.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "Fechar detalhes −" : "Ver detalhes +";
    });
  });

  // FAQ accordion.
  document.querySelectorAll(".faq-question").forEach(button => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      const open = item.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
    });
  });

  // Lightbox.
  const lightbox = document.getElementById("proLightbox");
  const lightboxImg = document.getElementById("proLightboxImg");
  const lightboxCaption = document.getElementById("proLightboxCaption");
  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  };
  const openLightbox = (src, caption) => {
    if (!lightbox || !src) return;
    lightboxImg.src = src;
    lightboxCaption.textContent = caption || "";
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  };
  document.querySelectorAll("[data-lightbox-key]").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.getAttribute("data-lightbox-key");
      openLightbox(media[key], button.getAttribute("data-caption"));
    });
  });
  document.querySelectorAll("img[data-lightbox-image]").forEach(img => {
    img.addEventListener("click", () => openLightbox(img.src, img.alt));
  });
  document.getElementById("proLightboxClose")?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
  addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });

  // Lazy-load the embedded studio tour only when requested.
  const tourButton = document.getElementById("tourPlay");
  const tourVideo = document.getElementById("studioTour");
  const tourLoading = document.getElementById("tourLoading");
  const loadTour = () => {
    if (!tourVideo || !tourButton) return;
    if (window.BH_TOUR_VIDEO) {
      tourVideo.src = window.BH_TOUR_VIDEO;
      tourVideo.classList.add("is-ready");
      tourButton.style.display = "none";
      tourLoading?.classList.remove("visible");
      tourVideo.play().catch(() => {});
      return;
    }
    tourLoading?.classList.add("visible");
    tourLoading.textContent = "Carregando o tour do estúdio…";
    const script = document.createElement("script");
    script.src = "assets/tour-video-data.js";
    script.onload = () => {
      if (!window.BH_TOUR_VIDEO) {
        tourLoading.textContent = "Não foi possível carregar o vídeo.";
        return;
      }
      tourVideo.src = window.BH_TOUR_VIDEO;
      tourVideo.classList.add("is-ready");
      tourButton.style.display = "none";
      tourLoading.classList.remove("visible");
      tourVideo.play().catch(() => {});
    };
    script.onerror = () => {
      tourLoading.textContent = "Não foi possível carregar o vídeo. Tente novamente.";
    };
    document.body.appendChild(script);
  };
  if (tourVideo && media.tourPoster) tourVideo.poster = media.tourPoster;
  tourButton?.addEventListener("click", loadTour);

  // Ensure anchor jumps respect sticky navigation.
  subLinks.forEach(link => {
    link.addEventListener("click", e => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      const offset = innerWidth <= 760 ? 116 : 140;
      const top = target.getBoundingClientRect().top + scrollY - offset;
      scrollTo({ top, behavior:"smooth" });
    });
  });
})();
