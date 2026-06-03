import { UserTable } from "@/components/admin/UserTable";

export default function UsersPage() {
  return (
    <div className="max-w-5xl p-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Users</h1>
      <p className="mb-6 text-sm text-gray-500">
        Manage roles for users who can access Wikode.
      </p>
      <UserTable />
    </div>
  );
}
