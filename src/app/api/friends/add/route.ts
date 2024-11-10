import { fetchRedis } from "@/helpers/redis";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { addFriendValidator } from "@/lib/validations/add-friend";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email: emailToAdd } = addFriendValidator.parse(body.email);

    const idToAdd = (await fetchRedis("get", `user:email:${emailToAdd}`)) as string;

    if (!idToAdd) {
      return new Response("This person does not exist", { status: 400 });
    }

    const session = await getSession();

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (idToAdd === session.user.id) {
      return new Response("You cannot add yourself as a friend", { status: 400 });
    }

    // check if the user has already send a friend request

    const isAlreadyAdded = (await fetchRedis(
      "sismember",
      `user:${idToAdd}:incoming_friend_requests`,
      session.user.id
    )) as 0 | 1;

    if (isAlreadyAdded) {
      return new Response("Already sent request to add this user", {
        status: 400,
      });
    }

    // check if the user is already added to friends

    const isAlreadyFriends = (await fetchRedis(
      "sismember",
      `user:${session.user.id}:friends`,
      idToAdd
    )) as 0 | 1;

    if (isAlreadyFriends) {
      return new Response("Already friends with this user", {
        status: 400,
      });
    }

    // valid request, send friend request

    console.log("PUSHER_APP_ID:", process.env.PUSHER_APP_ID);
    console.log("PUSHER_APP_SECRET:", process.env.PUSHER_APP_SECRET);
    console.log("NEXT_PUBLIC_PUSHER_APP_KEY:", process.env.NEXT_PUBLIC_PUSHER_APP_KEY);


    await pusherServer.trigger(toPusherKey(`user:${idToAdd}:incoming_friend_requests`), "incoming_friend_requests", {
      senderId: session.user.id,
      senderEmail: session.user.email
    })

    await db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id);

    return new Response("OK");
  } catch (error) {
    console.log(error);
    if (error instanceof z.ZodError) {
      return new Response("Invalid request payload", { status: 422 });
    }

    return new Response("Invalid request", { status: 400 });
  }
}
