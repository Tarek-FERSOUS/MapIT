import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { resolveServerApiUrl } from "@/lib/server-api-url";

export async function POST(request: NextRequest) {
  try {
    const apiUrl = resolveServerApiUrl();
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Call backend login endpoint
    const response = await axios.post(`${apiUrl}/auth/login`, {
      username,
      password
    });

    const { token, role } = response.data;

    // Create response with secure HttpOnly cookie
    const res = NextResponse.json(
      {
        success: true,
        user: { username, role }
      },
      { status: 200 }
    );

    // Set HttpOnly cookie with token
    res.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return res;
  } catch (error: any) {
    console.error("Login error:", error);

    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
