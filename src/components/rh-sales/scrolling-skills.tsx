'use client';

import { useState, useEffect } from 'react';
import type { Skill } from '@/features/rh-sales/types';
import { Card, CardContent } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/features/rh-sales/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';


const SkillCard = ({ skill, isVisible }: { skill: Skill; isVisible: boolean }) => (
  <Card className={cn(
    "flex flex-col h-20 justify-center transition-opacity duration-1000 ease-in-out border-none bg-transparent shadow-none",
    isVisible ? 'opacity-100' : 'opacity-0'
  )}>
    <CardContent className="p-4">
      <div className="text-center">
        <h3 className="text-base font-bold">{skill.title}</h3>
        <p className="text-sm text-card-foreground">{skill.description}</p>
      </div>
    </CardContent>
  </Card>
);

export function ScrollingSkills() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const skillsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'skills'));
  }, [firestore, user]);

  const { data: skills, isLoading } = useCollection<Skill>(skillsQuery);

  useEffect(() => {
    if (!skills || skills.length === 0) return;

    const interval = setInterval(() => {
      setIsVisible(false); // Start fade out
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % skills.length);
        setIsVisible(true); // Start fade in
      }, 1000); // Time for fade out transition
    }, 8000); // Change skill every 8 seconds

    return () => clearInterval(interval);
  }, [skills]);

  if (isLoading || isUserLoading) {
    return (
      <div className="flex justify-center items-center h-20">
        <Skeleton className="h-20 w-80" />
      </div>
    );
  }

  const sortedSkills = skills
    ? [...skills].sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity))
    : [];

  const currentSkill = sortedSkills[currentIndex];

  if (!currentSkill) {
    return (
        <div className="flex justify-center items-center h-20">
            <p>لا توجد مهارات لعرضها.</p>
        </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-20">
        <SkillCard 
            skill={currentSkill} 
            isVisible={isVisible}
        />
    </div>
  );
}
