/* ══════════════════════════════════════════════════════════════════════
   Rede neural — porte do componente Angular `neural-bank` do projeto
   mistercontador para JavaScript puro.

   A lógica de cena é a mesma do original: medalha central, nós em
   camadas distribuídos por espiral de Fibonacci, conexões aos vizinhos
   e batimento periódico. O que mudou:

     · sem Angular — ciclo de vida virou init/dispose;
     · a distância da câmera não vem mais da roda do mouse, e sim da
       rolagem da página, que é quem manda aqui. As camadas continuam
       surgindo conforme a câmera se afasta, exatamente como antes;
     · Three.js entra por CDN, com import map declarado no HTML.
   ══════════════════════════════════════════════════════════════════════ */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { NAME_MAP, TIERS } from "./neural-data.js";

const GOLDEN = (1 + Math.sqrt(5)) / 2;
const BEAT_INTERVAL = 4.5;
const CENTER_LOGO = "img/banks/logo.png";

function deriveName(path){
  const base = (path.split("/").pop() || path).replace(/\.(png|jpg|jpeg|svg)$/i, "");
  return NAME_MAP[base] || base.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/* SVG sem width/height intrínsecos vira textura de dimensão zero. Passar
   por um canvas intermediário resolve e ainda uniformiza tudo em 256px. */
function loadLogoTexture(url){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const size = 256;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const g = c.getContext("2d");
      const iw = img.naturalWidth || size, ih = img.naturalHeight || size;
      const k = Math.min(size/iw, size/ih);
      g.drawImage(img, (size - iw*k)/2, (size - ih*k)/2, iw*k, ih*k);
      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      resolve(tex);
    };
    img.onerror = reject;
    img.src = url.split("/").map(encodeURIComponent).join("/");
  });
}

