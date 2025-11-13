import { Hero } from '../sections/Hero';
import { Features } from '../sections/Features';
import { Showcase } from '../sections/Showcase';
import { CTA } from '../sections/CTA';

const App = () => (
  <div className="min-h-screen bg-slate-950 text-slate-50">
    <Hero />
    <Features />
    <Showcase />
    <CTA />
  </div>
);

export default App;
