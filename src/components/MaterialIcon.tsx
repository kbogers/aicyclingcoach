interface MaterialIconProps {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function MaterialIcon({ 
  name, 
  size = 24, 
  filled = false, 
  className = '', 
  style = {} 
}: MaterialIconProps) {
  return (
    <span 
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: `${size}px`,
        fontVariationSettings: filled ? '"FILL" 1' : '"FILL" 0',
        userSelect: 'none',
        ...style
      }}
    >
      {name}
    </span>
  );
} 