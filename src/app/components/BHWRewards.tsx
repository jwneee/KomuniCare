import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Gift, CheckCircle, Search, X } from "lucide-react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { toast, Toaster } from "sonner";

interface RedeemedReward {
  id: string;
  userId: string;
  rewardId: string;
  rewardTitle: string;
  pointsSpent: number;
  redeemCode: string;
  status: "pending" | "claimed" | "expired";
  redeemedAt: any;
}

interface Resident {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export function BHWRewards() {
  const [rewards, setRewards] = useState<RedeemedReward[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState("");
  const [selectedReward, setSelectedReward] = useState<RedeemedReward | null>(null);

  // REAL-TIME: Residents listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "residents"), (snapshot) => {
      const residentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resident));
      setResidents(residentsList);
    });
    return () => unsubscribe();
  }, []);

  // REAL-TIME: Redeemed rewards listener
  useEffect(() => {
    const q = query(collection(db, "Redeemed Rewards"), orderBy("redeemedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rewardsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RedeemedReward));
      setRewards(rewardsList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateRewardStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "Redeemed Rewards", id), { status });
      toast.success(`Reward ${status === "claimed" ? "claimed" : "updated"}!`);
      setSelectedReward(null);
      setVerifyCode("");
    } catch (error) {
      console.error("Error updating reward:", error);
      toast.error("Failed to update reward");
    }
  };

  const verifyRewardByCode = async () => {
    if (!verifyCode) {
      toast.error("Please enter a redeem code");
      return;
    }

    const reward = rewards.find(r => r.redeemCode === verifyCode && r.status === "pending");
    if (reward) {
      setSelectedReward(reward);
      toast.success(`Found reward: ${reward.rewardTitle}`);
    } else {
      toast.error("Invalid or already claimed code");
      setSelectedReward(null);
    }
  };

  const pendingRewards = rewards.filter(r => r.status === "pending");
  const claimedRewards = rewards.filter(r => r.status === "claimed");

  const getResidentName = (userId: string) => {
    const resident = residents.find(r => r.id === userId);
    return resident?.name || "Unknown Resident";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0B0B45] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      <div>
        <h1 className="text-2xl font-bold">Rewards Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Verify and manage resident reward redemptions</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <Gift className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{rewards.length}</p>
          <p className="text-xs text-muted-foreground">Total Redeemed</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-6 h-6 bg-yellow-500 rounded-full mx-auto mb-2"></div>
          <p className="text-2xl font-bold text-yellow-600">{pendingRewards.length}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">{claimedRewards.length}</p>
          <p className="text-xs text-muted-foreground">Claimed</p>
        </Card>
      </div>

      <Card className="p-6 shadow-md rounded-xl">
        <h3 className="text-lg font-semibold mb-4">Verify Redeem Code</h3>
        <div className="flex gap-3">
          <Input 
            placeholder="Enter redeem code (e.g., RWD-ABC-123)" 
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
            className="font-mono flex-1"
          />
          <Button onClick={verifyRewardByCode} className="bg-green-600 hover:bg-green-700">
            <Search className="w-4 h-4 mr-2" /> Verify
          </Button>
        </div>

        {selectedReward && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-800">{selectedReward.rewardTitle}</h4>
                <p className="text-sm text-gray-600">Resident: {getResidentName(selectedReward.userId)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Redeemed on: {new Date(selectedReward.redeemedAt?.toDate?.() || selectedReward.redeemedAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  Code: <span className="font-mono font-bold">{selectedReward.redeemCode}</span>
                </p>
              </div>
              <Button 
                onClick={() => updateRewardStatus(selectedReward.id, "claimed")}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Claim Reward
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 shadow-md rounded-xl">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-yellow-500" />
          Pending Rewards ({pendingRewards.length})
        </h3>
        <div className="space-y-3">
          {pendingRewards.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending rewards</p>
          ) : (
            pendingRewards.map((reward) => (
              <div key={reward.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-800">{reward.rewardTitle}</h4>
                  <p className="text-sm text-gray-600">Resident: {getResidentName(reward.userId)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Code: <span className="font-mono font-bold">{reward.redeemCode}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Redeemed: {new Date(reward.redeemedAt?.toDate?.() || reward.redeemedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button 
                  onClick={() => updateRewardStatus(reward.id, "claimed")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Claim
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6 shadow-md rounded-xl">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Claimed Rewards History
        </h3>
        <div className="space-y-2">
          {claimedRewards.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No claimed rewards yet</p>
          ) : (
            claimedRewards.map((reward) => (
              <div key={reward.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{reward.rewardTitle}</p>
                  <p className="text-xs text-gray-500">Resident: {getResidentName(reward.userId)}</p>
                  <p className="text-xs text-gray-500">
                    Claimed on: {new Date(reward.redeemedAt?.toDate?.() || reward.redeemedAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-700">Claimed</Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}