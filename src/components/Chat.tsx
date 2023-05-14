import { useState } from "react";
import styles from "./Chat.module.css";

interface ChatProps {}

type Message = {
  content: string;
  user: "user" | "ai";
};

export const Chat: React.FC<ChatProps> = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    setLoading(true);
    const response = await fetch("/api/unblend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (response.ok) {
      const data = await response.json();
      setLoading(false);
      setMessages([
        ...messages,
        { content: message, user: "user" },
        { content: data.reply, user: "ai" },
      ]);
      setMessage("");
    }
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatMessages}>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.user === "user" ? "You" : "AI"}: </strong>
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className={styles.typingIndicator}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        )}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message"
        className={styles.chatInput}
      />
      <button onClick={sendMessage} disabled={!message.trim()}>
        Send
      </button>
    </div>
  );
};
