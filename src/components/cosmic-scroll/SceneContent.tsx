
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Camera, Object3D } from 'three';
import * as THREE from 'three';
import { adjustTextIllumination } from '@/ai/flows/adjust-text-illumination';
import { useToast } from '@/hooks/use-toast';
import JoinForm from './JoinForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { Button } from '../ui/button';
import { ArrowDown } from 'lucide-react';

type SectionData = {
  id: string;
  title: string;
  content: React.ReactNode;
  baseFontSize: number;
  position3D: THREE.Vector3;
};

type TextSectionProps = {
  data: SectionData;
  camera: Camera;
  planets: Object3D[];
};

function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      inThrottle = true;
      func(...args);
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

const TextSection: React.FC<TextSectionProps> = ({ data, camera, planets }) => {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [dynamicStyle, setDynamicStyle] = useState({
    fontSize: data.baseFontSize,
    color: '#ffffff',
    textShadow: 'none',
    opacity: 0.1,
  });
  const { toast } = useToast();

  const updateIllumination = useCallback(throttle(async () => {
    let nearestPlanet: Object3D | null = null;
    let minDistance = Infinity;

    planets.forEach(planet => {
      const distance = data.position3D.distanceTo(planet.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPlanet = planet;
      }
    });

    if (nearestPlanet) {
      try {
        const result = await adjustTextIllumination({
          text: data.title,
          planetDistance: minDistance,
          planetLightIntensity: nearestPlanet.userData.lightIntensity || 1.0,
          baseFontSize: data.baseFontSize,
        });

        const opacity = Math.min(1, Math.max(0.1, 1 - (data.position3D.distanceTo(camera.position) - 10) / 15));

        setDynamicStyle({
          fontSize: result.adjustedFontSize,
          color: result.textColor,
          textShadow: `0 0 8px ${result.textColor}aa, 0 0 16px ${result.textColor}55, 0 0 24px ${result.textColor}33`,
          opacity: opacity,
        });
      } catch (error) {
        console.error("AI call failed:", error);
      }
    }
  }, 500), [data, planets, toast, camera.position]);

  useEffect(() => {
    const animate = () => {
      const screenPosition = data.position3D.clone().project(camera);
      setStyle({
        position: 'absolute',
        top: `${(-screenPosition.y + 1) / 2 * window.innerHeight}px`,
        left: `${(screenPosition.x + 1) / 2 * window.innerWidth}px`,
        transform: 'translate(-50%, -50%)',
        transition: 'opacity 0.5s, color 0.5s, font-size 0.5s, text-shadow 0.5s',
      });
      
      updateIllumination();
      
      requestAnimationFrame(animate);
    };

    const animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [camera, data.position3D, updateIllumination]);

  return (
    <div style={{ ...style, ...dynamicStyle, pointerEvents: 'none' }} className="text-center w-full max-w-2xl px-4">
      <h2 className="font-headline text-4xl md:text-6xl font-bold mb-4" style={{ inherit: 'all' }}>
        {data.title}
      </h2>
      <div className="font-body text-base md:text-lg">{data.content}</div>
    </div>
  );
};


type SceneContentProps = {
  camera: Camera;
  objects: Record<string, Object3D>;
  activeGalleryImage: ImagePlaceholder | null;
  setActiveGalleryImage: (image: ImagePlaceholder | null) => void;
};

const SceneContent: React.FC<SceneContentProps> = ({ camera, objects, activeGalleryImage, setActiveGalleryImage }) => {
    const [showScrollIndicator, setShowScrollIndicator] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setShowScrollIndicator(false);
            } else {
                setShowScrollIndicator(true);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

  const sections: SectionData[] = useMemo(() => [
    {
      id: 'hero',
      title: 'Cosmic Scroll',
      content: <p>Welcome to the XYZ College Astronomy Club. Your journey through the cosmos begins now.</p>,
      baseFontSize: 32,
      position3D: new THREE.Vector3(0, 0, 5),
    },
    {
      id: 'about',
      title: 'About Us',
      content: <p>We are a passionate group of students dedicated to exploring the wonders of the universe. From stargazing nights to expert talks, we share a common love for all things astronomy.</p>,
      baseFontSize: 24,
      position3D: new THREE.Vector3(-8, -2, -22),
    },
    {
      id: 'events',
      title: 'Upcoming Events',
      content: (
          <div className="space-y-4">
              <div className="p-4 rounded-lg bg-black/20">
                  <h3 className="font-bold text-2xl">Annual Meteor Shower Watch Party</h3>
                  <p>Next Month - Join us for a spectacular night under the stars.</p>
              </div>
              <div className="p-3 rounded-lg bg-black/20 opacity-80">
                  <h3 className="font-bold text-xl">Guest Lecture: The Search for Exoplanets</h3>
                  <p>This Friday - Dr. Evelyn Reed discusses the latest findings.</p>
              </div>
          </div>
      ),
      baseFontSize: 24,
      position3D: new THREE.Vector3(10, 2, -45),
    },
    {
        id: 'gallery',
        title: 'Gallery',
        content: <p>Explore stunning images captured by our members and from explorations across the galaxy. Click on the floating images in the 3D space to view them.</p>,
        baseFontSize: 24,
        position3D: new THREE.Vector3(0, -5, -80),
    },
    {
        id: 'join',
        title: 'Join The Club',
        content: <p>Ready to start your own cosmic journey? Enter your email below to become a member.</p>,
        baseFontSize: 24,
        position3D: new THREE.Vector3(-10, 4, -95),
    }
  ], []);

  const planets = useMemo(() => Object.values(objects).filter(obj => obj.userData.id && (obj.userData.id.includes('planet') || obj.userData.id.includes('moon'))), [objects]);
  
  const [joinFormStyle, setJoinFormStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    const animate = () => {
      const formPosition3D = new THREE.Vector3(-10, -2, -95);
      const screenPosition = formPosition3D.clone().project(camera);
      const opacity = Math.min(1, Math.max(0, 1 - (formPosition3D.distanceTo(camera.position)-10) / 10));

      setJoinFormStyle({
        position: 'absolute',
        top: `${(-screenPosition.y + 1) / 2 * window.innerHeight}px`,
        left: `${(screenPosition.x + 1) / 2 * window.innerWidth}px`,
        transform: 'translate(-50%, -50%)',
        opacity: opacity,
        pointerEvents: opacity > 0.5 ? 'auto' : 'none',
        transition: 'opacity 0.5s'
      });
      requestAnimationFrame(animate);
    }
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [camera]);


  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {showScrollIndicator && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white z-50 animate-bounce">
            <span className="font-headline">Scroll to Explore</span>
            <ArrowDown className="w-6 h-6" />
        </div>
      )}

      {sections.map(section => (
        <TextSection key={section.id} data={section} camera={camera} planets={planets} />
      ))}

      <div style={joinFormStyle} className="w-full max-w-md">
        <JoinForm />
      </div>

      <Dialog open={!!activeGalleryImage} onOpenChange={() => setActiveGalleryImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline">{activeGalleryImage?.description}</DialogTitle>
            <DialogDescription>{activeGalleryImage?.imageHint}</DialogDescription>
          </DialogHeader>
          {activeGalleryImage && (
            <div className="relative aspect-[4/3] w-full">
              <Image src={activeGalleryImage.imageUrl} alt={activeGalleryImage.description} fill className="object-cover rounded-md" data-ai-hint={activeGalleryImage.imageHint} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SceneContent;
