import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './Home.css'

const Home = () => {
  const navigate = useNavigate()

  const checkAuth = () => {
    const candidateId = localStorage.getItem('candidateId')
    if (candidateId) {
      const isAdmin = localStorage.getItem('isAdmin') === 'true'
      if (isAdmin) {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } else {
      navigate('/login')
    }
  }

  return (
    <motion.div
      className="home-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="home-card"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.h1
          className="home-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          🎯 Quiz QCM
        </motion.h1>
        <motion.p
          className="home-subtitle"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Testez vos connaissances avec notre quiz interactif
        </motion.p>

        <motion.div
          className="home-actions"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.button
            className="action-button primary"
            onClick={checkAuth}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Commencer le Quiz
          </motion.button>
          
          <motion.button
            className="action-button secondary"
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Se connecter
          </motion.button>
          
          <motion.button
            className="action-button secondary"
            onClick={() => navigate('/register')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            S'inscrire
          </motion.button>
        </motion.div>

        <motion.div
          className="home-features"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="feature">
            <span>⏱️</span> Chronométré
          </div>
          <div className="feature">
            <span>📊</span> Résultats instantanés
          </div>
          <div className="feature">
            <span>🏆</span> Classement en direct
          </div>
          <div className="feature">
            <span>🔐</span> Authentification sécurisée
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default Home
