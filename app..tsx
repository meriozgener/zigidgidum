import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Heart, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface WordPair {
  correct: string;
  incorrect: string;
}

const wordPairs: WordPair[] = [
  { correct: 'Herkes', incorrect: 'Herkez' },
  { correct: 'Yalnız', incorrect: 'Yanlız' },
  { correct: 'Yanlış', incorrect: 'Yalnış' },
  { correct: 'Şoför', incorrect: 'Şöför' },
  { correct: 'Restoran', incorrect: 'Restorant' },
  { correct: 'Orijinal', incorrect: 'Orjinal' },
  { correct: 'Eşofman', incorrect: 'Eşortman' },
  { correct: 'Makine', incorrect: 'Makina' },
  { correct: 'Her şey', incorrect: 'Herşey' },
  { correct: 'Sürpriz', incorrect: 'Süpriz' },
  { correct: 'Kravat', incorrect: 'Kıravat' },
  { correct: 'Profesör', incorrect: 'Profösör' },
  { correct: 'Doktor', incorrect: 'Doktur' },
  { correct: 'Mühendis', incorrect: 'Mühendiz' },
  { correct: 'Öğretmen', incorrect: 'Öğretmem' },
  { correct: 'Hastane', incorrect: 'Hastahane' },
  { correct: 'Üniversite', incorrect: 'Üniversitesi' },
  { correct: 'Bilgisayar', incorrect: 'Bilgisayır' },
  { correct: 'Telefon', incorrect: 'Telefom' },
  { correct: 'Televizyon', incorrect: 'Televizyom' },
  { correct: 'Müzik', incorrect: 'Müzük' },
  { correct: 'Kitap', incorrect: 'Kitab' },
  { correct: 'Gazete', incorrect: 'Gazeta' },
  { correct: 'Dergi', incorrect: 'Derği' },
];

