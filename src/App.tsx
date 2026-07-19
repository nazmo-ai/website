import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import EarlyAccess from './components/EarlyAccess'
import Footer from './components/Footer'
import BackgroundMusic from './components/BackgroundMusic'
import { useReveal } from './hooks/useReveal'

function App() {
  useReveal()

  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <EarlyAccess />
      <Footer />
      <BackgroundMusic />
    </>
  )
}

export default App
