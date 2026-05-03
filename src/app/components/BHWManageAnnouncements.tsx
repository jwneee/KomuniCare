import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, X, Calendar, Image as ImageIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { db, storage, auth } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  type: "health_advisory" | "event" | "vaccination" | "general";
  date: Date;
  createdAt: any;
  createdBy: string;
  createdByName: string;
  active: boolean;
}

const typeColors = {
  health_advisory: { bg: "bg-blue-100", text: "text-blue-700", label: "Health Advisory" },
  event: { bg: "bg-green-100", text: "text-green-700", label: "Event" },
  vaccination: { bg: "bg-purple-100", text: "text-purple-700", label: "Vaccination" },
  general: { bg: "bg-gray-100", text: "text-gray-700", label: "General" },
};

export function BHWManageAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "general" as Announcement["type"],
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const announcementsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || new Date(doc.data().date),
      } as Announcement));
      setAnnouncements(announcementsList);
    } catch (error) {
      console.error("Error loading announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const filename = `announcements/${timestamp}_${file.name}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const deleteImage = async (imageUrl: string) => {
    if (!imageUrl) return;
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Please fill in title and content");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Please sign in");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = editingAnnouncement?.imageUrl || "";
      
      if (imageFile) {
        if (editingAnnouncement?.imageUrl) {
          await deleteImage(editingAnnouncement.imageUrl);
        }
        imageUrl = await uploadImage(imageFile);
      }

      const announcementData = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        date: new Date(formData.date),
        imageUrl: imageUrl,
        updatedAt: new Date(),
      };

      if (editingAnnouncement) {
        await updateDoc(doc(db, "announcements", editingAnnouncement.id), announcementData);
        toast.success("Announcement updated!");
      } else {
        await addDoc(collection(db, "announcements"), {
          ...announcementData,
          createdAt: new Date(),
          createdBy: currentUser.uid,
          createdByName: currentUser.displayName || "BHW",
          active: true,
        });
        toast.success("Announcement added!");
      }

      setDialogOpen(false);
      resetForm();
      loadAnnouncements();
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast.error("Failed to save announcement");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (announcement: Announcement) => {
    if (confirm("Delete this announcement?")) {
      try {
        if (announcement.imageUrl) {
          await deleteImage(announcement.imageUrl);
        }
        await deleteDoc(doc(db, "announcements", announcement.id));
        toast.success("Announcement deleted!");
        loadAnnouncements();
      } catch (error) {
        console.error("Error deleting announcement:", error);
        toast.error("Failed to delete announcement");
      }
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      await updateDoc(doc(db, "announcements", announcement.id), {
        active: !announcement.active
      });
      toast.success(`Announcement ${!announcement.active ? "published" : "unpublished"}`);
      loadAnnouncements();
    } catch (error) {
      console.error("Error toggling announcement:", error);
      toast.error("Failed to update announcement");
    }
  };

  const resetForm = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: "",
      content: "",
      type: "general",
      date: new Date().toISOString().split('T')[0],
    });
    setImageFile(null);
    setImagePreview("");
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      date: announcement.date instanceof Date 
        ? announcement.date.toISOString().split('T')[0]
        : new Date(announcement.date).toISOString().split('T')[0],
    });
    setImagePreview(announcement.imageUrl || "");
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
          <h1 className="text-2xl font-bold">Manage Announcements</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage news & announcements for residents</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0B0B45] hover:bg-[#1a1a5e]" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" /> New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAnnouncement ? "Edit Announcement" : "New Announcement"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Free Flu Vaccination"
                />
              </div>

              <div>
                <Label>Content / Description</Label>
                <Textarea 
                  value={formData.content} 
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  placeholder="Detailed information about this announcement..."
                />
              </div>

              <div>
                <Label>Category / Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health_advisory">Health Advisory</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="vaccination">Vaccination</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Event Date</Label>
                <Input 
                  type="date" 
                  value={formData.date} 
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div>
                <Label>Image (optional)</Label>
                {imagePreview ? (
                  <div className="relative mt-2">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border" />
                    <button 
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(""); }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 mt-2">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload image</p>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }} />
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button className="bg-[#0B0B45] hover:bg-[#1a1a5e]" onClick={handleSave} disabled={uploading}>
                  {uploading ? "Saving..." : editingAnnouncement ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No announcements yet. Click "New Announcement" to start.
          </Card>
        ) : (
          announcements.map((announcement) => {
            const typeStyle = typeColors[announcement.type] || typeColors.general;
            return (
              <Card key={announcement.id} className={`p-5 ${!announcement.active ? "opacity-60 bg-gray-50" : ""}`}>
                <div className="flex gap-4">
                  {announcement.imageUrl && (
                    <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                      <img src={announcement.imageUrl} alt={announcement.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{announcement.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                            {typeStyle.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(announcement.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggleActive(announcement)}>
                          {announcement.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(announcement)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(announcement)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{announcement.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Posted by {announcement.createdByName} • {new Date(announcement.createdAt?.toDate?.() || announcement.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}