import React, { useEffect, useState, useRef } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useTheme } from '../themes/useTheme';
import classNames from 'classnames';
import { Link } from '@/lib/reactRouterWrapper';

// TODO: comment this out after we're done with the book promotion
export const bookPromotionEndDate = new Date('2025-09-17T00:00:00Z') // Day after book release

export const isBookPromotionActive = () => {
  return new Date() < bookPromotionEndDate;
}

// Helper function to interpolate between two hex colors
const interpolateColor = (color1: string, color2: string, factor: number): string => {
  // Parse hex colors
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);
  
  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);
  
  // Interpolate
  const r = Math.round(r1 + ((r2 - r1) * factor));
  const g = Math.round(g1 + ((g2 - g1) * factor));
  const b = Math.round(b1 + ((b2 - b1) * factor));
  
  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const styles = (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: `linear-gradient(to bottom right, ${theme.palette.bookPromotion.twilightLight}, ${theme.palette.bookPromotion.twilightDark} 50%, ${theme.palette.text.alwaysBlack})`, // Match canvas gradient colors
    zIndex: -1,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  starryBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `linear-gradient(to bottom right, ${theme.palette.bookPromotion.twilightLight}, ${theme.palette.bookPromotion.twilightDark} 50%, ${theme.palette.text.alwaysBlack})`, // Match canvas gradient colors
    overflow: 'hidden',
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  blackSphere: {
    position: 'absolute',
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
    bottom: 60,
    right: 50,
    width: 280,
    textAlign: 'center',
    zIndex: 10,
    [theme.breakpoints.down(1400)]: {
      right: 50,
      bottom: 120,
      width: 150,
    },
    [theme.breakpoints.down(1300)]: {
      display: 'none'
    }
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
    color: theme.palette.greyAlpha(1),
    marginBottom: 4,
    lineHeight: 1.2,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily,
    fontSize: '1.65rem',
    fontWeight: 700,
    color: theme.palette.text.red,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  authors: {
    fontFamily: theme.typography.fontFamily,
    fontSize: '1rem',
    color: theme.palette.greyAlpha(1),
    marginBottom: 12,
    [theme.breakpoints.down(1400)]: {
      fontSize: '1rem',
    }
  },
  preorderButtonText: {
    textTransform: 'uppercase',
    fontWeight: 600,  
    fontSize: '1.2rem',
    color: theme.palette.greyAlpha(1),
    marginBottom: 12,
  },
  publicationInfo: {
    fontFamily: theme.typography.fontFamily,
    fontSize: '0.9rem',
    color: theme.palette.text.secondary,
    marginBottom: 20,
    [theme.breakpoints.down(1400)]: {
      fontSize: '0.8rem',
    }
  },
  preorderButtonAmazon: {
    marginTop: 30,
    marginBottom: 10,
  },
  preorderButton: {
    display: 'inline-block',
    padding: '10px 24px',
    border: `2px solid ${theme.palette.text.primary}`,
    color: theme.palette.greyAlpha(1),
    textDecoration: 'none',
    borderRadius: 25,
    fontFamily: theme.typography.fontFamily,
    letterSpacing: '0.05em',
    transition: 'all 0.2s ease',
    backgroundColor: 'transparent',
    '&:hover': {
      background: theme.palette.text.primary,
      color: theme.palette.background.default,
    },
    [theme.breakpoints.down(1400)]: {
      fontSize: '0.9rem',
      padding: '8px 20px',
    }
  },
  // Override the main layout background when this component is active
  '@global': {
    [theme.breakpoints.up('sm')]: {
      'body.ifAnyoneBuildsItActive': {
        backgroundColor: `${theme.palette.bookPromotion.twilightDark} !important`, // Match canvas gradient mid-tone
      } 
    },
  },
  altPreorderButton: {
    marginTop: 10,
    marginBottom: 30,
    color: theme.palette.text.primary,
    fontFamily: theme.typography.fontFamily,
    letterSpacing: '0.05em',
  },
  altPreorderLinks: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    width: '100%',
  }
});

export const isIfAnyoneBuildsItFrontPage = '.ifAnyoneBuildsItActive &';

