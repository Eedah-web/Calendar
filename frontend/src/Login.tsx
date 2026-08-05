import { useState, type CSSProperties } from 'react';
import { Alert, Button, Input, Typography } from 'antd';
import { CalendarOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { supabase } from './supabaseClient';
import { useIsMobile } from './useIsMobile';

const { Title, Text } = Typography;

type Mode = 'signin' | 'signup';

export default function Login() {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null); setInfo(null);
    setPassword(''); setConfirm('');
  };

  const signIn = async () => {
    setError(null); setInfo(null); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const signUp = async () => {
    setError(null); setInfo(null);
    if (password !== confirm) { setError('Lösenorden matchar inte.'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else if (!data.session) setInfo('Konto skapat! Kolla din e-post och bekräfta adressen för att logga in.');
    setLoading(false);
  };

  const isSignup = mode === 'signup';
  const canSubmit = isSignup
    ? !!email && !!password && !!confirm
    : !!email && !!password;
  const submit = isSignup ? signUp : signIn;

  const field: CSSProperties = { height: isMobile ? 52 : 66, fontSize: isMobile ? 16 : 19, borderRadius: isMobile ? 12 : 16 };

  return (
    <div style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      background: 'linear-gradient(135deg, #13c2c2 0%, #1677ff 100%)',
    }}>
      {/* decorative blurred circles for depth */}
      <div style={{ position: 'absolute', top: -120, left: -120, width: 380, height: 380, borderRadius: '50%', background: 'rgba(255,255,255,.12)', filter: 'blur(8px)' }} />
      <div style={{ position: 'absolute', bottom: -140, right: -100, width: 420, height: 420, borderRadius: '50%', background: 'rgba(255,255,255,.10)', filter: 'blur(8px)' }} />

      <style>{`
        @keyframes loginIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .login-card { animation: loginIn .5s cubic-bezier(.16,1,.3,1) both; }
        .login-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(22,119,255,.35) !important; }
        .login-primary { transition: transform .15s ease, box-shadow .15s ease; }
      `}</style>

      <div className="login-card" key={mode} style={{
        position: 'relative', width: '100%', maxWidth: 660,
        background: '#fff', borderRadius: isMobile ? 24 : 32,
        padding: isMobile ? '40px 24px' : '72px 68px',
        boxShadow: '0 32px 80px rgba(0,0,0,.26)',
      }}>
        {/* icon badge */}
        <div style={{
          width: isMobile ? 80 : 108, height: isMobile ? 80 : 108,
          margin: '0 auto 24px', borderRadius: isMobile ? 24 : 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #13c2c2 0%, #1677ff 100%)',
          boxShadow: '0 14px 32px rgba(19,194,194,.44)',
        }}>
          <CalendarOutlined style={{ fontSize: isMobile ? 40 : 54, color: '#fff' }} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 44 }}>
          <Title level={1} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.5px', fontSize: isMobile ? 34 : 52 }}>
            {isSignup ? 'Skapa konto' : 'Välkommen'}
          </Title>
          <Text type="secondary" style={{ fontSize: isMobile ? 16 : 21 }}>
            {isSignup ? 'Registrera dig för att komma igång' : 'Logga in för att se din kalender'}
          </Text>
        </div>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16, borderRadius: 12 }} />}
        {info && <Alert type="success" message={info} showIcon style={{ marginBottom: 16, borderRadius: 12 }} />}

        <Input
          size="large"
          variant="filled"
          prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
          placeholder="E-post"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ ...field, marginBottom: 14 }}
          autoComplete="email"
        />
        <Input.Password
          size="large"
          variant="filled"
          prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
          placeholder="Lösenord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onPressEnter={isSignup ? undefined : signIn}
          style={{ ...field, marginBottom: isSignup ? 14 : 24 }}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
        />
        {isSignup && (
          <Input.Password
            size="large"
            variant="filled"
            prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
            placeholder="Bekräfta lösenord"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onPressEnter={signUp}
            style={{ ...field, marginBottom: 24 }}
            autoComplete="new-password"
          />
        )}

        <Button
          className="login-primary"
          type="primary" size="large" block loading={loading}
          onClick={submit} disabled={!canSubmit}
          style={{
            height: isMobile ? 52 : 66, fontSize: isMobile ? 17 : 21, fontWeight: 700,
            borderRadius: isMobile ? 12 : 16, border: 'none',
            color: '#000',
            background: 'linear-gradient(135deg, #13c2c2 0%, #1677ff 100%)',
            boxShadow: '0 4px 14px rgba(22,119,255,.3)',
          }}
        >
          {isSignup ? 'Skapa konto' : 'Logga in'}
        </Button>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            {isSignup ? 'Har du redan ett konto? ' : 'Har du inget konto? '}
          </Text>
          <Button
            type="link"
            onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
            disabled={loading}
            style={{ padding: 0, fontSize: 16, fontWeight: 600, height: 'auto' }}
          >
            {isSignup ? 'Logga in' : 'Skapa konto'}
          </Button>
        </div>
      </div>
    </div>
  );
}
