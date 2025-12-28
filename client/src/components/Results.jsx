import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import './Results.css'

const Results = () => {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [result, setResult] = useState(null)
  const [answerDetails, setAnswerDetails] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Récupérer les détails depuis l'état de navigation ou charger depuis l'API
    if (location.state?.answerDetails) {
      setAnswerDetails(location.state.answerDetails)
    }
    loadResult()
  }, [candidateId, location])

  const loadResult = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/scores/${candidateId}`)
      setResult(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error('Erreur lors du chargement des résultats:', error)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="results-container">
        <div className="loading">Chargement...</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="results-container">
        <p>Résultats non trouvés</p>
      </div>
    )
  }

  const percentage = result.percentage || 0
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getScoreColor = () => {
    if (percentage >= 80) return '#38ef7d'
    if (percentage >= 60) return '#fbbf24'
    return '#ef4444'
  }

  const getScoreMessage = () => {
    if (percentage >= 80) return 'Excellent ! 🎉'
    if (percentage >= 60) return 'Bien joué ! 👍'
    return 'Continuez vos efforts ! 💪'
  }

  const handleGoHome = () => {
    const candidateId = localStorage.getItem('candidateId')
    if (candidateId) {
      const isAdmin = localStorage.getItem('isAdmin') === 'true'
      navigate(isAdmin ? '/admin' : '/dashboard')
    } else {
      navigate('/')
    }
  }

  // Pagination pour les réponses
  const totalPages = Math.ceil(answerDetails.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentAnswers = answerDetails.slice(startIndex, endIndex)

  return (
    <div className="results-container">
      <motion.div
        className="results-card"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="results-header"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1>🎯 Résultats du Quiz</h1>
          <p className="candidate-name">{result.name || 'Candidat'}</p>
        </motion.div>

        <motion.div
          className="score-circle-container"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="score-circle" style={{ borderColor: getScoreColor() }}>
            <motion.div
              className="score-percentage"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
            >
              {percentage.toFixed(1)}%
            </motion.div>
            <svg className="score-ring">
              <motion.circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={getScoreColor()}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={2 * Math.PI * 90 * (1 - percentage / 100)}
                initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - percentage / 100) }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                transform="rotate(-90 100 100)"
              />
            </svg>
          </div>
        </motion.div>

        <motion.div
          className="score-message"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ color: getScoreColor() }}
        >
          {getScoreMessage()}
        </motion.div>

        <motion.div
          className="results-details"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="detail-item">
            <span className="detail-label">Score</span>
            <span className="detail-value">{result.score} / {result.total_questions * 2} points</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Questions</span>
            <span className="detail-value">{result.total_questions} questions</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Temps</span>
            <span className="detail-value">{formatTime(result.time_taken || 0)}</span>
          </div>
        </motion.div>

        {/* Détails des réponses avec pagination */}
        {answerDetails.length > 0 && (
          <motion.div
            className="answers-review"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <h3>📋 Détail des Réponses ({answerDetails.length} questions)</h3>
            <div className="answers-list">
              {currentAnswers.map((detail, localIndex) => {
                const globalIndex = startIndex + localIndex
                return (
                  <div
                    key={detail.questionId}
                    className={`answer-item ${detail.isCorrect ? 'correct' : 'incorrect'}`}
                  >
                    <div className="answer-question">
                      <strong>Question {globalIndex + 1}:</strong> {detail.questionText}
                    </div>
                    <div className="answer-options">
                      {detail.options.map((opt, idx) => {
                        const isSelected = detail.selectedAnswer === idx
                        const isCorrect = detail.correctAnswer === idx
                        return (
                          <div
                            key={idx}
                            className={`answer-option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct-option' : ''} ${isSelected && !isCorrect ? 'wrong-option' : ''}`}
                          >
                            <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                            <span className="option-text">{opt}</span>
                            {isCorrect && <span className="correct-mark">✓ Correcte</span>}
                            {isSelected && !isCorrect && <span className="wrong-mark">✗ Votre choix</span>}
                            {isSelected && isCorrect && <span className="correct-mark">✓ Votre choix (Correct)</span>}
                          </div>
                        )
                      })}
                    </div>
                    <div className="answer-result">
                      {detail.isCorrect ? (
                        <span className="result-correct">✓ Correct (+{detail.points} points)</span>
                      ) : detail.selectedAnswer === -1 ? (
                        <span className="result-incorrect">✗ Non répondu (0 point)</span>
                      ) : (
                        <span className="result-incorrect">✗ Incorrect (0 point)</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← Précédent
                </button>
                <span className="pagination-info">
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Suivant →
                </button>
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          className="results-actions"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Link to="/leaderboard">
            <motion.button
              className="action-button leaderboard-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🏆 Voir le Classement
            </motion.button>
          </Link>
          <motion.button
            className="action-button retry-button"
            onClick={handleGoHome}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🏠 Retour à l'accueil
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Results
