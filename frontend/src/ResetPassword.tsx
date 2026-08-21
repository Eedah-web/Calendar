import { useState, type CSSProperties } from 'react';
import { Alert, Button, Input, Typography } from 'antd';
import { CalendarOutlined, LockOutlined } from '@ant-design/icons';
import { supabase } from './supabaseClient';
import { useIsMobile } from './useIsMobile';

const { Title, Text } = Typography;

export default function ResetPassword({ onDone }: { onDone: () => void }) {
  const isMobile = useIsMobile();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field: CSSProperties = { height: isMobile ? 52 : 66, fontSize: isMobile ? 16 : 19, borderRadius: isMobile ? 12 : 16 };

  const submit = async () => {
    setError(null);
    if (password !== confirm) { setError('Lösenorden matchar inte.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(error.message);
    else onDone();
  };

  return (
    <div style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      background: 'linear-gradient(135deg, #13c2c2 0%, #1677ff 100%)',
    }}>
      <div style={{ position: 'absolute', top: -120, left: -120, width: 380, height: 380, borderRadius: '50%', background: 'rgba(255,255,255,.12)', filter: 'blur(8px)' }} />
      <div style={{ position: 'absolute', bottom: -140, right: -100, width: 420, height: 420, borderRadius: '50%', background: 'rgba(255,255,255,.10)', filter: 'blur(8px)' }} />

      <style>{`
        .reset-card input::placeholder { color: #262626; }
        .reset-card .ant-input-password-icon { color: #262626; }
        .reset-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(22,119,255,.35) !important; }
        .reset-primary { transition: transform .15s ease, box-shadow .15s ease; }
      `}</style>

      <div className="reset-card" style={{
        position: 'relative', width: '100%', maxWidth: 660,
        background: '#fff', borderRadius: isMobile ? 24 : 32,
        padding: isMobile ? '40px 24px' : '72px 68px',
        boxShadow: '0 32px 80px rgba(0,0,0,.26)',
      }}>
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
            Nytt lösenord
          </Title>
          <Text type="secondary" style={{ fontSize: isMobile ? 16 : 21 }}>
            Välj ett nytt lösenord för ditt konto
          </Text>
        </div>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16, borderRadius: 12 }} />}

        <Input.Password
          size="large"
          variant="filled"
          prefix={<LockOutlined style={{ color: '#262626' }} />}
          placeholder="Nytt lösenord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...field, marginBottom: 14 }}
          autoComplete="new-password"
        />
        <Input.Password
          size="large"
          variant="filled"
          prefix={<LockOutlined style={{ color: '#262626' }} />}
          placeholder="Bekräfta lösenord"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onPressEnter={submit}
          style={{ ...field, marginBottom: 24 }}
          autoComplete="new-password"
        />

        <Button
          className="reset-primary"
          type="primary" size="large" block loading={loading}
          onClick={submit} disabled={!password || !confirm}
          style={{
            height: isMobile ? 52 : 66, fontSize: isMobile ? 17 : 21, fontWeight: 700,
            borderRadius: isMobile ? 12 : 16, border: 'none',
            color: '#000',
            background: 'linear-gradient(135deg, #13c2c2 0%, #1677ff 100%)',
            boxShadow: '0 4px 14px rgba(22,119,255,.3)',
          }}
        >
          Spara lösenord
        </Button>
      </div>
    </div>
  );
}
