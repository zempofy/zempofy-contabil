import styles from './UI.module.css';

export function Btn({ children, variant = 'default', size = 'md', loading, ...props }) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${styles[size]}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <div className={styles.fieldWrap}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={`${styles.input} ${error ? styles.inputError : ''}`} {...props} />
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <div className={styles.fieldWrap}>
      {label && <label className={styles.label}>{label}</label>}
      <select className={styles.input} {...props}>{children}</select>
    </div>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <div className={styles.fieldWrap}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea className={`${styles.input} ${styles.textarea}`} {...props} />
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{title}</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Badge({ children, color = 'gray' }) {
  return <span className={`${styles.badge} ${styles['badge_' + color]}`}>{children}</span>;
}

export function Toggle({ on, onClick, disabled }) {
  return (
    <button
      className={`${styles.toggle} ${on ? styles.toggleOn : styles.toggleOff}`}
      onClick={onClick}
      disabled={disabled}
      title={on ? 'Clique para desmarcar' : 'Clique para marcar'}
    />
  );
}