const colors = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', 
  '#f97316', '#ef4444', '#fde047', '#6366f1', 
  '#d946ef', '#0891b2', '#84cc16', '#f59e0b'
];

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tickSoundRef = useRef<HTMLAudioElement | null>(null);
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const wrongSoundRef = useRef<HTMLAudioElement | null>(null);
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('spellingGameHighScore') || '0');
  });
  const [lives, setLives] = useState(3);
  const [currentPair, setCurrentPair] = useState<WordPair | null>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('text-white');
  const [rotation, setRotation] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [showSegmentHighlight, setShowSegmentHighlight] = useState(false);

  const numSegments = 12; // Sadece 12 segment göster, daha ferah görünüm için
  const segmentAngle = (2 * Math.PI) / numSegments;
  const wheelRadius = 180; // Daha büyük çark
  const centerX = 180;
  const centerY = 180;

  // Initialize audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create tick sound using Web Audio API
      const createTickSound = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      };

      const createCorrectSound = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      };

      const createWrongSound = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      };

      const createGameOverSound = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
      };

      tickSoundRef.current = { play: soundEnabled ? createTickSound : () => {} } as any;
      correctSoundRef.current = { play: soundEnabled ? createCorrectSound : () => {} } as any;
      wrongSoundRef.current = { play: soundEnabled ? createWrongSound : () => {} } as any;
      gameOverSoundRef.current = { play: soundEnabled ? createGameOverSound : () => {} } as any;
    }
  }, [soundEnabled]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      handleTimeUp();
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  const handleTimeUp = () => {
    setIsTimerActive(false);
    if (soundEnabled && wrongSoundRef.current) {
      wrongSoundRef.current.play();
    }
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setGameOver(true);
        if (soundEnabled && gameOverSoundRef.current) {
          gameOverSoundRef.current.play();
        }
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('spellingGameHighScore', score.toString());
        }
      }
      return newLives;
    });
    setMessage('Süre doldu! ⏰');
    setMessageColor('text-red-400');
    
    setTimeout(() => {
      if (lives > 1) {
        resetForNextSpin();
      }
    }, 2000);
  };

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 360, 360);
    
    for (let i = 0; i < numSegments; i++) {
      const angle = i * segmentAngle;
      
      // Highlight selected segment
      const isSelected = selectedSegment === i && showSegmentHighlight;
      
      // Draw segment
      ctx.beginPath();
      ctx.fillStyle = isSelected ? '#fbbf24' : colors[i % colors.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, wheelRadius, angle, angle + segmentAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      
      // Add glow effect for selected segment
      if (isSelected) {
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, wheelRadius, angle, angle + segmentAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      // Draw segment separator
      ctx.save();
      ctx.strokeStyle = '#ffffff80';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, wheelRadius, angle, angle + segmentAngle);
      ctx.lineTo(centerX, centerY);
      ctx.stroke();
      ctx.restore();

      // Draw words
      ctx.save();
      ctx.fillStyle = isSelected ? '#0c1445' : 'white';
      ctx.font = 'bold 18px Montserrat, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + segmentAngle / 2);
      ctx.fillText(wordPairs[i % wordPairs.length].correct, wheelRadius * 0.7, 0);
      ctx.restore();
    }

    // Draw pegs
    for (let i = 0; i < numSegments; i++) {
      const angle = i * segmentAngle;
      const pegX = centerX + (wheelRadius - 15) * Math.cos(angle);
      const pegY = centerY + (wheelRadius - 15) * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(pegX, pegY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#d1d5db';
      ctx.fill();
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#4b5563';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#9ca3af';
    ctx.fill();
  }, [selectedSegment, showSegmentHighlight, numSegments, segmentAngle]);

  const playTickSound = useCallback(() => {
    if (soundEnabled && tickSoundRef.current) {
      tickSoundRef.current.play();
    }
  }, [soundEnabled]);

  const spinWheel = () => {
    if (isSpinning || gameOver) return;
    
    setIsSpinning(true);
    setMessage('');
    setShowQuestion(false);
    setShowSegmentHighlight(false);

    const spinDegrees = Math.random() * 360 + 360 * 5; // At least 5 full rotations
    const newRotation = rotation + spinDegrees;
    setRotation(newRotation);

    // Play tick sounds during spin
    const tickInterval = setInterval(playTickSound, 100);

    setTimeout(() => {
      clearInterval(tickInterval);
      const finalRotation = newRotation % 360;
      const pointerAngle = (360 - finalRotation + 270) % 360;
      const segmentIndex = Math.floor(pointerAngle / (360 / numSegments)) % wordPairs.length;
      
      setSelectedSegment(segmentIndex);
      setShowSegmentHighlight(true);
      
      setTimeout(() => {
        const selectedPair = wordPairs[segmentIndex % wordPairs.length];
        setCurrentPair(selectedPair);
        
        // Randomize choice order
        const randomChoices = Math.random() < 0.5 
          ? [selectedPair.correct, selectedPair.incorrect] 
          : [selectedPair.incorrect, selectedPair.correct];
        setChoices(randomChoices);
        setShowQuestion(true);
        setTimeLeft(10);
        setIsTimerActive(true);
        setShowSegmentHighlight(false);
      }, 1000);
    }, 4100);
  };

  const checkAnswer = (selected: string) => {
    if (!currentPair || gameOver) return;

    setIsTimerActive(false);
    
    if (selected === currentPair.correct) {
      setScore(prev => prev + 10);
      setMessage('Doğru! 🎉');
      setMessageColor('text-green-400');
      
      if (soundEnabled && correctSoundRef.current) {
        correctSoundRef.current.play();
      }
      
      // Confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameOver(true);
          if (soundEnabled && gameOverSoundRef.current) {
            gameOverSoundRef.current.play();
          }
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('spellingGameHighScore', score.toString());
          }
        }
        return newLives;
      });
      
      setMessage(`Yanlış! Doğrusu: ${currentPair.correct}`);
      setMessageColor('text-red-400');
      
      if (soundEnabled && wrongSoundRef.current) {
        wrongSoundRef.current.play();
      }
    }

    setTimeout(() => {
      if (lives > 1 || selected === currentPair.correct) {
        resetForNextSpin();
      }
    }, 2000);
  };

  const resetForNextSpin = () => {
    setIsSpinning(false);
    setShowQuestion(false);
    setCurrentPair(null);
    setMessage('');
    setMessageColor('text-white');
    setIsTimerActive(false);
    setTimeLeft(10);
    setSelectedSegment(null);
    setShowSegmentHighlight(false);
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    resetForNextSpin();
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{
           backgroundColor: '#0c1445',
           backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
         }}>
      <div className="bg-opacity-85 border-4 border-yellow-300 rounded-3xl shadow-2xl p-8 w-full max-w-lg text-center text-white backdrop-blur-sm relative"
           style={{
             backgroundColor: 'rgba(12, 20, 69, 0.85)',
             boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 0 15px rgba(253, 224, 71, 0.3)'
           }}>
        
        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          className="absolute top-4 right-4 p-2 rounded-full bg-yellow-300 text-blue-900 hover:bg-yellow-400 transition-colors"
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        <h1 className="text-5xl font-black text-yellow-300 mb-2"
            style={{
              fontFamily: 'Montserrat, sans-serif',
              textShadow: '0 0 10px #fde047, 0 0 20px #f59e0b'
            }}>
          YAZIM MAKİNESİ
        </h1>
        
        <p className="text-xl text-gray-300 mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
          Çarkı Çevir, Doğruyu Bul!
        </p>

        {/* Lives and Timer */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                size={24}
                className={`${i < lives ? 'text-red-500 fill-current' : 'text-gray-500'} transition-colors`}
              />
            ))}
          </div>
          
          {isTimerActive && (
            <div className={`text-2xl font-bold ${timeLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-yellow-300'}`}>
              ⏱️ {timeLeft}
            </div>
          )}
        </div>

        <div className="relative w-96 h-96 mx-auto mb-8">
          {/* Pointer */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10"
               style={{
                 width: 0,
                 height: 0,
                 borderLeft: '25px solid transparent',
                 borderRight: '25px solid transparent',
                 borderTop: '35px solid #ef4444',
                 filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.5))'
               }}>
          </div>
          
          {/* Wheel Canvas */}
          <canvas
            ref={canvasRef}
            width="360"
            height="360"
            className="transition-transform duration-[4s] ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)'
            }}
          />
        </div>

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center rounded-3xl">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-red-400 mb-4">OYUN BİTTİ!</h2>
              <p className="text-2xl text-yellow-300 mb-2">Final Puanınız: {score}</p>
              {score === highScore && score > 0 && (
                <p className="text-xl text-green-400 mb-4">🎉 YENİ REKOR! 🎉</p>
              )}
              <button
                onClick={resetGame}
                className="bg-gradient-to-br from-green-400 to-green-700 text-white font-bold text-xl px-8 py-4 rounded-full transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/60 shadow-lg shadow-green-500/40 flex items-center space-x-2 mx-auto"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <RotateCcw size={24} />
                <span>YENİDEN OYNA</span>
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        {!showQuestion && !gameOver && (
          <div className="min-h-[120px] flex items-center justify-center">
            <button
              onClick={spinWheel}
              disabled={isSpinning}
              className={`font-bold text-2xl text-blue-900 px-10 py-4 rounded-full transition-all duration-200 ${
                isSpinning 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-br from-yellow-300 to-yellow-600 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/60 shadow-lg shadow-yellow-500/40'
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {isSpinning ? 'DÖNÜYOR...' : 'ÇEVİR'}
            </button>
          </div>
        )}

        {/* Question Area */}
        {showQuestion && !gameOver && (
          <div className="min-h-[120px] flex flex-wrap items-center justify-center gap-4">
            {choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => checkAnswer(choice)}
                className="bg-gradient-to-br from-purple-400 to-purple-700 text-white font-bold text-xl px-8 py-4 rounded-full transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/60 shadow-lg shadow-purple-500/40 w-[45%]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {choice}
              </button>
            ))}
          </div>
        )}

        {/* Message */}
        <div className={`mt-6 text-3xl font-bold h-10 ${messageColor}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {message}
        </div>

        {/* Score and High Score */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-xl bg-black bg-opacity-30 p-2 rounded-lg" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            PUAN: <span className="font-bold text-yellow-300">{score}</span>
          </div>
          <div className="text-xl bg-black bg-opacity-30 p-2 rounded-lg" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            REKOR: <span className="font-bold text-green-400">{highScore}</span>
          </div>
        </div>

        {/* Reset Button */}
        {!gameOver && (
          <button
            onClick={resetGame}
            className="mt-4 bg-gradient-to-br from-gray-400 to-gray-600 text-white font-bold text-sm px-4 py-2 rounded-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex items-center space-x-1 mx-auto"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <RotateCcw size={16} />
            <span>YENİDEN BAŞLAT</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
