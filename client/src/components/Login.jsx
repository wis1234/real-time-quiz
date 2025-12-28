import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [password, setPassword] = useState('')
  const [loginMethod, setLoginMethod] = useState('email') // 'email' ou 'whatsapp'
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: loginMethod === 'email' ? email : null,
        whatsapp: loginMethod === 'whatsapp' ? whatsapp : null,
        password
      })

      if (response.data.success) {
        localStorage.setItem('candidateId', response.data.candidate.id)
        localStorage.setItem('candidateName', response.data.candidate.name)
        localStorage.setItem('candidateEmail', response.data.candidate.email)
        localStorage.setItem('candidateWhatsapp', response.data.candidate.whatsapp)
        localStorage.setItem('isAdmin', response.data.candidate.isAdmin ? 'true' : 'false')
        
        if (response.data.candidate.isAdmin) {
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="login-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="login-card"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.h1
          className="login-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          🔐 Connexion
        </motion.h1>

        <div className="login-method-toggle">
          <button
            className={loginMethod === 'email' ? 'active' : ''}
            onClick={() => setLoginMethod('email')}
          >
            📧 Email
          </button>
          <button
            className={loginMethod === 'whatsapp' ? 'active' : ''}
            onClick={() => setLoginMethod('whatsapp')}
          >
            📱 WhatsApp
          </button>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {loginMethod === 'email' ? (
            <motion.div
              className="form-group"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </motion.div>
          ) : (
            <motion.div
              className="form-group"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="whatsapp">Numéro WhatsApp</label>
              <input
                type="tel"
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                required
              />
            </motion.div>
          )}

          <motion.div
            className="form-group"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
            />
          </motion.div>

          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            className="login-button"
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.05 }}
            whileTap={{ scale: isLoading ? 1 : 0.95 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </motion.button>
        </form>

        <motion.div
          className="login-footer"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p>Pas encore de compte ? <Link to="/register">S'inscrire</Link></p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default Login

