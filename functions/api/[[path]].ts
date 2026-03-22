import worker from "../../worker/src/index";

export const onRequest = async (context: { request: Request; env: Record<string, unknown> }) => {
  return worker.fetch(context.request, context.env);
};
