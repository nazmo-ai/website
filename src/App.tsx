import Navbar from './components/Navbar'
import Hero from './components/Hero'
import CoverageStrip from './components/CoverageStrip'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import HumanInTheLoop from './components/HumanInTheLoop'
import EarlyAccess from './components/EarlyAccess'
import Footer from './components/Footer'
import BackgroundMusic from './components/BackgroundMusic'
import { ThemeProvider } from './theme/ThemeProvider'
import { useReveal } from './hooks/useReveal'

function App() {
  useReveal()

  return (
    <ThemeProvider>
      <Navbar />
      <Hero />
      <CoverageStrip />
      <Features />
      <HowItWorks />
      <HumanInTheLoop />
      <EarlyAccess />
      <Footer />
      <BackgroundMusic />
    </ThemeProvider>
  )
}

export default App
