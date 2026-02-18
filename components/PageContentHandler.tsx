"use client";

import { useEffect, useState } from "react";
import DevAuth from "@/components/dev-auth";

export default function PageContentHandler({children}:{children: React.ReactNode}) {
    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {
        const url = new URL(window.location.href);
        const queryRedirect = url.searchParams.get("redirect_url");
        const decodedRedirect = queryRedirect ? decodeURIComponent(queryRedirect) : "";

        const allowedRedirects = ["http://localhost:3000/", "https://agent.aiorg.app/"];
        const authData = JSON.parse(localStorage.getItem("authData") || "{}");
        const isAuthenticated = authData.isAuthenticated && authData.expiry > new Date().getTime();

        if (process.env.NODE_ENV === "development") {
            if (allowedRedirects.includes(decodedRedirect) && !isAuthenticated) {
                setShowDialog(true);
            } else if (allowedRedirects.includes(decodedRedirect)) {
                window.location.href = "https://agent.aiorg.app/?1";
            }
        } else {
            if (allowedRedirects.includes(decodedRedirect) && isAuthenticated) {
                window.location.href = "https://agent.aiorg.app/?1";
            }
        }
    }, []);

    return (showDialog ? <DevAuth /> : <>{children}</>);
}
