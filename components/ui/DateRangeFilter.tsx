import styles from './DateRangeFilter.module.css';

interface DateRangeFilterProps {
    filterType: 'date' | 'week' | 'month';
    selectedDate: string;
    onFilterTypeChange: (type: 'date' | 'week' | 'month') => void;
    onDateChange: (date: string) => void;
}

export function DateRangeFilter({
    filterType,
    selectedDate,
    onFilterTypeChange,
    onDateChange,
}: DateRangeFilterProps) {
    const getInputType = () => {
        switch (filterType) {
            case 'week':
                return 'week';
            case 'month':
                return 'month';
            default:
                return 'date';
        }
    };

    const getLabel = () => {
        switch (filterType) {
            case 'week':
                return 'Week';
            case 'month':
                return 'Month';
            default:
                return 'Date';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.filterOptions}>
                <label className={styles.filterLabel}>Filter By:</label>
                <div className={styles.buttonGroup}>
                    {(['date', 'week', 'month'] as const).map((type) => (
                        <button
                            key={type}
                            className={`${styles.filterBtn} ${filterType === type ? styles.active : ''}`}
                            onClick={() => onFilterTypeChange(type)}
                        >
                            {type === 'date' ? 'Daily' : type === 'week' ? 'Weekly' : 'Monthly'}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.datePickerWrapper}>
                <label className={styles.dateLabel}>Select {getLabel()}:</label>
                <input
                    type={getInputType()}
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className={styles.datePicker}
                />
            </div>
        </div>
    );
}
