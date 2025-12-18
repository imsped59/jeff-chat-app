export class ChatRoom {
  constructor(state) {
    this.state = state;
    this.users = new Map(); // socket -> name
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") {
      return new Response("Expected websocket", { status: 400 });
    }

    const [client, server] = Object.values(new WebSocketPair());
    server.accept();

    let userName = "Anonymous";

    server.addEventListener("message", async (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === "join" && data.name) {
          userName = data.name;
          this.users.set(server, userName);
          this.broadcast({ type: "system", text: `${userName} joined` });
        } else if (data.type === "chat") {
          const name = this.users.get(server) || "Anonymous";
          this.broadcast({ type: "chat", name, text: data.text });
        }
      } catch (e) {}
    });

    server.addEventListener("close", () => {
      const name = this.users.get(server) || "Someone";
      this.users.delete(server);
      this.broadcast({ type: "system", text: `${name} left` });
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcast(message) {
    const msg = JSON.stringify(message);
    for (const ws of this.users.keys()) {
      ws.send(msg);
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/websocket") {
      const id = env.CHAT_ROOM.idFromName("global-room");
      const obj = env.CHAT_ROOM.get(id);
      return obj.fetch(request);
    }

    // All other requests handled by static assets
    return env.ASSETS.fetch(request);
  },
};
