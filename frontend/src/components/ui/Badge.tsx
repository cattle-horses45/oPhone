type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700 border-gray-300',
  success: 'bg-green-50 text-green-700 border-green-300',
  warning: 'bg-orange-50 text-orange-700 border-orange-300',
  danger: 'bg-red-50 text-red-700 border-red-300',
  info: 'bg-blue-50 text-blue-700 border-blue-300',
};

export default function Badge({
  children,
  variant = 'default',
  className = '',
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2 py-0.5 text-xs font-medium
        border rounded-full
        ${variantClasses[variant]}
        ${className}
      `.trim()}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