export function createNeural(canvas, tooltipEl){
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
  camera.position.set(0, 0, 42);

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias:true, alpha:true, powerPreference:"high-performance",
  });
  renderer.setClearColor(0x000000, 0);   // o pixel ratio é definido no resize

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.7;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  controls.enablePan = false;
  controls.enableZoom = false;   // a rolagem da página é que controla a distância

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const l1 = new THREE.PointLight(0x7c3aed, 2, 60);   scene.add(l1);
  const l2 = new THREE.PointLight(0xdb2777, 1.5, 60); l2.position.set(10,10,5); scene.add(l2);

  /* ── estrelas ──
     Mesma paleta espectral do resto da apresentação: dominam brancas e
     amareladas, poucas azuis, poucas avermelhadas. Como PointsMaterial
     tem um tamanho só por objeto, são três camadas — muitas fracas,
     poucas brilhantes — que é o que dá profundidade a um céu. */
  {
    const CLASSES = [
      [0.67,0.77,1.00], [0.79,0.84,1.00], [0.97,0.97,1.00],
      [1.00,0.96,0.92], [1.00,0.85,0.67], [1.00,0.69,0.50],
    ];
    const PESOS = [0.09, 0.14, 0.25, 0.24, 0.18, 0.10];
    const sorteia = () => {
      let r = Math.random(), acc = 0;
      for (let i=0;i<PESOS.length;i++){ acc += PESOS[i]; if (r <= acc) return CLASSES[i]; }
      return CLASSES[2];
    };
    // [quantidade, tamanho, opacidade, dispersão]
    for (const [n, size, opa, spread] of [[1100,0.11,0.55,420],[420,0.20,0.7,380],[90,0.36,0.95,320]]){
      const pos = new Float32Array(n*3), col = new Float32Array(n*3);
      for (let i=0;i<n;i++){
        // afasta do centro para não nascer estrela dentro da rede
        let x,y,z,d;
        do {
          x=(Math.random()-0.5)*spread; y=(Math.random()-0.5)*spread; z=(Math.random()-0.5)*spread;
          d=Math.hypot(x,y,z);
        } while (d < 120);
        pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z;
        const c = sorteia();
        col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
        size, vertexColors:true, transparent:true, opacity:opa,
        sizeAttenuation:true, depthWrite:false,
      })));
    }
  }

  /* ── medalha central ── */
  const centerGroup = new THREE.Group();
  const centerDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.2, 0.5, 48),
    [
      new THREE.MeshStandardMaterial({ color:0x2d1b69, roughness:0.3, metalness:0.8 }),
      new THREE.MeshStandardMaterial({ color:0x0d0020, roughness:0.2, metalness:0.9,
        emissive:new THREE.Color(0x3b0764), emissiveIntensity:0.5 }),
      new THREE.MeshStandardMaterial({ color:0x1a0050, roughness:0.3, metalness:0.8,
        emissive:new THREE.Color(0x4c1d95), emissiveIntensity:0.6 }),
    ]
  );
  centerDisc.rotation.x = Math.PI/2;
  centerGroup.add(centerDisc);

  centerGroup.add(new THREE.Mesh(
    new THREE.TorusGeometry(4.2, 0.12, 8, 48),
    new THREE.MeshStandardMaterial({ color:0x7c3aed, emissive:new THREE.Color(0x7c3aed),
      emissiveIntensity:1.2, roughness:0.1, metalness:1 })
  ));

  const orbit1 = new THREE.Mesh(
    new THREE.TorusGeometry(5.8, 0.07, 8, 48),
    new THREE.MeshStandardMaterial({ color:0xdb2777, emissive:new THREE.Color(0xdb2777),
      emissiveIntensity:0.9, roughness:0.1, metalness:1 })
  );
  orbit1.rotation.set(Math.PI/3, Math.PI/5, 0);
  centerGroup.add(orbit1);

  const orbit2 = new THREE.Mesh(
    new THREE.TorusGeometry(5.8, 0.07, 8, 48),
    new THREE.MeshStandardMaterial({ color:0x7c3aed, emissive:new THREE.Color(0x7c3aed),
      emissiveIntensity:0.9, roughness:0.1, metalness:1 })
  );
  orbit2.rotation.set(-Math.PI/4, Math.PI/3, 0);
  centerGroup.add(orbit2);

  const centerGlow = new THREE.PointLight(0x7c3aed, 3, 20);
  centerGroup.add(centerGlow);

  new THREE.TextureLoader().load(CENTER_LOGO, tex => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(6.5, 3.4),
      new THREE.MeshBasicMaterial({ map:tex, transparent:true, depthWrite:false,
                                    side:THREE.DoubleSide })
    );
    m.position.z = 0.4;
    centerGroup.add(m);
  });
  scene.add(centerGroup);

  /* ── nós por camada ── */
  const bankNodes = [];
  const connectionLines = [];

  /* As ~460 conexões eram um objeto Line cada, ou seja, 460 chamadas de
     desenho por frame. Aqui elas são acumuladas por camada e viram um
     único LineSegments cada — 460 chamadas passam a ser 4. A opacidade
     de cada linha deixa de oscilar sozinha, mas a camada inteira ainda
     respira, e a diferença visual é imperceptível. */
  const baldes = new Map();
  function createLine(from, to, appearBeyond){
    const chave = appearBeyond === null ? "base" : String(appearBeyond);
    let b = baldes.get(chave);
    if (!b) baldes.set(chave, b = { appearBeyond, pts: [] });
    b.pts.push(from.x, from.y, from.z, to.x, to.y, to.z);
  }
  function fecharLinhas(){
    for (const { appearBeyond, pts } of baldes.values()){
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
      const mat = new THREE.LineBasicMaterial({
        color:0x7c3aed, transparent:true,
        opacity: appearBeyond === null ? 0.5 : 0,
        depthWrite:false, blending:THREE.AdditiveBlending,
      });
      const seg = new THREE.LineSegments(geo, mat);
      seg.visible = appearBeyond === null;
      scene.add(seg);
      connectionLines.push({ line:seg, offset:Math.random()*Math.PI*2, appearBeyond });
    }
    baldes.clear();
  }

  const discGeo   = new THREE.CylinderGeometry(1.7, 1.7, 0.25, 24);
  const ringGeo   = new THREE.TorusGeometry(1.7, 0.06, 6, 32);
  const logoGeo   = new THREE.CircleGeometry(1.3, 24);

  for (const tier of TIERS){
    const total = tier.logos.length;
    const opa0 = tier.appearBeyond === null ? 1 : 0;

    tier.logos.forEach((logoPath, i) => {
      // espiral de Fibonacci: distribui os nós sem aglomerar nos polos
      const phi = Math.acos(1 - 2*(i + 0.5)/total);
      const theta = 2*Math.PI*i / GOLDEN;
      const r = tier.radius + (Math.random() - 0.5)*2;
      const pos = new THREE.Vector3(
        r*Math.sin(phi)*Math.cos(theta),
        r*Math.sin(phi)*Math.sin(theta),
        r*Math.cos(phi)
      );

      const group = new THREE.Group();
      group.position.copy(pos);

      /* Era um cilindro com três materiais (lateral, topo e base), e cada
         material vira uma chamada de desenho — 3 por nó, 552 no total.
         Como o disco fica sempre de frente para a câmera, só a face de
         cima aparece: um material branco só entrega a mesma imagem por
         um terço do custo. */
      const discMats = [
        new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:opa0 }),
      ];
      const disc = new THREE.Mesh(discGeo, discMats[0]);
      disc.rotation.x = Math.PI/2;
      group.add(disc);

      const borderRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
        color:0x7c3aed, transparent:true, opacity:opa0*0.6,
      }));
      group.add(borderRing);

      loadLogoTexture(logoPath).then(tex => {
        const logo = new THREE.Mesh(logoGeo, new THREE.MeshBasicMaterial({
          map:tex, transparent:true, depthWrite:false,
          side:THREE.DoubleSide, opacity:opa0,
        }));
        logo.position.z = 0.14;
        group.add(logo);
      }).catch(() => console.warn("[neural] logo não carregou:", logoPath));

      group.visible = opa0 > 0;
      scene.add(group);
      bankNodes.push({ mesh:group, disc, borderRing, basePos:pos.clone(), index:i,
                       appearBeyond:tier.appearBeyond, discMats, name:deriveName(logoPath) });

      createLine(new THREE.Vector3(0,0,0), pos, tier.appearBeyond);
    });
  }

  // conexões entre os três vizinhos mais próximos da mesma camada
  bankNodes.forEach((node, i) => {
    const mesmos = bankNodes.filter((n, j) => j !== i && n.appearBeyond === node.appearBeyond);
    mesmos
      .sort((a,b) => node.basePos.distanceTo(a.basePos) - node.basePos.distanceTo(b.basePos))
      .slice(0,3)
      .forEach(viz => {
        if (bankNodes.indexOf(viz) > i) createLine(node.basePos, viz.basePos, node.appearBeyond);
      });
  });
  fecharLinhas();   // as conexões viram um LineSegments por camada

  /* ── hover ── */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(-999, -999);
  let hovered = null;

  let pointerSujo = false;   // só vale raycast se o mouse realmente andou
  canvas.addEventListener("mousemove", e => {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left)/r.width)*2 - 1;
    pointer.y = -((e.clientY - r.top)/r.height)*2 + 1;
    pointerSujo = true;
    if (tooltipEl){
      tooltipEl.style.left = (e.clientX - r.left) + "px";
      tooltipEl.style.top  = (e.clientY - r.top) + "px";
    }
  });
  canvas.addEventListener("mouseleave", () => {
    pointer.set(-999,-999);
    hovered = null;
    tooltipEl && tooltipEl.classList.remove("visible");
  });

  /* O raycast testa os triângulos de 184 cilindros. Com o mouse parado
     — que é o caso durante quase toda a apresentação — isso era puro
     desperdício a 60 vezes por segundo. Agora só roda quando o ponteiro
     de fato se moveu desde o último teste. */
  function updateHover(){
    if (pointer.x < -1 || !tooltipEl || !pointerSujo) return;
    pointerSujo = false;
    raycaster.setFromCamera(pointer, camera);
    const alvos = bankNodes.filter(n => n.mesh.visible).map(n => n.disc);
    const hits = raycaster.intersectObjects(alvos, false);
    if (hits.length){
      const node = bankNodes.find(n => n.disc === hits[0].object) || null;
      if (node !== hovered){
        hovered = node;
        if (node){ tooltipEl.textContent = node.name; tooltipEl.classList.add("visible"); }
      }
      canvas.style.cursor = "pointer";
    } else if (hovered){
      hovered = null;
      tooltipEl.classList.remove("visible");
      canvas.style.cursor = "";
    }
  }

  /* ── laço ── */
  const clock = new THREE.Clock();
  let lastBeat = -99;
  let targetDist = 42;

  /* w e h em pixels de CSS. O renderer é que multiplica pelo pixel ratio,
     com teto absoluto: são ~550 malhas e ~700 linhas, e num telão 4K sem
     limite o quadro despencaria bem no clímax da apresentação. */
  function resize(w, h){
    const TETO = 3.2e6;
    let r = Math.min(window.devicePixelRatio || 1, 1.5);
    if (w*h*r*r > TETO) r = Math.sqrt(TETO / (w*h));
    renderer.setPixelRatio(Math.max(0.6, r));
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  /* dist: distância da câmera ao centro. É ela que revela as camadas —
     quanto mais longe, mais nós aparecem. Vem da rolagem da página. */
  function setDistance(d){ targetDist = d; }

  function render(){
    const t = clock.getElapsedTime();

    // aproxima suavemente a distância pedida, preservando o ângulo que o
    // usuário tiver girado com o mouse
    const dir = camera.position.clone().normalize();
    const atual = camera.position.length();
    camera.position.copy(dir.multiplyScalar(atual + (targetDist - atual)*0.08));

    const camDist = camera.position.length();

    centerGroup.lookAt(camera.position);
    orbit1.rotation.z =  t*0.5;
    orbit2.rotation.z = -t*0.4;

    for (const node of bankNodes){
      const o = node.appearBeyond === null
        ? 1 : Math.max(0, Math.min(1, (camDist - node.appearBeyond)/8));
      node.mesh.visible = o > 0.01;
      if (!node.mesh.visible) continue;

      node.mesh.lookAt(camera.position);
      node.mesh.position.set(
        node.basePos.x + Math.cos(t*0.6 + node.index*0.3)*0.2,
        node.basePos.y + Math.sin(t*0.8 + node.index*0.5)*0.3,
        node.basePos.z
      );
      for (const m of node.discMats) m.opacity = o;
      node.borderRing.material.opacity = (0.4 + Math.sin(t*1.5 + node.index*0.4)*0.3) * o;
      for (const child of node.mesh.children){
        if (child !== node.disc && child !== node.borderRing && child.material){
          child.material.opacity = o;
        }
      }
    }

    for (const { line, offset, appearBeyond } of connectionLines){
      const o = appearBeyond === null
        ? 1 : Math.max(0, Math.min(1, (camDist - appearBeyond)/8));
      line.visible = o > 0.01;
      if (line.visible) line.material.opacity = (0.15 + Math.sin(t*1.8 + offset)*0.15) * o * 1.8;
    }

    // batimento: respiração contínua + pico rápido
    const desde = t - lastBeat;
    if (desde >= BEAT_INTERVAL) lastBeat = t;
    const breathe = 0.04 * Math.sin((t/BEAT_INTERVAL)*Math.PI*2);
    const decay = Math.max(0, 1 - (t - lastBeat)/0.45);
    centerDisc.scale.setScalar(1 + breathe + decay*decay*0.10);
    centerGlow.intensity = 3 + decay*5 + breathe*30;

    updateHover();
    controls.update();
    renderer.render(scene, camera);
  }

  function dispose(){
    controls.dispose();
    renderer.dispose();
  }

  return { resize, setDistance, render, dispose, nodeCount: bankNodes.length };
}
