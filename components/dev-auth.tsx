"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DevAuth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleLogin = async () => {
        setLoading(true);

        try {
            const response = await fetch(`/api/adminlogin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast({
                    title: "Authentication Failed",
                    description: errorData.error || "Invalid credentials.",
                    variant: "destructive",
                });
                setLoading(false);
                return;
            }

            const { isAuthenticated, expiry } = await response.json();

            const authData = { isAuthenticated, expiry };
            localStorage.setItem("authData", JSON.stringify(authData));

            const redirectUrl = "https://agent.aiorg.app/";
            window.location.href = `/?redirect_url=${encodeURIComponent(redirectUrl)}`;

        } catch (error) {
            console.error("Error during authentication:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        }

        setLoading(false);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setEmail(e.target.value);
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setPassword(e.target.value);

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center h-screen bg-white text-gray-900 px-6"
            )}
        >
            <h1 className="text-3xl font-bold mb-4">Admin Login</h1>
            <div className="w-full max-w-sm space-y-4">
                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={handleEmailChange}
                    className="w-full border-gray-300 bg-gray-50 text-gray-900"
                />
                <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={handlePasswordChange}
                    className="w-full border-gray-300 bg-gray-50 text-gray-900"
                />
                <Button
                    onClick={handleLogin}
                    className="w-full"
                    disabled={loading}
                    variant="secondary"
                >
                    {loading ? "Authenticating..." : "Login"}
                </Button>
            </div>
        </div>
    );
};

export default DevAuth;
