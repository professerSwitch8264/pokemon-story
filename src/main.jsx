import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

import App from './page/App.jsx'

const theme = createTheme({
  typography: {
    fontFamily: [
      "'Noto Sans Thai'",
      "'Crimson Text'",
      "Georgia",
      "serif",
    ].join(','),
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
)
