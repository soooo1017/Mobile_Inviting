import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cache, type ReactNode } from 'react';
import InvitationView from '../../../components/InvitationView';
import { getPublicInvitation } from '../../../lib/invitation';
import { guestTitle, guestView } from '../../../lib/format';

type Props = { params: Promise<{ slug: string }> };

// 링크마다 서버에서 그때그때 읽어요(공유를 멈추거나 고치면 바로 반영돼야 해서 캐시하지 않아요).
export const dynamic = 'force-dynamic';

// 제목(탭 이름)과 본문이 같은 요청 안에서 서버를 한 번만 부르게 해요.
const load = cache(getPublicInvitation);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const inv = await load(slug);
  return { title: inv.state === 'live' ? guestTitle(inv.event_type, inv.public_meta?.hosts) : '모이소 초대장', robots: { index: false, follow: false } };
}

function Message({ title, sub }: { title: string; sub?: string }): ReactNode {
  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, textAlign: 'center' }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>{title}</h1>
      {sub ? <p style={{ margin: 0, color: '#7a7580', fontSize: 14 }}>{sub}</p> : null}
    </main>
  );
}

/**
 * 하객이 초대장 링크(https://도메인/i/<뒷부분>)로 들어오면 보는 페이지.
 *  - 없는 주소 · 아직 작성 중인 주소 → 서비스 첫 화면(/)으로 보내요(둘을 구분해서 보여주지 않아요).
 *  - 공유 중 → 행사 날까지는 초대장, 행사 다음 날부터는 감사페이지(쓰기로 했을 때), 그 기간이 끝나면 "행사가 끝난 초대장이에요".
 *  - 공유가 끝난 초대장 → 안내
 */
export default async function InvitationPage({ params }: Props) {
  const { slug } = await params;
  const inv = await load(slug);

  if (inv.state === 'preparing') redirect('/');
  if (inv.state === 'stopped') return <Message title="공유가 끝난 초대장이에요" />;
  if (inv.state === 'ended') return <Message title="행사가 끝난 초대장이에요" />;
  if (inv.state === 'error') return <Message title="잠시 후 다시 열어주세요" sub="초대장을 불러오지 못했어요." />;

  const now = new Date();
  const view = guestView(inv.event_at, inv.thanks, now);
  if (view === 'ended') return <Message title="행사가 끝난 초대장이에요" />;
  return <InvitationView slug={slug.toLowerCase()} inv={inv} nowIso={now.toISOString()} view={view} />;
}
