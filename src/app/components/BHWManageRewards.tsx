import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Plus, Edit, Trash2, CheckCircle, XCircle, Gift } from "lucide-react";
import { db, auth } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { toast, Toaster } from "sonner";

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  active: boolean;
  createdAt: any;
  createdBy: string;
}

export function BHWManageRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pointsRequired, setPointsRequired] = useState(100);

  // REAL-TIME: Rewards listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "rewards"), (snapshot) => {
      const rewardsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
      setRewards(rewardsList);
      setLoading(false);
    }, (error) => {
      console.error("Error loading rewards:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleSaveReward = async () => {
    if (!title.trim()) {
      toast.error("Please enter reward title");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Please sign in");
      return;
    }

    try {
      if (editingReward) {
        await updateDoc(doc(db, "rewards", editingReward.id), {
          title,
          description,
          pointsRequired,
        });
        toast.success("Reward updated!");
      } else {
        await addDoc(collection(db, "rewards"), {
          title,
          description,
          pointsRequired,
          active: true,
          createdAt: new Date(),
          createdBy: currentUser.uid,
        });
        toast.success("Reward added!");
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving reward:", error);
      toast.error("Failed to save reward");
    }
  };

  const handleDeleteReward = async (rewardId: string) => {
    if (confirm("Delete this reward?")) {
      try {
        await deleteDoc(doc(db, "rewards", rewardId));
        toast.success("Reward deleted!");
      } catch (error) {
        console.error("Error deleting reward:", error);
        toast.error("Failed to delete reward");
      }
    }
  };

  const handleToggleActive = async (reward: Reward) => {
    try {
      await updateDoc(doc(db, "rewards", reward.id), {
        active: !reward.active
      });
      toast.success(`Reward ${!reward.active ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Error toggling reward:", error);
      toast.error("Failed to update reward");
    }
  };

  const resetForm = () => {
    setEditingReward(null);
    setTitle("");
    setDescription("");
    setPointsRequired(100);
  };

  const openEditDialog = (reward: Reward) => {
    setEditingReward(reward);
    setTitle(reward.title);
    setDescription(reward.description);
    setPointsRequired(reward.pointsRequired);
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
          <h1 className="text-2xl font-bold">Rewards Manager</h1>
          <p className="text-muted-foreground text-sm">Create and manage redeemable rewards</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0B0B45] hover:bg-[#1a1a5e]" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" /> Add Reward
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingReward ? "Edit Reward" : "New Reward"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., P100 Health Voucher" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the reward..." />
              </div>
              <div>
                <Label>Points Required</Label>
                <Input type="number" value={pointsRequired} onChange={(e) => setPointsRequired(Number(e.target.value))} min={1} />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button className="bg-[#0B0B45] hover:bg-[#1a1a5e]" onClick={handleSaveReward}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {rewards.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No rewards yet. Click "Add Reward" to start.</Card>
        ) : (
          rewards.map((reward) => (
            <Card key={reward.id} className={`p-5 ${!reward.active ? "bg-gray-50 opacity-60" : ""}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-[#0B0B45]" />
                    <h3 className="font-semibold text-lg">{reward.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                  <div className="flex gap-4 mt-3">
                    <span className="text-sm text-[#0B0B45] font-medium">{reward.pointsRequired} pts required</span>
                    <span className={`text-sm ${reward.active ? "text-green-500" : "text-gray-400"}`}>
                      {reward.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(reward)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleToggleActive(reward)}>
                    {reward.active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteReward(reward.id)}>
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