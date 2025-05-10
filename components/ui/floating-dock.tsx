import { cn } from "@/lib/utils";
import { useRef, useState, useEffect, useCallback, memo } from "react";

// Simple fade animation components
const AnimatePresence = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const motion = {
  div: ({ 
    initial, 
    animate, 
    exit, 
    className, 
    children, 
    style,
    ...props 
  }: any) => {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);
    
    const animationStyle = mounted 
      ? { 
          ...style,
          opacity: animate?.opacity ?? 1, 
          transform: `translate(${animate?.x ?? 0}%, ${animate?.y ?? 0}px)`,
          transition: 'opacity 0.3s ease, transform 0.3s ease'
        }
      : { 
          ...style,
          opacity: initial?.opacity ?? 0, 
          transform: `translate(${initial?.x ?? 0}%, ${initial?.y ?? 10}px)`,
        };
    
    return (
      <div className={className} style={animationStyle} {...props}>
        {children}
      </div>
    );
  }
};

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: {
                    delay: idx * 0.05,
                  },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                <a
                  href={item.href}
                  key={item.title}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-900"
                >
                  <div className="h-4 w-4">{item.icon}</div>
                </a>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-800"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="h-5 w-5 text-neutral-500 dark:text-neutral-400"
        >
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          <path d="M9 15 15 9"></path>
        </svg>
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  className?: string;
}) => {
  let mouseX = useRef(Infinity);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  
  // Function to update mouse position
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseX.current = e.pageX;
    // Force rerender
    setHoveredItem(prev => prev === null ? null : prev);
  }, []);
  
  // Reset mouse position when mouse leaves
  const handleMouseLeave = useCallback(() => {
    mouseX.current = Infinity;
    setHoveredItem(null);
  }, []);
  
  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "mx-auto h-16 items-end gap-4 rounded-2xl bg-gray-50 px-4 pb-3 md:flex dark:bg-neutral-900 relative",
        className,
      )}
    >
      {/* Subtle indicator dot to hint that dock can auto-hide */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/30 animate-pulse"></div>
      
      {items.map((item, idx) => (
        <MemoizedIconContainer 
          key={item.title} 
          mouseX={mouseX.current} 
          index={idx}
          isHovered={hoveredItem === idx}
          onHover={() => setHoveredItem(idx)}
          onLeave={() => setHoveredItem(null)}
          {...item} 
        />
      ))}
    </div>
  );
};

const MemoizedIconContainer = memo(IconContainer);

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  index,
  isHovered,
  onHover,
  onLeave
}: {
  mouseX: number;
  title: string;
  icon: React.ReactNode;
  href: string;
  index: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  // Calculate distance - simplified without motion values
  const getDistance = () => {
    if (mouseX === Infinity || !ref.current) return 150;
    const bounds = ref.current.getBoundingClientRect();
    return Math.abs(mouseX - bounds.x - bounds.width / 2);
  };
  
  // Calculate size based on distance
  const getSize = () => {
    const distance = getDistance();
    if (distance < 60) return 90; // Maximum size when close
    if (distance < 150) {
      const scale = 1 - (distance - 60) / 90;
      return 48 + 42 * scale;
    }
    return 48; // Minimum size when far
  };
  
  // Get icon size based on container size
  const getIconSize = () => {
    const containerSize = getSize();
    return containerSize / 2;
  };

  return (
    <a href={href}>
      <div
        ref={ref}
        style={{ 
          width: `${getSize()}px`, 
          height: `${getSize()}px`,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className="relative flex aspect-square items-center justify-center rounded-full bg-gray-200 dark:bg-neutral-800"
      >
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-8 left-1/2 w-fit rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs whitespace-pre text-neutral-700 dark:border-neutral-900 dark:bg-neutral-800 dark:text-white"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <div
          style={{ 
            width: `${getIconSize()}px`, 
            height: `${getIconSize()}px`,
            transition: 'all 0.2s ease'
          }}
          className="flex items-center justify-center"
        >
          {icon}
        </div>
      </div>
    </a>
  );
} 