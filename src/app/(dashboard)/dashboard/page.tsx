import { getSession } from "@/lib/auth";

const page = async ({}) => {
  const session = await getSession();

  return <div>Dashboard</div>;
};

export default page;
