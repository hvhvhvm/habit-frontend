import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function FocusPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const habit = location.state?.habit;
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

  useEffect(() => {
    if (!habit || !habit.is_session) {
      navigate("/habits", { replace: true });
    }
  }, [habit, navigate]);

  const logSessionComplete = async () => {
    if (!habit || !token) return;
    try {
      await fetch("https://habit-backend-v3gv.onrender.com//logs", {
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
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isRunning || isComplete) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime > 1) {
          return previousTime - 1;
        }

        if (!isBreak) {
          window.setTimeout(logSessionComplete, 0);

          if (breakSeconds === 0) {
            if (currentSession < totalSessions) {
              setCurrentSession((previousSession) => previousSession + 1);
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
          setCurrentSession((previousSession) => previousSession + 1);
          setIsBreak(false);
          return focusSeconds;
        }

        setIsRunning(false);
        setIsComplete(true);
        setIsBreak(false);
        return 0;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakSeconds, currentSession, focusSeconds, isBreak, isComplete, isRunning, totalSessions]);

  const handlePauseResume = () => {
    setIsRunning((previous) => !previous);
  };

  const handleCompleteSession = () => {
    logSessionComplete();

    if (breakSeconds === 0) {
      if (currentSession < totalSessions) {
        setCurrentSession((previous) => previous + 1);
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
      setCurrentSession((previous) => previous + 1);
      setIsBreak(false);
      setTimeLeft(focusSeconds);
    } else {
      setIsRunning(false);
      setIsComplete(true);
      setIsBreak(false);
      setTimeLeft(0);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsBreak(false);
    setCurrentSession(1);
    setTimeLeft(focusSeconds);
    setIsComplete(false);
    navigate("/habits");
  };

  const handleRestartSession = () => {
    setTimeLeft(isBreak ? breakSeconds : focusSeconds);
  };

  if (!habit) {
    return null;
  }

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
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#151824',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          border: '1px solid #23283c',
          color: '#ffffff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 10px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Focus Session</h2>
          <button onClick={handleStop} style={{ background: 'none', border: 'none', color: '#8c90a4', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 24px 24px' }}>
          
          <p style={{ color: '#8c90a4', fontSize: '0.9rem', margin: '0 0 16px', fontWeight: 500 }}>
            {currentSession - 1} / {totalSessions} sessions completed
          </p>

          <div style={{ 
            width: '48px', height: '48px', 
            background: '#1e2235', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem'
          }}>
            ⏱️
          </div>

          <h3 style={{ margin: '16px 0 4px', fontSize: '1.3rem', fontWeight: 600 }}>{habit.title}</h3>
          <p style={{ margin: 0, color: '#bdc1d3', fontSize: '0.9rem' }}>
            {isBreak ? `${habit.break_time} minute break` : `${habit.focus_time} minute session`}
          </p>

          <div style={{ 
            width: '240px', height: '240px', 
            border: '12px solid #23283c', borderRadius: '50%', 
            margin: '36px auto', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '4.5rem', fontWeight: 700,
            color: isBreak ? '#4fabff' : '#ffffff',
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.2)'
          }}>
            {formatTime(timeLeft)}
          </div>

          {!isComplete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '10px 0 32px' }}>
              <button 
                onClick={handleRestartSession} 
                style={{ 
                  width: '50px', height: '50px', borderRadius: '50%', 
                  background: '#23283c', border: 'none', color: '#fff', 
                  cursor: 'pointer', fontSize: '1.2rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
              >
                ↺
              </button>
              
              <button 
                onClick={handlePauseResume} 
                style={{ 
                  width: '76px', height: '76px', borderRadius: '50%', 
                  background: isBreak ? 'linear-gradient(135deg, #4fabff 0%, #1e88e5 100%)' : 'linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%)',
                  border: 'none', color: '#fff', cursor: 'pointer', 
                  fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isBreak ? '0 8px 24px rgba(79, 171, 255, 0.4)' : '0 8px 24px rgba(217, 70, 239, 0.4)',
                  transition: 'transform 0.1s'
                }}
              >
                {isRunning ? '⏸' : '▶'}
              </button>

              <button 
                onClick={isBreak ? handleSkipBreak : handleCompleteSession} 
                style={{ 
                  width: '50px', height: '50px', borderRadius: '50%', 
                  background: '#23283c', border: 'none', color: '#fff', 
                  cursor: 'pointer', fontSize: '1.2rem',
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
            padding: '16px 20px', borderRadius: '12px', border: '1px solid #362947', 
            color: '#d8b4fe', fontSize: '0.95rem',
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

export default FocusPage;
