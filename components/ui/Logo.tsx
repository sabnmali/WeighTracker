import React from 'react';

const Logo: React.FC = () => {
  // "WeighTracker"
  // W - 900
  // e - 800
  // i - 700
  // g - 600
  // h - 500
  // T - 400
  // r - 300
  // a - 200
  // c - 200
  // k - 100
  // e - 100
  // r - 100

  const letters = [
    { char: 'W', weight: 'font-black' },     // 900
    { char: 'e', weight: 'font-extrabold' }, // 800
    { char: 'i', weight: 'font-bold' },      // 700
    { char: 'g', weight: 'font-semibold' },  // 600
    { char: 'h', weight: 'font-medium' },    // 500
    { char: 'T', weight: 'font-normal' },    // 400
    { char: 'r', weight: 'font-light' },     // 300
    { char: 'a', weight: 'font-extralight' },// 200
    { char: 'c', weight: 'font-extralight' },// 200
    { char: 'k', weight: 'font-thin' },      // 100
    { char: 'e', weight: 'font-thin' },      // 100
    { char: 'r', weight: 'font-thin' },      // 100
  ];

  return (
    <div className="flex items-center select-none" aria-label="WeighTracker Logo">
      {letters.map((item, index) => (
        <span key={index} className={`text-3xl ${item.weight} tracking-tighter text-blue-500 dark:text-blue-400`}>
          {item.char}
        </span>
      ))}
    </div>
  );
};

export default Logo;