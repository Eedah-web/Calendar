import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, Spin } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { clearLocal, hydrate } from './store';
import Login from './Login';
import ResetPassword from './ResetPassword';
import Logo from './Logo';

const centered: CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

export default function AuthGate({ children }: { children: ReactNode }) {
  // undefined = loading session, null = signed out, Session = signed in
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [ready, setReady] = useState(false); // data fetched for the current user
  const [recovery, setRecovery] = useState(false); // came from a "forgot password" email link

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;

  useEffect(() => {
    let cancelled = false;
    if (session === undefined) return;          // waiting for session
    if (!userId) { clearLocal(); setReady(false); return; }

    setReady(false);
    hydrate(userId).finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [session, userId]);

  const logout = async () => {
    await supabase.auth.signOut();
    clearLocal();
  };

  if (session === undefined) return <div style={centered}><Spin size="large" /></div>;
  if (!session) return <Login />;
  if (recovery) return <ResetPassword onDone={() => setRecovery(false)} />;
  if (!ready) return <div style={centered}><Spin size="large" tip="Hämtar din kalender..." /></div>;

  return (
    <>
      <div style={{ position: 'fixed', top: 14, left: 20, zIndex: 90 }}>
        <Logo size="sm" />
      </div>
      <Button
        icon={<LogoutOutlined />}
        onClick={logout}
        style={{
          position: 'fixed', top: 14, right: 20, zIndex: 90,
          borderColor: 'rgba(255,255,255,.5)', color: '#fff', background: 'rgba(255,255,255,.15)',
        }}
      >
        Logga ut
      </Button>
      {children}
    </>
  );
}
