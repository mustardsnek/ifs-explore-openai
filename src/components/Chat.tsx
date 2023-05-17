import { useEffect, useRef, useState } from "react";
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
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current.scrollIntoView({ behavior: "smooth" });
    return () => {};
  }, [messages]);

  async function sendMessage() {
    setLoading(true);
    setMessages(() => {
      return [...messages, { content: message, user: "user" }];
    });
    const response = await fetch("/api/unblend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (response.ok) {
      const data = await response.json();
      setLoading(false);
      setMessages(() => {
        return [
          ...messages,
          { content: message, user: "user" },
          { content: data.reply, user: "ai" },
        ];
      });

      setMessage("");
    } else {
      setLoading(false);
      setMessages(() => {
        return [
          ...messages,
          { content: message, user: "user" },
          { content: "Sorry, I didn't get that.", user: "ai" },
        ];
      });
      setMessage("");
    }
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatMessages}>
        {messages.map((msg, index) => (
          <div key={index}>
            {msg.user === "user" ? (
              <div className={styles.userMessage}>{msg.content}</div>
            ) : (
              <div className={styles.response}>{msg.content}</div>
            )}
          </div>
        ))}
        {loading && (
          <div className={styles.response}>
            <div className={styles.dots}>
              <div className={styles.dot1}></div>
              <div className={styles.dot2}></div>
              <div className={styles.dot3}></div>
            </div>
          </div>
        )}
        <div ref={scrollRef}></div>
      </div>

      <form
        className={styles.chatInput}
        action="submit"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message"
          className={styles.input}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className={styles.sendButton}
        >
          Send
        </button>
      </form>
    </div>
  );
};
