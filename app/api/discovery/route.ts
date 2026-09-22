import { discoverCards } from "@/lib/card-discovery";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 12000)
      return Response.json(
        { error: "입력 항목이 너무 많습니다." },
        { status: 413 },
      );
    return Response.json(discoverCards(JSON.parse(body)), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "입력 내용을 확인해주세요.",
      },
      { status: 400 },
    );
  }
}
