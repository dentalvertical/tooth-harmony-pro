interface Env {
  API_ORIGIN?: string;
}

function resolveApiOrigin(requestUrl: URL, env: Env): string | null {
  if (env.API_ORIGIN) {
    return env.API_ORIGIN;
  }

  if (requestUrl.hostname.endsWith(".workers.dev")) {
    const parts = requestUrl.hostname.split(".");
    if (parts.length >= 3) {
      parts[0] = "tooth-harmony-pro-api";
      return `${requestUrl.protocol}//${parts.join(".")}`;
    }
  }

  return null;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const requestUrl = new URL(context.request.url);
  const apiOrigin = resolveApiOrigin(requestUrl, context.env);

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

  const upstreamUrl = new URL(requestUrl.pathname + requestUrl.search, apiOrigin);
  const upstreamRequest = new Request(upstreamUrl.toString(), context.request);
  return fetch(upstreamRequest);
};
