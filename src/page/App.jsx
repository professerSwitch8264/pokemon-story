import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'

import GamePage from './game/GamePage'
import LoginPage from './auth/LoginPage'
import AdminPage from './admin/AdminPage'

function App() {

  return (
    <>

      <Routes>
        <Route path="/" element={<LoginPage/>}/>
        <Route path="/game" element={<GamePage/>}/>
        <Route path="/admin" element={<AdminPage/>}/>
      </Routes>
    </>
  )
}

export default App
