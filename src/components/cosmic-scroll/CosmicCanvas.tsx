
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SceneContent from './SceneContent';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { ImagePlaceholder } from '@/lib/placeholder-images';

gsap.registerPlugin(ScrollTrigger);

const textureLoader = new THREE.TextureLoader();

function createStars(count: number, size: number) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    size: size,
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
  });
  return new THREE.Points(geometry, material);
}

const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id);

const CosmicCanvas = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const objectsRef = useRef<Record<string, THREE.Object3D>>({});

  const [isLoaded, setIsLoaded] = useState(false);
  const [activeGalleryImage, setActiveGalleryImage] = useState<ImagePlaceholder | null>(null);

  const updateScreenPositions = useCallback(() => {
    if (!cameraRef.current || !sceneRef.current) return;
    const camera = cameraRef.current;
    
    requestAnimationFrame(updateScreenPositions);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 2, 200);
    pointLight.position.set(10, 10, 20);
    scene.add(pointLight);
    objectsRef.current.pointLight = pointLight;

    const stars = createStars(10000, 0.05);
    scene.add(stars);

    const planetData = [
      { id: 'hero-planet', size: 5, position: new THREE.Vector3(0, 0, 0) },
      { id: 'about-moon', size: 2.5, position: new THREE.Vector3(-15, -8, -25) },
      { id: 'events-planet', size: 4, position: new THREE.Vector3(15, 5, -50) },
      { id: 'gallery-planet', size: 6, position: new THREE.Vector3(-5, -15, -75) },
      { id: 'join-planet', size: 4.5, position: new THREE.Vector3(-10, 0, -100) },
    ];
    
    const planets: THREE.Mesh[] = [];
    planetData.forEach(p => {
        const textureUrl = getImage(p.id)?.imageUrl;
        const materialOptions: THREE.MeshStandardMaterialParameters = { roughness: 0.8, metalness: 0.1 };
        if (textureUrl) {
            materialOptions.map = textureLoader.load(textureUrl);
        }
        if (p.id === 'about-moon') {
            materialOptions.roughness = 0.9;
            const displacementUrl = getImage('moon-displacement')?.imageUrl;
            if(displacementUrl) {
                const displacementMap = textureLoader.load(displacementUrl);
                materialOptions.displacementMap = displacementMap;
                materialOptions.displacementScale = 0.1;
            }
        }

        const planet = new THREE.Mesh(
            new THREE.SphereGeometry(p.size, 64, 64),
            new THREE.MeshStandardMaterial(materialOptions)
        );
        planet.position.copy(p.position);
        planet.userData = { id: p.id, lightIntensity: 1.0, basePosition: p.position.clone() };
        scene.add(planet);
        objectsRef.current[p.id] = planet;
        planets.push(planet);
    });

    const galleryImages: THREE.Mesh[] = [];
    for (let i = 1; i <= 4; i++) {
        const imgData = getImage(`gallery-image-${i}`);
        if(imgData) {
            const texture = textureLoader.load(imgData.imageUrl);
            const plane = new THREE.Mesh(
                new THREE.PlaneGeometry(4, 3),
                new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
            );
            plane.position.set(
                (i - 2.5) * 5, // closer together
                -12, // slightly lower
                -82 + Math.random() * 4 - 2 // slightly further back
            );
            plane.userData = { id: `gallery-image-${i}` };
            scene.add(plane);
            objectsRef.current[`gallery-image-${i}`] = plane;
            galleryImages.push(plane);
        }
    }

    setIsLoaded(true);

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: document.documentElement,
            start: 'top top',
            end: '+=6000',
            scrub: 1.5,
        },
    });

    tl.to(camera.position, { z: -105, ease: 'power1.inOut' }, 0);
    tl.to(camera.rotation, { y: Math.PI * 0.1, ease: 'power1.inOut' }, 0);
    
    planets.forEach(planet => {
        tl.to(planet.rotation, { y: Math.PI * 2, x: Math.PI * 0.5 }, 0);
        const randomMovement = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
        tl.to(planet.position, {
            x: planet.userData.basePosition.x + randomMovement.x,
            y: planet.userData.basePosition.y + randomMovement.y,
            z: planet.userData.basePosition.z + randomMovement.z,
        }, 0);
    });

    tl.to(pointLight.position, { x: -20, y: -5, z: -40 }, 0);

    const animate = () => {
        requestAnimationFrame(animate);
        planets.forEach(p => p.rotation.y += 0.0005);
        stars.rotation.y += 0.0001;
        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const handleCanvasClick = (event: MouseEvent) => {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(galleryImages);
        if (intersects.length > 0) {
            const clickedId = intersects[0].object.userData.id;
            const img = getImage(clickedId);
            if (img) setActiveGalleryImage(img);
        }
    };
    
    window.addEventListener('resize', handleResize);
    currentMount.addEventListener('click', handleCanvasClick);
    
    updateScreenPositions();

    return () => {
        window.removeEventListener('resize', handleResize);
        if(currentMount) {
            currentMount.removeEventListener('click', handleCanvasClick);
            if(renderer.domElement) currentMount.removeChild(renderer.domElement);
        }
        renderer.dispose();
        scene.traverse(object => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                if(Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [updateScreenPositions]);

  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10">
      <div ref={mountRef} />
      {isLoaded && cameraRef.current && (
        <SceneContent 
          camera={cameraRef.current} 
          objects={objectsRef.current} 
          activeGalleryImage={activeGalleryImage}
          setActiveGalleryImage={setActiveGalleryImage}
        />
      )}
    </div>
  );
};

export default CosmicCanvas;

    