import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import io from 'socket.io-client'
import './Leaderboard.css'

const socket = io('http://localhost:5000')

const Leaderboard = () => {
  const [scores, setScores] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadScores()
    
    socket.on('scores-updated', () => {
      loadScores()
    })

    return () => {
      socket.off('scores-updated')
    }
  }, [])

  const loadScores = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/scores/all')
      setScores(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error('Erreur lors du chargement du classement:', error)
      setIsLoading(false)
    }
  }

  const getRankIcon = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `#${index + 1}`
  }

  const getRankColor = (index) => {
    if (index === 0) return '#ffd700'
    if (index === 1) return '#c0c0c0'
    if (index === 2) return '#cd7f32'
    return '#667eea'
  }

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (isLoading) {
    return (
      <div className="leaderboard-container">
        <div className="loading">Chargement du classement...</div>
      </div>
    )
  }

  return (
    <div className="leaderboard-container">
      <motion.div
        className="leaderboard-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="leaderboard-header"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1>🏆 Classement</h1>
          <p>Voir les résultats de tous les participants</p>
        </motion.div>

        {scores.length === 0 ? (
          <div className="no-scores">
            <p>Aucun résultat disponible pour le moment</p>
            <motion.button
              className="home-button"
              onClick={() => {
                const candidateId = localStorage.getItem('candidateId')
                if (candidateId) {
                  const isAdmin = localStorage.getItem('isAdmin') === 'true'
                  navigate(isAdmin ? '/admin' : '/dashboard')
                } else {
                  navigate('/')
                }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Commencer un Quiz
            </motion.button>
          </div>
        ) : (
          <div className="scores-list">
            <AnimatePresence>
              {scores.map((score, index) => (
                <motion.div
                  key={score.id}
                  className={`score-item ${index < 3 ? 'top-three' : ''}`}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="rank-badge" style={{ background: getRankColor(index) }}>
                    {getRankIcon(index)}
                  </div>
                  <div className="score-info">
                    <div className="score-name">{score.name || 'Anonyme'}</div>
                    <div className="score-details">
                      <span className="score-email">{score.email || 'Pas d\'email'}</span>
                      <span className="score-time">⏱️ {formatTime(score.time_taken)}</span>
                    </div>
                  </div>
                  <div className="score-stats">
                    <div className="score-percentage">
                      {parseFloat(score.percentage || 0).toFixed(1)}%
                    </div>
                    <div className="score-points">
                      {score.score} / {score.total_questions * 2} pts
                    </div>
                  </div>
                  <motion.div
                    className="score-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${score.percentage || 0}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                    style={{ background: getRankColor(index) }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <motion.div
          className="leaderboard-actions"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            className="action-button"
            onClick={() => {
              const candidateId = localStorage.getItem('candidateId')
              if (candidateId) {
                const isAdmin = localStorage.getItem('isAdmin') === 'true'
                navigate(isAdmin ? '/admin' : '/dashboard')
              } else {
                navigate('/')
              }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Retour à l'accueil
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Leaderboard


