const manifestState = {
  objectUrl: null,
};

let deferredInstallPrompt = null;

const normalizeBasePath = (slug) => {
  if (!slug) return "/";
  return `/${slug}`;
};

export const setupStoreManifest = (slug) => {
  if (typeof window === "undefined") return;

  // Prefer the static manifest file declared in index.html for installability checks.
  const staticManifestLink = document.querySelector(
    "link[rel='manifest']:not([data-store-manifest='true'])",
  );
  if (staticManifestLink) return;

  const basePath = normalizeBasePath(slug);
  const manifest = {
    name: slug ? `CellControl - ${slug}` : "CellControl",
    short_name: "CellControl",
    description: "Sistema de Gestão de Celulares",
    display: "standalone",
    start_url: `${basePath}`,
    scope: `${basePath}/`,
    theme_color: "#0A0A0A",
    background_color: "#0A0A0A",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };

  let manifestLink = document.querySelector("link[data-store-manifest='true']");
  if (!manifestLink) {
    manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    manifestLink.setAttribute("data-store-manifest", "true");
    document.head.appendChild(manifestLink);
  }

  if (manifestState.objectUrl) {
    URL.revokeObjectURL(manifestState.objectUrl);
  }

  manifestState.objectUrl = URL.createObjectURL(
    new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" }),
  );
  manifestLink.href = manifestState.objectUrl;
};

export const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return;

  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch (error) {
    console.error("Falha ao registrar service worker:", error);
  }
};

export const setupInstallPromptListener = () => {
  if (typeof window === "undefined") return;
  if (window.__cellcontrolInstallPromptListenerAttached) return;

  window.__cellcontrolInstallPromptListenerAttached = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
  });
};

export const getDeferredInstallPrompt = () => deferredInstallPrompt;

export const clearDeferredInstallPrompt = () => {
  deferredInstallPrompt = null;
};
