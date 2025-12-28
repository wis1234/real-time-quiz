import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import './CandidateDashboard.css'

const CandidateDashboard = () => {
  const [candidateInfo, setCandidateInfo] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [canAttempt, setCanAttempt] = useState(true)
  const [attemptsInfo, setAttemptsInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const candidateId = localStorage.getItem('candidateId')
  const candidateName = localStorage.getItem('candidateName')

  useEffect(() => {
    if (!candidateId) {
      navigate('/login')
      return
    }
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Charger les infos du candidat
      const infoResponse = await axios.get(`http://localhost:5000/api/candidate/info/${candidateId}`)
      setCandidateInfo(infoResponse.data)

      // Vérifier si le candidat peut faire le quiz
      const attemptResponse = await axios.get(`http://localhost:5000/api/candidate/can-attempt/${candidateId}`)
      setCanAttempt(attemptResponse.data.canAttempt)
      setAttemptsInfo(attemptResponse.data)

      // Charger le classement
      const leaderboardResponse = await axios.get('http://localhost:5000/api/scores/all')
      setLeaderboard(leaderboardResponse.data)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartQuiz = () => {
    if (canAttempt) {
      navigate('/quiz')
    }
  }

  const getRankIcon = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `#${index + 1}`
  }

  const getMyRank = () => {
    if (!candidateInfo) return null
    const sorted = [...leaderboard].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return (a.time_taken || 0) - (b.time_taken || 0)
    })
    return sorted.findIndex(u => u.id === candidateId) + 1
  }

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">⏳</div>
        <p>Chargement...</p>
      </div>
    )
  }

  const myRank = getMyRank()
  const hasCompleted = candidateInfo?.completed_at

  return (
    <div className="candidate-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>👋 Bienvenue, {candidateName || 'Candidat'} !</h1>
          <p>Gérez votre quiz et consultez vos résultats</p>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/login') }} className="logout-btn">
          Déconnexion
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Carte de bienvenue et actions */}
        <motion.div
          className="dashboard-card welcome-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2>🎯 Quiz Disponible</h2>
          {canAttempt ? (
            <>
              <p className="card-description">
                {attemptsInfo?.remainingAttempts === -1 
                  ? 'Vous pouvez passer le quiz autant de fois que vous le souhaitez.'
                  : `Il vous reste ${attemptsInfo?.remainingAttempts || 0} tentative(s).`
                }
              </p>
              <motion.button
                className="start-quiz-btn"
                onClick={handleStartQuiz}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🚀 Commencer le Quiz
              </motion.button>
            </>
          ) : (
            <>
              <p className="card-description error-text">
                ⚠️ Vous avez atteint la limite de {attemptsInfo?.maxAttempts} tentative(s).
                Contactez l'administrateur pour plus d'informations.
              </p>
            </>
          )}
        </motion.div>

        {/* Résultats précédents */}
        {hasCompleted && (
          <motion.div
            className="dashboard-card results-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2>📊 Vos Résultats</h2>
            <div className="results-display">
              <div className="result-item">
                <span className="result-label">Score</span>
                <span className="result-value">{candidateInfo.score || 0} / {candidateInfo.total_questions * 2 || 0}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Pourcentage</span>
                <span className="result-value percentage">{parseFloat(candidateInfo.percentage || 0).toFixed(1)}%</span>
              </div>
              <div className="result-item">
                <span className="result-label">Temps</span>
                <span className="result-value">{formatTime(candidateInfo.time_taken)}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Classement</span>
                <span className="result-value rank">{myRank ? getRankIcon(myRank - 1) : 'N/A'}</span>
              </div>
            </div>
            <button
              className="view-details-btn"
              onClick={() => navigate(`/results/${candidateId}`)}
            >
              Voir les détails
            </button>
          </motion.div>
        )}

        {/* Classement */}
        <motion.div
          className="dashboard-card leaderboard-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2>🏆 Classement Général</h2>
          <div className="leaderboard-mini">
            {leaderboard.filter(u => !u.is_admin || u.is_admin !== 1).slice(0, 10).map((user, index) => {
              const isMe = user.id === candidateId
              return (
                <div
                  key={user.id}
                  className={`leaderboard-item ${isMe ? 'my-rank' : ''}`}
                >
                  <span className="rank-badge">{getRankIcon(index)}</span>
                  <span className="user-name">{user.name}</span>
                  <span className="user-score">{parseFloat(user.percentage || 0).toFixed(1)}%</span>
                </div>
              )
            })}
          </div>
          <button
            className="view-full-btn"
            onClick={() => navigate('/leaderboard')}
          >
            Voir le classement complet
          </button>
        </motion.div>

        {/* Statistiques */}
        <motion.div
          className="dashboard-card stats-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2>📈 Statistiques</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <span className="stat-label">Tentatives</span>
                <span className="stat-value">
                  {attemptsInfo?.attemptsCount || 0}
                  {attemptsInfo?.maxAttempts !== -1 && ` / ${attemptsInfo?.maxAttempts}`}
                </span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">📝</div>
              <div className="stat-info">
                <span className="stat-label">Questions</span>
                <span className="stat-value">{candidateInfo?.total_questions || 0}</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">⏱️</div>
              <div className="stat-info">
                <span className="stat-label">Temps moyen</span>
                <span className="stat-value">{formatTime(candidateInfo?.time_taken)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default CandidateDashboard

