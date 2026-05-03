import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { db, auth } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { toast, Toaster } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  active: boolean;
  createdAt: any;
  createdBy: string;
}

export function BHWTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(10);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(tasksList);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async () => {
    if (!title.trim()) {
      toast.error("Please enter task title");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Please sign in");
      return;
    }

    try {
      if (editingTask) {
        await updateDoc(doc(db, "tasks", editingTask.id), {
          title,
          description,
          points,
        });
        toast.success("Task updated!");
      } else {
        await addDoc(collection(db, "tasks"), {
          title,
          description,
          points,
          active: true,
          createdAt: new Date(),
          createdBy: currentUser.uid,
        });
        toast.success("Task added!");
      }
      setDialogOpen(false);
      resetForm();
      loadTasks();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Delete this task?")) {
      try {
        await deleteDoc(doc(db, "tasks", taskId));
        toast.success("Task deleted!");
        loadTasks();
      } catch (error) {
        console.error("Error deleting task:", error);
        toast.error("Failed to delete task");
      }
    }
  };

  const handleToggleActive = async (task: Task) => {
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        active: !task.active
      });
      toast.success(`Task ${!task.active ? "activated" : "deactivated"}`);
      loadTasks();
    } catch (error) {
      console.error("Error toggling task:", error);
      toast.error("Failed to update task");
    }
  };

  const resetForm = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setPoints(10);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setPoints(task.points);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B0B45]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Tasks Manager</h1>
          <p className="text-muted-foreground text-sm">Create and manage resident tasks</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0B0B45] hover:bg-[#1a1a5e]">
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "New Task"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Read about Dengue" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div>
                <Label>Points</Label>
                <Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} min={1} />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button className="bg-[#0B0B45] hover:bg-[#1a1a5e]" onClick={handleSaveTask}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No tasks yet. Click "Add Task" to start.</Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className={`p-5 ${!task.active ? "bg-gray-50 opacity-60" : ""}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{task.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  <div className="flex gap-4 mt-3">
                    <span className="text-sm text-green-600 font-medium">+{task.points} pts</span>
                    <span className={`text-sm ${task.active ? "text-green-500" : "text-gray-400"}`}>
                      {task.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(task)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleToggleActive(task)}>
                    {task.active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteTask(task.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}