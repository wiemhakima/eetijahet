import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductShowcase from './components/ProductShowcase';
import CTA from './components/CTA';
import Footer from './components/Footer';
import './Home.scss';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <Header />
      <Hero />
      <ProductShowcase />
      <CTA />
      <Footer />
    </div>
  );
};

export default Home;
