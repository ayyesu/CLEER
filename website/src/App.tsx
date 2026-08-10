import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Screenshots } from './components/Screenshots';
import { HowItWorks } from './components/HowItWorks';
import { Trust } from './components/Trust';
import { Download } from './components/Download';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      <Navbar />
      <Hero />
      <Features />
      <Screenshots />
      <HowItWorks />
      <Trust />
      <Download />
      <FAQ />
      <Footer />
    </div>
  );
}
