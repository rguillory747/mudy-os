import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { email, password } = await request.json();

    const validEmail = process.env.ADMIN_EMAIL;
    const validPassword = process.env.ADMIN_PASSWORD;
    const expiryMs = parseInt(process.env.ADMIN_EXPIRY || "0", 10);

    if (!validEmail || !validPassword) {
        return NextResponse.json(
            { error: "Environment variables for credentials are not set." },
            { status: 500 }
        );
    }

    if (email === validEmail && password === validPassword) {
        const expiry = new Date().getTime() + expiryMs;
        return NextResponse.json({
            isAuthenticated: true,
            expiry,
        });
    }

    return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
    );
}
