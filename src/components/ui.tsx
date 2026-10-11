import { Image } from 'expo-image';
import { router } from 'expo-router';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { fileUrl } from '@/lib/api';
import { c, font, radius, shadow, tone } from '@/lib/theme';

// ------------------------------------------------------------------ text
type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';
export function T({ w = 'regular', size = 14, color = c.text, style, ...rest }: TextProps & { w?: Weight; size?: number; color?: string }) {
  return <Text {...rest} style={[{ fontFamily: font[w], fontSize: size, color, lineHeight: Math.round(size * 1.35) }, style]} />;
}

export function H({ size = 26, style, ...rest }: TextProps & { size?: number }) {
  return <T w="bold" size={size} style={[{ letterSpacing: -0.4, lineHeight: Math.round(size * 1.15) }, style]} {...rest} />;
}

/** Small-caps section label ("SERVICES AND RATES"). */
export function Kicker({ children, style, right }: { children: ReactNode; style?: StyleProp<ViewStyle>; right?: ReactNode }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 22, marginBottom: 8 }, style]}>
      <T w="heavy" size={11.5} color={c.n600} style={{ letterSpacing: 0.7, textTransform: 'uppercase' }}>
        {children}
      </T>
      {right}
    </View>
  );
}

// ------------------------------------------------------------------ icons
export const ICON = {
  home: 'M3 10.8 12 3.5l9 7.3V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  chat: 'M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-5A8 8 0 1 1 21 12z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 21a7.5 7.5 0 0 1 15 0',
  chart: 'M5 20V10M12 20V4M19 20v-7M3 20h18',
  cal: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
  star: 'M12 3.5 14.6 9l6 .8-4.4 4.2 1.1 5.9L12 17.1 6.7 19.9l1.1-5.9L3.4 9.8 9.4 9z',
  bell: 'M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM20 20l-3.5-3.5',
  filter: 'M3 6h18M6 12h12M10 18h4',
  shield: 'M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5zM9 12l2 2 4-4',
  tag: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
  back: 'M15 18l-6-6 6-6',
  send: 'M4 12 20 4l-4 16-4-7z',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7',
};

export function Icon({ d, size = 22, color = c.text, stroke = 2.6 }: { d: string; size?: number; color?: string; stroke?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} />
    </Svg>
  );
}

// ------------------------------------------------------------------ layout
export function Screen({ children, bg = c.bg, edges = ['top'] as ('top' | 'bottom')[], style }: { children: ReactNode; bg?: string; edges?: ('top' | 'bottom')[]; style?: StyleProp<ViewStyle> }) {
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: bg }, style]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Scroll({ children, style, contentStyle, refreshing, onRefresh }: { children: ReactNode; style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle>; refreshing?: boolean; onRefresh?: () => void }) {
  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={[{ paddingHorizontal: 18, paddingBottom: 28 }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.accent} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function BackButton({ onPress, light }: { onPress?: () => void; light?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      style={({ pressed }) => [styles.round, { backgroundColor: light ? c.n100 : c.n200, opacity: pressed ? 0.7 : 1 }, light && shadow.sm]}
    >
      <Icon d={ICON.back} size={20} />
    </Pressable>
  );
}

/** Header row: back button, title + subtitle, optional right slot. */
export function TopBar({ title, subtitle, back = true, right, large }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode; large?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 }}>
      {back && <BackButton />}
      <View style={{ flex: 1, minWidth: 0 }}>
        {large ? <H size={24}>{title}</H> : <T w="heavy" size={16.5} numberOfLines={1}>{title}</T>}
        {!!subtitle && <T size={12} color={c.n600} numberOfLines={1}>{subtitle}</T>}
      </View>
      {right}
    </View>
  );
}

/** Sticky footer with the primary action, like the design's bottom bars. */
export function Footer({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.footer, { paddingBottom: Math.max(14, insets.bottom + 8) }, style]}>{children}</View>;
}

export function Card({ children, style, onPress, flat }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; flat?: boolean }) {
  const body = [{ backgroundColor: c.n100, borderRadius: radius.md, padding: 14 }, !flat && shadow.sm, style];
  if (!onPress) return <View style={body}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [body, pressed && { transform: [{ scale: 0.985 }], opacity: 0.96 }]}>
      {children}
    </Pressable>
  );
}

export function Row({ k, v, bold, last }: { k: string; v: ReactNode; bold?: boolean; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.divider }}>
      <T size={12.5} color={c.n700}>{k}</T>
      {typeof v === 'string' || typeof v === 'number' ? (
        <T w={bold ? 'heavy' : 'bold'} size={13} style={{ textAlign: 'right', flexShrink: 1 }}>{v}</T>
      ) : (
        v
      )}
    </View>
  );
}

