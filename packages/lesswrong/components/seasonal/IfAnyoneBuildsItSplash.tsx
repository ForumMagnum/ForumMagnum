import React, { useEffect, useState, useRef } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';

// TODO: comment this out after we're done with the book promotion
export const bookPromotionEndDate = new Date('2025-09-17T00:00:00Z') // Day after book release

export const isBookPromotionActive = () => {
  return new Date() < bookPromotionEndDate;
}

const styles = (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: '#111',
    zIndex: -1,
    [theme.breakpoints.down(1300)]: {
      display: 'none'
    }
  },
  starryBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#111',
    overflow: 'hidden',
  },
  blackSphere: {
    position: 'absolute',
    background: 'radial-gradient(circle, #111 40%, rgba(0,0,0,0.8) 60%, transparent 80%)',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    left: 'calc(100% - 20vw)',
    top: '20vh',
    transition: 'none',
    pointerEvents: 'none',
    filter: 'blur(40px)',
    willChange: 'width, height',
  },
  bookContainer: {
    position: 'fixed',
    bottom: 100,
    right: 50,
    width: 280,
    textAlign: 'center',
    zIndex: 10,
    [theme.breakpoints.down(1600)]: {
      right: 20,
      bottom: 80,
      width: 240,
    },
    [theme.breakpoints.down(1400)]: {
      right: 10,
      bottom: 60,
      width: 200,
    },
    [theme.breakpoints.down(1300)]: {
      display: 'none'
    }
  },
  bookCover: {
    width: '100%',
    height: 'auto',
    marginBottom: 20,
    boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  bookImage: {
    objectFit: 'cover',
    width: '100%',
    height: '100%',
    objectViewBox: 'inset(2px)',
    position: 'relative',
    zIndex: 10,
    color: 'transparent',
  },
  bookLink: {
    textDecoration: 'none',
    color: 'inherit',
    opacity: 0.9,
    transition: 'all 0.2s ease',
    '&:hover': {
      opacity: 1,
    },
  },
  title: {
    fontFamily: theme.typography.fontFamily,
    fontSize: '1.8rem',
    transform: 'scaleX(0.85)',
    fontWeight: 700,
    color: '#fff',
    marginBottom: 8,
    lineHeight: 1.2,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    [theme.breakpoints.down(1400)]: {
      fontSize: '1.4rem',
    }
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily,
    fontSize: '1.65rem',
    fontWeight: 700,
    color: '#ff0000',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    [theme.breakpoints.down(1400)]: {
      fontSize: '1.1rem',
    }
  },
  authors: {
    fontFamily: theme.typography.fontFamily,
    fontSize: '1rem',
    color: '#ccc',
    marginBottom: 12,
    [theme.breakpoints.down(1400)]: {
      fontSize: '1rem',
    }
  },
  preorderButtonText: {
    textTransform: 'uppercase',
    fontWeight: 600,  
    fontSize: '1.2rem',
    color: '#fff',
    marginBottom: 12,
  },
  publicationInfo: {
    fontFamily: theme.typography.fontFamily,

    fontSize: '0.9rem',
    color: '#999',
    marginBottom: 20,
    [theme.breakpoints.down(1400)]: {
      fontSize: '0.8rem',
    }
  },
  preorderButton: {
    display: 'inline-block',
    marginTop: 30,
    padding: '10px 24px',
    border: '2px solid #fff',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: 25,
    fontFamily: theme.typography.fontFamily,
    letterSpacing: '0.05em',
    transition: 'all 0.2s ease',
    backgroundColor: 'transparent',
    '&:hover': {
      background: '#fff',
      color: '#000',
    },
    [theme.breakpoints.down(1400)]: {
      fontSize: '0.9rem',
      padding: '8px 20px',
    }
  },
  // Override the main layout background when this component is active
  '@global': {
    'body.ifAnyoneBuildsItActive': {
      backgroundColor: '#111 !important',
    },
    '.Layout-whiteBackground': {
      backgroundColor: 'transparent !important',
    }
  }
});

