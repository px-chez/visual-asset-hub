// context/AuthContext.jsx
import { createContext, useEffect, useContext, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Загрузка профиля пользователя
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  };

  useEffect(() => {
    // Проверка текущей сессии
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      }
      setLoading(false);
    });

    // Подписка на изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Регистрация
  const signUpNewUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  };

  // Вход
  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Выход
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out error:', error);
  };

  // Обновление профиля
  const updateProfile = async (updates) => {
    if (!profile?.id) return { success: false, error: 'No profile' };
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', profile.id)
      .select()
      .single();
    
    if (error) return { success: false, error: error.message };
    setProfile(data);
    return { success: true, data };
  };

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      signUpNewUser,
      signInUser,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('UserAuth must be used within AuthContextProvider');
  return context;
};