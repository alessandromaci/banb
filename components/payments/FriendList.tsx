"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { friends } from "@/lib/mockFriends"

export function FriendList() {
  const router = useRouter()

  return (
    <div className="space-y-1">
      {friends.map((friend) => (
        <button
          key={friend.id}
          onClick={() => router.push(`/payments/friend/${friend.id}/amount`)}
          className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors"
        >
          <Avatar className="h-12 w-12 border-2 border-white/10">
            <AvatarFallback style={{ backgroundColor: friend.color }} className="text-white font-medium">
              {friend.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <div className="font-medium text-white">{friend.name}</div>
            <div className="text-sm text-white/60">{friend.username}</div>
          </div>
          <div className="h-5 w-5 rounded-full border-2 border-white/20 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white/80" />
          </div>
        </button>
      ))}
    </div>
  )
}
