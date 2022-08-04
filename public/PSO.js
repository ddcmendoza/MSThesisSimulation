(() => {
  let global_best_x = 0;
  let global_best_y = 0;
  let global_best_cost = 1000000;
  const C1 = 1;
  const C2 = 2;
  const particleCount = 400;

  const ParticleAgent = function (id, world) {
    jssim.SimEvent.call(this);
    this.grid = world;
    this.x = Math.floor(Math.random() * 128);
    this.y = Math.floor(Math.random() * 128);
    this.localBestX = this.x;
    this.localBestY = this.y;
    this.localBestCost = 1000000;
    this.vX = 0;
    this.vY = 0;
    this.id = id;
    this.cost = 1000000;
  };

  ParticleAgent.prototype = Object.create(jssim.SimEvent.prototype);
  ParticleAgent.prototype.update = function (deltaTime) {
    this.updateVelocity();
    this.updatePosition();
    this.evaluateCost();
    this.updateLocalBest();
    this.updateGlobalBest();
  };

  ParticleAgent.prototype.evaluateCost = function () {
    this.cost = RosenBrock(this.x, this.y);
  };

  ParticleAgent.prototype.updateGlobalBest = function () {
    if (this.localBestCost > this.cost) {
      this.localBestX = this.x;
      this.localBestY = this.y;
      this.lcoalBestCost = this.cost;
    }
  };

  ParticleAgent.prototype.updateLocalBest = function () {
    if (global_best_cost > this.cost) {
      global_best_cost = this.cost;
      global_best_x = this.x;
      global_best_y = this.y;
    }
  };

  ParticleAgent.prototype.updateVelocity = function () {
    const oldVX = this.vX;
    const oldVY = this.vY;

    const oldX = this.x;
    const oldY = this.y;

    let r1 = Math.random();
    let r2 = Math.random();
    let r3 = Math.random();

    let w = 0.5 + r3 / 2;
    const newVX =
      w * oldVX +
      C1 * r1 * (this.localBestX - oldX) +
      C2 * r2 * (global_best_x - oldX);

    r1 = Math.random();
    r2 = Math.random();
    r3 = Math.random();

    w = 0.5 + r3 / 2;
    const newVY =
      w * oldVY +
      C1 * r1 * (this.localBestY - oldY) +
      C2 * r2 * (global_best_y - oldY);

    this.vX = newVX;
    this.vY = newVY;
  };

  ParticleAgent.prototype.updatePosition = function () {
    this.grid.setCell(this.x, this.y, 0);
    this.x = Math.min(127, this.vX + this.x);
    this.y = Math.min(127, this.vY + this.y);
    this.x = Math.max(0, Math.floor(this.x));
    this.y = Math.max(0, Math.floor(this.y));
    this.grid.setCell(this.x, this.y, 1);
  };

  const scheduler = new jssim.Scheduler();
  const grid = new jssim.Grid(128, 128);
  grid.cellWidth = 5;
  grid.cellHeight = 5;
  grid.showPotentialField = true;
  let particles = [];

  function RosenBrock(x, y) {
    x = ((x - 64) * 5.0) / 128.0;
    y = ((y - 64) * 5.0) / 128.0;
    const expr1 = x * x - y;
    const expr2 = 1 - x;
    return 100 * expr1 * expr1 + expr2 * expr2;
  }

  function Rastrigin(x, y) {
    x = ((x - 64) * 5.12) / 128.0;
    y = ((y - 64) * 5.12) / 128.0;
    return (
      20 +
      x * x -
      10 * Math.cos(2 * Math.PI * x) +
      y * y -
      10 * Math.cos(2 * Math.PI * y)
    );
  }

  function Griewangk(x, y) {
    x = ((x - 64) * 600) / 128.0;
    y = ((y - 64) * 600) / 128.0;
    return (
      1 +
      (x * x) / 4000 +
      (y * y) / 4000 -
      Math.cos(x) * Math.cos(y / Math.sqrt(2))
    );
  }

  function init() {
    scheduler.reset();
    grid.reset();

    for (let x = 0; x < 128; ++x) {
      for (let y = 0; y < 128; ++y) {
        grid.setPotential(x, y, Rastrigin(x, y));
      }
    }

    global_best_x = Math.floor(Math.random() * 128);
    global_best_y = Math.floor(Math.random() * 128);
    global_best_cost = RosenBrock(global_best_x, global_best_y);

    particles = [];
    for (let i = 0; i < particleCount; ++i) {
      const p = new ParticleAgent(i, grid);
      particles.push(p);
      scheduler.scheduleRepeatingIn(p, 1);
    }
  }

  init();
  const canvas = document.getElementById("myCanvas");
  setInterval(() => {
    scheduler.update();

    grid.render(canvas);
    //console.log('current simulation time: ' + scheduler.current_time);
    document.getElementById(
      "simTime"
    ).value = `Generation: ${scheduler.current_time}`;
    document.getElementById(
      "globalBest"
    ).value = `Best Score: ${global_best_cost}`;

    let averageScore = 0;
    for (let i = 0; i < particleCount; ++i) {
      const p = particles[i];
      averageScore += p.cost;
    }
    averageScore /= particleCount;

    document.getElementById(
      "averageScore"
    ).value = `Avg Score: ${averageScore}`;
  }, 500);
  setInterval(init, 40000);
})();
