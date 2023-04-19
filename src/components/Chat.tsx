import { useState } from "react";

interface ChatProps {}

type Message = {
  content: string;
  user: "me" | "ai";
};

export const Chat: React.FC<ChatProps> = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  async function sendMessage() {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (response.ok) {
      const data = await response.json();
      setMessages([
        ...messages,
        { content: message, user: "me" },
        { content: data.reply, user: "ai" },
      ]);
      setMessage("");
    }
  }

  return (
    <div>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.user === "me" ? "You" : "AI"}: </strong>
            {msg.content}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message"
      />
      <button onClick={sendMessage} disabled={!message.trim()}>
        Send
      </button>
    </div>
  );
};
