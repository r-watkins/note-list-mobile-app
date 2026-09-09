import { Alert } from 'react-native';

import { type BulkCheckScope } from '@/features/lists/list.repository';
import { bulkSetChecked, getBulkCheckImpact } from '@/features/lists/list.service';
import { runWrite } from '@/lib/errors';

/**
 * Runs check-all/uncheck-all at the given scope, confirming first only when more than
 * BULK_CHECK_CONFIRM_THRESHOLD items would actually change state (spec §5.4). Shared by
 * the list-level and sublist-level overflow menus so the threshold logic lives in one place.
 */
export function confirmedBulkSetChecked(scope: BulkCheckScope, isChecked: boolean): void {
  const impact = getBulkCheckImpact(scope, isChecked);
  const apply = () => runWrite(() => bulkSetChecked(scope, isChecked));

  if (!impact.requiresConfirmation) {
    apply();
    return;
  }

  const verb = isChecked ? 'Check' : 'Uncheck';
  Alert.alert(
    `${verb} all items?`,
    `This will ${verb.toLowerCase()} ${impact.affectedCount} items.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: `${verb} all`, onPress: apply },
    ],
  );
}
