(() => {
  const target_x = 110;
  const target_y = 40;
  const tiles = 128;
  const tau_0 = 1.0 / (tiles * tiles);

  const Evaporator = function (pheromones, grid) {
    jssim.SimEvent.call(this, 1);
    this.pheromones = pheromones;
    this.grid = grid;
  };

  Evaporator.prototype = Object.create(jssim.SimEvent);

  Evaporator.prototype.update = function (deltaTime) {
    for (let x = 0; x < tiles; ++x) {
      for (let y = 0; y < tiles; ++y) {
        let t = this.pheromones.getCell(x, y);
        t = 0.9 * t;
        if (t < tau_0) {
          t = tau_0;
          this.grid.setPotential(x, y, 0);
        } else {
          this.grid.setPotential(x, y, t);
        }
        this.pheromones.setCell(x, y, t);
      }
    }
  };

  const Ant = function (id, grid, pheromones, x, y) {
    jssim.SimEvent.call(this, 2);
    this.id = id;
    this.x = x;
    this.y = y;
    this.init_x = x;
    this.init_y = y;
    this.prev_x = x;
    this.prev_y = y;
    this.grid = grid;
    this.pheromones = pheromones;
    this.grid.setCell(this.x, this.y, 1);
    this.path = [];
    this.age = 0;
    this.life = 150;
  };
  Ant.prototype = Object.create(jssim.SimEvent);

  Ant.prototype.reset = function () {
    this.grid.setCell(this.x, this.y, 0);
    this.x = this.init_x;
    this.y = this.init_y;
    this.prev_x = this.x;
    this.prev_y = this.y;
    this.grid.setCell(this.x, this.y, 1);
    this.age = 0;
    this.path = [];
  };

  Ant.prototype.depositPheromones = function () {
    for (const move of this.path) {
      this.pheromones.setCell(
        move.x,
        move.y,
        this.pheromones.getCell(move.x, move.y) + 1.0 / this.path.length
      );
      this.grid.setPotential(
        move.x,
        move.y,
        this.pheromones.getCell(move.x, move.y)
      );
    }
  };

  Ant.prototype.getCandidateMoves = function () {
    const candidates = [];

    for (let dx = -1; dx <= 1; ++dx) {
      for (let dy = -1; dy <= 1; ++dy) {
        const _x = this.x + dx;
        const _y = this.y + dy;
        if (_x == this.prev_x && _y == this.prev_y) continue;
        if (_x == this.x && _y == this.y) continue;
        if (this.grid.isObstacle(_x, _y)) {
          continue;
        }
        if (this.grid.isOccupied(_x, _y)) {
          continue;
        }
        if (this.grid.isTarget(_x, _y)) {
          this.depositPheromones();
          this.reset();
          return candidates;
        }

        candidates.push({
          x: _x,
          y: _y,
        });
      }
    }
    return candidates;
  };

  Ant.prototype.selectMove = function (candidates) {
    const heuristics = [];

    const dx2 = target_x - this.x;
    const dy2 = target_y - this.y;
    const dlen2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    for (var i = 0; i < candidates.length; ++i) {
      const move = candidates[i];
      const dx = move.x - this.x;
      const dy = move.y - this.y;
      const dlen = Math.sqrt(dx * dx + dy * dy);

      const heuristic_b =
        ((dx * dx2 + dy * dy2) / (dlen * dlen2) + 1) / (tiles * tiles);
      const heuristic_a = this.pheromones.getCell(move.x, move.y);
      const heuristic = heuristic_a * heuristic_b ** 2.0;

      heuristics.push(heuristic);
    }

    let r = Math.random();

    if (r < 0.9) {
      // Exploitation
      let max_i = -1;
      let max_heuristic = 0;
      for (var i = 0; i < candidates.length; ++i) {
        if (heuristics[i] > max_heuristic) {
          max_heuristic = heuristics[i];
          max_i = i;
        }
      }
      return max_i;
    } else {
      // Exploration
      r = Math.random();
      let heuristic_sum = 0;
      for (var i = 0; i < candidates.length; ++i) {
        heuristic_sum += heuristics[i];
        heuristics[i] = heuristic_sum;
      }
      for (var i = 0; i < candidates.length; ++i) {
        heuristics[i] /= heuristic_sum;
      }

      for (var i = 0; i < candidates.length; ++i) {
        if (r <= heuristics[i]) {
          return i;
        }
      }
    }
    return -1;
  };

  Ant.prototype.update = function (deltaTime) {
    this.age++;

    if (this.age >= this.life) {
      this.reset();
    }

    const candidates = this.getCandidateMoves();

    if (candidates.length == 0) return;

    const max_i = this.selectMove(candidates);

    let act_x = this.x;
    let act_y = this.y;

    if (max_i != -1) {
      act_x = candidates[max_i].x;
      act_y = candidates[max_i].y;
      this.path.push(candidates[max_i]);
    }

    this.moveTo(act_x, act_y);
  };

  Ant.prototype.moveTo = function (act_x, act_y) {
    this.grid.setCell(this.x, this.y, 0);
    this.prev_x = this.x;
    this.prev_y = this.y;
    this.x = act_x;
    this.y = act_y;
    this.grid.setCell(this.x, this.y, 1);
  };

  const scheduler = new jssim.Scheduler();

  const grid = new jssim.Grid(tiles, tiles);
  grid.cellWidth = 5;
  grid.cellHeight = 5;
  grid.showTrails = true;
  grid.showPotentialField = true;

  const pheromones = new jssim.Grid(tiles, tiles);
  pheromones.cellWidth = 5;
  pheromones.cellHeight = 5;

  function reset() {
    scheduler.reset();
    grid.reset();
    pheromones.reset();

    grid.createCylinder(50, 80, 20);
    grid.createCylinder(30, 100, 10);
    grid.createCylinder(80, 50, 21);
    grid.createCylinder(80, 28, 11);
    grid.createCylinder(75, 35, 11);

    grid.createCylinder(103, 26, 11);

    for (let x = 0; x < tiles; ++x) {
      for (let y = 0; y < tiles; ++y) {
        pheromones.setCell(x, y, tau_0);
      }
    }

    grid.createTarget(target_x, target_y, 4);

    for (let i = 0; i < 30; ++i) {
      const dx = Math.floor(Math.random() * 10) - 5;
      const dy = Math.floor(Math.random() * 10) - 5;

      const ant = new Ant(i, grid, pheromones, 10 + dx, 50 + dy);
      scheduler.scheduleRepeatingIn(ant, 1);
    }
    scheduler.scheduleRepeatingIn(new Evaporator(pheromones, grid), 1);
  }

  reset();

  const canvas = document.getElementById("myCanvas");

  setInterval(() => {
    if (scheduler.current_time == 10000) {
      reset();
    }
    scheduler.update();
    grid.render(canvas);
    //console.log('current simulation time: ' + scheduler.current_time);
    document.getElementById(
      "simTime"
    ).value = `Simulation Time: ${scheduler.current_time}`;
  }, 50);
})();
