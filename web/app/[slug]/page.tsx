import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: '모이소 초대장',
  robots: { index: false, follow: false },
};

/**
 * 하객이 초대장 링크(예: https://도메인/ab12cd34)로 들어오면 보는 페이지.
 * 지금은 서버(Supabase) 연결 전이라 "준비 중" 화면만 보여줘요.
 * 연결하면: slug로 초대장을 불러와 앱 미리보기와 같은 모양으로 그리고,
 * generateMetadata로 카카오톡 링크 미리보기(제목 · 사진)를 만들어요. (docs/SERVER_STORAGE.md §9)
 */
export default async function InvitationPage({ params }: Props) {
  const { slug } = await params;
  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, textAlign: 'center' }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>아직 준비 중인 초대장이에요</h1>
      <p style={{ margin: 0, color: '#7a7580', fontSize: 14 }}>주소: {slug}</p>
    </main>
  );
}
