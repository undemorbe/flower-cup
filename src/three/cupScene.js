import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// --- цвета берём из CSS-токенов, чтобы 3D и вёрстка жили в одной палитре ---
const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
function tokenColor(name) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  probe.clearRect(0, 0, 1, 1)
  probe.fillStyle = value
  probe.fillRect(0, 0, 1, 1)
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace)
}
const cssColor = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const CUP_H = 2.1
const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

// --- текстура крафта: волокна + штамп + рукописная подпись ---
function kraftTexture() {
  const c = document.createElement('canvas')
  // пропорции ≈ длина окружности / высота стенки, чтобы штамп не растягивался
  c.width = 2048
  c.height = 720
  const g = c.getContext('2d')
  g.fillStyle = cssColor('--color-kraft')
  g.fillRect(0, 0, c.width, c.height)

  // волокна бумаги
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 2600; i++) {
    g.strokeStyle = rnd() > 0.5 ? cssColor('--color-kraft-deep') : cssColor('--color-peach')
    g.globalAlpha = 0.05 + rnd() * 0.12
    g.lineWidth = 0.6 + rnd() * 1.4
    const x = rnd() * c.width
    const y = rnd() * c.height
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + (rnd() - 0.5) * 60, y + (rnd() - 0.5) * 8)
    g.stroke()
  }
  g.globalAlpha = 1

  // лицевая сторона - центр текстуры (u = 0.5)
  const cx = c.width / 2
  const cy = c.height * 0.54
  const ink = cssColor('--color-forest')
  g.strokeStyle = ink
  g.fillStyle = ink
  g.lineWidth = 5
  g.beginPath()
  g.arc(cx, cy, 118, 0, Math.PI * 2)
  g.stroke()
  g.setLineDash([6, 10])
  g.lineWidth = 3
  g.beginPath()
  g.arc(cx, cy, 98, 0, Math.PI * 2)
  g.stroke()
  g.setLineDash([])

  // веточка внутри штампа
  g.lineWidth = 5
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(cx, cy + 64)
  g.lineTo(cx, cy - 50)
  g.stroke()
  const leaf = (x, y, dir, size) => {
    g.beginPath()
    g.moveTo(x, y)
    g.quadraticCurveTo(x + dir * size, y - size * 0.15, x + dir * size * 0.9, y - size)
    g.quadraticCurveTo(x + dir * size * 0.15, y - size * 0.8, x, y)
    g.fill()
  }
  leaf(cx, cy + 30, -1, 44)
  leaf(cx, cy + 8, 1, 40)
  leaf(cx, cy - 16, -1, 32)
  leaf(cx, cy - 36, 1, 26)

  g.font = '500 68px "Cormorant Garamond", Georgia, serif'
  g.textAlign = 'center'
  g.fillText('Flower Cup', cx, cy - 150)
  g.font = '46px "Marck Script", cursive'
  g.fillText('посади меня', cx, cy + 180)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

// --- геометрии ---
function petalGeometry(length, width, lift = 0.12) {
  const geo = new THREE.SphereGeometry(1, 10, 6)
  geo.scale(width, 0.018, length)
  geo.translate(0, 0, length * 1.05)
  geo.rotateX(-lift)
  return geo
}

function ringOf(base, count, tiltJitter = 0.1) {
  const parts = []
  for (let i = 0; i < count; i++) {
    const g = base.clone()
    g.rotateX(-(Math.sin(i * 12.9898) * 0.5 + 0.5) * tiltJitter)
    g.rotateY((Math.PI * 2 * i) / count)
    parts.push(g)
  }
  return mergeGeometries(parts)
}

function leafGeometry(len) {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(len * 0.32, len * 0.25, len * 0.28, len * 0.75, 0, len)
  s.bezierCurveTo(-len * 0.28, len * 0.75, -len * 0.32, len * 0.25, 0, 0)
  const geo = new THREE.ShapeGeometry(s, 12)
  // лёгкий изгиб листа
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    pos.setZ(i, -Math.abs(x) * 0.6 + (y / len) * (y / len) * 0.12)
  }
  geo.computeVertexNormals()
  return geo
}

