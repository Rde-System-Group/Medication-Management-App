import { LinearProgress, Typography, Box } from '@mui/material';
import { useEffect, useState } from 'react'

function TextChange() {
    const [text] = useState([
        "Loading application...",
        "Authenticating user...",
        "Initializing dashboard..."
    ])
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % text.length)
        }, 2000)

        return () => clearInterval(interval)
    }, [text.length])

    return <div className="waiting-text">{text[index]}</div>
}

export default function Loading({ children }) {
    return (
        <Box className="loading-div" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <Box className="loading-inner-div" sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ mb: 2 }}>MMWA</Typography>
                <TextChange />
                <Box className="progress-container" sx={{ mt: 2 }}>
                    <LinearProgress />
                </Box>
                {children}
            </Box>
        </Box>
    )
}
