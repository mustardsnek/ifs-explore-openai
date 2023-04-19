import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY as string,
});
const openai = new OpenAIApi(configuration);

type Data = {
  reply?: string;
  error?: string;
  description?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Create authenticated Supabase Client
  const supabase = createServerSupabaseClient({ req, res });
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return res.status(401).json({
      error: "not_authenticated",
      description:
        "The user does not have an active session or is not authenticated",
    });

  // Run queries with RLS on the server
  const { message } = req.body;
  const user_id = session.user.id;
  console.log(message);
  try {
    // Call GPT
    const gptResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    });

    const gptReply = gptResponse.data.choices[0].message?.content;

    // Store messages
    await supabase.from("chat").insert([
      { user_id: user_id, text: message, type: "user" },
      { user_id: user_id, text: gptReply, type: "ai" },
    ]);

    res.status(200).json({ reply: gptReply });
  } catch (error) {
    console.log("got here");
    res.status(500).json({ error: "An error occurred" });
  }
}
