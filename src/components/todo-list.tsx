
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Copy, Star, Edit2, Check, X, GripVertical } from 'lucide-react';
import { addTodo, updateTodo, deleteTodo, reorderTodos, getTopics, saveTopics, type Topic } from '@/services/todoService';
import type { Todo } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface TodoListProps {
  domainId: string;
  initialTodos: Todo[];
  onUpdate: () => void;
}

export function TodoList({ domainId, initialTodos, onUpdate }: TodoListProps) {
  const [todos, setTodos] = React.useState<(Todo & { isNew?: boolean })[]>([]);
  const [newTodo, setNewTodo] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const [toggledTodos, setToggledTodos] = React.useState<string[]>([]);
  const [editingTodoId, setEditingTodoId] = React.useState<string | null>(null);
  const [editingTodoText, setEditingTodoText] = React.useState('');
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Main topics for quick task creation - loaded from Firestore
  const [mainTopics, setMainTopics] = React.useState<Topic[]>([]);

  // Load topics from Firestore on mount
  React.useEffect(() => {
    getTopics().then(topics => {
      setMainTopics(topics);
    }).catch(err => console.error('Error loading topics:', err));
  }, []);
  const [showAddTopic, setShowAddTopic] = React.useState(false);
  const [newTopicName, setNewTopicName] = React.useState('');
  const [newTopicIcon, setNewTopicIcon] = React.useState(String.fromCodePoint(0x1F4CC));
  
  const sortTodos = (todos: (Todo & { isNew?: boolean })[]) => {
    return todos.sort((a, b) => {
        if (a.isHighPriority && !b.isHighPriority) return -1;
        if (!a.isHighPriority && b.isHighPriority) return 1;
        return (a.order || 0) - (b.order || 0);
    });
  };

  React.useEffect(() => {
    // Pre-load the audio
    if (typeof window !== 'undefined') {
        audioRef.current = new Audio("data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAnRABiFADgAANqiv//zFAREFVAAAAgAAA+jTEFImAAK4AABNEMkCSJ1YgJgAABRgAAAAnY1NTAVEAAAABAAAADkxBVkMAAAA5OC4xMDguMTAwAAAA//sQjxADeALgAABpAiv//wAAN9gAADCem8pXlRzYQCAAAAAAAAAAAAAFlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-");
        if (audioRef.current) {
            audioRef.current.volume = 0.5;
        }
    }
    const uncompleted = initialTodos.filter(t => !t.completed);
    setTodos(sortTodos(uncompleted));
  }, [initialTodos]);


  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTodo.trim();
    if (!text) return;

    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return;

    setNewTodo('');

    if (lines.length === 1) {
      const tempId = `temp-${Date.now()}`;
      const newOrder = todos.length;
      const optimisticTodo: Todo & { isNew?: boolean } = {
        id: tempId,
        domainId,
        text: lines[0],
        completed: false,
        createdAt: new Date().toISOString(),
        isHighPriority: false,
        order: newOrder,
        isNew: true,
      };

      setTodos(prevTodos => sortTodos([optimisticTodo, ...prevTodos]));

      try {
        const addedTodo = await addTodo({
          domainId,
          text: lines[0],
          completed: false,
          isHighPriority: false,
          order: newOrder,
        });
        setTodos(prevTodos =>
          sortTodos(prevTodos.map(t => (t.id === tempId ? addedTodo : t)))
        );
        onUpdate();
      } catch (error) {
        setTodos(prevTodos => prevTodos.filter(t => t.id !== tempId));
        console.error("Error adding todo:", error);
        toast({
          title: "خطأ",
          description: "فشل في إضافة المهمة.",
          variant: "destructive",
        });
      }
    } else {
      const newTodos: (Todo & { isNew?: boolean })[] = lines.map((line, index) => ({
        id: `temp-${Date.now()}-${index}`,
        domainId,
        text: line,
        completed: false,
        createdAt: new Date().toISOString(),
        isHighPriority: false,
        order: todos.length + index,
        isNew: true,
      }));

      setTodos(prevTodos => sortTodos([...newTodos, ...prevTodos]));

      try {
        await Promise.all(lines.map((line, index) =>
          addTodo({
            domainId,
            text: line,
            completed: false,
            isHighPriority: false,
            order: todos.length + index,
          })
        ));
        onUpdate();
      } catch (error) {
        setTodos(prevTodos => prevTodos.filter(t => !t.id?.startsWith('temp-')));
        console.error("Error adding todos:", error);
        toast({
          title: "خطأ",
          description: "فشل في إضافة المهام.",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleTodo = async (todoId: string) => {
    if (!todoId || todoId.startsWith('temp-') || toggledTodos.includes(todoId)) return;
    
    setToggledTodos(prev => [...prev, todoId]);
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, completed: true } : t));
    audioRef.current?.play().catch(e => console.log("Audio play failed", e));
    
    setTimeout(async () => {
        const originalTodos = todos;
        setTodos(prev => prev.filter(t => t.id !== todoId));
        setToggledTodos(prev => prev.filter(id => id !== todoId));
        onUpdate();
    
        try {
            await updateTodo(todoId, { completed: true });
        } catch (error) {
            setTodos(originalTodos); 
            onUpdate();
            console.error("Error updating todo:", error);
            toast({
                title: "خطأ",
                description: "فشل في تحديث المهمة.",
                variant: "destructive",
            });
        }
    }, 800);
  };

  const handleTogglePriority = async (todoId: string, currentPriority: boolean) => {
    if (!todoId || todoId.startsWith('temp-')) return;
    
    setTodos(prev => {
        const updatedTodos = prev.map(t => 
            t.id === todoId ? { ...t, isHighPriority: !currentPriority } : t
        );
        return sortTodos(updatedTodos);
    });

    try {
        await updateTodo(todoId, { isHighPriority: !currentPriority });
        onUpdate();
    } catch (error) {
        setTodos(prev => {
            const revertedTodos = prev.map(t => 
                t.id === todoId ? { ...t, isHighPriority: currentPriority } : t
            );
            return sortTodos(revertedTodos);
        });
        toast({
            title: "خطأ",
            description: "فشل في تحديث أولوية المهمة.",
            variant: "destructive",
        });
    }
  };
  
  const handleDeleteTodo = async (todoId: string) => {
    if (!todoId || todoId.startsWith('temp-')) return;
  
    const originalTodos = todos;
    setTodos(prev => prev.filter(t => t.id !== todoId));
    onUpdate();
  
    try {
      await deleteTodo(todoId);
      toast({
        title: "نجاح",
        description: "تم حذف المهمة.",
        variant: "destructive"
      });
    } catch (error) {
      setTodos(originalTodos);
      onUpdate();
      console.error("Error deleting todo:", error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المهمة.",
        variant: "destructive",
      });
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
    setTodos(prev => {
        const updatedTodos = prev.map(t =>
            t.id === todoId ? { ...t, text: newText } : t
        );
        return sortTodos(updatedTodos);
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

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(todos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedTodos = items.map((todo, index) => ({
      ...todo,
      order: index,
    }));

    setTodos(updatedTodos);

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
    setNewTodo(`${topicName} - `);
    inputRef.current?.focus();
  };

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;

    const newTopic = { name: newTopicName.trim(), icon: newTopicIcon };
    const updatedTopics = [...mainTopics, newTopic];
    setMainTopics(updatedTopics);

    try {
      await saveTopics(updatedTopics);
      toast({ title: "نجاح", description: "تم إضافة الموضوع بنجاح." });
    } catch (error) {
      console.error('Error saving topic:', error);
      toast({ title: "خطأ", description: "فشل في حفظ الموضوع.", variant: "destructive" });
    }

    setNewTopicName('');
    setNewTopicIcon('📌');
    setShowAddTopic(false);
  };

  const handleDeleteTopic = async (topicName: string) => {
    const updatedTopics = mainTopics.filter(t => t.name !== topicName);
    setMainTopics(updatedTopics);
    try {
      await saveTopics(updatedTopics);
    } catch (error) {
      console.error('Error deleting topic:', error);
    }
  };

  const handleMoveTopic = async (index: number, direction: 'up' | 'down') => {
    const items = Array.from(mainTopics);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    setMainTopics(items);
    try {
      await saveTopics(items);
    } catch (error) {
      console.error('Error reordering topics:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Topic buttons */}
      <div className="flex flex-wrap gap-2 items-center">
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
          className="text-xs font-bold"
        >
          <Plus className="h-3 w-3 ml-1" />
          إضافة موضوعات
        </Button>
      </div>

      {/* Add topic form */}
      {showAddTopic && (
        <div className="flex gap-2 items-center p-2 bg-muted/50 rounded-md">
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

      <form onSubmit={handleAddTodo} className="flex gap-2">
        <Textarea
          ref={inputRef}
          placeholder="مهمة جديدة..."
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          className="bg-background min-h-[40px] resize-none"
          rows={1}
        />
        <Button type="submit" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="todos">
            {(provided) => (
              <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {todos.map((todo, index) => {
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
                            "flex items-start gap-3 p-2 rounded-md bg-background/50 hover:bg-background transition-colors group",
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
                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing mt-1">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Checkbox
                            id={`todo-${todo.id}`}
                            checked={todo.completed}
                            onCheckedChange={() => !todo.completed && handleToggleTodo(todo.id!)}
                            aria-label={todo.text}
                            className={cn("mt-1 completed-animation-checkbox")}
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
                                      className="h-8 text-sm sm:text-base"
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
                                    htmlFor={`todo-${todo.id}`}
                                    onClick={handleLabelClick}
                                    className={cn("flex-1 text-sm sm:text-base select-all whitespace-pre-wrap relative", todo.completed && "strikethrough-label", todo.completed ? 'text-muted-foreground' : 'text-foreground' )}
                                  >
                                    {todo.text}
                                  </label>
                                  <div className="flex items-center mt-1">
                                      <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8" onClick={() => todo.id && handleTogglePriority(todo.id, todo.isHighPriority || false)}>
                                          <Star className={cn(
                                              "h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-yellow-400",
                                              todo.isHighPriority && "text-yellow-400 fill-yellow-400/70"
                                          )} />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex" onClick={() => todo.id && handleStartEdit(todo.id, todo.text)}>
                                          <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-foreground" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => todo.id && handleDeleteTodo(todo.id)}>
                                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive/80" />
                                      </Button>
                                  </div>
                              </>
                          )}
                        </li>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
                {todos.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">لا توجد مهام حتى الآن.</p>
                )}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
