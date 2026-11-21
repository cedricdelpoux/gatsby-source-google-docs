const gradientBackground = (theme) =>
  `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.secondary})`

const theme = {
  space: [0, 8, 16, 32, 64],
  radii: [0, 10, 20],
  breakpoints: ["500px", "800px", "1080px"],
  fontSizes: [14, 16, 20, 24, 32, 64, 80],
  colors: {
    text: "#333333",
    background: "#FFFFFF",
    primary: "#6F2B9F",
    secondary: "#4d90fe",
    white: "#FFFFFF",
    grey: "#F3F3F3",
    modes: {
      dark: {
        text: "#fff",
        background: "#1e2334",
      },
    },
  },
  buttons: {
    primary: {
      backgroundImage: gradientBackground,
      py: 2,
      px: 4,
      border: 0,
      borderRadius: 1,
      cursor: "pointer",
      outline: "none",
      color: "white",
      backgroundSize: "200% auto",
      transition: "0.2s",
      "&:hover": {
        backgroundPosition: "right center",
      },
    },
  },
  textStyles: {
    heading: {
      margin: 0,
      textAlign: "center",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent;",
      MozBackgroundClip: "text",
      MozTextFillColor: "transparent",
      backgroundImage: gradientBackground,
    },
  },
  styles: {
    root: {
      backgroundImage: gradientBackground,
      padding: [2, 3],
      fontFamily: "Quicksand",
    },
    a: {
      textDecoration: "none",
      color: "secondary",
    },
    h1: {
      variant: "textStyles.heading",
      fontSize: [4, 5, 6],
    },
    h2: {
      variant: "textStyles.heading",
      fontSize: [3, 3, 4],
    },
    h3: {
      variant: "textStyles.heading",
      fontSize: 3,
    },
    h4: {
      variant: "textStyles.heading",
      fontSize: 2,
    },
    h5: {
      variant: "textStyles.heading",
      fontSize: 1,
    },
    h6: {
      variant: "textStyles.heading",
      fontSize: 0,
    },
  },
}

export default theme
