// app/api/chat/route.ts
export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Forward request to your backend
    const res = await fetch("https://rag-chatbot-1-nerv-gaurav.onrender.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ message: "🤖 Drona AI is offline or unreachable." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
