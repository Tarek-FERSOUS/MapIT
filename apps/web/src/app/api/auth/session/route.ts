import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { resolveServerApiUrl } from "@/lib/server-api-url";

export async function GET(request: NextRequest) {
  try {
    const apiUrl = resolveServerApiUrl();
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No session" },
        { status: 401 }
      );
    }

    // Validate token with backend
    const response = await axios.get(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const { username, role } = response.data;

    return NextResponse.json({
      user: { username, role }
    });
  } catch (error: any) {
    console.error("Session check error:", error);

    const res = NextResponse.json(
      { error: "Invalid session" },
      { status: 401 }
    );

    // Clear invalid token
    res.cookies.delete("auth-token");

    return res;
  }
}
