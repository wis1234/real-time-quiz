import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users') // 'users' ou 'questions'
  const [users, setUsers] = useState([])
  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const navigate = useNavigate()

  const candidateId = localStorage.getItem('candidateId')
  const isAdmin = localStorage.getItem('isAdmin') === 'true'

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login')
      return
    }
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'users') {
        const response = await axios.post('http://localhost:5000/api/admin/users', { candidateId })
        setUsers(response.data)
      } else {
        const response = await axios.post('http://localhost:5000/api/admin/questions', { candidateId })
        setQuestions(response.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      if (error.response?.status === 403) {
        navigate('/login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return

    try {
      await axios.post('http://localhost:5000/api/admin/users/delete', { candidateId, userId })
      loadData()
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) return

    try {
      await axios.post('http://localhost:5000/api/admin/questions/delete', { candidateId, questionId })
      loadData()
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const handleSaveQuestion = async (questionData) => {
    try {
      if (editingQuestion) {
        await axios.post('http://localhost:5000/api/admin/questions/update', {
          candidateId,
          id: editingQuestion.id,
          ...questionData
        })
      } else {
        await axios.post('http://localhost:5000/api/admin/questions/add', {
          candidateId,
          ...questionData
        })
      }
      setShowQuestionForm(false)
      setEditingQuestion(null)
      loadData()
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde')
    }
  }

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">⏳</div>
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🛡️ Tableau de Bord Admin</h1>
        <button onClick={() => { localStorage.clear(); navigate('/login') }} className="logout-btn">
          Déconnexion
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 Utilisateurs ({users.length})
        </button>
        <button
          className={activeTab === 'questions' ? 'active' : ''}
          onClick={() => setActiveTab('questions')}
        >
          ❓ Questions ({questions.length})
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="users-table"
          >
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>WhatsApp</th>
                  <th>Score</th>
                  <th>Temps</th>
                  <th>Admin</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td>{user.whatsapp || 'N/A'}</td>
                    <td>{user.score || 0} / {user.total_questions * 2 || 0}</td>
                    <td>{formatTime(user.time_taken)}</td>
                    <td>{user.is_admin === 1 ? '✅' : '❌'}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="delete-btn"
                        disabled={user.is_admin === 1}
                      >
                        🗑️ Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeTab === 'questions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="questions-list"
          >
            <button
              onClick={() => {
                setEditingQuestion(null)
                setShowQuestionForm(true)
              }}
              className="add-question-btn"
            >
              ➕ Ajouter une question
            </button>

            <div className="questions-grid">
              {questions.map((question) => (
                <motion.div
                  key={question.id}
                  className="question-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <h3>{question.text}</h3>
                  <div className="options-list">
                    {question.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`option ${idx === question.correct_answer ? 'correct' : ''}`}
                      >
                        {String.fromCharCode(65 + idx)}. {opt}
                        {idx === question.correct_answer && ' ✓'}
                      </div>
                    ))}
                  </div>
                  <div className="question-meta">
                    <span>Points: {question.points}</span>
                    <div className="question-actions">
                      <button
                        onClick={() => {
                          setEditingQuestion(question)
                          setShowQuestionForm(true)
                        }}
                        className="edit-btn"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="delete-btn"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showQuestionForm && (
          <QuestionForm
            question={editingQuestion}
            onSave={handleSaveQuestion}
            onClose={() => {
              setShowQuestionForm(false)
              setEditingQuestion(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const QuestionForm = ({ question, onSave, onClose }) => {
  const [text, setText] = useState(question?.text || '')
  const [options, setOptions] = useState(question?.options || ['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState(question?.correct_answer ?? 0)
  const [points, setPoints] = useState(question?.points || 1)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim() || options.some(opt => !opt.trim())) {
      alert('Veuillez remplir tous les champs')
      return
    }
    onSave({ text, options, correct_answer: correctAnswer, points })
  }

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{question ? 'Modifier' : 'Ajouter'} une question</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Question</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label>Options (4 réponses)</label>
            {options.map((opt, idx) => (
              <div key={idx} className="option-input-group">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...options]
                    newOptions[idx] = e.target.value
                    setOptions(newOptions)
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  required
                />
                <input
                  type="radio"
                  name="correct"
                  checked={correctAnswer === idx}
                  onChange={() => setCorrectAnswer(idx)}
                />
                <label>Correcte</label>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label>Points</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
              min="1"
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn">
              💾 Enregistrer
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">
              Annuler
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default AdminDashboard

