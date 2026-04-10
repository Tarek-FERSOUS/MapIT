import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({
    success: true
  });

  // Clear the auth token
  res.cookies.delete("auth-token");

  return res;
}
