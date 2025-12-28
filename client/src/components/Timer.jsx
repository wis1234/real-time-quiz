import React from 'react'
import { motion } from 'framer-motion'
import './Timer.css'

const Timer = ({ timeElapsed, timeLimit, timeRemaining }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeColor = () => {
    if (timeLimit > 0 && timeRemaining !== undefined) {
      if (timeRemaining <= 60) return '#ef4444'
      if (timeRemaining <= 300) return '#fbbf24'
    }
    return '#00b4d8'
  }

  return (
    <motion.div
      className="timer-container"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <div className="timer-icon">⏱️</div>
      <motion.div
        className="timer-display"
        key={timeElapsed}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{ color: getTimeColor() }}
      >
        {formatTime(timeElapsed)}
      </motion.div>
      {timeLimit > 0 && timeRemaining !== undefined && (
        <div className="time-limit-info">
          Limite: {formatTime(timeLimit)} | Restant: {formatTime(Math.max(0, timeRemaining))}
        </div>
      )}
    </motion.div>
  )
}

export default Timer
