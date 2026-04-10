import LinearProgress from '@mui/joy/LinearProgress';
import Typography from '@mui/joy/Typography';
import {useEffect, useState} from 'react'


function TextChange(){
    const [text, setText] = useState([
        "This is 1 type of waiting text.",
        "This is another waiting text.",
        "Plus a third."
    ])
    const [index, setIndex] = useState(0);

    useEffect(()=>{
        const interval = setInterval(()=>{
            setIndex(Math.round(Math.random() * text.length-1))
        },2000)

        return ()=>clearInterval(interval)
    },[])

    return <div className="waiting-text">{text[index]}</div>
}


export default function Loading({children}) {
    return (
        <div className="loading-div">
            <div className="loading-inner-div">
                <Typography level="h2">MMWA</Typography>
                <TextChange />
                <div className="progress-container">
                    <LinearProgress 
                        size="lg"
                    />
                </div>
                {children}
            </div>
        </div>
    )
}
