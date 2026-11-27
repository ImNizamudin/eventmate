import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { formatSupabaseError, isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [contacts, setContacts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const loadUserProfile = useCallback(async (authUser) => {
    if (!supabase || !authUser) {
      setProfile(null);
      setContacts(null);
      return null;
    }

    const { data: prof, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profError) {
      throw profError;
    }

    let activeProfile = prof;
    if (!activeProfile) {
      const fallbackName =
        authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Pengguna';
      const fallbackRole =
        authUser.user_metadata?.role === 'creator' ? 'creator' : 'seeker';
      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .upsert(
          {
            id: authUser.id,
            email: authUser.email || '',
            name: fallbackName,
            username: `${fallbackName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}.${authUser.id.slice(0, 4)}`,
            role: fallbackRole,
          },
          { onConflict: 'id' }
        )
        .select('*')
        .single();
      if (insertErr) throw insertErr;
      activeProfile = inserted;
    }

    const { data: contactRow } = await supabase
      .from('profile_contacts')
      .select('*')
      .eq('user_id', authUser.id)
      .maybeSingle();

    setProfile(activeProfile);
    setContacts(
      contactRow || {
        user_id: authUser.id,
        whatsapp: '',
        telegram: '',
        linkedin: '',
        public_email: authUser.email || '',
        share_with_teammates: true,
      }
    );
    return activeProfile;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    const initAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await loadUserProfile(currentSession.user);
        }
      } catch {
        // Profile fetch errors are handled on route retry
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        try {
          await loadUserProfile(nextSession.user);
        } catch {
          // Handled cleanly by views
        }
      } else {
        setProfile(null);
        setContacts(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    return loadUserProfile(user);
  }, [user, loadUserProfile]);

  const signUp = async ({ name, email, password, role }) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          name: name.trim(),
          role: role === 'creator' ? 'creator' : 'seeker',
        },
      },
    });
    if (error) throw new Error(formatSupabaseError(error));

    // Supabase returns empty identities array if email already exists when confirmation is enabled
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('Email ini sudah terdaftar. Silakan masuk atau gunakan Lupa Kata Sandi.');
    }

    return {
      user: data.user,
      session: data.session,
      needsEmailConfirmation: !data.session,
    };
  };

  const signIn = async ({ email, password }) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(formatSupabaseError(error));
    if (data.user) {
      await loadUserProfile(data.user);
    }
    return data;
  };

  const resendVerificationEmail = async (email) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    });
    if (error) throw new Error(formatSupabaseError(error));
  };

  const sendPasswordResetEmail = async (email) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(formatSupabaseError(error));
  };

  const updatePassword = async (newPassword) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(formatSupabaseError(error));
    setIsRecoveryMode(false);
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setContacts(null);
  };

  const updateProfileAndContacts = async (profilePatch, contactPatch) => {
    if (!supabase || !user) throw new Error('Sesi tidak aktif.');

    const { data: updatedProfile, error: profErr } = await supabase
      .from('profiles')
      .update({ ...profilePatch, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('*')
      .single();
    if (profErr) throw new Error(formatSupabaseError(profErr));

    let updatedContact = contacts;
    if (contactPatch) {
      const { data: savedContact, error: contactErr } = await supabase
        .from('profile_contacts')
        .upsert(
          {
            user_id: user.id,
            ...contactPatch,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select('*')
        .single();
      if (contactErr) throw new Error(formatSupabaseError(contactErr));
      updatedContact = savedContact;
    }

    setProfile(updatedProfile);
    setContacts(updatedContact);
    return { profile: updatedProfile, contacts: updatedContact };
  };

  const value = {
    session,
    user,
    profile,
    contacts,
    loading,
    isRecoveryMode,
    signUp,
    signIn,
    signOut,
    resendVerificationEmail,
    sendPasswordResetEmail,
    updatePassword,
    refreshProfile,
    updateProfileAndContacts,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
