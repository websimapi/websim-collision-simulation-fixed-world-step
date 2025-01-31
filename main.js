// main.js
// This simulation demonstrates a re-designed collision logic that fixes the world internal step error.
// We use a fixed time-step integration and careful collision resolution between moving balls.

class Ball {
  constructor(x, y, radius, mass, vx, vy, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.mass = mass;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Update position with simple Euler integration
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

// Setup canvas and simulation environment
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let canvasWidth, canvasHeight;
function resizeCanvas() {
  canvasWidth = canvas.width = window.innerWidth;
  canvasHeight = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Simulation parameters
const balls = [];
const numBalls = 5;
const minRadius = 20, maxRadius = 40;

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Create balls with random positions and velocities
for (let i = 0; i < numBalls; i++) {
  const radius = randomInRange(minRadius, maxRadius);
  // Ensure balls start a bit inside the canvas bounds
  const x = randomInRange(radius, canvasWidth - radius);
  const y = randomInRange(radius, canvasHeight - radius);
  const mass = radius; // simple assumption: mass proportional to radius.
  let vx = randomInRange(-100, 100);
  let vy = randomInRange(-100, 100);
  
  // Random pastel colors
  const hue = Math.floor(randomInRange(0, 360));
  const color = `hsl(${hue}, 70%, 60%)`;
  balls.push(new Ball(x, y, radius, mass, vx, vy, color));
}

// Collision resolution function for two balls
function resolveCollision(ballA, ballB) {
  const dx = ballB.x - ballA.x;
  const dy = ballB.y - ballA.y;
  const distance = Math.hypot(dx, dy);

  // Overlap check
  if (distance === 0) return; // prevent division by zero

  // Normalize collision vector
  const nx = dx / distance;
  const ny = dy / distance;

  // Relative velocity in normal direction
  const dvx = ballA.vx - ballB.vx;
  const dvy = ballA.vy - ballB.vy;
  const velocityAlongNormal = dvx * nx + dvy * ny;

  // If balls are moving apart, do nothing
  if (velocityAlongNormal > 0) return;

  // Calculate restitution (elastic collision)
  const restitution = 1; // perfectly elastic

  // Impulse scalar
  const impulse = (-(1 + restitution) * velocityAlongNormal) / (1/ballA.mass + 1/ballB.mass);

  // Change in velocity
  const impulseX = impulse * nx;
  const impulseY = impulse * ny;

  ballA.vx += impulseX / ballA.mass;
  ballA.vy += impulseY / ballA.mass;
  ballB.vx -= impulseX / ballB.mass;
  ballB.vy -= impulseY / ballB.mass;

  // Positional correction: prevent overlap (avoid sinking or internal step error)
  const percent = 0.8; // usually 20%-80%
  const correction = (distance - (ballA.radius + ballB.radius)) / (1/ballA.mass + 1/ballB.mass) * percent;
  const correctionX = correction * nx;
  const correctionY = correction * ny;
  ballA.x -= correctionX / ballA.mass;
  ballA.y -= correctionY / ballA.mass;
  ballB.x += correctionX / ballB.mass;
  ballB.y += correctionY / ballB.mass;
}

// Boundary collision check and response for a ball
function handleWallCollision(ball) {
  // Left wall
  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.vx *= -1;
  }
  // Right wall
  if (ball.x + ball.radius > canvasWidth) {
    ball.x = canvasWidth - ball.radius;
    ball.vx *= -1;
  }
  // Top wall
  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.vy *= -1;
  }
  // Bottom wall
  if (ball.y + ball.radius > canvasHeight) {
    ball.y = canvasHeight - ball.radius;
    ball.vy *= -1;
  }
}

// Fixed time-step loop for physics simulation
let lastTimestamp = 0;
const fixedDelta = 1 / 60; // 60 Hz

function update(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  let deltaTime = (timestamp - lastTimestamp) / 1000; // convert ms to seconds
  lastTimestamp = timestamp;

  // Handle very long frames that could break simulation
  if (deltaTime > 0.1) deltaTime = 0.1;

  // Fixed step simulation loop:
  while (deltaTime > fixedDelta) {
    simulateStep(fixedDelta);
    deltaTime -= fixedDelta;
  }
  simulateStep(deltaTime);

  render();
  window.requestAnimationFrame(update);
}

function simulateStep(dt) {
  // Update ball positions
  balls.forEach(ball => {
    ball.update(dt);
    handleWallCollision(ball);
  });

  // Check collisions between each pair
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const dx = balls[j].x - balls[i].x;
      const dy = balls[j].y - balls[i].y;
      const dist = Math.hypot(dx, dy);
      if (dist < balls[i].radius + balls[j].radius) {
        resolveCollision(balls[i], balls[j]);
      }
    }
  }
}

// Render simulation onto canvas
function render() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  balls.forEach(ball => ball.draw(ctx));
}

// Start the simulation loop
window.requestAnimationFrame(update);