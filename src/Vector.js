export default class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  mult(n) {
    this.x *= n;
    this.y *= n;
    return this;
  }

  div(n) {
    this.x /= n;
    this.y /= n;
    return this;
  }

  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  normalize() {
    const m = this.mag();
    if (m !== 0 && m !== 1) {
      this.div(m);
    }
    return this;
  }

  limit(max) {
    if (this.magSq() > max * max) {
      this.normalize();
      this.mult(max);
    }
    return this;
  }

  setHeading(angle) {
    const m = this.mag();
    this.x = m * Math.cos(angle);
    this.y = m * Math.sin(angle);
    return this;
  }

  heading() {
    return Math.atan2(this.y, this.x);
  }

  dist(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  copy() {
    return new Vector(this.x, this.y);
  }

  static sub(v1, v2) {
    return new Vector(v1.x - v2.x, v1.y - v2.y);
  }

  static dist(v1, v2) {
    return v1.dist(v2);
  }

  static random2D() {
    const angle = Math.random() * Math.PI * 2;
    return new Vector(Math.cos(angle), Math.sin(angle));
  }
}
