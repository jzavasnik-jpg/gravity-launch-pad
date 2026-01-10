'use client';

import { useParams } from 'next/navigation';

export default function AvatarDetailPage() {
  const params = useParams();
  const id = params.id;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>
        Avatar Profile
      </h1>
      <p className="text-muted-foreground">
        Viewing avatar: {id}
      </p>
    </div>
  );
}
