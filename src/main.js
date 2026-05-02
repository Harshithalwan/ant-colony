import Simulation from './Simulation.js';

const mainCanvas = document.getElementById('main-canvas');
const pheromoneCanvas = document.getElementById('pheromone-canvas');
const mainCtx = mainCanvas.getContext('2d');
const pheromoneCtx = pheromoneCanvas.getContext('2d', { willReadFrequently: true });

const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const evapSlider = document.getElementById('evaporation-slider');
const evapValue = document.getElementById('evaporation-value');

let width, height;
let simulation;
let speed = 1;
let evaporationRate = 0.001;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  mainCanvas.width = width;
  mainCanvas.height = height;
  pheromoneCanvas.width = width;
  pheromoneCanvas.height = height;
  
  if (!simulation) {
    simulation = new Simulation(width, height);
  } else {
    simulation.width = width;
    simulation.height = height;
    simulation.nest.x = width / 2;
    simulation.nest.y = height / 2;
  }
}

window.addEventListener('resize', resize);

speedSlider.addEventListener('input', (e) => {
  speed = parseFloat(e.target.value);
  speedValue.textContent = speed.toFixed(1) + 'x';
});

evapSlider.addEventListener('input', (e) => {
  evaporationRate = parseFloat(e.target.value);
  evapValue.textContent = evaporationRate.toFixed(4);
});

const togglePanelBtn = document.getElementById('toggle-panel-btn');
const uiPanel = document.getElementById('ui-panel');
if (togglePanelBtn && uiPanel) {
  togglePanelBtn.addEventListener('click', () => {
    uiPanel.classList.toggle('collapsed');
  });
}

const addFoodBtn = document.getElementById('add-food-btn');
const addAntsBtn = document.getElementById('add-ants-btn');
let placementMode = 'none';

function updateButtonStates() {
  if (placementMode === 'food') {
    addFoodBtn.textContent = 'Click to place... (Click to stop)';
    addFoodBtn.style.background = '#f59e0b';
    if(addAntsBtn) {
      addAntsBtn.textContent = 'Add Ants';
      addAntsBtn.style.background = '';
    }
    mainCanvas.style.cursor = 'crosshair';
  } else if (placementMode === 'ants') {
    if(addAntsBtn) {
      addAntsBtn.textContent = 'Click/Hold to place... (Click to stop)';
      addAntsBtn.style.background = '#f59e0b';
    }
    addFoodBtn.textContent = 'Add Food Source';
    addFoodBtn.style.background = '';
    mainCanvas.style.cursor = 'crosshair';
  } else {
    addFoodBtn.textContent = 'Add Food Source';
    addFoodBtn.style.background = '';
    if(addAntsBtn) {
      addAntsBtn.textContent = 'Add Ants';
      addAntsBtn.style.background = '';
    }
    mainCanvas.style.cursor = 'default';
  }
}

if (addFoodBtn) {
  addFoodBtn.addEventListener('click', () => {
    placementMode = placementMode === 'food' ? 'none' : 'food';
    updateButtonStates();
  });
}

if (addAntsBtn) {
  addAntsBtn.addEventListener('click', () => {
    placementMode = placementMode === 'ants' ? 'none' : 'ants';
    updateButtonStates();
  });
}

let isMouseDown = false;
let mouseX = 0;
let mouseY = 0;

mainCanvas.addEventListener('mousedown', (e) => {
  if (placementMode !== 'none') {
    isMouseDown = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (placementMode === 'food' && simulation) {
      simulation.addFood(mouseX, mouseY);
    } else if (placementMode === 'ants' && simulation) {
      simulation.addAnt(mouseX, mouseY);
    }
  }
});

mainCanvas.addEventListener('mousemove', (e) => {
  if (isMouseDown && placementMode !== 'none') {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }
});

mainCanvas.addEventListener('mouseup', () => {
  isMouseDown = false;
});

mainCanvas.addEventListener('mouseleave', () => {
  isMouseDown = false;
});

function animate() {
  // Evaporate pheromones using destination-out
  pheromoneCtx.globalCompositeOperation = 'destination-out';
  // Fill screen with low-opacity black to slowly erase trails
  pheromoneCtx.fillStyle = `rgba(0, 0, 0, ${evaporationRate * speed})`;
  pheromoneCtx.fillRect(0, 0, width, height);
  pheromoneCtx.globalCompositeOperation = 'source-over';
  
  // Clear main canvas for drawing ants and nodes
  mainCtx.clearRect(0, 0, width, height);

  const imgData = pheromoneCtx.getImageData(0, 0, width, height);
  const pixels = imgData.data;
  
  // Determine how many steps to simulate this frame based on speed
  const steps = Math.floor(speed);
  const remainder = speed - steps;
  
  if (isMouseDown && placementMode === 'ants' && simulation) {
    for (let i = 0; i < 2; i++) { // Spawn a couple per frame while held
      simulation.addAnt(mouseX + (Math.random() - 0.5) * 10, mouseY + (Math.random() - 0.5) * 10);
    }
  }
  
  for (let i = 0; i < steps; i++) {
    simulation.update(pheromoneCtx, pixels);
  }
  
  if (remainder > 0 && Math.random() < remainder) {
    simulation.update(pheromoneCtx, pixels);
  }


  simulation.draw(mainCtx);
  
  requestAnimationFrame(animate);
}

resize();
animate();
