import { useEffect, useRef, useState } from 'react';
import { BackHandler, Image, Keyboard, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useProjects } from '../state/ProjectsContext';
import { useInvitation } from '../state/InvitationsContext';
import { TextField } from '../components/TextField';
import { DarkToast } from '../editor/ui';
import { coverPhoto } from '../editor/photos';
import { CropScreen } from '../editor/sheets/CropScreen';
import type { Photo } from '../editor/types';
import { saveImageToPhotos, shareImageFile } from '../share/imageOut';
import { SaveDeniedDialog } from '../share/SaveDeniedDialog';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { eventTypeMeta } from '../types/project';
import { ManageHeader, manageStyles } from '../screens/manage/common';
import { buildPosterData, PosterArt, ScaledBox, type PosterData } from './PosterArt';
import { PosterEditor } from './PosterEditor';
import { PhotoChangeSheet } from './PhotoChangeSheet';
import { usePosterDesign } from './storage';
import { exampleMent, MENT_MAX, photoFrame, TEMPLATE_IDS, TEMPLATES, withTemplate, type PosterDesign, type TemplateId } from './model';

type Props = NativeStackScreenProps<RootStackParamList, 'Poster'>;

const STEP_LABEL = ['템플릿', '정보 선택', '마무리'];

/** 홍보물 만들기 (C) — 1 템플릿 → 2 정보 선택 → 3 마무리, 그리고 사진첩 저장 · 다른 앱으로 공유. */
export function PosterScreen({ navigation, route }: Props) {
  const { getProject } = useProjects();
  const project = getProject(route.params.projectId);
  const { invitation } = useInvitation(route.params.projectId);
  const { design, setDesign } = usePosterDesign(route.params.projectId);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [cropping, setCropping] = useState(false);
  const exportRef = useRef<View>(null);

  // 안드로이드 뒤로가기: 단계를 거꾸로.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 1) {
        setStep((s) => (s === 3 ? 2 : 1));
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  if (!project || !design || !invitation) return <SafeAreaView style={manageStyles.screen} />;

  const spec = TEMPLATES[design.template];
  const photo: Photo | undefined = design.photo ?? coverPhoto(invitation);
  const data = buildPosterData(project, design, invitation.font, photo);
  const typeName = project.eventType === 'other' ? project.customTypeName || '기타' : eventTypeMeta(project.eventType).label;

  const goBack = () => {
    if (step > 1) setStep((step - 1) as 1 | 2);
    else navigation.goBack();
  };

  const capture = () => captureRef(exportRef, { format: 'png', quality: 1, result: 'tmpfile', width: spec.out.w, height: spec.out.h });
  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await saveImageToPhotos(await capture());
      if (result === 'saved') setToast('사진첩에 저장했어요');
      else setDenied(true);
    } catch {
      setToast('이미지를 만들지 못했어요');
    } finally {
      setBusy(false);
    }
  };
  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await shareImageFile(await capture());
      if (!ok) setToast('공유창을 열지 못했어요');
    } catch {
      setToast('이미지를 만들지 못했어요');
    } finally {
      setBusy(false);
    }
  };

  const update = (patch: Partial<PosterDesign>) => setDesign({ ...design, ...patch });
  const frame = photoFrame(design);

  return (
    <SafeAreaView style={manageStyles.screen} edges={['top', 'bottom']}>
      <ManageHeader title="홍보물 만들기" onBack={goBack} />
      <Text style={styles.step}>{`${step} / 3 · ${STEP_LABEL[step - 1]}`}</Text>

      {step === 1 ? (
        <TemplateStep design={design} data={data} thumbData={(d) => buildPosterData(project, d, invitation.font, photo)} onPick={(id) => setDesign(withTemplate(design, id))} onNext={() => setStep(2)} />
      ) : step === 2 ? (
        <ScrollView contentContainerStyle={styles.infoBody} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.center}>
            <ScaledBox w={spec.w} h={spec.h} scale={90 / spec.w}>
              <PosterArt design={design} data={data} />
            </ScaledBox>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              초대 멘트 <Text style={styles.fieldSub}>한 줄 · {MENT_MAX}자까지</Text>
            </Text>
            <TextField
              value={design.ment}
              onChangeText={(t) => update({ ment: t.replace(/\n/g, '').slice(0, MENT_MAX) })}
              placeholder={`예) ${exampleMent(typeName)}`}
              maxLength={MENT_MAX}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <Text style={styles.counter}>{`${design.ment.length} / ${MENT_MAX}`}</Text>
          </View>

          <View style={manageStyles.card}>
            <CheckRow label="이름" value={data.names} on={design.show.name} onToggle={() => update({ show: { ...design.show, name: !design.show.name } })} />
            <CheckRow label="일시" value={data.dateText} on={design.show.date} onToggle={() => update({ show: { ...design.show, date: !design.show.date } })} divider />
            <CheckRow
              label="장소"
              value={data.place || '장소가 아직 없어요'}
              on={design.show.place}
              onToggle={() => update({ show: { ...design.show, place: !design.show.place } })}
              divider
              sub={
                data.address
                  ? { label: '주소도 함께', on: design.show.address && design.show.place, onToggle: () => update({ show: { ...design.show, place: true, address: !design.show.address } }) }
                  : undefined
              }
            />
          </View>

          <View style={manageStyles.card}>
            <View style={styles.photoRow}>
              {photo ? <Image source={{ uri: photo.uri }} style={styles.photoThumb} /> : <View style={[styles.photoThumb, styles.photoEmpty]} />}
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>사진</Text>
                <Text style={styles.rowSub}>{photo ? (design.photo ? '직접 고른 사진' : '초대장 대표 사진') : '사진이 없어요 · 바꾸기에서 골라 주세요'}</Text>
              </View>
              <Pressable onPress={() => setPhotoSheet(true)} hitSlop={8}>
                <Text style={styles.link}>바꾸기</Text>
              </Pressable>
            </View>
          </View>
          <Text style={manageStyles.help}>QR 코드는 항상 들어가요.</Text>

          <Pressable onPress={() => setStep(3)} style={styles.next}>
            <Text style={styles.nextLabel}>다음</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <PosterEditor
          design={design}
          setDesign={setDesign}
          data={data}
          busy={busy}
          onChangePhoto={() => setPhotoSheet(true)}
          onSave={save}
          onShare={share}
        />
      )}

      {/* 저장할 때 찍는 깨끗한 원본 크기 홍보물 (화면 밖) */}
      <View ref={exportRef} collapsable={false} pointerEvents="none" style={styles.offscreen}>
        <PosterArt design={design} data={data} />
      </View>

      <PhotoChangeSheet
        visible={photoSheet}
        onClose={() => setPhotoSheet(false)}
        invitation={invitation}
        current={photo}
        onAdjust={() => {
          setPhotoSheet(false);
          if (photo) setTimeout(() => setCropping(true), 250);
        }}
        onPick={(p) => {
          setDesign({ ...design, photo: p, crop: { x: 0, y: 0, scale: 1 } });
          setPhotoSheet(false);
        }}
      />
      {cropping && photo ? (
        <CropScreen
          photo={photo}
          ratio="1:1"
          aspect={frame.w / frame.h}
          crop={design.crop}
          onCancel={() => setCropping(false)}
          onApply={(crop) => {
            setDesign({ ...design, crop });
            setCropping(false);
          }}
        />
      ) : null}
      <SaveDeniedDialog visible={denied} onClose={() => setDenied(false)} />
      <DarkToast message={toast} onHide={() => setToast(null)} bottom={90} />
    </SafeAreaView>
  );
}

