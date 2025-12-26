export type MergeRequestStatusDisplay = {
  text: string;
  color: string;
};

export function getMergeRequestStatusDisplay(status: string): MergeRequestStatusDisplay {
  switch (status) {
    case 'open':
      return { text: 'Merge request is pending approval', color: '#FACC15' };
    case 'approved':
      return { text: 'Merge approved', color: '#10B981' };
    case 'rejected':
      return { text: 'Merge request rejected', color: '#F43F5E' };
    case 'merged':
      return { text: 'Your edit was merged to the original app', color: '#10B981' };
    case 'closed':
      return { text: 'Merge closed', color: '#10B981' };
    default:
      return { text: status, color: '#898994' };
  }
}


