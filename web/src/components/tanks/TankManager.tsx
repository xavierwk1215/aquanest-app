import { useCallback, useEffect, useState } from 'react';
import type { ReferenceData } from '../../lib/referenceData';
import { listTanks } from '../../lib/tanks';
import type { Tank } from '../../lib/types';
import { TankDetail } from './TankDetail';
import { TankForm } from './TankForm';
import { TankList } from './TankList';

type View = { mode: 'list' } | { mode: 'form'; editId?: string } | { mode: 'detail'; id: string };

export function TankManager({ userId, referenceData }: { userId: string; referenceData: ReferenceData }) {
  const [tanks, setTanks] = useState<Tank[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ mode: 'list' });

  const refresh = useCallback(() => {
    listTanks()
      .then(setTanks)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (error) return <p className="state-msg error">어항 데이터를 불러오지 못했습니다: {error}</p>;
  if (!tanks) return <p className="state-msg">불러오는 중...</p>;

  if (view.mode === 'form') {
    const existing = view.editId ? tanks.find((t) => t.id === view.editId) ?? null : null;
    return (
      <TankForm
        userId={userId}
        existing={existing}
        referenceData={referenceData}
        onDone={() => {
          refresh();
          setView({ mode: 'list' });
        }}
        onCancel={() => setView({ mode: 'list' })}
      />
    );
  }

  if (view.mode === 'detail') {
    const tank = tanks.find((t) => t.id === view.id);
    if (!tank) {
      setView({ mode: 'list' });
      return null;
    }
    return (
      <TankDetail
        tank={tank}
        referenceData={referenceData}
        onBack={() => setView({ mode: 'list' })}
        onEdit={() => setView({ mode: 'form', editId: tank.id })}
      />
    );
  }

  return (
    <TankList
      tanks={tanks}
      onAdd={() => setView({ mode: 'form' })}
      onOpen={(id) => setView({ mode: 'detail', id })}
    />
  );
}
