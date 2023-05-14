import { Database } from "@/types/supabase";
import { Session, SupabaseClient } from "@supabase/supabase-js";
import { Configuration, OpenAIApi } from "openai";
import { formatString } from "./format";
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY as string,
});
const openai = new OpenAIApi(configuration);

type function_id =
  Database["public"]["Tables"]["explore_functions"]["Row"]["id"];

export async function createTasks(
  function_id: function_id,
  supabaseClient: SupabaseClient,
  session: Session
) {
  const { data: tasks, error } = await supabaseClient
    .from("explore_function_tasks")
    .select("*")
    .eq("function_id", function_id);
  const { data, error: insertError } = await supabaseClient
    .from("user_explore_function_tasks")
    .insert([
      ...tasks.map((task) => {
        return {
          function_id: task.function_id,
          session_id: session.user.id,
          task: task.task,
          task_description: task.task_description,
        };
      }),
    ]);
}

export async function getOpenTasks(
  supabaseClient: SupabaseClient,
  session: Session,
  function_id: Database["public"]["Tables"]["user_explore_function_tasks"]["Row"]["function_id"]
) {
  const { data: tasks, error } = await supabaseClient
    .from("user_explore_function_tasks")
    .select("*")
    .eq("function_id", function_id)
    .eq("closed", false);

  return tasks;
}

export async function taskQualityAgent(
  supabaseClient: SupabaseClient,
  session: Session,
  userContext: string
) {
  const { data: tasks, error } = await supabaseClient
    .from("user_explore_function_tasks")
    .select("*")
    .eq("session_id", session.user.id)
    .eq("closed", false)
    .order("task", { ascending: true });
  const taskToExamine = tasks?.filter((task) => !task.completed)[0];
  console.log("Examining task: " + taskToExamine.task_description);
  const gptResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are a quality assurance agent specialized in Internal Family Systems (IFS) methodology. Your goal is to determine whether a task has been completed based on user conversations. Start your response with a simple 'Yes' or 'No' followed by a period, and then your justification as to why the task has been completed or not.`,
      },
      {
        role: "user",
        content: `The task to observe is: ${taskToExamine.task_description}. Based on a user response of '${userContext}', has the task been completed?`,
      },
    ],
  });
  const response = gptResponse.data.choices[0].message?.content;
  console.log("QA response: " + response);
  const completed = response?.startsWith("Yes");

  const { data, error: updateError } = await supabaseClient
    .from("user_explore_function_tasks")
    .update({ completed: completed, result: response })
    .eq("id", taskToExamine.id);

  const { data: updatedTasks, error: updatedTasksError } = await supabaseClient
    .from("user_explore_function_tasks")
    .select("*")
    .eq("closed", false)
    .order("task", { ascending: true });

  return updatedTasks;
}

export async function taskExecutionAgent(
  supabaseClient: SupabaseClient,
  updatedTasks: Database["public"]["Tables"]["user_explore_function_tasks"]["Row"][],
  userPrompt: string
) {
  const taskToExecute = updatedTasks.filter((task) => !task.completed)[0];
  console.log("Executing task: " + taskToExecute.task_description);
  const completedTasks = updatedTasks
    .filter((task) => task.completed)
    .map((task) => task.task)
    .join("\n");
  const context = updatedTasks
    .filter((task) => task.completed)
    .map((task) => task.result)
    .join("\n");
  const { data: system_prompt, error } = await supabaseClient
    .from("explore_functions")
    .select("system_prompt")
    .eq("id", taskToExecute.function_id)
    .single();
  const enriched_system_prompt = formatString(
    system_prompt?.system_prompt,
    completedTasks,
    context,
    taskToExecute.task_description
  );
  const gptResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: enriched_system_prompt },
      { role: "user", content: userPrompt },
    ],
  });
  let gptReply = gptResponse.data.choices[0].message?.content;
  console.log("Assistant reply: " + gptReply);
  return gptReply;
}

export async function NVCAgent(gptReply: string) {
  const gptResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a professional teacher of Nonviolent Communication as implemented by Dr. Marshall Rosenberg. Your goal is to translate everything the user says into NVC language, shortening and summarizing where possible.",
      },
      {
        role: "user",
        content: "Please translate this: " + gptReply + " into NVC langauge",
      },
    ],
  });
  const response = gptResponse.data.choices[0].message?.content;
  return response;
}

export async function summaryAgent(gptReply: string) {
  const gptResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are an agent specializing in summarizing text. Your goal is to summarize a different agents response into a single sentence, matching their tone and style as much as possible. Respond to prompts as if you were the original agent.",
      },
      {
        role: "user",
        content:
          "Please summarize this: " + gptReply + " into a single sentence",
      },
    ],
  });
  const response = gptResponse.data.choices[0].message?.content;
  return response;
}

export async function fragileAgent(gptReply: string) {
  const gptResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are an agent specializing in being offended by everything. You goal is to be offended by a different agents response as much as possible. Respond to prompts as if you were the original agent. ",
      },
      {
        role: "user",
        content: gptReply,
      },
    ],
  });
  const response = gptResponse.data.choices[0].message?.content;
  return response;
}

export async function moderationAgent(gptReply: string) {
  const gptResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are an Internal Family Systems (IFS) therapist observing another IFS professional and client interact. Your goal is to provide feedback to the professional on how they can improve their IFS practice. Respond to prompts as if you were the original agent.",
      },
      {
        role: "user",
        content: gptReply,
      },
    ],
  });
  const response = gptResponse.data.choices[0].message?.content;
  return response;
}

export async function languageGuidelineEnforcer(
  gptReply: string,
  supabaseClient: SupabaseClient
) {
  const { data: rules, error } = await supabaseClient
    .from("language_guidelines")
    .select("*");
  const gptResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are a language guideline enforcer. Your goal is to enforce the language guidelines a mental health application focusing on Internal Family Systems (IFS) methodology. These are the rules as ordered by importance:
1.	You shall not assign causes to a user’s experience. 
2.	You shall stick to factual information such as what the user is feeling, thinking, or sensing. 
3.	You shall refrain from using IFS or other mental health jargon unless the user has already introduced it.
4.	You shall only ask one question at a time.
5.	You shall limit your responses to twenty words maximum unless the exception agent tells you otherwise.
If there are no rule violations respond with a simple 'No' followed by a period. If there are rule violations respond with a simple 'Yes' followed by a period, and then your justification as to why the rule[s] has been violated. Make sure to list ALL rule violations.`,
      },
      {
        role: "user",
        content: gptReply,
      },
    ],
  });
  const response = gptResponse.data.choices[0].message?.content;
  return response;
}

export async function ruleFixerAgent(
  ruleCheck: string,
  originalReply: string,
  supabaseClient: SupabaseClient
) {
  const gptResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are a rule fixer agent. Your goal is to fix the rule violations of another agent. Respond to prompts as if you were the original agent. Here are the rules for reference:
        1.	You shall not assign causes to a user’s experience. 
2.	You shall stick to factual information such as what the user is feeling, thinking, or sensing. 
3.	You shall refrain from using IFS or other mental health jargon unless the user has already introduced it.
4.	You shall only ask one question at a time.
5.	You shall limit your responses to twenty words maximum unless the exception agent tells you otherwise.`,
      },
      {
        role: "user",
        content: "This is the agent's original response: " + originalReply,
      },
      {
        role: "assistant",
        content:
          "These are the rule violations and any suggestions: " + ruleCheck,
      },
    ],
  });
  const response = gptResponse.data.choices[0].message?.content;
  return response;
}
