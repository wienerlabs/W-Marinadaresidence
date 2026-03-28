// Plant Life Animation - adapted from CodePen for Marinada Residence
(function() {
  var container = document.getElementById("plant-divider");
  var canvas = document.getElementById("plant-canvas");
  if (!container || !canvas) return;
  var ctx = canvas.getContext("2d");

  // Square canvas for correct physics — CSS crops to show only the bottom
  var SZ = 1000;
  canvas.width = SZ;
  canvas.height = SZ;

  // Verlet engine
  var points = [], pointCount = 0;
  var spans = [], spanCount = 0;
  var skins = [], skinCount = 0;
  var worldTime = 0;
  var gravity = 0.01;
  var rigidity = 10;
  var friction = 0.999;
  var bounceLoss = 0.9;
  var skidLoss = 0.8;
  var breeze = 0.4;

  function Point(cx, cy, mat) {
    this.cx = cx; this.cy = cy; this.px = cx; this.py = cy;
    this.mass = 1; this.materiality = mat || "material"; this.fixed = false;
    this.id = pointCount++;
  }
  function Span(p1, p2, vis) {
    this.p1 = p1; this.p2 = p2; this.l = dist(p1, p2);
    this.strength = 1; this.visibility = vis || "visible";
    this.id = spanCount++;
  }
  function Skin(pts, color) { this.points = pts; this.color = color; this.id = skinCount++; }

  function xvp(p) { return p * SZ / 100; }
  function yvp(p) { return p * SZ / 100; }
  function pxv(v) { return v * 100 / SZ; }
  function pyv(v) { return v * 100 / SZ; }
  function getPt(id) { for (var i = 0; i < points.length; i++) if (points[i].id === id) return points[i]; }
  function dist(a, b) { var dx = b.cx - a.cx, dy = b.cy - a.cy; return Math.sqrt(dx * dx + dy * dy); }
  function midp(s) { return { x: (s.p1.cx + s.p2.cx) / 2, y: (s.p1.cy + s.p2.cy) / 2 }; }
  function removeSpan(id) { for (var i = 0; i < spans.length; i++) if (spans[i].id === id) { spans.splice(i, 1); break; } }
  function addPt(xp, yp, m) { points.push(new Point(xvp(xp), yvp(yp), m)); return points[points.length - 1]; }
  function addSp(a, b, v) { spans.push(new Span(getPt(a), getPt(b), v)); return spans[spans.length - 1]; }
  function addSk(ids, c) { var a = []; for (var i = 0; i < ids.length; i++) a.push(points[ids[i]]); skins.push(new Skin(a, c)); return skins[skins.length - 1]; }
  function rib(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function rfb(a, b) { return Math.random() * (b - a) + a; }

  function updatePoints() {
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (!p.fixed) {
        var xv = (p.cx - p.px) * friction, yv = (p.cy - p.py) * friction;
        if (p.py >= SZ - 1) xv *= skidLoss;
        p.px = p.cx; p.py = p.cy;
        p.cx += xv; p.cy += yv; p.cy += gravity * p.mass;
        if (worldTime % rib(100, 200) === 0) p.cx += rfb(-breeze, breeze);
      }
    }
  }
  function applyConstraints() {
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (p.materiality === "material") {
        if (p.cx > SZ) { p.cx = SZ; p.px = p.cx + (p.cx - p.px) * bounceLoss; }
        if (p.cx < 0) { p.cx = 0; p.px = p.cx + (p.cx - p.px) * bounceLoss; }
        if (p.cy > SZ) { p.cy = SZ; p.py = p.cy + (p.cy - p.py) * bounceLoss; }
        if (p.cy < 0) { p.cy = 0; p.py = p.cy + (p.cy - p.py) * bounceLoss; }
      }
    }
  }
  function updateSpans(ci) {
    for (var i = 0; i < spans.length; i++) {
      var si = Math.round(rigidity * spans[i].strength);
      if (ci + 1 <= si) {
        var s = spans[i], dx = s.p2.cx - s.p1.cx, dy = s.p2.cy - s.p1.cy;
        var d = Math.sqrt(dx * dx + dy * dy), r = s.l / d;
        var mx = s.p1.cx + dx / 2, my = s.p1.cy + dy / 2;
        var ox = dx / 2 * r, oy = dy / 2 * r;
        if (!s.p1.fixed) { s.p1.cx = mx - ox; s.p1.cy = my - oy; }
        if (!s.p2.fixed) { s.p2.cx = mx + ox; s.p2.cy = my + oy; }
      }
    }
  }
  function refinePositions() {
    var req = rigidity;
    for (var i = 0; i < spans.length; i++) { var si = Math.round(rigidity * spans[i].strength); if (si > req) req = si; }
    for (var j = 0; j < req; j++) { updateSpans(j); applyConstraints(); }
  }

  var plants = [], plantCount = 0;
  var sunRays = [], sunRayCount = 0;
  var phr = 2, geer = 0.5, leer = 0.03;

  function Plant(xLoc) {
    this.id = plantCount; this.segments = []; this.segmentCount = 0;
    this.xLocation = xLoc; this.energy = 5000; this.isAlive = true;
    this.forwardGrowthRate = gravity * rfb(35, 50);
    this.outwardGrowthRate = this.forwardGrowthRate * rfb(0.18, 0.22);
    this.maxSegmentWidth = rfb(6, 8);
    this.maxTotalSegments = rib(4, 8);
    this.firstLeafSegment = rib(2, 4);
    this.leafFrequency = rib(2, 3);
    this.maxLeaflength = this.maxSegmentWidth * rfb(2, 3.5);
    this.leafGrowthRate = this.forwardGrowthRate * rfb(1.4, 1.6);
    this.ptB1 = addPt(this.xLocation - 0.1, 100);
    this.ptB2 = addPt(this.xLocation + 0.1, 100);
    this.ptB1.fixed = this.ptB2.fixed = true;
    this.spB = addSp(this.ptB1.id, this.ptB2.id);
    createSegment(this, null, this.ptB1, this.ptB2);
  }
  function Segment(plant, parent, bp1, bp2) {
    this.plantId = plant.id; this.id = plant.segmentCount;
    this.childSegment = null; this.hasChildSegment = false;
    this.parentSegment = parent; this.isBaseSegment = parent === null;
    this.hasLeaves = false; this.hasLeafScaffolding = false;
    this.forwardGrowthRateVariation = rfb(0.95, 1.05);
    this.mass = 1; this.strength = 1.5;
    this.ptB1 = bp1; this.ptB2 = bp2;
    var ox = (bp1.cx + bp2.cx) / 2, oy = (bp1.cy + bp2.cy) / 2;
    this.ptE1 = addPt(pxv(ox) - 0.1, pyv(oy) - 0.1);
    this.ptE2 = addPt(pxv(ox) + 0.1, pyv(oy) - 0.1);
    this.ptE1.mass = this.ptE2.mass = this.mass / 2;
    this.spL = addSp(bp1.id, this.ptE1.id); this.spR = addSp(bp2.id, this.ptE2.id);
    this.spF = addSp(this.ptE1.id, this.ptE2.id);
    this.spCd = addSp(this.ptE1.id, bp2.id); this.spCu = addSp(bp1.id, this.ptE2.id);
    if (!this.isBaseSegment) {
      this.spCdP = addSp(this.ptE1.id, parent.ptB2.id);
      this.spCuP = addSp(parent.ptB1.id, this.ptE2.id);
    }
    this.ptLf1 = null; this.ptLf2 = null; this.spLf1 = null; this.spLf2 = null;
    this.skins = [];
    this.skins.push(addSk([this.ptE1.id, this.ptE2.id, bp2.id, bp1.id], "#2d5a27"));
  }
  function createPlant() { plantCount++; plants.push(new Plant(rib(10, 90))); }
  function createSegment(pl, par, b1, b2) {
    pl.segmentCount++; pl.segments.unshift(new Segment(pl, par, b1, b2));
    if (par) { par.childSegment = pl.segments[pl.segments.length - 1]; par.hasChildSegment = true; }
  }
  function createSunRays() { for (var i = 0; i < 101; i++) sunRays.push({ id: i, x: xvp(i), intensity: 1, leafContacts: [] }); }
  function markRayLeafIntersections() {
    for (var i = 0; i < plants.length; i++) {
      for (var j = 0; j < plants[i].segments.length; j++) {
        var s = plants[i].segments[j];
        if (s.hasLeaves) {
          [{ lp: s.ptLf1, bp: s.ptB1 }, { lp: s.ptLf2, bp: s.ptB2 }].forEach(function(leaf) {
            var p1, p2;
            if (leaf.lp.cx < leaf.bp.cx) { p1 = leaf.lp; p2 = leaf.bp; } else { p1 = leaf.bp; p2 = leaf.lp; }
            var xMin = Math.ceil(pxv(p1.cx)), xMax = Math.floor(pxv(p2.cx));
            for (var lx = xMin; lx <= xMax; lx++) {
              var ly = p1.cy + (xvp(lx) - p1.cx) * (p2.cy - p1.cy) / (p2.cx - p1.cx);
              if (sunRays[lx]) sunRays[lx].leafContacts.push({ y: ly, plant: plants[i] });
            }
          });
        }
      }
    }
  }
  function photosynthesize() {
    for (var i = 0; i < sunRays.length; i++) {
      var sr = sunRays[i];
      sr.leafContacts.sort(function(a, b) { return a.y - b.y; });
      for (var j = 0; j < sr.leafContacts.length; j++) { sr.intensity /= 2; sr.leafContacts[j].plant.energy += sr.intensity * phr; }
      sr.leafContacts = []; sr.intensity = 1;
    }
  }
  function growPlants() {
    for (var i = 0; i < plants.length; i++) {
      var pl = plants[i];
      if (pl.energy > pl.segmentCount * 1000 && pl.energy > 5000) pl.energy = pl.segmentCount * 1000;
      if (pl.energy > 0) {
        for (var j = 0; j < pl.segments.length; j++) {
          var sg = pl.segments[j];
          if (sg.spF.l < pl.maxSegmentWidth && pl.segments.length < pl.maxTotalSegments) { lengthen(pl, sg); pl.energy -= sg.spCd.l * geer; }
          if (sg.spF.l > pl.maxSegmentWidth * 0.333 && !sg.hasChildSegment && pl.segmentCount < pl.maxTotalSegments) createSegment(pl, sg, sg.ptE1, sg.ptE2);
          if (!sg.hasLeaves) genLeaves(pl, sg);
          else if (pl.segments.length < pl.maxTotalSegments) { growLeaves(pl, sg); pl.energy -= (sg.spLf1.l + sg.spLf2.l) * geer; }
        }
      }
      pl.energy -= pl.segmentCount * leer;
    }
  }
  function lengthen(pl, sg) {
    if (sg.isBaseSegment) {
      sg.ptB1.cx -= pl.outwardGrowthRate / 2; sg.ptB2.cx += pl.outwardGrowthRate / 2;
      pl.spB.l = dist(sg.ptB1, sg.ptB2);
      sg.spCd.l = dist(sg.ptE1, sg.ptB2) + pl.forwardGrowthRate / 3; sg.spCu.l = sg.spCd.l;
    } else {
      sg.spCdP.l = dist(sg.ptE1, sg.parentSegment.ptB2) + pl.forwardGrowthRate;
      sg.spCuP.l = sg.spCdP.l * sg.forwardGrowthRateVariation;
      sg.spCd.l = dist(sg.ptE1, sg.ptB2); sg.spCu.l = dist(sg.ptB1, sg.ptE2);
    }
    sg.spF.l += pl.outwardGrowthRate; sg.spL.l = dist(sg.ptB1, sg.ptE1); sg.spR.l = dist(sg.ptB2, sg.ptE2);
  }
  function genLeaves(pl, sg) {
    if ((sg.id >= pl.firstLeafSegment && sg.id % pl.leafFrequency === 0 && sg.spF.l > pl.maxSegmentWidth * 0.1) || sg.id === pl.maxTotalSegments - 1) {
      var fm = midp(sg.spF);
      sg.ptLf1 = addPt(pxv(fm.x), pyv(fm.y - 1)); sg.ptLf2 = addPt(pxv(fm.x), pyv(fm.y - 1));
      sg.spLf1 = addSp(sg.ptB1.id, sg.ptLf1.id); sg.spLf2 = addSp(sg.ptB2.id, sg.ptLf2.id);
      sg.leafTipsTetherSpan = addSp(sg.ptLf1.id, sg.ptLf2.id); sg.hasLeaves = true;
    }
  }
  function addLeafScaffolding(pl, sg) {
    removeSpan(sg.leafTipsTetherSpan.id);
    sg.ptLf1.cx -= gravity * 100; sg.ptLf2.cx += gravity * 100;
    var x, y;
    x = sg.ptE1.cx + (sg.ptE1.cx - sg.ptE2.cx) * 0.5; y = sg.ptE1.cy + (sg.ptE1.cy - sg.ptE2.cy) * 0.5;
    sg.ptLf1ScA = addPt(pxv(x), pyv(y), "immaterial"); sg.ptLf1ScA.mass = 0;
    x = (sg.ptLf1.cx + sg.ptLf1ScA.cx) / 2; y = (sg.ptLf1.cy + sg.ptLf1ScA.cy) / 2;
    sg.ptLf1ScB = addPt(pxv(x), pyv(y), "immaterial"); sg.ptLf1ScB.mass = 0;
    x = sg.ptE2.cx + (sg.ptE2.cx - sg.ptE1.cx) * 0.5; y = sg.ptE2.cy + (sg.ptE2.cy - sg.ptE1.cy) * 0.5;
    sg.ptLf2ScA = addPt(pxv(x), pyv(y), "immaterial"); sg.ptLf2ScA.mass = 0;
    x = (sg.ptLf2.cx + sg.ptLf2ScA.cx) / 2; y = (sg.ptLf2.cy + sg.ptLf2ScA.cy) / 2;
    sg.ptLf2ScB = addPt(pxv(x), pyv(y), "immaterial"); sg.ptLf2ScB.mass = 0;
    sg.spLf1ScA = addSp(sg.ptE1.id, sg.ptLf1ScA.id, "hidden"); sg.spLf1ScB = addSp(sg.ptB1.id, sg.ptLf1ScA.id, "hidden");
    sg.spLf1ScC = addSp(sg.ptLf1ScA.id, sg.ptLf1ScB.id, "hidden"); sg.spLf1ScD = addSp(sg.ptLf1ScB.id, sg.ptLf1.id, "hidden");
    sg.spLf2ScA = addSp(sg.ptE2.id, sg.ptLf2ScA.id, "hidden"); sg.spLf2ScB = addSp(sg.ptB2.id, sg.ptLf2ScA.id, "hidden");
    sg.spLf2ScC = addSp(sg.ptLf2ScA.id, sg.ptLf2ScB.id, "hidden"); sg.spLf2ScD = addSp(sg.ptLf2ScB.id, sg.ptLf2.id, "hidden");
    sg.hasLeafScaffolding = true;
  }
  function growLeaves(pl, sg) {
    if (sg.spLf1.l < pl.maxLeaflength) {
      sg.spLf1.l = sg.spLf2.l += pl.leafGrowthRate;
      if (sg.spF.l > pl.maxSegmentWidth * 0.6 && !sg.hasLeafScaffolding) addLeafScaffolding(pl, sg);
      else if (sg.hasLeafScaffolding) {
        sg.spLf1ScA.l += pl.leafGrowthRate * 1.25; sg.spLf1ScB.l += pl.leafGrowthRate * 1.5;
        sg.spLf1ScC.l += pl.leafGrowthRate * 0.06; sg.spLf1ScD.l += pl.leafGrowthRate * 0.06;
        sg.spLf2ScA.l += pl.leafGrowthRate * 1.25; sg.spLf2ScB.l += pl.leafGrowthRate * 1.5;
        sg.spLf2ScC.l += pl.leafGrowthRate * 0.06; sg.spLf2ScD.l += pl.leafGrowthRate * 0.06;
      }
    }
  }
  function renderLeaf(ls) {
    var p1x = ls.p1.cx, p1y = ls.p1.cy, p2x = ls.p2.cx, p2y = ls.p2.cy;
    var mx = (p1x + p2x) / 2, my = (p1y + p2y) / 2, ah = 0.35;
    ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.strokeStyle = "#1a3a15"; ctx.fillStyle = "#2d6b1e";
    var cx1 = mx + (p2y - p1y) * ah, cy1 = my + (p1x - p2x) * ah;
    ctx.beginPath(); ctx.moveTo(p1x, p1y); ctx.quadraticCurveTo(cx1, cy1, p2x, p2y); ctx.stroke(); ctx.fill();
    cx1 = mx + (p1y - p2y) * ah; cy1 = my + (p2x - p1x) * ah;
    ctx.beginPath(); ctx.moveTo(p1x, p1y); ctx.quadraticCurveTo(cx1, cy1, p2x, p2y); ctx.stroke(); ctx.fill();
    ctx.beginPath(); ctx.lineWidth = 1; ctx.strokeStyle = "#3a8a2e"; ctx.moveTo(p1x, p1y); ctx.lineTo(p2x, p2y); ctx.stroke();
  }
  function renderPlants() {
    for (var i = 0; i < plants.length; i++) {
      for (var j = 0; j < plants[i].segments.length; j++) {
        var sg = plants[i].segments[j];
        for (var k = 0; k < sg.skins.length; k++) {
          var sk = sg.skins[k];
          ctx.beginPath(); ctx.fillStyle = sk.color; ctx.lineWidth = 1; ctx.strokeStyle = "#1a3a15";
          ctx.moveTo(sk.points[0].cx, sk.points[0].cy);
          for (var m = 1; m < sk.points.length; m++) ctx.lineTo(sk.points[m].cx, sk.points[m].cy);
          ctx.lineTo(sk.points[0].cx, sk.points[0].cy); ctx.stroke(); ctx.fill();
          ctx.beginPath(); ctx.lineWidth = 1; ctx.strokeStyle = "#0f1f0a";
          ctx.moveTo(sk.points[3].cx, sk.points[3].cy); ctx.lineTo(sk.points[0].cx, sk.points[0].cy);
          ctx.moveTo(sk.points[2].cx, sk.points[2].cy); ctx.lineTo(sk.points[1].cx, sk.points[1].cy); ctx.stroke();
          if (!sg.hasChildSegment) { ctx.beginPath(); ctx.moveTo(sk.points[3].cx, sk.points[3].cy); ctx.lineTo(sk.points[2].cx, sk.points[2].cy); ctx.stroke(); }
        }
        if (sg.hasLeaves) { renderLeaf(sg.spLf1); renderLeaf(sg.spLf2); }
      }
    }
  }

  function resetAll() {
    points.length = 0; pointCount = 0;
    spans.length = 0; spanCount = 0;
    skins.length = 0; skinCount = 0;
    plants.length = 0; plantCount = 0;
    sunRays.length = 0; sunRayCount = 0;
    worldTime = 0;
    loopPhase = "growing";
    fadeAlpha = 1;
    for (var i = 0; i < 25; i++) createPlant();
    createSunRays();
  }

  var LOOP_MAX_FRAMES = 900;  // force restart after ~15 sec
  var HOLD_FRAMES = 60;       // hold mature ~1 sec
  var FADE_FRAMES = 40;       // fade out ~0.7 sec
  var loopPhase = "growing";  // "growing" | "holding" | "fading"
  var phaseCounter = 0;
  var fadeAlpha = 1;

  resetAll();

  function display() {
    updatePoints(); refinePositions();
    ctx.clearRect(0, 0, SZ, SZ);

    ctx.globalAlpha = fadeAlpha;
    growPlants(); renderPlants();
    markRayLeafIntersections(); photosynthesize();
    ctx.globalAlpha = 1;
    worldTime++;

    // Loop state machine
    if (loopPhase === "growing") {
      // Check if most plants are fully grown or time limit hit
      var grownCount = 0;
      for (var i = 0; i < plants.length; i++) {
        if (plants[i].segmentCount >= plants[i].maxTotalSegments - 1) grownCount++;
      }
      if (grownCount >= plants.length * 0.8 || worldTime > LOOP_MAX_FRAMES) {
        loopPhase = "holding";
        phaseCounter = 0;
      }
    } else if (loopPhase === "holding") {
      phaseCounter++;
      if (phaseCounter >= HOLD_FRAMES) {
        loopPhase = "fading";
        phaseCounter = 0;
      }
    } else if (loopPhase === "fading") {
      phaseCounter++;
      fadeAlpha = 1 - (phaseCounter / FADE_FRAMES);
      if (fadeAlpha <= 0) {
        fadeAlpha = 1;
        resetAll();
      }
    }

    requestAnimationFrame(display);
  }
  display();
})();
