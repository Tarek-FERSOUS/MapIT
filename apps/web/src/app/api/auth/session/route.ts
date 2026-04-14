import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:3002";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No session" },
        { status: 401 }
      );
    }

    // Validate token with backend
    const response = await axios.get(`${API_URL}/auth/me`, {
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
