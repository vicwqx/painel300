"use client";

import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

const CORES: Record<number, string> = {
  1: "#F5A623", // ouro
  2: "#C7CDD6", // prata
  3: "#D98A4B", // bronze
};

function Medalha({ posicao }: { posicao: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.6;
  });
  const cor = CORES[posicao] ?? "#8B94A0";

  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.22, 48]} />
        <meshStandardMaterial color={cor} metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <torusGeometry args={[0.55, 0.06, 16, 48]} />
        <meshStandardMaterial color="#0A0C0F" metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}

export function Podium3D({ posicao }: { posicao: number }) {
  return (
    <div style={{ width: 56, height: 56 }} className="flex-shrink-0">
      <Canvas camera={{ position: [0, 0, 3], fov: 40 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 2, 3]} intensity={1.2} />
        <Medalha posicao={posicao} />
      </Canvas>
    </div>
  );
}
