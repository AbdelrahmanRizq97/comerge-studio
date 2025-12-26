import * as React from 'react';
import { View } from 'react-native';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  GitFork,
  GitMerge,
  Pencil,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';

import type { AppStatus } from '../../data/apps/types';
import { APP_STATUS_LABEL } from '../../data/apps/types';
import { Text } from '../primitives/Text';

const STATUS_BG: Record<AppStatus, string> = {
  ready: '#10B981', // emerald-500
  creating: '#3B82F6', // blue-500
  editing: '#F59E0B', // amber-500
  forking: '#8B5CF6', // violet-500
  merging: '#06B6D4', // cyan-500
  error: '#F43F5E', // rose-500
  archived: '#71717A', // zinc-500
};

const STATUS_ICON: Record<AppStatus, LucideIcon> = {
  ready: CheckCircle2,
  creating: Sparkles,
  editing: Pencil,
  forking: GitFork,
  merging: GitMerge,
  error: AlertTriangle,
  archived: Archive,
};

export type PreviewStatusBadgeProps = {
  status: AppStatus;
};

export function PreviewStatusBadge({ status }: PreviewStatusBadgeProps) {
  const IconComp = STATUS_ICON[status];
  const label = APP_STATUS_LABEL[status] ?? status;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: STATUS_BG[status],
      }}
    >
      <IconComp size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
      <Text style={{ color: '#FFFFFF', fontSize: 11, lineHeight: 14 }}>{label}</Text>
    </View>
  );
}


