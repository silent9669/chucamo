import React from 'react';
import KaTeXDisplay from './KaTeXDisplay';

const FifthRootTest = () => {
  const testExpressions = [
    // Test the problematic fifth root expression
    'The expression $\\sqrt[5]{3^5x^{45}}\\sqrt[8]{2^8x}$ is equivalent to $ax^b$, where $a$ and $b$ are positive constants and $x>1$. What is the value of $a+b$?',
    
    // Test various root expressions
    'Square root: $\\sqrt{x^2 + y^2}$',
    'Cube root: $\\sqrt[3]{x^3 + y^3}$',
    'Fourth root: $\\sqrt[4]{x^4 + y^4}$',
    'Fifth root: $\\sqrt[5]{x^5 + y^5}$',
    'Eighth root: $\\sqrt[8]{x^8 + y^8}$',
    
    // Test the original problem
    'Original problem: $\\sqrt[5]{3^5x^{45}}\\sqrt[8]{2^8x}$',
    
    // Test mixed expressions
    'Mixed: $\\sqrt{x} + \\sqrt[3]{y} + \\sqrt[5]{z}$',
    
    // Test complex expressions
    'Complex: $\\sqrt[5]{\\frac{a^5}{b^5}} \\cdot \\sqrt[8]{\\frac{c^8}{d^8}}$'
  ];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Fifth Root Rendering Test</h2>
      <p>This component tests the fixed KaTeX preprocessing for nth roots.</p>
      
      {testExpressions.map((expression, index) => (
        <div key={index} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h4>Test {index + 1}:</h4>
          <KaTeXDisplay content={expression} debug={true} />
        </div>
      ))}
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
        <h3>Expected Results:</h3>
        <ul>
          <li>Fifth root should display as: <code>\sqrt[5]{...}</code></li>
          <li>Eighth root should display as: <code>\sqrt[8]{...}</code></li>
          <li>Regular square root should display as: <code>\sqrt{...}</code></li>
          <li>All roots should render without errors</li>
        </ul>
      </div>
    </div>
  );
};

export default FifthRootTest;