const IfAnyoneBuildsItSplash = ({
  classes,
}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [sphereSize, setSphereSize] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const starsRef = useRef<Array<{x: number, y: number, radius: number, opacity: number, twinkleSpeed: number}>>([]);
  const sphereSizeRef = useRef(0);

  // Add/remove body class for background override
  useEffect(() => {
    document.body.classList.add('ifAnyoneBuildsItActive');
    return () => {
      document.body.classList.remove('ifAnyoneBuildsItActive');
    };
  }, []);

  // Create and animate starfield
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Regenerate stars on resize
      const starCount = Math.floor((canvas.width * canvas.height) / 800); // Much denser starfield
      starsRef.current = [];
      
      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: (Math.random() * 1.5) + 0.5,
          opacity: (Math.random() * 0.8) + 0.2,
          twinkleSpeed: (Math.random() * 0.02) + 0.01
        });
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation loop
    const animate = () => {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const time = Date.now() * 0.001;
      const centerX = canvas.width * (1 - 0.20); // 15vw from right
      const centerY = canvas.height * 0.20; // 15vh from top
      const currentSphereRadius = sphereSizeRef.current / 2;
      
      starsRef.current.forEach(star => {
        // Calculate distance from center
        const dx = star.x - centerX;
        const dy = star.y - centerY;
        const distance = Math.sqrt((dx * dx) + (dy * dy));
        
        // Hide stars that are within the sphere
        if (distance < currentSphereRadius * 0.7) {
          return;
        }
        
        // Fade out stars near the edge of the sphere
        let fadeMultiplier = 1;
        let redShift = 0;
        let sizeMultiplier = 1;
        
        if (distance < currentSphereRadius) {
          fadeMultiplier = (distance - (currentSphereRadius * 0.7)) / (currentSphereRadius * 0.3);
          // Add red shift effect for stars approaching the sphere edge
          redShift = 1 - fadeMultiplier; // More red as they get closer to being consumed
          // Make stars larger as they get consumed
          sizeMultiplier = 1 + (redShift * 3); // Up to 3x size at the edge
        } else if (distance < currentSphereRadius * 1.5) {
          // Apply redshift to stars further out for more visible effect
          redShift = ((currentSphereRadius * 3) - distance) / (currentSphereRadius * 0.5);
          redShift = Math.max(0, Math.min(1, redShift)); // Clamp between 0 and 1
          // Gradually increase size as stars approach the danger zone
          sizeMultiplier = 1 + (redShift * 1); // Up to 2x size in the approach zone
        }
        
        const twinkle = (Math.sin(time * star.twinkleSpeed) * 0.5) + 0.5;
        const opacity = star.opacity * (0.5 + (twinkle * 0.5)) * fadeMultiplier;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * sizeMultiplier, 0, Math.PI * 2);
        
        // Interpolate between white and red based on proximity to sphere
        const r = 255;
        const g = Math.floor(255 * (1 - redShift));
        const b = Math.floor(255 * (1 - redShift));
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.fill();
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle scroll for sphere expansion
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = 3000; // Increased for slower expansion
      const progress = Math.min(scrollY / maxScroll, 1);
      
      // Calculate dynamic max size based on viewport to ensure full coverage on any monitor
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const sphereCenterX = viewportWidth * 0.8; // 20vw from right
      const sphereCenterY = viewportHeight * 0.2; // 20vh from top
      
      // Calculate distance to farthest corner (bottom-left) plus some buffer
      const maxDistance = Math.sqrt(
        Math.pow(sphereCenterX, 2) + Math.pow(viewportHeight - sphereCenterY, 2)
      );
      const dynamicMaxSize = maxDistance * 2 * 1.2; // Diameter with 20% buffer
      
      // Exponential growth for dramatic effect
      const size = progress * progress * progress * dynamicMaxSize;
      setSphereSize(size);
      sphereSizeRef.current = size;
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Set initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className={classes.root}>
        <div className={classes.starryBackground}>
          <canvas 
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.85,
            }}
          />
          <div 
            className={classes.blackSphere}
            style={{
              width: `${sphereSize}px`,
              height: `${sphereSize}px`,
            }}
          />
        </div>
      </div>
      
      <div className={classes.bookContainer}>
        <a href="https://ifanyonebuildsit.com" target="_blank" rel="noopener noreferrer" className={classes.bookLink}>
          <div className={classes.title}>If Anyone Builds It,</div>
          <div className={classes.subtitle}>Everyone Dies</div>
          <div className={classes.authors}>Eliezer Yudkowsky<br/> & Nate Soares</div>
        </a>
        <a 
          href="https://www.amazon.com/gp/product/0316595640"
          target="_blank"
          rel="noopener noreferrer"
          className={classes.preorderButton}
        >
          Pre-order Now
        </a>
      </div>
    </>
  );
};

export default registerComponent('IfAnyoneBuildsItSplash', IfAnyoneBuildsItSplash, {styles});
