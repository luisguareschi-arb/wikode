"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UserItem {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "USER";
  createdAt: string;
}

export function UserTable() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setError(null);
    const response = await fetch("/api/users");
    const data = (await response.json()) as { users?: UserItem[]; error?: string };
    if (!response.ok) {
      setError(data.error ?? "Failed to load users.");
      setLoading(false);
      return;
    }
    setUsers(data.users ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const changeRole = async (userId: string, role: "ADMIN" | "USER") => {
    setUpdatingId(userId);
    setError(null);
    const response = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Failed to update role.");
      setUpdatingId(null);
      return;
    }
    await loadUsers();
    setUpdatingId(null);
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading users...</p>;
  }

  return (
    <div className="rounded-md border bg-white">
      {error ? <p className="border-b bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <table className="w-full text-sm">
        <thead className="border-b bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-600">User</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Role</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Joined</th>
            <th className="px-4 py-2 text-right font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b last:border-b-0">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{user.name ?? "Unnamed user"}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </td>
              <td className="px-4 py-3">
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
              </td>
              <td className="px-4 py-3 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-right">
                {user.role === "ADMIN" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updatingId === user.id}
                    onClick={() => void changeRole(user.id, "USER")}
                  >
                    Make USER
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={updatingId === user.id}
                    onClick={() => void changeRole(user.id, "ADMIN")}
                  >
                    Make ADMIN
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