// --- сцена ---
export async function createCupScene(canvas, { reducedMotion = false, lowPower = false } = {}) {
  await Promise.all([
    document.fonts.load('500 92px "Cormorant Garamond"', 'Flower Cup'),
    document.fonts.load('62px "Marck Script"', 'посади меня'),
  ]).catch(() => {})

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.75 : 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.localClippingEnabled = true

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)

  const C = {
    kraft: tokenColor('--color-kraft'),
    kraftDeep: tokenColor('--color-kraft-deep'),
    petal: tokenColor('--color-petal'),
    pollen: tokenColor('--color-pollen'),
    sunflower: tokenColor('--color-sunflower'),
    seedhead: tokenColor('--color-seedhead'),
    lavender: tokenColor('--color-lavender'),
    cornflower: tokenColor('--color-cornflower'),
    leaf: tokenColor('--color-leaf'),
    sage: tokenColor('--color-sage-soft'),
    stem: tokenColor('--color-stem'),
    soil: tokenColor('--color-soil'),
    paper: tokenColor('--color-paper'),
    peach: tokenColor('--color-peach'),
  }

  // свет: тёплое «окно» сверху-справа + мягкий отражённый
  scene.add(new THREE.HemisphereLight(C.paper, C.kraftDeep, 1.6))
  const key = new THREE.DirectionalLight(C.peach, 2.6)
  key.position.set(4.5, 9, 6)
  key.castShadow = true
  key.shadow.mapSize.setScalar(lowPower ? 1024 : 2048)
  key.shadow.camera.left = -4
  key.shadow.camera.right = 4
  key.shadow.camera.top = 6
  key.shadow.camera.bottom = -2
  key.shadow.radius = 6
  key.shadow.bias = -0.0005
  scene.add(key)
  const rim = new THREE.DirectionalLight(C.sage, 0.7)
  rim.position.set(-6, 3, -4)
  scene.add(rim)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ opacity: 0.14 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // земляной холмик для посадки
  const mound = new THREE.Mesh(
    new THREE.SphereGeometry(1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: C.soil, roughness: 1 }),
  )
  mound.scale.set(1.75, 0.0001, 1.75)
  mound.receiveShadow = true
  mound.visible = false
  scene.add(mound)

  const root = new THREE.Group()
  root.rotation.y = -0.35
  scene.add(root)

  const cup = new THREE.Group()
  root.add(cup)

  // стаканчик
  const profile = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.74, 0),
    new THREE.Vector2(0.78, 0.04),
    new THREE.Vector2(1.02, CUP_H - 0.04),
    new THREE.Vector2(1.03, CUP_H),
  ]
  const wallMat = new THREE.MeshStandardMaterial({
    map: kraftTexture(),
    roughness: 0.92,
    side: THREE.DoubleSide,
    clippingPlanes: [GROUND],
  })
  const wallGeo = new THREE.LatheGeometry(profile, 96)
  // UV по высоте, а не по индексу точки профиля - иначе текстура сжимается
  const wp = wallGeo.attributes.position
  const wuv = wallGeo.attributes.uv
  for (let i = 0; i < wp.count; i++) wuv.setY(i, wp.getY(i) / CUP_H)
  const wall = new THREE.Mesh(wallGeo, wallMat)
  wall.rotation.y = Math.PI // лицевая сторона текстуры - к зрителю
  wall.castShadow = true
  wall.receiveShadow = true
  cup.add(wall)

  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(1.03, 0.055, 12, 96),
    new THREE.MeshStandardMaterial({ color: C.kraftDeep, roughness: 0.85, clippingPlanes: [GROUND] }),
  )
  lip.rotation.x = Math.PI / 2
  lip.position.y = CUP_H
  lip.castShadow = true
  cup.add(lip)

  const soilTop = new THREE.Mesh(
    new THREE.CircleGeometry(0.98, 48),
    new THREE.MeshStandardMaterial({ color: C.soil, roughness: 1 }),
  )
  soilTop.rotation.x = -Math.PI / 2
  soilTop.position.y = CUP_H - 0.12
  soilTop.scale.setScalar(0.001)
  cup.add(soilTop)

  // --- букет ---
  const bouquet = new THREE.Group()
  cup.add(bouquet)
  const M = {
    petal: new THREE.MeshStandardMaterial({ color: C.petal, roughness: 0.55, side: THREE.DoubleSide }),
    pollen: new THREE.MeshStandardMaterial({ color: C.pollen, roughness: 0.8 }),
    sunflower: new THREE.MeshStandardMaterial({ color: C.sunflower, roughness: 0.6, side: THREE.DoubleSide }),
    seedhead: new THREE.MeshStandardMaterial({ color: C.seedhead, roughness: 1 }),
    lavender: new THREE.MeshStandardMaterial({ color: C.lavender, roughness: 0.7 }),
    cornflower: new THREE.MeshStandardMaterial({ color: C.cornflower, roughness: 0.6 }),
    leaf: new THREE.MeshStandardMaterial({ color: C.leaf, roughness: 0.7, side: THREE.DoubleSide }),
    sage: new THREE.MeshStandardMaterial({ color: C.sage, roughness: 0.75, side: THREE.DoubleSide }),
    stem: new THREE.MeshStandardMaterial({ color: C.stem, roughness: 0.8 }),
  }

  const G = {
    daisyPetals: ringOf(petalGeometry(0.27, 0.075), 16, 0.25),
    daisyCenter: (() => {
      const g = new THREE.SphereGeometry(0.15, 16, 10)
      g.scale(1, 0.55, 1)
      return g
    })(),
    sunPetals: mergeGeometries([
      ringOf(petalGeometry(0.27, 0.085, 0.05), 22, 0.15),
      ringOf(petalGeometry(0.24, 0.08, 0.3), 18, 0.2).rotateY(0.14),
    ]),
    sunCenter: (() => {
      const g = new THREE.SphereGeometry(0.26, 24, 12)
      g.scale(1, 0.32, 1)
      return g
    })(),
    lavenderSpike: (() => {
      const parts = []
      for (let i = 0; i < 16; i++) {
        const b = new THREE.SphereGeometry(0.068 - i * 0.0018, 8, 6)
        b.scale(1, 1.3, 1)
        const a = i * 2.4
        b.translate(Math.cos(a) * 0.05, i * 0.064, Math.sin(a) * 0.05)
        parts.push(b)
      }
      return mergeGeometries(parts)
    })(),
    cornflower: (() => {
      const cone = new THREE.ConeGeometry(0.055, 0.26, 6)
      cone.translate(0, 0.13, 0)
      cone.rotateX(Math.PI / 2 - 0.5)
      return ringOf(cone, 12, 0.2)
    })(),
    leaf: leafGeometry(0.95),
  }

  const UP = new THREE.Vector3(0, 1, 0)
  const pivots = []

  function addStem(pivot, head, base) {
    const curve = new THREE.QuadraticBezierCurve3(
      base,
      new THREE.Vector3(head.x * 0.65, (base.y + head.y) / 2, head.z * 0.65),
      head,
    )
    const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.024, 6), M.stem)
    stem.castShadow = true
    pivot.add(stem)
    return curve.getTangent(1)
  }

  function addFlower(type, x, y, z) {
    const pivot = new THREE.Group()
    pivot.position.set(0, 1.0, 0)
    pivot.userData.phase = x * 3.1 + z * 1.7
    bouquet.add(pivot)
    pivots.push(pivot)

    const head = new THREE.Vector3(x, y - 1.0, z)
    const base = new THREE.Vector3(x * 0.22, 0, z * 0.22)
    const tangent = addStem(pivot, head, base)

    const flower = new THREE.Group()
    flower.position.copy(head)
    // голова смотрит наружу-вверх
    const facing = tangent.clone().lerp(new THREE.Vector3(x, 0.55, z + 0.35).normalize(), 0.7).normalize()
    flower.quaternion.setFromUnitVectors(UP, type === 'lavender' ? tangent : facing)
    pivot.add(flower)

    const add = (geo, mat) => {
      const m = new THREE.Mesh(geo, mat)
      m.castShadow = true
      flower.add(m)
      return m
    }
    if (type === 'daisy') {
      add(G.daisyPetals, M.petal)
      add(G.daisyCenter, M.pollen)
      flower.scale.setScalar(1 + (Math.sin(x * 9) * 0.5 + 0.5) * 0.25)
    } else if (type === 'sunflower') {
      add(G.sunPetals, M.sunflower)
      add(G.sunCenter, M.seedhead)
      flower.scale.setScalar(1.75)
    } else if (type === 'lavender') {
      add(G.lavenderSpike, M.lavender)
    } else if (type === 'cornflower') {
      add(G.cornflower, M.cornflower)
      add(G.daisyCenter, M.seedhead).scale.setScalar(0.4)
    }
  }

  function addLeaf(angle, tilt, len, mat) {
    const pivot = new THREE.Group()
    pivot.position.set(Math.sin(angle) * 0.45, CUP_H - 0.2, Math.cos(angle) * 0.45)
    pivot.rotation.y = angle
    pivot.userData.phase = angle * 2
    bouquet.add(pivot)
    pivots.push(pivot)
    const leaf = new THREE.Mesh(G.leaf, mat)
    leaf.rotation.x = tilt
    leaf.scale.setScalar(len)
    leaf.castShadow = true
    pivot.add(leaf)
  }

  ;[
    [0.6, 0.75, 1.1, M.leaf],
    [1.9, 0.9, 1.0, M.sage],
    [3.0, 0.7, 1.2, M.leaf],
    [4.2, 0.85, 1.05, M.sage],
    [5.3, 0.8, 1.15, M.leaf],
  ].forEach(([a, t, l, m]) => addLeaf(a, t, l, m))

  addFlower('sunflower', 0.18, 4.05, 0.5)
  addFlower('daisy', -0.8, 3.7, 0.6)
  addFlower('daisy', 0.98, 3.45, 0.42)
  addFlower('daisy', -0.3, 3.2, 1.05)
  addFlower('daisy', 0.62, 3.0, 1.0)
  addFlower('daisy', -1.12, 3.15, -0.15)
  addFlower('daisy', 0.5, 3.85, -0.7)
  addFlower('daisy', -0.55, 4.15, -0.2)
  addFlower('daisy', 1.15, 3.1, -0.45)
  addFlower('lavender', -0.5, 3.95, -0.6)
  addFlower('lavender', 0.95, 3.8, -0.15)
  addFlower('lavender', -1.25, 3.4, 0.35)
  addFlower('lavender', 0.05, 4.1, -0.75)
  addFlower('lavender', -0.95, 3.75, -0.7)
  addFlower('cornflower', 0.15, 3.45, 1.12)
  addFlower('cornflower', -0.7, 3.95, 0.25)
  addFlower('cornflower', 1.1, 3.75, 0.1)

  // --- росток ---
  const sprout = new THREE.Group()
  sprout.position.y = CUP_H - 0.12
  sprout.scale.setScalar(0.001)
  cup.add(sprout)
  const sproutStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.62, 8), M.stem)
  sproutStem.position.y = 0.31
  sproutStem.castShadow = true
  sprout.add(sproutStem)
  const cotyledon = new THREE.SphereGeometry(0.3, 18, 10)
  cotyledon.scale(1, 0.14, 0.52)
  cotyledon.translate(0.28, 0, 0)
  ;[0.3, Math.PI + 0.3].forEach((a) => {
    const leaf = new THREE.Mesh(cotyledon, M.leaf)
    leaf.position.y = 0.6
    leaf.rotation.set(0, a, 0.55)
    leaf.castShadow = true
    sprout.add(leaf)
  })
  const trueLeaf = new THREE.Mesh(G.leaf, M.sage)
  trueLeaf.position.y = 0.6
  trueLeaf.rotation.set(0.35, 0.3, 0)
  trueLeaf.scale.setScalar(0.42)
  trueLeaf.castShadow = true
  sprout.add(trueLeaf)

  // --- взаимодействие: вращение мышью с инерцией ---
  let dragging = false
  let lastX = 0
  let lastY = 0
  let velocity = 0
  let tilt = 0
  let idleFor = 0

  const onDown = (e) => {
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
    velocity = 0
    canvas.setPointerCapture(e.pointerId)
    canvas.dataset.dragging = 'true'
  }
  const onMove = (e) => {
    if (!dragging) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    velocity = dx * 0.006
    root.rotation.y += velocity
    tilt = THREE.MathUtils.clamp(tilt + dy * 0.003, -0.18, 0.28)
  }
  const onUp = (e) => {
    dragging = false
    idleFor = 0
    delete canvas.dataset.dragging
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
  }
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') root.rotation.y -= 0.25
    else if (e.key === 'ArrowRight') root.rotation.y += 0.25
    else return
    e.preventDefault()
    idleFor = 0
  }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)
  canvas.addEventListener('keydown', onKey)

  // --- посадка ---
  let progress = 0
  let target = 0
  const plantDuration = reducedMotion ? 0.6 : 3.2
  const listeners = new Set()

  function applyProgress(p) {
    const wilt = smooth(0, 0.34, p)
    const sink = smooth(0.28, 0.7, p)
    const grow = smooth(0.66, 1, p)

    bouquet.scale.setScalar(Math.max(0.001, 1 - wilt))
    bouquet.position.y = wilt * 0.8
    bouquet.visible = wilt < 0.999
    pivots.forEach((pv, i) => {
      pv.userData.wilt = wilt * (0.25 + (i % 3) * 0.12)
    })

    cup.position.y = -sink * 1.62
    mound.visible = sink > 0.001
    mound.scale.y = Math.max(0.0001, sink * 0.5)
    soilTop.scale.setScalar(Math.max(0.001, smooth(0.2, 0.45, p)))

    const g = grow * 1.7
    sprout.scale.set(Math.max(0.001, g), Math.max(0.001, g * grow), Math.max(0.001, g))
    sprout.rotation.y = grow * 0.6
  }

  let lastFrame = 0
  let elapsed = 0
  let running = false
  let raf = 0

  // --- камера и размер ---
  const lookAt = new THREE.Vector3()
  function frameCamera(p) {
    const sink = smooth(0.28, 0.7, p)
    // на вертикальном экране снизу кнопки - поднимаем сцену в кадре и отъезжаем
    const portrait = camera.aspect < 0.95 ? 1 : 0
    lookAt.set(0, 2.05 - sink * 1.1 - portrait * 0.55, 0)
    camera.position.set(0, 4.5 - sink * 1.5 - portrait * 0.5, 13.2 - sink * 2.6 + portrait * 3.4)
    camera.lookAt(lookAt)
  }

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas.parentElement
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    if (!running) {
      frameCamera(progress)
      renderer.render(scene, camera)
    }
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas.parentElement)
  resize()

  // --- цикл: только когда видно ---

  function tick() {
    raf = requestAnimationFrame(tick)
    const now = performance.now()
    const dt = Math.min((now - lastFrame) / 1000, 0.05)
    lastFrame = now
    elapsed += dt
    const t = elapsed

    if (!dragging) {
      idleFor += dt
      root.rotation.y += velocity
      velocity *= 0.93
      if (!reducedMotion && idleFor > 2.5) root.rotation.y += dt * 0.12
      tilt *= 0.96
    }
    root.rotation.x = tilt

    if (progress !== target) {
      const step = dt / plantDuration
      progress = target > progress ? Math.min(target, progress + step) : Math.max(target, progress - step)
      applyProgress(progress)
      listeners.forEach((fn) => fn(progress))
    }

    pivots.forEach((pv) => {
      const sway = reducedMotion ? 0 : Math.sin(t * 0.9 + pv.userData.phase) * 0.025
      const w = pv.userData.wilt || 0
      pv.rotation.z = sway + w * Math.sign(Math.sin(pv.userData.phase) || 1)
      pv.rotation.x = (reducedMotion ? 0 : Math.cos(t * 0.7 + pv.userData.phase) * 0.018) + w * 0.6
    })

    frameCamera(progress)
    renderer.render(scene, camera)
  }

  const start = () => {
    if (running) return
    running = true
    lastFrame = performance.now()
    tick()
  }
  const stop = () => {
    running = false
    cancelAnimationFrame(raf)
  }

  const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()))
  io.observe(canvas)
  const onVisibility = () => (document.hidden ? stop() : start())
  document.addEventListener('visibilitychange', onVisibility)

  applyProgress(0)
  frameCamera(0)
  renderer.render(scene, camera)

  return {
    setPlanted(value) {
      target = value ? 1 : 0
      if (!running) {
        progress = target
        applyProgress(progress)
        listeners.forEach((fn) => fn(progress))
      }
    },
    onProgress(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    dispose() {
      stop()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('keydown', onKey)
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) {
          if (o.material.map) o.material.map.dispose()
          o.material.dispose()
        }
      })
      renderer.dispose()
    },
  }
}
