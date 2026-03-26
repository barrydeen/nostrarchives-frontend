import { notFound } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";

interface ProfilePageProps {
  params: Promise<{ pubkey: string }>;
}

function isHex(input: string) {
  return /^[0-9a-f]{64}$/i.test(input);
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { pubkey } = await params;

  if (!isHex(pubkey)) {
    notFound();
  }

  return <ProfileHeader pubkey={pubkey} />;
}
