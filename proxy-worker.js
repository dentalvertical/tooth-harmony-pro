function resolveApiOrigin(url, env) {
  if (env.API_ORIGIN) {
    return env.API_ORIGIN;
  }

  if (url.hostname.endsWith(".workers.dev")) {
    const parts = url.hostname.split(".");
    if (parts.length >= 3) {
      parts[0] = "tooth-harmony-pro-api";
      return `${url.protocol}//${parts.join(".")}`;
    }
  }

  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      const apiOrigin = resolveApiOrigin(url, env);
      if (!apiOrigin) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "API origin is not configured",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }

      const targetUrl = new URL(url.pathname + url.search, apiOrigin);
      return fetch(new Request(targetUrl.toString(), request));
    }

    return env.ASSETS.fetch(request);
  },
};
