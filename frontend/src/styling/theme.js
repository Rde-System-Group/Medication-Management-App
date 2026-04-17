import { createTheme } from "@mui/material/styles";

//export this to use in ohther pages
const theme = createTheme({
    palette: {
        mode: "light",

        // Primary blue used for main action buttons
        primary: {
            main: "#1976d2",
        },

        // Page and card backgrounds
        background: {
            default: "#f5f5f5",
            paper: "#ffffff",
        },

        // Chip/button status colors
        success: {
            main: "#2e7d32",
        },
        error: {
            main: "#d32f2f",
        },
        
        neutral: {
            main: "#6c757d",
            contrastText: "#fff",
        },
    },

    typography: {
        fontFamily: "Roboto, Helvetica, Arial, sans-serif",

        // h5 is used in some card headings
        h5: {
            fontSize: "2rem",
            fontWeight: 400,
            lineHeight: 1.334,
        },
    },
});

export default theme;