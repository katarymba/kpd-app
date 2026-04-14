import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import WelcomePage       from './pages/WelcomePage'
import LoginPage         from './pages/LoginPage'
import RegisterPage      from './pages/RegisterPage'
import RegisterAdultPage from './pages/RegisterAdultPage'
import RegisterChildPage from './pages/RegisterChildPage'
import SetupFamilyPage   from './pages/SetupFamilyPage'
import HomePage          from './pages/HomePage'
import TasksPage         from './pages/TasksPage'
import ShopPage          from './pages/ShopPage'
import HistoryPage       from './pages/HistoryPage'
import FamilyPage        from './pages/FamilyPage'
import ProtectedRoute    from './components/ProtectedRoute'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/"                  element={<WelcomePage />} />
        <Route path="/login"             element={<LoginPage />} />
        <Route path="/register"          element={<RegisterPage />} />
        <Route path="/register/adult"    element={<RegisterAdultPage />} />
        <Route path="/register/child"    element={<RegisterChildPage />} />

        {/* Setup family — requires auth but not family */}
        <Route path="/app/setup-family"  element={<SetupFamilyPage />} />

        {/* Protected app routes */}
        <Route path="/app/home"    element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/app/tasks"   element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
        <Route path="/app/shop"    element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
        <Route path="/app/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/app/family"  element={<ProtectedRoute><FamilyPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<WelcomePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
