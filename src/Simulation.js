import Ant from './Ant.js';
import Vector from './Vector.js';

export default class Simulation {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    
    this.nest = new Vector(width / 2, height / 2);
    this.foods = [];
    this.ants = [];
    this.pheromones = [];
    
    this.initFoods();
    this.initAnts(200);
  }

  initFoods() {
    this.foods = [];
    // Start with a few random ones.
    for (let i = 0; i < 3; i++) {
      let x = this.width * 0.1 + Math.random() * this.width * 0.8;
      let y = this.height * 0.1 + Math.random() * this.height * 0.8;
      this.addFood(x, y);
    }
  }

  addFood(x, y) {
    this.foods.push({ pos: new Vector(x, y), amount: 1000 });
  }

  initAnts(count) {
    for (let i = 0; i < count; i++) {
      this.ants.push(new Ant(this.nest.x, this.nest.y));
    }
  }

  addAnt(x, y) {
    this.ants.push(new Ant(x, y));
  }

  update(pheromoneCtx, pixels) {
    for (let ant of this.ants) {
      // Behavior based on state
      if (ant.state === 0) { // Looking for food
        let targetFood = this.getClosestFood(ant);
        // Ant senses food and heads towards it if close enough
        if (targetFood && ant.pos.dist(targetFood.pos) < 150) {
          ant.arrive(targetFood.pos); 
        } else {
          // Try to follow pheromone trail, otherwise wander
          if (!pixels || !ant.sensePheromone(pixels, this.width, this.height)) {
            ant.wander();
          }
        }
        
        // Check food collision
        if (targetFood && ant.pos.dist(targetFood.pos) < 20) {
          ant.state = 1; // Got food, return to nest
          ant.vel.mult(-1); // Turn around
          targetFood.amount -= 2; // Deplete food
        }
      } else { // Returning to nest
        // TODO - Try adding obstacles on the way back home
        ant.arrive(this.nest);
        
        // Check nest collision
        if (ant.pos.dist(this.nest) < 30) {
          ant.state = 0; // Dropped food, look for more
          ant.vel.mult(-1); // Turn around
        }
      }
      
      ant.update();
      ant.checkEdges(this.width, this.height);
      ant.dropPheromone(pheromoneCtx);
    }
    
    // Remove depleted food
    this.foods = this.foods.filter(food => food.amount > 0);
  }

  getClosestFood(ant) {
    let closest = null;
    let record = Infinity;
    for (let food of this.foods) {
      let d = ant.pos.dist(food.pos);
      if (d < record) {
        record = d;
        closest = food;
      }
    }
    return closest;
  }

  draw(ctx) {
    // graph connections between foods
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Connect each food to every other food
    for (let i = 0; i < this.foods.length; i++) {
      for (let j = i + 1; j < this.foods.length; j++) {
        ctx.moveTo(this.foods[i].pos.x, this.foods[i].pos.y);
        ctx.lineTo(this.foods[j].pos.x, this.foods[j].pos.y);
      }
      // Connect nest to foods
      ctx.moveTo(this.nest.x, this.nest.y);
      ctx.lineTo(this.foods[i].pos.x, this.foods[i].pos.y);
    }
    ctx.stroke();

    // Draw foods
    for (let food of this.foods) {
      ctx.fillStyle = '#10b981'; // Meh color!!! Improve asthetics of it
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#10b981';
      ctx.beginPath();
      let radius = Math.max(3, (food.amount / 1000) * 12);
      ctx.arc(food.pos.x, food.pos.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw nest
    ctx.fillStyle = '#ecef3cff'; // Looks ok i think
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ecef3cff';
    ctx.beginPath();
    ctx.arc(this.nest.x, this.nest.y, 25, 0, Math.PI * 2);
    ctx.fill();

    // Reset shadowBlur before drawing ants! Blur is too costly it seems, making the animation lag a lot
    ctx.shadowBlur = 0;
    
    // Draw ants
    for (let ant of this.ants) {
      ant.draw(ctx);
    }
    
  }
}
