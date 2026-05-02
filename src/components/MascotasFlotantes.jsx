import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToSiteConfig } from '../services/configService';

import cangrejoVideo from '../assets/mascotas/cangrejo.webm';
import delfinVideo from '../assets/mascotas/delfin.webm';
import langostinoVideo from '../assets/mascotas/langostino.webm';
import pikeroVideo from '../assets/mascotas/pikero.webm';

const MASCOTAS = [
  { id: 'cangrejo', src: cangrejoVideo },
  { id: 'delfin', src: delfinVideo },
  { id: 'langostino', src: langostinoVideo },
  { id: 'pikero', src: pikeroVideo },
];

const getRandomConfig = (mascota) => {
  // 4 comportamientos diferentes
  const types = ['popup-br', 'popup-bl', 'slide-lr', 'slide-rl'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  // Tamaño aleatorio para dar profundidad (entre 180px y 280px)
  const size = Math.floor(Math.random() * (280 - 180 + 1)) + 180; 
  
  if (type === 'popup-br') {
    return {
      mascota,
      id: Date.now() + Math.random(),
      style: { position: 'absolute', bottom: 0, right: '5%', width: `${size}px`, height: `${size}px` },
      initial: { y: '120%' },
      animate: { y: '0%' },
      exit: { y: '120%' },
      transition: { type: 'spring', stiffness: 80, damping: 15 },
      duration: Math.floor(Math.random() * 4000) + 4000, // 4 a 8 seg de estadía
      flip: false
    };
  }
  if (type === 'popup-bl') {
    return {
      mascota,
      id: Date.now() + Math.random(),
      style: { position: 'absolute', bottom: 0, left: '5%', width: `${size}px`, height: `${size}px` },
      initial: { y: '120%' },
      animate: { y: '0%' },
      exit: { y: '120%' },
      transition: { type: 'spring', stiffness: 80, damping: 15 },
      duration: Math.floor(Math.random() * 4000) + 4000,
      flip: true // Que mire hacia el centro de la pantalla
    };
  }
  
  // Animaciones de deslizamiento (nadar / caminar por la pantalla)
  const randomBottom = Math.floor(Math.random() * 60) + 10; // Altura aleatoria: 10% a 70% desde abajo
  const durationMs = Math.floor(Math.random() * 8000) + 12000; // Demora entre 12 y 20 seg en cruzar
  
  if (type === 'slide-lr') {
    return {
      mascota,
      id: Date.now() + Math.random(),
      style: { position: 'absolute', bottom: `${randomBottom}%`, left: 0, width: `${size}px`, height: `${size}px` },
      initial: { x: '-150%' }, // Empieza fuera de pantalla a la izquierda
      animate: { x: '120vw' }, // Cruza toda la pantalla hacia la derecha
      exit: { opacity: 0 },
      transition: { duration: durationMs / 1000, ease: 'linear' },
      duration: durationMs,
      flip: false
    };
  }
  if (type === 'slide-rl') {
    return {
      mascota,
      id: Date.now() + Math.random(),
      style: { position: 'absolute', bottom: `${randomBottom}%`, right: 0, width: `${size}px`, height: `${size}px` },
      initial: { x: '150%' }, // Empieza fuera de pantalla a la derecha
      animate: { x: '-120vw' }, // Cruza toda la pantalla hacia la izquierda
      exit: { opacity: 0 },
      transition: { duration: durationMs / 1000, ease: 'linear' },
      duration: durationMs,
      flip: true // Invertir el video horizontalmente para que mire a donde nada
    };
  }
};


const MascotasFlotantes = () => {
  const [activeEvent, setActiveEvent] = useState(null);
  const [isEnabled, setIsEnabled] = useState(true);

  // Escuchar cambios en la configuración global
  useEffect(() => {
    const unsubscribe = subscribeToSiteConfig((config) => {
      setIsEnabled(config.mascotasEnabled);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let appearTimeout;
    let disappearTimeout;

    // Si se desactivan las mascotas, forzamos el desmontaje de la activa y no programamos más
    if (!isEnabled) {
      setTimeout(() => setActiveEvent(null), 0);
      return;
    }

    const scheduleAppearance = () => {
      // Tiempo de espera entre apariciones (8s a 15s para dar más dinamismo)
      const delay = Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000;
      
      appearTimeout = setTimeout(() => {
        // Doble validación de seguridad
        if (!isEnabled) return;

        // Elegir mascota y su comportamiento
        const randomMascota = MASCOTAS[Math.floor(Math.random() * MASCOTAS.length)];
        const config = getRandomConfig(randomMascota);
        setActiveEvent(config);
        
        // Desmontar el componente exactamente cuando la animación termine
        disappearTimeout = setTimeout(() => {
          setActiveEvent(null);
          // Un pequeño respiro antes del próximo ciclo, solo si sigue encendido
          setTimeout(() => {
            scheduleAppearance();
          }, 1000);
        }, config.duration);
      }, delay);
    };

    scheduleAppearance();

    return () => {
      clearTimeout(appearTimeout);
      clearTimeout(disappearTimeout);
    };
  }, [isEnabled]); // Dependencia clave para reiniciar o detener el ciclo

  const popupContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        pointerEvents: 'none',
        overflow: 'hidden' // Evita que se creen scrollbars horizontales cuando salen de pantalla
      }}
    >
      <AnimatePresence>
        {activeEvent && (
          <motion.div
            key={activeEvent.id}
            initial={activeEvent.initial}
            animate={activeEvent.animate}
            exit={activeEvent.exit}
            transition={activeEvent.transition}
            style={activeEvent.style}
          >
            <div style={{
              width: '100%',
              height: '100%',
              transform: activeEvent.flip ? 'scaleX(-1)' : 'none',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              transition: 'transform 0.3s ease'
            }}>
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                src={activeEvent.mascota.src} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0px 10px 25px rgba(0,0,0,0.3))'
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return createPortal(popupContent, document.body);
};

export default MascotasFlotantes;
