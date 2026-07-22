import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'

import GamePage from './game/GamePage'
import LoginPage from './auth/LoginPage'

function App() {

  return (
    <>

      <Routes>
        <Route path="/" element={<LoginPage/>}/>
        <Route path="/game" element={<GamePage/>}/>
      </Routes>
    </>
  )
}

export default App
