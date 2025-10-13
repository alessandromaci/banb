"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import Image from "next/image";

interface RecipientAvatarProps {
  name: string;
  recipientType: "crypto" | "bank";
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
}

export function RecipientAvatar({
  name,
  recipientType,
  size = "md",
  showBadge = true,
}: RecipientAvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const badgeSizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className="relative">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src="" />
        <AvatarFallback
          className={`${getAvatarColor(name)} text-white font-semibold`}
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      {showBadge && (
        <div className="absolute -bottom-1 -right-1">
          <Badge
            variant="secondary"
            className={`${badgeSizeClasses[size]} p-0 flex items-center justify-center rounded-full bg-white border-2 border-gray-200`}
          >
            {recipientType === "crypto" ? (
              <Image
                src="/base-logo.png"
                alt="Crypto"
                className="text-blue-600"
                width={14}
                height={14}
              />
            ) : (
              <CreditCard className="h-3 w-3 text-green-600" />
            )}
          </Badge>
        </div>
      )}
    </div>
  );
}
