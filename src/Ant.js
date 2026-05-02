import Vector from './Vector.js';

export default class Ant {
  constructor(x, y) {
    this.pos = new Vector(x, y);
    this.vel = Vector.random2D().mult(2);
    this.acc = new Vector(0, 0);
    this.maxSpeed = 2;
    this.maxForce = 0.1;

    // States: 0 = wandering for food, 1 = returning to nest
    this.state = 0;

    // Wandering
    this.wanderTheta = Math.random() * Math.PI * 2;

    // Pheromone dropping
    this.lastPheromonePos = this.pos.copy();
    this.pheromoneDropDist = 5;
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  wander() {
    // Jagged / zigzag wandering pattern
    if (!this.wanderTarget || Math.random() < 0.1) {
      // 5% chance per frame to pick a new random direction, creating sharp turns
      let angle = this.vel.heading() + (Math.random() - 0.5) * Math.PI * 1.5;
      let dist = 20 + Math.random() * 40;
      let offset = new Vector(Math.cos(angle) * dist, Math.sin(angle) * dist);
      this.wanderTarget = this.pos.copy().add(offset);
    }
    this.seek(this.wanderTarget);
  }

  seek(target) {
    let desired = Vector.sub(target, this.pos);
    desired.normalize();
    desired.mult(this.maxSpeed);
    let steer = Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    this.applyForce(steer);
  }

  // Custom seek for food/nest that adds slight variations to trail
  arrive(target) {
    let desired = Vector.sub(target, this.pos);
    let d = desired.mag();
    desired.normalize();

    // Add noise for variation
    let noise = Vector.random2D().mult(0.5);
    desired.add(noise).normalize();

    if (d < 50) {
      let m = (d / 50) * this.maxSpeed;
      desired.mult(m);
    } else {
      desired.mult(this.maxSpeed);
    }

    let steer = Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    this.applyForce(steer);
  }

  checkEdges(width, height) {
    let hitEdge = false;

    if (this.pos.x >= width) {
      this.pos.x = width - 1;
      hitEdge = true;
    } else if (this.pos.x <= 0) {
      this.pos.x = 1;
      hitEdge = true;
    }

    if (this.pos.y >= height) {
      this.pos.y = height - 1;
      hitEdge = true;
    } else if (this.pos.y <= 0) {
      this.pos.y = 1;
      hitEdge = true;
    }

    if (hitEdge) {
      // Turn around and add a random angle offset between -90 and 90 degrees
      let currentHeading = this.vel.heading();
      let newHeading = currentHeading + Math.PI + (Math.random() - 0.5) * Math.PI;
      this.vel.setHeading(newHeading);

      // Clear wander target so it picks a new one inside the bounds
      this.wanderTarget = null;
    }
  }

  draw(ctx) {
    // Draw simple dot without expensive transformations
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  sensePheromone(pixels, width, height) {
    if (!pixels) return false;

    let sensorAngle = Math.PI / 4; // 45 degrees
    let sensorDist = 25; // Distance to look ahead

    let centerAngle = this.vel.heading();
    let leftAngle = centerAngle - sensorAngle;
    let rightAngle = centerAngle + sensorAngle;

    let centerPos = new Vector(
      this.pos.x + Math.cos(centerAngle) * sensorDist,
      this.pos.y + Math.sin(centerAngle) * sensorDist
    );
    let leftPos = new Vector(
      this.pos.x + Math.cos(leftAngle) * sensorDist,
      this.pos.y + Math.sin(leftAngle) * sensorDist
    );
    let rightPos = new Vector(
      this.pos.x + Math.cos(rightAngle) * sensorDist,
      this.pos.y + Math.sin(rightAngle) * sensorDist
    );

    let getRed = (pos) => {
      let x = Math.floor(pos.x);
      let y = Math.floor(pos.y);
      if (x < 0 || x >= width || y < 0 || y >= height) return 0;
      let index = (y * width + x) * 4;
      return pixels[index]; // Return Red channel
    };

    let centerWeight = getRed(centerPos);
    let leftWeight = getRed(leftPos);
    let rightWeight = getRed(rightPos);

    let maxWeight = Math.max(centerWeight, leftWeight, rightWeight);

    // Threshold to ignore faint background trails (red trail from food is drawn stronger)
    if (maxWeight < 10) return false;

    let target = null;
    if (maxWeight === centerWeight) {
      target = centerPos;
    } else if (maxWeight === leftWeight) {
      target = leftPos;
    } else {
      target = rightPos;
    }

    let desired = Vector.sub(target, this.pos);
    desired.normalize();
    desired.mult(this.maxSpeed);
    let steer = Vector.sub(desired, this.vel);
    steer.limit(this.maxForce * 1.5); // Allow slightly sharper turns when following trails
    this.applyForce(steer);

    return true;
  }

  dropPheromone(ctx) {
    // Only drop if moved far enough, to create segments
    if (this.pos.dist(this.lastPheromonePos) > this.pheromoneDropDist) {
      ctx.beginPath();
      ctx.moveTo(this.lastPheromonePos.x, this.lastPheromonePos.y);
      ctx.lineTo(this.pos.x, this.pos.y);

      if (this.state === 1) { // Returning with food
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)'; // Red trail, low opacity
        ctx.lineWidth = 2 + Math.random(); // 2-3 px slight variation
        ctx.stroke();
      } else { // Wandering
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.02)'; // Very faint blue trail
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      this.lastPheromonePos = this.pos.copy();
    }
  }
}
