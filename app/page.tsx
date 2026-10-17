import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { ensureSchema } from "@/db";
import DerslikClient from "./derslik-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireChatGPTUser("/");

  // Ensure DB tables exist and default 6 courses are seeded for this user
  await ensureSchema(user.userId);

  return (
    <DerslikClient
      user={{
        userId: user.userId,
        displayName: user.displayName,
        email: user.email,
      }}
    />
  );
}
