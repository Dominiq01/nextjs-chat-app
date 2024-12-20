import MessageInput from "@/components/MessageInput";
import Messages from "@/components/Messages";
import { fetchRedis } from "@/helpers/redis";
import { getSession } from "@/lib/auth";
import { messageArrayValidator } from "@/lib/validations/message";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FC } from "react";

interface PageProps {
  params: {
    chatId: string;
  };
}

const getChatMessages = async (chatId: string) => {
  try {
    const results: string[] = await fetchRedis(
      "zrange",
      `chat:${chatId}:messages`,
      0,
      -1
    );

    const dbMessages = results.map((message) => {
      return JSON.parse(message) as Message;
    });

    const reversedDBMessages = dbMessages.reverse();

    const messages = messageArrayValidator.parse(reversedDBMessages);

    return messages;
  } catch (error) {
    notFound();
  }
};

const page = async ({ params }: PageProps) => {
  const { chatId } = params;

  const session = await getSession();

  if (!session) notFound();

  const { user } = session;

  const [userId1, userId2] = chatId.split("--");

  if (user.id !== userId1 && user.id !== userId2) {
    notFound();
  }

  const chatPartnerId = user.id === userId1 ? userId2 : userId1;
  const chatPartner = JSON.parse(
    await fetchRedis("get", `user:${chatPartnerId}`)
  ) as User;

  const initialMessages = await getChatMessages(chatId);

  return (
    <div className="flex-1 justify-between flex flex-col h-full max-h-[calc(100vh-6rem)]">
      <div className="flex sm:items-center justify-between py-3 border-b-2 border-gray-200">
        <div className="relative flex items-center space-x-4">
          <div className="relative">
            <div className="relative w-8 sm:w-12 h-8 sm:h-12">
              {chatPartner.image && (
                <Image
                  fill
                  referrerPolicy="no-referrer"
                  src={chatPartner.image}
                  alt={`${chatPartner.name} profile picture`}
                  className="rounded-full"
                />
              )}
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <div className="text-xl flex items-center">
              <span className="text-gray-700 mr-3 font-semibold">{chatPartner.name}</span>
            </div>
            <span className="text-sm text-gray-600">{chatPartner.email}</span>
          </div>
        </div>
      </div>

      <Messages
        chatId={chatId}
        initialMessages={initialMessages}
        sessionId={session.user.id}
        chatPartner={chatPartner}
        sessionImg={session.user.image}
      />

      <MessageInput chatId={chatId} chatPartner={chatPartner} />
    </div>
  );
};

export default page;
