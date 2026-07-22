// React
import { useState } from "react"

// Router
import { useNavigate } from "react-router-dom"

// MUI
import { TextField, Button, Box, Typography, Divider } from "@mui/material"

function LoginPage (){
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const navigate = useNavigate()

    function login() {
        console.log('login!')
        navigate('/game')
    }

    return (
        <>
            <Box sx={{display:'flex', justifyContent:'center', alignItems:'center', height: '100vh', bgcolor: "red" }}>
                <Box sx={{display:'flex', flexDirection:'column', gap: 2, borderRadius: 5 , width: {lg:'30%', md:'80%',sm:'80%', xs:'90%'} , bgcolor: "white", padding:5 }}>
                    
                    <Typography sx={{display:'flex', justifyContent:'center', alignItems:'center', fontSize: '50px' }}> LOGIN </Typography>
                    <Divider></Divider>

                    <TextField label="Email" variant="outlined" value={email} onChange={(e)=>{setEmail(e.target.value)}}/>
                    <TextField label="Password" variant="outlined" value={password} onChange={(e)=>{setPassword(e.target.value)}}/>

                    <Box sx={{display:'flex', flexDirection:'column',  gap: 1 }}>
                        <Button variant="contained" sx={{width:'100%'}} onClick={login}>Login</Button>
                        <Button variant="outlined" sx={{width:'100%'}}>Register</Button>
                    </Box>
                    
                </Box>
            </Box>
        </>
    )
}

export default LoginPage