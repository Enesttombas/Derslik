import { getChatGPTUser } from "@/app/chatgpt-auth";
import { akisDurumuOku } from "@/lib/akis-sunucu";

const BASLIK = { "Cache-Control": "private, no-store" };

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401, headers: BASLIK });
  try {
    return Response.json(await akisDurumuOku(user.userId), { status: 200, headers: BASLIK });
  } catch {
    return Response.json({ error: "Akış durumu yüklenemedi." }, { status: 500, headers: BASLIK });
  }
}
