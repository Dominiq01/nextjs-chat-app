import { Icon, Icons } from "@/components/Icons";
import SidebarChatList from "@/components/SidebarChatList";
import SignOutButton from "@/components/SignOutButton";
import FriendRequestsSidebarOption from "@/components/ui/FriendRequestsSidebarOption";
import { fetchRedis, getFriendsByUserId } from "@/helpers/redis";
import { getSession } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FC, ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

interface SidebarOption {
  id: number;
  name: string;
  href: string;
  icon: Icon;
}

const sidebarOptions: SidebarOption[] = [
  {
    id: 1,
    name: "Add friend",
    href: "/dashboard/add",
    icon: "UserPlus",
  },
];

const Layout: FC<LayoutProps> = async ({ children }) => {
  const session = await getSession();
  if (!session) notFound();

  const friends = await getFriendsByUserId(session.user.id);

  const unseenRequestCount = (
    (await fetchRedis(
      "smembers",
      `user:${session.user.id}:incoming_friend_requests`
    )) as User[]
  ).length;

  return (
    <div className="w-full flex h-screen">
      <div className="flex h-full w-full max-w-xs grow flex-col gap-y-4 overflow-auto border-r border-gray-200 bg-white px-6">
        <Link href={"/dashboard"} className="flex h-16 shrink-0 items-center">
          <Icons.Logo className="h-8 w-auto text-indigo-600" />
        </Link>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-2">
            {friends.length > 0 ? (
              <div className="text-xs font-semibold leading-6 text-gray-400">
                Your chats
              </div>
            ) : null}
            <li>
              <SidebarChatList sessionId={session.user.id} friends={friends}/>
            </li>
            <div className="text-xs font-semibold leading-6 text-gray-400">Overview</div>
            {sidebarOptions.map((option) => {
              const Icon = Icons[option.icon];
              return (
                <li key={option.id}>
                  <Link
                    className="text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex gap-3 rounded-md p-2 text-sm leading-6 font-semibold"
                    href={option.href}
                  >
                    <span className="text-gray-700 border-gray-200 group-hover:border-indigo-600 group-hover:text-indigo-600 flex w-6 h-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium bg-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate">{option.name}</span>
                  </Link>
                </li>
              );
            })}

            <li>
              <FriendRequestsSidebarOption
                sessionId={session.user.id}
                initialUnseenRequestCount={unseenRequestCount}
              />
            </li>

            <li className="-mx-6 mt-auto flex items-center">
              <div className="flex flex-1 items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900">
                <div className="relative h-8 w-8 bg-gray-50">
                  <Image
                    src={session.user.image || ""}
                    fill
                    referrerPolicy="no-referrer"
                    className="rounded-full"
                    alt="Your profile picture"
                  />
                </div>
                <span className="sr-only">Your profile</span>
                <div className="flex flex-col">
                  <span aria-hidden="true">{session.user.name}</span>
                  <span className="text-xs text-zinc-400" aria-hidden={true}>
                    {session.user.email}
                  </span>
                </div>
              </div>
              <SignOutButton className="h-full" />
            </li>
          </ul>
        </nav>
      </div>
      {children}
    </div>
  );
};

export default Layout;
