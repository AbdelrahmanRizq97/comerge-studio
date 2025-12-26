import * as React from 'react';

export function useControlledExpansion(props: { expanded?: boolean; onExpandedChange?: (expanded: boolean) => void }) {
  const [uncontrolled, setUncontrolled] = React.useState(false);
  const expanded = props.expanded ?? uncontrolled;
  const setExpanded = React.useCallback(
    (next: boolean) => {
      props.onExpandedChange?.(next);
      if (props.expanded === undefined) setUncontrolled(next);
    },
    [props]
  );
  return { expanded, setExpanded };
}


