import { Chat } from "@/components/Chat";
import { Database } from "@/types/supabase";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useEffect, useState } from "react";

type ChatMessage = Database["public"]["Tables"]["chat"]["Row"];

const LoginPage = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [data, setData] = useState<ChatMessage[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from("chat").select("*");
      console.log(data);
    }
    // Only run query once user is logged in.
    if (user) loadData();
  }, [user]);

  if (!user)
    return (
      <Auth
        redirectTo="http://localhost:3000/"
        appearance={{ theme: ThemeSupa }}
        supabaseClient={supabase}
        providers={["google", "github"]}
        socialLayout="horizontal"
      />
    );

  return (
    <>
      <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      <div>
        <Chat />
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    </>
  );
};

export default LoginPage;
