"use client";

import { pusherClient } from "@/lib/pusher";
import { chatHrefConstructor, toPusherKey } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
import toast from "react-hot-toast";
import UnseenChatToast from "./ui/UnseenChatToast";

interface SidebarChatListProps {
  friends: User[];
  sessionId: string;
}

const SidebarChatList: FC<SidebarChatListProps> = ({ friends, sessionId }) => {
  const router = useRouter();
  const pathname = usePathname();
  // this state keeps track of the messages only when we are online
  const [unseenMessages, setUnseenMessages] = useState<Message[]>([]);
  const [activeChats, setActiveChats] = useState(friends);

  useEffect(() => {
    const pusherChannelChats = toPusherKey(`user:${sessionId}:chats`);
    const pusherChannelFriends = toPusherKey(`user:${sessionId}:friends`);

    pusherClient.subscribe(pusherChannelChats);
    pusherClient.subscribe(pusherChannelFriends);

    const unseenMessageHandler = (
      message: Message & {
        senderImg: string;
        senderName: string;
      }
    ) => {
      const shouldNotify =
        pathname !== `/dashboard/chat/${chatHrefConstructor(sessionId, message.senderId)}`;
      
      if (!shouldNotify) return;

      toast.custom((toastValue) => (
        <UnseenChatToast
          toastValue={toastValue}
          sessionId={sessionId}
          senderId={message.senderId}
          senderImg={message.senderImg}
          senderName={message.senderName}
          senderMessage={message.text}
        />
      ));

      setUnseenMessages((prev) => [message, ...prev]);
    };

    const newFriendHandler = (newFriend: User) => {
      setActiveChats((prev) => [...prev, newFriend])
    };

    pusherClient.bind("new_unseenMessage", unseenMessageHandler);
    pusherClient.bind("new_friend", newFriendHandler);

    return () => {
      pusherClient.unsubscribe(pusherChannelChats);
      pusherClient.unsubscribe(pusherChannelFriends);

      pusherClient.unbind("new_unseenMessage", unseenMessageHandler);
      pusherClient.unbind("new_friend", newFriendHandler);
    };
  }, [pathname, router, sessionId]);

  useEffect(() => {
    if (pathname?.includes("chat")) {
      setUnseenMessages((prev) => {
        return prev?.filter((msg) => !pathname.includes(msg.senderId));
      });
    }
  }, [pathname]);

  return (
    <ul role="list" className="max-h-[25rem] overflow-auto -mx-2 space-y-1">
      {friends.sort().map((friend) => {
        const unseenMessagesCount = unseenMessages?.filter((unseenMessage) => {
          return unseenMessage.senderId === friend.id;
        }).length;

        return (
          <li key={friend.id}>
            <a
              href={`/dashboard/chat/${chatHrefConstructor(sessionId, friend.id)}`}
              className="text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
            >
              {friend.name}
              {unseenMessagesCount && unseenMessagesCount > 0 ? (
                <div className="rounded-full w-4 h-4 text-xs flex justify-center items-center text-white bg-indigo-600 pr-[0.1em]">
                  {unseenMessagesCount}
                </div>
              ) : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default SidebarChatList;
