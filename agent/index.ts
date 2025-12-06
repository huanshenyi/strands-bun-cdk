import { agent } from "./agent";
import { Hono } from "hono";

const PORT = process.env.PORT || 8080;

const app = new Hono();

app.get("/ping", (c) =>
  c.json({
    status: "Healthy",
    time_of_last_update: Math.floor(Date.now() / 1000),
  })
);

app.post("/invocations", async (c) => {
  try {
    const prompt = await c.req.text();
    console.log(`Received prompt: ${prompt}`)

    const stream = new ReadableStream({
      async start(controller) {
        for await (const event of agent.stream(prompt)) {
          if (
            event.type === "modelContentBlockDeltaEvent" &&
            event.delta.type === "textDelta"
          ) {
            const data = `data: ${JSON.stringify({
              text: event.delta.text,
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }
        }
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Error processing request:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default {
  fetch: app.fetch,
  port: Number(PORT),
};

console.log(`AgentCore Runtime server listening on port ${PORT}`);