// ------------------------------------------------------------------ buttons & chips
type BtnVariant = 'primary' | 'outline' | 'ghost' | 'dark' | 'green' | 'soft' | 'disabled' | 'white';
const BTN: Record<BtnVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: c.accent, fg: c.a100 },
  outline: { bg: c.n100, fg: c.text, border: c.n400 },
  ghost: { bg: 'transparent', fg: c.a700 },
  dark: { bg: c.n900, fg: '#fff' },
  green: { bg: c.g700, fg: '#fff' },
  soft: { bg: c.a200, fg: c.a800 },
  disabled: { bg: c.n300, fg: c.n600 },
  white: { bg: c.n100, fg: c.text },
};

export function Btn({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  size = 'md',
  style,
  textStyle,
  icon,
}: {
  label: string;
  onPress?: () => void;
  variant?: BtnVariant;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: ReactNode;
}) {
  const v = BTN[disabled ? 'disabled' : variant];
  const pad = size === 'sm' ? 10 : size === 'lg' ? 17 : 14;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading }}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        { backgroundColor: v.bg, borderRadius: radius.pill, paddingVertical: pad, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: v.border ? 1.5 : 0, borderColor: v.border, minHeight: 44 },
        variant === 'primary' && !disabled && shadow.sm,
        pressed && !disabled && { transform: [{ scale: 0.985 }], opacity: 0.92 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : icon}
      {!loading && (
        <T w={variant === 'outline' || variant === 'ghost' ? 'bold' : 'heavy'} size={size === 'sm' ? 13 : 15} color={v.fg} style={textStyle}>
          {label}
        </T>
      )}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, color = 'blue', style }: { label: string; active?: boolean; onPress?: () => void; color?: 'blue' | 'green'; style?: StyleProp<ViewStyle> }) {
  const on = color === 'green' ? c.g700 : c.accent;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 15, borderWidth: 1.5, borderColor: active ? on : c.n300, backgroundColor: active ? on : c.n100 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <T w="bold" size={12.5} color={active ? '#fff' : c.n800}>{label}</T>
    </Pressable>
  );
}

export function Pill({ label, toneKey = 'grey', size = 'md' }: { label: string; toneKey?: string; size?: 'sm' | 'md' }) {
  const t = tone[toneKey] ?? tone.grey;
  return (
    <View style={{ backgroundColor: t.bg, borderRadius: radius.pill, paddingVertical: size === 'sm' ? 4 : 6, paddingHorizontal: size === 'sm' ? 9 : 11, alignSelf: 'flex-start' }}>
      <T w="heavy" size={size === 'sm' ? 10 : 10.5} color={t.fg} style={{ letterSpacing: 0.3 }}>{label}</T>
    </View>
  );
}

export function Tag({ label, green }: { label: string; green?: boolean }) {
  return (
    <View style={{ backgroundColor: green ? c.g100 : c.n100, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start', borderWidth: green ? 0 : 1, borderColor: c.divider }}>
      <T w="semibold" size={11.5} color={green ? c.g800 : c.n800}>{label}</T>
    </View>
  );
}

// ------------------------------------------------------------------ inputs
export function Field({ label, style, multiline, error, ...rest }: TextInputProps & { label?: string; error?: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={style as StyleProp<ViewStyle>}>
      {!!label && <T size={12} color={c.n700} style={{ marginBottom: 5 }}>{label}</T>}
      <TextInput
        placeholderTextColor={c.n500}
        onFocus={(e) => {
          setFocus(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          rest.onBlur?.(e);
        }}
        multiline={multiline}
        {...rest}
        style={[
          {
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: error ? c.danger : focus ? c.accent : c.divider,
            borderRadius: multiline ? radius.md : radius.pill,
            paddingHorizontal: 16,
            paddingVertical: multiline ? 12 : 0,
            minHeight: multiline ? 90 : 48,
            fontFamily: font.regular,
            fontSize: 14.5,
            color: c.text,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
      />
      {!!error && <T size={12} color={c.danger} style={{ marginTop: 4 }}>{error}</T>}
    </View>
  );
}

export function SearchBox({ value, onChangeText, placeholder, autoFocus }: { value: string; onChangeText: (t: string) => void; placeholder: string; autoFocus?: boolean }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.n100, borderRadius: radius.pill, paddingHorizontal: 16, height: 48 }, shadow.sm]}>
      <Icon d={ICON.search} size={18} color={c.n600} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.n600}
        autoFocus={autoFocus}
        style={{ flex: 1, fontFamily: font.regular, fontSize: 14.5, color: c.text, height: '100%' }}
        returnKeyType="search"
      />
    </View>
  );
}

/** −  value  + stepper used for rates. */
export function Stepper({ value, sub, onDown, onUp, size = 'md' }: { value: string; sub?: string; onDown: () => void; onUp: () => void; size?: 'md' | 'lg' }) {
  const btn = (label: string, fn: () => void) => (
    <Pressable onPress={fn} hitSlop={6} style={({ pressed }) => [styles.round, { width: 36, height: 36, backgroundColor: c.n200, opacity: pressed ? 0.6 : 1 }]}>
      <T w="bold" size={19}>{label}</T>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {btn('−', onDown)}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <T w="heavy" size={size === 'lg' ? 24 : 19} color={c.a700}>{value}</T>
        {!!sub && <T size={10.5} color={c.n600}>{sub}</T>}
      </View>
      {btn('+', onUp)}
    </View>
  );
}

export function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: on }} style={{ width: 48, height: 28, borderRadius: 999, backgroundColor: on ? c.g600 : c.n400, padding: 3, alignItems: on ? 'flex-end' : 'flex-start' }}>
      <View style={[{ width: 22, height: 22, borderRadius: 999, backgroundColor: '#fff' }, shadow.sm]} />
    </Pressable>
  );
}

