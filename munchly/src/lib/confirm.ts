import { Alert, Platform } from 'react-native';

export interface DialogRequest {
  title: string;
  message: string;
  /** Label of the main button. Omit for a plain "OK" notice. */
  confirmLabel?: string;
  destructive?: boolean;
  resolve: (confirmed: boolean) => void;
}

/**
 * On web, dialogs are drawn inside the app by <DialogHost /> because browsers block or hide
 * window.confirm/alert inside embedded pages. Android and iOS use the native Alert.
 */
let presenter: ((d: DialogRequest) => void) | null = null;

export function setDialogPresenter(fn: ((d: DialogRequest) => void) | null) {
  presenter = fn;
}

/** Yes/no dialog that works on Android, iOS and web. */
export function confirm(title: string, message: string, confirmLabel = 'Delete'): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      if (presenter) presenter({ title, message, confirmLabel, destructive: true, resolve });
      else resolve(false);
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    presenter?.({ title, message, resolve: () => {} });
    return;
  }
  Alert.alert(title, message);
}
