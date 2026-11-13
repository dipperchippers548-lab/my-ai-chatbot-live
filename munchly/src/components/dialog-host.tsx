import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { type DialogRequest, setDialogPresenter } from '@/lib/confirm';
import { radius, space, useColors } from '@/lib/theme';

import { Button, T } from './ui';

/** Draws confirm/notice dialogs inside the app on web. Mounted once in the root layout. */
export function DialogHost() {
  const c = useColors();
  const [dialog, setDialog] = useState<DialogRequest | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    setDialogPresenter(setDialog);
    return () => setDialogPresenter(null);
  }, []);

  if (!dialog) return null;

  const close = (confirmed: boolean) => {
    dialog.resolve(confirmed);
    setDialog(null);
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => close(false)}>
      <Pressable style={styles.backdrop} onPress={() => close(false)} accessibilityLabel="Close dialog">
        <Pressable style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]} onPress={() => {}}>
          <View accessibilityRole="alert" style={styles.text}>
            <T variant="heading">{dialog.title}</T>
            <T variant="muted">{dialog.message}</T>
          </View>
          {dialog.confirmLabel ? (
            <View style={styles.buttons}>
              <Button testID="dialog-confirm" title={dialog.confirmLabel} variant={dialog.destructive ? 'danger' : 'primary'} onPress={() => close(true)} />
              <Button testID="dialog-cancel" title="Cancel" variant="secondary" onPress={() => close(false)} />
            </View>
          ) : (
            <Button testID="dialog-ok" title="OK" onPress={() => close(true)} />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,12,6,0.55)', alignItems: 'center', justifyContent: 'center', padding: space.xl },
  card: { width: '100%', maxWidth: 380, borderRadius: radius.lg, borderWidth: 1, padding: space.xl, gap: space.lg },
  text: { gap: space.sm },
  buttons: { gap: space.sm },
});
