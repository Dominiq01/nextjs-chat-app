const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
const authToken = process.env.UPSTASH_REDIS_REST_TOKEN;

type Commands = "zrange" | "sismember" | "get" | "smembers";

export async function fetchRedis(command: Commands, ...args: (string | number)[]) {
  const commandUrl = `${upstashRedisRestUrl}/${command}/${args.join("/")}`;

  const res = await fetch(commandUrl, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Error executing Redis command: ${res.statusText}`);
  }

  const data = await res.json();

  return data.result;
}

export async function getFriendsByUserId(userId: string) {
  const friendsIds = (await fetchRedis("smembers", `user:${userId}:friends`)) as string[];

  const friends = await Promise.all(
    friendsIds.map(async (friendId) => {
      const friend = JSON.parse(await fetchRedis("get", `user:${friendId}`));
      
      return friend as User;
    })
  );

  return friends;
}
