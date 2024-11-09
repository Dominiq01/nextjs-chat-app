import { fetchRedis } from "@/helpers/redis";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { id: idToRemove } = z
      .object({
        id: z.string(),
      })
      .parse(body);
    const session = await getSession();

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const hasFriendRequest = (await fetchRedis(
      "sismember",
      `user:${session.user.id}:incoming_friend_requests`,
      idToRemove
    )) as 0 | 1;

    if (!hasFriendRequest) {
      return new Response("No friend request", { status: 400 });
    }

    await pusherServer.trigger(
      toPusherKey(`user:${session.user.id}:incoming_friend_requests`),
      "deny_friend",
      {}
    );

    await db.srem(`user:${session.user.id}:incoming_friend_requests`, idToRemove);

    return new Response("Ok", { status: 200 });
  } catch (error) {
    console.log(error);

    if (error instanceof z.ZodError) {
      return new Response("Invalid request payload", { status: 422 });
    }

    return new Response("Invalid request", { status: 400 });
  }
}
