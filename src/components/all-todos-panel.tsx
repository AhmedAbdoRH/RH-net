
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash2, Plus, Star, Edit2, Check, X, GripVertical } from 'lucide-react';
import { getAllTodosGroupedByDomain, deleteTodo, GENERAL_TASKS_KEY, addTodo, updateTodo, reorderTodos } from '@/services/todoService';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { Todo, Domain } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/dialog';
import { cn } from '@/lib/utils';


interface GroupedTodos {
    [domainName: string]: (Todo & { isNew?: boolean })[];
}

interface AllTodosPanelProps {
    onUpdate: () => void;
    initialGroupedTodos: GroupedTodos;
    loading: boolean;
    allDomains?: Domain[];
    domainStatuses?: Record<string, 'checking' | 'online' | 'offline'>;
}

export function AllTodosPanel({ onUpdate, initialGroupedTodos, loading, allDomains, domainStatuses }: AllTodosPanelProps) {
    const [groupedTodos, setGroupedTodos] = React.useState<GroupedTodos>(initialGroupedTodos);
    const [newGeneralTodo, setNewGeneralTodo] = React.useState('');
    const [addingTodo, setAddingTodo] = React.useState(false);
    const [toggledTodos, setToggledTodos] = React.useState<string[]>([]);
    const [editingTodoId, setEditingTodoId] = React.useState<string | null>(null);
    const [editingTodoText, setEditingTodoText] = React.useState('');
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();
    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const [newTodoIsHighPriority, setNewTodoIsHighPriority] = React.useState(false);
    const [isDataSheetOpen, setDataSheetOpen] = React.useState(false);
    const [dataSheetContent, setDataSheetContent] = React.useState({ title: '', content: '' });
    const [editingDataSheetDomain, setEditingDataSheetDomain] = React.useState<Domain | null>(null);

    // Main topics for quick task creation - loaded from localStorage or use defaults
    const [mainTopics, setMainTopics] = React.useState<{ name: string; icon: string; isRHM?: boolean; renewalDate?: string }[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mainTopics');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Clear old topics and start fresh with domains only
                localStorage.removeItem('mainTopics');
                return [];
            }
        }
        return [];
    });
    const [showAddTopic, setShowAddTopic] = React.useState(false);
    const [newTopicName, setNewTopicName] = React.useState('');
    const [newTopicIcon, setNewTopicIcon] = React.useState('📌');

    // Add domains as topics on mount
    React.useEffect(() => {
        if (allDomains && allDomains.length > 0) {
            const domainTopics = allDomains
                .map(domain => {
                    const domainName = domain.domainName.slice(0, -4).replace(/-/g, ' '); // Replace hyphens with spaces
                    const fullDomain = domain.domainName;
                    const isRHM = domain.projects?.includes('RHM') || false;
                    return {
                        name: domainName,
                        icon: `https://www.google.com/s2/favicons?domain=${fullDomain}&sz=32`,
                        renewalDate: domain.renewalDate,
                        isRHM: isRHM
                    };
                })
                .sort((a, b) => {
                    // First sort by isRHM (RHM first)
                    if (a.isRHM && !b.isRHM) return -1;
                    if (!a.isRHM && b.isRHM) return 1;
                    // Then sort by renewal date (latest first)
                    if (a.renewalDate && b.renewalDate) {
                        return new Date(b.renewalDate).getTime() - new Date(a.renewalDate).getTime();
                    }
                    return 0;
                });

            setMainTopics(domainTopics);
            localStorage.setItem('mainTopics', JSON.stringify(domainTopics));
        }
    }, [allDomains]);

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

        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        setNewGeneralTodo('');
        setAddingTodo(true);

        try {
            const currentTodos = groupedTodos[GENERAL_TASKS_KEY] || [];

            if (lines.length === 1) {
                const tempId = `temp-${Date.now()}`;
                const newOrder = currentTodos.length;
                const newTodo: Todo & { isNew?: boolean } = {
                    text: lines[0],
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

                const addedTodo = await addTodo({ text: lines[0], completed: false, isHighPriority: false, order: newOrder });
                setGroupedTodos(prev => {
                    const currentTodos = prev[GENERAL_TASKS_KEY] || [];
                    const newTodos = currentTodos.map(t => t.id === tempId ? addedTodo : t);
                    return { ...prev, [GENERAL_TASKS_KEY]: sortTodos(newTodos) };
                });
            } else {
                const newTodos: (Todo & { isNew?: boolean })[] = lines.map((line, index) => ({
                    text: line,
                    completed: false,
                    id: `temp-${Date.now()}-${index}`,
                    createdAt: new Date().toISOString(),
                    isHighPriority: false,
                    order: currentTodos.length + index,
                    isNew: true
                }));

                setGroupedTodos(prev => ({
                    ...prev,
                    [GENERAL_TASKS_KEY]: sortTodos([...newTodos, ...(prev[GENERAL_TASKS_KEY] || [])])
                }));

                await Promise.all(lines.map((line, index) =>
                    addTodo({ text: line, completed: false, isHighPriority: false, order: currentTodos.length + index })
                ));
            }

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

    const openDataSheetDialog = (topicName: string) => {
        const domain = allDomains?.find(d => d.domainName.slice(0, -4).replace(/-/g, ' ') === topicName);
        if (domain) {
            setDataSheetContent({ title: `شيت بيانات: ${domain.domainName}`, content: domain.dataSheet || '' });
            setEditingDataSheetDomain(domain);
            setDataSheetOpen(true);
        }
    };

    const handleDataSheetChange = (content: string) => {
        setDataSheetContent(prev => ({ ...prev, content }));
        if (editingDataSheetDomain) {
            setEditingDataSheetDomain(prev => prev ? { ...prev, dataSheet: content } : null);
        }
    };

    const handleSaveDataSheet = async () => {
        if (!editingDataSheetDomain || !editingDataSheetDomain.id) return;

        try {
            const { updateDomain } = await import('@/services/domainService');
            await updateDomain(editingDataSheetDomain.id, { dataSheet: editingDataSheetDomain.dataSheet });
            toast({
                title: "تم حفظ شيت البيانات",
                description: `تم تحديث شيت بيانات ${editingDataSheetDomain.domainName}.`,
            });
            setDataSheetOpen(false);
            setEditingDataSheetDomain(null);
            onUpdate();
        } catch (error) {
            console.error("Error saving data sheet:", error);
            toast({
                title: "خطأ",
                description: "فشل في حفظ شيت البيانات.",
                variant: "destructive",
            });
        }
    };

    const handleLongPress = (topicName: string) => {
        openDataSheetDialog(topicName);
    };

    const LongPressButton = ({ topicName, children }: { topicName: string; children: React.ReactNode }) => {
        const [pressTimer, setPressTimer] = React.useState<NodeJS.Timeout | null>(null);

        const handleMouseDown = () => {
            const timer = setTimeout(() => {
                handleLongPress(topicName);
            }, 1000); // 1 second
            setPressTimer(timer);
        };

        const handleMouseUp = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                setPressTimer(null);
            }
        };

        const handleMouseLeave = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                setPressTimer(null);
            }
        };

        return (
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTopicClick(topicName)}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                className="text-sm cursor-pointer h-9 px-2 py-1"
            >
                {children}
            </Button>
        );
    };

    const renderStatusDot = (topicName: string) => {
        if (!domainStatuses || !allDomains) return null;
        const domain = allDomains.find(d => d.domainName.slice(0, -4).replace(/-/g, ' ') === topicName);
        if (!domain || !domain.id) return null;
        const status = domainStatuses[domain.id];

        if (status === 'checking') {
          return <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse ml-1" title="يتم التحقق..."></div>;
        }
        if (status === 'offline') {
          return <div className="h-2 w-2 rounded-full bg-red-500 ml-1" title="غير متصل"></div>;
        }
        if (status === 'online') {
          return <div className="h-2 w-2 rounded-full bg-green-500 ml-1" title="متصل"></div>;
        }
        return null;
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
        <>
            {/* Topic buttons for general tasks - separate from todo list */}
            <Card className="bg-card/80 backdrop-blur-sm mb-2">
                <CardContent className="pt-6">
                    {/* RHM domains */}
                    <div className="flex flex-wrap gap-0 items-center mb-2 justify-center">
                        {mainTopics.filter(t => t.isRHM).map((topic) => (
                            <LongPressButton key={topic.name} topicName={topic.name}>
                                {topic.icon.startsWith('http') ? (
                                    <img src={topic.icon} alt="" className="w-5 h-5 ml-0" />
                                ) : (
                                    <span className="ml-0">{topic.icon}</span>
                                )}
                                {topic.name}
                                {renderStatusDot(topic.name)}
                            </LongPressButton>
                        ))}
                    </div>
                    {/* Separator between RHM and other projects */}
                    {mainTopics.some(t => t.isRHM) && mainTopics.some(t => !t.isRHM) && (
                        <div className="w-full h-px bg-border my-2"></div>
                    )}
                    {/* Other projects domains */}
                    <div className="flex flex-wrap gap-0 items-center justify-center">
                        {mainTopics.filter(t => !t.isRHM).map((topic) => (
                            <LongPressButton key={topic.name} topicName={topic.name}>
                                {topic.icon.startsWith('http') ? (
                                    <img src={topic.icon} alt="" className="w-5 h-5 ml-0" />
                                ) : (
                                    <span className="ml-0">{topic.icon}</span>
                                )}
                                {topic.name}
                                {renderStatusDot(topic.name)}
                            </LongPressButton>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Todo list */}
            <Card className="bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                    <form onSubmit={handleAddGeneralTodo} className="flex gap-2 mb-6 items-center">
                        <button
                            type="button"
                            onClick={() => setNewTodoIsHighPriority(!newTodoIsHighPriority)}
                            className="cursor-pointer"
                        >
                            <Star className={cn(
                                "h-5 w-5",
                                newTodoIsHighPriority ? "text-yellow-400 fill-yellow-400/70" : "text-muted-foreground"
                            )} />
                        </button>
                        <Textarea
                            ref={inputRef}
                            placeholder="مهمة عامة جديدة..."
                            value={newGeneralTodo}
                            onChange={e => setNewGeneralTodo(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddGeneralTodo(e);
                                }
                            }}
                            className="bg-background min-h-[40px] resize-none"
                            rows={1}
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

        {/* Data Sheet Dialog */}
        <Dialog open={isDataSheetOpen} onOpenChange={setDataSheetOpen}>
            <DialogContent className="max-w-[90vw] md:max-w-2xl lg:max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader className="flex-row justify-between items-center">
                    <DialogTitle className="text-lg">
                        شيت بيانات:{' '}
                        {editingDataSheetDomain && (
                            <a
                                href={editingDataSheetDomain.domainName.startsWith('http') ? editingDataSheetDomain.domainName : `https://${editingDataSheetDomain.domainName}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                            >
                                {editingDataSheetDomain.domainName}
                            </a>
                        )}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleSaveDataSheet}>حفظ</Button>
                        <DialogClose asChild><Button variant="ghost">إغلاق</Button></DialogClose>
                    </div>
                </DialogHeader>
                <div className="flex-grow flex flex-col py-4">
                    <Textarea
                        value={dataSheetContent.content}
                        onChange={e => handleDataSheetChange(e.target.value)}
                        className="w-full flex-grow font-mono text-sm"
                        rows={25}
                    />
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
}