function TemplateStep({ design, data, thumbData, onPick, onNext }: { design: PosterDesign; data: PosterData; thumbData: (d: PosterDesign) => PosterData; onPick: (id: TemplateId) => void; onNext: () => void }) {
  const [area, setArea] = useState({ w: 0, h: 0 });
  const spec = TEMPLATES[design.template];
  const scale = area.w > 0 ? Math.min((area.w - space.screenX * 2) / spec.w, area.h / spec.h) : 0;
  return (
    <View style={styles.flex}>
      <View style={styles.previewArea} onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {scale > 0 ? (
          <ScaledBox w={spec.w} h={spec.h} scale={scale}>
            <PosterArt design={design} data={data} />
          </ScaledBox>
        ) : null}
      </View>
      <View style={styles.thumbs}>
        {TEMPLATE_IDS.map((id) => {
          const t = TEMPLATES[id];
          const on = id === design.template;
          const d = withTemplate(design, id);
          const s = 56 / Math.max(t.w, t.h) * 1.15;
          return (
            <Pressable key={id} onPress={() => onPick(id)} style={styles.thumb}>
              <View style={[styles.thumbBox, on && styles.thumbOn]}>
                <ScaledBox w={t.w} h={t.h} scale={s}>
                  <PosterArt design={d} data={thumbData(d)} />
                </ScaledBox>
              </View>
              <Text style={[styles.thumbLabel, on && styles.thumbLabelOn]}>{t.label}</Text>
              <Text style={styles.thumbRatio}>{t.ratio}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={manageStyles.footer}>
        <Pressable onPress={onNext} style={styles.next}>
          <Text style={styles.nextLabel}>다음</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CheckRow({
  label,
  value,
  on,
  onToggle,
  divider,
  sub,
}: {
  label: string;
  value: string;
  on: boolean;
  onToggle: () => void;
  divider?: boolean;
  sub?: { label: string; on: boolean; onToggle: () => void };
}) {
  return (
    <View style={[styles.checkRow, divider && manageStyles.divider]}>
      <Pressable onPress={onToggle} style={styles.checkMain} hitSlop={4}>
        <View style={[styles.box, on && styles.boxOn]}>{on ? <Text style={styles.mark}>✓</Text> : null}</View>
        <View style={styles.flex}>
          <Text style={styles.rowTitle}>{label}</Text>
          <Text style={styles.rowSub} numberOfLines={1}>
            {value}
          </Text>
        </View>
      </Pressable>
      {sub ? (
        <Pressable onPress={sub.onToggle} style={styles.subRow} hitSlop={4}>
          <View style={[styles.boxSm, sub.on && styles.boxOn]}>{sub.on ? <Text style={styles.markSm}>✓</Text> : null}</View>
          <Text style={styles.rowSub}>{sub.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center' },
  step: { ...textStyle({ size: 'small', weight: 'semibold', color: color.accent.base }), paddingHorizontal: space.screenX, paddingBottom: space[3] },
  previewArea: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  thumbs: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: space[4], paddingVertical: space[5], paddingHorizontal: space.screenX },
  thumb: { alignItems: 'center', gap: 3, width: 70 },
  thumbBox: { height: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 6, borderWidth: 2, borderColor: 'transparent', padding: 1 },
  thumbOn: { borderColor: color.accent.base },
  thumbLabel: { ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.secondary }) },
  thumbLabelOn: { color: color.accent.base, fontFamily: 'Pretendard-SemiBold' },
  thumbRatio: { ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.muted }) },
  next: { backgroundColor: color.ink.primary, borderRadius: radius.button, paddingVertical: 14, alignItems: 'center' },
  nextLabel: { ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.onPrimary }) },
  infoBody: { paddingHorizontal: space.screenX, paddingTop: space[4], paddingBottom: space[8], gap: space[5] },
  field: { gap: space[3] },
  fieldLabel: { ...textStyle({ size: 'label', weight: 'medium', color: color.ink.label }) },
  fieldSub: { ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.muted }) },
  counter: { ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.muted }), textAlign: 'right' },
  checkRow: { paddingHorizontal: space[5], paddingVertical: space[4], gap: space[2] },
  checkMain: { flexDirection: 'row', alignItems: 'center', gap: space[5] },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingLeft: 30 + space[2] },
  box: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: color.line.strong, backgroundColor: color.bg.surface, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: color.accent.base, borderColor: color.accent.base },
  mark: { color: '#ffffff', fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
  boxSm: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: color.line.strong, backgroundColor: color.bg.surface, alignItems: 'center', justifyContent: 'center' },
  markSm: { color: '#ffffff', fontSize: 10, fontFamily: 'Pretendard-SemiBold' },
  rowTitle: { ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }) },
  rowSub: { ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }) },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: space[5], padding: space[5] },
  photoThumb: { width: 40, height: 40, borderRadius: 6 },
  photoEmpty: { borderWidth: 1, borderStyle: 'dashed', borderColor: color.line.dashed },
  link: { ...textStyle({ size: 'label', weight: 'semibold', color: color.accent.base }) },
  offscreen: { position: 'absolute', left: -5000, top: 0 },
});
