import { NextRequest, NextResponse } from "next/server";
import { resolveServerApiUrl } from "@/lib/server-api-url";

async function proxyRequest(request: NextRequest, params: { path: string[] }) {
  try {
    const apiUrl = resolveServerApiUrl();
    const url = new URL(request.url);
    const targetUrl = `${apiUrl}/${params.path.join("/")}${url.search}`;
    const token = request.cookies.get("auth-token")?.value;

    const headers = new Headers();
    const contentType = request.headers.get("content-type");

    if (contentType) {
      headers.set("content-type", contentType);
    }

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    const hasBody = !["GET", "HEAD"].includes(request.method);
    const body = hasBody ? await request.text() : undefined;

    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body
    });

    const responseHeaders = new Headers();
    const responseContentType = backendResponse.headers.get("content-type");

    if (responseContentType) {
      responseHeaders.set("content-type", responseContentType);
    }

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to proxy request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await context.params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await context.params);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await context.params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await context.params);
}