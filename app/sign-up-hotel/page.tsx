import HotelSignUpForm from "./sign-up-form";

export default function PartnershipSignUpPage() {
  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-4">Partnership Sign Up</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Join our partnership program to access exclusive benefits and grow your business with us.
      </p>
      <HotelSignUpForm />
    </div>
  );
}