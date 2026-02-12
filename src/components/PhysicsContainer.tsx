"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import Matter from "matter-js";
import { Post } from "@/types";
import { Capsule } from "./Capsule";
import { playDropSound } from "@/lib/sounds";

const CAPSULE_RADIUS = 35;
const WALL_THICKNESS = 50;
const HEADER_HEIGHT = 48;
const SLEEP_SPEED_THRESHOLD = 0.5;
const SLEEP_CHECK_INTERVAL = 3000;

interface CapsuleState {
  id: string;
  post: Post;
  x: number;
  y: number;
  angle: number;
}

interface PhysicsContainerProps {
  posts: Post[];
  onCapsuleClick: (post: Post) => void;
}

export interface PhysicsContainerRef {
  dropCapsules: (posts: Post[]) => void;
  clear: () => void;
}

export const PhysicsContainer = forwardRef<
  PhysicsContainerRef,
  PhysicsContainerProps
>(function PhysicsContainer({ posts, onCapsuleClick }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const bodiesMapRef = useRef<Map<string, { body: Matter.Body; post: Post }>>(
    new Map()
  );
  const [capsuleStates, setCapsuleStates] = useState<CapsuleState[]>([]);
  const animFrameRef = useRef<number>(0);

  // Initialize physics engine
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create engine with sleeping enabled for performance
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.2, scale: 0.001 },
      enableSleeping: true,
    });
    engineRef.current = engine;

    // Create walls (floor, left, right)
    const floor = Matter.Bodies.rectangle(
      width / 2,
      height + WALL_THICKNESS / 2,
      width,
      WALL_THICKNESS,
      { isStatic: true, friction: 0.8 }
    );
    const leftWall = Matter.Bodies.rectangle(
      -WALL_THICKNESS / 2,
      height / 2,
      WALL_THICKNESS,
      height * 2,
      { isStatic: true, friction: 0.3 }
    );
    const rightWall = Matter.Bodies.rectangle(
      width + WALL_THICKNESS / 2,
      height / 2,
      WALL_THICKNESS,
      height * 2,
      { isStatic: true, friction: 0.3 }
    );

    Matter.Composite.add(engine.world, [floor, leftWall, rightWall]);

    // Create runner
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    // Play sound on collision
    Matter.Events.on(engine, "collisionStart", (event) => {
      for (const pair of event.pairs) {
        // Only play sound for capsule-to-wall or capsule-to-capsule first impact
        const speed = Math.max(
          pair.bodyA.speed || 0,
          pair.bodyB.speed || 0
        );
        if (speed > 2) {
          playDropSound();
          break; // Only one sound per frame
        }
      }
    });

    // Sync physics to React state
    const syncPositions = () => {
      const states: CapsuleState[] = [];
      bodiesMapRef.current.forEach(({ body, post }, id) => {
        states.push({
          id,
          post,
          x: body.position.x,
          y: body.position.y,
          angle: body.angle,
        });
      });
      setCapsuleStates(states);
      animFrameRef.current = requestAnimationFrame(syncPositions);
    };
    animFrameRef.current = requestAnimationFrame(syncPositions);

    // Periodically sleep static bodies for performance
    const sleepInterval = setInterval(() => {
      bodiesMapRef.current.forEach(({ body }) => {
        if (!body.isSleeping && body.speed < SLEEP_SPEED_THRESHOLD) {
          Matter.Sleeping.set(body, true);
        }
      });
    }, SLEEP_CHECK_INTERVAL);

    return () => {
      clearInterval(sleepInterval);
      cancelAnimationFrame(animFrameRef.current);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      bodiesMapRef.current.clear();
    };
  }, []);

  // Drop capsules function
  const dropCapsules = useCallback((postsToAdd: Post[]) => {
    const engine = engineRef.current;
    const container = containerRef.current;
    if (!engine || !container) return;

    const width = container.clientWidth;

    postsToAdd.forEach((post, index) => {
      if (bodiesMapRef.current.has(post.id)) return;

      setTimeout(() => {
        const x =
          Math.random() * (width - CAPSULE_RADIUS * 4) + CAPSULE_RADIUS * 2;
        const y = -CAPSULE_RADIUS - Math.random() * 100;

        const body = Matter.Bodies.circle(x, y, CAPSULE_RADIUS, {
          restitution: 0.3,
          friction: 0.5,
          frictionAir: 0.01,
          density: 0.002,
          label: post.id,
          sleepThreshold: 60,
        });

        Matter.Composite.add(engine.world, body);
        bodiesMapRef.current.set(post.id, { body, post });
      }, index * 120);
    });
  }, []);

  // Clear all capsules
  const clear = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    bodiesMapRef.current.forEach(({ body }) => {
      Matter.Composite.remove(engine.world, body);
    });
    bodiesMapRef.current.clear();
    setCapsuleStates([]);
  }, []);

  useImperativeHandle(ref, () => ({ dropCapsules, clear }), [
    dropCapsules,
    clear,
  ]);

  // Auto-drop when posts change
  useEffect(() => {
    if (posts.length > 0) {
      dropCapsules(posts);
    }
  }, [posts, dropCapsules]);

  // Mouse constraint for interactive dragging (stir/throw capsules)
  useEffect(() => {
    const container = containerRef.current;
    const engine = engineRef.current;
    if (!container || !engine) return;

    const mouse = Matter.Mouse.create(container);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });

    // Prevent default scrolling on the container
    mouse.element.removeEventListener(
      "mousewheel",
      (mouse as any).mousewheel
    );
    mouse.element.removeEventListener(
      "DOMMouseScroll",
      (mouse as any).mousewheel
    );

    Matter.Composite.add(engine.world, mouseConstraint);

    return () => {
      Matter.Composite.remove(engine.world, mouseConstraint);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ top: HEADER_HEIGHT }}
    >
      {capsuleStates.map((capsule) => (
        <Capsule
          key={capsule.id}
          post={capsule.post}
          x={capsule.x}
          y={capsule.y}
          angle={capsule.angle}
          radius={CAPSULE_RADIUS}
          onClick={onCapsuleClick}
        />
      ))}
    </div>
  );
});
