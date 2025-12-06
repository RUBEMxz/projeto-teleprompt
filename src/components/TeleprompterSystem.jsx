import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Clock, Maximize2, Timer } from 'lucide-react';

export default function TeleprompterSystem() {
  const [text, setText] = useState('Cole seu texto aqui ou comece a digitar...\n\nO teleprompter irá rolar automaticamente quando você pressionar Play.\n\nUse os controles abaixo para ajustar a velocidade, tamanho da fonte e outras configurações.\n\nVocê também pode rolar manualmente com o scroll do mouse a qualquer momento!');
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const [fontSize, setFontSize] = useState(32);
  const [showSettings, setShowSettings] = useState(false);
  const [time, setTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#ffffff');
  const [timerColor, setTimerColor] = useState('#60a5fa');
  const [mirror, setMirror] = useState(false);
  const [timerMode, setTimerMode] = useState('stopwatch');
  const [countdownMinutes, setCountdownMinutes] = useState(5);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [initialCountdownTime, setInitialCountdownTime] = useState(300);
  
  // Posição do cronômetro dentro do preview/teleprompter (em pixels)
  const [timerPosition, setTimerPosition] = useState({ left: 24, top: 16 });
  // Orientação da tela do teleprompter: 'horizontal' ou 'vertical'
  const [orientation, setOrientation] = useState('horizontal');
  const textRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const teleprompterWindowRef = useRef(null);
  const broadcastChannel = useRef(null);
  const timerRef = useRef(null);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Inicializar canal de comunicação entre janelas
  useEffect(() => {
    broadcastChannel.current = new BroadcastChannel('teleprompter_channel');

    broadcastChannel.current.onmessage = (event) => {
      const { type, data } = event.data;

      if (type === 'sync_state') {
        // Ao receber pedido de sincronização, enviamos o estado completo
        broadcastChannel.current.postMessage({
          type: 'state_update',
          data: {
            text,
            isPlaying,
            scrollSpeed,
            fontSize,
            time,
            isTimerRunning,
            backgroundColor,
            textColor,
            timerColor,
            mirror,
            timerMode,
            initialCountdownTime,
            timerPosition,
            orientation,
          },
        });
      }

      if (type === 'timer_moved' && data) {
        // A popup moveu o cronômetro — atualizamos a posição aqui e reenviamos estado
        const { left, top } = data;
        setTimerPosition({ left, top });
        if (broadcastChannel.current) {
          broadcastChannel.current.postMessage({
            type: 'state_update',
            data: {
              text,
              isPlaying,
              scrollSpeed,
              fontSize,
              time,
              isTimerRunning,
              backgroundColor,
              textColor,
              timerColor,
              mirror,
              timerMode,
              initialCountdownTime,
              timerPosition: { left, top },
              orientation,
            },
          });
        }
      }
    };

    return () => {
      if (broadcastChannel.current) {
        broadcastChannel.current.close();
      }
    };
  }, [text, isPlaying, scrollSpeed, fontSize, time, isTimerRunning, backgroundColor, textColor, timerColor, mirror, timerMode, initialCountdownTime, timerPosition, orientation]);

  // Sincronizar mudanças com a janela do teleprompter
  useEffect(() => {
    if (broadcastChannel.current) {
      broadcastChannel.current.postMessage({
        type: 'state_update',
        data: {
          text,
          isPlaying,
          scrollSpeed,
          fontSize,
          time,
          isTimerRunning,
          backgroundColor,
          textColor,
          timerColor,
          mirror,
          timerMode,
          initialCountdownTime,
          timerPosition,
          orientation
        }
      });
    }
  }, [text, isPlaying, scrollSpeed, fontSize, time, isTimerRunning, backgroundColor, textColor, timerColor, mirror, timerMode, initialCountdownTime, timerPosition, orientation]);

  // Controlar rolagem automática
  useEffect(() => {
    if (isPlaying) {
      scrollIntervalRef.current = setInterval(() => {
        if (textRef.current) {
          textRef.current.scrollTop += scrollSpeed;
        }
      }, 50);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isPlaying, scrollSpeed]);

  // Controlar timer
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTime(t => {
          if (timerMode === 'countdown') {
            const newTime = t - 1;
            if (newTime <= 0) {
              setIsTimerRunning(false);
              setIsPlaying(false);
              return 0;
            }
            return newTime;
          }
          return t + 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timerMode]);

  // Funções auxiliares
  const formatTime = (seconds) => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const hrs = Math.floor(absSeconds / 3600);
    const mins = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;
    return `${isNegative ? '-' : ''}${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    setIsTimerRunning(!isTimerRunning);
  };

  const resetScroll = () => {
    if (textRef.current) {
      textRef.current.scrollTop = 0;
    }
    if (timerMode === 'countdown') {
      setTime(initialCountdownTime);
    } else {
      setTime(0);
    }
    setIsPlaying(false);
    setIsTimerRunning(false);
  };

  const applyCountdownTime = () => {
    const totalSeconds = (countdownMinutes * 60) + countdownSeconds;
    setInitialCountdownTime(totalSeconds);
    setTime(totalSeconds);
  };

  const setManualTime = (hours, minutes, seconds) => {
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    setTime(totalSeconds);
  };

  // Drag handlers para o cronômetro no preview
  const onTimerMouseDown = (e) => {
    if (!timerRef.current) return;
    draggingRef.current = true;
    const rect = timerRef.current.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    window.addEventListener('mousemove', onTimerMouseMove);
    window.addEventListener('mouseup', onTimerMouseUp);
  };

  const onTimerMouseMove = (e) => {
    if (!draggingRef.current || !timerRef.current) return;
    const containerRect = timerRef.current.parentElement.getBoundingClientRect();
    const left = Math.max(
      0,
      Math.min(
        containerRect.width - timerRef.current.offsetWidth,
        e.clientX - containerRect.left - dragOffsetRef.current.x
      )
    );
    const top = Math.max(
      0,
      Math.min(
        containerRect.height - timerRef.current.offsetHeight,
        e.clientY - containerRect.top - dragOffsetRef.current.y
      )
    );
    setTimerPosition({ left, top });
  };

  const onTimerMouseUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    window.removeEventListener('mousemove', onTimerMouseMove);
    window.removeEventListener('mouseup', onTimerMouseUp);
    // enviar posição para a popup (apenas as coordenadas)
    if (broadcastChannel.current) {
      broadcastChannel.current.postMessage({ type: 'timer_moved', data: timerPosition });
    }
  };

  const openTeleprompterWindow = () => {
    const width = orientation === 'vertical' ? 1080 : 1920;
    const height = orientation === 'vertical' ? 1920 : 1080;
    const left = window.screen.availLeft + Math.max(0, Math.floor((window.screen.availWidth - width) / 2));
    const top = window.screen.availTop;

    const features = `width=${width},height=${height},left=${left},top=${top}`;
    teleprompterWindowRef.current = window.open('about:blank', 'TeleprompterWindow', features);
    
    if (teleprompterWindowRef.current) {
      teleprompterWindowRef.current.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Teleprompter</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              overflow: hidden; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            #teleprompter-container {
              width: 100vw;
              height: 100vh;
              position: relative;
              overflow: hidden;
            }
            #text-container {
              width: 100%;
              height: 100%;
              overflow-y: auto;
              padding: 3rem;
              cursor: default;
            }
            #text-content {
              max-width: 1200px;
              margin: 0 auto;
              white-space: pre-wrap;
              line-height: 1.8;
            }
            #spacer {
              height: 100vh;
            }
            #timer-display {
              position: absolute;
              top: 2rem;
              right: 2rem;
              z-index: 10;
              background: rgba(0, 0, 0, 0.7);
              backdrop-filter: blur(10px);
              padding: 1.5rem 2rem;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              gap: 1rem;
            }
            #timer-icon {
              width: 32px;
              height: 32px;
            }
            #timer-text {
              font-size: 3rem;
              font-family: 'Courier New', monospace;
              font-weight: bold;
              letter-spacing: 0.1em;
            }
            /* guia removida (linha vermelha) */
            ::-webkit-scrollbar {
              width: 8px;
            }
            ::-webkit-scrollbar-track {
              background: transparent;
            }
            ::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.3);
            }
          </style>
        </head>
        <body>
          <div id="teleprompter-container">
            <div id="timer-display">
              <svg id="timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span id="timer-text">00:00:00</span>
            </div>
            <div id="text-container">
              <div id="text-content"></div>
              <div id="spacer"></div>
            </div>
            <!-- linha guia removida -->
          </div>
          <script>
            const channel = new BroadcastChannel('teleprompter_channel');
            const textContainer = document.getElementById('text-container');
            const textContent = document.getElementById('text-content');
            const timerDisplay = document.getElementById('timer-display');
            const timerText = document.getElementById('timer-text');
            const container = document.getElementById('teleprompter-container');
            
            let scrollInterval = null;
            // Drag support inside popup
            let draggingTimer = false;
            let offsetX = 0;
            let offsetY = 0;
            // Inicializa estilo do timer para permitir posicionamento absoluto
            if (timerDisplay) {
              timerDisplay.style.position = 'absolute';
              timerDisplay.style.left = '32px';
              timerDisplay.style.top = '16px';
              timerDisplay.style.cursor = 'move';
            }

            function onMouseMove(e) {
              if (!draggingTimer) return;
              const containerRect = container.getBoundingClientRect();
              const left = Math.max(0, Math.min(containerRect.width - timerDisplay.offsetWidth, e.clientX - containerRect.left - offsetX));
              const top = Math.max(0, Math.min(containerRect.height - timerDisplay.offsetHeight, e.clientY - containerRect.top - offsetY));
              timerDisplay.style.left = left + 'px';
              timerDisplay.style.top = top + 'px';
            }

            function onMouseUp() {
              if (!draggingTimer) return;
              draggingTimer = false;
              document.removeEventListener('mousemove', onMouseMove);
              document.removeEventListener('mouseup', onMouseUp);
              const left = parseInt(timerDisplay.style.left || 0);
              const top = parseInt(timerDisplay.style.top || 0);
              channel.postMessage({ type: 'timer_moved', data: { left, top } });
            }

            if (timerDisplay) {
              timerDisplay.addEventListener('mousedown', (e) => {
                draggingTimer = true;
                const r = timerDisplay.getBoundingClientRect();
                offsetX = e.clientX - r.left;
                offsetY = e.clientY - r.top;
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
              });
            }
            
            channel.postMessage({ type: 'sync_state' });
            
            channel.onmessage = (event) => {
              const { type, data } = event.data;
              
              if (type === 'state_update') {
                updateDisplay(data);
              }
            };
            
            function updateDisplay(state) {
              textContent.textContent = state.text || '';
              textContent.style.fontSize = (state.fontSize || 32) + 'px';
              textContent.style.color = state.textColor || '#ffffff';
              textContent.style.transform = state.mirror ? 'scaleX(-1)' : 'none';

              container.style.backgroundColor = state.backgroundColor || '#000000';

              timerText.textContent = formatTime(state.time || 0);
              timerText.style.color = state.timerColor || '#60a5fa';
              timerDisplay.querySelector('svg').style.stroke = state.timerColor || '#60a5fa';

              // Posicionar cronômetro conforme estado sincronizado
              if (state.timerPosition) {
                const left = state.timerPosition.left || 32;
                const top = state.timerPosition.top || 16;
                timerDisplay.style.left = left + 'px';
                timerDisplay.style.top = top + 'px';
              }

              if (state.isPlaying && !scrollInterval) {
                scrollInterval = setInterval(() => {
                  textContainer.scrollTop += state.scrollSpeed || 2;
                }, 50);
              } else if (!state.isPlaying && scrollInterval) {
                clearInterval(scrollInterval);
                scrollInterval = null;
              }
            }
            
            function formatTime(seconds) {
              const isNegative = seconds < 0;
              const absSeconds = Math.abs(seconds);
              const hrs = Math.floor(absSeconds / 3600);
              const mins = Math.floor((absSeconds % 3600) / 60);
              const secs = absSeconds % 60;
              return (isNegative ? '-' : '') + 
                     hrs.toString().padStart(2, '0') + ':' + 
                     mins.toString().padStart(2, '0') + ':' + 
                     secs.toString().padStart(2, '0');
            }
            
            window.addEventListener('beforeunload', () => {
              channel.close();
            });
          </script>
        </body>
        </html>
      `);
      teleprompterWindowRef.current.document.close();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Barra superior de controles */}
      <div className="bg-gray-800 p-4 flex items-center justify-between gap-4 shadow-lg flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
            title={isPlaying ? "Pausar" : "Play"}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          
          <button
            onClick={resetScroll}
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors"
            title="Resetar"
          >
            <RotateCcw size={24} />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`${showSettings ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-700 text-white p-3 rounded-lg transition-colors`}
            title="Configurações"
          >
            <Settings size={24} />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-gray-900 px-6 py-3 rounded-lg">
          <Clock size={24} style={{ color: timerColor }} />
          <span className="text-3xl font-mono font-bold" style={{ color: timerColor }}>
            {formatTime(time)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openTeleprompterWindow}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2"
            title="Abrir em nova janela"
          >
            <Maximize2 size={20} />
            Abrir Teleprompter
          </button>
        </div>
      </div>

      {/* Painel de configurações */}
      {showSettings && (
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Velocidade de Rolagem</label>
              <input
                type="range"
                min="1"
                max="10"
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-gray-400 text-xs">{scrollSpeed}/10</span>
            </div>
            
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Tamanho da Fonte</label>
              <input
                type="range"
                min="16"
                max="80"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-gray-400 text-xs">{fontSize}px</span>
            </div>
            
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Cor de Fundo</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
            
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Cor do Texto</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="text-gray-300 text-sm mb-2 block">Cor do Cronômetro</label>
              <input
                type="color"
                value={timerColor}
                onChange={(e) => setTimerColor(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
            
            <div>
              <label className="text-gray-300 text-sm mb-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={mirror}
                  onChange={(e) => setMirror(e.target.checked)}
                  className="w-4 h-4"
                />
                Espelhar Texto
              </label>
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Orientação da Tela</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded"
              >
                <option value="horizontal">Horizontal (paisagem)</option>
                <option value="vertical">Vertical (retrato)</option>
              </select>
            </div>
          </div>

          {/* Controles de Timer */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Timer size={20} />
              Configurações do Timer
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 text-sm mb-2 block">Modo do Timer</label>
                <select
                  value={timerMode}
                  onChange={(e) => {
                    setTimerMode(e.target.value);
                    if (e.target.value === 'countdown') {
                      setTime(initialCountdownTime);
                    } else {
                      setTime(0);
                    }
                  }}
                  className="w-full bg-gray-700 text-white p-2 rounded"
                >
                  <option value="stopwatch">Cronômetro (Crescente)</option>
                  <option value="countdown">Timer (Regressivo)</option>
                </select>
              </div>

              {timerMode === 'countdown' && (
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">Definir Tempo de Contagem</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={countdownMinutes}
                      onChange={(e) => setCountdownMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-20 bg-gray-700 text-white p-2 rounded text-center"
                      placeholder="Min"
                    />
                    <span className="text-white self-center">:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={countdownSeconds}
                      onChange={(e) => setCountdownSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-20 bg-gray-700 text-white p-2 rounded text-center"
                      placeholder="Seg"
                    />
                    <button
                      onClick={applyCountdownTime}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-gray-300 text-sm mb-2 block">Ajustar Tempo Manualmente (H:M:S)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="H"
                    className="w-16 bg-gray-700 text-white p-2 rounded text-center"
                    onChange={(e) => {
                      const h = parseInt(e.target.value) || 0;
                      const m = Math.floor((time % 3600) / 60);
                      const s = time % 60;
                      setManualTime(h, m, s);
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="M"
                    className="w-16 bg-gray-700 text-white p-2 rounded text-center"
                    onChange={(e) => {
                      const h = Math.floor(time / 3600);
                      const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                      const s = time % 60;
                      setManualTime(h, m, s);
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="S"
                    className="w-16 bg-gray-700 text-white p-2 rounded text-center"
                    onChange={(e) => {
                      const h = Math.floor(time / 3600);
                      const m = Math.floor((time % 3600) / 60);
                      const s = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                      setManualTime(h, m, s);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Área de edição e preview */}
      <div className="flex-1 p-6 overflow-hidden flex gap-4">
        {/* Editor */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-white text-xl font-semibold mb-3">Editor de Texto</h3>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-gray-800 text-white p-6 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            placeholder="Cole ou digite seu texto aqui..."
          />
          <p className="text-gray-400 text-sm mt-3">
            💡 Clique em "Abrir Teleprompter" para abrir em uma nova janela. Todas as alterações são sincronizadas em tempo real!
          </p>
        </div>

        {/* Preview */}
        <div className="w-1/3 flex flex-col">
          <h3 className="text-white text-xl font-semibold mb-3">Preview</h3>
          <div 
            className="flex-1 rounded-lg overflow-hidden relative"
            style={{ backgroundColor }}
          >
            <div
              ref={textRef}
              className="h-full overflow-y-auto px-4 py-6"
              style={{
                fontSize: `${fontSize / 2}px`,
                color: textColor,
                lineHeight: '1.8',
                transform: mirror ? 'scaleX(-1)' : 'none',
              }}
            >
              <div className="whitespace-pre-wrap">
                {text}
              </div>
            </div>
            <div
              ref={timerRef}
              onMouseDown={onTimerMouseDown}
              className="bg-black bg-opacity-70 px-3 py-2 rounded flex items-center gap-2 cursor-move"
              style={{
                position: 'absolute',
                left: `${timerPosition.left}px`,
                top: `${timerPosition.top}px`,
                zIndex: 20,
              }}
            >
              <Clock size={16} style={{ color: timerColor }} />
              <span className="text-lg font-mono font-bold" style={{ color: timerColor }}>
                {formatTime(time)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
