import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1>
        Шашки Чапаева
      </h1>
      <br/>
      <a href='/game'> Играть! </a>
      <a href='/game?bot=1'> Играть с ботом! </a>
    </main>
  );
}
