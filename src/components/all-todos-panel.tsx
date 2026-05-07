
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash2, Plus, Star, Edit2, Check, X, GripVertical } from 'lucide-react';
import { getAllTodosGroupedByDomain, deleteTodo, GENERAL_TASKS_KEY, addTodo, updateTodo, reorderTodos } from '@/services/todoService';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
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
    const [editingTodoId, setEditingTodoId] = React.useState<string | null>(null);
    const [editingTodoText, setEditingTodoText] = React.useState('');
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Main topics for quick task creation - loaded from localStorage or use defaults
    const [mainTopics, setMainTopics] = React.useState<{ name: string; icon: string }[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mainTopics');
            if (saved) {
                return JSON.parse(saved);
            }
        }
        return [];
    });
    const [showAddTopic, setShowAddTopic] = React.useState(false);
    const [newTopicName, setNewTopicName] = React.useState('');
    const [newTopicIcon, setNewTopicIcon] = React.useState('📌');

    const sortTodos = (todos: (Todo & { isNew?: boolean })[]) => {
        return todos.sort((a, b) => {
            if (a.isHighPriority && !b.isHighPriority) return -1;
            if (!a.isHighPriority && b.isHighPriority) return 1;
            return (a.order || 0) - (b.order || 0);
        });
    };

    // Correctly placed useMemo for sorting groups by priority
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
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio("data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAnxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABodHRwOi8vd3d3Lm11c2VzY29yZS5jb20vdXNlci8zMzA3MTYxMS9zY29yZXMvNjY3NjE2MwAAADlNdXNlU2NvcmUgMy42LjIgLSBWb2ljZSAxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-");
            if (audioRef.current) {
                audioRef.current.volume = 0.5;
            }
        }
    }, []);

    const handleToggleTodo = async (todoId: string) => {
        if (!todoId || toggledTodos.includes(todoId)) return;

        setToggledTodos(prev => [...prev, todoId]);
        setGroupedTodos(prevGroups => {
            const newGroups = { ...prevGroups };
            for (const key in newGroups) {
                if (newGroups[key]) {
                    const todoIndex = newGroups[key].findIndex(t => t.id === todoId);
                    if (todoIndex !== -1) {
                        newGroups[key][todoIndex] = { ...newGroups[key][todoIndex], completed: true };
                        break;
                    }
                }
            }
            return newGroups;
        });
        audioRef.current?.play().catch(e => console.log("Audio play failed", e));

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
            onUpdate();

            try {
                await updateTodo(todoId, { completed: true });
            } catch (error) {
                toast({
                    title: "خطأ",
                    description: "فشل في تحديث المهمة.",
                    variant: "destructive",
                });
                onUpdate();
            }
        }, 800);
    };
    
    const handleTogglePriority = async (todoId: string, currentPriority: boolean) => {
        if (!todoId) return;
    
        setGroupedTodos(prevGroups => {
            const newGroups = { ...prevGroups };
            for (const key in newGroups) {
                if (newGroups[key]) {
                    const todoIndex = newGroups[key].findIndex(t => t.id === todoId);
                    if (todoIndex !== -1) {
                        newGroups[key][todoIndex] = { ...newGroups[key][todoIndex], isHighPriority: !currentPriority };
                        newGroups[key] = sortTodos(newGroups[key]);
                        break;
                    }
                }
            }
            return newGroups;
        });

        try {
            await updateTodo(todoId, { isHighPriority: !currentPriority });
            onUpdate();
        } catch (error) {
            toast({
                title: "خطأ",
                description: "فشل في تحديث أولوية المهمة.",
                variant: "destructive",
            });
            onUpdate();
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
            newGroups[groupKey] = newGroups[groupKey].filter(t => t.id !== todo.id);
            if (newGroups[groupKey].length === 0) {
                delete newGroups[groupKey];
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
            const tempId = `temp-${Date.now()}`;
            const currentTodos = groupedTodos[GENERAL_TASKS_KEY] || [];
            const newOrder = currentTodos.length;
            const newTodo: Todo & { isNew?: boolean } = {
                text,
                completed: false,
                id: tempId,
                createdAt: new Date().toISOString(),
                isHighPriority: false,
                order: newOrder,
                isNew: true
            };

            setGroupedTodos(prev => ({
                ...prev,
                [GENERAL_TASKS_KEY]: sortTodos([newTodo, ...(prev[GENERAL_TASKS_KEY] || [])])
            }));
            setNewGeneralTodo('');

            const addedTodo = await addTodo({ text, completed: false, isHighPriority: false, order: newOrder });
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
             onUpdate();
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

    const handleStartEdit = (todoId: string, currentText: string) => {
        setEditingTodoId(todoId);
        setEditingTodoText(currentText);
    };

    const handleSaveEdit = async (todoId: string) => {
        if (!todoId || !editingTodoText.trim()) return;

        const newText = editingTodoText.trim();
        setGroupedTodos(prevGroups => {
            const newGroups = { ...prevGroups };
            for (const key in newGroups) {
                if (newGroups[key]) {
                    const todoIndex = newGroups[key].findIndex(t => t.id === todoId);
                    if (todoIndex !== -1) {
                        newGroups[key][todoIndex] = { ...newGroups[key][todoIndex], text: newText };
                        break;
                    }
                }
            }
            return newGroups;
        });

        try {
            await updateTodo(todoId, { text: newText });
            setEditingTodoId(null);
            setEditingTodoText('');
            onUpdate();
        } catch (error) {
            toast({
                title: "خطأ",
                description: "فشل في تحديث اسم المهمة.",
                variant: "destructive",
            });
            onUpdate();
        }
    };

    const handleCancelEdit = () => {
        setEditingTodoId(null);
        setEditingTodoText('');
    };

    const handleDragEnd = async (result: any, groupName: string) => {
        if (!result.destination || !groupedTodos[groupName]) return;

        const items = Array.from(groupedTodos[groupName]);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedTodos = items.map((todo, index) => ({
            ...todo,
            order: index,
        }));

        setGroupedTodos(prev => ({
            ...prev,
            [groupName]: updatedTodos,
        }));

        try {
            await reorderTodos(updatedTodos);
            onUpdate();
        } catch (error) {
            toast({
                title: "خطأ",
                description: "فشل في تحديث ترتيب المهام.",
                variant: "destructive",
            });
            onUpdate();
        }
    };

    const handleTopicClick = (topicName: string) => {
        setNewGeneralTodo(`${topicName} - `);
        inputRef.current?.focus();
    };

    const handleAddTopic = () => {
        if (!newTopicName.trim()) return;

        const newTopic = { name: newTopicName.trim(), icon: newTopicIcon };
        const updatedTopics = [...mainTopics, newTopic];
        setMainTopics(updatedTopics);
        localStorage.setItem('mainTopics', JSON.stringify(updatedTopics));

        setNewTopicName('');
        setNewTopicIcon('📌');
        setShowAddTopic(false);

        toast({
            title: "نجاح",
            description: "تم إضافة الموضوع بنجاح.",
        });
    };

    const handleDeleteTopic = (topicName: string) => {
        const updatedTopics = mainTopics.filter(t => t.name !== topicName);
        setMainTopics(updatedTopics);
        localStorage.setItem('mainTopics', JSON.stringify(updatedTopics));
    };

    const handleMoveTopic = (index: number, direction: 'up' | 'down') => {
        const items = Array.from(mainTopics);
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= items.length) return;

        [items[index], items[newIndex]] = [items[newIndex], items[index]];
        setMainTopics(items);
        localStorage.setItem('mainTopics', JSON.stringify(items));
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
    
    const renderTodoItem = (todo: Todo & { isNew?: boolean }, index: number, groupName: string) => {
      if (!todo.id) return null;
      const isCompleting = toggledTodos.includes(todo.id);
      const isEditing = editingTodoId === todo.id;
      return (
        <Draggable key={todo.id} draggableId={todo.id} index={index} isDragDisabled={isEditing}>
          {(provided, snapshot) => (
            <li
                ref={provided.innerRef}
                {...provided.draggableProps}
                className={cn(
                    "flex items-center gap-3 p-2 rounded-md bg-background/50 hover:bg-background transition-colors group",
                    isCompleting && "slide-out-and-fade",
                    todo.isNew ? "slide-in-and-fade" : "staggered-fade-in",
                    todo.isHighPriority && !todo.completed && "animate-flash-yellow",
                    snapshot.isDragging && "shadow-lg"
                )}
                style={{
                    ...provided.draggableProps.style,
                    animationDelay: todo.isNew ? '0ms' : `${index * 50}ms`
                }}
            >
                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <Checkbox
                    id={`all-todo-${todo.id}`}
                    checked={todo.completed}
                    onCheckedChange={() => !todo.completed && handleToggleTodo(todo.id!)}
                    className={cn("completed-animation-checkbox")}
                />
                {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                        <Input
                            value={editingTodoText}
                            onChange={(e) => setEditingTodoText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(todo.id!);
                                if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="h-8 text-sm"
                            autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveEdit(todo.id!)}>
                            <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                            <X className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ) : (
                    <>
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
                            <button onClick={() => handleStartEdit(todo.id!, todo.text)} className="p-1">
                                <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </button>
                            <button onClick={() => handleDeleteTodo(todo)}>
                                <Trash2 className="h-4 w-4 text-destructive/80" />
                            </button>
                        </div>
                    </>
                )}
            </li>
          )}
        </Draggable>
      );
    }

    return (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6">

                {/* Topic buttons for general tasks */}
                <div className="flex flex-wrap gap-2 mb-3 items-center">
                    {mainTopics.map((topic, index) => (
                        <div key={topic.name} className="relative group flex items-center gap-0.5">
                            {index > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                                    onClick={() => handleMoveTopic(index, 'up')}
                                >
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M4 2L1 5h6L4 2z" fill="currentColor"/></svg>
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleTopicClick(topic.name)}
                                className="text-xs cursor-pointer"
                            >
                                <span className="ml-1">{topic.icon}</span>
                                {topic.name}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-3 w-3 -mt-2 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground"
                                onClick={() => handleDeleteTopic(topic.name)}
                            >
                                <X className="h-2 w-2" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddTopic(!showAddTopic)}
                        className="text-xs"
                    >
                        <Plus className="h-3 w-3 ml-1" />
                        إضافة
                    </Button>
                </div>

                {/* Add topic form */}
                {showAddTopic && (
                    <div className="flex gap-2 items-center p-2 bg-muted/50 rounded-md mb-3">
                        <Input
                            type="text"
                            placeholder="اسم الموضوع..."
                            value={newTopicName}
                            onChange={e => setNewTopicName(e.target.value)}
                            className="h-8 text-sm"
                        />
                        <select
                            value={newTopicIcon}
                            onChange={e => setNewTopicIcon(e.target.value)}
                            className="h-8 text-sm px-2 rounded-md border bg-background"
                        >
                            <option value="📌">📌</option>
                            <option value="🎯">🎯</option>
                            <option value="🚀">🚀</option>
                            <option value="💡">💡</option>
                            <option value="⭐">⭐</option>
                            <option value="🔥">🔥</option>
                            <option value="📚">📚</option>
                            <option value="🎨">🎨</option>
                            <option value="💻">💻</option>
                            <option value="📢">📢</option>
                            <option value="📝">📝</option>
                            <option value="🎧">🎧</option>
                            <option value="💰">💰</option>
                            <option value="🔧">🔧</option>
                            <option value="📊">📊</option>
                            <option value="🎵">🎵</option>
                            <option value="🌟">🌟</option>
                            <option value="🏆">🏆</option>
                        </select>
                        <Button type="button" size="sm" onClick={handleAddTopic}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddTopic(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <form onSubmit={handleAddGeneralTodo} className="flex gap-2 mb-6">
                  <Input
                    ref={inputRef}
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
                                <DragDropContext onDragEnd={(result) => handleDragEnd(result, groupName)}>
                                  <Droppable droppableId={`group-${groupName}`}>
                                    {(provided) => (
                                      <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                          {groupedTodos[groupName] && groupedTodos[groupName].map((todo, todoIndex) => renderTodoItem(todo, todoIndex, groupName))}
                                          {provided.placeholder}
                                      </ul>
                                    )}
                                  </Droppable>
                                </DragDropContext>
                                {index < sortedGroups.length - 1 && <div className="border-b border-border/50 my-4"></div>}
                           </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
