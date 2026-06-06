import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'organizer' | 'viewer';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_organizer: boolean;
}

function profileFromUser(u: any): Profile {
  return {
    id: u.id,
    user_id: u.id,
    display_name: u.user_metadata?.display_name || u.user_metadata?.username || null,
    bio: u.user_metadata?.bio || null,
    avatar_url: u.user_metadata?.avatar_url || null,
    is_organizer: true,
  };
}

export function useAuth() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const profile = user ? profileFromUser(user) : null;

  return {
    user,
    session,
    profile,
    role: 'organizer' as UserRole,
    loading,
    signUp: async (email: string, password: string, meta?: Record<string, any>) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: meta, emailRedirectTo: `${window.location.origin}/` },
      });
      return { error };
    },
    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { error, user: data?.user ?? null };
    },
    resetPassword: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    },
    signOut: async () => {
      await supabase.auth.signOut();
      toast({ title: 'تم تسجيل الخروج' });
    },
    isOrganizer: true,
    isViewer: false,
  };
}
