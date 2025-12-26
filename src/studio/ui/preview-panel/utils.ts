import type { App } from '../../../data/apps/types';

export function formatCount(n: number): string {
  if (n < 10_000) return n.toLocaleString();
  if (n < 1_000_000) return `${Math.floor(n / 1_000)}k`;
  return `${Math.floor(n / 1_000_000)}m`;
}

export function statusDescription(status: App['status'], statusError: string | null): string {
  switch (status) {
    case 'editing':
      return 'Changes are being applied';
    case 'creating':
      return 'Your app is being created';
    case 'forking':
      return 'Creating your copy';
    case 'merging':
      return 'Merging changes from contributor';
    case 'archived':
      return 'This app has been archived';
    case 'error':
      return statusError ?? 'Something went wrong';
    case 'ready':
    default:
      return '';
  }
}


