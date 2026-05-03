import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Gift, Star, Trophy, CheckCircle, Lock, Copy, X } from "lucide-react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, addDoc, onSnapshot } from "firebase/firestore";
import { toast, Toaster } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  available: boolean;
}

interface RedeemedReward {
  id: string;
  rewardId: string;
  rewardTitle: string;
  pointsSpent: number;
  redeemCode: string;
  status: "pending" | "claimed" | "expired";
  redeemedAt: Date;
}

const generateRedeemCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'RWD-';
  for (let i = 0; i < 3; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  code += '-';
  for (let i = 0; i < 3; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

export function TasksRewards() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserPoints(currentUser.uid);
      } else {
        window.location.href = "/resident/signin";
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // REAL-TIME: Tasks listener
  useEffect(() => {
    const tasksQuery = query(collection(db, "tasks"));
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const tasksList: Task[] = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        points: doc.data().points,
        completed: false,
      }));
      setTasks(tasksList);
    });
    return () => unsubscribe();
  }, []);

  // REAL-TIME: Rewards listener
  useEffect(() => {
    const rewardsQuery = query(collection(db, "rewards"));
    const unsubscribe = onSnapshot(rewardsQuery, (snapshot) => {
      const rewardsList: Reward[] = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        pointsRequired: doc.data().pointsRequired,
        available: true,
      }));
      setRewards(rewardsList);
    });
    return () => unsubscribe();
  }, []);

  // REAL-TIME: Completed tasks listener
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, "completed_tasks"), where("residentId", "==", user.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const completed = snapshot.docs.map(doc => doc.data().taskId);
      setCompletedTasks(completed);
      setTasks(prev => prev.map(task => ({ ...task, completed: completed.includes(task.id) })));
      
      // Recalculate points
      let totalPoints = 0;
      const logsQuery = query(collection(db, "health_logs"), where("userId", "==", user.uid));
      const logsSnapshot = await new Promise<any>((resolve) => {
        const unsub = onSnapshot(logsQuery, (snap) => {
          totalPoints = snap.size * 10;
          unsub();
          resolve(snap);
        });
      });
      
      const taskTotal = snapshot.docs.reduce((sum, doc) => sum + (doc.data().points || 0), 0);
      totalPoints += taskTotal;
      
      const redeemedQuery = query(collection(db, "Redeemed Rewards"), where("userId", "==", user.uid));
      const redeemedSnapshot = await new Promise<any>((resolve) => {
        const unsub = onSnapshot(redeemedQuery, (snap) => {
          const spent = snap.docs.reduce((sum, d) => sum + (d.data().pointsSpent || 0), 0);
          totalPoints -= spent;
          unsub();
          resolve(snap);
        });
      });
      
      setPoints(totalPoints);
    });
    
    return () => unsubscribe();
  }, [user]);

  // REAL-TIME: Redeemed rewards listener
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, "Redeemed Rewards"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const redeemed = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RedeemedReward));
      setRedeemedRewards(redeemed);
    });
    
    return () => unsubscribe();
  }, [user]);

  const loadUserPoints = async (uid: string) => {
    // Points are calculated in the real-time listener above
  };

  const completeTask = async (task: Task) => {
    if (!user || completedTasks.includes(task.id)) return;

    try {
      await addDoc(collection(db, "completed_tasks"), {
        residentId: user.uid,
        taskId: task.id,
        taskTitle: task.title,
        points: task.points,
        completedAt: new Date(),
        status: "pending"
      });
      
      await addDoc(collection(db, "notifications"), {
        type: "task_completed",
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Resident",
        message: `✅ ${user.displayName || user.email?.split('@')[0] || "Resident"} completed task: ${task.title}`,
        taskId: task.id,
        audience: "bhw",
        read: false,
        createdAt: new Date(),
      });
      
      toast.success(`🎉 +${task.points} points earned for completing "${task.title}"!`);
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const redeemReward = async (reward: Reward) => {
    if (!user) return;
    if (points < reward.pointsRequired) {
      toast.error(`Need ${reward.pointsRequired - points} more points to redeem this reward`);
      return;
    }
    const alreadyRedeemed = redeemedRewards.some(r => r.rewardId === reward.id && r.status === "pending");
    if (alreadyRedeemed) {
      toast.error("You already have a pending redemption for this reward. Please claim it first.");
      return;
    }
    const redeemCode = generateRedeemCode();

    try {
      await addDoc(collection(db, "Redeemed Rewards"), {
        userId: user.uid,
        rewardId: reward.id,
        rewardTitle: reward.title,
        pointsSpent: reward.pointsRequired,
        redeemCode: redeemCode,
        status: "pending",
        redeemedAt: new Date(),
      });
      
      await addDoc(collection(db, "notifications"), {
        type: "reward",
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Resident",
        message: `🎁 ${user.displayName || user.email?.split('@')[0] || "Resident"} redeemed ${reward.title} (Code: ${redeemCode})`,
        rewardId: reward.id,
        redeemCode: redeemCode,
        audience: "bhw",
        read: false,
        createdAt: new Date(),
      });
      
      setGeneratedCode(redeemCode);
      setSelectedReward(reward);
      setShowCodeModal(true);
    } catch (error) {
      console.error("Error redeeming reward:", error);
      toast.error("Failed to redeem reward. Please try again.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success("Code copied to clipboard!");
  };

  const nextTier = 500 - points;
  const progress = Math.min((points / 500) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks & rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Tasks & Rewards</h1>
        <p className="text-gray-500 text-sm mt-1">Complete tasks to earn points and redeem rewards</p>
      </div>

      {/* Points Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm mb-1">Your Balance</p>
            <p className="text-4xl font-bold">{points} pts</p>
            <p className="text-blue-100 text-xs mt-2">{nextTier} points to next tier</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <Trophy className="w-8 h-8" />
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-white/30 rounded-full h-2">
            <div className="bg-white rounded-full h-2" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </Card>

      {/* Available Tasks */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" /> Available Tasks
        </h2>
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <Card className="p-8 text-center text-gray-400">No tasks available yet. Check back later!</Card>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className={`p-4 ${task.completed ? "opacity-60 bg-gray-50" : "border border-gray-100"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{task.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                    <p className="text-xs text-green-600 mt-2">+{task.points} pts</p>
                  </div>
                  {task.completed ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <Button onClick={() => completeTask(task)} className="bg-green-600 hover:bg-green-700 text-white text-sm px-4">
                      Complete
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Redeem Rewards */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-500" /> Redeem Rewards
        </h2>
        <div className="grid gap-3">
          {rewards.length === 0 ? (
            <Card className="p-8 text-center text-gray-400">No rewards available yet. Check back later!</Card>
          ) : (
            rewards.map((reward) => {
              const isPending = redeemedRewards.some(r => r.rewardId === reward.id && r.status === "pending");
              const isRedeemed = redeemedRewards.some(r => r.rewardId === reward.id && r.status === "claimed");
              const canRedeem = points >= reward.pointsRequired && !isPending && !isRedeemed;
              return (
                <Card key={reward.id} className="p-4 border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{reward.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{reward.description}</p>
                      <p className="text-xs text-amber-600 mt-2">{reward.pointsRequired} pts required</p>
                    </div>
                    {isRedeemed ? (
                      <Badge className="bg-green-100 text-green-700">✓ Claimed</Badge>
                    ) : isPending ? (
                      <Badge className="bg-amber-100 text-amber-700">Pending Claim</Badge>
                    ) : canRedeem ? (
                      <Button onClick={() => redeemReward(reward)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4">
                        Redeem
                      </Button>
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Redeem Code Modal */}
      {showCodeModal && selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Reward Redeemed!</h3>
              <button onClick={() => setShowCodeModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="font-semibold text-gray-800 mb-2">{selectedReward.title}</p>
              <p className="text-sm text-gray-600 mb-4">Points deducted: -{selectedReward.pointsRequired} pts</p>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-4 border border-blue-200">
                <p className="text-xs text-blue-600 mb-2">YOUR REDEEM CODE</p>
                <p className="text-2xl font-mono font-bold tracking-wider text-blue-700">{generatedCode}</p>
              </div>
              <p className="text-xs text-gray-500 mb-4">Present this code to your BHW to claim your reward</p>
              <div className="flex gap-3">
                <Button onClick={copyToClipboard} variant="outline" className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50">
                  <Copy className="w-4 h-4 mr-2" /> Copy Code
                </Button>
                <Button onClick={() => setShowCodeModal(false)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  Done
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}