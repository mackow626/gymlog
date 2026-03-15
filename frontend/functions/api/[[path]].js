const WORKER_URL = 'https://gymlog-worker.maciejkowalczuk.workers.dev'

export async function onRequest(context) {
  const url = new URL(context.request.url)
  const targetUrl = WORKER_URL + url.pathname + url.search

  const request = new Request(targetUrl, {
    method: context.request.method,
    headers: context.request.headers,
    body: ['GET', 'HEAD'].includes(context.request.method) ? undefined : context.request.body,
  })

  return fetch(request)
}