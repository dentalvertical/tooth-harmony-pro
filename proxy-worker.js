import apiWorker from "./worker/src/index.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return apiWorker.fetch(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
