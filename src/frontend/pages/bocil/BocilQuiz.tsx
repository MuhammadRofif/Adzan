import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { Quiz } from '../../../shared/types';
import { cn } from '../../utils/cn';
import { BlockBlastGame } from '../../components/bocil/BlockBlastGame';

// ─── Quiz Player for Bocil ───────────────
const BocilQuizPlayer: React.FC<{
  quiz: Quiz;
  participantId: string;
  onDone: (score: number, pts: number) => void;
  onClose: () => void;
}> = ({ quiz, participantId, onDone, onClose }) => {
  const { submitQuiz } = useApp();
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(quiz.questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; earnedPoints: number } | null>(null);
  const [step, setStep] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackAnswer, setFeedbackAnswer] = useState<number | null>(null);

  // Fullscreen management for the entire Quiz flow
  const quizContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (quizContainerRef.current) {
        quizContainerRef.current.requestFullscreen().catch((err: any) => console.error(err));
      }
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  // Block Blast Stage management
  const [gameStage, setGameStage] = useState<'block_blast' | 'quiz_question'>(
    quiz.mode === 'block_blast' ? 'block_blast' : 'quiz_question'
  );
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  useEffect(() => {
    if (submitted) {
      window.scrollTo(0, 0);
    }
  }, [submitted]);

  const handleAnswer = (optIdx: number) => {
    if (submitted) return;
    const a = [...answers]; a[step] = optIdx; setAnswers(a);
  };

  const handleSubmitAnswers = async (currentAnswers: (number | null)[]) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const finalAnswers = currentAnswers.map(a => a ?? 0);
      const res = await submitQuiz(participantId, quiz.id, finalAnswers);
      setResult(res); 
      setSubmitted(true); 
      onDone(res.score, res.earnedPoints);
    } catch (error) {
      console.error("Quiz submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    await handleSubmitAnswers(answers);
  };

  const handleAnswerWithFeedback = async (optIdx: number) => {
    if (submitted || isProcessingAnswer) return;
    setIsProcessingAnswer(true);

    const newAnswers = [...answers];
    newAnswers[step] = optIdx;
    setAnswers(newAnswers);

    setIsProcessingAnswer(false);
    if (step < quiz.questions.length - 1) {
      setStep(s => s + 1);
      setGameStage('block_blast');
    } else {
      await handleSubmitAnswers(newAnswers);
    }
  };

  const allAnswered = answers.every(a => a !== null);
  const q = quiz.questions[step];

  if (submitted && result) {
    const answeredCount = answers.filter(a => a !== null).length;
    const isGameOver = quiz.mode === 'block_blast' && answeredCount < quiz.questions.length;
    
    const emoji = isGameOver ? '👾' : result.score >= 80 ? '🎉' : result.score >= 60 ? '👍' : '💪';
    const titleText = isGameOver ? 'GAME OVER! 👾' : `Skor: ${result.score}%`;
    const message = isGameOver 
      ? `Grid kamu penuh! Kamu berhasil menyelesaikan ${answeredCount} dari ${quiz.questions.length} soal.`
      : result.score >= 80 ? 'Keren banget!' : result.score >= 60 ? 'Lumayan bagus!' : 'Ayo belajar lagi!';

    return (
      <div className="text-center py-6">
        <div className="text-6xl mb-4 animate-bounce">{emoji}</div>
        <h3 className="text-3xl font-extrabold text-gray-900 font-heading mb-2">{titleText}</h3>
        <p className="text-lg text-gray-600 mb-2">{message}</p>
        <p className="text-primary-600 font-bold text-xl mb-6">+{result.earnedPoints} poin! 🌟</p>
        <div className="bg-gray-50 rounded-2xl p-4 text-left mb-6 max-h-60 overflow-y-auto">
          {quiz.questions.map((q2, i) => {
            const isAnswered = answers[i] !== null;
            const isCorrect = isAnswered && answers[i] === q2.correctAnswer;
            return (
              <div key={i} className={cn('flex items-start gap-2 py-2 text-sm', i > 0 && 'border-t border-gray-200')}>
                <span className="text-lg flex-shrink-0">{!isAnswered ? '⚪' : isCorrect ? '✅' : '❌'}</span>
                <div>
                  <p className="font-medium text-gray-700">{q2.text}</p>
                  {!isCorrect && isAnswered && <p className="text-xs text-emerald-600 mt-0.5">Jawaban benar: {q2.options[q2.correctAnswer]}</p>}
                  {!isAnswered && <p className="text-xs text-orange-500 mt-0.5">Belum sempat terjawab (kalah di block blast)</p>}
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={onClose} className="bocil-btn-primary w-full">Selesai ✨</button>
      </div>
    );
  }

  return (
    <div 
      ref={quizContainerRef} 
      className={cn(
        "w-full transition-colors",
        isFullscreen ? "h-screen w-screen overflow-y-auto bg-slate-50" : ""
      )}
    >
      {/* Stage 1: Block Blast mini game (if mode is enabled) */}
      {quiz.mode === 'block_blast' && (
        <div style={{ display: gameStage === 'block_blast' ? 'block' : 'none' }} className={isFullscreen ? "h-full w-full" : ""}>
          <BlockBlastGame
            onTriggerQuiz={() => setGameStage('quiz_question')}
            onGameOver={handleSubmit}
            activeQuestionIndex={step}
            totalQuestions={quiz.questions.length}
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
          />
        </div>
      )}

      {/* Stage 2: Standard/Active Quiz Question view */}
      <div 
        style={{ display: quiz.mode !== 'block_blast' || gameStage === 'quiz_question' ? 'block' : 'none' }}
        className={isFullscreen ? "p-6 sm:p-10 max-w-2xl mx-auto" : ""}
      >
        {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-primary-600">
          Soal {step + 1} / {quiz.questions.length}
        </span>
        <div className="flex gap-1">
          {quiz.questions.map((_, i) => (
            <div key={i} className={cn(
              'w-3 h-3 rounded-full transition-all',
              i === step ? 'bg-primary-500 scale-125' : answers[i] !== null ? 'bg-primary-200' : 'bg-gray-200'
            )} />
          ))}
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
        <div className="bg-gradient-to-r from-primary-400 to-teal-400 h-2 rounded-full transition-all duration-500" style={{ width: `${((step + 1) / quiz.questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="bg-gradient-to-br from-primary-50 to-teal-50 rounded-2xl p-5 mb-5 border border-primary-100">
        <p className="text-lg font-bold text-gray-800">❓ {q.text}</p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {q.options.map((opt, i) => {
          const letters = ['A', 'B', 'C', 'D'];
          const isSelected = answers[step] === i;
          
          // Inline feedback styles
          const isFeedbackActive = feedbackAnswer !== null;
          const isCorrect = i === q.correctAnswer;
          const isClickedIncorrect = isFeedbackActive && feedbackAnswer === i && !isCorrect;

          return (
            <button key={i} disabled={isFeedbackActive} onClick={() => {
              if (quiz.mode === 'block_blast') {
                handleAnswerWithFeedback(i);
              } else {
                handleAnswer(i);
              }
            }}
              className={cn(
                'w-full text-left px-4 py-3.5 rounded-2xl border-2 text-sm font-medium transition-all duration-200',
                isFeedbackActive
                  ? isCorrect
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md shadow-emerald-100 scale-[1.02]'
                    : isClickedIncorrect
                      ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-md shadow-rose-100 scale-[1.02]'
                      : 'border-gray-100 bg-white text-gray-400 opacity-50'
                  : isSelected
                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md shadow-primary-100 scale-[1.02]'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              )}>
              <span className={cn(
                'inline-flex items-center justify-center w-7 h-7 rounded-full mr-3 text-xs font-bold transition-colors',
                isFeedbackActive
                  ? isCorrect
                    ? 'bg-emerald-500 text-white'
                    : isClickedIncorrect
                      ? 'bg-rose-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  : isSelected
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-500'
              )}>{letters[i]}</span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Navigation (Only for normal mode - Block Blast progresses on feedback) */}
      {quiz.mode !== 'block_blast' && (
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="bocil-btn-secondary flex-1" disabled={isSubmitting}>
              ⬅️ Sebelumnya
            </button>
          )}
          {step < quiz.questions.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} className="bocil-btn-primary flex-1" disabled={answers[step] === null || isSubmitting}>
              Selanjutnya ➡️
            </button>
          ) : (
            <button onClick={handleSubmit} className="bocil-btn-primary flex-1" disabled={!allAnswered || isSubmitting}>
              {isSubmitting ? 'Mengirim... 🚀' : 'Kumpulkan! 🚀'}
            </button>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

const getShareText = (name: string, rank: number, score: number, attempts: number) => {
  const emoji = rank === 1 ? '👑🏆🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🛡️💪';
  const rankText = rank === 1 ? 'duduk di Singgasana Peringkat 1' : `meraih Peringkat ${rank} (Pejuang Tangguh)`;
  return encodeURIComponent(`Alhamdulillah! ${name} ${emoji} berhasil ${rankText} di Arena Pejuang Kuis AdzanChallenge! 🕌✨\n\n🎯 Skor Terbaik: ${score}%\n🔥 Percobaan: ${attempts}x\n\nYuk ikutan belajar ilmu agama sambil seru-seruan bareng teman-teman di masjid! 🕋📚`);
};

const generateShareImage = async (
  participantName: string,
  rank: number,
  score: number,
  attempts: number,
  avatarUrl: string | null = null,
  otherParticipants: { name: string; avatarUrl: string | null; rank: number }[] = [],
  mode: 'share' | 'download' = 'share'
) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920; // 9:16 story ratio
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let loadedAvatar: HTMLImageElement | null = null;
  if (avatarUrl) {
    try {
      loadedAvatar = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = avatarUrl;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Gagal memuat avatar'));
      });
    } catch (e) {
      console.log('Using default avatar text rendering as fallback:', e);
    }
  }

  // Load up to 16 other participants' avatar images, preserving correct rank order!
  const loadedOthers = await Promise.all(
    (otherParticipants || []).slice(0, 16).map(async (op) => {
      let img: HTMLImageElement | null = null;
      if (op.avatarUrl) {
        try {
          img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const temp = new Image();
            temp.crossOrigin = 'anonymous';
            temp.src = op.avatarUrl!;
            temp.onload = () => resolve(temp);
            temp.onerror = () => reject(new Error('Gagal'));
          });
        } catch (e) {
          console.log('Error loading avatar for', op.name, e);
        }
      }
      return { name: op.name, img, rank: op.rank };
    })
  );

  // 1. Draw Stretched Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, '#022c22'); // Dark emerald
  grad.addColorStop(0.5, '#064e3b'); // Warm deep forest emerald
  grad.addColorStop(1, '#022c22');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. Draw Stretched Background Image (Avatar Face) with high opacity but dark gradient overlay
  if (loadedAvatar) {
    ctx.save();
    // Stretch to fit height keeping ratio, center it
    const ratio = loadedAvatar.width / loadedAvatar.height;
    let w = 1080;
    let h = 1080 / ratio;
    if (h < 1920) {
      h = 1920;
      w = 1920 * ratio;
    }
    
    // Draw background image
    ctx.globalAlpha = 0.35; // high visibility
    ctx.drawImage(loadedAvatar, (1080 - w) / 2, (1920 - h) / 2, w, h);
    ctx.restore();

    // Dark radial gradient overlay in the center to make text and profile pop
    const radialGrad = ctx.createRadialGradient(540, 960, 200, 540, 960, 900);
    radialGrad.addColorStop(0, 'rgba(2, 44, 34, 0.4)'); // semi-transparent in center
    radialGrad.addColorStop(1, 'rgba(2, 44, 34, 0.95)'); // dark deep emerald at edges
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, 1080, 1920);
  }

  // 3. Draw Decorative lights/auras
  ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
  ctx.beginPath(); ctx.arc(540, 600, 480, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(234, 179, 8, 0.03)';
  ctx.beginPath(); ctx.arc(540, 600, 320, 0, Math.PI * 2); ctx.fill();

  // 4. Header Text (Shifted down slightly to prevent clipping by phone status bars or screen borders!)
  ctx.fillStyle = '#fef08a'; // Bright yellow
  ctx.font = '900 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🕌 ADZANCHALLENGE 🕌', 540, 210);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('ARENA PEJUANG KUIS', 540, 270);

  // 5. Draw Avatar or Large Initial Frame in Center
  const avatarCenterX = 540;
  const avatarCenterY = 560;
  const avatarRadius = 150;

  // Draw Glowing Aura around avatar (Color-coded based on Rank for elite gaming feel!)
  const auraGrad = ctx.createRadialGradient(avatarCenterX, avatarCenterY, avatarRadius - 10, avatarCenterX, avatarCenterY, avatarRadius + 40);
  let glowColor = 'rgba(52, 211, 153, 0.4)'; // Emerald for Rank 4+
  if (rank === 1) glowColor = 'rgba(234, 179, 8, 0.5)'; // Gold
  else if (rank === 2) glowColor = 'rgba(203, 213, 225, 0.5)'; // Silver
  else if (rank === 3) glowColor = 'rgba(180, 83, 9, 0.5)'; // Bronze

  auraGrad.addColorStop(0, glowColor);
  auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 45, 0, Math.PI * 2);
  ctx.fill();

  // Draw Circular Ring Border (Custom precious metals for Ranks 1, 2, 3!)
  let ringColor = '#10b981'; // Emerald for Rank 4+
  if (rank === 1) ringColor = '#eab308'; // Gold
  else if (rank === 2) ringColor = '#cbd5e1'; // Silver
  else if (rank === 3) ringColor = '#b45309'; // Bronze

  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 7, 0, Math.PI * 2);
  ctx.stroke();

  // Draw Rounded Clip Image
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
  ctx.clip();

  if (loadedAvatar) {
    ctx.drawImage(loadedAvatar, avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
  } else {
    const bgGrad = ctx.createLinearGradient(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarCenterX + avatarRadius, avatarCenterY + avatarRadius);
    let bgStart = '#059669', bgEnd = '#047857';
    if (rank === 1) { bgStart = '#eab308'; bgEnd = '#ca8a04'; }
    else if (rank === 2) { bgStart = '#cbd5e1'; bgEnd = '#94a3b8'; }
    else if (rank === 3) { bgStart = '#d97706'; bgEnd = '#b45309'; }

    bgGrad.addColorStop(0, bgStart);
    bgGrad.addColorStop(1, bgEnd);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);

    ctx.fillStyle = rank === 2 ? '#0f172a' : '#ffffff';
    ctx.font = '900 130px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(participantName.charAt(0).toUpperCase(), avatarCenterX, avatarCenterY);
  }
  ctx.restore();
  ctx.textBaseline = 'alphabetic'; // reset

  // 6. Draw Mahkota / Precious Floating Decor right above the avatar based on rank!
  if (rank === 1) {
    ctx.fillStyle = '#eab308';
    ctx.font = '95px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑', avatarCenterX, avatarCenterY - avatarRadius - 25);
  } else if (rank === 2) {
    ctx.font = '85px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🥈✨', avatarCenterX, avatarCenterY - avatarRadius - 25);
  } else if (rank === 3) {
    ctx.font = '85px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🥉✨', avatarCenterX, avatarCenterY - avatarRadius - 25);
  } else {
    ctx.font = '80px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚔️🔥', avatarCenterX, avatarCenterY - avatarRadius - 25);
  }

  // 7. Draw Senggol Chat Bubble next to Avatar
  const bubbleX = 640; // shifted left slightly to accommodate wider bubble
  const bubbleY = 400;
  const bubbleW = 370; // expanded width to prevent text overflow
  const bubbleH = 90;
  const bubbleRad = 20;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 4;
  
  ctx.beginPath();
  ctx.moveTo(bubbleX + bubbleRad, bubbleY);
  ctx.lineTo(bubbleX + bubbleW - bubbleRad, bubbleY);
  ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + bubbleRad);
  ctx.lineTo(bubbleX + bubbleW, bubbleY + bubbleH - bubbleRad);
  ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - bubbleRad, bubbleY + bubbleH);
  ctx.lineTo(bubbleX + 60, bubbleY + bubbleH);
  ctx.lineTo(bubbleX + 30, bubbleY + bubbleH + 30);
  ctx.lineTo(bubbleX + 45, bubbleY + bubbleH);
  ctx.lineTo(bubbleX + bubbleRad, bubbleY + bubbleH);
  ctx.quadraticCurveTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - bubbleRad);
  ctx.lineTo(bubbleX, bubbleY + bubbleRad);
  ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + bubbleRad, bubbleY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px sans-serif'; // safer, super crisp font size
  ctx.textAlign = 'center';
  const bubbleText = rank === 1 ? 'Peringkat 1 nih bos, senggol dong! 😎👑' : `Peringkat ${rank} nih bos, siap nyalip! 🚀⚔️`;
  ctx.fillText(bubbleText, bubbleX + bubbleW / 2, bubbleY + bubbleH / 2 + 8);

  // 8. Draw Kid's Name in Majestic Typography
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 80px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(participantName.toUpperCase(), 540, 840);

  const nameWidth = ctx.measureText(participantName.toUpperCase()).width;
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(540 - nameWidth / 2 - 20, 865);
  ctx.lineTo(540 + nameWidth / 2 + 20, 865);
  ctx.stroke();

  // 9. Draw Rank Title Badge pill
  const badgeText = rank === 1 ? '👑 RAJA UTAMA TAHTA ARENA 👑' : '💪 PEJUANG HEBAT ADZANCHALLENGE 💪';
  ctx.fillStyle = ringColor;
  ctx.font = '900 32px sans-serif';
  ctx.textAlign = 'center';
  
  const badgeW = ctx.measureText(badgeText).width + 60;
  const badgeH_pill = 64;
  const badgeX = 540 - badgeW / 2;
  const badgeY = 905;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(badgeX, badgeY, badgeW, badgeH_pill, 32) : ctx.rect(badgeX, badgeY, badgeW, badgeH_pill);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.fillText(badgeText, 540, badgeY + badgeH_pill / 2 + 10);

  // 10. Key Achievements Box
  const boxX = 140;
  const boxY = 1010;
  const boxW = 800;
  const boxH = 260;
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(boxX, boxY, boxW, boxH, 24) : ctx.rect(boxX, boxY, boxW, boxH);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SKOR TERBAIK', 360, boxY + 70);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 80px sans-serif';
  ctx.fillText(`${score}%`, 360, boxY + 180);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TOTAL MAIN', 720, boxY + 70);
  ctx.fillStyle = '#f87171';
  ctx.font = '900 80px sans-serif';
  ctx.fillText(`${attempts}x`, 720, boxY + 180);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(540, boxY + 30);
  ctx.lineTo(540, boxY + boxH - 30);
  ctx.stroke();

  // 11. Draw Lesehan Squad Carpet at Bottom (Footer area)
  const carpetX = 140;
  const carpetY = 1320;
  const carpetW = 800;
  const carpetH = 340; // taller to fit bubble and grid nicely

  ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(carpetX, carpetY, carpetW, carpetH, 28) : ctx.rect(carpetX, carpetY, carpetW, carpetH);
  ctx.fill();
  ctx.stroke();

  // Title inside Carpet
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SQUAD PEJUANG ARENA HARI INI 👥', 540, carpetY + 45);

  // Draw speech bubble for the squad (Optimized width to prevent any overflow!)
  const sqBubbleW = 660; // expanded to 660px for safety!
  const sqBubbleH = 65;
  const sqBubbleX = 540 - sqBubbleW / 2; // 210
  const sqBubbleY = carpetY + 70;
  const sqBubbleRad = 16;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(sqBubbleX, sqBubbleY, sqBubbleW, sqBubbleH, sqBubbleRad) : ctx.rect(sqBubbleX, sqBubbleY, sqBubbleW, sqBubbleH);
  ctx.fill();
  ctx.stroke();

  // Draw tiny indicator pointer tail pointing down towards the first chibi at row 1
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(sqBubbleX + 110, sqBubbleY + sqBubbleH);
  ctx.lineTo(sqBubbleX + 95, sqBubbleY + sqBubbleH + 15);
  ctx.lineTo(sqBubbleX + 125, sqBubbleY + sqBubbleH);
  ctx.fill();
  // draw an overlay line to hide borders
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(sqBubbleX + 108, sqBubbleY + sqBubbleH);
  ctx.lineTo(sqBubbleX + 127, sqBubbleY + sqBubbleH);
  ctx.stroke();

  // Draw Speech Bubble Text
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 17px sans-serif'; // slightly safer, extremely readable font size
  ctx.textAlign = 'center';
  
  let squadSpeech = 'Semangat pejuang hebat harian, pantang menyerah! 🚀🔥';
  if (rank === 1) {
    // Kartu milik Raja (Peringkat 1). Orang pertama di karpet adalah Peringkat 2.
    // Balon menunjuk ke Peringkat 2, jadi Peringkat 2 yang menantang sang Raja:
    squadSpeech = 'Awas ya Raja, peringkat 2 siap nyalip posisimu! 🥈⚔️';
  } else {
    // Kartu milik penantang (Peringkat 2, 3, 4+). Orang pertama di karpet adalah Sang Raja (Peringkat 1).
    // Balon menunjuk ke Sang Raja, jadi Sang Raja yang berbicara menyemangati mereka dari atas:
    if (rank === 2) {
      squadSpeech = 'Peringkat 2 hebat! Ayo kejar aku di puncak dingin! 👑🥶';
    } else if (rank === 3) {
      squadSpeech = 'Juara 3 mantap! Ayo terus ngegas ke puncak! 👑🚀✨';
    } else if (rank === 4) {
      squadSpeech = 'Peringkat 4 hebat! Jangan menyerah ke puncak! 👑🔥';
    } else {
      squadSpeech = 'Semangat belajarnya guys, ku tunggu di puncak! 👑⚡';
    }
  }
  ctx.fillText(squadSpeech, 540, sqBubbleY + sqBubbleH / 2 + 6);

  // Distribute other participants into rows of 8
  const maxPerRow = 8;
  const totalPejuang = loadedOthers.length;
  const rows: { name: string; img: HTMLImageElement | null; rank: number }[][] = [];
  
  for (let i = 0; i < totalPejuang; i += maxPerRow) {
    rows.push(loadedOthers.slice(i, i + maxPerRow));
  }

  const chibiColors = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];
  const avatarRad = 25;
  const spacing = 65;

  rows.forEach((rowAvatars, rowIndex) => {
    const rowY = carpetY + 175 + rowIndex * 90; // shifted down to fit bubble and text
    const rowCount = rowAvatars.length;
    const rowWidth = (rowCount - 1) * spacing + avatarRad * 2;
    const startX = 540 - rowWidth / 2 + avatarRad;

    rowAvatars.forEach((pData, index) => {
      const chibiX = startX + index * spacing;

      // Draw drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath(); ctx.arc(chibiX, rowY + 3, avatarRad + 2, 0, Math.PI * 2); ctx.fill();

      // Clip and draw photo
      ctx.save();
      ctx.beginPath();
      ctx.arc(chibiX, rowY, avatarRad, 0, Math.PI * 2);
      ctx.clip();

      if (pData.img) {
        ctx.drawImage(pData.img, chibiX - avatarRad, rowY - avatarRad, avatarRad * 2, avatarRad * 2);
      } else {
        ctx.fillStyle = chibiColors[(rowIndex * maxPerRow + index) % chibiColors.length];
        ctx.fillRect(chibiX - avatarRad, rowY - avatarRad, avatarRad * 2, avatarRad * 2);

        // draw initial text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pData.name.charAt(0).toUpperCase(), chibiX, rowY);
      }
      ctx.restore();
      ctx.textBaseline = 'alphabetic'; // reset

      // Draw neat ring border around each circle
      ctx.strokeStyle = pData.rank === 1 ? '#eab308' : 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = pData.rank === 1 ? 4 : 3;
      ctx.beginPath();
      ctx.arc(chibiX, rowY, avatarRad + 1, 0, Math.PI * 2);
      ctx.stroke();

      // Draw mini gold crown or silver/bronze medal above their circular head!
      if (pData.rank === 1) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👑', chibiX, rowY - avatarRad - 6);
      } else if (pData.rank === 2) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🥈', chibiX, rowY - avatarRad - 6);
      } else if (pData.rank === 3) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🥉', chibiX, rowY - avatarRad - 6);
      }

      // Draw little rank badge at bottom-right of avatar
      const badgeX = chibiX + 15;
      const badgeY = rowY + 15;
      const badgeRad = 11;

      // Drop shadow for badge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath(); ctx.arc(badgeX, badgeY + 1.5, badgeRad, 0, Math.PI * 2); ctx.fill();

      // Badge color based on rank
      if (pData.rank === 1) {
        ctx.fillStyle = '#eab308'; // Gold
      } else if (pData.rank === 2) {
        ctx.fillStyle = '#cbd5e1'; // Silver
      } else if (pData.rank === 3) {
        ctx.fillStyle = '#b45309'; // Bronze
      } else {
        ctx.fillStyle = '#065f46'; // Emerald
      }

      ctx.beginPath(); ctx.arc(badgeX, badgeY, badgeRad, 0, Math.PI * 2); ctx.fill();

      // Draw Rank text inside badge
      ctx.fillStyle = pData.rank === 2 ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`#${pData.rank}`, badgeX, badgeY);
      ctx.textBaseline = 'alphabetic'; // reset

      // Draw First Name elegantly below the circle!
      ctx.fillStyle = '#a7f3d0'; // soft emerald green for name
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      const firstName = pData.name.split(' ')[0];
      const displayName = firstName.length > 7 ? firstName.slice(0, 6) + '..' : firstName;
      ctx.fillText(displayName, chibiX, rowY + 41);
    });
  });

  // 12. App Footer Branding
  const brandX = 140;
  const brandY = 1690; // shifted down to keep perfect spacing
  const brandW = 800;
  const brandH = 120;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(brandX, brandY, brandW, brandH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.strokeRect(brandX, brandY, brandW, brandH);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Mari Ramaikan Masjid & Uji Ilmu Agama Kita! 🕌', 540, brandY + 50);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Dibuat di Aplikasi Adzan Masjid AdzanChallenge 🕋', 540, brandY + 95);

  // 13. Blob Export & Direct Image Save
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Prestasi_${participantName.replace(/\s+/g, '_')}_Peringkat_${rank}.jpg`;
    a.click();
    
    alert(`📸 KARTU PRESTASI BERHASIL DISIMPAN!\n\nAlhamdulillah, Gambar Kartu Prestasi super keren milik ${participantName} sudah berhasil diunduh ke galeri HP!\n\nSilakan langsung buka aplikasi WhatsApp Kakak, masuk ke menu Status, pilih gambar ini, dan klik KIRIM! 😉🚀`);
  }, 'image/jpeg', 0.95);
};

const copyToClipboardAndOpenWA = async (blob: Blob, name: string, rank: number, score: number, attempts: number) => {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);
      const shareText = getShareText(name, rank, score, attempts);
      window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
      alert('GAMBAR PRESTASI DISALIN! 📋\n\nGambar kuis kamu telah otomatis disalin ke clipboard.\n\nSilakan langsung masuk ke WhatsApp dan tekan PASTE (TEMPEL) di status atau obrolan chat kamu untuk mengirim gambarnya! 😉');
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Prestasi_${name.replace(/\s+/g, '_')}_Peringkat_${rank}.png`;
      a.click();
      const shareText = getShareText(name, rank, score, attempts);
      window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
      alert('Gambar Prestasi berhasil diunduh ke HP!\n\nSilakan lampirkan gambar tersebut secara manual di status WhatsApp kamu! 😉');
    }
  } catch (err) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Prestasi_${name.replace(/\s+/g, '_')}_Peringkat_${rank}.png`;
    a.click();
    const shareText = getShareText(name, rank, score, attempts);
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
    alert('Gambar Prestasi berhasil diunduh ke HP!\n\nSilakan lampirkan gambar tersebut secara manual di status WhatsApp kamu! 😉');
  }
};

const generateLeaderboardShareImage = (todayParticipants: any[], mode: 'share' | 'download' = 'share') => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920; // 9:16 story
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, '#0f172a'); // Dark slate-900
  grad.addColorStop(0.5, '#1e1b4b'); // Dark indigo-950
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Decorative lights/shapes
  ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
  ctx.beginPath(); ctx.arc(540, 200, 500, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(234, 179, 8, 0.03)';
  ctx.beginPath(); ctx.arc(540, 600, 400, 0, Math.PI * 2); ctx.fill();

  // Header text
  ctx.fillStyle = '#ef4444';
  ctx.font = '900 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚔️ ARENA BATTLE KUIS ⚔️', 540, 180);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 36px sans-serif';
  ctx.fillText('KLASEMEN PEJUANG HARI INI', 540, 245);

  const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(todayStr.toUpperCase(), 540, 300);

  // Draw divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(150, 350); ctx.lineTo(930, 350); ctx.stroke();

  // Draw Top 1 (The King)
  const king = todayParticipants[0];
  if (king) {
    ctx.fillStyle = 'rgba(234, 179, 8, 0.05)';
    ctx.fillRect(150, 390, 780, 260);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 6;
    ctx.strokeRect(150, 390, 780, 260);

    ctx.fillStyle = '#eab308';
    ctx.font = '80px sans-serif';
    ctx.fillText('👑', 270, 530);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#eab308';
    ctx.font = '900 32px sans-serif';
    ctx.fillText('SANG RAJA ARENA', 380, 455);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px sans-serif';
    ctx.fillText(king.nama.toUpperCase(), 380, 520);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`Skor: ${king.maxScore}%  |  Percobaan: ${king.powerLevel}x`, 380, 580);
  }

  // Draw Lesehan (Ranks 2-8)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#34d399';
  ctx.font = '900 36px sans-serif';
  ctx.fillText('🏆 BARISAN PEJUANG TANGGUH 🏆', 540, 730);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath(); ctx.moveTo(150, 770); ctx.lineTo(930, 770); ctx.stroke();

  let yOffset = 840;
  const listToDraw = todayParticipants.slice(1, 8); // show ranks 2 to 8

  listToDraw.forEach((p, idx) => {
    const rank = idx + 2;

    ctx.fillStyle = rank === 2 ? '#cbd5e1' : rank === 3 ? '#b45309' : '#334155';
    ctx.beginPath();
    ctx.arc(220, yOffset - 10, 35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`#${rank}`, 220, yOffset);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px sans-serif';
    ctx.fillText(p.nama, 300, yOffset);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#34d399';
    ctx.font = '900 34px sans-serif';
    ctx.fillText(`${p.maxScore}%`, 900, yOffset - 5);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`${p.powerLevel}x main`, 900, yOffset + 25);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, yOffset + 50);
    ctx.lineTo(930, yOffset + 50);
    ctx.stroke();

    yOffset += 115;
  });

  // Motivational Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'italic bold 32px sans-serif';
  ctx.fillText('"Tetap semangat belajar ilmu agama di Masjid! 🕌"', 540, 1690);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(150, 1740, 780, 100);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.strokeRect(150, 1740, 780, 100);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('Dibuat di Aplikasi Adzan Masjid AdzanChallenge 🕋', 540, 1800);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const file = new File([blob], `Klasemen_Arena_${new Date().toLocaleDateString('en-CA')}.jpg`, { type: 'image/jpeg' });
    
    if (mode === 'share' && window.isSecureContext && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
      }).catch(() => {
        copyLeaderboardToClipboardAndOpenWA(blob);
      });
    } else if (mode === 'share' && window.isSecureContext) {
      copyLeaderboardToClipboardAndOpenWA(blob);
    } else {
      const url = canvas.toDataURL('image/jpeg', 0.9);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Klasemen_Arena_${new Date().toLocaleDateString('en-CA')}.jpg`;
      a.click();
      if (mode === 'share') {
        alert('📸 GAMBAR KLASEMEN BERHASIL DISIMPAN KE GALERI HP!\n\nKarena Kakak sedang mencoba aplikasi ini melalui jaringan HTTP lokal (insecure context):\n1. Gambar papan klasemen lengkap telah diunduh ke HP Anda.\n2. Silakan buka aplikasi WhatsApp Anda secara manual.\n3. Pasang gambar klasemen yang baru terunduh ini di Status atau chat WhatsApp Kakak ya! 😉');
      }
    }
  }, 'image/jpeg', 0.9);
};

const copyLeaderboardToClipboardAndOpenWA = async (blob: Blob) => {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Masya Allah! Lihat klasemen pejuang kuis AdzanChallenge hari ini! 🕌🔥 (Tempel/Paste gambar klasemen yang sudah disalin di chat/status kamu ya!)')}`, '_blank');
      alert('GAMBAR KLASEMEN DISALIN! 📋\n\nGambar klasemen telah disalin ke clipboard.\n\nSilakan langsung masuk ke WhatsApp dan tekan PASTE (TEMPEL) di status atau obrolan chat kamu! 😉');
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Klasemen_Arena_${new Date().toLocaleDateString('en-CA')}.png`;
      a.click();
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Masya Allah! Lihat klasemen pejuang kuis hari ini! 🕌🔥')}`, '_blank');
      alert('Gambar Klasemen telah diunduh! Silakan lampirkan secara manual di WhatsApp kamu! 😉');
    }
  } catch (err) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Klasemen_Arena_${new Date().toLocaleDateString('en-CA')}.png`;
    a.click();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Masya Allah! Lihat klasemen pejuang kuis hari ini! 🕌🔥')}`, '_blank');
    alert('Gambar Klasemen telah diunduh! Silakan lampirkan secara manual di WhatsApp kamu! 😉');
  }
};