const IfAnyoneBuildsItSplash = ({
  classes,
}: {
  classes: ClassesType<typeof styles>,
}) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paintCanvasRef = useRef<(() => void) | null>(null);
  const starsRef = useRef<Array<{x: number, y: number, radius: number, opacity: number, twinkleSpeed: number}>>([]);
  const sphereSizeRef = useRef(0);
  const scrollProgressRef = useRef(0);
  const [shouldShowStarfield, setShouldShowStarfield] = useState(true);

  // Check if we should show starfield based on screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setShouldShowStarfield(window.innerWidth >= 1300);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Add/remove body class for background override
  useEffect(() => {
    if (shouldShowStarfield) {
      document.body.classList.add('ifAnyoneBuildsItActive');
    } else {
      document.body.classList.remove('ifAnyoneBuildsItActive');
    }
    return () => {
      document.body.classList.remove('ifAnyoneBuildsItActive');
    };
  }, [shouldShowStarfield]);

  // Create starfield and canvas setup
  useEffect(() => {
    if (!shouldShowStarfield) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Try to get Display P3 context for wide gamut colors, fallback to sRGB
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d', { colorSpace: 'display-p3' });
      // Log what color space we actually got for debugging
      const actualColorSpace = ctx?.getContextAttributes?.()?.colorSpace || 'unknown';
    } catch {
      // Fallback to standard sRGB
      ctx = canvas.getContext('2d');
    }
    
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;
      
      // Set the actual canvas size in memory (scaled for high-DPI)
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      
      // Set the display size (CSS pixels)
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';
      
      // Scale the context to match the device pixel ratio
      ctx.scale(dpr, dpr);
      
      // Regenerate stars on resize (using display dimensions)
      const starCount = Math.floor((displayWidth * displayHeight) / 800); // Much denser starfield
      starsRef.current = [];
      
      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * displayWidth,
          y: Math.random() * displayHeight,
          radius: (Math.random() * 1.5) + 0.5,
          opacity: (Math.random() * 0.8) + 0.2,
          twinkleSpeed: (Math.random() * 0.02) + 0.01
        });
      }
      
      // Repaint after resize
      paintCanvas();
    };

    // Canvas painting function (called on scroll events)
    const paintCanvas = () => {
      if (!ctx) return;
      
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;
      
      // Use dynamic twilight gradient that darkens as we scroll (sunset effect)
      const gradient = ctx.createLinearGradient(0, 0, displayWidth, displayHeight);
      const progress = scrollProgressRef.current;
      
      // Interpolate colors based on scroll progress
      // At progress 0: light purple -> dark purple -> black
      // At progress 1: dark purple -> dark purple -> black (only fade out light purple)
      const leftColor = interpolateColor('#7a7096', '#252141', Math.min(progress, 0.9));
      const midColor = '#252141'; // Keep dark purple constant
      const rightColor = '#000000'; // Keep black constant
      
      // Adjust positions to create the migration effec
      
      gradient.addColorStop(0, leftColor);
      gradient.addColorStop(0.5, midColor); // Ensure we don't have position 0 twice
      gradient.addColorStop(1, rightColor);
      ctx.fillStyle = gradient;
      
      ctx.fillRect(0, 0, displayWidth, displayHeight);
      
      const centerX = displayWidth * (1 - 0.10); // 15vw from right
      const centerY = displayHeight * 0.20; // 15vh from top
      const currentSphereRadius = sphereSizeRef.current / 2;
      const redShiftZoneThickness = 100;
      const maxRelevantDistance = currentSphereRadius + redShiftZoneThickness;
      
      // Pre-calculate color space support once per paint
      const canvasColorSpace = ctx.getContextAttributes?.()?.colorSpace || 'srgb';
      const supportsDisplayP3 = canvasColorSpace === 'display-p3';
      let supportsOklch = false;
      if (!supportsDisplayP3) {
        const testFillStyle = 'oklch(0.75 0.25 70)';
        ctx.fillStyle = testFillStyle;
        supportsOklch = ctx.fillStyle === testFillStyle;
      }
      
      // Batch stars by type for more efficient rendering
      const goldStars: Array<{x: number, y: number, radius: number, opacity: number}> = [];
      const redStars: Array<{x: number, y: number, radius: number, opacity: number, color: string}> = [];
      
      // Process stars with early culling and batching
      for (let i = 0; i < starsRef.current.length; i++) {
        const star = starsRef.current[i];
        
        // Quick distance check for early culling - use squared distance to avoid sqrt
        const dx = star.x - centerX;
        const dy = star.y - centerY;
        const distanceSquared = (dx * dx) + (dy * dy);
        const maxRelevantDistanceSquared = maxRelevantDistance * maxRelevantDistance;
        
        // Skip stars that are too far away to be affected
        if (distanceSquared > maxRelevantDistanceSquared) {
          // Add to gold stars batch (normal stars, no twinkle since we only paint on scroll)
          goldStars.push({
            x: star.x,
            y: star.y,
            radius: star.radius,
            opacity: star.opacity
          });
          continue;
        }
        
        // Now compute actual distance only for nearby stars
        const distance = Math.sqrt(distanceSquared);
        
        // Hide stars that are within the sphere
        if (distance < currentSphereRadius * 0.7) {
          continue;
        }
        
        // Calculate effects for nearby stars
        let fadeMultiplier = 1;
        let redShift = 0;
        let sizeMultiplier = 1;
        
        if (distance < currentSphereRadius) {
          fadeMultiplier = (distance - (currentSphereRadius * 0.85)) / (currentSphereRadius * 0.15);
          redShift = 1 - fadeMultiplier;
          sizeMultiplier = 1 + (redShift * 3);
        } else if (distance < currentSphereRadius + redShiftZoneThickness) {
          redShift = (currentSphereRadius + redShiftZoneThickness - distance) / redShiftZoneThickness;
          redShift = Math.max(0, Math.min(1, redShift));
          sizeMultiplier = 1 + (redShift * 1);
        }
        
        const opacity = star.opacity * fadeMultiplier;
        
        if (redShift > 0) {
          // Pre-calculate red color
          const r = Math.floor(220 * redShift);
          const g = Math.floor(20 * redShift);
          const b = Math.floor(60 * redShift);
          const color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
          
          redStars.push({
            x: star.x,
            y: star.y,
            radius: star.radius * sizeMultiplier,
            opacity: opacity,
            color: color
          });
        } else {
          goldStars.push({
            x: star.x,
            y: star.y,
            radius: star.radius * sizeMultiplier,
            opacity: opacity
          });
        }
      }
      
      // Batch render gold stars
      if (goldStars.length > 0) {
        if (supportsDisplayP3) {
          ctx.fillStyle = `color(display-p3 0.9 0.65 0.05)`;
        } else if (supportsOklch) {
          ctx.fillStyle = `oklch(0.75 0.25 70)`;
        } else {
          ctx.fillStyle = `rgba(204, 153, 0)`;
        }
        
        for (let i = 0; i < goldStars.length; i++) {
          const star = goldStars[i];
          ctx.globalAlpha = star.opacity;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1; // Reset
      }
      
      // Batch render red stars (these need individual colors due to opacity variations)
      for (let i = 0; i < redStars.length; i++) {
        const star = redStars[i];
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Store paint function for access from scroll handler
    paintCanvasRef.current = paintCanvas;

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initial paint
    paintCanvas();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      paintCanvasRef.current = null;
    };
  }, [shouldShowStarfield]);

  // Handle scroll for sphere expansion with throttling and canvas repaint
  useEffect(() => {
    if (!shouldShowStarfield) return;
    
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const maxScroll = 10000; // Increased for slower expansion
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
          const dynamicMaxSize = maxDistance * 2 * 2; // Diameter with 20% buffer
          
          const size = progress * dynamicMaxSize;
          sphereSizeRef.current = size;
          scrollProgressRef.current = progress;
          
          // Repaint canvas with new sphere size and gradient
          if (paintCanvasRef.current) {
            paintCanvasRef.current();
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Set initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [shouldShowStarfield]);

  return (
    <>
      <div className={classes.root}>
        <div className={classes.starryBackground}>
          {shouldShowStarfield && (
            <canvas 
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            />
          )}
        </div>
      </div>
      
      <div className={classes.bookContainer}>
        <Link to="/posts/khmpWJnGJnuyPdipE/new-endorsements-for-if-anyone-builds-it-everyone-dies" className={classes.bookLink}>
          <div className={classes.title}>If Anyone Builds It,</div>
          <div className={classes.subtitle}>Everyone Dies</div>
          <div className={classes.authors}>A book by Eliezer Yudkowsky<br/> & Nate Soares</div>
        </Link>
        <a 
          href="https://www.amazon.com/Anyone-Builds-Everyone-Dies-Superhuman/dp/0316595640?maas=maa[…]3B826DA0D078097E4FA6653C84CB59_afap_abs&ref_=aa_maas&tag=maas"
          target="_blank"
          rel="noopener noreferrer"
          className={classNames(classes.preorderButton, classes.preorderButtonAmazon)}
        >
          Pre-order on Amazon
        </a>
        <div className={classes.altPreorderLinks}>
          <a href="https://ifanyonebuildsit.com/?ref=lw#preorder" target="_blank" rel="noopener noreferrer" className={classes.altPreorderButton}>
            Other Options
          </a>
        </div>
      </div>
    </>
  );
};

export default registerComponent('IfAnyoneBuildsItSplash', IfAnyoneBuildsItSplash, {styles});
