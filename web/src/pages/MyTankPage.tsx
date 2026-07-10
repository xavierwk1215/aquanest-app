import { useState } from 'react';
import { signInWithEmail, signOut, useAuth } from '../hooks/useAuth';

export function MyTankPage() {
  const { user, loading, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
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
          내 어항 정보는 계정별로 저장됩니다. 이메일로 받는 매직 링크로 로그인하세요.
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
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#06201c', cursor: 'pointer' }}
          >
            로그인 링크 보내기
          </button>
        </form>
        {sent && <p className="state-msg" style={{ padding: '12px 0 0', textAlign: 'left' }}>이메일로 로그인 링크를 보냈습니다. 받은편지함을 확인하세요.</p>}
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
      <p className="state-msg">어항 목록/수질 기록/리마인더 CRUD는 다음 포팅 단계에서 추가됩니다.</p>
    </div>
  );
}
