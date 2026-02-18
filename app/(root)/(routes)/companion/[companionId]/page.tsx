import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";

import { CompanionForm } from "./components/companion-form";

interface CompanionIdPageProps {
  params: Promise<{
    companionId: string;
  }>;
};

const CompanionIdPage = async ({
  params
}: CompanionIdPageProps) => {
  const { userId } = await auth();
  const { companionId } = await params;

  if (!userId) {
    return redirect("/sign-in");
  }

  const validSubscription = await checkSubscription();

  if (!validSubscription) {
    return redirect("/");
  }

  const companion = await prismadb.companion.findUnique({
    where: {
      id: companionId,
      userId,
    }
  });

  const categories = await prismadb.category.findMany();

  return (
    <CompanionForm initialData={companion} categories={categories} />
  );
}

export default CompanionIdPage;
