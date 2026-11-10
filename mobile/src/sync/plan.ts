/** 앱을 켜거나 로그인했을 때 폰과 서버를 어떻게 맞출지 정해요 (순수 계산 — 서버를 부르지 않아요). */

export type LocalItem = { id: string; hash: string };
/** 마지막으로 서버와 맞춘 때의 수정 번호와 내용 지문. */
export type MetaEntry = { rev: number; hash: string };
export type MetaMap = Record<string, MetaEntry>;
export type RowLite = { local_id: string; rev: number };

export type BootstrapPlan = {
  /** 서버 내용을 그대로 가져와요 (이 폰에 없거나, 서버가 더 새롭고 이 폰은 안 바뀐 것). */
  adopt: string[];
  /** 이 폰과 서버가 둘 다 바뀐 것 — 이 폰 내용은 복구본으로 남기고 서버 내용을 가져와요. */
  conflict: string[];
  /** 서버에 올려요 (새 초대장 · 이 폰에서 고친 것). */
  push: string[];
  /** 다른 기기에서 지워서 서버에 없어진 것 — 이 폰에서도 지워요. */
  dropLocal: string[];
  /** 이 폰에서 지웠는데 서버에는 아직 남은 것 — 서버에서 지워요. */
  removeRemote: string[];
  inSync: string[];
};

export function planBootstrap(local: LocalItem[], meta: MetaMap, rows: RowLite[], deleted: string[] = []): BootstrapPlan {
  const plan: BootstrapPlan = { adopt: [], conflict: [], push: [], dropLocal: [], removeRemote: [], inSync: [] };
  const localById = new Map(local.map((l) => [l.id, l]));
  const tombstones = new Set(deleted);

  for (const row of rows) {
    const id = row.local_id;
    if (tombstones.has(id)) {
      plan.removeRemote.push(id);
      continue;
    }
    const l = localById.get(id);
    const m = meta[id];
    if (!l) plan.adopt.push(id);
    else if (!m) plan.conflict.push(id);
    else if (row.rev === m.rev) (l.hash === m.hash ? plan.inSync : plan.push).push(id);
    else if (row.rev > m.rev) (l.hash === m.hash ? plan.adopt : plan.conflict).push(id);
    else plan.push.push(id);
  }

  const onServer = new Set(rows.map((r) => r.local_id));
  for (const l of local) {
    if (onServer.has(l.id)) continue;
    // 서버에서 본 적이 있는데 지금은 없다 = 다른 기기에서 지운 것.
    (meta[l.id] ? plan.dropLocal : plan.push).push(l.id);
  }
  return plan;
}
