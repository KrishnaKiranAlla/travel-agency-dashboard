import styles from './Card.module.css';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
    style?: React.CSSProperties;
}

export function Card({ children, className = '', title, action, style }: CardProps) {
    return (
        <div className={`${styles.card} ${className}`} style={style}>
            {(title || action) && (
                <div className={styles.header}>
                    {title && <h3 className={styles.title}>{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className={styles.content}>{children}</div>
        </div>
    );
}