// ─── Main Bocil Quiz Page ─────────────────────────────────────────────────────
export const BocilQuiz: React.FC = () => {
  const { quizzes, quizAttempts, participants } = useApp();
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState(() => localStorage.getItem('bocil_id') || '');
  const [playing, setPlaying] = useState(false);
  const [resultPopup, setResultPopup] = useState<{ score: number; pts: number } | null>(null);
  const [shareTarget, setShareTarget] = useState<{ name: string; rank: number; score: number; attempts: number; avatarUrl: string | null } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('bocil_id');
    if (saved) setSelectedParticipant(saved);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [playing]);

  useEffect(() => {
    if (selectedQuiz) {
      window.scrollTo(0, 0);
    }
  }, [selectedQuiz]);

  useEffect(() => {
    const isModalOpen = !!(selectedQuiz && selectedParticipant && !playing);
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedQuiz, selectedParticipant, playing]);

  const activeQuizzes = quizzes.filter(q => q.isActive);
  const activeParticipants = participants.filter(p => p.status === 'aktif');

  const getAttemptCount = (quizId: string) => quizAttempts.filter(a => a.quizId === quizId).length;
  const getAvgScore = (quizId: string) => {
    const attempts = quizAttempts.filter(a => a.quizId === quizId);
    if (!attempts.length) return null;
    return Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length);
  };

  const startQuiz = () => {
    if (selectedQuiz && selectedParticipant) {
      setPlaying(true);
    }
  };

  if (playing && selectedQuiz) {
    return (
      <div className="bocil-page">
        <div className="max-w-2xl mx-auto">
          <div className="bocil-card">
            <div className="bocil-card-header mb-4">
              <h2 className="bocil-card-title">📝 {selectedQuiz.title}</h2>
            </div>
            <BocilQuizPlayer
              quiz={selectedQuiz}
              participantId={selectedParticipant}
              onDone={(score, pts) => setResultPopup({ score, pts })}
              onClose={() => { setPlaying(false); setSelectedQuiz(null); setSelectedParticipant(''); setResultPopup(null); }}
            />
          </div>
        </div>
      </div>
    );
  }

    const today = new Date().toLocaleDateString('en-CA');
    
    const hasAttemptedToday = (quizId: string) =>
      quizAttempts.some(a => 
        String(a.quizId) === String(quizId) && 
        String(a.participantId) === String(selectedParticipant) &&
        new Date(a.completedAt).toLocaleDateString('en-CA') === today &&
        a.earnedPoints > 0
      );

    const getBestScore = (quizId: string) => {
      const myAttempts = quizAttempts.filter(a => String(a.quizId) === String(quizId) && String(a.participantId) === String(selectedParticipant));
      if (myAttempts.length === 0) return null;
      return Math.max(...myAttempts.map(a => a.score));
    };

    return (
      <div className="bocil-page">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-heading mb-2">
            📖 Quiz Keislaman
          </h1>
          <p className="text-gray-500 text-base sm:text-lg">Dapatkan poin baru setiap hari! ✨</p>
        </div>
  
        {/* Select participant */}
        <div className="max-w-md mx-auto mb-8">
          <label className="block text-sm font-bold text-gray-700 mb-2">👤 Pilih Nama Kamu:</label>
          <select
            value={selectedParticipant}
            onChange={e => setSelectedParticipant(e.target.value)}
            className="bocil-select"
          >
            <option value="">Pilih nama...</option>
            {activeParticipants.map(p => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        </div>
  
        {/* Quiz Cards */}
        {activeQuizzes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Belum ada quiz aktif</h3>
            <p className="text-gray-400">Tunggu admin membuat quiz baru ya!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeQuizzes.map((quiz, i) => {
              const avg = getAvgScore(quiz.id);
              const totalAttempts = getAttemptCount(quiz.id);
              const doneToday = hasAttemptedToday(quiz.id);
              const best = getBestScore(quiz.id);
              const myTotalTries = quizAttempts.filter(a => String(a.quizId) === String(quiz.id) && String(a.participantId) === String(selectedParticipant)).length;
              
              let medal = null;
              if (best !== null) {
                if (best === 100) medal = { icon: '🥇', label: 'Sempurna!' };
                else if (best >= 80) medal = { icon: '🥈', label: 'Hebat!' };
                else if (best >= 60) medal = { icon: '🥉', label: 'Bagus!' };
              }
  
              return (
                <div key={quiz.id} className="bocil-quiz-card animate-fade-in relative overflow-hidden" style={{ animationDelay: `${i * 0.1}s` }}>
                  {medal && (
                    <div className="absolute -top-1 -right-1 bg-white shadow-md rounded-bl-2xl p-2 px-3 flex flex-col items-center border-b border-l border-gray-100 z-10">
                      <span className="text-2xl">{medal.icon}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{medal.label}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-start gap-3 mb-3 mt-2">
                    <div className="text-4xl">
                      {i === 0 ? '🕌' : i === 1 ? '📿' : '📚'}
                    </div>
                    <div className={cn(
                      "text-[9px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1",
                      quiz.mode === 'block_blast' 
                        ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                        : "bg-emerald-50 text-emerald-600 border-emerald-200"
                    )}>
                      <span>{quiz.mode === 'block_blast' ? '👾' : '📝'}</span>
                      {quiz.mode === 'block_blast' ? 'MODE BLOCK BLAST' : 'MODE BIASA'}
                    </div>
                  </div>
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-gray-900 font-heading text-lg leading-tight pr-2">{quiz.title}</h3>
                    {selectedParticipant && myTotalTries > 0 && (
                      <span className="text-[9px] font-black bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full whitespace-nowrap mt-1">
                        {myTotalTries}x COBA
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{quiz.description}</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-50 rounded-xl py-2 text-center">
                      <p className="text-base font-extrabold text-gray-800">{quiz.questions.length}</p>
                      <p className="text-[10px] text-gray-500">Soal</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl py-2 text-center">
                      <p className="text-base font-extrabold text-gray-800">{totalAttempts}</p>
                      <p className="text-[10px] text-gray-500">Dimainkan</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl py-2 text-center">
                      <p className="text-base font-extrabold text-gray-800">{avg !== null ? `${avg}%` : '-'}</p>
                      <p className="text-[10px] text-gray-500">Rata-rata</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedQuiz(quiz)}
                    disabled={!selectedParticipant}
                    className={cn(
                      'w-full py-3 rounded-xl font-bold text-sm transition-all duration-200',
                      !selectedParticipant 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : doneToday
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                          : 'bocil-btn-primary'
                    )}
                  >
                    {!selectedParticipant 
                      ? 'Pilih nama dulu 👆' 
                      : doneToday 
                        ? 'Sudah Selesai Hari Ini ✅' 
                        : 'Mulai Quiz 🚀'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

      {/* Daily Leaderboard - Battle Arena Style */}
      <div className="mt-16 mb-12">
        <div className="bg-slate-900 rounded-[32px] sm:rounded-[40px] p-4 sm:p-8 relative overflow-hidden shadow-2xl border-4 border-red-500/30">
          {/* Background effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full -mr-32 -mt-32 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-600/10 rounded-full -ml-24 -mb-24 animate-pulse" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
              <div className="text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-white font-heading flex items-center justify-center md:justify-start gap-3 italic tracking-tighter">
                  <span className="text-red-500 animate-bounce">⚔️</span> 
                  ARENA PEJUANG KUIS
                  <span className="text-red-500 animate-bounce">⚔️</span>
                </h2>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">Siapa yang paling tangguh hari ini?</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const today = new Date().toLocaleDateString('en-CA');
                    const sortedParticipants = participants
                      .filter(p => p.status === 'aktif')
                      .map(p => {
                        const todayAttempts = quizAttempts.filter(a => 
                          String(a.participantId) === String(p.id) && 
                          new Date(a.completedAt).toLocaleDateString('en-CA') === today
                        );
                        const todayPts = todayAttempts.reduce((sum, a) => sum + a.earnedPoints, 0);
                        const maxScore = todayAttempts.length > 0 ? Math.max(...todayAttempts.map(a => a.score)) : 0;
                        const powerLevel = todayAttempts.length;
                        return { ...p, todayPts, maxScore, powerLevel };
                      })
                      .filter(p => p.powerLevel > 0)
                      .sort((a, b) => b.powerLevel - a.powerLevel || b.maxScore - a.maxScore);

                    if (sortedParticipants.length > 0) {
                      generateLeaderboardShareImage(sortedParticipants);
                    } else {
                      alert("Belum ada pejuang aktif hari ini untuk dibagikan klasemennya! ⚔️");
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-1.5"
                >
                  📢 Bagikan Klasemen
                </button>
                <div className="bg-red-600 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse">
                   LIVE BATTLE 🔥
                </div>
              </div>
            </div>

            {(() => {
              const today = new Date().toLocaleDateString('en-CA');
              const arenaParticipants = participants
                .filter(p => p.status === 'aktif')
                .map(p => {
                  const todayAttempts = quizAttempts.filter(a => 
                    String(a.participantId) === String(p.id) && 
                    new Date(a.completedAt).toLocaleDateString('en-CA') === today
                  );
                  const todayPts = todayAttempts.reduce((sum, a) => sum + a.earnedPoints, 0);
                  const maxScore = todayAttempts.length > 0 ? Math.max(...todayAttempts.map(a => a.score)) : 0;
                  const powerLevel = todayAttempts.length;
                  return { ...p, todayPts, maxScore, powerLevel };
                })
                .filter(p => p.powerLevel > 0)
                .sort((a, b) => b.powerLevel - a.powerLevel || b.maxScore - a.maxScore)
                .slice(0, 17);

              if (arenaParticipants.length === 0) {
                return (
                  <div className="py-16 text-center bg-white/5 rounded-[40px] border-2 border-dashed border-white/10 w-full">
                    <span className="text-5xl block mb-4 animate-pulse">⚔️</span>
                    <p className="text-white/40 font-black italic uppercase tracking-widest">Arena masih sepi... Jadilah petarung pertama! 🔥</p>
                  </div>
                );
              }

              const king = arenaParticipants[0];
              const lesehanList = arenaParticipants.slice(1);

              return (
                <div className="space-y-12 w-full">
                  {/* Singgasana / Throne - Rank 1 */}
                  {king && (
                    <div className="flex flex-col items-center">
                      <div className="relative group bg-gradient-to-b from-yellow-500/10 via-amber-500/5 to-transparent border-4 border-yellow-500 p-6 sm:p-8 rounded-[40px] max-w-md w-full transition-all duration-300 flex flex-col items-center text-center throne-glow">
                        {/* Sparkle Floating Particles */}
                        <span className="particle-star text-yellow-300" style={{ left: '15%', bottom: '80px', animationDelay: '0s' }}>⭐</span>
                        <span className="particle-star text-amber-300" style={{ left: '80%', bottom: '150px', animationDelay: '0.8s' }}>✨</span>
                        <span className="particle-star text-yellow-400" style={{ left: '45%', bottom: '40px', animationDelay: '1.5s' }}>👑</span>
                        <span className="particle-star text-amber-400" style={{ left: '30%', bottom: '110px', animationDelay: '0.4s' }}>🌟</span>
                        <span className="particle-star text-yellow-200" style={{ left: '65%', bottom: '90px', animationDelay: '1.2s' }}>⭐</span>
                        
                        {/* Rank 1 Badge / Crown Icon (Positioned -top-5 with full bounce freedom!) */}
                        <div className="absolute -top-5 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 font-extrabold px-6 py-2 rounded-2xl shadow-lg border-2 border-yellow-300 text-xs sm:text-sm animate-bounce flex items-center gap-1.5 z-20">
                          👑 SANG RAJA ARENA KUIS 👑
                        </div>

                        {/* Avatar with golden glowing aura */}
                        <div className="relative mb-5 mt-2">
                          <div className="absolute inset-0 bg-yellow-400 rounded-full scale-150 opacity-20 animate-gentle-pulse" />
                          <div className="w-28 h-28 rounded-[36px] bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center text-5xl font-black text-white shadow-xl relative z-10 overflow-hidden border-4 border-yellow-300">
                            {king.avatar_url ? (
                              <img src={king.avatar_url} alt={king.nama} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            ) : (
                              king.nama.charAt(0)
                            )}
                          </div>
                        </div>

                        <h3 className="font-heading font-black text-2xl text-yellow-300 mb-1 drop-shadow-md">{king.nama}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Penguasa Singgasana Tahta 👑</p>

                        <div className="w-full space-y-4">
                          {/* Kekuatan Pejuang Display */}
                          <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl py-3 px-4 shadow-lg shadow-red-900/50 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <p className="text-[10px] font-black text-red-100 uppercase tracking-widest leading-none mb-1.5">Kekuatan Pejuang Hari Ini</p>
                            <p className="text-2xl font-black text-white leading-none tracking-tight">{king.powerLevel * 100} POWER</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-2xl p-3 border border-white/5">
                            <div className="text-center">
                              <span className="text-[9px] font-bold text-gray-400 uppercase leading-none block mb-1">Skor Terbaik</span>
                              <span className="text-base font-black text-emerald-300">{king.maxScore}%</span>
                            </div>
                            <div className="text-center border-l border-white/10">
                              <span className="text-[9px] font-bold text-gray-400 uppercase leading-none block mb-1">Percobaan</span>
                              <span className="text-base font-black text-red-400">{king.powerLevel}x</span>
                            </div>
                          </div>

                          {/* Share button */}
                          <button
                            onClick={() => setShareTarget({ name: king.nama, rank: 1, score: king.maxScore, attempts: king.powerLevel, avatarUrl: king.avatar_url || null })}
                            className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs shadow-md shadow-yellow-600/30"
                          >
                            📢 Bagikan Kehebatan Tahta
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lesehan - Ranks 2-17 */}
                  {lesehanList.length > 0 && (
                    <div className="bg-emerald-950/20 border-2 border-emerald-500/10 rounded-[32px] p-5 sm:p-8 relative overflow-hidden">
                      <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 to-transparent pointer-events-none" />
                      <h3 className="text-center font-black text-emerald-300 text-sm sm:text-base uppercase tracking-wider mb-6 flex items-center justify-center gap-2">
                        🕌 MAT LESEHAN TANGGUH (Peringkat 2 - 17) 👥
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {lesehanList.map((p, idx) => {
                          const rank = idx + 2;
                          const funnyQuotes = [
                            "Menatap tahta... 👀",
                            "Hampir terkejar! 🚀",
                            "Hormat Baginda! 🙇‍♂️",
                            "Sabar lesehan ☕",
                            "Mencari celah... 🕵️‍♂️",
                            "Semangat naik! 💪",
                            "Ayo kejar Raja! 🏃‍♂️",
                            "Duduk santuy 🛋️",
                            "Menunggu giliran ⏳",
                            "Pejuang subuh 🌅",
                            "Pantang mundur! 🛡️"
                          ];
                          const quote = funnyQuotes[idx % funnyQuotes.length];
                          
                          return (
                            <div 
                              key={p.id} 
                              className="group relative bg-white/5 border border-emerald-500/20 hover:border-emerald-500/50 p-4 rounded-[28px] transition-all duration-300 flex flex-col items-center text-center shadow-lg"
                            >
                              {/* Rank Badge */}
                              <div className={cn(
                                "absolute -top-3 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-md z-20",
                                rank === 2 ? "bg-slate-400 rotate-6" : rank === 3 ? "bg-amber-600 -rotate-6" : "bg-emerald-700 rotate-12"
                              )}>
                                #{rank}
                              </div>

                              {/* Cute Avatar Lesehan */}
                              <div className="relative mb-3 mt-1">
                                <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-emerald-600/30 to-emerald-800/30 flex items-center justify-center text-2xl font-black text-emerald-200 shadow-inner relative overflow-hidden border-2 border-emerald-500/30 group-hover:border-emerald-400/50 transition-colors">
                                  {p.avatar_url ? (
                                    <img src={p.avatar_url} alt={p.nama} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                  ) : (
                                    p.nama.charAt(0)
                                  )}
                                </div>
                              </div>

                              <h4 className="font-extrabold text-white text-sm truncate w-full mb-0.5">{p.nama}</h4>
                              <p className="text-[10px] text-emerald-400 font-bold mb-2 animate-pulse">{quote}</p>

                              <div className="w-full space-y-2 mt-auto">
                                <div className="bg-emerald-950/50 border border-emerald-500/10 rounded-xl p-1.5 flex justify-around text-[10px]">
                                  <div>
                                    <span className="text-gray-400 block text-[8px] uppercase font-bold">Skor</span>
                                    <span className="font-extrabold text-emerald-300">{p.maxScore}%</span>
                                  </div>
                                  <div className="w-px bg-white/5" />
                                  <div>
                                    <span className="text-gray-400 block text-[8px] uppercase font-bold">Main</span>
                                    <span className="font-extrabold text-red-400">{p.powerLevel}x</span>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => setShareTarget({ name: p.nama, rank, score: p.maxScore, attempts: p.powerLevel, avatarUrl: p.avatar_url || null })}
                                  className="w-full py-1.5 bg-emerald-700/50 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all text-[9px] flex items-center justify-center gap-1"
                                >
                                  📢 Bagikan
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Recent Quiz Results */}
      {quizAttempts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 font-heading mb-4">🏆 Hasil Quiz Terbaru</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quizAttempts.slice(0, 6).map((attempt, i) => {
              const p = participants.find(x => x.id === attempt.participantId);
              const q = quizzes.find(x => x.id === attempt.quizId);
              const emoji = attempt.score >= 80 ? '🌟' : attempt.score >= 60 ? '👍' : '💪';
              return (
                <div key={attempt.id} className="bocil-result-card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-gray-800 truncate">{p?.nama ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-400 truncate">{q?.title ?? 'Unknown'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn('text-lg font-extrabold', attempt.score >= 70 ? 'text-emerald-600' : 'text-orange-500')}>
                        {attempt.score}%
                      </p>
                      <p className="text-xs text-primary-600 font-bold">+{attempt.earnedPoints}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quiz Selection Modal */}
      {selectedQuiz && selectedParticipant && !playing && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedQuiz(null)}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📝</div>
              <h3 className="text-xl font-bold text-gray-900 font-heading mb-1">{selectedQuiz.title}</h3>
              <p className="text-sm text-gray-500">{selectedQuiz.questions.length} soal • {selectedQuiz.description}</p>
            </div>
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-center mb-6">
              <p className="text-sm text-primary-700 font-medium">
                Bermain sebagai: <span className="font-bold">{activeParticipants.find(p => String(p.id) === String(selectedParticipant))?.nama}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelectedQuiz(null)} className="bocil-btn-secondary flex-1">Batal</button>
              <button onClick={() => setPlaying(true)} className="bocil-btn-primary flex-1">Mulai! 🚀</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Share Achievement Modal */}
      {shareTarget && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShareTarget(null)}>
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl shadow-2xl p-6 max-w-sm w-full animate-fade-in text-white text-center" onClick={e => e.stopPropagation()}>
            <div className="text-right">
              <button onClick={() => setShareTarget(null)} className="text-gray-400 hover:text-white text-xl font-bold">&times;</button>
            </div>
            
            <div className="mb-6">
              <span className="text-5xl block mb-2">{shareTarget.rank === 1 ? '👑' : '🏆'}</span>
              <h3 className="text-xl font-black text-yellow-400 font-heading">KARTU PRESTASI</h3>
              <p className="text-gray-400 text-xs mt-1">Siap bagikan ke Status WA, IG Stories, atau TikTok!</p>
            </div>

            {/* Achievement Preview Card (Visual mockup of the share card) */}
            <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 border-2 border-emerald-500 rounded-2xl p-5 text-center mb-6 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full -mr-12 -mt-12 blur-xl" />
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">ADZANCHALLENGE ARENA</p>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-2xl font-bold mx-auto my-3 border-2 border-yellow-300">
                {shareTarget.rank === 1 ? '👑' : `#${shareTarget.rank}`}
              </div>
              <h4 className="font-extrabold text-lg truncate px-2">{shareTarget.name}</h4>
              <p className="text-xs text-yellow-300 font-bold uppercase tracking-wider mt-1 px-1">
                {shareTarget.rank === 1 ? '👑 RAJA UTAMA TAHTA ARENA 👑' : '💪 PEJUANG HEBAT 💪'}
              </p>
              <div className="flex justify-around mt-4 pt-3 border-t border-white/10 text-xs">
                <div>
                  <p className="text-gray-400 text-[10px] uppercase">Best Skor</p>
                  <p className="font-black text-sm text-emerald-300">{shareTarget.score}%</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase">Percobaan</p>
                  <p className="font-black text-sm text-red-400">{shareTarget.attempts}x</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  const today = new Date().toLocaleDateString('en-CA');
                  const arenaParticipants = participants
                    .filter(p => p.status === 'aktif')
                    .map(p => {
                      const todayAttempts = quizAttempts.filter(a => 
                        String(a.participantId) === String(p.id) && 
                        new Date(a.completedAt).toLocaleDateString('en-CA') === today
                      );
                      const todayPts = todayAttempts.reduce((sum, a) => sum + a.earnedPoints, 0);
                      const maxScore = todayAttempts.length > 0 ? Math.max(...todayAttempts.map(a => a.score)) : 0;
                      const powerLevel = todayAttempts.length;
                      return { ...p, todayPts, maxScore, powerLevel };
                    })
                    .filter(p => p.powerLevel > 0)
                    .sort((a, b) => b.powerLevel - a.powerLevel || b.maxScore - a.maxScore);

                  const mappedArena = arenaParticipants.map((p, idx) => ({
                    name: p.nama,
                    avatarUrl: p.avatar_url || null,
                    rank: idx + 1
                  }));

                  let list = mappedArena.filter(p => p.name !== shareTarget.name);

                  if (list.length < 16) {
                    const remaining = participants
                      .filter(p => p.nama !== shareTarget.name && !list.some(l => l.name === p.nama))
                      .map((p, idx) => ({
                        name: p.nama,
                        avatarUrl: p.avatar_url || null,
                        rank: arenaParticipants.length + 1 + idx
                      }));
                    list = [...list, ...remaining];
                  }
                  const otherParticipants = list.slice(0, 16);

                  generateShareImage(shareTarget.name, shareTarget.rank, shareTarget.score, shareTarget.attempts, shareTarget.avatarUrl, otherParticipants, 'download');
                }} 
                className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-900/30 text-sm tracking-wide"
              >
                📸 SIMPAN KARTU PRESTASI KE HP
              </button>
              
              <button 
                onClick={() => {
                  const text = decodeURIComponent(getShareText(shareTarget.name, shareTarget.rank, shareTarget.score, shareTarget.attempts));
                  navigator.clipboard.writeText(text);
                  alert("Teks status berhasil disalin! Tinggal paste di SW, IG, atau TikTok kamu ya! 😉");
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-xl transition-all"
              >
                📋 Salin Teks Status Keren
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
