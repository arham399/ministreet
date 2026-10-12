import { redirect } from "next/navigation";

export const metadata = { title: "Wishlist" };

export default async function AccountWishlistPage() {
  redirect("/wishlist");
}
