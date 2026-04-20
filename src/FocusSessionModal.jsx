import { useEffect, useState } from "react";
import { apiUrl } from "./api";

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function FocusSessionModal({ habit, onClose, onSessionComplete }) {
  const token = localStorage.getItem("token");

  const focusSeconds = (Number(habit?.focus_time) || 0) * 60;
  const breakSeconds = (Number(habit?.break_time) || 0) * 60;
  const totalSessions = Number(habit?.total_sessions) || 1;
  const completedSessions = Number(habit?.completed_today_value) || 0;
  
  const startSession = Math.min(completedSessions + 1, totalSessions);
  const isAlreadyComplete = completedSessions >= totalSessions;

  const [timeLeft, setTimeLeft] = useState(isAlreadyComplete ? 0 : focusSeconds);
  const [currentSession, setCurrentSession] = useState(startSession);
  const [isBreak, setIsBreak] = useState(false);
  const [isRunning, setIsRunning] = useState(!isAlreadyComplete);
  const [isComplete, setIsComplete] = useState(isAlreadyComplete);

  const logSessionComplete = async () => {
    if (!habit || !token) return;
    try {
      await fetch(apiUrl("/logs"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          habit_id: habit.id,
          value_completed: 1
        })
      });
      if (onSessionComplete) onSessionComplete();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isRunning || isComplete) return undefined;

    const timerId = window.setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime > 1) return previousTime - 1;

        if (!isBreak) {
          window.setTimeout(logSessionComplete, 0);

          if (breakSeconds === 0) {
            if (currentSession < totalSessions) {
              setCurrentSession((prev) => prev + 1);
              return focusSeconds;
            }
            setIsRunning(false);
            setIsComplete(true);
            return 0;
          }

          setIsBreak(true);
          return breakSeconds;
        }

        if (currentSession < totalSessions) {
          setCurrentSession((prev) => prev + 1);
          setIsBreak(false);
          return focusSeconds;
        }

        setIsRunning(false);
        setIsComplete(true);
        setIsBreak(false);
        return 0;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakSeconds, currentSession, focusSeconds, isBreak, isComplete, isRunning, totalSessions]);

  const handlePauseResume = () => setIsRunning((prev) => !prev);

  const handleCompleteSession = () => {
    logSessionComplete();

    if (breakSeconds === 0) {
      if (currentSession < totalSessions) {
        setCurrentSession((prev) => prev + 1);
        setTimeLeft(focusSeconds);
      } else {
        setIsRunning(false);
        setIsComplete(true);
        setTimeLeft(0);
      }
    } else {
      setIsBreak(true);
      setTimeLeft(breakSeconds);
    }
  };

  const handleSkipBreak = () => {
    if (currentSession < totalSessions) {
      setCurrentSession((prev) => prev + 1);
      setIsBreak(false);
      setTimeLeft(focusSeconds);
    } else {
      setIsRunning(false);
      setIsComplete(true);
      setIsBreak(false);
      setTimeLeft(0);
    }
  };

  const handleRestartSession = () => {
    setTimeLeft(isBreak ? breakSeconds : focusSeconds);
  };

  const handleStop = () => {
    setIsRunning(false);
    onClose();
  };

  if (!habit) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#151824',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          border: '1px solid #23283c',
          color: '#ffffff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 4px' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>Focus Session</h2>
          <button onClick={handleStop} style={{ background: 'none', border: 'none', color: '#8c90a4', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 20px 20px' }}>
          
          <p style={{ color: '#8c90a4', fontSize: '0.85rem', margin: '0 0 12px', fontWeight: 500 }}>
            {currentSession - 1} / {totalSessions} sessions completed
          </p>

          <div style={{ 
            width: '40px', height: '40px', 
            background: '#1e2235', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem'
          }}>
            ⏱️
          </div>

          <h3 style={{ margin: '12px 0 4px', fontSize: '1.2rem', fontWeight: 600 }}>{habit.title}</h3>
          <p style={{ margin: 0, color: '#bdc1d3', fontSize: '0.85rem' }}>
            {isBreak ? `${habit.break_time} minute break` : `${habit.focus_time} minute session`}
          </p>

          <div style={{ 
            width: '200px', height: '200px', 
            border: '6px solid #23283c', borderRadius: '50%', 
            margin: '24px auto', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3.2rem', fontWeight: 700,
            color: isBreak ? '#4fabff' : '#ffffff',
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            {/* Pink dot to match the design */}
            <div style={{
              position: 'absolute',
              top: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '6px',
              height: '6px',
              backgroundColor: '#d946ef',
              borderRadius: '50%'
            }} />
            {formatTime(timeLeft)}
          </div>

          {!isComplete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0 24px' }}>
              <button 
                onClick={handleRestartSession} 
                style={{ 
                  width: '44px', height: '44px', borderRadius: '50%', 
                  background: '#23283c', border: 'none', color: '#fff', 
                  cursor: 'pointer', fontSize: '1.1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
              >
                ↺
              </button>
              
              <button 
                onClick={handlePauseResume} 
                style={{ 
                  width: '64px', height: '64px', borderRadius: '50%', 
                  background: isBreak ? 'linear-gradient(135deg, #4fabff 0%, #1e88e5 100%)' : 'linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%)',
                  border: 'none', color: '#fff', cursor: 'pointer', 
                  fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isBreak ? '0 6px 18px rgba(79, 171, 255, 0.4)' : '0 6px 18px rgba(217, 70, 239, 0.4)',
                  transition: 'transform 0.1s'
                }}
              >
                {isRunning ? '⏸' : '▶'}
              </button>

              <button 
                onClick={isBreak ? handleSkipBreak : handleCompleteSession} 
                style={{ 
                  width: '44px', height: '44px', borderRadius: '50%', 
                  background: '#23283c', border: 'none', color: '#fff', 
                  cursor: 'pointer', fontSize: '1.1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
              >
                ⏭
              </button>
            </div>
          ) : (
            <div style={{ margin: '10px 0 32px' }}>
              <button
                onClick={handleStop}
                style={{
                  background: '#23283c', color: '#fff', border: 'none',
                  borderRadius: '999px', padding: '14px 28px', fontSize: '1.1rem',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Close Session
              </button>
            </div>
          )}

          <div style={{ 
            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.1) 0%, rgba(217, 70, 239, 0.1) 100%)', 
            padding: '12px 16px', borderRadius: '12px', border: '1px solid #362947', 
            color: '#d8b4fe', fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', gap: '8px', 
            width: '100%', boxSizing: 'border-box', justifyContent: 'center'
          }}>
            <span>💡</span> 
            <span>Focus fully on your habit. No distractions!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
