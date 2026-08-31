"use client";

import { useEffect, useState } from "react";
import {
  User, MoreVertical, Eye, Edit2, Trash2, LogIn,
  Activity, LayoutTemplate, Settings, Flag,
  Loader2, Plus, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ─── Types ──────────────────────────────────────────────────── */
type UserRow = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  plan: string | null;
  credits_remaining: number;
  subscription_status: string | null;
};

type UserDetails = UserRow & {
  sessions_count: number;
  generations_count: number;
  credits_total: number;
};

/* ─── Helpers ─────────────────────────────────────────────────── */
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function planBadge(plan: string | null) {
  if (plan === "pro")
    return { label: "Pro", cls: "bg-primary/10 text-primary border-primary/20" };
  if (plan === "growth")
    return { label: "Growth", cls: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" };
  if (plan === "starter")
    return { label: "Starter", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
  return { label: "Free", cls: "bg-muted text-muted-foreground border-border" };
}

/* ─── Component ───────────────────────────────────────────────── */
export default function AdminUsersDashboard() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  /* --- Create -------------------------------------------------- */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [creating, setCreating] = useState(false);

  /* --- View ---------------------------------------------------- */
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewUser, setViewUser] = useState<UserDetails | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  /* --- Edit ---------------------------------------------------- */
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", plan: "free", credits_total: 500 });
  const [editing, setEditing] = useState(false);

  /* ── fetch list ─────────────────────────────────────────────── */
  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setLoading(false);
    }
  };

  /* ── View ────────────────────────────────────────────────────── */
  const openView = async (user: UserRow) => {
    setIsViewOpen(true);
    setViewUser(null);
    setViewLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setViewUser(data.user);
      } else {
        toast.error(data.error || "Could not load user details");
        // Fallback — show what we already have
        setViewUser({
          ...user,
          sessions_count: 0,
          generations_count: 0,
          credits_total: user.credits_remaining,
        });
      }
    } catch {
      setViewUser({
        ...user,
        sessions_count: 0,
        generations_count: 0,
        credits_total: user.credits_remaining,
      });
    } finally {
      setViewLoading(false);
    }
  };

  /* ── Edit ────────────────────────────────────────────────────── */
  const openEdit = (user: UserRow) => {
    setEditTarget(user);
    setEditForm({ 
      name: user.name ?? "", 
      plan: user.plan ?? "free",
      credits_total: user.credits_remaining ?? 0,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/admin/users/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");
      toast.success("User updated");
      setIsEditOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setEditing(false);
    }
  };

  /* ── Create ──────────────────────────────────────────────────── */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      toast.success("User created successfully");
      setIsCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "user" });
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  /* ── Delete ──────────────────────────────────────────────────── */
  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this user? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      toast.success("User deleted");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  /* ── Login as user ───────────────────────────────────────────── */
  const handleLoginAsUser = async (email: string) => {
    const tid = toast.loading("Switching to user account…");
    try {
      const res = await fetch("/api/admin/users/login-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get login token");

      if (data.token) {
        const supabase = createClient();
        const { error } = await supabase.auth.verifyOtp({
          token_hash: data.token,
          type: "magiclink",
        });
        if (error) throw error;
        toast.dismiss(tid);
        toast.success("Logged in as user");
        window.location.href = "/";
      }
    } catch (err: unknown) {
      toast.dismiss(tid);
      toast.error(err instanceof Error ? err.message : "Login failed");
    }
  };

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">

      {/* Header */}
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Users</h1>
            <p className="text-sm text-muted-foreground">{users.length} registered account{users.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create User
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Loading users…</span>
        </div>
      ) : users.length === 0 ? (
        <div className="border border-border rounded-xl p-16 text-center bg-card shadow-sm">
          <User className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground">No users found</h3>
          <p className="text-muted-foreground mt-2">Get started by creating your first user.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-muted border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Name / Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Plan & Credits</th>
                <th className="px-6 py-4">Quick actions</th>
                <th className="px-6 py-4 text-right">More</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                const badge = planBadge(user.plan);
                const isActive = user.subscription_status === "active";
                return (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    {/* Name / email */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-sm shrink-0 border border-primary/20">
                          {(user.name?.[0] || user.email?.[0] || "?").toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{user.name || "Unnamed User"}</p>
                          <p className="text-muted-foreground text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                          Subscribed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Plan / Credits */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}>
                          {badge.label}
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                          {user.credits_remaining} credits
                        </span>
                      </div>
                    </td>

                    {/* Quick-action icon buttons */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          title="View user details & stats"
                          onClick={() => openView(user)}
                          className="p-1.5 rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        <button
                          title="Edit user settings"
                          onClick={() => openEdit(user)}
                          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          title="Login as this user"
                          onClick={() => handleLoginAsUser(user.email)}
                          className="p-1.5 rounded-md text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* Dropdown */}
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                            className="h-8 w-8 p-0 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-5 w-5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 bg-card border border-border shadow-lg rounded-xl">
                          <DropdownMenuItem
                            onClick={() => openView(user)}
                            className="cursor-pointer px-3 py-2"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEdit(user)}
                            className="cursor-pointer px-3 py-2"
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleLoginAsUser(user.email)}
                            className="cursor-pointer px-3 py-2"
                          >
                            <LogIn className="mr-2 h-4 w-4" />
                            Login As
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(user.id)}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer px-3 py-2 focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ VIEW MODAL ══════════════════════════════════════════ */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-lg bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">User Details</DialogTitle>
          </DialogHeader>

          {viewLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : viewUser ? (
            <div className="space-y-5 py-1">

              {/* Profile header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-xl shadow-sm shrink-0">
                  {(viewUser.name?.[0] || viewUser.email?.[0] || "?").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground text-lg leading-tight truncate">
                    {viewUser.name || "Unnamed User"}
                  </p>
                  <p className="text-muted-foreground text-sm truncate">{viewUser.email}</p>
                  <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${planBadge(viewUser.plan).cls}`}>
                    {planBadge(viewUser.plan).label}
                  </span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Briefs (Sessions)", value: viewUser.sessions_count, icon: LayoutTemplate },
                  { label: "Prompts", value: viewUser.generations_count, icon: Sparkles },
                  { label: "Credits Left", value: viewUser.credits_remaining, icon: Activity },
                  { label: "Credits Total", value: viewUser.credits_total, icon: Activity },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-muted/50 rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                    </div>
                    <p className="text-2xl font-black text-foreground tabular-nums">{value}</p>
                  </div>
                ))}
              </div>

              {/* Meta */}
              <div className="border-t border-border pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono border border-border">
                    {viewUser.id.slice(0, 18)}…
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="font-medium text-foreground">{fmtDate(viewUser.created_at)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setIsViewOpen(false); openEdit(viewUser); }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit User
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => { setIsViewOpen(false); handleLoginAsUser(viewUser.email); }}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login As
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ══ EDIT MODAL ══════════════════════════════════════════ */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Edit User
              {editTarget && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">— {editTarget.email}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                placeholder="John Doe"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-plan">Plan</Label>
                <select
                  id="edit-plan"
                  value={editForm.plan}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-credits">Total Credits (Limit)</Label>
                <Input
                  id="edit-credits"
                  type="number"
                  min="0"
                  value={editForm.credits_total}
                  onChange={(e) => setEditForm({ ...editForm, credits_total: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editing}
                className="min-w-[110px]"
              >
                {editing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                ) : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══ CREATE MODAL ════════════════════════════════════════ */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Create New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Full Name</Label>
              <Input
                id="create-name"
                placeholder="John Doe"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email Address <span className="text-destructive">*</span></Label>
              <Input
                id="create-email"
                type="email"
                required
                placeholder="john@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                placeholder="Leave blank to auto-generate"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                If left blank, a secure password is auto-generated and the user can set their own via magic link.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role (Plan)</Label>
              <select
                id="create-role"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="user">User (Free)</option>
                <option value="admin">Admin (Pro)</option>
              </select>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="min-w-[120px]"
              >
                {creating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</>
                ) : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
