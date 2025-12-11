
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash2, Plus, Star } from 'lucide-react';
import { getAllTodosGroupedByDomain, deleteTodo, GENERAL_TASKS_KEY, addTodo, updateTodo } from '@/services/todoService';
import type { Todo } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';


interface GroupedTodos {
    [domainName: string]: (Todo & { isNew?: boolean })[];
}

interface AllTodosPanelProps {
    onUpdate: () => void;
    initialGroupedTodos: GroupedTodos;
    loading: boolean;
}

export function AllTodosPanel({ onUpdate, initialGroupedTodos, loading }: AllTodosPanelProps) {
    const [groupedTodos, setGroupedTodos] = React.useState<GroupedTodos>(initialGroupedTodos);
    const [newGeneralTodo, setNewGeneralTodo] = React.useState('');
    const [addingTodo, setAddingTodo] = React.useState(false);
    const [toggledTodos, setToggledTodos] = React.useState<string[]>([]);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();

    const sortTodos = (todos: (Todo & { isNew?: boolean })[]) => {
        return todos.sort((a, b) => {
            if (a.isHighPriority && !b.isHighPriority) return -1;
            if (!a.isHighPriority && b.isHighPriority) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    };
    
    const sortedGroups = React.useMemo(() => {
        const hasHighPriority = (groupName: string) => {
            return groupedTodos[groupName]?.some(todo => todo.isHighPriority && !todo.completed);
        };
        
        const allGroupKeys = Object.keys(groupedTodos).filter(key => groupedTodos[key] && groupedTodos[key].length > 0);

        return allGroupKeys.sort((a, b) => {
            const aHasPrio = hasHighPriority(a);
            const bHasPrio = hasHighPriority(b);
            
            if (aHasPrio && !bHasPrio) return -1;
            if (!aHasPrio && bHasPrio) return 1;
            
            if (a === GENERAL_TASKS_KEY && b !== GENERAL_TASKS_KEY) return -1;
            if (a !== GENERAL_TASKS_KEY && b === GENERAL_TASKS_KEY) return 1;
            
            return 0;
        });

    }, [groupedTodos]);


    React.useEffect(() => {
        const sortedInitialGroupedTodos: GroupedTodos = {};
        for (const key in initialGroupedTodos) {
            if (initialGroupedTodos[key]) {
                sortedInitialGroupedTodos[key] = sortTodos(initialGroupedTodos[key]);
            }
        }
        setGroupedTodos(sortedInitialGroupedTodos);
    }, [initialGroupedTodos]);
    
    React.useEffect(() => {
        // Pre-load the audio
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio("data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAnxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABodHRwOi8vd3d3Lm11c2VzY29yZS5jb20vdXNlci8zMzA3MTYxMS9zY29yZXMvNjY3NjE2MwAAADlNdXNlU2NvcmUgMy42LjIgLSBWb2ljZSAxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-");
            audioRef.current.volume = 0.5;
        }
    }, []);

    const handleToggleTodo = async (todoId: string) => {
        if (!todoId || toggledTodos.includes(todoId)) return;

        // --- Immediate Visual Update ---
        setToggledTodos(prev => [...prev, todoId]);
        setGroupedTodos(prevGroups => {
            const newGroups = { ...prevGroups };
            let groupKey: string | null = null;
            
            for (const key in newGroups) {
                if (newGroups[key]) {
                    const todoIndex = newGroups[key].findIndex(t => t.id === todoId);
                    if (todoIndex !== -1) {
                        groupKey = key;
                        newGroups[key][todoIndex] = { ...newGroups[key][todoIndex], completed: true };
                        break;
                    }
                }
            }
            return newGroups;
        });
        audioRef.current?.play().catch(e => console.log("Audio play failed", e));
        // --- End Immediate Visual Update ---

        // Wait for animations to finish before removing the item
        setTimeout(async () => {
            setGroupedTodos(prevGroups => {
                const finalGroups = { ...prevGroups };
                let groupKey: string | null = null;

                for (const key in finalGroups) {
                     if (finalGroups[key]) {
                        const todoIndex = finalGroups[key].findIndex(t => t.id === todoId);
                        if (todoIndex !== -1) {
                            groupKey = key;
                            break;
                        }
                    }
                }
                if (groupKey && finalGroups[groupKey]) {
                    finalGroups[groupKey] = finalGroups[groupKey].filter(t => t.id !== todoId);
                    if (finalGroups[groupKey].length === 0) {
                        delete finalGroups[groupKey];
                    }
                }
                return finalGroups;
            });
            setToggledTodos(prev => prev.filter(id => id !== todoId));
            onUpdate(); // Notify parent of the change

            // Now, update the database
            try {
                await updateTodo(todoId, { completed: true });
            } catch (error) {
                // Revert on failure
                toast({
                    title: "خطأ",
                    description: "فشل في تحديث المهمة.",
                    variant: "destructive",
                });
                onUpdate(); // Refetch to get the correct state
            }
        }, 800); // Duration should be a bit longer than your CSS animations
    };
    
    const handleTogglePriority = async (todoId: string, currentPriority: boolean) => {
        if (!todoId) return;
    
        // Optimistic UI update
        setGroupedTodos(prevGroups => {
            const newGroups = { ...prevGroups };
            for (const key in newGroups) {
                if (newGroups[key]) {
                    const todoIndex = newGroups[key].findIndex(t => t.id === todoId);
                    if (todoIndex !== -1) {
                        newGroups[key][todoIndex] = { ...newGroups[key][todoIndex], isHighPriority: !currentPriority };
                        newGroups[key] = sortTodos(newGroups[key]); // Re-sort the list
                        break;
                    }
                }
            }
            return newGroups;
        });

        try {
            await updateTodo(todoId, { isHighPriority: !currentPriority });
            onUpdate(); // Refresh parent state
        } catch (error) {
            toast({
                title: "خطأ",
                description: "فشل في تحديث أولوية المهمة.",
                variant: "destructive",
            });
            onUpdate(); // Revert on failure
        }
    };

    const handleDeleteTodo = async (todo: Todo) => {
        if (!todo.id) return;

        const originalGroupedTodos = {...groupedTodos};
        const newGroups = {...originalGroupedTodos};
        let groupKey: string | null = null;
        
        if (todo.domainId) {
            for (const domainName in newGroups) {
                if (newGroups[domainName]) {
                    const todoIndex = newGroups[domainName].findIndex(t => t.id === todo.id);
                    if (todoIndex > -1) {
                        groupKey = domainName;
                        break;
                    }
                }
            }
        } else {
            groupKey = GENERAL_TASKS_KEY;
        }

        if (groupKey && newGroups[groupKey]) {
            const initialLength = newGroups[groupKey].length;
            newGroups[groupKey] = newGroups[groupKey].filter(t => t.id !== todo.id);
             if (newGroups[groupKey].length !== initialLength) {
                if (newGroups[groupKey].length === 0) {
                    delete newGroups[groupKey];
                }
            }
        }

        setGroupedTodos(newGroups);
        onUpdate();
        
        try {
            await deleteTodo(todo.id);
            toast({
                title: "نجاح",
                description: "تم حذف المهمة.",
                variant: "destructive"
            });
        } catch (error) {
            setGroupedTodos(originalGroupedTodos);
            onUpdate();
            toast({
                title: "خطأ",
                description: "فشل في حذف المهمة.",
                variant: "destructive",
            });
        }
    };

    const handleAddGeneralTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = newGeneralTodo.trim();
        if (!text) return;
        
        setAddingTodo(true);
        try {
            // Optimistic update
            const tempId = `temp-${Date.now()}`;
            const newTodo: Todo & { isNew?: boolean } = { 
                text, 
                completed: false, 
                id: tempId, 
                createdAt: new Date().toISOString(),
                isHighPriority: false,
                isNew: true
            };
            
            setGroupedTodos(prev => ({
                ...prev,
                [GENERAL_TASKS_KEY]: sortTodos([newTodo, ...(prev[GENERAL_TASKS_KEY] || [])])
            }));
            setNewGeneralTodo('');

            const addedTodo = await addTodo({ text, completed: false, isHighPriority: false });
            setGroupedTodos(prev => {
                const currentTodos = prev[GENERAL_TASKS_KEY] || [];
                const newTodos = currentTodos.map(t => t.id === tempId ? addedTodo : t);
                return { ...prev, [GENERAL_TASKS_KEY]: sortTodos(newTodos) };
            });

            onUpdate();
        } catch (error) {
             toast({
                title: "خطأ",
                description: "فشل في إضافة المهمة العامة.",
                variant: "destructive",
            });
             onUpdate(); // Re-fetch on error
        } finally {
            setAddingTodo(false);
        }
    };
    
    const handleLabelClick = (e: React.MouseEvent<HTMLLabelElement>) => {
        const range = document.createRange();
        range.selectNodeContents(e.currentTarget);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
    };

    if (loading && Object.keys(groupedTodos).length === 0) {
        return (
            <Card>
                <CardContent className="pt-6 flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }
    
    const renderTodoItem = (todo: Todo & { isNew?: boolean }, index: number) => {
      if (!todo.id) return null;
      const isCompleting = toggledTodos.includes(todo.id);
      return (
        <li 
            key={todo.id} 
            className={cn(
                "flex items-center gap-3 p-2 rounded-md bg-background/50 hover:bg-background transition-colors group",
                isCompleting && "slide-out-and-fade",
                todo.isNew ? "slide-in-and-fade" : "staggered-fade-in",
                todo.isHighPriority && !todo.completed && "animate-flash-yellow"
            )}
            style={{ animationDelay: todo.isNew ? '0ms' : `${index * 50}ms` }}
        >
            <Checkbox
                id={`all-todo-${todo.id}`}
                checked={todo.completed}
                onCheckedChange={() => !todo.completed && handleToggleTodo(todo.id!)}
                className={cn("completed-animation-checkbox")}
            />
            <label 
                htmlFor={`all-todo-${todo.id}`} 
                onClick={handleLabelClick}
                className={cn("flex-1 text-sm select-all whitespace-pre-wrap relative", todo.completed && "strikethrough-label")}
            >
                {todo.text}
            </label>
            <div className="flex items-center gap-1">
                <button onClick={() => handleTogglePriority(todo.id!, todo.isHighPriority || false)} className="p-1">
                    <Star className={cn(
                        "h-4 w-4 text-muted-foreground hover:text-yellow-400",
                        todo.isHighPriority && "text-yellow-400 fill-yellow-400/70"
                    )} />
                </button>
                <button onClick={() => handleDeleteTodo(todo)}>
                    <Trash2 className="h-4 w-4 text-destructive/80" />
                </button>
            </div>
        </li>
      );
    }

    return (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6">
                
                <form onSubmit={handleAddGeneralTodo} className="flex gap-2 mb-6">
                  <Input
                    type="text"
                    placeholder="مهمة عامة جديدة..."
                    value={newGeneralTodo}
                    onChange={e => setNewGeneralTodo(e.target.value)}
                    className="bg-background"
                  />
                  <Button type="submit" size="icon" disabled={addingTodo}>
                    {addingTodo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </form>

                {sortedGroups.length === 0 && !addingTodo ? (
                    <p className="text-center text-muted-foreground py-4">لا توجد أي مهام في جميع المشاريع.</p>
                ) : (
                    <div className="space-y-4">
                        {sortedGroups.map((groupName, index) => (
                           <div key={groupName}>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    {groupName}
                                </h3>
                                <ul className="space-y-2">
                                    {groupedTodos[groupName] && groupedTodos[groupName].map(renderTodoItem)}
                                </ul>
                                {index < sortedGroups.length - 1 && <div className="border-b border-border/50 my-4"></div>}
                           </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

    

    

    

    