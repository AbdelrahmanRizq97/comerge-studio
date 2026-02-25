import Svg, { Path, type SvgProps } from 'react-native-svg';

export function RemixUpIcon({ width = 24, height = 24, ...props }: SvgProps) {
  return (
    <Svg viewBox="0 0 70 49" width={width} height={height} fill="none" {...props}>
      <Path
        d="M34.706 7.62939e-05L34.7656 2.28882e-05L21.44 13.2661L0 34.8401L13.266 48.1061L34.706 26.5321L21.44 13.2661L34.706 7.62939e-05Z"
        fill="#00CBC0"
      />
      <Path
        d="M47.972 13.266L34.7656 2.28882e-05L34.706 7.62939e-05L47.972 13.266L34.706 26.5321L56.28 48.106L69.546 34.84L47.972 13.266Z"
        fill="#FF1820"
      />
      <Path
        d="M34.7656 2.28882e-05L21.44 13.2661L34.706 26.5321L47.972 13.266L34.7656 2.28882e-05Z"
        fill="#00322A"
      />
    </Svg>
  );
}
