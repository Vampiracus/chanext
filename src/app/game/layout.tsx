import Paper from "@/components/Paper/Paper";
import styles from './GamePage.module.css'

export default function gameLayout({ children } : { children: React.ReactNode }) {
  const className = (...args: string[]) => {
    return args.join(' ')
  }
  return (
    <Paper class={styles.game} outerClass={styles.game__outer}>
      <h1>Шашки Чапаева</h1>
      <a href='/' style={{textDecoration: 'underline'}}>На главную</a>
      <div className={styles.game_area}>
        {children}
      </div>
    </Paper>
  )
}