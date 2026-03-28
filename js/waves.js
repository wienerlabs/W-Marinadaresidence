// Minimal SimplexNoise implementation
(function() {
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  const F3 = 1 / 3;
  const G3 = 1 / 6;
  const grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];

  function SimplexNoise() {
    this.p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) this.p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = this.p[i & 255];
  }

  SimplexNoise.prototype.noise2D = function(x, y) {
    const s = (x + y) * F2;
    const i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G2;
    const X0 = i - t, Y0 = j - t;
    const x0 = x - X0, y0 = y - Y0;
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) { t0 *= t0; const gi = this.perm[ii + this.perm[jj]] % 12; n0 = t0 * t0 * (grad3[gi][0] * x0 + grad3[gi][1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) { t1 *= t1; const gi = this.perm[ii + i1 + this.perm[jj + j1]] % 12; n1 = t1 * t1 * (grad3[gi][0] * x1 + grad3[gi][1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) { t2 *= t2; const gi = this.perm[ii + 1 + this.perm[jj + 1]] % 12; n2 = t2 * t2 * (grad3[gi][0] * x2 + grad3[gi][1] * y2); }
    return 70 * (n0 + n1 + n2);
  };

  SimplexNoise.prototype.noise3D = function(x, y, z) {
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
    const t = (i + j + k) * G3;
    const X0 = i - t, Y0 = j - t, Z0 = k - t;
    const x0 = x - X0, y0 = y - Y0, z0 = z - Z0;
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=1;k2=0; }
      else if (x0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=0;k2=1; }
      else { i1=0;j1=0;k1=1;i2=1;j2=0;k2=1; }
    } else {
      if (y0 < z0) { i1=0;j1=0;k1=1;i2=0;j2=1;k2=1; }
      else if (x0 < z0) { i1=0;j1=1;k1=0;i2=0;j2=1;k2=1; }
      else { i1=0;j1=1;k1=0;i2=1;j2=1;k2=0; }
    }
    const x1=x0-i1+G3, y1=y0-j1+G3, z1=z0-k1+G3;
    const x2=x0-i2+2*G3, y2=y0-j2+2*G3, z2=z0-k2+2*G3;
    const x3=x0-1+3*G3, y3=y0-1+3*G3, z3=z0-1+3*G3;
    const ii=i&255, jj=j&255, kk=k&255;
    let n0=0,n1=0,n2=0,n3=0;
    let t0=0.6-x0*x0-y0*y0-z0*z0;
    if(t0>=0){t0*=t0;const gi=this.perm[ii+this.perm[jj+this.perm[kk]]]%12;n0=t0*t0*(grad3[gi][0]*x0+grad3[gi][1]*y0+grad3[gi][2]*z0);}
    let t1=0.6-x1*x1-y1*y1-z1*z1;
    if(t1>=0){t1*=t1;const gi=this.perm[ii+i1+this.perm[jj+j1+this.perm[kk+k1]]]%12;n1=t1*t1*(grad3[gi][0]*x1+grad3[gi][1]*y1+grad3[gi][2]*z1);}
    let t2=0.6-x2*x2-y2*y2-z2*z2;
    if(t2>=0){t2*=t2;const gi=this.perm[ii+i2+this.perm[jj+j2+this.perm[kk+k2]]]%12;n2=t2*t2*(grad3[gi][0]*x2+grad3[gi][1]*y2+grad3[gi][2]*z2);}
    let t3=0.6-x3*x3-y3*y3-z3*z3;
    if(t3>=0){t3*=t3;const gi=this.perm[ii+1+this.perm[jj+1+this.perm[kk+1]]]%12;n3=t3*t3*(grad3[gi][0]*x3+grad3[gi][1]*y3+grad3[gi][2]*z3);}
    return 32*(n0+n1+n2+n3);
  };

  window.SimplexNoise = SimplexNoise;
})();

// Wave Animation
(function() {
  const container = document.getElementById('wave-divider');
  if (!container) return;

  const layers = [
    { fill: '#d6d3d1' },  // stone-300
    { fill: '#a8a29e' },  // stone-400
    { fill: '#78716c' },  // stone-500
    { fill: '#57534e' },  // stone-600
    { fill: '#44403c' },  // stone-700
    { fill: '#292524' },  // stone-800
    { fill: '#1c1917' },  // stone-900
  ];

  const config = {
    resX: 10,
    hCoef: 30,
    timeCoef: 0.00008,
    mouseCoef: 0.5,
    mouseNoise: 0
  };

  let width = 0, height = 0, cx = 0, cy = 0, h1 = 0;
  const simplex = new SimplexNoise();
  const svgs = [];

  // Create SVG elements
  layers.forEach(function(layer) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.style.cssText = 'position:absolute;display:block;width:100%;height:100%;opacity:0.85;';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', layer.fill);
    path.setAttribute('stroke', brighten(layer.fill));
    path.style.strokeWidth = '1px';

    g.appendChild(path);
    svg.appendChild(g);
    container.appendChild(svg);
    svgs.push({ svg: svg, g: g, path: path, fill: layer.fill });
  });

  function brighten(hex) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    const nr = Math.min(255, r + 50), ng = Math.min(255, g + 50), nb = Math.min(255, b + 50);
    return 'rgba(' + nr + ',' + ng + ',' + nb + ',0.4)';
  }

  function onResize() {
    const r = container.getBoundingClientRect();
    width = r.width;
    height = r.height;
    cx = width / 2;
    cy = height / 2;
    h1 = height / (layers.length + 1);
  }

  function animate() {
    const time = Date.now() * config.timeCoef;
    const n = Math.round(width / config.resX);
    const dx = width / n;

    svgs.forEach(function(s, index) {
      s.g.setAttribute('transform', 'translate(' + cx + ',' + cy + ')');

      let ty = -cy + (index + 1) * h1;
      ty += simplex.noise2D(time * 2.5, index * 0.5) * h1 * 0.5;

      const points = [];
      for (let i = 0; i <= n; i++) {
        const x = -cx + i * dx;
        const y = ty + simplex.noise3D(index + time, x * 0.001 * (0.5 * (index + 1)) + time, config.mouseNoise) * config.hCoef;
        points.push([x, y]);
      }
      points.push([cx, cy], [-cx, cy]);

      let d = '';
      points.forEach(function(p, i) {
        d += (i === 0 ? 'M ' : ' L ') + p[0] + ',' + p[1];
      });
      d += ' Z';
      s.path.setAttribute('d', d);
    });

    requestAnimationFrame(animate);
  }

  container.addEventListener('mousemove', function(e) {
    const mx = (e.clientX / width) * 2 - 1;
    const my = (e.clientY / height) * 2 - 1;
    config.mouseNoise = config.mouseCoef * (mx + my);
  });

  window.addEventListener('resize', onResize);
  onResize();
  animate();
})();
