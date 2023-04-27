import {
  createTasks,
  getOpenTasks,
  taskExecutionAgent,
  taskQualityAgent,
} from "@/utils/taskUtils";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
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
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string
  );
  const openTasks = await getOpenTasks(serviceClient, session, 1);
  let userPrompt: string = req.body.message;
  if (!openTasks || openTasks.length === 0) {
    await createTasks(1, serviceClient, session);
  }

  const updatedTasks = await taskQualityAgent(
    serviceClient,
    session,
    userPrompt
  );
  const gptReply = await taskExecutionAgent(
    serviceClient,
    updatedTasks,
    userPrompt
  );

  // Store messages
  supabase.from("chat").insert([
    { text: userPrompt, type: "user" },
    { text: gptReply, type: "ai" },
  ]);

  res.status(200).json({ reply: gptReply });
}
