'use client'

import { useEffect, useRef, useState } from 'react'
import { GameEngine } from './Engine'
import styles from './GamePage.module.css'
import { redirect } from 'next/navigation'
import Loader from './loading'

const enum Status {
  start = 'loading',
  gameOver = 'finished',
  run = 'running',
}

const Game = () => {
  const [gameStatus, setGameStatus] = useState(Status.start)
  const score = useRef(0)
  const [isLoading, setIsLoading] = useState(true)
  
  const stopLoading = () => {
    setIsLoading(false)
  }
  useEffect(stopLoading)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine>(null)

  const gameStart = () => {
    const gameEngine = engineRef.current
    if (!gameEngine) {
      throw new Error('Игра еще не инициализирована')
    }
    score.current = 0
    setGameStatus(Status.run)

    gameEngine.start()
  }

  useEffect(() => {
    const { current: canvasNode } = canvasRef
    if (!canvasNode) {
      throw new Error('Could not get canvas node')
    }
    const ctx = canvasNode.getContext('2d')
    if (ctx == null) {
      throw new Error('Could not get 2d context')
    }
    if (!engineRef.current) {
      const gameEngine = new GameEngine({
        ctx,
        ref: canvasNode,
        onScoreUpdate: newScore => (score.current = newScore),
        onGameOver(newScore) {
          setGameStatus(Status.gameOver)
          score.current = newScore
          if (
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification('Игра окончена!')
          }
        },
      })
      ;(engineRef.current as null | GameEngine) = gameEngine
      gameEngine.init()
      gameStart()
    }
  }, [])

  const className = (...args: string[]) => {
    return args.join(' ')
  }

  if (gameStatus == Status.gameOver) return (
    redirect('/')
  )
  
  return (
    <>
      <div className={className(styles.game_score, styles['score-text'])}>
        {`Статус игры: ${gameStatus}`}
      </div>
      <canvas ref={canvasRef} style={isLoading ? { display: 'none'} : {}}/>
      {
        isLoading
        ? <Loader />
        : ''
      }
    </>
  )
}

export default Game
