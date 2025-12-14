import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'danger';
    size?: 'sm' | 'md';
    fullWidth?: boolean;
    isLoading?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    isLoading = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const modeClass = styles[variant];
    const sizeClass = styles[size];
    const widthClass = fullWidth ? styles.fullWidth : '';
    const loadingClass = isLoading ? styles.disabled : '';

    return (
        <button
            className={`${styles.button} ${modeClass} ${sizeClass} ${widthClass} ${loadingClass} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? 'Loading...' : children}
        </button>
    );
}
