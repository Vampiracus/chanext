import styles from './loader.module.css';

export default function Loader() {
    return (
        <> Загрузка
        <span className={styles.loader}></span>
        </>
    )
}