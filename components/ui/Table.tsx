import styles from './Table.module.css';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    actions?: (item: T) => React.ReactNode;
}

export function Table<T extends { id: string }>({ data, columns, actions }: TableProps<T>) {
    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i} className={col.className}>{col.header}</th>
                        ))}
                        {actions && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item) => (
                        <tr key={item.id}>
                            {columns.map((col, i) => (
                                <td key={i} className={col.className} data-label={col.header}>
                                    {typeof col.accessor === 'function'
                                        ? col.accessor(item)
                                        : (item[col.accessor] as React.ReactNode)}
                                </td>
                            ))}
                            {actions && <td className={styles.actions}>{actions(item)}</td>}
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr className={styles.emptyRow}>
                            <td colSpan={columns.length + (actions ? 1 : 0)} className={styles.empty}>
                                No data found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
