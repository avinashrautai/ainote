type JsonBody = Record<string, unknown>;

export function jsonResponse(body: JsonBody, init?: ResponseInit) {
  const response = Response.json(body, init);
  console.info("[api:response]", {
    status: response.status,
    body,
  });
  return response;
}

export function errorResponse(message: string, status = 500) {
  console.error("[api:error]", {
    status,
    error: message,
  });
  return jsonResponse({ error: message }, { status });
}
