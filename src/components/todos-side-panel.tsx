"use client";

import * as React from 'react';
import { AllTodosPanel } from '@/components/all-todos-panel';
import type { Todo, Domain } from '@/lib/types';

interface TodosSidePanelProps {
    onUpdate: () => void;
    initialGroupedTodos: Record<string, Todo[]>;
    loading: boolean;
    allDomains: Domain[];
    domainStatuses: Record<string, 'checking' | 'online' | 'offline'>;
}

export function TodosSidePanel({
    onUpdate,
    initialGroupedTodos,
    loading,
    allDomains,
    domainStatuses
}: TodosSidePanelProps) {
    return (
        <div className="space-y-4">
            <AllTodosPanel
                onUpdate={onUpdate}
                initialGroupedTodos={initialGroupedTodos}
                loading={loading}
                allDomains={allDomains}
                domainStatuses={domainStatuses}
                largeText={true}
            />
        </div>
    );
}
