import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = 'force-dynamic';

const getSettingsUrl = () => absoluteUrl("/settings");
const getAmount = () => parseInt(process.env.NEXT_PUBLIC_STRIPE_UNIT_AMOUNT || "0", 10);
const getTrialDays = () => parseInt(process.env.NEXT_PUBLIC_TRIAL_DAYS || "0", 10);

export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userSubscription = await prismadb.userSubscription.findUnique({
      where: {
        userId
      }
    })

    if (userSubscription && userSubscription.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userSubscription.stripeCustomerId,
        return_url: getSettingsUrl(),
      })

      return new NextResponse(JSON.stringify({ url: stripeSession.url }))
    }

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: getSettingsUrl(),
      cancel_url: getSettingsUrl(),
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: user.emailAddresses[0].emailAddress,
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: {
              name: "Companion Pro",
              description: "Create Custom AI Companions"
            },
            unit_amount: getAmount(),
            recurring: {
              interval: "month",
            }
          },
          quantity: 1,
        },
      ],
      subscription_data:{
        trial_period_days: getTrialDays(),
      },
      metadata: {
        userId,
      },
    })

    return new NextResponse(JSON.stringify({ url: stripeSession.url }))
  } catch (error) {
    console.log("[STRIPE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
};
