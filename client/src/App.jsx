import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import CandidateDashboard from './components/CandidateDashboard'
import Quiz from './components/Quiz'
import Results from './components/Results'
import Leaderboard from './components/Leaderboard'
import AdminDashboard from './components/AdminDashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<CandidateDashboard />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/results/:candidateId" element={<Results />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  )
}

export default App


