import { MAX_LENGTH } from "@/helpers/constants";
import { fetchRedis } from "@/helpers/redis";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { Message, messageValidator } from "@/lib/validations/message";
import { nanoid } from "nanoid";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const {
      text,
      chatId,
    }: {
      text: string;
      chatId: string;
    } = await req.json();

    const session = await getSession();

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const [userId1, userId2] = chatId.split("--");

    if (userId1 !== session.user.id && userId2 !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const friendId = session.user.id === userId1 ? userId2 : userId1;

    const friendsIds = (await fetchRedis(
      "smembers",
      `user:${session.user.id}:friends`
    )) as string[];

    const isFriend = friendsIds.includes(friendId);

    if (!isFriend) {
      return new Response("Unauthorized: You can't chat with this person", {
        status: 401,
      });
    }

    const sender = session.user as User;

    const timestamp = Date.now();

    const messageData: Message = {
      id: nanoid(),
      senderId: sender.id,
      text,
      timestamp,
    };

    const message = messageValidator.parse(messageData);

    await pusherServer.trigger(toPusherKey(`chat:${chatId}:messages`), 'new_message', message);
    
    await pusherServer.trigger(toPusherKey(`user:${friendId}:chats`), 'new_unseenMessage', {
      ...message,
      senderImg: sender.image,
      senderName: sender.name
    })

    await db.zadd(`chat:${chatId}:messages`, {
      score: timestamp,
      member: JSON.stringify(message),
    });

    return new Response("Ok", { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 });
    }

    if (error instanceof z.ZodError) {
      return new Response("Invalid request payload", { status: 422 });
    }

    return new Response("Internal server error", { status: 500 });
  }
}
