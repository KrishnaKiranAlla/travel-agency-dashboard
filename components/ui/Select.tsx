import styles from './Select.module.css';

interface Option {
    label: string;
    value: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: Option[];
    error?: string;
}

export function Select({ label, options, error, className = '', ...props }: SelectProps) {
    return (
        <div className={styles.wrapper}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.selectWrapper}>
                <select
                    className={`${styles.select} ${error ? styles.hasError : ''} ${className}`}
                    {...props}
                >
                    <option value="" disabled>Select option</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
            {error && <span className={styles.error}>{error}</span>}
        </div>
    );
}
