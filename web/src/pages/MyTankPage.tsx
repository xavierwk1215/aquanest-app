import { useState } from 'react';
import { TankManager } from '../components/tanks/TankManager';
import { signInWithEmail, signOut, useAuth, verifyEmailOtp } from '../hooks/useAuth';
import { useReferenceData } from '../hooks/useReferenceData';

export function MyTankPage() {
  const { user, loading, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!configured) {
    return (
      <div className="state-msg" style={{ textAlign: 'left' }}>
        <p>
          Supabase 프로젝트가 아직 연결되지 않았습니다. <code>web/.env.example</code>을 <code>web/.env</code>로 복사하고
          Supabase 프로젝트의 URL/anon key를 채운 뒤, <code>supabase/migrations/</code>와{' '}
          <code>supabase/seed/species_seed.sql</code>을 적용하면 로그인 후 내 어항을 관리할 수 있습니다.
        </p>
      </div>
    );
  }

  if (loading) return <p className="state-msg">불러오는 중...</p>;

  if (!user) {
    return (
      <div>
        <p className="state-msg" style={{ padding: 0, textAlign: 'left', marginBottom: 16 }}>
          내 어항 정보는 계정별로 저장됩니다. 이메일로 로그인하세요.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              await signInWithEmail(email);
              setSent(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err));
            }
          }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sent}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          />
          <button
            type="submit"
            disabled={sent}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: sent ? 'var(--surface-2)' : 'var(--teal)',
              color: sent ? 'var(--muted)' : '#06201c',
              cursor: sent ? 'default' : 'pointer',
            }}
          >
            {sent ? '전송됨' : '로그인 메일 보내기'}
          </button>
        </form>

        {sent && (
          <div style={{ marginTop: 16 }}>
            <p className="state-msg" style={{ padding: 0, textAlign: 'left', marginBottom: 8 }}>
              이메일을 확인하세요. <b>링크를 클릭</b>하거나, 메일에 적힌 <b>6자리 코드</b>를 아래에 입력해도 로그인됩니다 (코드 쪽이 더 안정적이에요).
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setVerifying(true);
                try {
                  await verifyEmailOtp(email, code);
                } catch (err) {
                  setError(err instanceof Error ? err.message : String(err));
                } finally {
                  setVerifying(false);
                }
              }}
              style={{ display: 'flex', gap: 8 }}
            >
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="6자리 코드"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  letterSpacing: 4,
                }}
              />
              <button
                type="submit"
                disabled={verifying}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#06201c', cursor: verifying ? 'default' : 'pointer' }}
              >
                코드로 로그인
              </button>
            </form>
          </div>
        )}
        {error && <p className="state-msg error" style={{ padding: '12px 0 0', textAlign: 'left' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <p className="state-msg" style={{ padding: 0, textAlign: 'left', marginBottom: 16 }}>
        {user.email}로 로그인됨.{' '}
        <button onClick={() => signOut()} style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', padding: 0 }}>
          로그아웃
        </button>
      </p>
      <MyTanks userId={user.id} />
    </div>
  );
}

function MyTanks({ userId }: { userId: string }) {
  const { data, loading, error } = useReferenceData();
  if (loading) return <p className="state-msg">불러오는 중...</p>;
  if (error) return <p className="state-msg error">데이터를 불러오지 못했습니다: {error}</p>;
  if (!data) return null;
  return <TankManager userId={userId} referenceData={data} />;
}
