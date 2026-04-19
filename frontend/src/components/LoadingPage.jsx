import LinearProgress from '@mui/joy/LinearProgress';
import Typography from '@mui/joy/Typography';
import {useEffect, useState} from 'react'


function TextChange(){
    const [text, setText] = useState([
        "The unicorn is the national animal of Scotland.",
        "'Strengths' is the longest word with only one vowel.",
        "One teaspoon of soil contains more microorganisms than there are people on the entire planet.",
        "A 'jiffy' is an actual unit of time, referring to 1/100th of a second.",
        "Potatoes were the first vegetable to be grown in space.",
        "Your mouth produces about one litre of saliva each day!",
        "Your brain is sometimes more active when you're asleep than when you're awake.",
        "The word “muscle” comes from Latin term meaning \"little mouse\", which is what Ancient Romans thought flexed bicep muscles resembled.",
        "Bodies give off a tiny amount of light that's too weak for the eye to see.",
        "Your left lung is about 10 percent smaller than your right one.",
        "Human teeth are just as strong as shark teeth.",
        "Scientists estimate that the nose can recognise a trillion different scents!",
        "Humans are the only species known to blush."
    ])
    const [index, setIndex] = useState(0);

    useEffect(()=>{
        const interval = setInterval(()=>{
            setIndex(Math.max(Math.round(Math.random() * text.length-1),0))
        },2000)

        return ()=>clearInterval(interval)
    },[])

    return <div className="waiting-text">
        <Typography level="body-lg">{text[index]}</Typography>
    </div>
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
