// Auth stub: no-login mode. Returns a fixed fake organizer user so all pages work without authentication.
import { useToast } from '@/hooks/use-toast';

const FAKE_USER_ID = '00000000-0000-0000-0000-000000000001';

const fakeUser = {
  id: FAKE_USER_ID,
  email: 'organizer@local',
  user_metadata: { display_name: 'منظم' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as any;

const fakeProfile = {
  id: FAKE_USER_ID,
  user_id: FAKE_USER_ID,
  display_name: 'منظم',
  bio: null,
  avatar_url: null,
  is_organizer: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export type UserRole = 'organizer' | 'viewer';

export function useAuth() {
  const { toast } = useToast();
  return {
    user: fakeUser,
    session: { user: fakeUser } as any,
    profile: fakeProfile,
    role: 'organizer' as UserRole,
    loading: false,
    signUp: async () => ({ error: null }),
    signIn: async () => ({ error: null, user: fakeUser }),
    signOut: async () => {
      toast({ title: 'تم' });
    },
    isOrganizer: true,
    isViewer: false,
  };
}
