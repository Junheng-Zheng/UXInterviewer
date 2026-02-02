"use client";

import Link from "next/link";
import Button from "../Components/Atoms/Button";
import { useState } from "react";
import { Award, Check, House, Tag } from "lucide-react";
const PlanCard = ({ name, price, features, isPro = false, isYearly = false, discount = null, monthlyEquivalent = null, priceId = null, freeTrial = null, onCheckout }) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!priceId || !onCheckout) return;
    
    setLoading(true);
    try {
      await onCheckout(priceId);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col flex-1 p-8 rounded-2xl border z-50 border-gray-200 bg-white gap-12`}
    >

    
      


      <div className="flex flex-col gap-4 ">
        <div className="flex items-center justify-between">
          <h3 className=" px-4 py-2  bg-gray-100 text-sm rounded-xl text-black">{name}</h3>
                      {isPro && isYearly && (
              <div className="px-3 py-2 rounded-xl text-sm  bg-blue-100 text-black flex items-center gap-2">
                <Award size={16} strokeWidth={1.3} />
                Popular
              </div>
            )}
        </div>
   <div className="flex gap-1 items-center">
          <div className="flex items-center gap-2">
            <span className="text-5xl font-serif text-black">{price}</span>
            {price !== "Free" && (
              <span >{isYearly ? "/month" : "/month"}</span>
            )}
          </div>
          {monthlyEquivalent && (
            <p className="text-xs text-gray-500">
              ($132 billed annually)
            </p>
          )}
        </div>
          <div className="flex items-center gap-2">
            {!isPro && (
              <span className="px-3 py-2 rounded-xl text-sm  bg-blue-100  text-black ">
                Free Forever
              </span>
            )}
            {discount && (
              <span className="px-3 py-2 rounded-xl text-sm  bg-pink-100 text-black flex items-center gap-2">
                <Tag size={16} strokeWidth={1.3} /> {discount}% off 
              </span>
            )}
                    {freeTrial && (
          <div className="">
            <span className="px-3 py-2 rounded-xl text-sm  bg-red-100 text-black ">
              {freeTrial}
            </span>
          </div>
        )}

          </div>

     
      </div>

      <div className="flex flex-col gap-3 flex-grow">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <Check size={16} strokeWidth={1.3} />
            <span className="text-sm text-gray-700">{feature}</span>
          </div>
        ))}
      </div>

      {priceId ? (
        <button 
        className={`w-full justify-center cursor-pointer flex items-center gap-2 text-xl font-serif px-4 py-3 rounded-xl ${isPro && isYearly ? "bg-black text-white" : "bg-gray-100"}`}
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? "Loading..." : (isPro ? "Get Started" : "Current Plan")}
        </button>
      ) : (
        <button
          className="w-full justify-center cursor-pointer flex items-center gap-2 text-xl font-serif px-4 py-3 rounded-xl bg-gray-100 "
        >
          {isPro ? "Get Started" : "Current Plan"}
        </button>
      )}
    </div>
  );
};

export default function PlansPage() {
  const freeFeatures = [
    "3 interviews per day",
    "Basic feedback and grading",
    "Access to standard challenges",
    "Interview history tracking",
    "Basic analytics",
  ];

  const proFeatures = [
    "Everything in Free",
    "Unlimited interviews",
    "Advanced AI feedback and grading",
    "Detailed interview analytics",
    "Priority support",
  ];

  const handleCheckout = async (priceId) => {
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          metadata: {
            // Add any additional metadata you want
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  };

  return (

    <div className="h-dvh z-200 b bg-[#F9F9F9] flex flex-col gap-0">
     <div className="absolute top-0 left-0   w-full h-full z-2 bg-[radial-gradient(circle,rgba(156,163,175,0.2)_1px,transparent_1px)] pointer-events-none" style={{ backgroundSize: '16px 16px' }}/>
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex px-12 border-b border-gray-200 w-full py-6 items-center gap-2 text-gray-600 hover:text-gray-900  transition-colors duration-200"
        >
          <House size={20} strokeWidth={1.3} /> Back
        </Link>

        {/* Header */}
<div className = "flex flex-col gap-8 px-12   justify-center w-full  min-h-0 h-full ">
          <div className="flex flex-col w-fit gap-2">
          <h1 className="text-[32px] font-serif   text-black ">Pricing</h1>
          <p className="w-2/3  text-gray-600">
           Select the plan that best fits your interview practice needs
          </p>
        </div>

        {/* Plans */}
        <div className="flex flex-row gap-4 ">
          <PlanCard
            name="Free"
            price="Free"
            features={freeFeatures}
            isPro={false}
          />
          <PlanCard
            name="Pro Yearly"
            price="$11"
            features={proFeatures}
            isPro={true}
            isYearly={true}
            discount="15"
            monthlyEquivalent="11"
            priceId={process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || "price_xxxxx"}
            freeTrial="30 days free trial"
            onCheckout={handleCheckout}
          />
          <PlanCard
            name="Pro"
            price="$13"
            features={proFeatures}
            isPro={true}
            priceId={process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || "price_xxxxx"}
            freeTrial="30 days free trial"
            onCheckout={handleCheckout}
          />
        </div>
</div>
      </div>
  );
}


