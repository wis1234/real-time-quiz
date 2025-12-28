import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import io from 'socket.io-client'
import Timer from './Timer'
import './Quiz.css'

const socket = io('http://localhost:5000')

const Quiz = () => {
  const [questions, setQuestions] = useState([])
  const [showAnswers, setShowAnswers] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeStarted, setTimeStarted] = useState(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [timeLimit, setTimeLimit] = useState(0) // en secondes
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const intervalRef = useRef(null)

  useEffect(() => {
    const candidateId = localStorage.getItem('candidateId')
    if (!candidateId) {
      navigate('/login')
      return
    }
    loadQuizData()
    setTimeStarted(Date.now())
  }, [])

  useEffect(() => {
    if (timeStarted) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timeStarted) / 1000)
        setTimeElapsed(elapsed)
        
        if (timeLimit > 0) {
          const remaining = timeLimit - elapsed
          setTimeRemaining(remaining)
          
          if (remaining <= 0 && !isSubmitting) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
            }
            handleAutoSubmit()
          }
        }
      }, 1000)
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timeStarted, timeLimit, isSubmitting])

  const loadQuizData = async () => {
    try {
      const [questionsResponse, settingsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/quiz/questions'),
        axios.get('http://localhost:5000/api/quiz/settings')
      ])
      
      const questionsData = questionsResponse.data.questions || questionsResponse.data
      setQuestions(Array.isArray(questionsData) ? questionsData : [])
      setShowAnswers(questionsResponse.data.showAnswers || false)
      
      if (settingsResponse.data.timeLimit > 0) {
        setTimeLimit(settingsResponse.data.timeLimit * 60) // Convertir minutes en secondes
        setTimeRemaining(settingsResponse.data.timeLimit * 60)
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (questionId, answerIndex) => {
    setAnswers({
      ...answers,
      [questionId]: answerIndex
    })
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleAutoSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    
    // Afficher un message si c'est un auto-submit
    if (timeLimit > 0 && timeRemaining <= 0) {
      alert('Le temps imparti est écoulé. Vos réponses sont en cours d\'envoi...')
    }
    
    const candidateId = localStorage.getItem('candidateId')
    const candidateName = localStorage.getItem('candidateName')
    const candidateEmail = localStorage.getItem('candidateEmail')
    const candidateWhatsapp = localStorage.getItem('candidateWhatsapp')

    // Soumettre toutes les questions, même celles non répondues (avec -1)
    const answersArray = questions.map(q => ({
      questionId: q.id,
      selectedAnswer: answers[q.id] !== undefined ? answers[q.id] : -1
    }))

    try {
      const response = await axios.post('http://localhost:5000/api/quiz/submit', {
        candidateId,
        candidateName,
        email: candidateEmail,
        whatsapp: candidateWhatsapp,
        answers: answersArray,
        timeTaken: timeElapsed
      })

      socket.emit('submit-answer', { candidateId })
      navigate(`/results/${candidateId}`, { state: { answerDetails: response.data.answerDetails } })
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      alert(error.response?.data?.error || 'Erreur lors de la soumission du quiz')
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    await handleAutoSubmit()
  }

  if (isLoading) {
    return (
      <div className="quiz-loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          ⏳
        </motion.div>
        <p>Chargement des questions...</p>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="quiz-container">
        <p>Aucune question disponible</p>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).length

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <Timer 
          timeElapsed={timeElapsed} 
          timeLimit={timeLimit}
          timeRemaining={timeRemaining}
        />
        {timeLimit > 0 && timeRemaining <= 60 && timeRemaining > 0 && (
          <div className="time-warning">
            ⚠️ Temps restant: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
        )}
        <div className="quiz-progress">
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p>Question {currentQuestionIndex + 1} / {questions.length}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          className="question-card"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="question-text">{currentQuestion.text}</h2>
          {showAnswers && currentQuestion.correct_answer !== undefined && (
            <div className="correct-answer-hint">
              ✓ Réponse correcte: {String.fromCharCode(65 + currentQuestion.correct_answer)}
            </div>
          )}
          <div className="options-container">
            {currentQuestion.options.map((option, index) => {
              const isSelected = answers[currentQuestion.id] === index
              const isCorrect = showAnswers && currentQuestion.correct_answer === index
              const isWrong = showAnswers && isSelected && currentQuestion.correct_answer !== index
              
              return (
                <motion.button
                  key={index}
                  className={`option-button ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct-answer' : ''} ${isWrong ? 'wrong-answer' : ''}`}
                  onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  disabled={isSubmitting}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                  {isSelected && (
                    <motion.span
                      className="checkmark"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      ✓
                    </motion.span>
                  )}
                  {isCorrect && (
                    <span className="correct-badge">Correcte</span>
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="quiz-navigation">
        <motion.button
          className="nav-button secondary"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || isSubmitting}
          whileHover={{ scale: currentQuestionIndex === 0 || isSubmitting ? 1 : 1.05 }}
          whileTap={{ scale: currentQuestionIndex === 0 || isSubmitting ? 1 : 0.95 }}
        >
          ← Précédent
        </motion.button>

        <div className="answered-count">
          Répondu: {answeredCount} / {questions.length}
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <motion.button
            className="nav-button primary submit-button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
          >
            {isSubmitting ? 'Envoi...' : 'Terminer le Quiz ✓'}
          </motion.button>
        ) : (
          <motion.button
            className="nav-button primary"
            onClick={handleNext}
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
          >
            Suivant →
          </motion.button>
        )}
      </div>
    </div>
  )
}

export default Quiz
