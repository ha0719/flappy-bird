'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const GAME_WIDTH = 400
const GAME_HEIGHT = 600
const BIRD_WIDTH = 40
const BIRD_HEIGHT = 30
const PIPE_WIDTH = 60
const PIPE_GAP = 200
const GRAVITY = 0.6
const FLAP_STRENGTH = -10
const PIPE_SPEED = 2
const INITIAL_PIPE_SPACE = 300 // 初始管道间隙
const MIN_PIPE_SPACE = 200 // 最小管道间隙
const DIFFICULTY_INCREASE_INTERVAL = 5 // 每得5分增加一次难度

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gameOver, setGameOver] = useState<number | false>(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      setError("Canvas not found")
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setError("Unable to get 2D context")
      return
    }

    let animationFrameId: number
    let bird = { x: 50, y: GAME_HEIGHT / 2, vy: 0 }
    let pipes: { x: number; topHeight: number; bottomHeight: number }[] = []
    let score = 0
    let frameCount = 0

    const calculateDifficulty = (currentScore: number) => {
      const difficulty = Math.floor(currentScore / DIFFICULTY_INCREASE_INTERVAL)
      const pipeSpace = Math.max(INITIAL_PIPE_SPACE - difficulty * 20, MIN_PIPE_SPACE)
      return { pipeSpace }
    }

    const gameLoop = () => {
      try {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

        // Draw background
        ctx.fillStyle = '#87CEEB' // Sky blue
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

        if (gameStarted) {
          // Update bird position
          bird.y += bird.vy
          bird.vy += GRAVITY

          // Draw bird
          ctx.fillStyle = '#FFD700' // Gold
          ctx.fillRect(bird.x, bird.y, BIRD_WIDTH, BIRD_HEIGHT)

          // Generate and draw pipes
          if (frameCount % 100 === 0) {
            const { pipeSpace } = calculateDifficulty(score)
            const availableHeight = GAME_HEIGHT - pipeSpace
            const minHeight = 50
            const maxHeight = availableHeight - minHeight
            const topHeight = Math.random() * maxHeight + minHeight
            pipes.push({ x: GAME_WIDTH, topHeight, bottomHeight: GAME_HEIGHT - topHeight - pipeSpace })
          }

          ctx.fillStyle = '#228B22' // Forest green
          pipes.forEach((pipe, index) => {
            pipe.x -= PIPE_SPEED
            ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight)
            ctx.fillRect(pipe.x, GAME_HEIGHT - pipe.bottomHeight, PIPE_WIDTH, pipe.bottomHeight)

            // Check collision
            if (
              bird.x < pipe.x + PIPE_WIDTH &&
              bird.x + BIRD_WIDTH > pipe.x &&
              (bird.y < pipe.topHeight || bird.y + BIRD_HEIGHT > GAME_HEIGHT - pipe.bottomHeight)
            ) {
              setGameOver(score)
            }

            // Remove off-screen pipes and increase score
            if (pipe.x + PIPE_WIDTH < 0) {
              pipes.splice(index, 1)
              score++
            }
          })

          // Check if bird is out of bounds
          if (bird.y < 0 || bird.y + BIRD_HEIGHT > GAME_HEIGHT) {
            setGameOver(score)
          }

          // Draw score
          ctx.fillStyle = '#FFFFFF' // White
          ctx.font = '24px Arial'
          ctx.fillText(`Score: ${score}`, 10, 30)

          frameCount++
        } else {
          // Draw start screen
          ctx.fillStyle = '#FFFFFF' // White
          ctx.font = '24px Arial'
          ctx.fillText('Click to Start', GAME_WIDTH / 2 - 70, GAME_HEIGHT / 2)
        }

        if (gameOver === false) {
          animationFrameId = requestAnimationFrame(gameLoop)
        }
      } catch (err) {
        console.error("Error in game loop:", err)
        setError(`Game loop error: ${err.message}`)
      }
    }

    const handleClick = () => {
      if (!gameStarted) {
        setGameStarted(true)
      }
      bird.vy = FLAP_STRENGTH
    }

    canvas.addEventListener('click', handleClick)
    gameLoop()

    return () => {
      canvas.removeEventListener('click', handleClick)
      cancelAnimationFrame(animationFrameId)
    }
  }, [gameOver, gameStarted])

  const handleRestart = () => {
    setGameOver(false)
    setGameStarted(false)
    setError(null)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="border border-gray-300 rounded-lg shadow-lg"
      />
      {error && (
        <div className="mt-4 text-red-500">
          Error: {error}
        </div>
      )}
      {typeof gameOver === 'number' && (
        <div className="mt-4 text-center">
          <h2 className="text-2xl font-bold mb-2">游戏结束</h2>
          <p className="mb-4">你的得分: {gameOver}</p>
          <Button onClick={handleRestart} variant="default">重新开始</Button>
        </div>
      )}
      {!gameOver && !gameStarted && (
        <p className="mt-4 text-lg">
          点击画面开始游戏并让小鸟飞翔
        </p>
      )}
    </div>
  )
}

