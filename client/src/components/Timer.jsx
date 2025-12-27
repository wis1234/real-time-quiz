import React from 'react'
import { motion } from 'framer-motion'
import './Timer.css'

const Timer = ({ timeElapsed }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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
      >
        {formatTime(timeElapsed)}
      </motion.div>
    </motion.div>
  )
}

export default Timer


