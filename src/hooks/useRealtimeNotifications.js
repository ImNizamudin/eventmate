import { useCallback, useEffect, useState } from 'react';
import { supabase, uniqueChannelName } from '../lib/supabaseClient';

export function useRealtimeNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [pendingActionCount, setPendingActionCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCountsAndNotifications = useCallback(async () => {
    if (!supabase || !userId) {
      setNotifications([]);
      setPendingActionCount(0);
      return;
    }
    setLoading(true);
    try {
      const [{ data: notifData }, { data: myTeams }, { data: myPendingInvites }] =
        await Promise.all([
          supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(40),
          supabase.from('teams').select('id').eq('creator_id', userId),
          supabase
            .from('team_invitations')
            .select('id')
            .eq('invitee_id', userId)
            .eq('status', 'pending'),
        ]);

      let pendingJoinCount = 0;
      const teamIds = (myTeams || []).map((t) => t.id);
      if (teamIds.length > 0) {
        const { count } = await supabase
          .from('join_requests')
          .select('id', { count: 'exact', head: true })
          .in('team_id', teamIds)
          .eq('status', 'pending');
        pendingJoinCount = count || 0;
      }

      setNotifications(notifData || []);
      setPendingActionCount(pendingJoinCount + (myPendingInvites?.length || 0));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCountsAndNotifications();
  }, [fetchCountsAndNotifications]);

  useEffect(() => {
    if (!supabase || !userId) return undefined;

    const channel = supabase
      .channel(uniqueChannelName(`user-live-${userId}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => fetchCountsAndNotifications()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'join_requests' }, () =>
        fetchCountsAndNotifications()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_invitations' }, () =>
        fetchCountsAndNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchCountsAndNotifications]);

  const markAsRead = async (notificationId) => {
    if (!supabase || !userId) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!supabase || !userId) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    pendingActionCount,
    loading,
    refresh: fetchCountsAndNotifications,
    markAsRead,
    markAllAsRead,
  };
}
