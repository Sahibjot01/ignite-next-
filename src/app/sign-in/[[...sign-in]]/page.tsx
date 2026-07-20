import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <SignIn appearance={{ variables: { colorPrimary: '#ff7676' } }} />
    </div>
  );
}
