"use client"

import Image from "next/image"
import { UploadDropzone } from "@/lib/uploadthing"

import { Button } from "@/components/ui/button"
import { ImageIcon, X } from "lucide-react"

interface ImageUploadProps {
    value: string
    onChange: (src: string) => void
    disabled?: boolean
}

export const ImageUpload = ({ value, onChange, disabled }: ImageUploadProps) => {
    const type = value?.split(".")?.pop()?.toLowerCase()

    if (value) {
        return (
            <div className="flex flex-col justify-center items-center">
                <div className="relative w-40 h-40">
                    <Image src={value} alt="uploaded image" className="object-contain" fill />
                </div>
                <Button
                    onClick={() => onChange("")}
                    variant="ghost"
                    type="button"
                    disabled={disabled}
                >
                    <X className="h-4 w-4" />
                    Remove Image
                </Button>
            </div>
        )
    }

    return (
        <div className="w-full bg-muted/30">
            <UploadDropzone
                endpoint="avatar"
                onClientUploadComplete={(res) => {
                    const uploadedFile = res?.[0]
                    if (uploadedFile) {
                        const fileType = uploadedFile.url.split(".").pop()?.toLowerCase()
                        if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileType || "")) {
                            onChange(uploadedFile.url)
                        } else {
                            console.error("Invalid file type. Only images are allowed.")
                        }
                    }
                }}
                appearance={{
                    button: {
                        backgroundColor: "white",
                        color: "black",
                    },
                    label: {
                        color: "white",
                    },
                    allowedContent: {
                        color: "white",
                    },
                    uploadIcon: {
                        color: "white",
                    },
                }}
                onUploadError={(error: Error) => {
                    console.error("Upload error:", error)
                }}
            />
        </div>
    )
}
