import { useCallback, useEffect, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';
import type { ClipRange } from './bgm';

/**
 * 배경음악 재생기 — 정한 구간(start ~ end)만 반복해서 재생하고, 속도(음높이는 그대로)를 적용해요.
 * 구간 끝은 재생 위치를 0.1초마다 확인해서 시작으로 되돌려요(구간을 정하지 않았으면 플레이어의 끝에서 처음으로).
 */
export function useClipPlayer(source: AudioSource | null, clip: ClipRange) {
  const player = useAudioPlayer(source, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const duration = status.duration > 0 ? status.duration : 0;
  const end = clip.end != null ? (duration ? Math.min(clip.end, duration) : clip.end) : duration;

  const live = useRef({ start: clip.start, end, speed: clip.speed });
  useEffect(() => {
    live.current = { start: clip.start, end, speed: clip.speed };
  });

  useEffect(() => {
    // 미리 듣기 should be audible even with the iPhone's silent switch on.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      player.setPlaybackRate(clip.speed, 'high'); // 'high' = 음높이를 그대로 유지하는 보정
    } catch {
      // 소리가 아직 불러와지지 않았으면 다음에 다시 적용돼요.
    }
  }, [player, clip.speed, status.isLoaded]);

  const playing = status.playing;
  const position = status.currentTime;
  useEffect(() => {
    // 구간 끝에 닿으면 시작으로.
    if (playing && end > 0 && position >= end - 0.05) player.seekTo(clip.start).catch(() => {});
  }, [playing, position, end, clip.start, player]);

  const finished = status.didJustFinish;
  useEffect(() => {
    // 곡이 끝까지 가면(구간 끝 = 곡 끝) 처음 위치부터 다시.
    if (finished)
      player
        .seekTo(live.current.start)
        .then(() => player.play())
        .catch(() => {});
  }, [finished, player]);

  const play = useCallback(
    async (from?: number) => {
      const c = live.current;
      const now = player.currentTime;
      const target = from ?? (now < c.start || (c.end > 0 && now >= c.end) ? c.start : undefined);
      try {
        if (target != null) await player.seekTo(target);
        player.setPlaybackRate(c.speed, 'high');
      } catch {
        // 불러오는 중이면 재생만 시도해요.
      }
      player.play();
    },
    [player],
  );

  const pause = useCallback(() => player.pause(), [player]);
  const seek = useCallback((t: number) => player.seekTo(t).catch(() => {}), [player]);

  return { player, status, playing, position, duration, play, pause, seek };
}
