import FriendRequests from "@/components/FriendRequests";
import { fetchRedis } from "@/helpers/redis";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";

const page = async () => {
  const session = await getSession();
  if (!session) notFound();

  const incomingSenderIds = (await fetchRedis(
    "smembers",
    `user:${session.user.id}:incoming_friend_requests`
  )) as string[];
  

  const incomingFriendRequests = await Promise.all(
    incomingSenderIds.map(async(senderId) => {
      const sender = JSON.parse(await fetchRedis("get", `user:${senderId}`)) as User
      
      return {
        senderId,
        senderEmail: sender.email
      }
    })
  )

  return <main className="pt-8">
    <h1 className="font-bold text-5xl mb-8"></h1>
    <div className="flex flex-col gap-4">
      <FriendRequests incomingFriendRequests={incomingFriendRequests} sessionId={session.user.id}/>
    </div>
  </main>;
};

export default page;
