"use client";

import Link from "next/link";
import Button from "../Components/Atoms/Button";

const PlanCard = ({ name, price, features, isPro = false, isYearly = false, discount = null, monthlyEquivalent = null, checkoutUrl = null, freeTrial = null }) => {
  return (
    
    <div
      className={`flex flex-col flex-1 p-8 rounded-2xl border ${
        isPro
          ? "border-orange-500 bg-gradient-to-br from-orange-50 to-white shadow-lg shadow-orange-200"
          : "border-gray-200 bg-white shadow-md shadow-gray-200"
      }`}
    >
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-black">{name}</h3>
          <div className="flex items-center gap-2">
            {discount && (
              <span className="px-3 py-1 text-xs font-semibold bg-green-500 text-white rounded-full">
                {discount}% OFF
              </span>
            )}
            {isPro && isYearly && (
              <span className="px-3 py-1 text-xs font-semibold bg-orange-500 text-white rounded-full">
                POPULAR
              </span>
            )}
          </div>
        </div>
        {freeTrial && (
          <div className="mb-2">
            <span className="px-3 py-1 text-xs font-semibold bg-blue-500 text-white rounded-full">
              {freeTrial}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-black">{price}</span>
            {price !== "Free" && (
              <span className="text-sm text-gray-500">{isYearly ? "/month" : "/month"}</span>
            )}
          </div>
          {monthlyEquivalent && (
            <p className="text-sm text-gray-500">
              $132 billed annually
            </p>
          )}
        </div>
      </div>

      <ul className="flex flex-col gap-3 mb-8 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <i
              className={`fa-solid ${
                isPro ? "fa-check text-orange-500" : "fa-check text-gray-400"
              } mt-1`}
            />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {checkoutUrl ? (
        <Link href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="mt-auto">
          <Button
            variant={isPro ? "primary" : "secondary"}
            className="w-full justify-center"
          >
            {isPro ? "Get Started" : "Current Plan"}
          </Button>
        </Link>
      ) : (
        <Button
          variant={isPro ? "primary" : "secondary"}
          className="w-full justify-center mt-auto"
        >
          {isPro ? "Get Started" : "Current Plan"}
        </Button>
      )}
    </div>
  );
};

export default function PlansPage() {
  const freeFeatures = [
    "5 interviews per month",
    "Basic feedback and grading",
    "Access to standard challenges",
    "Interview history tracking",
    "Basic analytics",
  ];

  const proFeatures = [
    "Unlimited interviews",
    "Advanced AI feedback and grading",
    "Access to all premium challenges",
    "Detailed interview analytics",
    "Priority support",
    "Export interview results",
    "Custom interview settings",
    "Advanced whiteboard features",
  ];

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors duration-200"
        >
          <i className="fa-solid fa-arrow-left" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">Choose Your Plan</h1>
          <p className="text-lg text-gray-600">
            Select the plan that best fits your interview practice needs
          </p>
        </div>

        {/* Plans */}
        <div className="flex flex-row gap-8 items-stretch">
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
            checkoutUrl="https://buy.stripe.com/test_7sY7sK9eo4Ay23h5yi8Ra02"
            freeTrial="30 days free trial"
          />
          <PlanCard
            name="Pro"
            price="$13"
            features={proFeatures}
            isPro={true}
            checkoutUrl="https://buy.stripe.com/test_5kQ3cueyI2sqfU7bWG8Ra00"
            freeTrial="30 days free trial"
          />
        </div>
      </div>
    </div>
  );
}
