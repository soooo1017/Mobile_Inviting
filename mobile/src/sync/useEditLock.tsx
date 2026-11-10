import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Text, StyleSheet } from 'react-native';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { color } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { useSync } from './SyncProvider';

/**
 * 편집 잠금 — 한 초대장은 한 번에 한 기기에서만 고쳐요(두 폰의 내용이 섞이는 일을 아예 없애려고).
 *  - editing: 이 기기가 편집권을 가졌어요(앱이 켜져 있는 동안 20초마다 유지, 앱을 나가면 풀어요).
 *  - busy: 다른 기기가 편집 중이에요 → [여기서 편집하기]로 넘겨받거나 나가요.
 *  - lost: 편집하는 도중에 다른 기기가 넘겨받았어요 → 쌓인 수정은 바로 올리고, 이 기기는 보기만 가능해요.
 *  - taking: 넘겨받는 중 — 이전 기기가 마지막 수정을 올릴 시간을 주고 서버의 최신 내용을 가져와요.
 * 서버에 아직 안 올라간 새 초대장이나 인터넷이 없을 때는 막지 않고 그대로 고칠 수 있어요(서버의 수정 번호 검사가 마지막 안전장치예요).
 */

type Status = 'checking' | 'editing' | 'busy' | 'lost' | 'taking';

const BEAT_MS = 20000;
/** 넘겨받은 뒤 이전 기기의 마지막 수정(최대 2초 뒤 저장)이 서버에 닿을 때까지 기다려요. */
const TAKEOVER_WAIT_MS = 3000;

export function useEditLock(projectId: string) {
  const { claimEdit, releaseEdit, pullProject, flush } = useSync();
  const [status, setStatus] = useState<Status>('checking');
  const [other, setOther] = useState('다른 기기');
  const statusRef = useRef<Status>('checking');
  const beat = useRef<ReturnType<typeof setInterval> | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    statusRef.current = status;
  });

  const stopBeat = useCallback(() => {
    if (beat.current) clearInterval(beat.current);
    beat.current = null;
  }, []);

  /** 다른 기기가 넘겨받은 걸 알았을 때. */
  const markLost = useCallback(
    (device: string) => {
      if (statusRef.current !== 'editing') return;
      stopBeat();
      setOther(device);
      setStatus('lost');
      flush(); // 쌓인 수정을 지금 바로 올려요
    },
    [flush, stopBeat],
  );

  const startBeat = useCallback(() => {
    stopBeat();
    beat.current = setInterval(() => {
      void claimEdit(projectId, false).then((res) => {
        if (alive.current && res.kind === 'busy') markLost(res.device);
      });
    }, BEAT_MS);
  }, [claimEdit, markLost, projectId, stopBeat]);

  // 에디터를 열면 편집권을 잡아요.
  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    void claimEdit(projectId, false).then((res) => {
      if (cancelled) return;
      if (res.kind === 'busy') {
        setOther(res.device);
        setStatus('busy');
        return;
      }
      setStatus('editing');
      statusRef.current = 'editing';
      startBeat();
    });
    return () => {
      cancelled = true;
      alive.current = false;
      stopBeat();
      if (statusRef.current === 'editing') releaseEdit(projectId);
    };
  }, [claimEdit, releaseEdit, projectId, startBeat, stopBeat]);

  // 앱이 백그라운드로 가면 편집권을 풀고, 돌아오면 다시 잡아요(그 사이 다른 기기가 가져갔으면 알려요).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (statusRef.current !== 'editing') return;
      if (next === 'background' || next === 'inactive') {
        stopBeat();
        flush();
        releaseEdit(projectId);
      } else if (next === 'active') {
        void claimEdit(projectId, false).then((res) => {
          if (!alive.current) return;
          if (res.kind === 'busy') markLost(res.device);
          else startBeat();
        });
      }
    });
    return () => sub.remove();
  }, [claimEdit, flush, markLost, projectId, releaseEdit, startBeat, stopBeat]);

  /** [여기서 편집하기] / [다시 편집하기] */
  const takeOver = useCallback(async () => {
    setStatus('taking');
    statusRef.current = 'taking';
    const res = await claimEdit(projectId, true);
    if (!alive.current) return;
    if (res.kind === 'ok') {
      await new Promise((resolve) => setTimeout(resolve, TAKEOVER_WAIT_MS));
      if (!alive.current) return;
      await pullProject(projectId);
    }
    if (!alive.current) return;
    setStatus('editing');
    statusRef.current = 'editing';
    startBeat();
  }, [claimEdit, projectId, pullProject, startBeat]);

  return { status, other, takeOver };
}

/** 편집권이 없을 때 에디터 위에 뜨는 안내 — 바깥을 눌러도 닫히지 않아요(나가기 · 넘겨받기 중 하나를 골라야 해요). */
export function EditLockDialog({ lock, onExit }: { lock: ReturnType<typeof useEditLock>; onExit: () => void }) {
  const { status, other, takeOver } = lock;
  const visible = status === 'busy' || status === 'lost' || status === 'taking';
  const lost = status === 'lost';
  return (
    <ConfirmDialog
      visible={visible}
      blocking
      tone="primary"
      title={lost ? '다른 기기에서 편집을 이어가고 있어요' : `${other}에서 편집 중이에요`}
      cancelLabel="나가기"
      confirmLabel={status === 'taking' ? '불러오는 중…' : lost ? '다시 편집하기' : '여기서 편집하기'}
      confirmDisabled={status === 'taking'}
      onCancel={onExit}
      onConfirm={() => void takeOver()}
    >
      <Text style={styles.body}>
        {lost
          ? `${other}에서 이 초대장을 고치고 있어서 여기서는 보기만 할 수 있어요. 다시 편집하면 그 기기가 보기만 가능해져요.`
          : '이 초대장은 한 번에 한 기기에서만 고칠 수 있어요. 여기서 이어서 편집하면 그 기기는 보기만 가능해져요.'}
      </Text>
    </ConfirmDialog>
  );
}

const styles = StyleSheet.create({
  body: { ...textStyle({ size: 'label', weight: 'regular', color: color.ink.secondary }), lineHeight: 21 },
});
