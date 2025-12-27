import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import io from 'socket.io-client'
import Timer from './Timer'
import './Quiz.css'

const socket = io('http://localhost:5000')

const Quiz = () => {
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeStarted, setTimeStarted] = useState(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadQuestions()
    setTimeStarted(Date.now())
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (timeStarted) {
        setTimeElapsed(Math.floor((Date.now() - timeStarted) / 1000))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [timeStarted])

  const loadQuestions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/quiz/questions')
      setQuestions(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error('Erreur lors du chargement des questions:', error)
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

  const handleSubmit = async () => {
    const candidateId = localStorage.getItem('candidateId')
    const candidateName = localStorage.getItem('candidateName')
    const candidateEmail = localStorage.getItem('candidateEmail')

    const answersArray = questions.map(q => ({
      questionId: q.id,
      selectedAnswer: answers[q.id] !== undefined ? answers[q.id] : -1
    }))

    try {
      const response = await axios.post('http://localhost:5000/api/quiz/submit', {
        candidateId,
        candidateName,
        email: candidateEmail,
        answers: answersArray,
        timeTaken: timeElapsed
      })

      socket.emit('submit-answer', { candidateId })
      navigate(`/results/${candidateId}`)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      alert('Erreur lors de la soumission du quiz')
    }
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
        <Timer timeElapsed={timeElapsed} />
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
          <div className="options-container">
            {currentQuestion.options.map((option, index) => {
              const isSelected = answers[currentQuestion.id] === index
              return (
                <motion.button
                  key={index}
                  className={`option-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
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
          disabled={currentQuestionIndex === 0}
          whileHover={{ scale: currentQuestionIndex === 0 ? 1 : 1.05 }}
          whileTap={{ scale: currentQuestionIndex === 0 ? 1 : 0.95 }}
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Terminer le Quiz ✓
          </motion.button>
        ) : (
          <motion.button
            className="nav-button primary"
            onClick={handleNext}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Suivant →
          </motion.button>
        )}
      </div>
    </div>
  )
}

export default Quiz


