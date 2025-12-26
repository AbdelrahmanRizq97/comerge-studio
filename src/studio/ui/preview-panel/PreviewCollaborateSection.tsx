import * as React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { Send } from 'lucide-react-native';

import type { MergeRequest } from '../../../data/merge-requests/types';
import type { UserStats } from '../../../data/users/types';
import { MergeRequestStatusCard } from '../../../components/merge-requests/MergeRequestStatusCard';
import { ReviewMergeRequestCarousel } from '../../../components/merge-requests/ReviewMergeRequestCarousel';
import { Text } from '../../../components/primitives/Text';
import { withAlpha } from '../../../components/utils/color';
import { useTheme } from '../../../theme';
import { PressableCardRow } from './PressableCardRow';
import { SectionTitle } from './SectionTitle';

import MergeSvg from '../../../assets/images/merge.svg';

export type PreviewCollaborateSectionProps = {
  canSubmitMergeRequest: boolean;
  incomingMergeRequests: MergeRequest[];
  outgoingMergeRequests: MergeRequest[];
  creatorStatsById: Record<string, UserStats>;
  processingMrId?: string | null;
  isBuildingMrTest?: boolean;
  testingMrId?: string | null;
  toMergeRequestSummary: (mr: MergeRequest) => import('../../../components/models/types').MergeRequestSummary;
  onSubmitMergeRequest?: () => void | Promise<void>;
  onRequestApprove?: (mr: MergeRequest) => void;
  onReject?: (mr: MergeRequest) => void | Promise<void>;
  onTestMr?: (mr: MergeRequest) => void | Promise<void>;
};

export function PreviewCollaborateSection({
  canSubmitMergeRequest,
  incomingMergeRequests,
  outgoingMergeRequests,
  creatorStatsById,
  processingMrId,
  isBuildingMrTest,
  testingMrId,
  toMergeRequestSummary,
  onSubmitMergeRequest,
  onRequestApprove,
  onReject,
  onTestMr,
}: PreviewCollaborateSectionProps) {
  const theme = useTheme();
  const [submittingMr, setSubmittingMr] = React.useState(false);

  const hasSection = canSubmitMergeRequest || incomingMergeRequests.length > 0 || outgoingMergeRequests.length > 0;
  if (!hasSection) return null;

  const showActionsSubtitle = (canSubmitMergeRequest && onSubmitMergeRequest) || (onTestMr && incomingMergeRequests.length > 0);

  return (
    <>
      <SectionTitle marginTop={theme.spacing.xl}>Collaborate</SectionTitle>

      {showActionsSubtitle ? (
        <Text
          style={{
            color: withAlpha(theme.colors.textMuted, 0.7),
            fontSize: 10,
            lineHeight: 14,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: theme.spacing.sm,
            fontWeight: theme.typography.fontWeight.semibold,
          }}
        >
          Actions
        </Text>
      ) : null}

      {canSubmitMergeRequest && onSubmitMergeRequest ? (
        <PressableCardRow
          accessibilityLabel="Submit merge request"
          disabled={submittingMr}
          onPress={() => {
            Alert.alert(
              'Submit Merge Request',
              'Are you sure you want to submit your changes to the original app?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Submit',
                  style: 'destructive',
                  onPress: () => {
                    setSubmittingMr(true);
                    Promise.resolve(onSubmitMergeRequest())
                      .catch(() => {})
                      .finally(() => setSubmittingMr(false));
                  },
                },
              ]
            );
          }}
          style={{
            padding: theme.spacing.lg,
            borderRadius: theme.radii.lg,
            backgroundColor: withAlpha(theme.colors.surfaceRaised, 0.5),
            borderWidth: 1,
            borderColor: withAlpha('#03DAC6', 0.2),
            marginBottom: theme.spacing.sm,
          }}
          left={
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: withAlpha('#03DAC6', 0.1),
                marginRight: theme.spacing.lg,
              }}
            >
              {submittingMr ? <ActivityIndicator color="#03DAC6" size="small" /> : <MergeSvg width={20} height={20} color="#03DAC6" />}
            </View>
          }
          title={
            <Text style={{ color: theme.colors.text, fontSize: 16, lineHeight: 20, fontWeight: theme.typography.fontWeight.semibold }}>
              Submit your new changes
            </Text>
          }
          subtitle={
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 16, marginTop: 2 }}>
              Ask to merge this remix to the original app
            </Text>
          }
          right={<Send size={16} color="#03DAC6" />}
        />
      ) : null}

      {onTestMr && incomingMergeRequests.length > 0 ? (
        <ReviewMergeRequestCarousel
          mergeRequests={incomingMergeRequests}
          creatorStatsById={creatorStatsById}
          processingMrId={processingMrId}
          isBuilding={Boolean(isBuildingMrTest)}
          testingMrId={testingMrId}
          onReject={(mr) => (onReject ? onReject(mr) : undefined)}
          onApprove={(mr) => onRequestApprove?.(mr)}
          onTest={(mr) => (onTestMr ? onTestMr(mr) : undefined)}
        />
      ) : null}

      {outgoingMergeRequests.length > 0 ? (
        <>
          <Text
            style={{
              color: withAlpha(theme.colors.textMuted, 0.7),
              fontSize: 10,
              lineHeight: 14,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginTop: theme.spacing.lg,
              marginBottom: theme.spacing.sm,
              fontWeight: theme.typography.fontWeight.semibold,
            }}
          >
            History
          </Text>
          {outgoingMergeRequests.map((mr) => (
            <View key={mr.id} style={{ marginBottom: theme.spacing.sm }}>
              <MergeRequestStatusCard mergeRequest={toMergeRequestSummary(mr)} />
            </View>
          ))}
        </>
      ) : null}
    </>
  );
}


