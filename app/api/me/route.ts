import { NextResponse } from "next/server";
import { getCurrentUserFromSession } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCurrentUserFromSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({
      user,
      subscription: {
        status: "inactive",
        paid_until: null,
      },
      devices: [],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
