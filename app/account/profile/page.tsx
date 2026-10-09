import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-3xl font-semibold mb-6">Profile</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <Input name="name" defaultValue={session.user.name || ""} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <Input name="email" defaultValue={session.user.email} disabled />
        </div>
        <Button type="submit">Save changes</Button>
      </form>
    </div>
  );
}
