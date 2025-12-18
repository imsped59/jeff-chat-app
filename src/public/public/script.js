const joinScreen = document.getElementById("join-screen");
const chatScreen = document.getElementById("chat-screen");
const nameInput = document.getElementById("name-input");
const joinBtn = document.getElementById("join-btn");
const messages = document.getElementById("messages");
const msgInput = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");

let ws;
let myName = "";

joinBtn.addEventListener("click", () => {
  myName = nameInput.value.trim() || "Anonymous";
  joinScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");

  ws = new WebSocket(`wss://${location.host}/websocket`);
  ws.onopen = () => {
    if (myName !== "Anonymous") {
      ws.send(JSON.stringify({ type: "join", name: myName }));
    }
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const div = document.createElement("div");
    div.classList.add("message");

    if (data.type === "system") {
      div.classList.add("system");
      div.textContent = data.text;
    } else if (data.type === "chat") {
      div.textContent = `${data.name}: ${data.text}`;
      if (data.name === myName) div.classList.add("my-chat");
      else div.classList.add("chat");
    }
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  };
});

sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });

function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;
  ws.send(JSON.stringify({ type: "chat", text }));
  msgInput.value = "";
}