// ------------------------------------------------------------------ images
export function Img({ uri, style, radius: r = 0, fallback = c.n200, children }: { uri?: string | null; style?: StyleProp<ViewStyle>; radius?: number; fallback?: string; children?: ReactNode }) {
  const src = fileUrl(uri);
  return (
    <View style={[{ backgroundColor: fallback, borderRadius: r, overflow: 'hidden' }, style]}>
      {!!src && <Image source={{ uri: src }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />}
      {children}
    </View>
  );
}

export function Avatar({ uri, name, size = 44, rounded = true, bg = c.g300, fg = c.g900 }: { uri?: string | null; name?: string; size?: number; rounded?: boolean; bg?: string; fg?: string }) {
  const r = rounded ? size / 2 : size * 0.3;
  if (uri) return <Img uri={uri} radius={r} style={{ width: size, height: size }} />;
  const ini = (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: r, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <T w="heavy" size={size * 0.34} color={fg}>{ini || '•'}</T>
    </View>
  );
}

// ------------------------------------------------------------------ states
export function Loading({ label }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}>
      <ActivityIndicator color={c.accent} size="large" />
      {!!label && <T color={c.n600}>{label}</T>}
    </View>
  );
}

export function Empty({ glyph = '○', title, line, action, onAction, secondary, onSecondary, tint = c.n200 }: { glyph?: string; title: string; line?: string; action?: string; onAction?: () => void; secondary?: string; onSecondary?: () => void; tint?: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 56, paddingHorizontal: 14 }}>
      <View style={{ width: 82, height: 82, borderRadius: 999, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
        <T size={30}>{glyph}</T>
      </View>
      <H size={21} style={{ marginTop: 18, marginBottom: 6, textAlign: 'center' }}>{title}</H>
      {!!line && <T size={13.5} color={c.n700} style={{ textAlign: 'center', maxWidth: 260, marginBottom: 18 }}>{line}</T>}
      {!!action && <Btn label={action} onPress={onAction} size="sm" style={{ paddingHorizontal: 22 }} />}
      {!!secondary && <Btn label={secondary} onPress={onSecondary} variant="ghost" size="sm" />}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = (error as any)?.message ?? 'Something went wrong';
  return <Empty glyph="⚠" tint={c.a200} title="Could not load this" line={msg} action={onRetry ? 'Retry' : undefined} onAction={onRetry} />;
}

// ------------------------------------------------------------------ sheet
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: c.scrim, justifyContent: 'flex-end' }} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable onPress={() => {}} style={{ backgroundColor: c.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: Math.max(28, insets.bottom + 14) }}>
            {children}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

/** Bottom-sheet confirmation as used for cancel / decline / delete in the design. */
export function ConfirmSheet({
  visible,
  title,
  body,
  confirm,
  cancel = 'Keep it',
  onConfirm,
  onClose,
  danger = 'blue',
  loading,
  children,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirm: string;
  cancel?: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: 'blue' | 'dark';
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <H size={23} style={{ marginBottom: 8 }}>{title}</H>
      <T size={13.5} color={c.n700} style={{ marginBottom: 18, lineHeight: 20 }}>{body}</T>
      {children}
      <Btn label={confirm} onPress={onConfirm} loading={loading} variant={danger === 'dark' ? 'dark' : 'primary'} style={danger === 'blue' ? { backgroundColor: c.a700 } : undefined} />
      <Btn label={cancel} variant="ghost" onPress={onClose} textStyle={{ color: c.text }} />
    </Sheet>
  );
}

// ------------------------------------------------------------------ toast
const ToastCtx = createContext<(text: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState<string | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const show = useCallback(
    (t: string) => {
      setText(t);
      Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setText(null)), 2600);
    },
    [anim],
  );
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {text && (
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 96, backgroundColor: c.n900, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16 },
            shadow.lg,
            { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
          ]}
        >
          <T w="semibold" size={13.5} color="#fff">{text}</T>
        </Animated.View>
      )}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

const styles = StyleSheet.create({
  round: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingTop: 12, paddingHorizontal: 18, backgroundColor: c.n100, borderTopWidth: 1, borderTopColor: c.divider, gap: 9 },
});
