import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { seedDemoData } from './utils/storage'

import WelcomePage      from './pages/WelcomePage'
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import RegisterAdultPage from './pages/RegisterAdultPage'
import RegisterChildPage from './pages/RegisterChildPage'
import SetupFamilyPage  from './pages/SetupFamilyPage'
import AppLayout        from './components/AppLayout'
import HomePage         from './pages/HomePage'
import TasksPage        from './pages/TasksPage'
import ShopPage         from './pages/ShopPage'
import HistoryPage      from './pages/HistoryPage'
import FamilyPage       from './pages/FamilyPage'
import ProtectedRoute   from './components/ProtectedRoute'

// Инициализировать демо-данные при первом запуске
seedDemoData()

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Публичные */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/adult" element={<RegisterAdultPage />} />
        <Route path="/register/child" element={<RegisterChildPage />} />

        {/* Защищённые */}
        <Route path="/app" element={
          <ProtectedRoute><AppLayout /></ProtectedRoute>
        }>
          <Route path="setup-family" element={<SetupFamilyPage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="family" element={<FamilyPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
