import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Project } from '../types/project';

function daysFromNow(days: number, hh: number, mm: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

function daysAgoUpdated(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// No backend yet — a representative mock set covering every status
// (draft/shared/thanks/past) and both thanks-banner cases, so the list,
// filters, and sort all have something real to work on.
const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: '윤하람 첫 생일',
    eventType: 'first_birthday',
    hosts: [{ label: '아이', name: '윤하람' }],
    eventAt: daysFromNow(5, 18, 0),
    venue: { name: '분당 라포레웨딩', address: '경기 성남시 분당구', sido: '경기', mapLinks: { naver: true, kakao: false } },
    thanks: { enabled: true, days: 7, hasContent: false },
    shared: true,
    themeId: 'garden',
    updatedAt: daysAgoUpdated(0),
    createdAt: daysAgoUpdated(20),
    counts: { rsvp: 21, guestbook: 4 },
  },
  {
    id: 'p2',
    title: '박서준 · 최유나',
    eventType: 'wedding',
    hosts: [{ label: '신랑', name: '박서준' }, { label: '신부', name: '최유나' }],
    eventAt: daysFromNow(3, 12, 0),
    venue: { name: '더채플앳청담', address: '서울 강남구 청담동', sido: '서울', mapLinks: { naver: true, kakao: true } },
    thanks: { enabled: true, days: 7, hasContent: true },
    shared: true,
    themeId: 'blush',
    updatedAt: daysAgoUpdated(1),
    createdAt: daysAgoUpdated(40),
    counts: { rsvp: 54, guestbook: 18 },
  },
  {
    id: 'p3',
    title: '카페 온새미 오픈',
    eventType: 'opening',
    hosts: [{ label: '가게', name: '온새미' }, { label: '대표', name: '정하늘' }],
    eventAt: daysFromNow(177, 11, 0),
    venue: { name: '온새미', address: '부산 해운대구 우동', sido: '부산', mapLinks: { naver: false, kakao: false } },
    thanks: { enabled: false, hasContent: false },
    shared: false,
    themeId: 'linen',
    updatedAt: daysAgoUpdated(2),
    createdAt: daysAgoUpdated(2),
    counts: { rsvp: 0, guestbook: 0 },
  },
  {
    id: 'p4',
    title: '김지원 · 이민석',
    eventType: 'wedding',
    hosts: [{ label: '신랑', name: '이민석' }, { label: '신부', name: '김지원' }],
    eventAt: daysFromNow(142, 12, 30),
    venue: { name: '그랜드 하얏트 서울 3F', address: '서울 용산구', sido: '서울', mapLinks: { naver: true, kakao: true } },
    thanks: { enabled: true, days: 7, hasContent: false },
    shared: true,
    themeId: 'linen',
    updatedAt: daysAgoUpdated(3),
    createdAt: daysAgoUpdated(10),
    counts: { rsvp: 3, guestbook: 0 },
  },
  {
    id: 'p5',
    title: '민재 · 수아의 첫 집',
    eventType: 'housewarming',
    hosts: [{ label: '집주인', name: '민재 · 수아' }],
    eventAt: daysFromNow(-2, 17, 0),
    venue: { name: '민재네 집', address: '서울 마포구', sido: '서울', mapLinks: { naver: false, kakao: false } },
    thanks: { enabled: true, days: 7, hasContent: true },
    shared: true,
    themeId: 'sage',
    updatedAt: daysAgoUpdated(5),
    createdAt: daysAgoUpdated(25),
    counts: { rsvp: 30, guestbook: 12 },
  },
  {
    id: 'p6',
    title: '이준호 · 박서연',
    eventType: 'wedding',
    hosts: [{ label: '신랑', name: '이준호' }, { label: '신부', name: '박서연' }],
    eventAt: daysFromNow(-30, 12, 0),
    venue: { name: '대구 인터불고 호텔', address: '대구 수성구', sido: '대구', mapLinks: { naver: true, kakao: false } },
    thanks: { enabled: false, hasContent: false },
    shared: true,
    themeId: 'ink',
    updatedAt: daysAgoUpdated(35),
    createdAt: daysAgoUpdated(60),
    counts: { rsvp: 80, guestbook: 40 },
  },
];

type NewProjectInput = Omit<Project, 'id' | 'updatedAt' | 'createdAt' | 'shared' | 'counts'>;

type ProjectsContextValue = {
  projects: Project[];
  getProject: (id: string) => Project | undefined;
  createProject: (input: NewProjectInput) => Project;
  deleteProject: (id: string) => void;
  setThanksSettings: (id: string, thanks: Project['thanks']) => void;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

let nextId = MOCK_PROJECTS.length + 1;

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);

  const value = useMemo<ProjectsContextValue>(
    () => ({
      projects,
      getProject: (id) => projects.find((p) => p.id === id),
      createProject: (input) => {
        const now = new Date().toISOString();
        const project: Project = {
          ...input,
          id: `p${nextId++}`,
          shared: false,
          counts: { rsvp: 0, guestbook: 0 },
          updatedAt: now,
          createdAt: now,
        };
        setProjects((prev) => [project, ...prev]);
        return project;
      },
      deleteProject: (id) => setProjects((prev) => prev.filter((p) => p.id !== id)),
      setThanksSettings: (id, thanks) =>
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, thanks, updatedAt: new Date().toISOString() } : p))),
    }),
    [projects],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return ctx;
}
