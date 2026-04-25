import { createContext, useEffect, useContext, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single()
          .then(({ data }) => { if (mounted) setProfile(data); });
      }
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
        if (session?.user) {
          supabase.from("profiles").select("*").eq("id", session.user.id).single()
            .then(({ data }) => { if (mounted) setProfile(data); });
        } else {
          setProfile(null);
        }
        if (mounted) setLoading(false);
      }
    );

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // Вход и регистрация — без изменений
  const signUpNewUser = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: fullName ? { data: { full_name: fullName } } : {},
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  };

  const signInUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signUpNewUser, signInUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("UserAuth must be used within AuthContextProvider");
  return context;
};