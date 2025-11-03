'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Mail } from 'lucide-react';

interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const BALL_SIZE = 80;
const AIR_FRICTION = 0.995; // 空气摩擦力系数（非常小）
const GRAVITY = 0.5; // 重力加速度
const BOUNCE_DAMPING = 0.7; // 反弹衰减
const GROUND_FRICTION = 0.85; // 地面摩擦力系数（较大）
const MIN_VELOCITY = 0.1; // 最小速度阈值

export default function FloatingBugBall() {
  const [mounted, setMounted] = useState(false); // 只在客户端显示
  
  // 使用函数形式初始化，避免首次渲染时出现在错误位置
  const [position, setPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const centerX = (window.innerWidth - BALL_SIZE) / 2;
      const topY = window.innerHeight * 0.3;
      return { x: centerX, y: topY };
    }
    return { x: 0, y: 0 }; // SSR 时的后备值（不会显示）
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0); // 旋转角度
  
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const ballRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0, time: 0 });
  const velocityHistoryRef = useRef<Array<{ vx: number; vy: number; time: number }>>([]);

  // 客户端挂载并初始化
  useEffect(() => {
    // 确保在客户端正确初始化位置
    if (typeof window !== 'undefined') {
      const centerX = (window.innerWidth - BALL_SIZE) / 2;
      const topY = window.innerHeight * 0.3;
      setPosition({ x: centerX, y: topY });
      
      // 随机水平初速度：-5到5之间（向左或向右）
      const randomVx = (Math.random() - 0.5) * 10; // -5 到 5
      velocityRef.current = { vx: randomVx, vy: 0 }; // 垂直方向无初速度，自由落体
      
      console.log('🐛 Bug飞 初始化 - 位置:', { x: centerX, y: topY }, '初速度:', { vx: randomVx, vy: 0 });
      
      // 标记为已挂载，开始显示
      setMounted(true);
    }
  }, []);

  // 不再保存状态，每次刷新都重新开始
  const saveState = useCallback(() => {
    // 刷新时重新自由落体，不保存状态
  }, []);

  // 物理模拟动画循环
  useEffect(() => {
    if (isDragging || !mounted) return;

    const animate = () => {
      setPosition(prev => {
        const { vx, vy } = velocityRef.current;
        
        let newX = prev.x;
        let newY = prev.y;
        let newVx = vx;
        let newVy = vy;

        // 应用重力
        newVy += GRAVITY;

        // 应用空气摩擦力（很小）
        newVx *= AIR_FRICTION;
        newVy *= AIR_FRICTION;

        // 更新位置
        newX += newVx;
        newY += newVy;

        // 边界碰撞检测
        const maxX = window.innerWidth - BALL_SIZE;
        const maxY = window.innerHeight - BALL_SIZE;

        if (newX <= 0) {
          newX = 0;
          newVx = Math.abs(newVx) * BOUNCE_DAMPING;
        } else if (newX >= maxX) {
          newX = maxX;
          newVx = -Math.abs(newVx) * BOUNCE_DAMPING;
        }

        if (newY <= 0) {
          newY = 0;
          newVy = Math.abs(newVy) * BOUNCE_DAMPING;
        } else if (newY >= maxY) {
          newY = maxY;
          newVy = -Math.abs(newVy) * BOUNCE_DAMPING;
          // 在地面上时应用较大的摩擦力
          newVx *= GROUND_FRICTION;
        }

        // 检查是否应该停止动画（必须在地面上且速度很小）
        const isOnGround = newY >= maxY - 1;
        const isStationary = Math.abs(newVx) < MIN_VELOCITY && Math.abs(newVy) < MIN_VELOCITY;
        
        if (isOnGround && isStationary) {
          // 完全停止在地面上
          velocityRef.current = { vx: 0, vy: 0 };
        } else {
          // 继续运动
          velocityRef.current = { vx: newVx, vy: newVy };
        }

        // 计算滚动旋转角度（基于水平位移）
        const dx = newX - prev.x;
        const radius = BALL_SIZE / 2;
        const rotationDelta = (dx / radius) * (180 / Math.PI); // 将位移转换为旋转角度
        setRotation(prevRotation => prevRotation + rotationDelta);

        return { x: newX, y: newY };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDragging, mounted]);

  // 处理拖拽开始
  const handleDragStart = useCallback((clientX: number, clientY: number, isMailIcon: boolean) => {
    if (isMailIcon) return false;

    setIsDragging(true);
    velocityRef.current = { vx: 0, vy: 0 };
    dragStartRef.current = {
      x: clientX - position.x,
      y: clientY - position.y
    };
    lastPosRef.current = { x: clientX, y: clientY, time: Date.now() };
    velocityHistoryRef.current = [];
    
    return true;
  }, [position]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const isMailIcon = (e.target as HTMLElement).closest('.mail-icon') !== null;
    if (handleDragStart(e.clientX, e.clientY, isMailIcon)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [handleDragStart]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const isMailIcon = (e.target as HTMLElement).closest('.mail-icon') !== null;
    if (handleDragStart(touch.clientX, touch.clientY, isMailIcon)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [handleDragStart]);

  // 处理拖拽移动
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;

    const newX = clientX - dragStartRef.current.x;
    const newY = clientY - dragStartRef.current.y;
    const now = Date.now();

    // 记录速度历史
    const dt = now - lastPosRef.current.time;
    if (dt > 0) {
      const vx = (clientX - lastPosRef.current.x) / dt * 16; // 转换为每帧速度
      const vy = (clientY - lastPosRef.current.y) / dt * 16;
      velocityHistoryRef.current.push({ vx, vy, time: now });
      
      // 只保留最近100ms的速度记录
      velocityHistoryRef.current = velocityHistoryRef.current.filter(
        v => now - v.time < 100
      );
    }

    // 计算拖拽时的旋转角度
    setPosition(prev => {
      const dx = newX - prev.x;
      const radius = BALL_SIZE / 2;
      const rotationDelta = (dx / radius) * (180 / Math.PI);
      setRotation(prevRotation => prevRotation + rotationDelta);
      return { x: newX, y: newY };
    });

    lastPosRef.current = { x: clientX, y: clientY, time: now };
  }, [isDragging]);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // 计算平均速度作为甩飞的初始速度
    if (velocityHistoryRef.current.length > 0) {
      const recentVelocities = velocityHistoryRef.current;
      const avgVx = recentVelocities.reduce((sum, v) => sum + v.vx, 0) / recentVelocities.length;
      const avgVy = recentVelocities.reduce((sum, v) => sum + v.vy, 0) / recentVelocities.length;
      
      // 限制最大初始速度
      const maxSpeed = 30;
      const speed = Math.sqrt(avgVx * avgVx + avgVy * avgVy);
      if (speed > maxSpeed) {
        velocityRef.current = {
          vx: (avgVx / speed) * maxSpeed,
          vy: (avgVy / speed) * maxSpeed
        };
      } else {
        velocityRef.current = { vx: avgVx, vy: avgVy };
      }
      
      console.log('甩飞速度:', velocityRef.current);
    }

    velocityHistoryRef.current = [];
  }, [isDragging]);

  // 全局事件监听
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // 每次刷新都重新开始，不需要定期保存状态

  // 处理邮件点击
  const handleMailClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = 'mailto:contact@xinliuyuansu.com?subject=Bug反馈';
  };

  // 只在客户端挂载后才显示，避免 SSR 时出现闪烁
  if (!mounted) {
    return null;
  }

  return (
    <div
      ref={ballRef}
      className="fixed z-[9999] select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${BALL_SIZE}px`,
        height: `${BALL_SIZE}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="relative w-full h-full">
        {/* 白色小球 */}
        <div
          className={`w-full h-full rounded-full bg-white shadow-lg flex flex-col items-center justify-center border-2 border-gray-200 ${
            !isDragging && 'hover:scale-105'
          }`}
          style={{
            boxShadow: isDragging 
              ? '0 10px 25px rgba(0, 0, 0, 0.2), 0 6px 10px rgba(0, 0, 0, 0.1)'
              : '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
            transform: `rotate(${rotation}deg) ${isDragging ? 'scale(1.05)' : 'scale(1)'}`,
            transition: isDragging ? 'box-shadow 0.2s' : 'box-shadow 0.2s, transform 0.05s'
          }}
        >
          {/* 文字 */}
          <div className="text-xs font-bold text-gray-800 mb-1 pointer-events-none">
            bug飞
          </div>

          {/* 邮件图标 */}
          <button
            className="mail-icon p-1 rounded-full hover:bg-gray-100 transition-colors"
            onClick={handleMailClick}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            title="发送邮件反馈"
          >
            <Mail className="w-5 h-5 text-blue-500" />
          </button>
        </div>

        {/* 拖拽提示光晕效果 */}
        {isDragging && (
          <div
            className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-pulse"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </div>
    </div>
  );
}
